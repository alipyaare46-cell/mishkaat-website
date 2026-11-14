import fs from 'fs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, db } from './src/server/db';
import { apiRouter } from './src/server/api';
import { initTursoSync } from './src/server/turso';
import { cloudRouter } from './src/server/cloudRoutes';
import { generateSitemapXml } from './src/server/sitemap';
import { injectSeoIntoHtml } from './src/server/seo';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize persistent SQLite database & seed default data
  try {
    initDatabase();
    console.log('Database initialized successfully with scholars, categories & settings.');
    // Connect & synchronize with Turso Cloud for permanent zero-data-loss storage
    initTursoSync().catch((err) => console.error('Turso sync warning:', err));
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ extended: true, limit: '500mb' }));

  // Explicit no-cache handler for PWA Service Worker & Manifest to guarantee instant auto-updates
  app.get('/sw.js', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Content-Type', 'application/javascript');
    const swPath = path.resolve(process.cwd(), 'public/sw.js');
    if (fs.existsSync(swPath)) {
      res.sendFile(swPath);
    } else {
      res.status(404).end();
    }
  });

  app.get(['/manifest.json', '/manifest.webmanifest'], (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.resolve(process.cwd(), 'public/manifest.json'));
  });

  // Static directory for uploaded media, audio, video, books, images
  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), 'uploads'), {
      setHeaders: (res, filePath) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Accept-Ranges', 'bytes');
        if (filePath.endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline');
        }
      }
    })
  );

  // Mount API routes
  app.use('/api', apiRouter);
  app.use('/api/cloud', cloudRouter);

  // Lightweight health endpoint (useful for uptime pings so Render free tier stays awake)
  app.get('/health', (_req, res) => {
    res.status(200).setHeader('Cache-Control', 'no-store').json({ ok: true, status: 'up' });
  });

  // Dynamic XML Sitemap Handler
  const sitemapHandler = (_req: express.Request, res: express.Response) => {
    try {
      const xml = generateSitemapXml();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, must-revalidate');
      res.send(xml);
    } catch (err: any) {
      console.error('Error generating dynamic sitemap:', err);
      res.status(500).type('text/plain').send('Error generating dynamic sitemap');
    }
  };

  // Explicit /robots.txt Handler (always HTTP 200, text/plain; charset=utf-8, never blocked)
  const isDev = process.env.NODE_ENV !== 'production';
  const DEFAULT_ROBOTS_TXT = [
    'User-agent: *',
    'Allow: /',
    '',
    'Sitemap: https://mishkaat-website-1.onrender.com/sitemap.xml',
    ''
  ].join('\n');

  const robotsHandler = (_req: express.Request, res: express.Response) => {
    const candidates = isDev
      ? [
          path.resolve(process.cwd(), 'public/robots.txt'),
          path.resolve(__dirname, 'dist/robots.txt')
        ]
      : [
          path.resolve(__dirname, 'dist/robots.txt'),
          path.resolve(process.cwd(), 'public/robots.txt')
        ];

    let content = DEFAULT_ROBOTS_TXT;
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          const fileText = fs.readFileSync(candidate, 'utf-8');
          if (fileText.trim().length > 0) {
            content = fileText;
            break;
          }
        }
      } catch {
        // Fallback to next candidate or DEFAULT_ROBOTS_TXT
      }
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.removeHeader('X-Robots-Tag');
    res.send(content);
  };

  // Register crawler endpoints before Vite, express.static, and SPA catch-all
  app.get('/robots.txt', robotsHandler);
  app.get('/sitemap.xml', sitemapHandler);

  // In development, hook into Vite middlewares; in production, serve dist
  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      if (
        req.path.startsWith('/api/') ||
        req.path.startsWith('/uploads/') ||
        (/\.[a-z0-9]{1,8}$/i.test(req.path) && !req.path.endsWith('.html'))
      ) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        const rawTemplate = fs.readFileSync(indexPath, 'utf-8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
        const html = injectSeoIntoHtml(transformed, req.path);
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const distIndexPath = path.resolve(distPath, 'index.html');
    let cachedDistHtml: string | null = null;

    app.use(express.static(distPath, { index: false }));

    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api/') ||
        req.path.startsWith('/uploads/') ||
        (/\.[a-z0-9]{1,8}$/i.test(req.path) && !req.path.endsWith('.html'))
      ) {
        return next();
      }
      try {
        if (!cachedDistHtml) {
          cachedDistHtml = fs.readFileSync(distIndexPath, 'utf-8');
        }
        const html = injectSeoIntoHtml(cachedDistHtml, req.path);
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(html);
      } catch (err) {
        console.error('Error injecting SEO HTML:', err);
        res.sendFile(distIndexPath);
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`MISHKAAT platform live at http://0.0.0.0:${PORT}`);
  });

  // Cloud Run recommended timeouts to prevent ECONNRESET on long multi-chunk uploads
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.requestTimeout = 300000; // 5 minutes
}

startServer();
