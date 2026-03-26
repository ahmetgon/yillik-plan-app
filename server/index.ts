import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDb, getGlobalDb, tenantExists, listTenants, createTenantDb, deleteTenantDb, migrateUsersToGlobal } from './db.js'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env.PORT || '3070', 10)

app.use(cors())
app.use(express.json())

// Serve static frontend in production
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

// Resolve tenant slug from X-Tenant header or query param
function getTenantSlug(req: express.Request): string {
  return (req.headers['x-tenant'] as string) || (req.query.tenant as string) || 'demo'
}

function ensureTenant(req: express.Request, res: express.Response): ReturnType<typeof getDb> | null {
  const slug = getTenantSlug(req)
  if (!tenantExists(slug)) {
    res.status(404).json({ error: `Tenant "${slug}" bulunamadı.` })
    return null
  }
  return getDb(slug)
}

// ===== AUTH (global) =====
app.post('/api/login', (req, res) => {
  const gdb = getGlobalDb()
  const { email, password } = req.body
  const user = gdb.prepare('SELECT * FROM users WHERE email = ?').get(email) as any
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email veya şifre hatalı.' })
  }

  // Get user's tenant assignments
  const tenants = gdb.prepare('SELECT tenant_slug FROM user_tenants WHERE user_id = ?').all(user.id) as { tenant_slug: string }[]
  const { password_hash, ...safeUser } = user
  res.json({
    token: `global:${user.id}:${Date.now()}`,
    user: { ...safeUser, tenants: tenants.map(t => t.tenant_slug) },
  })
})

app.post('/api/change-password', (req, res) => {
  const gdb = getGlobalDb()
  const { user_id, old_password, new_password } = req.body
  const user = gdb.prepare('SELECT * FROM users WHERE id = ?').get(user_id) as any
  if (!user || !bcrypt.compareSync(old_password, user.password_hash)) {
    return res.status(400).json({ error: 'Mevcut şifre hatalı.' })
  }

  const hash = bcrypt.hashSync(new_password, 10)
  gdb.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user_id)
  res.json({ ok: true })
})

// ===== TENANTS (global) =====
app.get('/api/tenants', (_req, res) => {
  res.json(listTenants())
})

app.post('/api/tenants', (req, res) => {
  const { slug, name, year } = req.body
  if (!slug || !name) return res.status(400).json({ error: 'slug ve name gerekli.' })
  try {
    createTenantDb(slug, name, year || new Date().getFullYear())
    // Give all admins access to new tenant
    const gdb = getGlobalDb()
    const admins = gdb.prepare("SELECT id FROM users WHERE role = 'admin'").all() as { id: number }[]
    const insert = gdb.prepare('INSERT OR IGNORE INTO user_tenants (user_id, tenant_slug) VALUES (?, ?)')
    for (const admin of admins) {
      insert.run(admin.id, slug)
    }
    res.json({ slug, name, year })
  } catch (err: any) {
    res.status(409).json({ error: err.message })
  }
})

