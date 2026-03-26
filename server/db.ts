import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const DATA_DIR = path.resolve(process.cwd(), 'data')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const dbCache = new Map<string, Database.Database>()

function getDbPath(slug: string): string {
  return path.join(DATA_DIR, `${slug}.db`)
}

export function getDb(slug: string): Database.Database {
  if (dbCache.has(slug)) return dbCache.get(slug)!

  const dbPath = getDbPath(slug)
  const isNew = !fs.existsSync(dbPath)
  const db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  if (isNew) {
    initializeDb(db, slug)
  }

  dbCache.set(slug, db)
  return db
}

export function tenantExists(slug: string): boolean {
  return fs.existsSync(getDbPath(slug))
}

export function listTenants(): { slug: string; name: string; year: number }[] {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.db'))
  return files.map(f => {
    const slug = f.replace('.db', '')
    try {
      const db = getDb(slug)
      const meta = db.prepare('SELECT name, year FROM tenant_meta LIMIT 1').get() as { name: string; year: number } | undefined
      return { slug, name: meta?.name || slug, year: meta?.year || new Date().getFullYear() }
    } catch {
      return { slug, name: slug, year: new Date().getFullYear() }
    }
  })
}

export function createTenantDb(slug: string, name: string, year: number): void {
  const dbPath = getDbPath(slug)
  if (fs.existsSync(dbPath)) throw new Error('Bu slug zaten mevcut.')

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  initializeDb(db, slug, name, year)
  dbCache.set(slug, db)
}

export function deleteTenantDb(slug: string): void {
  if (dbCache.has(slug)) {
    dbCache.get(slug)!.close()
    dbCache.delete(slug)
  }
  const dbPath = getDbPath(slug)
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath)
    // Also remove WAL/SHM files
    if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal')
    if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm')
  }
}

function initializeDb(db: Database.Database, slug: string, name?: string, year?: number): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      logo_url TEXT,
      year INTEGER NOT NULL DEFAULT ${new Date().getFullYear()}
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6B7280',
      bg_color TEXT NOT NULL DEFAULT '#F3F4F6',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
      week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 5),
      title TEXT NOT NULL,
      description TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT,
      action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'moved')),
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cards_month ON cards(month, week);
    CREATE INDEX IF NOT EXISTS idx_activity_card ON activity_log(card_id);
  `)

  // Seed meta
  const metaName = name || slug
  const metaYear = year || new Date().getFullYear()
  db.prepare('INSERT OR IGNORE INTO tenant_meta (id, slug, name, year) VALUES (1, ?, ?, ?)').run(slug, metaName, metaYear)

  // Seed default categories
  const catCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c
  if (catCount === 0) {
    const insert = db.prepare('INSERT INTO categories (name, color, bg_color, sort_order) VALUES (?, ?, ?, ?)')
    insert.run('Detaylandirilmasi gereken genel baslik', '#10B981', '#D1FAE5', 1)
    insert.run('Yeni eklenen ozel gun onerileri', '#F97316', '#FFEDD5', 2)
    insert.run('Mevcut ic iletisim ve IK icerikleri', '#EF4444', '#FEE2E2', 3)
    insert.run('Ic iletisime konu edilebilir olanlar', '#3B82F6', '#DBEAFE', 4)
    insert.run('Rutin ve Operasyonel Iletisimler', '#6B7280', '#F3F4F6', 5)
  }

  // Seed admin user if no users exist
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  if (userCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10)
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@demo.com', hash, 'admin')
  }
}
