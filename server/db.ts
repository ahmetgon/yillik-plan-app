import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const DATA_DIR = path.resolve(process.cwd(), 'data')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const dbCache = new Map<string, Database.Database>()
let globalDb: Database.Database | null = null

function getDbPath(slug: string): string {
  return path.join(DATA_DIR, `${slug}.db`)
}

// ===== GLOBAL DB (users & permissions) =====
export function getGlobalDb(): Database.Database {
  if (globalDb) return globalDb

  const dbPath = path.join(DATA_DIR, '_global.db')
  const isNew = !fs.existsSync(dbPath)
  globalDb = new Database(dbPath)
  globalDb.pragma('journal_mode = WAL')
  globalDb.pragma('foreign_keys = ON')

  if (isNew) {
    initializeGlobalDb(globalDb)
  }

  return globalDb
}

function initializeGlobalDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tenant_slug TEXT NOT NULL,
      UNIQUE(user_id, tenant_slug)
    );

    CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON user_tenants(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON user_tenants(tenant_slug);
  `)

  // Seed admin user
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  if (userCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10)
    const result = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@demo.com', hash, 'admin')
    // Admin gets access to demo tenant
    db.prepare('INSERT INTO user_tenants (user_id, tenant_slug) VALUES (?, ?)').run(result.lastInsertRowid, 'demo')
  }
}

// Migrate: import users from old tenant DBs into global DB
export function migrateUsersToGlobal(): void {
  const gdb = getGlobalDb()
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.db') && f !== '_global.db')

  for (const file of files) {
    const slug = file.replace('.db', '')
    try {
      const tdb = getDb(slug)
      const users = tdb.prepare('SELECT * FROM users').all() as any[]

      for (const u of users) {
        // Check if email already exists in global DB
        const existing = gdb.prepare('SELECT id FROM users WHERE email = ?').get(u.email) as { id: number } | undefined
        let userId: number

        if (existing) {
          userId = existing.id
        } else {
          const result = gdb.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(u.name, u.email, u.password_hash, u.role)
          userId = result.lastInsertRowid as number
        }

        // Add tenant assignment if not exists
        const hasAssignment = gdb.prepare('SELECT 1 FROM user_tenants WHERE user_id = ? AND tenant_slug = ?').get(userId, slug)
        if (!hasAssignment) {
          gdb.prepare('INSERT INTO user_tenants (user_id, tenant_slug) VALUES (?, ?)').run(userId, slug)
        }
      }
    } catch {
      // Skip if tenant DB has issues
    }
  }
}

// ===== TENANT DB (cards, categories, etc.) =====
export function getDb(slug: string): Database.Database {
  if (dbCache.has(slug)) return dbCache.get(slug)!

  const dbPath = getDbPath(slug)
  const isNew = !fs.existsSync(dbPath)
  const db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  if (isNew) {
    initializeTenantDb(db, slug)
  }

  // Migration: add year column to cards if missing
  migrateTenantDb(db)

  dbCache.set(slug, db)
  return db
}

function migrateTenantDb(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(cards)").all() as { name: string }[]
  if (!cols.some(c => c.name === 'year')) {
    db.exec(`ALTER TABLE cards ADD COLUMN year INTEGER NOT NULL DEFAULT ${new Date().getFullYear()}`)
  }

  // Fix Turkish characters in categories (runs on every open to catch old DBs)
  const turkishFixes: [string, string][] = [
    ['Detaylandirilmasi gereken genel baslik', 'Detaylandırılması gereken genel başlık'],
    ['Yeni eklenen ozel gun onerileri', 'Yeni eklenen özel gün önerileri'],
    ['Mevcut ic iletisim ve IK icerikleri', 'Mevcut iç iletişim ve İK içerikleri'],
    ['Ic iletisime konu edilebilir olanlar', 'İç iletişime konu edilebilir olanlar'],
    ['Rutin ve Operasyonel Iletisimler', 'Rutin ve operasyonel iletişimler'],
    ['Rutin ve Operasyonel İletişimler', 'Rutin ve operasyonel iletişimler'],
  ]
  const updateCat = db.prepare('UPDATE categories SET name = ? WHERE name = ?')
  for (const [oldName, newName] of turkishFixes) {
    updateCat.run(newName, oldName)
  }
}

export function tenantExists(slug: string): boolean {
  return fs.existsSync(getDbPath(slug))
}

export function listTenants(): { slug: string; name: string; year: number }[] {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.db') && f !== '_global.db')
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
  initializeTenantDb(db, slug, name, year)
  dbCache.set(slug, db)
}

export function deleteTenantDb(slug: string): void {
  // Remove user-tenant assignments
  const gdb = getGlobalDb()
  gdb.prepare('DELETE FROM user_tenants WHERE tenant_slug = ?').run(slug)

  if (dbCache.has(slug)) {
    dbCache.get(slug)!.close()
    dbCache.delete(slug)
  }
  const dbPath = getDbPath(slug)
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath)
    if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal')
    if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm')
  }
}

function initializeTenantDb(db: Database.Database, slug: string, name?: string, year?: number): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      logo_url TEXT,
      year INTEGER NOT NULL DEFAULT ${new Date().getFullYear()}
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
      year INTEGER NOT NULL DEFAULT ${new Date().getFullYear()},
      month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
      week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 5),
      title TEXT NOT NULL,
      description TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'moved')),
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cards_year_month ON cards(year, month, week);
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
    insert.run('Detaylandırılması gereken genel başlık', '#10B981', '#D1FAE5', 1)
    insert.run('Yeni eklenen özel gün önerileri', '#F97316', '#FFEDD5', 2)
    insert.run('Mevcut iç iletişim ve İK içerikleri', '#EF4444', '#FEE2E2', 3)
    insert.run('İç iletişime konu edilebilir olanlar', '#3B82F6', '#DBEAFE', 4)
    insert.run('Rutin ve operasyonel iletişimler', '#6B7280', '#F3F4F6', 5)
  }

  // Fix Turkish characters in existing categories
  const turkishFixes: [string, string][] = [
    ['Detaylandirilmasi gereken genel baslik', 'Detaylandırılması gereken genel başlık'],
    ['Yeni eklenen ozel gun onerileri', 'Yeni eklenen özel gün önerileri'],
    ['Mevcut ic iletisim ve IK icerikleri', 'Mevcut iç iletişim ve İK içerikleri'],
    ['Ic iletisime konu edilebilir olanlar', 'İç iletişime konu edilebilir olanlar'],
    ['Rutin ve Operasyonel Iletisimler', 'Rutin ve operasyonel iletişimler'],
    ['Rutin ve Operasyonel İletişimler', 'Rutin ve operasyonel iletişimler'],
  ]
  const updateCat = db.prepare('UPDATE categories SET name = ? WHERE name = ?')
  for (const [oldName, newName] of turkishFixes) {
    updateCat.run(newName, oldName)
  }
}
