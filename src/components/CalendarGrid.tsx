import type { Card, Category, ViewMode, Quarter } from '../types'
import { QUARTER_MONTHS } from '../types'
import { MonthColumn } from './MonthColumn'

interface Props {
  viewMode: ViewMode
  selectedQuarter: Quarter
  selectedMonth: number
  cards: Card[]
  categories: Category[]
  canEdit: boolean
  onCardClick: (card: Card) => void
  onCardEdit: (card: Card) => void
  onCardDelete: (card: Card) => void
  onAddCard: (month: number, week: number) => void
  onMoveCard: (cardId: number, toMonth: number, toWeek: number) => void
}

export function CalendarGrid({
  viewMode,
  selectedQuarter,
  selectedMonth,
  cards,
  categories,
  canEdit,
  onCardClick,
  onCardEdit,
  onCardDelete,
  onAddCard,
  onMoveCard,
}: Props) {
  const getMonths = (): number[] => {
    if (viewMode === 'year') return Array.from({ length: 12 }, (_, i) => i + 1)
    if (viewMode === 'quarter') return QUARTER_MONTHS[selectedQuarter]
    return [selectedMonth]
  }

  const months = getMonths()

  const monthProps = (m: number) => ({
    key: m,
    month: m,
    cards,
    categories,
    canEdit,
    onCardClick,
    onCardEdit,
    onCardDelete,
    onAddCard,
    onMoveCard,
  })

  if (viewMode === 'year') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map(m => (
          <MonthColumn {...monthProps(m)} compact />
        ))}
      </div>
    )
  }

  if (viewMode === 'quarter') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {months.map(m => (
          <MonthColumn {...monthProps(m)} />
        ))}
      </div>
    )
  }

  // Single month view - wider layout
  return (
    <div className="max-w-2xl mx-auto">
      <MonthColumn {...monthProps(selectedMonth)} />
    </div>
  )
}
