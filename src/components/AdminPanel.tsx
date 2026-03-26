import { useState, useEffect } from 'react'
import { X, UserPlus, Trash2, Key, Users, Shield, Building2, Plus, ExternalLink } from 'lucide-react'
import type { User, Role } from '../types'
import { getUsers, createUser, deleteUser, changePassword, getTenants, createTenant, deleteTenant } from '../lib/api'

interface Props {
  token: string
  currentUser: User
  onClose: () => void
  onToast: (msg: string, type: 'success' | 'error') => void
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
}

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}

type Tab = 'brands' | 'users' | 'password'

export function AdminPanel({ token, currentUser, onClose, onToast }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<{ slug: string; name: string; year: number }[]>([])
  const [tab, setTab] = useState<Tab>('brands')
  const [showUserForm, setShowUserForm] = useState(false)
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'editor' as Role })
  const [brandForm, setBrandForm] = useState({ name: '', slug: '', year: new Date().getFullYear() })
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUsers()
    loadTenants()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await getUsers(token)
      setUsers(data)
    } catch {
      onToast('Kullanıcılar yüklenemedi', 'error')
    }
  }

  const loadTenants = async () => {
    try {
      const data = await getTenants()
      setTenants(data)
    } catch {
      onToast('Markalar yüklenemedi', 'error')
    }
  }

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandForm.name || !brandForm.slug) return
    setSaving(true)
    try {
      await createTenant(token, brandForm)
      onToast(`"${brandForm.name}" markası eklendi`, 'success')
      setBrandForm({ name: '', slug: '', year: new Date().getFullYear() })
      setShowBrandForm(false)
      loadTenants()
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Marka oluşturulamadı', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBrand = async (slug: string, name: string) => {
    try {
      await deleteTenant(token, slug)
      onToast(`"${name}" silindi`, 'success')
      loadTenants()
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Silinemedi', 'error')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userForm.name || !userForm.email || !userForm.password) return
    setSaving(true)
    try {
      await createUser(token, userForm)
      onToast(`${userForm.name} başarıyla eklendi`, 'success')
      setUserForm({ name: '', email: '', password: '', role: 'editor' })
      setShowUserForm(false)
      loadUsers()
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Hata oluştu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser.id) {
      onToast('Kendinizi silemezsiniz', 'error')
      return
    }
    try {
      await deleteUser(token, user.id)
      onToast(`${user.name} silindi`, 'success')
      loadUsers()
    } catch {
      onToast('Kullanıcı silinemedi', 'error')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      onToast('Şifreler eşleşmiyor', 'error')
      return
    }
    if (pwForm.newPassword.length < 6) {
      onToast('Şifre en az 6 karakter olmalı', 'error')
      return
    }
    setSaving(true)
    try {
      await changePassword(token, currentUser.id, pwForm.oldPassword, pwForm.newPassword)
      onToast('Şifre başarıyla değiştirildi', 'success')
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch {
      onToast('Şifre değiştirilemedi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const currentSlug = import.meta.env.VITE_TENANT_SLUG || 'demo'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="animate-slide-up bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold text-text font-[family-name:var(--font-heading)] flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            Yönetim Paneli
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5">
          {([
            { key: 'brands' as Tab, icon: Building2, label: 'Markalar' },
            { key: 'users' as Tab, icon: Users, label: 'Kullanıcılar' },
            { key: 'password' as Tab, icon: Key, label: 'Şifre Değiştir' },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                tab === key ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text'
              }`}
            >
              <Icon size={14} className="inline mr-1.5 -mt-0.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* === BRANDS === */}
          {tab === 'brands' && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setShowBrandForm(!showBrandForm)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors self-start"
              >
                <Plus size={14} /> Yeni Marka Ekle
              </button>

              {showBrandForm && (
                <form onSubmit={handleCreateBrand} className="bg-surface-alt rounded-lg p-4 flex flex-col gap-3 border border-border">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Marka Adı</label>
                    <input
                      type="text"
                      value={brandForm.name}
                      onChange={e => {
                        const name = e.target.value
                        setBrandForm(p => ({ ...p, name, slug: slugify(name) }))
                      }}
                      placeholder="Örnek Şirket A.Ş."
                      required
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Slug (subdomain)
                      <span className="text-text-muted font-normal ml-1">— {brandForm.slug || '...'}.yillikplan.ahmetgo.com</span>
                    </label>
                    <input
                      type="text"
                      value={brandForm.slug}
                      onChange={e => setBrandForm(p => ({ ...p, slug: slugify(e.target.value) }))}
                      placeholder="ornek-sirket"
                      required
                      pattern="[a-z0-9\-]+"
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm outline-none focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Yıl</label>
                    <input
                      type="number"
                      value={brandForm.year}
                      onChange={e => setBrandForm(p => ({ ...p, year: Number(e.target.value) }))}
                      min={2024}
                      max={2030}
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowBrandForm(false)} className="px-3 py-1.5 text-xs text-text-secondary">Vazgeç</button>
                    <button type="submit" disabled={saving} className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50">
                      {saving ? 'Ekleniyor...' : 'Oluştur'}
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-col gap-2">
                {tenants.map(t => (
                  <div key={t.slug} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center text-sm font-bold text-navy">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">{t.name}</p>
                        <p className="text-xs text-text-muted font-mono">{t.slug}.yillikplan.ahmetgo.com &middot; {t.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.slug === currentSlug && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700">Aktif</span>
                      )}
                      <a
                        href={`https://${t.slug}.yillikplan.ahmetgo.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-surface-alt text-text-muted hover:text-primary transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                      {t.slug !== 'demo' && t.slug !== currentSlug && (
                        <button
                          onClick={() => handleDeleteBrand(t.slug, t.name)}
                          className="p-1.5 rounded hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {tenants.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-4">Henüz marka eklenmemiş.</p>
                )}
              </div>
            </div>
          )}

          {/* === USERS === */}
          {tab === 'users' && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setShowUserForm(!showUserForm)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors self-start"
              >
                <UserPlus size={14} /> Yeni Kullanıcı Ekle
              </button>

              {showUserForm && (
                <form onSubmit={handleCreateUser} className="bg-surface-alt rounded-lg p-4 flex flex-col gap-3 border border-border">
                  <input type="text" value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} placeholder="Ad Soyad" required className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm outline-none focus:border-primary" />
                  <input type="email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" required className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm outline-none focus:border-primary" />
                  <input type="password" value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} placeholder="Şifre (min. 6 karakter)" required minLength={6} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm outline-none focus:border-primary" />
                  <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value as Role }))} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm outline-none focus:border-primary">
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowUserForm(false)} className="px-3 py-1.5 text-xs text-text-secondary">Vazgeç</button>
                    <button type="submit" disabled={saving} className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50">
                      {saving ? 'Ekleniyor...' : 'Ekle'}
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-col gap-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-xs font-bold text-text-secondary">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">{u.name}</p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                      {u.id !== currentUser.id && (
                        <button onClick={() => handleDeleteUser(u)} className="p-1.5 rounded hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === PASSWORD === */}
          {tab === 'password' && (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-sm">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Mevcut Şifre</label>
                <input type="password" value={pwForm.oldPassword} onChange={e => setPwForm(p => ({ ...p, oldPassword: e.target.value }))} required className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Yeni Şifre</label>
                <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required minLength={6} className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Yeni Şifre (Tekrar)</label>
                <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} required minLength={6} className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary" />
              </div>
              <button type="submit" disabled={saving} className="self-start px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
