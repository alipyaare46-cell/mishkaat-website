import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, generateId } from './db';
import { syncRecordToTurso, syncDeleteFromTurso, syncDeleteWhereFromTurso } from './turso';

export const apiRouter = Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) {
      const mime = (file.mimetype || '').toLowerCase();
      if (mime.includes('mp4')) ext = '.mp4';
      else if (mime.includes('webm')) ext = '.webm';
      else if (mime.includes('quicktime') || mime.includes('mov')) ext = '.mov';
      else if (mime.includes('video')) ext = '.mp4';
      else if (mime.includes('audio') || mime.includes('mpeg')) ext = '.mp3';
      else if (mime.includes('png')) ext = '.png';
      else if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
      else if (mime.includes('webp')) ext = '.webp';
      else if (mime.includes('pdf')) ext = '.pdf';
      else ext = '.bin';
    }
    const safeName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 * 1024 }, // 4GB max limit to allow full HD long lectures and high-res reels
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    const allowedExts = new Set([
      '.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif',
      '.mp3', '.m4a', '.wav', '.aac', '.flac', '.ogg',
      '.mp4', '.webm', '.mov', '.m4v', '.mkv', '.avi', '.3gp', '.ts',
      '.pdf'
    ]);

    const isAllowedExt = ext ? allowedExts.has(ext) : false;
    const isAllowedMime =
      mime.startsWith('video/') ||
      mime.startsWith('audio/') ||
      mime.startsWith('image/') ||
      mime.includes('pdf') ||
      mime === 'application/pdf' ||
      mime === 'application/octet-stream' ||
      mime === 'binary/octet-stream';

    if (isAllowedExt || isAllowedMime) {
      cb(null, true);
    } else {
      cb(new Error(`File format "${ext || mime}" is not supported. Please upload MP4, WebM, MOV, MP3, or image/pdf files.`));
    }
  }
});

// Chunks directory for multi-GB slice uploads (avoids Cloud Run request payload limits)
const CHUNKS_DIR = path.resolve(UPLOADS_DIR, 'chunks');
if (!fs.existsSync(CHUNKS_DIR)) {
  fs.mkdirSync(CHUNKS_DIR, { recursive: true });
}

// Helper to automatically extract authentic YouTube video thumbnails
export function extractYouTubeThumbnail(url: string | null | undefined): string | null {
  if (!url) return null;
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split(/[?#&]/)[0];
  } else if (url.includes('youtube.com/shorts/')) {
    videoId = url.split('youtube.com/shorts/')[1].split(/[?#&]/)[0];
  } else if (url.includes('v=')) {
    videoId = url.split('v=')[1].split('&')[0];
  } else if (url.includes('embed/')) {
    videoId = url.split('embed/')[1].split(/[?#&]/)[0];
  } else if (url.includes('live/')) {
    videoId = url.split('live/')[1].split(/[?#&]/)[0];
  }
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

const chunkStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const rawUploadId = req.query?.uploadId || req.body?.uploadId || 'temp_upload';
    const uploadId = String(rawUploadId).replace(/[^a-zA-Z0-9_-]/g, '');
    const dir = path.join(CHUNKS_DIR, uploadId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, _file, cb) => {
    const rawChunkIndex = req.query?.chunkIndex !== undefined ? req.query.chunkIndex : (req.body?.chunkIndex !== undefined ? req.body.chunkIndex : '0');
    const chunkIndex = String(rawChunkIndex).replace(/[^0-9]/g, '');
    cb(null, `part-${chunkIndex}`);
  }
});

const uploadChunk = multer({
  storage: chunkStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB per individual chunk (well within Cloud Run limit)
});

// Simple memory rate limiter for admin login
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) {
    return false;
  }
  entry.count++;
  return true;
}

// Admin Auth Middleware
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const now = Date.now();

  const session = db.prepare(`
    SELECT s.token, s.admin_id, s.expires_at, a.username, a.full_name
    FROM admin_sessions s
    JOIN admins a ON s.admin_id = a.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, now) as { token: string; admin_id: string; expires_at: number; username: string; full_name: string } | undefined;

  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }

  (req as any).admin = session;
  next();
}

// Public Member Auth Middleware (Also accepts logged-in Admins seamlessly)
export function requireUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Please sign in to access this feature' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const now = Date.now();

  let session = db.prepare(`
    SELECT s.token, s.user_id, s.expires_at, u.full_name, u.email, u.avatar_url, u.bio
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, now) as { token: string; user_id: string; expires_at: number; full_name: string; email: string; avatar_url: string | null; bio: string | null } | undefined;

  // Fallback to active admin session if browsing as admin
  if (!session) {
    const adminSession = db.prepare(`
      SELECT s.token, s.admin_id, s.expires_at, a.username, a.full_name
      FROM admin_sessions s
      JOIN admins a ON s.admin_id = a.id
      WHERE s.token = ? AND s.expires_at > ?
    `).get(token, now) as { token: string; admin_id: string; expires_at: number; username: string; full_name: string } | undefined;

    if (adminSession) {
      session = {
        token: adminSession.token,
        user_id: adminSession.admin_id,
        expires_at: adminSession.expires_at,
        full_name: `${adminSession.full_name} (Admin)`,
        email: `${adminSession.username}@mishkaat.internal`,
        avatar_url: null,
        bio: 'Administrator'
      };
    }
  }

  if (!session) {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    return;
  }

  (req as any).user = session;
  next();
}

// -------------------------------------------------------------
// AUTH & SETTINGS ROUTES
// -------------------------------------------------------------

apiRouter.get('/admin/status', (_req, res) => {
  const row = db.prepare('SELECT count(*) as count FROM admins').get() as { count: number };
  res.json({ hasAdmin: row.count > 0 });
});

apiRouter.post('/admin/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: 'Too many login attempts. Please wait 15 minutes.' });
    return;
  }

  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as {
    id: string;
    username: string;
    password_hash: string;
    full_name: string;
  } | undefined;

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  // Generate 7-day session token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  db.prepare(`
    INSERT INTO admin_sessions (token, admin_id, expires_at, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(token, admin.id, expiresAt);

  res.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      full_name: admin.full_name
    }
  });
});

apiRouter.get('/admin/me', requireAdmin, (req, res) => {
  const admin = (req as any).admin;
  res.json({
    admin: {
      id: admin.admin_id,
      username: admin.username,
      full_name: admin.full_name
    }
  });
});

apiRouter.post('/admin/logout', requireAdmin, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
  }
  res.json({ success: true });
});

apiRouter.post('/admin/change-password', requireAdmin, (req, res) => {
  const admin = (req as any).admin;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: 'New passwords do not match' });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long' });
    return;
  }

  const currentAdmin = db.prepare('SELECT password_hash FROM admins WHERE id = ?').get(admin.admin_id) as { password_hash: string } | undefined;
  if (!currentAdmin || !bcrypt.compareSync(currentPassword, currentAdmin.password_hash)) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  const newHash = bcrypt.hashSync(newPassword, 12);
  db.prepare(`
    UPDATE admins SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
  `).run(newHash, admin.admin_id);

  // Invalidate other sessions
  const currentToken = req.headers.authorization?.split(' ')[1];
  db.prepare('DELETE FROM admin_sessions WHERE admin_id = ? AND token != ?').run(admin.admin_id, currentToken);

  res.json({ success: true, message: 'Password updated successfully' });
});

// -------------------------------------------------------------
// PUBLIC MEMBER AUTH & BOOKMARKS ROUTES
// -------------------------------------------------------------

