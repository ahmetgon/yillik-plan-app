import type { Card, Category, User, ActivityLog } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || ''

let _currentTenant = 'demo'

export function setCurrentTenant(slug: string) {
  _currentTenant = slug
}

export function getCurrentTenant(): string {
  return _currentTenant
}

function headers(token?: string | null): HeadersInit {
  const h: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Tenant': _currentTenant,
  }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Bir hata oluştu.' }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ===== AUTH =====
export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, password }),
  })
  return handleRes(res)
}

export async function changePassword(token: string, userId: number, oldPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/change-password`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ user_id: userId, old_password: oldPassword, new_password: newPassword }),
  })
  await handleRes(res)
}

// ===== TENANTS =====
export async function getTenantMeta(): Promise<{ slug: string; name: string; year: number } | null> {
  const res = await fetch(`${API_BASE}/api/meta`, { headers: headers() })
  if (!res.ok) return null
  return res.json()
}

export async function getTenants(): Promise<{ slug: string; name: string; year: number }[]> {
  const res = await fetch(`${API_BASE}/api/tenants`)
  if (!res.ok) return []
  return res.json()
}

export async function createTenant(token: string, data: { slug: string; name: string; year: number }): Promise<void> {
  const res = await fetch(`${API_BASE}/api/tenants`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(data),
  })
  await handleRes(res)
}

export async function deleteTenant(token: string, slug: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/tenants/${slug}`, {
    method: 'DELETE',
    headers: headers(token),
  })
  await handleRes(res)
}

// ===== USERS =====
export async function getUsers(token: string): Promise<User[]> {
  const res = await fetch(`${API_BASE}/api/users`, { headers: headers(token) })
  return handleRes(res)
}

export async function createUser(
  token: string,
  data: { name: string; email: string; password: string; role: string; tenants?: string[] }
): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(data),
  })
  return handleRes(res)
}

export async function updateUser(
  token: string,
  userId: number,
  data: { tenants?: string[] }
): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify(data),
  })
  return handleRes(res)
}

export async function deleteUser(token: string, userId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'DELETE',
    headers: headers(token),
  })
  await handleRes(res)
}

// ===== CATEGORIES =====
export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/api/categories`, { headers: headers() })
  if (!res.ok) return []
  return res.json()
}

// ===== CARDS =====
export async function getCards(year?: number): Promise<Card[]> {
  const url = year ? `${API_BASE}/api/cards?year=${year}` : `${API_BASE}/api/cards`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) return []
  return res.json()
}

export async function createCard(token: string, card: Partial<Card>): Promise<Card> {
  const res = await fetch(`${API_BASE}/api/cards`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(card),
  })
  return handleRes(res)
}

export async function updateCard(token: string, id: number, card: Partial<Card>): Promise<Card> {
  const res = await fetch(`${API_BASE}/api/cards/${id}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify(card),
  })
  return handleRes(res)
}

export async function deleteCard(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/cards/${id}`, {
    method: 'DELETE',
    headers: headers(token),
  })
  await handleRes(res)
}

// ===== ACTIVITY LOG =====
export async function getCardActivities(cardId: number): Promise<ActivityLog[]> {
  const res = await fetch(`${API_BASE}/api/activity/${cardId}`, { headers: headers() })
  if (!res.ok) return []
  return res.json()
}

export async function logActivity(
  token: string,
  data: { card_id: number; user_id: number; user_name: string; action: string; details: string }
): Promise<void> {
  await fetch(`${API_BASE}/api/activity`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(data),
  })
}
