import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { Card, Category, ViewMode, Quarter } from '../types'
import { DEFAULT_CATEGORIES } from '../types'
import type { User } from '../types'
import * as api from '../lib/api'

import { Header } from '../components/Header'
import { CalendarToolbar } from '../components/CalendarToolbar'
import { CalendarGrid } from '../components/CalendarGrid'
import { Legend } from '../components/Legend'
import { ViewModal } from '../components/ViewModal'
import { EditModal } from '../components/EditModal'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface Props {
  token: string
  user: User
  isAdmin: boolean
  canEdit: boolean
  onLogout: () => void
  onToast: (msg: string, type: 'success' | 'error') => void
}

export function CalendarPage({ token, user, isAdmin, canEdit, onLogout, onToast }: Props) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [tenantMeta, setTenantMeta] = useState<{ slug: string; name: string; year: number } | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('quarter')
  const currentQuarter = (Math.ceil((new Date().getMonth() + 1) / 3)) as Quarter
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(currentQuarter)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Modal state
  const [viewCard, setViewCard] = useState<Card | null>(null)
  const [editState, setEditState] = useState<{ card: Partial<Card> & { month: number; week: number }; isNew: boolean } | null>(null)
  const [deleteCard, setDeleteCard] = useState<Card | null>(null)

  // Set tenant and load initial data
  useEffect(() => {
    if (!slug) return
    api.setCurrentTenant(slug)
    setLoading(true)
    Promise.all([api.getTenantMeta(), api.getCategories()]).then(([meta, cats]) => {
      setTenantMeta(meta)
      setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES.map((cat, i) => ({
        ...cat,
        id: i + 1,
        tenant_id: 0,
      })) as Category[])
      if (meta?.year) setSelectedYear(meta.year)
      setLoading(false)
    }).catch(() => {
      setCategories(DEFAULT_CATEGORIES.map((cat, i) => ({ ...cat, id: i + 1, tenant_id: 0 })) as Category[])
      setLoading(false)
    })
  }, [slug])

  // Load cards when year changes
  useEffect(() => {
    if (!slug) return
    api.getCards(selectedYear).then(setCards)
  }, [slug, selectedYear])

  const reloadCards = useCallback(async () => {
    const c = await api.getCards(selectedYear)
    setCards(c)
  }, [selectedYear])

  // Card CRUD
  const handleSaveCard = async (data: Partial<Card>) => {
    if (!token || !user) return
    try {
      if (editState?.isNew) {
        const card = await api.createCard(token, { ...data, year: selectedYear, created_by: user.id, sort_order: 0 })
        await api.logActivity(token, {
          card_id: card.id,
          user_id: user.id,
          user_name: user.name,
          action: 'created',
          details: `"${data.title}" kartı oluşturuldu`,
        })
        onToast('Kart başarıyla eklendi', 'success')
      } else if (editState?.card?.id) {
        await api.updateCard(token, editState.card.id, { ...data, updated_by: user.id })
        await api.logActivity(token, {
          card_id: editState.card.id,
          user_id: user.id,
          user_name: user.name,
          action: 'updated',
          details: `"${data.title}" kartı güncellendi`,
        })
        onToast('Kart güncellendi', 'success')
      }
      setEditState(null)
      reloadCards()
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Hata oluştu', 'error')
    }
  }

  const handleMoveCard = async (cardId: number, toMonth: number, toWeek: number) => {
    if (!token || !user) return
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    setCards(prev => prev.map(c => c.id === cardId ? { ...c, month: toMonth, week: toWeek } : c))

    try {
      await api.updateCard(token, cardId, { month: toMonth, week: toWeek, updated_by: user.id })
      await api.logActivity(token, {
        card_id: cardId,
        user_id: user.id,
        user_name: user.name,
        action: 'moved',
        details: `"${card.title}" kartı taşındı`,
      })
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Taşınamadı', 'error')
      reloadCards()
    }
  }

  const handleDeleteCard = async () => {
    if (!token || !deleteCard || !user) return
    try {
      await api.logActivity(token, {
        card_id: deleteCard.id,
        user_id: user.id,
        user_name: user.name,
        action: 'deleted',
        details: `"${deleteCard.title}" kartı silindi`,
      })
      await api.deleteCard(token, deleteCard.id)
      onToast('Kart silindi', 'success')
      setDeleteCard(null)
      setViewCard(null)
      reloadCards()
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Silinemedi', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const tenantForHeader = tenantMeta ? { id: 0, slug: tenantMeta.slug, name: tenantMeta.name, year: tenantMeta.year, logo_url: null, created_at: '' } : null

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header
        tenant={tenantForHeader}
        user={user}
        isAdmin={isAdmin}
        onLogout={onLogout}
        onSettingsClick={() => navigate('/')}
      />

      <main className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 py-5 w-full">
        {isAdmin && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft size={14} /> Yönetim Paneline Dön
          </button>
        )}

        <CalendarToolbar
          viewMode={viewMode}
          selectedQuarter={selectedQuarter}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onViewModeChange={setViewMode}
          onQuarterChange={setSelectedQuarter}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        <Legend categories={categories} />

        <div className="mt-4">
          <CalendarGrid
            viewMode={viewMode}
            selectedQuarter={selectedQuarter}
            selectedMonth={selectedMonth}
            cards={cards}
            categories={categories}
            canEdit={canEdit}
            onCardClick={setViewCard}
            onCardEdit={card => setEditState({ card, isNew: false })}
            onCardDelete={setDeleteCard}
            onAddCard={(month, week) => setEditState({ card: { month, week }, isNew: true })}
            onMoveCard={handleMoveCard}
          />
        </div>
      </main>

      <footer className="bg-navy py-3">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-center gap-2 text-xs text-white/40">
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

      {viewCard && (
        <ViewModal
          card={viewCard}
          category={categories.find(c => c.id === viewCard.category_id)}
          canEdit={canEdit}
          onClose={() => setViewCard(null)}
          onEdit={() => {
            setEditState({ card: viewCard, isNew: false })
            setViewCard(null)
          }}
          onDelete={() => {
            setDeleteCard(viewCard)
            setViewCard(null)
          }}
        />
      )}

      {editState && (
        <EditModal
          card={editState.card}
          categories={categories}
          isNew={editState.isNew}
          onSave={handleSaveCard}
          onClose={() => setEditState(null)}
        />
      )}

      {deleteCard && (
        <ConfirmDialog
          title="Kartı Sil"
          message={`"${deleteCard.title}" kartını silmek istediğinize emin misiniz?`}
          onConfirm={handleDeleteCard}
          onCancel={() => setDeleteCard(null)}
        />
      )}
    </div>
  )
}
