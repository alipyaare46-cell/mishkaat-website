import { Router, Request, Response } from 'express';
import {
  getTursoStatus,
  fullPushToTurso,
  syncDownFromTurso,
  exportDatabaseBackup,
  restoreDatabaseBackup
} from './turso';

export const cloudRouter = Router();

// Get real-time connection status of Turso Cloud Database
cloudRouter.get('/status', (_req: Request, res: Response) => {
  res.json(getTursoStatus());
});

// Force manual push: sync all current local records to Turso Cloud
cloudRouter.post('/sync-push', async (_req: Request, res: Response) => {
  try {
    await fullPushToTurso();
    res.json({ success: true, message: 'All local data synced up to Turso Cloud!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Force manual pull: restore all cloud records down to local database
cloudRouter.post('/sync-pull', async (_req: Request, res: Response) => {
  try {
    await syncDownFromTurso();
    res.json({ success: true, message: 'Data synced down from Turso Cloud!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Download complete offline JSON database backup (speeches, books, reels, etc.)
cloudRouter.get('/backup-download', (_req: Request, res: Response) => {
  try {
    const backup = exportDatabaseBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="mishkaat_backup_${Date.now()}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Restore database from uploaded JSON backup
cloudRouter.post('/backup-restore', async (req: Request, res: Response) => {
  try {
    const backup = req.body;
    if (!backup || typeof backup !== 'object') {
      res.status(400).json({ error: 'Invalid backup JSON payload' });
      return;
    }
    await restoreDatabaseBackup(backup);
    res.json({ success: true, message: 'Database restored successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clear sample/dummy speeches, reels, books, and articles on demand
cloudRouter.post('/clear-sample-data', async (_req: Request, res: Response) => {
  try {
    const { db } = await import('./db');
    const { fullPushToTurso } = await import('./turso');
    // Delete only known hardcoded demo IDs, never touch user uploads
    db.prepare(`DELETE FROM speeches WHERE id IN ('sp_seerat_un_nabi', 'sp_azmat_e_ahle_bait', 'sp_tarbiyat_e_aulad')`).run();
    db.prepare(`DELETE FROM reels WHERE id LIKE 'reel_%'`).run();
    db.prepare(`DELETE FROM books WHERE id LIKE 'bk_%'`).run();
    db.prepare(`DELETE FROM articles WHERE id LIKE 'art_%'`).run();
    db.prepare(`DELETE FROM aqwaal WHERE id LIKE 'q_%'`).run();
    db.prepare(`DELETE FROM shayariyan WHERE id LIKE 'sh_%'`).run();
    // Sync clean state to Turso
    await fullPushToTurso().catch(() => {});
    res.json({ success: true, message: 'Sample demo content cleared! All manual user uploads are permanently preserved.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

