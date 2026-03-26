import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, Plus, Trash2, UserPlus, Calendar, Key, LogOut, Pencil, Check, X } from 'lucide-react'
import type { User, Role } from '../types'
import * as api from '../lib/api'

interface Props {
  token: string
  user: User
  onLogout: () => void
  onToast: (msg: string, type: 'success' | 'error') => void
}

type Tab = 'brands' | 'users' | 'password'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function Dashboard({ token, user, onLogout, onToast }: Props) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('brands')
  const [tenants, setTenants] = useState<{ slug: string; name: string; year: number }[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Brand form
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [brandForm, setBrandForm] = useState({ name: '', slug: '', year: new Date().getFullYear() })

  // User form
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'editor' as string, tenants: [] as string[] })

  // Edit user tenants
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editTenants, setEditTenants] = useState<string[]>([])

  // Password form
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [t, u] = await Promise.all([api.getTenants(), api.getUsers(token)])
      setTenants(t)
      setUsers(u)
    } catch {
      const t = await api.getTenants()
      setTenants(t)
    }
    setLoading(false)
  }

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createTenant(token, brandForm)
      onToast(`"${brandForm.name}" markası eklendi`, 'success')
      setBrandForm({ name: '', slug: '', year: new Date().getFullYear() })
      setShowBrandForm(false)
      loadData()
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Marka oluşturulamadı', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBrand = async (slug: string) => {
    if (!confirm(`"${slug}" markasını silmek istediğinize emin misiniz?`)) return
    try {
      await api.deleteTenant(token, slug)
      onToast('Marka silindi', 'success')
      loadData()
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Silinemedi', 'error')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createUser(token, userForm)
      onToast(`${userForm.name} başarıyla eklendi`, 'success')
      setUserForm({ name: '', email: '', password: '', role: 'editor', tenants: [] })
      setShowUserForm(false)
      loadData()
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Hata oluştu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (u: User) => {
    if (u.id === user.id) return onToast('Kendinizi silemezsiniz', 'error')
    if (!confirm(`"${u.name}" kullanıcısını silmek istediğinize emin misiniz?`)) return
    try {
      await api.deleteUser(token, u.id)
      onToast(`${u.name} silindi`, 'success')
      loadData()
    } catch {
      onToast('Kullanıcı silinemedi', 'error')
    }
  }

  const startEditTenants = (u: User) => {
    setEditingUserId(u.id)
    setEditTenants([...(u.tenants || [])])
  }

  const saveEditTenants = async () => {
    if (editingUserId === null) return
    try {
      await api.updateUser(token, editingUserId, { tenants: editTenants })
      onToast('Marka yetkileri güncellendi', 'success')
      setEditingUserId(null)
      loadData()
    } catch {
      onToast('Güncellenemedi', 'error')
    }
  }

  const toggleTenant = (slug: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(slug)) {
      setter(list.filter(s => s !== slug))
    } else {
      setter([...list, slug])
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
      await api.changePassword(token, user.id, pwForm.oldPassword, pwForm.newPassword)
      onToast('Şifre başarıyla değiştirildi', 'success')
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch {
      onToast('Şifre değiştirilemedi', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="bg-navy text-white shadow-lg">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Calendar size={20} className="text-primary-light" />
            </div>
            <div>
              <h1 className="text-base font-bold font-[family-name:var(--font-heading)] leading-tight">
                Yıllık Plan <span className="text-white/40 font-normal">x</span> Rhino Runner
              </h1>
              <p className="text-xs text-white/50">Yönetim Paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-white/70">{user.name}</span>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              title="Çıkış Yap"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-[1200px] mx-auto px-4 sm:px-6 py-6 w-full">
        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          {([
            { key: 'brands' as Tab, icon: Building2, label: 'Markalar' },
            { key: 'users' as Tab, icon: Users, label: 'Kullanıcılar' },
            { key: 'password' as Tab, icon: Key, label: 'Şifre Değiştir' },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Brands Tab */}
        {tab === 'brands' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">Markalar</h2>
              <button
                onClick={() => setShowBrandForm(!showBrandForm)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Plus size={16} /> Yeni Marka
              </button>
            </div>

            {showBrandForm && (
              <form onSubmit={handleCreateBrand} className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Slug (URL)</label>
                    <input
                      type="text"
                      value={brandForm.slug}
                      onChange={e => setBrandForm(p => ({ ...p, slug: e.target.value }))}
                      placeholder="ornek-sirket"
                      required
                      className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Yıl</label>
                    <input
                      type="number"
                      value={brandForm.year}
                      onChange={e => setBrandForm(p => ({ ...p, year: Number(e.target.value) }))}
                      required
                      className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowBrandForm(false)} className="px-4 py-2 text-sm text-text-secondary">Vazgeç</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50">
                    {saving ? 'Ekleniyor...' : 'Oluştur'}
                  </button>
                </div>
              </form>
            )}

            {/* Brand Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map(t => (
                <div
                  key={t.slug}
                  className="group bg-white rounded-xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => navigate(`/${t.slug}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 size={20} className="text-primary" />
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteBrand(t.slug) }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-all"
                      title="Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-text mb-1">{t.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="bg-surface-alt px-2 py-0.5 rounded font-mono">/{t.slug}</span>
                    <span>{t.year}</span>
                  </div>
                </div>
              ))}

              {tenants.length === 0 && (
                <div className="col-span-full text-center py-12 text-text-muted">
                  <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Henüz marka eklenmemiş.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">Kullanıcılar</h2>
              <button
                onClick={() => setShowUserForm(!showUserForm)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
              >
                <UserPlus size={16} /> Yeni Kullanıcı
              </button>
            </div>

            {showUserForm && (
              <form onSubmit={handleCreateUser} className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} placeholder="Ad Soyad" required className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary" />
                  <input type="email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" required className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary" />
                  <input type="password" value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} placeholder="Şifre (min. 6 karakter)" required minLength={6} className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary" />
                  <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value as Role }))} className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary">
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                {/* Tenant selection — only for non-admin roles */}
                {userForm.role !== 'admin' && (
                  <div className="col-span-full">
                    <label className="block text-xs font-medium text-text-secondary mb-2">Yetkili Markalar</label>
                    <div className="flex flex-wrap gap-2">
                      {tenants.map(t => (
                        <button
                          key={t.slug}
                          type="button"
                          onClick={() => toggleTenant(t.slug, userForm.tenants, (v) => setUserForm(p => ({ ...p, tenants: v })))}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                            userForm.tenants.includes(t.slug)
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface-alt text-text-secondary border-border hover:border-primary/30'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {userForm.role === 'admin' && (
                  <div className="col-span-full">
                    <p className="text-xs text-text-muted">Admin kullanıcılar tüm markalara otomatik erişir.</p>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowUserForm(false)} className="px-4 py-2 text-sm text-text-secondary">Vazgeç</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50">
                    {saving ? 'Ekleniyor...' : 'Ekle'}
                  </button>
                </div>
              </form>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-alt border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Ad</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Rol</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Markalar</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-surface-alt/50">
                      <td className="px-4 py-3 font-medium text-text">{u.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.role === 'admin' ? (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Tüm markalar</span>
                        ) : editingUserId === u.id ? (
                          <div className="flex flex-wrap gap-1.5">
                            {tenants.map(t => (
                              <button
                                key={t.slug}
                                onClick={() => toggleTenant(t.slug, editTenants, setEditTenants)}
                                className={`px-2 py-0.5 text-[10px] font-medium rounded border transition-all ${
                                  editTenants.includes(t.slug)
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-surface-alt text-text-muted border-border hover:border-primary/30'
                                }`}
                              >
                                {t.name}
                              </button>
                            ))}
                            <button onClick={saveEditTenants} className="p-0.5 rounded hover:bg-green-50 text-green-600"><Check size={14} /></button>
                            <button onClick={() => setEditingUserId(null)} className="p-0.5 rounded hover:bg-red-50 text-red-500"><X size={14} /></button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(u.tenants || []).map(slug => (
                              <span key={slug} className="text-[10px] bg-surface-alt text-text-muted px-2 py-0.5 rounded font-mono">
                                {slug}
                              </span>
                            ))}
                            {(!u.tenants || u.tenants.length === 0) && (
                              <span className="text-[10px] text-text-muted italic">Yetki yok</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => startEditTenants(u)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-text-muted hover:text-primary transition-colors"
                              title="Marka yetkilerini düzenle"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-8 text-text-muted text-sm">Kullanıcı bulunamadı.</div>
              )}
            </div>
          </div>
        )}

        {/* Password Tab */}
        {tab === 'password' && (
          <div className="max-w-sm">
            <h2 className="text-lg font-bold text-text mb-4">Şifre Değiştir</h2>
            <form onSubmit={handleChangePassword} className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4">
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
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-navy py-3">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-center gap-2 text-xs text-white/40">
          <span>Created by</span>
          <a href="https://rhinorunner.com" target="_blank" rel="noopener noreferrer">
            <img
              src="https://rhinorunner.com/_next/image?url=%2Fimages%2Flogo-for-dark.png&w=640&q=75"
              alt="Rhino Runner"
              className="h-4 opacity-70 hover:opacity-100 transition-opacity"
            />
          </a>
        </div>
      </footer>
    </div>
  )
}