app.delete('/api/tenants/:slug', (req, res) => {
  const { slug } = req.params
  if (slug === 'demo') return res.status(400).json({ error: 'Demo tenant silinemez.' })
  try {
    deleteTenantDb(slug)
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ===== USERS (global) =====
app.get('/api/users', (_req, res) => {
  const gdb = getGlobalDb()
  const users = gdb.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name ASC').all() as any[]

  // Attach tenant assignments
  const stmt = gdb.prepare('SELECT tenant_slug FROM user_tenants WHERE user_id = ?')
  const result = users.map(u => ({
    ...u,
    tenants: (stmt.all(u.id) as { tenant_slug: string }[]).map(t => t.tenant_slug),
  }))

  res.json(result)
})

app.post('/api/users', (req, res) => {
  const gdb = getGlobalDb()
  const { name, email, password, role, tenants } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password gerekli.' })

  const hash = bcrypt.hashSync(password, 10)
  try {
    const result = gdb.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(name, email, hash, role || 'editor')
    const userId = result.lastInsertRowid as number

    // Assign tenants
    if (tenants && Array.isArray(tenants)) {
      const insert = gdb.prepare('INSERT OR IGNORE INTO user_tenants (user_id, tenant_slug) VALUES (?, ?)')
      for (const slug of tenants) {
        insert.run(userId, slug)
      }
    }

    const user = gdb.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(userId) as any
    const userTenants = gdb.prepare('SELECT tenant_slug FROM user_tenants WHERE user_id = ?').all(userId) as { tenant_slug: string }[]
    res.json({ ...user, tenants: userTenants.map(t => t.tenant_slug) })
  } catch (err: any) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Bu email zaten kayıtlı.' })
    }
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/users/:id', (req, res) => {
  const gdb = getGlobalDb()
  const userId = Number(req.params.id)
  const { tenants } = req.body

  if (tenants && Array.isArray(tenants)) {
    // Replace tenant assignments
    gdb.prepare('DELETE FROM user_tenants WHERE user_id = ?').run(userId)
    const insert = gdb.prepare('INSERT INTO user_tenants (user_id, tenant_slug) VALUES (?, ?)')
    for (const slug of tenants) {
      insert.run(userId, slug)
    }
  }

  const user = gdb.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(userId) as any
  const userTenants = gdb.prepare('SELECT tenant_slug FROM user_tenants WHERE user_id = ?').all(userId) as { tenant_slug: string }[]
  res.json({ ...user, tenants: userTenants.map(t => t.tenant_slug) })
})

app.delete('/api/users/:id', (req, res) => {
  const gdb = getGlobalDb()
  gdb.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ===== CATEGORIES (per tenant) =====
app.get('/api/categories', (req, res) => {
  const db = ensureTenant(req, res)
  if (!db) return
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all())
})

// ===== CARDS (per tenant) =====
app.get('/api/cards', (req, res) => {
  const db = ensureTenant(req, res)
  if (!db) return
  const year = req.query.year ? Number(req.query.year) : null
  if (year) {
    res.json(db.prepare('SELECT * FROM cards WHERE year = ? ORDER BY month ASC, week ASC, sort_order ASC').all(year))
  } else {
    res.json(db.prepare('SELECT * FROM cards ORDER BY year ASC, month ASC, week ASC, sort_order ASC').all())
  }
})

app.post('/api/cards', (req, res) => {
  const db = ensureTenant(req, res)
  if (!db) return

  const { year, month, week, title, description, category_id, sort_order, created_by } = req.body
  if (!title || !month || !week) return res.status(400).json({ error: 'title, month, week gerekli.' })

  const cardYear = year || new Date().getFullYear()
  const result = db.prepare(
    'INSERT INTO cards (year, month, week, title, description, category_id, sort_order, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(cardYear, month, week, title, description || null, category_id || null, sort_order || 0, created_by || null, created_by || null)

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(result.lastInsertRowid)
  res.json(card)
})

app.patch('/api/cards/:id', (req, res) => {
  const db = ensureTenant(req, res)
  if (!db) return

  const { title, description, category_id, year, month, week, sort_order, updated_by } = req.body
  const fields: string[] = []
  const values: any[] = []

  if (title !== undefined) { fields.push('title = ?'); values.push(title) }
  if (description !== undefined) { fields.push('description = ?'); values.push(description) }
  if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id) }
  if (year !== undefined) { fields.push('year = ?'); values.push(year) }
  if (month !== undefined) { fields.push('month = ?'); values.push(month) }
  if (week !== undefined) { fields.push('week = ?'); values.push(week) }
  if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order) }
  if (updated_by !== undefined) { fields.push('updated_by = ?'); values.push(updated_by) }

  fields.push("updated_at = datetime('now')")
  values.push(req.params.id)

  db.prepare(`UPDATE cards SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id)
  res.json(card)
})

app.delete('/api/cards/:id', (req, res) => {
  const db = ensureTenant(req, res)
  if (!db) return
  db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ===== ACTIVITY LOG (per tenant) =====
app.get('/api/activity/:cardId', (req, res) => {
  const db = ensureTenant(req, res)
  if (!db) return
  const logs = db.prepare('SELECT * FROM activity_log WHERE card_id = ? ORDER BY created_at DESC LIMIT 50').all(req.params.cardId)
  res.json(logs)
})

app.post('/api/activity', (req, res) => {
  const db = ensureTenant(req, res)
  if (!db) return

  const { card_id, user_id, user_name, action, details } = req.body
  db.prepare('INSERT INTO activity_log (card_id, user_id, user_name, action, details) VALUES (?, ?, ?, ?, ?)').run(
    card_id, user_id || null, user_name || null, action, details || null
  )
  res.json({ ok: true })
})

// ===== TENANT META (per tenant) =====
app.get('/api/meta', (req, res) => {
  const db = ensureTenant(req, res)
  if (!db) return
  const meta = db.prepare('SELECT * FROM tenant_meta WHERE id = 1').get()
  res.json(meta || null)
})

// SPA fallback — serve index.html for non-API routes
app.get('{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// Auto-create demo tenant on first run
if (!tenantExists('demo')) {
  createTenantDb('demo', 'Demo Marka', new Date().getFullYear())
  console.log('Demo tenant created with admin@demo.com / admin123')
}

// Initialize global DB and migrate existing users
getGlobalDb()
migrateUsersToGlobal()

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})
