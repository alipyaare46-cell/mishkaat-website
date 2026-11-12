import { createClient, Client } from '@libsql/client';
import { db } from './db';

// Fallback to the user's provided Turso credentials if not present in process.env
const TURSO_URL =
  process.env.TURSO_DATABASE_URL ||
  'libsql://mishkaat-db-librarian.aws-ap-southeast-1.turso.io';

const TURSO_TOKEN =
  process.env.TURSO_AUTH_TOKEN ||
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTQzNzk0MTUsImlkIjoiMDFhMWEyNjEtZTYwMS03MzhkLWFhNTktODcyNTQyOWIyYmUxIiwia2lkIjoidnY3RnFYb0NSZjN0MmluQmdoTXVvX2V1cE1hWnFBMWliU1J3Y1Q1Wmo5NCIsInJpZCI6IjdjYzljNzI2LTA2ZmItNDRjNy1iMWUzLWVmZjU0ODJjODFmOSJ9.w2MfAOOQVZosg_Ibm0FIwM_TVcrm6eA6FQXvXGPrDfzPfYdNAop8VunqEM2Ks0HarFMjjsYOqZtApsGeXmZWDQ';

let tursoClient: Client | null = null;
let isConnected = false;
let lastSyncTime: string | null = null;
let lastSyncError: string | null = null;

// Core synchronized tables
export const SYNC_TABLES = [
  'scholars',
  'speeches',
  'reels',
  'book_categories',
  'books',
  'article_categories',
  'articles',
  'aqwaal_categories',
  'aqwaal',
  'shayariyan',
  'website_settings',
  'admins',
  'users',
  'likes',
  'comments',
  'contact_messages'
];

export function getTursoClient(): Client | null {
  if (tursoClient) return tursoClient;
  if (!TURSO_URL || !TURSO_TOKEN) return null;

  try {
    tursoClient = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN
    });
    return tursoClient;
  } catch (err: any) {
    console.error('Failed to create Turso client:', err.message);
    return null;
  }
}

/**
 * Initialize Turso Cloud schema & perform initial sync on server boot
 */
export async function initTursoSync(): Promise<void> {
  const client = getTursoClient();
  if (!client) {
    console.log('[Turso] No Turso credentials provided; operating in local SQLite mode.');
    return;
  }

  try {
    console.log('[Turso] Connecting to Turso Cloud Database...');
    const testRes = await client.execute('SELECT 1 as connected');
    if (testRes.rows.length === 0) throw new Error('Turso connection returned empty result');
    isConnected = true;
    console.log('[Turso] Successfully connected to Turso Cloud (Singapore).');

    // Create tables on Turso if they don't exist yet
    await ensureTursoSchema(client);

    // Check if Turso has data. If yes, restore into local SQLite. If empty, seed Turso from local SQLite.
    const cloudScholars = await client.execute('SELECT count(*) as count FROM scholars');
    const cloudCount = Number(cloudScholars.rows[0]?.count || 0);

    if (cloudCount > 0) {
      console.log(`[Turso] Found ${cloudCount} scholars in Turso Cloud. Restoring local database from cloud...`);
      await syncDownFromTurso();
      console.log('[Turso] Local database restored seamlessly from Turso Cloud!');
    } else {
      console.log('[Turso] Turso Cloud is fresh/empty. Migrating local database to Turso Cloud...');
      await fullPushToTurso();
      console.log('[Turso] Initial migration to Turso Cloud complete! All data is permanently preserved.');
    }

    lastSyncTime = new Date().toISOString();
    lastSyncError = null;
  } catch (err: any) {
    isConnected = false;
    lastSyncError = err.message;
    console.error('[Turso] Sync initialization warning (local SQLite remains active):', err.message);
  }
}

/**
 * Ensure all necessary tables exist in Turso Cloud
 */
