import fs from 'fs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './src/server/db';
import { apiRouter } from './src/server/api';
import { initTursoSync } from './src/server/turso';
import { cloudRouter } from './src/server/cloudRoutes';

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

  // In development, hook into Vite middlewares; in production, serve dist
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
   const distPath = path.resolve(__dirname, 'dist');

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(distPath, 'robots.txt'));
});

app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
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
