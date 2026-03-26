import { useState, useEffect, useCallback } from 'react'
import type { Card, Category, ViewMode, Quarter } from './types'
import { DEFAULT_CATEGORIES } from './types'
import { useAuth } from './hooks/useAuth'
import { useToast } from './hooks/useToast'
import * as api from './lib/api'

import { Header } from './components/Header'
import { CalendarToolbar } from './components/CalendarToolbar'
import { CalendarGrid } from './components/CalendarGrid'
import { Legend } from './components/Legend'
import { ViewModal } from './components/ViewModal'
import { EditModal } from './components/EditModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import { AdminPanel } from './components/AdminPanel'
import { LoginModal } from './components/LoginModal'
import { ToastContainer } from './components/Toast'

export default function App() {
  const { user, token, isLoggedIn, canEdit, isAdmin, login, logout } = useAuth()
  const { toasts, show: showToast, dismiss: dismissToast } = useToast()

  const [tenantMeta, setTenantMeta] = useState<{ slug: string; name: string; year: number } | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loginError, setLoginError] = useState<string | null>(null)

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
  const [showAdmin, setShowAdmin] = useState(false)

  // Load data
  useEffect(() => {
    Promise.all([api.getTenantMeta(), api.getCards(), api.getCategories()]).then(([meta, c, cats]) => {
      setTenantMeta(meta)
      setCards(c)
      setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES.map((cat, i) => ({
        ...cat,
        id: i + 1,
        tenant_id: 0,
      })) as Category[])
      setLoading(false)
    }).catch(() => {
      // If API is down, show with defaults
      setCategories(DEFAULT_CATEGORIES.map((cat, i) => ({ ...cat, id: i + 1, tenant_id: 0 })) as Category[])
      setLoading(false)
    })
  }, [])

  const reloadCards = useCallback(async () => {
    const c = await api.getCards()
    setCards(c)
  }, [])

  // Login
  const handleLogin = async (email: string, password: string) => {
    setLoginError(null)
    try {
      await login(email, password)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Giriş başarısız')
    }
  }

  // Card CRUD
  const handleSaveCard = async (data: Partial<Card>) => {
    if (!token || !user) return
    try {
      if (editState?.isNew) {
        const card = await api.createCard(token, { ...data, created_by: user.id, sort_order: 0 })
        await api.logActivity(token, {
          card_id: card.id,
          user_id: user.id,
          user_name: user.name,
          action: 'created',
          details: `"${data.title}" kartı oluşturuldu`,
        })
        showToast('Kart başarıyla eklendi', 'success')
      } else if (editState?.card?.id) {
        await api.updateCard(token, editState.card.id, { ...data, updated_by: user.id })
        await api.logActivity(token, {
          card_id: editState.card.id,
          user_id: user.id,
          user_name: user.name,
          action: 'updated',
          details: `"${data.title}" kartı güncellendi`,
        })
        showToast('Kart güncellendi', 'success')
      }
      setEditState(null)
      reloadCards()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error')
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
      showToast('Kart silindi', 'success')
      setDeleteCard(null)
      setViewCard(null)
      reloadCards()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Silinemedi', 'error')
    }
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginModal onLogin={handleLogin} error={loginError} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
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
    <div className="min-h-screen bg-surface">
      <Header
        tenant={tenantForHeader}
        user={user}
        isAdmin={isAdmin}
        onLogout={logout}
        onSettingsClick={() => setShowAdmin(true)}
      />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5">
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
          />
        </div>

      </main>

      <footer className="border-t border-border bg-surface-alt py-4 mt-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-center gap-2 text-xs text-text-muted">
          <span>Geliştiren</span>
          <a href="https://rhinorunner.com" target="_blank" rel="noopener noreferrer">
            <img
              src="https://rhinorunner.com/_next/image?url=%2Fimages%2Flogo-for-dark.png&w=640&q=75"
              alt="Rhino Runner"
              className="h-5 opacity-60 hover:opacity-100 transition-opacity"
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

      {showAdmin && user && token && (
        <AdminPanel
          token={token}
          currentUser={user}
          onClose={() => setShowAdmin(false)}
          onToast={showToast}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