async function ensureTursoSchema(client: Client) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS scholars (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      honorific_title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      biography TEXT,
      profile_image TEXT,
      location TEXT,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS speeches (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      scholar_id TEXT NOT NULL,
      speech_type TEXT NOT NULL,
      description TEXT,
      thumbnail TEXT,
      media_url TEXT NOT NULL,
      duration TEXT,
      upload_date TEXT NOT NULL,
      tags TEXT,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS reels (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      scholar_id TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      thumbnail TEXT,
      duration TEXT,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS book_categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author_name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      cover_image TEXT,
      description TEXT,
      language TEXT DEFAULT 'Urdu',
      file_url TEXT,
      external_read_url TEXT,
      publication_details TEXT,
      allow_download INTEGER DEFAULT 1,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS article_categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category_id TEXT NOT NULL,
      author_name TEXT,
      featured_image TEXT,
      excerpt TEXT,
      content TEXT NOT NULL,
      publication_date TEXT NOT NULL,
      tags TEXT,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS aqwaal_categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS aqwaal (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      type TEXT NOT NULL,
      scholar_id TEXT,
      attributed_to TEXT,
      category_id TEXT NOT NULL,
      reference_source TEXT,
      image_url TEXT,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS shayariyan (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      poet_name TEXT NOT NULL,
      poet_image TEXT,
      poetry_text TEXT NOT NULL,
      sharah TEXT,
      category TEXT NOT NULL,
      language TEXT DEFAULT 'Urdu',
      publication_date TEXT NOT NULL,
      is_featured INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS website_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );`
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }
}

/**
 * Sync all latest data from Turso Cloud down into the local SQLite database
 */
export async function syncDownFromTurso(): Promise<void> {
  const client = getTursoClient();
  if (!client) return;

  for (const table of SYNC_TABLES) {
    try {
      const res = await client.execute(`SELECT * FROM ${table}`);
      if (res.rows.length === 0) {
        if (table !== 'admins' && table !== 'website_settings') {
          db.prepare(`DELETE FROM ${table}`).run();
        }
        continue;
      }

      db.transaction(() => {
        // Clear local table and refill with cloud source of truth
        db.prepare(`DELETE FROM ${table}`).run();

        const columns = res.columns;
        const placeholders = columns.map(() => '?').join(', ');
        const insertSql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        const stmt = db.prepare(insertSql);

        for (const row of res.rows) {
          const values = columns.map((col) => row[col]);
          stmt.run(...values);
        }
      })();
    } catch (err: any) {
      console.warn(`[Turso] Sync down warning for table ${table}:`, err.message);
    }
  }

  lastSyncTime = new Date().toISOString();
  lastSyncError = null;
}

/**
 * Push all local tables up to Turso Cloud
 */
export async function fullPushToTurso(): Promise<void> {
  const client = getTursoClient();
  if (!client) return;

  await ensureTursoSchema(client);

  for (const table of SYNC_TABLES) {
    try {
      const localRows = db.prepare(`SELECT * FROM ${table}`).all() as Record<string, any>[];

      // Always clear the remote table first so deletions and empty tables mirror perfectly
      await client.execute(`DELETE FROM ${table}`);

      if (localRows.length === 0) {
        continue;
      }

      const columns = Object.keys(localRows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

      // Batch in chunks of 50
      for (let i = 0; i < localRows.length; i += 50) {
        const batch = localRows.slice(i, i + 50);
        const batchStatements = batch.map((row) => ({
          sql,
          args: columns.map((col) => row[col] ?? null)
        }));
        await client.batch(batchStatements, 'write');
      }
    } catch (err: any) {
      console.warn(`[Turso] Push warning for table ${table}:`, err.message);
    }
  }

  lastSyncTime = new Date().toISOString();
  lastSyncError = null;
}

/**
 * Direct synchronous/awaitable sync of an individual insert/update to Turso Cloud
 */
export async function syncRecordToTurso(table: string, record: Record<string, any>): Promise<void> {
  const client = getTursoClient();
  if (!client) return;

  try {
    const columns = Object.keys(record);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const args = columns.map((col) => record[col] ?? null);
    await client.execute({ sql, args });
    lastSyncTime = new Date().toISOString();
  } catch (err: any) {
    console.error(`[Turso Sync Insert] Failed to sync ${table}:`, err.message);
    lastSyncError = err.message;
  }
}

/**
 * Direct synchronous/awaitable sync of an individual delete to Turso Cloud
 */
export async function syncDeleteFromTurso(table: string, id: string): Promise<void> {
  const client = getTursoClient();
  if (!client) return;

  try {
    await client.execute({
      sql: `DELETE FROM ${table} WHERE id = ?`,
      args: [id]
    });
    lastSyncTime = new Date().toISOString();
  } catch (err: any) {
    console.error(`[Turso Sync Delete] Failed to sync ${table}:`, err.message);
    lastSyncError = err.message;
  }
}

/**
 * Direct sync of delete with custom WHERE clause to Turso Cloud (for bookmarks/likes/comments)
 */
export async function syncDeleteWhereFromTurso(table: string, whereSql: string, args: any[]): Promise<void> {
  const client = getTursoClient();
  if (!client) return;

  try {
    await client.execute({
      sql: `DELETE FROM ${table} WHERE ${whereSql}`,
      args
    });
    lastSyncTime = new Date().toISOString();
  } catch (err: any) {
    console.error(`[Turso Sync DeleteWhere] Failed to sync ${table}:`, err.message);
  }
}

/**
 * Asynchronously sync an individual insert/update to Turso Cloud
 */
export function pushRecordToTursoAsync(table: string, record: Record<string, any>): void {
  syncRecordToTurso(table, record).catch(() => {});
}

/**
 * Asynchronously sync an individual delete to Turso Cloud
 */
export function pushDeleteToTursoAsync(table: string, id: string): void {
  syncDeleteFromTurso(table, id).catch(() => {});
}

/**
 * Export full JSON snapshot of all tables for backup
 */
export function exportDatabaseBackup(): Record<string, any[]> {
  const backup: Record<string, any[]> = {};
  for (const table of SYNC_TABLES) {
    try {
      backup[table] = db.prepare(`SELECT * FROM ${table}`).all();
    } catch {
      backup[table] = [];
    }
  }
  return backup;
}

/**
 * Restore from full JSON snapshot
 */
export async function restoreDatabaseBackup(backup: Record<string, any[]>): Promise<void> {
  db.transaction(() => {
    for (const [table, rows] of Object.entries(backup)) {
      if (!SYNC_TABLES.includes(table) || !Array.isArray(rows) || rows.length === 0) continue;
      db.prepare(`DELETE FROM ${table}`).run();
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const stmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
      for (const row of rows) {
        stmt.run(...columns.map((c) => row[c] ?? null));
      }
    }
  })();

  // Also push to Turso if connected
  await fullPushToTurso().catch(() => {});
}

export function getTursoStatus() {
  return {
    configured: Boolean(TURSO_URL && TURSO_TOKEN),
    connected: isConnected,
    tursoUrl: TURSO_URL.replace(/:\/\/.*@/, '://'), // sanitize
    lastSyncTime,
    lastSyncError
  };
}