apiRouter.post('/user/register', (req, res) => {
  const { full_name, email, password } = req.body;
  if (!full_name || !email || !password) {
    res.status(400).json({ error: 'Full name, email, and password are required' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    res.status(400).json({ error: 'Please enter a valid email address' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    res.status(400).json({ error: 'An account with this email address already exists. Please sign in instead.' });
    return;
  }

  const userId = generateId('usr');
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  try {
    db.prepare(`
      INSERT INTO users (id, full_name, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(userId, full_name.trim(), cleanEmail, hash);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    db.prepare(`
      INSERT INTO user_sessions (token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(token, userId, expiresAt);

    res.status(201).json({
      token,
      user: {
        id: userId,
        full_name: full_name.trim(),
        email: cleanEmail,
        avatar_url: null,
        bio: null
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

apiRouter.post('/user/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as {
    id: string;
    full_name: string;
    email: string;
    password_hash: string;
    avatar_url: string | null;
    bio: string | null;
  } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Incorrect email or password' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  db.prepare(`
    INSERT INTO user_sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(token, user.id, expiresAt);

  res.json({
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url,
      bio: user.bio
    }
  });
});

apiRouter.get('/user/me', requireUser, (req, res) => {
  const sessionUser = (req as any).user;
  const user = db.prepare('SELECT id, full_name, email, avatar_url, bio, created_at FROM users WHERE id = ?').get(sessionUser.user_id) as any;
  const bookmarksCount = db.prepare('SELECT count(*) as c FROM user_bookmarks WHERE user_id = ?').get(sessionUser.user_id) as { c: number };

  res.json({
    user: {
      ...user,
      total_bookmarks: bookmarksCount ? bookmarksCount.c : 0
    }
  });
});

apiRouter.post('/user/logout', requireUser, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
  }
  res.json({ success: true });
});

apiRouter.put('/user/profile', requireUser, (req, res) => {
  const sessionUser = (req as any).user;
  const { full_name, bio, newPassword, currentPassword } = req.body;

  if (!full_name) {
    res.status(400).json({ error: 'Name cannot be empty' });
    return;
  }

  if (newPassword) {
    if (!currentPassword) {
      res.status(400).json({ error: 'Current password is required to set a new password' });
      return;
    }
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(sessionUser.user_id) as { password_hash: string };
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }
    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare(`UPDATE users SET full_name = ?, bio = ?, password_hash = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(full_name.trim(), bio || '', newHash, sessionUser.user_id);
  } else {
    db.prepare(`UPDATE users SET full_name = ?, bio = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(full_name.trim(), bio || '', sessionUser.user_id);
  }

  const updated = db.prepare('SELECT id, full_name, email, avatar_url, bio FROM users WHERE id = ?').get(sessionUser.user_id);
  res.json({ user: updated });
});

// Bookmarks / Saved Items
apiRouter.get('/user/bookmarks', requireUser, (req, res) => {
  const sessionUser = (req as any).user;
  const bookmarks = db.prepare(`
    SELECT id, item_type, item_id, created_at 
    FROM user_bookmarks 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(sessionUser.user_id) as { id: string; item_type: string; item_id: string; created_at: string }[];

  res.json(bookmarks);
});

apiRouter.get('/user/bookmarks/ids', requireUser, (req, res) => {
  const sessionUser = (req as any).user;
  const rows = db.prepare(`
    SELECT item_type, item_id FROM user_bookmarks WHERE user_id = ?
  `).all(sessionUser.user_id) as { item_type: string; item_id: string }[];

  res.json(rows);
});

apiRouter.post('/user/bookmarks/toggle', requireUser, (req, res) => {
  const sessionUser = (req as any).user;
  const { item_type, item_id } = req.body;
  if (!item_type || !item_id) {
    res.status(400).json({ error: 'item_type and item_id are required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM user_bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?')
    .get(sessionUser.user_id, item_type, item_id) as { id: string } | undefined;

  if (existing) {
    db.prepare('DELETE FROM user_bookmarks WHERE id = ?').run(existing.id);
    syncDeleteFromTurso('user_bookmarks', existing.id);
    res.json({ bookmarked: false, message: 'Removed from your saved collection' });
  } else {
    const id = generateId('bmk');
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO user_bookmarks (id, user_id, item_type, item_id, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(id, sessionUser.user_id, item_type, item_id);
    syncRecordToTurso('user_bookmarks', { id, user_id: sessionUser.user_id, item_type, item_id, created_at: now });
    res.json({ bookmarked: true, message: 'Saved to your spiritual collection!' });
  }
});

// -------------------------------------------------------------
// LIKES & COMMENTS (INTERACTIONS FOR VIDEOS & REELS)
// -------------------------------------------------------------

apiRouter.get('/interactions/:item_type/:item_id', (req, res) => {
  const { item_type, item_id } = req.params;

  // Like count
  const likeRow = db.prepare('SELECT count(*) as c FROM likes WHERE item_type = ? AND item_id = ?').get(item_type, item_id) as { c: number };
  
  // Check if current user liked
  let hasLiked = false;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = db.prepare('SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > ?').get(token, Date.now()) as { user_id: string } | undefined;
    if (session) {
      const userLike = db.prepare('SELECT id FROM likes WHERE user_id = ? AND item_type = ? AND item_id = ?').get(session.user_id, item_type, item_id);
      hasLiked = !!userLike;
    }
  }

  // Comments list
  const comments = db.prepare(`
    SELECT id, user_id, user_name, content, created_at 
    FROM comments 
    WHERE item_type = ? AND item_id = ? 
    ORDER BY created_at DESC
  `).all(item_type, item_id);

  res.json({
    likes_count: likeRow ? likeRow.c : 0,
    has_liked: hasLiked,
    comments
  });
});

apiRouter.post('/interactions/like', requireUser, (req, res) => {
  const sessionUser = (req as any).user;
  const { item_type, item_id } = req.body;
  if (!item_type || !item_id) {
    res.status(400).json({ error: 'item_type and item_id are required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND item_type = ? AND item_id = ?')
    .get(sessionUser.user_id, item_type, item_id) as { id: string } | undefined;

  let liked = false;
  if (existing) {
    db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
    syncDeleteFromTurso('likes', existing.id);
    liked = false;
  } else {
    const id = generateId('lk');
    const now = new Date().toISOString();
    db.prepare('INSERT INTO likes (id, user_id, item_type, item_id, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))')
      .run(id, sessionUser.user_id, item_type, item_id);
    syncRecordToTurso('likes', { id, user_id: sessionUser.user_id, item_type, item_id, created_at: now });
    liked = true;
  }

  const likeCount = db.prepare('SELECT count(*) as c FROM likes WHERE item_type = ? AND item_id = ?').get(item_type, item_id) as { c: number };

  res.json({
    liked,
    likes_count: likeCount ? likeCount.c : 0
  });
});

apiRouter.post('/interactions/comment', requireUser, (req, res) => {
  const sessionUser = (req as any).user;
  const { item_type, item_id, content } = req.body;
  if (!item_type || !item_id || !content || !content.trim()) {
    res.status(400).json({ error: 'Comment content cannot be empty' });
    return;
  }

  const id = generateId('cmt');
  db.prepare(`
    INSERT INTO comments (id, user_id, user_name, item_type, item_id, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, sessionUser.user_id, sessionUser.full_name, item_type, item_id, content.trim());

  const newComment = db.prepare('SELECT id, user_id, user_name, content, created_at FROM comments WHERE id = ?').get(id);
  syncRecordToTurso('comments', newComment as any);
  const totalComments = db.prepare('SELECT count(*) as c FROM comments WHERE item_type = ? AND item_id = ?').get(item_type, item_id) as { c: number };

  res.status(201).json({
    comment: newComment,
    comments_count: totalComments ? totalComments.c : 0
  });
});

apiRouter.delete('/interactions/comment/:id', (req, res) => {
  const { id } = req.params;
  // Can delete if user owner or admin
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const now = Date.now();

  const adminSession = db.prepare('SELECT admin_id FROM admin_sessions WHERE token = ? AND expires_at > ?').get(token, now);
  const userSession = db.prepare('SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > ?').get(token, now) as { user_id: string } | undefined;

  const comment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(id) as { user_id: string } | undefined;
  if (!comment) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }

  if (adminSession || (userSession && userSession.user_id === comment.user_id)) {
    db.prepare('DELETE FROM comments WHERE id = ?').run(id);
    syncDeleteFromTurso('comments', id);
    res.json({ success: true });
  } else {
    res.status(403).json({ error: 'Unauthorized to delete this comment' });
  }
});

// File upload endpoint
apiRouter.post('/upload', requireAdmin, (req: Request, res: Response) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      console.error('File upload error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds maximum upload limit (4GB). For ultra-large video files or external platforms, please use the Paste Link / URL option.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file received by the server. Please select a valid file to upload.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      url: fileUrl,
      filename: req.file.originalname || req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  });
});

// Multi-GB Chunked Upload Endpoints (slices up to 4GB files into chunks)
apiRouter.post('/upload-chunk', requireAdmin, (req: Request, res: Response) => {
  uploadChunk.single('chunk')(req, res, (err: any) => {
    if (err) {
      console.error('Chunk upload error:', err);
      return res.status(400).json({ error: err.message || 'Chunk upload failed' });
    }
    const uploadId = req.query?.uploadId || req.body?.uploadId;
    const chunkIndex = req.query?.chunkIndex || req.body?.chunkIndex;
    const totalChunks = req.query?.totalChunks || req.body?.totalChunks;
    return res.json({ success: true, uploadId, chunkIndex, totalChunks });
  });
});

apiRouter.post('/upload-chunk-complete', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { uploadId, filename, totalChunks } = req.body;
    if (!uploadId || !filename || totalChunks === undefined) {
      return res.status(400).json({ error: 'uploadId, filename, and totalChunks are required' });
    }

    const safeUploadId = String(uploadId).replace(/[^a-zA-Z0-9_-]/g, '');
    const chunkDir = path.join(CHUNKS_DIR, safeUploadId);
    if (!fs.existsSync(chunkDir)) {
      return res.status(400).json({ error: 'Upload chunk directory not found or expired' });
    }

    let ext = path.extname(filename).toLowerCase();
    if (!ext) ext = '.mp4';
    const finalFilename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    const finalFilePath = path.join(UPLOADS_DIR, finalFilename);

    const writeStream = fs.createWriteStream(finalFilePath);

    // Stream chunks sequentially to eliminate memory buffer spikes for multi-GB uploads
    for (let i = 0; i < Number(totalChunks); i++) {
      const partPath = path.join(chunkDir, `part-${i}`);
      if (!fs.existsSync(partPath)) {
        writeStream.close();
        return res.status(400).json({ error: `Missing chunk index ${i}` });
      }
      await new Promise<void>((resolve, reject) => {
        const readStream = fs.createReadStream(partPath);
        readStream.on('error', (err) => reject(err));
        readStream.on('end', () => resolve());
        readStream.pipe(writeStream, { end: false });
      });
    }

    writeStream.end();

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (e) => reject(e));
    });

    // Cleanup temp chunk directory
    try {
      fs.rmSync(chunkDir, { recursive: true, force: true });
    } catch {}

    const stats = fs.statSync(finalFilePath);

    return res.json({
      url: `/uploads/${finalFilename}`,
      filename,
      size: stats.size
    });
  } catch (err: any) {
    console.error('Error completing chunked upload:', err);
    return res.status(500).json({ error: err.message || 'Failed to assemble uploaded chunks' });
  }
});

