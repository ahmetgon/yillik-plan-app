import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Card, Category } from '../types'
import { MONTHS_TR, WEEKS } from '../types'
import { CalendarCard } from './CalendarCard'

interface Props {
  month: number
  cards: Card[]
  categories: Category[]
  canEdit: boolean
  compact?: boolean
  onCardClick: (card: Card) => void
  onCardEdit: (card: Card) => void
  onCardDelete: (card: Card) => void
  onAddCard: (month: number, week: number) => void
  onMoveCard?: (cardId: number, toMonth: number, toWeek: number) => void
}

export function MonthColumn({
  month,
  cards,
  categories,
  canEdit,
  compact = false,
  onCardClick,
  onCardEdit,
  onCardDelete,
  onAddCard,
  onMoveCard,
}: Props) {
  const [dropTarget, setDropTarget] = useState<number | null>(null)

  const getCategoryById = (id: number | null) => categories.find(c => c.id === id)
  const getWeekCards = (week: number) => cards.filter(c => c.month === month && c.week === week)

  const handleDragOver = (e: React.DragEvent, week: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(week)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the drop zone entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropTarget(null)
    }
  }

  const handleDrop = (e: React.DragEvent, toWeek: number) => {
    e.preventDefault()
    setDropTarget(null)

    const cardId = Number(e.dataTransfer.getData('application/card-id'))
    const fromMonth = Number(e.dataTransfer.getData('application/card-month'))
    const fromWeek = Number(e.dataTransfer.getData('application/card-week'))

    if (!cardId || (fromMonth === month && fromWeek === toWeek)) return

    onMoveCard?.(cardId, month, toWeek)
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
      {/* Month Header */}
      <div className="bg-gradient-to-r from-navy to-navy-light px-4 py-2.5 text-center">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-[family-name:var(--font-heading)]">
          {MONTHS_TR[month - 1]}
        </h3>
      </div>

      {/* Weeks */}
      <div className="flex-1 divide-y divide-border-light">
        {WEEKS.map(({ value: week, label }) => {
          const weekCards = getWeekCards(week)
          const isDropHere = dropTarget === week
          return (
            <div
              key={week}
              className={`${compact ? 'p-2' : 'p-3'} min-h-[60px] transition-colors ${
                isDropHere ? 'bg-primary/5 ring-2 ring-inset ring-primary/20' : ''
              }`}
              onDragOver={canEdit ? (e) => handleDragOver(e, week) : undefined}
              onDragLeave={canEdit ? handleDragLeave : undefined}
              onDrop={canEdit ? (e) => handleDrop(e, week) : undefined}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                  {label}
                </span>
                {canEdit && (
                  <button
                    onClick={() => onAddCard(month, week)}
                    className="p-0.5 rounded hover:bg-surface-alt text-text-muted hover:text-primary transition-colors"
                    title="Kart Ekle"
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {weekCards.map(card => (
                  <CalendarCard
                    key={card.id}
                    card={card}
                    category={getCategoryById(card.category_id)}
                    canEdit={canEdit}
                    onClick={() => onCardClick(card)}
                    onEdit={() => onCardEdit(card)}
                    onDelete={() => onCardDelete(card)}
                  />
                ))}
              </div>
              {isDropHere && weekCards.length === 0 && (
                <div className="border-2 border-dashed border-primary/30 rounded-lg py-2 text-center text-[10px] text-primary/50 font-medium mt-1">
                  Buraya bırak
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
