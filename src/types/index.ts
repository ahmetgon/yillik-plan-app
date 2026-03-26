export type Role = 'admin' | 'editor' | 'viewer'

export interface User {
  id: number
  tenant_id: number
  name: string
  email: string
  role: Role
  tenants: string[]
  created_at: string
}

export interface Tenant {
  id: number
  slug: string
  name: string
  logo_url: string | null
  year: number
  created_at: string
}

export interface Category {
  id: number
  tenant_id: number
  name: string
  color: string
  bg_color: string
  sort_order: number
}

export interface Card {
  id: number
  tenant_id: number
  year: number
  month: number
  week: number
  title: string
  description: string | null
  category_id: number | null
  sort_order: number
  created_by: number | null
  updated_by: number | null
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: number
  card_id: number
  user_id: number
  user_name?: string
  action: 'created' | 'updated' | 'deleted' | 'moved'
  details: string
  created_at: string
}

export type ViewMode = 'year' | 'quarter' | 'month'
export type Quarter = 1 | 2 | 3 | 4

export const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
] as const

export const QUARTER_LABELS: Record<Quarter, string> = {
  1: 'Q1 (Ocak - Mart)',
  2: 'Q2 (Nisan - Haziran)',
  3: 'Q3 (Temmuz - Eylül)',
  4: 'Q4 (Ekim - Aralık)',
}

export const QUARTER_MONTHS: Record<Quarter, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
}

export const WEEKS = [
  { value: 1, label: '1. Hafta' },
  { value: 2, label: '2. Hafta' },
  { value: 3, label: '3. Hafta' },
  { value: 4, label: '4. Hafta' },
  { value: 5, label: '5. Hafta / Ay Sonu' },
] as const

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'tenant_id'>[] = [
  { name: 'Detaylandırılması gereken genel başlık', color: '#10B981', bg_color: '#D1FAE5', sort_order: 1 },
  { name: 'Yeni eklenen özel gün önerileri', color: '#F97316', bg_color: '#FFEDD5', sort_order: 2 },
  { name: 'Mevcut iç iletişim ve İK içerikleri', color: '#EF4444', bg_color: '#FEE2E2', sort_order: 3 },
  { name: 'İç iletişime konu edilebilir olanlar', color: '#3B82F6', bg_color: '#DBEAFE', sort_order: 4 },
  { name: 'Rutin ve operasyonel iletişimler', color: '#6B7280', bg_color: '#F3F4F6', sort_order: 5 },
]