// Website settings
apiRouter.get('/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM website_settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

apiRouter.put('/settings', requireAdmin, (req, res) => {
  const settings = req.body;
  const updateStmt = db.prepare(`
    INSERT INTO website_settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  const tx = db.transaction((entries: [string, any][]) => {
    for (const [key, val] of entries) {
      updateStmt.run(key, String(val));
    }
  });

  tx(Object.entries(settings));
  for (const [key, val] of Object.entries(settings)) {
    syncRecordToTurso('website_settings', { key, value: String(val) });
  }
  res.json({ success: true });
});

// -------------------------------------------------------------
// LIVE WEBSITE STATISTICS
// -------------------------------------------------------------
apiRouter.get('/stats', (_req, res) => {
  // Live dynamic counts computed from database
  const speechesCount = db.prepare('SELECT count(*) as c FROM speeches WHERE is_published = 1').get() as { c: number };
  const reelsCount = db.prepare('SELECT count(*) as c FROM reels WHERE is_published = 1').get() as { c: number };
  const booksCount = db.prepare('SELECT count(*) as c FROM books WHERE is_published = 1').get() as { c: number };
  const articlesCount = db.prepare('SELECT count(*) as c FROM articles WHERE is_published = 1').get() as { c: number };
  const aqwaalCount = db.prepare('SELECT count(*) as c FROM aqwaal WHERE is_published = 1').get() as { c: number };
  const shayariyanCount = db.prepare('SELECT count(*) as c FROM shayariyan WHERE is_published = 1').get() as { c: number };
  const scholarsCount = db.prepare('SELECT count(*) as c FROM scholars WHERE is_published = 1').get() as { c: number };

  // Also include admin un-filtered totals if requested
  const totalSpeeches = db.prepare('SELECT count(*) as c FROM speeches').get() as { c: number };
  const totalReels = db.prepare('SELECT count(*) as c FROM reels').get() as { c: number };
  const totalBooks = db.prepare('SELECT count(*) as c FROM books').get() as { c: number };
  const totalArticles = db.prepare('SELECT count(*) as c FROM articles').get() as { c: number };
  const totalAqwaal = db.prepare('SELECT count(*) as c FROM aqwaal').get() as { c: number };
  const totalShayariyan = db.prepare('SELECT count(*) as c FROM shayariyan').get() as { c: number };
  const totalScholars = db.prepare('SELECT count(*) as c FROM scholars').get() as { c: number };

  res.json({
    published: {
      speeches: speechesCount.c,
      reels: reelsCount.c,
      books: booksCount.c,
      articles: articlesCount.c,
      aqwaal: aqwaalCount.c,
      shayariyan: shayariyanCount.c,
      scholars: scholarsCount.c
    },
    total: {
      speeches: totalSpeeches.c,
      reels: totalReels.c,
      books: totalBooks.c,
      articles: totalArticles.c,
      aqwaal: totalAqwaal.c,
      shayariyan: totalShayariyan.c,
      scholars: totalScholars.c
    }
  });
});

// -------------------------------------------------------------
// SCHOLARS
// -------------------------------------------------------------
apiRouter.get('/scholars', (req, res) => {
  const includeUnpublished = req.query.all === '1';
  const search = req.query.search ? `%${req.query.search}%` : null;

  let query = 'SELECT * FROM scholars WHERE 1=1';
  const params: any[] = [];

  if (!includeUnpublished) {
    query += ' AND is_published = 1';
  }
  if (search) {
    query += ' AND (full_name LIKE ? OR honorific_title LIKE ? OR biography LIKE ?)';
    params.push(search, search, search);
  }
  query += ' ORDER BY created_at ASC';

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

apiRouter.get('/scholars/:slugOrId', (req, res) => {
  const { slugOrId } = req.params;
  const scholar = db.prepare(`
    SELECT * FROM scholars WHERE id = ? OR slug = ?
  `).get(slugOrId, slugOrId) as any;

  if (!scholar) {
    res.status(404).json({ error: 'Scholar not found' });
    return;
  }

  // Fetch only speeches strictly belonging to this scholar
  const speeches = db.prepare(`
    SELECT * FROM speeches
    WHERE scholar_id = ? AND is_published = 1
    ORDER BY upload_date DESC
  `).all(scholar.id);

  // Fetch only reels strictly belonging to this scholar
  const reels = db.prepare(`
    SELECT * FROM reels
    WHERE scholar_id = ? AND is_published = 1
    ORDER BY created_at DESC
  `).all(scholar.id);

  res.json({
    scholar,
    speeches,
    reels
  });
});

apiRouter.post('/scholars', requireAdmin, (req, res) => {
  const { full_name, honorific_title, slug, biography, profile_image, location, is_published } = req.body;
  if (!full_name || !honorific_title || !slug) {
    res.status(400).json({ error: 'Full name, honorific title, and slug are required' });
    return;
  }

  const id = generateId('sch');
  try {
    db.prepare(`
      INSERT INTO scholars (id, full_name, honorific_title, slug, biography, profile_image, location, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(id, full_name, honorific_title, slug, biography || '', profile_image || null, location || '', is_published ? 1 : 0);

    const created = db.prepare('SELECT * FROM scholars WHERE id = ?').get(id);
    syncRecordToTurso('scholars', created as any);
    res.status(201).json(created);
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'A scholar with this slug already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

apiRouter.put('/scholars/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { full_name, honorific_title, slug, biography, profile_image, location, is_published } = req.body;

  try {
    db.prepare(`
      UPDATE scholars
      SET full_name = ?, honorific_title = ?, slug = ?, biography = ?, profile_image = ?, location = ?, is_published = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(full_name, honorific_title, slug, biography, profile_image, location, is_published ? 1 : 0, id);

    const updated = db.prepare('SELECT * FROM scholars WHERE id = ?').get(id);
    syncRecordToTurso('scholars', updated as any);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/scholars/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    // Reassign speeches and reels to another scholar or default if needed
    const altScholar = db.prepare('SELECT id FROM scholars WHERE id != ? LIMIT 1').get(id) as { id: string } | undefined;
    if (altScholar) {
      db.prepare('UPDATE speeches SET scholar_id = ? WHERE scholar_id = ?').run(altScholar.id, id);
      db.prepare('UPDATE reels SET scholar_id = ? WHERE scholar_id = ?').run(altScholar.id, id);
    }
    db.prepare('UPDATE aqwaal SET scholar_id = NULL WHERE scholar_id = ?').run(id);
    db.prepare('DELETE FROM scholars WHERE id = ?').run(id);
    syncDeleteFromTurso('scholars', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete scholar' });
  }
});

// -------------------------------------------------------------
// SPEECHES OF AHL-E-SUNNAT
// -------------------------------------------------------------
apiRouter.get('/speeches', (req, res) => {
  const includeUnpublished = req.query.all === '1';
  const type = req.query.type as string | undefined;
  const scholarId = req.query.scholar_id as string | undefined;
  const search = req.query.search ? `%${req.query.search}%` : null;

  let query = `
    SELECT sp.*, COALESCE(sc.full_name, 'Hazrat Allama') as scholar_name, COALESCE(sc.honorific_title, '') as scholar_title, COALESCE(sc.slug, '') as scholar_slug
    FROM speeches sp
    LEFT JOIN scholars sc ON sp.scholar_id = sc.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (!includeUnpublished) {
    query += ' AND sp.is_published = 1';
  }
  if (type) {
    query += ' AND sp.speech_type = ?';
    params.push(type);
  }
  if (scholarId) {
    query += ' AND sp.scholar_id = ?';
    params.push(scholarId);
  }
  if (search) {
    query += ' AND (sp.title LIKE ? OR sp.description LIKE ? OR sp.tags LIKE ? OR sc.full_name LIKE ?)';
    params.push(search, search, search, search);
  }

  query += ' ORDER BY sp.created_at DESC, sp.upload_date DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

apiRouter.get('/speeches/:id', (req, res) => {
  const speech = db.prepare(`
    SELECT sp.*, COALESCE(sc.full_name, 'Hazrat Allama') as scholar_name, COALESCE(sc.honorific_title, '') as scholar_title, COALESCE(sc.slug, '') as scholar_slug, sc.profile_image as scholar_image
    FROM speeches sp
    LEFT JOIN scholars sc ON sp.scholar_id = sc.id
    WHERE sp.id = ?
  `).get(req.params.id);

  if (!speech) {
    res.status(404).json({ error: 'Speech not found' });
    return;
  }
  res.json(speech);
});

apiRouter.post('/speeches', requireAdmin, (req, res) => {
  let { title, scholar_id, speech_type, description, thumbnail, media_url, duration, upload_date, tags, is_published } = req.body;
  if (!title || !speech_type || !media_url) {
    res.status(400).json({ error: 'Title, speech type, and media URL are required' });
    return;
  }

  // Auto-detect authentic YouTube video thumbnail if user didn't upload one or pasted a Google search page link
  if (!thumbnail || thumbnail.includes('google.com') || !thumbnail.trim()) {
    const ytThumb = extractYouTubeThumbnail(media_url);
    if (ytThumb) {
      thumbnail = ytThumb;
    }
  }

  // Ensure valid scholar_id
  let validScholarId = scholar_id;
  const scholarRow = db.prepare('SELECT id FROM scholars WHERE id = ?').get(scholar_id);
  if (!scholarRow) {
    const firstScholar = db.prepare('SELECT id FROM scholars LIMIT 1').get() as { id: string } | undefined;
    if (firstScholar) validScholarId = firstScholar.id;
  }

  const id = generateId('sp');
  db.prepare(`
    INSERT INTO speeches (id, title, scholar_id, speech_type, description, thumbnail, media_url, duration, upload_date, tags, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(id, title, validScholarId, speech_type, description || '', thumbnail || null, media_url, duration || '', upload_date || new Date().toISOString().split('T')[0], tags || '', is_published !== 0 ? 1 : 0);

  const created = db.prepare('SELECT * FROM speeches WHERE id = ?').get(id);
  syncRecordToTurso('speeches', created as any);
  res.status(201).json(created);
});

apiRouter.put('/speeches/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  let { title, scholar_id, speech_type, description, thumbnail, media_url, duration, upload_date, tags, is_published } = req.body;

  // Auto-detect authentic YouTube video thumbnail if missing or broken google search image
  if (!thumbnail || thumbnail.includes('google.com') || !thumbnail.trim()) {
    const ytThumb = extractYouTubeThumbnail(media_url);
    if (ytThumb) {
      thumbnail = ytThumb;
    }
  }

  let validScholarId = scholar_id;
  const scholarRow = db.prepare('SELECT id FROM scholars WHERE id = ?').get(scholar_id);
  if (!scholarRow) {
    const firstScholar = db.prepare('SELECT id FROM scholars LIMIT 1').get() as { id: string } | undefined;
    if (firstScholar) validScholarId = firstScholar.id;
  }

  db.prepare(`
    UPDATE speeches
    SET title = ?, scholar_id = ?, speech_type = ?, description = ?, thumbnail = ?, media_url = ?, duration = ?, upload_date = ?, tags = ?, is_published = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(title, validScholarId, speech_type, description, thumbnail, media_url, duration, upload_date, tags, is_published !== 0 ? 1 : 0, id);

  const updated = db.prepare('SELECT * FROM speeches WHERE id = ?').get(id);
  syncRecordToTurso('speeches', updated as any);
  res.json(updated);
});

apiRouter.delete('/speeches/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM user_bookmarks WHERE item_type = 'speech' AND item_id = ?").run(id);
    db.prepare("DELETE FROM likes WHERE item_type = 'speech' AND item_id = ?").run(id);
    db.prepare("DELETE FROM comments WHERE item_type = 'speech' AND item_id = ?").run(id);
    db.prepare('DELETE FROM speeches WHERE id = ?').run(id);
    syncDeleteFromTurso('speeches', id);
    syncDeleteWhereFromTurso('user_bookmarks', "item_type = 'speech' AND item_id = ?", [id]);
    syncDeleteWhereFromTurso('likes', "item_type = 'speech' AND item_id = ?", [id]);
    syncDeleteWhereFromTurso('comments', "item_type = 'speech' AND item_id = ?", [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete speech' });
  }
});

// -------------------------------------------------------------
// ISLAMIC REELS (VERTICAL 9:16)
// -------------------------------------------------------------
apiRouter.get('/reels', (req, res) => {
  const includeUnpublished = req.query.all === '1';
  const scholarId = req.query.scholar_id as string | undefined;
  const search = req.query.search ? `%${req.query.search}%` : null;

  let query = `
    SELECT r.*, COALESCE(sc.full_name, 'Hazrat Allama') as scholar_name, COALESCE(sc.honorific_title, '') as scholar_title, COALESCE(sc.slug, '') as scholar_slug, sc.profile_image as scholar_image
    FROM reels r
    LEFT JOIN scholars sc ON r.scholar_id = sc.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (!includeUnpublished) {
    query += ' AND r.is_published = 1';
  }
  if (scholarId) {
    query += ' AND r.scholar_id = ?';
    params.push(scholarId);
  }
  if (search) {
    query += ' AND (r.title LIKE ? OR r.description LIKE ? OR sc.full_name LIKE ?)';
    params.push(search, search, search);
  }

  query += ' ORDER BY r.created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

apiRouter.get('/reels/:id', (req, res) => {
  const reel = db.prepare(`
    SELECT r.*, COALESCE(sc.full_name, 'Hazrat Allama') as scholar_name, COALESCE(sc.honorific_title, '') as scholar_title, COALESCE(sc.slug, '') as scholar_slug, sc.profile_image as scholar_image
    FROM reels r
    LEFT JOIN scholars sc ON r.scholar_id = sc.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!reel) {
    res.status(404).json({ error: 'Reel not found' });
    return;
  }
  res.json(reel);
});

apiRouter.post('/reels', requireAdmin, (req, res) => {
  let { title, scholar_id, description, video_url, thumbnail, duration, is_published } = req.body;
  if (!title || !video_url) {
    res.status(400).json({ error: 'Title and video URL are required' });
    return;
  }

  // Auto-detect YouTube thumbnail for reels
  if (!thumbnail || thumbnail.includes('google.com') || !thumbnail.trim()) {
    const ytThumb = extractYouTubeThumbnail(video_url);
    if (ytThumb) {
      thumbnail = ytThumb;
    }
  }

  let validScholarId = scholar_id;
  const scholarRow = db.prepare('SELECT id FROM scholars WHERE id = ?').get(scholar_id);
  if (!scholarRow) {
    const firstScholar = db.prepare('SELECT id FROM scholars LIMIT 1').get() as { id: string } | undefined;
    if (firstScholar) validScholarId = firstScholar.id;
  }

  const id = generateId('reel');
  db.prepare(`
    INSERT INTO reels (id, title, scholar_id, description, video_url, thumbnail, duration, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(id, title, validScholarId, description || '', video_url, thumbnail || null, duration || '', is_published !== 0 ? 1 : 0);

  const created = db.prepare('SELECT * FROM reels WHERE id = ?').get(id);
  syncRecordToTurso('reels', created as any);
  res.status(201).json(created);
});

apiRouter.put('/reels/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  let { title, scholar_id, description, video_url, thumbnail, duration, is_published } = req.body;

  // Auto-detect YouTube thumbnail for reels
  if (!thumbnail || thumbnail.includes('google.com') || !thumbnail.trim()) {
    const ytThumb = extractYouTubeThumbnail(video_url);
    if (ytThumb) {
      thumbnail = ytThumb;
    }
  }

  let validScholarId = scholar_id;
  const scholarRow = db.prepare('SELECT id FROM scholars WHERE id = ?').get(scholar_id);
  if (!scholarRow) {
    const firstScholar = db.prepare('SELECT id FROM scholars LIMIT 1').get() as { id: string } | undefined;
    if (firstScholar) validScholarId = firstScholar.id;
  }

  db.prepare(`
    UPDATE reels
    SET title = ?, scholar_id = ?, description = ?, video_url = ?, thumbnail = ?, duration = ?, is_published = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(title, validScholarId, description, video_url, thumbnail, duration, is_published !== 0 ? 1 : 0, id);

  const updated = db.prepare('SELECT * FROM reels WHERE id = ?').get(id);
  syncRecordToTurso('reels', updated as any);
  res.json(updated);
});

apiRouter.delete('/reels/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM user_bookmarks WHERE item_type = 'reel' AND item_id = ?").run(id);
    db.prepare("DELETE FROM likes WHERE item_type = 'reel' AND item_id = ?").run(id);
    db.prepare("DELETE FROM comments WHERE item_type = 'reel' AND item_id = ?").run(id);
    db.prepare('DELETE FROM reels WHERE id = ?').run(id);
    syncDeleteFromTurso('reels', id);
    syncDeleteWhereFromTurso('user_bookmarks', "item_type = 'reel' AND item_id = ?", [id]);
    syncDeleteWhereFromTurso('likes', "item_type = 'reel' AND item_id = ?", [id]);
    syncDeleteWhereFromTurso('comments', "item_type = 'reel' AND item_id = ?", [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete reel' });
  }
});

// -------------------------------------------------------------
// BOOKS & CATEGORIES
// -------------------------------------------------------------
apiRouter.get('/book-categories', (_req, res) => {
  const rows = db.prepare(`
    SELECT bc.*, (SELECT count(*) FROM books WHERE category_id = bc.id AND is_published = 1) as book_count
    FROM book_categories bc
    ORDER BY bc.name ASC
  `).all();
  res.json(rows);
});

apiRouter.post('/book-categories', requireAdmin, (req, res) => {
  const { name, slug, description } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'Category name and slug are required' });
    return;
  }
  const id = generateId('bcat');
  try {
    db.prepare(`
      INSERT INTO book_categories (id, name, slug, description, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(id, name, slug, description || '');
    const createdCat = { id, name, slug, description: description || '' };
    syncRecordToTurso('book_categories', createdCat);
    res.status(201).json(createdCat);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/book-categories/:id', requireAdmin, (req, res) => {
  const count = db.prepare('SELECT count(*) as count FROM books WHERE category_id = ?').get(req.params.id) as { count: number };
  if (count.count > 0) {
    res.status(400).json({ error: 'Cannot delete category that contains books. Please reassign or delete the books first.' });
    return;
  }
  db.prepare('DELETE FROM book_categories WHERE id = ?').run(req.params.id);
  syncDeleteFromTurso('book_categories', req.params.id);
  res.json({ success: true });
});

apiRouter.get('/books', (req, res) => {
  const includeUnpublished = req.query.all === '1';
  const categoryId = req.query.category_id as string | undefined;
  const search = req.query.search ? `%${req.query.search}%` : null;

  let query = `
    SELECT b.*, COALESCE(bc.name, 'Islamic Literature') as category_name, COALESCE(bc.slug, 'islamic') as category_slug
    FROM books b
    LEFT JOIN book_categories bc ON b.category_id = bc.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (!includeUnpublished) {
    query += ' AND b.is_published = 1';
  }
  if (categoryId) {
    query += ' AND b.category_id = ?';
    params.push(categoryId);
  }
  if (search) {
    query += ' AND (b.title LIKE ? OR b.author_name LIKE ? OR b.description LIKE ?)';
    params.push(search, search, search);
  }

  query += ' ORDER BY b.created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

apiRouter.get('/books/:id', (req, res) => {
  const book = db.prepare(`
    SELECT b.*, COALESCE(bc.name, 'Islamic Literature') as category_name, COALESCE(bc.slug, 'islamic') as category_slug
    FROM books b
    LEFT JOIN book_categories bc ON b.category_id = bc.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  res.json(book);
});

apiRouter.post('/books', requireAdmin, (req, res) => {
  let { title, author_name, category_id, cover_image, description, language, file_url, external_read_url, publication_details, allow_download, is_published } = req.body;
  if (!title || !author_name) {
    res.status(400).json({ error: 'Title and author are required' });
    return;
  }

  let validCategoryId = category_id;
  const catRow = db.prepare('SELECT id FROM book_categories WHERE id = ?').get(category_id);
  if (!catRow) {
    const firstCat = db.prepare('SELECT id FROM book_categories LIMIT 1').get() as { id: string } | undefined;
    if (firstCat) {
      validCategoryId = firstCat.id;
    } else {
      validCategoryId = 'bcat-kutub';
      db.prepare(`INSERT OR IGNORE INTO book_categories (id, name, slug, description, created_at) VALUES (?, ?, ?, ?, datetime('now'))`)
        .run(validCategoryId, 'Islamic Books', 'islamic-books', 'General Islamic books');
    }
  }

  const id = generateId('bk');
  db.prepare(`
    INSERT INTO books (id, title, author_name, category_id, cover_image, description, language, file_url, external_read_url, publication_details, allow_download, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(id, title, author_name, validCategoryId, cover_image || null, description || '', language || 'Urdu', file_url || null, external_read_url || null, publication_details || '', allow_download ? 1 : 0, is_published !== 0 ? 1 : 0);

  const created = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  syncRecordToTurso('books', created as any);
  res.status(201).json(created);
});

apiRouter.put('/books/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  let { title, author_name, category_id, cover_image, description, language, file_url, external_read_url, publication_details, allow_download, is_published } = req.body;

  let validCategoryId = category_id;
  const catRow = db.prepare('SELECT id FROM book_categories WHERE id = ?').get(category_id);
  if (!catRow) {
    const firstCat = db.prepare('SELECT id FROM book_categories LIMIT 1').get() as { id: string } | undefined;
    if (firstCat) validCategoryId = firstCat.id;
  }

  db.prepare(`
    UPDATE books
    SET title = ?, author_name = ?, category_id = ?, cover_image = ?, description = ?, language = ?, file_url = ?, external_read_url = ?, publication_details = ?, allow_download = ?, is_published = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(title, author_name, validCategoryId, cover_image, description, language, file_url, external_read_url, publication_details, allow_download ? 1 : 0, is_published !== 0 ? 1 : 0, id);

  const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  syncRecordToTurso('books', updated as any);
  res.json(updated);
});

apiRouter.delete('/books/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM user_bookmarks WHERE item_type = 'book' AND item_id = ?").run(id);
    db.prepare('DELETE FROM books WHERE id = ?').run(id);
    syncDeleteFromTurso('books', id);
    syncDeleteWhereFromTurso('user_bookmarks', "item_type = 'book' AND item_id = ?", [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete book' });
  }
});

// -------------------------------------------------------------
// ARTICLES & CATEGORIES
// -------------------------------------------------------------
apiRouter.get('/article-categories', (_req, res) => {
  const rows = db.prepare(`
    SELECT ac.*, (SELECT count(*) FROM articles WHERE category_id = ac.id AND is_published = 1) as article_count
    FROM article_categories ac
    ORDER BY ac.name ASC
  `).all();
  res.json(rows);
});

apiRouter.post('/article-categories', requireAdmin, (req, res) => {
  const { name, slug, description } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'Category name and slug are required' });
    return;
  }
  const id = generateId('acat');
  try {
    db.prepare(`
      INSERT INTO article_categories (id, name, slug, description, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(id, name, slug, description || '');
    const createdCat = { id, name, slug, description: description || '' };
    syncRecordToTurso('article_categories', createdCat);
    res.status(201).json(createdCat);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/article-categories/:id', requireAdmin, (req, res) => {
  const count = db.prepare('SELECT count(*) as count FROM articles WHERE category_id = ?').get(req.params.id) as { count: number };
  if (count.count > 0) {
    res.status(400).json({ error: 'Cannot delete category containing articles.' });
    return;
  }
  db.prepare('DELETE FROM article_categories WHERE id = ?').run(req.params.id);
  syncDeleteFromTurso('article_categories', req.params.id);
  res.json({ success: true });
});

apiRouter.get('/articles', (req, res) => {
  const includeUnpublished = req.query.all === '1';
  const categoryId = req.query.category_id as string | undefined;
  const search = req.query.search ? `%${req.query.search}%` : null;

  let query = `
    SELECT a.*, COALESCE(ac.name, 'Islamic Articles') as category_name, COALESCE(ac.slug, 'islamic') as category_slug
    FROM articles a
    LEFT JOIN article_categories ac ON a.category_id = ac.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (!includeUnpublished) {
    query += ' AND a.is_published = 1';
  }
  if (categoryId) {
    query += ' AND a.category_id = ?';
    params.push(categoryId);
  }
  if (search) {
    query += ' AND (a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ? OR a.author_name LIKE ?)';
    params.push(search, search, search, search);
  }

  query += ' ORDER BY a.publication_date DESC, a.created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

apiRouter.get('/articles/:idOrSlug', (req, res) => {
  const article = db.prepare(`
    SELECT a.*, COALESCE(ac.name, 'Islamic Articles') as category_name, COALESCE(ac.slug, 'islamic') as category_slug
    FROM articles a
    LEFT JOIN article_categories ac ON a.category_id = ac.id
    WHERE a.id = ? OR a.slug = ?
  `).get(req.params.idOrSlug, req.params.idOrSlug);

  if (!article) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }

  // Related articles in same category
  const related = db.prepare(`
    SELECT id, title, slug, featured_image, excerpt, publication_date
    FROM articles
    WHERE category_id = ? AND id != ? AND is_published = 1
    ORDER BY publication_date DESC LIMIT 3
  `).all((article as any).category_id, (article as any).id);

  res.json({ article, related });
});

apiRouter.post('/articles', requireAdmin, (req, res) => {
  let { title, slug, category_id, author_name, featured_image, excerpt, content, publication_date, tags, is_published } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required' });
    return;
  }

  // Safe slug generation (supports English, Urdu, Arabic)
  let safeSlug = slug ? String(slug).trim() : '';
  if (!safeSlug) {
    safeSlug = String(title)
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `article-${Date.now()}`;
  }

  // Check if slug exists, if so append random suffix
  const existingSlug = db.prepare('SELECT id FROM articles WHERE slug = ?').get(safeSlug);
  if (existingSlug) {
    safeSlug = `${safeSlug}-${Date.now().toString().slice(-4)}`;
  }

  // Fallback for category_id if missing or non-existent
  let validCategoryId = category_id;
  const catRow = db.prepare('SELECT id FROM article_categories WHERE id = ?').get(category_id);
  if (!catRow) {
    const firstCat = db.prepare('SELECT id FROM article_categories LIMIT 1').get() as { id: string } | undefined;
    if (firstCat) {
      validCategoryId = firstCat.id;
    } else {
      validCategoryId = 'acat-islamic';
      db.prepare(`INSERT OR IGNORE INTO article_categories (id, name, slug, description, created_at) VALUES (?, ?, ?, ?, datetime('now'))`)
        .run(validCategoryId, 'Islamic Articles', 'islamic-articles', 'General Islamic articles and essays');
    }
  }

  const id = generateId('art');
  try {
    db.prepare(`
      INSERT INTO articles (id, title, slug, category_id, author_name, featured_image, excerpt, content, publication_date, tags, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(id, title, safeSlug, validCategoryId, author_name || 'Admin', featured_image || null, excerpt || '', content, publication_date || new Date().toISOString().split('T')[0], tags || '', is_published !== 0 ? 1 : 0);

    const created = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
    syncRecordToTurso('articles', created as any);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/articles/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  let { title, slug, category_id, author_name, featured_image, excerpt, content, publication_date, tags, is_published } = req.body;

  let safeSlug = slug ? String(slug).trim() : '';
  if (!safeSlug) {
    safeSlug = `article-${Date.now()}`;
  }
  const existingSlug = db.prepare('SELECT id FROM articles WHERE slug = ? AND id != ?').get(safeSlug, id);
  if (existingSlug) {
    safeSlug = `${safeSlug}-${Date.now().toString().slice(-4)}`;
  }

  let validCategoryId = category_id;
  const catRow = db.prepare('SELECT id FROM article_categories WHERE id = ?').get(category_id);
  if (!catRow) {
    const firstCat = db.prepare('SELECT id FROM article_categories LIMIT 1').get() as { id: string } | undefined;
    if (firstCat) validCategoryId = firstCat.id;
  }

  try {
    db.prepare(`
      UPDATE articles
      SET title = ?, slug = ?, category_id = ?, author_name = ?, featured_image = ?, excerpt = ?, content = ?, publication_date = ?, tags = ?, is_published = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(title, safeSlug, validCategoryId, author_name, featured_image, excerpt, content, publication_date, tags, is_published !== 0 ? 1 : 0, id);

    const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
    syncRecordToTurso('articles', updated as any);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/articles/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM user_bookmarks WHERE item_type = 'article' AND item_id = ?").run(id);
    db.prepare('DELETE FROM articles WHERE id = ?').run(id);
    syncDeleteFromTurso('articles', id);
    syncDeleteWhereFromTurso('user_bookmarks', "item_type = 'article' AND item_id = ?", [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete article' });
  }
});

// -------------------------------------------------------------
// AQWAAL & NASIHAT
// -------------------------------------------------------------
apiRouter.get('/aqwaal-categories', (_req, res) => {
  const rows = db.prepare('SELECT * FROM aqwaal_categories ORDER BY name ASC').all();
  res.json(rows);
});

apiRouter.post('/aqwaal-categories', requireAdmin, (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'Name and slug are required' });
    return;
  }
  const id = generateId('qcat');
  try {
    db.prepare(`
      INSERT INTO aqwaal_categories (id, name, slug, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(id, name, slug);
    const createdCat = { id, name, slug };
    syncRecordToTurso('aqwaal_categories', createdCat);
    res.status(201).json(createdCat);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/aqwaal-categories/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE aqwaal SET category_id = NULL WHERE category_id = ?').run(req.params.id);
  db.prepare('DELETE FROM aqwaal_categories WHERE id = ?').run(req.params.id);
  syncDeleteFromTurso('aqwaal_categories', req.params.id);
  res.json({ success: true });
});

apiRouter.get('/aqwaal', (req, res) => {
  const includeUnpublished = req.query.all === '1';
  const type = req.query.type as string | undefined; // 'Aqwaal' or 'Nasihat'
  const categoryId = req.query.category_id as string | undefined;
  const search = req.query.search ? `%${req.query.search}%` : null;

  let query = `
    SELECT q.*, sc.full_name as scholar_name, sc.honorific_title as scholar_title, qc.name as category_name
    FROM aqwaal q
    LEFT JOIN scholars sc ON q.scholar_id = sc.id
    LEFT JOIN aqwaal_categories qc ON q.category_id = qc.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (!includeUnpublished) {
    query += ' AND q.is_published = 1';
  }
  if (type) {
    query += ' AND q.type = ?';
    params.push(type);
  }
  if (categoryId) {
    query += ' AND q.category_id = ?';
    params.push(categoryId);
  }
  if (search) {
    query += ' AND (q.text LIKE ? OR q.attributed_to LIKE ? OR q.reference_source LIKE ?)';
    params.push(search, search, search);
  }

  query += ' ORDER BY q.created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

apiRouter.post('/aqwaal', requireAdmin, (req, res) => {
  const { text, type, scholar_id, attributed_to, category_id, reference_source, image_url, is_published } = req.body;
  if (!text || !type) {
    res.status(400).json({ error: 'Text and type (Aqwaal or Nasihat) are required' });
    return;
  }

  const id = generateId('qwl');
  db.prepare(`
    INSERT INTO aqwaal (id, text, type, scholar_id, attributed_to, category_id, reference_source, image_url, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(id, text, type, scholar_id || null, attributed_to || '', category_id || null, reference_source || '', image_url || null, is_published ? 1 : 0);

  const created = db.prepare('SELECT * FROM aqwaal WHERE id = ?').get(id);
  syncRecordToTurso('aqwaal', created as any);
  res.status(201).json(created);
});

apiRouter.put('/aqwaal/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { text, type, scholar_id, attributed_to, category_id, reference_source, image_url, is_published } = req.body;

  db.prepare(`
    UPDATE aqwaal
    SET text = ?, type = ?, scholar_id = ?, attributed_to = ?, category_id = ?, reference_source = ?, image_url = ?, is_published = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(text, type, scholar_id || null, attributed_to, category_id || null, reference_source, image_url, is_published ? 1 : 0, id);

  const updated = db.prepare('SELECT * FROM aqwaal WHERE id = ?').get(id);
  syncRecordToTurso('aqwaal', updated as any);
  res.json(updated);
});

apiRouter.delete('/aqwaal/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM user_bookmarks WHERE item_type = 'aqwaal' AND item_id = ?").run(id);
    db.prepare('DELETE FROM aqwaal WHERE id = ?').run(id);
    syncDeleteFromTurso('aqwaal', id);
    syncDeleteWhereFromTurso('user_bookmarks', "item_type = 'aqwaal' AND item_id = ?", [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete aqwaal' });
  }
});

// -------------------------------------------------------------
// SHAYARIYAN & SHARAH
// -------------------------------------------------------------
apiRouter.get('/shayariyan', (req, res) => {
  const includeUnpublished = req.query.all === '1';
  const search = req.query.search ? `%${req.query.search}%` : null;

  let query = 'SELECT * FROM shayariyan WHERE 1=1';
  const params: any[] = [];

  if (!includeUnpublished) {
    query += ' AND is_published = 1';
  }
  if (search) {
    query += ' AND (title LIKE ? OR poet_name LIKE ? OR poetry_text LIKE ? OR sharah LIKE ?)';
    params.push(search, search, search, search);
  }

  query += ' ORDER BY is_featured DESC, created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

apiRouter.get('/shayariyan/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM shayariyan WHERE id = ?').get(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Poetry record not found' });
    return;
  }
  res.json(item);
});

apiRouter.post('/shayariyan', requireAdmin, (req, res) => {
  const { title, poet_name, poet_image, poetry_text, sharah, category, language, publication_date, is_featured, is_published } = req.body;
  if (!title || !poet_name || !poetry_text) {
    res.status(400).json({ error: 'Title, poet name, and poetry text are required' });
    return;
  }

  const id = generateId('shyr');
  db.prepare(`
    INSERT INTO shayariyan (id, title, poet_name, poet_image, poetry_text, sharah, category, language, publication_date, is_featured, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(id, title, poet_name, poet_image || null, poetry_text, sharah || '', category || 'Naat / Manqabat', language || 'Urdu', publication_date || new Date().toISOString().split('T')[0], is_featured ? 1 : 0, is_published ? 1 : 0);

  const created = db.prepare('SELECT * FROM shayariyan WHERE id = ?').get(id);
  syncRecordToTurso('shayariyan', created as any);
  res.status(201).json(created);
});

apiRouter.put('/shayariyan/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, poet_name, poet_image, poetry_text, sharah, category, language, publication_date, is_featured, is_published } = req.body;

  db.prepare(`
    UPDATE shayariyan
    SET title = ?, poet_name = ?, poet_image = ?, poetry_text = ?, sharah = ?, category = ?, language = ?, publication_date = ?, is_featured = ?, is_published = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(title, poet_name, poet_image, poetry_text, sharah, category, language, publication_date, is_featured ? 1 : 0, is_published ? 1 : 0, id);

  const updated = db.prepare('SELECT * FROM shayariyan WHERE id = ?').get(id);
  syncRecordToTurso('shayariyan', updated as any);
  res.json(updated);
});

apiRouter.delete('/shayariyan/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM user_bookmarks WHERE item_type = 'shayariyan' AND item_id = ?").run(id);
    db.prepare('DELETE FROM shayariyan WHERE id = ?').run(id);
    syncDeleteFromTurso('shayariyan', id);
    syncDeleteWhereFromTurso('user_bookmarks', "item_type = 'shayariyan' AND item_id = ?", [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete shayariyan' });
  }
});

// -------------------------------------------------------------
// GLOBAL COMPREHENSIVE SEARCH
// -------------------------------------------------------------
apiRouter.get('/search', (req, res) => {
  const q = req.query.q as string;
  if (!q || q.trim().length < 2) {
    res.json({ scholars: [], speeches: [], reels: [], books: [], articles: [], aqwaal: [], shayariyan: [] });
    return;
  }

  const term = `%${q.trim()}%`;

  const scholars = db.prepare(`
    SELECT id, full_name, honorific_title, slug, profile_image, location
    FROM scholars
    WHERE is_published = 1 AND (full_name LIKE ? OR honorific_title LIKE ? OR biography LIKE ?)
    LIMIT 5
  `).all(term, term, term);

  const speeches = db.prepare(`
    SELECT sp.id, sp.title, sp.speech_type, sp.thumbnail, sp.upload_date, sc.full_name as scholar_name
    FROM speeches sp
    JOIN scholars sc ON sp.scholar_id = sc.id
    WHERE sp.is_published = 1 AND (sp.title LIKE ? OR sp.description LIKE ? OR sp.tags LIKE ? OR sc.full_name LIKE ?)
    LIMIT 6
  `).all(term, term, term, term);

  const reels = db.prepare(`
    SELECT r.id, r.title, r.video_url, r.thumbnail, sc.full_name as scholar_name
    FROM reels r
    JOIN scholars sc ON r.scholar_id = sc.id
    WHERE r.is_published = 1 AND (r.title LIKE ? OR r.description LIKE ? OR sc.full_name LIKE ?)
    LIMIT 6
  `).all(term, term, term);

  const books = db.prepare(`
    SELECT b.id, b.title, b.author_name, b.cover_image, bc.name as category_name
    FROM books b
    JOIN book_categories bc ON b.category_id = bc.id
    WHERE b.is_published = 1 AND (b.title LIKE ? OR b.author_name LIKE ? OR b.description LIKE ?)
    LIMIT 6
  `).all(term, term, term);

  const articles = db.prepare(`
    SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.publication_date, ac.name as category_name
    FROM articles a
    JOIN article_categories ac ON a.category_id = ac.id
    WHERE a.is_published = 1 AND (a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ? OR a.author_name LIKE ?)
    LIMIT 6
  `).all(term, term, term, term);

  const aqwaal = db.prepare(`
    SELECT q.id, q.text, q.type, q.attributed_to, sc.full_name as scholar_name
    FROM aqwaal q
    LEFT JOIN scholars sc ON q.scholar_id = sc.id
    WHERE q.is_published = 1 AND (q.text LIKE ? OR q.attributed_to LIKE ? OR q.reference_source LIKE ?)
    LIMIT 6
  `).all(term, term, term);

  const shayariyan = db.prepare(`
    SELECT s.id, s.title, s.poet_name, s.poetry_text
    FROM shayariyan s
    WHERE s.is_published = 1 AND (s.title LIKE ? OR s.poet_name LIKE ? OR s.poetry_text LIKE ? OR s.sharah LIKE ?)
    LIMIT 6
  `).all(term, term, term, term);

  res.json({
    scholars,
    speeches,
    reels,
    books,
    articles,
    aqwaal,
    shayariyan
  });
});

// -------------------------------------------------------------
// CONTACT US & INQUIRIES
// -------------------------------------------------------------
apiRouter.post('/contact', (req: Request, res: Response) => {
  const { full_name, email, phone, subject, message } = req.body;

  if (!full_name || !full_name.trim()) {
    res.status(400).json({ error: 'Please provide your full name' });
    return;
  }
  if (!email || !email.trim() || !email.includes('@')) {
    res.status(400).json({ error: 'Please provide a valid email address' });
    return;
  }
  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Message content cannot be empty' });
    return;
  }

  const id = generateId('msg');
  try {
    db.prepare(`
      INSERT INTO contact_messages (id, full_name, email, phone, subject, message, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `).run(id, full_name.trim(), email.trim().toLowerCase(), phone?.trim() || null, subject?.trim() || 'General Inquiry', message.trim());

    // Asynchronously dispatch email notification directly to website Gmail (alipyaare46@gmail.com)
    const targetAdminGmail = 'alipyaare46@gmail.com';
    try {
      fetch(`https://formsubmit.co/ajax/${targetAdminGmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `[MISHKAAT Message] ${subject?.trim() || 'Inquiry'} from ${full_name.trim()}`,
          name: full_name.trim(),
          email: email.trim(),
          phone: phone?.trim() || 'Not provided',
          subject: subject?.trim() || 'General Inquiry',
          message: message.trim(),
          sent_at: new Date().toISOString(),
          platform_source: 'MISHKAAT Platform (POWERED BY SYED ALI QALANDAR PEERZADE)'
        })
      }).catch((err) => {
        console.warn('Direct Gmail notification relay status:', err.message);
      });
    } catch (relayErr) {
      console.warn('Email dispatch warning:', relayErr);
    }

    const createdMsg = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
    if (createdMsg) syncRecordToTurso('contact_messages', createdMsg as any);

    res.status(201).json({
      success: true,
      message: `JazakAllah Khair! Your message has been safely received and immediately forwarded to website administration (${targetAdminGmail}).`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit contact message' });
  }
});

apiRouter.get('/contact-messages', requireAdmin, (_req: Request, res: Response) => {
  try {
    const messages = db.prepare(`
      SELECT * FROM contact_messages ORDER BY created_at DESC
    `).all();
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch contact messages' });
  }
});

apiRouter.put('/contact-messages/:id/read', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    db.prepare(`UPDATE contact_messages SET is_read = 1 WHERE id = ?`).run(id);
    const updatedMsg = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
    if (updatedMsg) syncRecordToTurso('contact_messages', updatedMsg as any);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update message status' });
  }
});

apiRouter.delete('/contact-messages/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
    syncDeleteFromTurso('contact_messages', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete message' });
  }
});

