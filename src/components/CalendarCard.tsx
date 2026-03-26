import { Pencil, Trash2 } from 'lucide-react'
import type { Card, Category } from '../types'

interface Props {
  card: Card
  category: Category | undefined
  canEdit: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

export function CalendarCard({ card, category, canEdit, onClick, onEdit, onDelete }: Props) {
  return (
    <div
      className="group relative flex items-start gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{
        backgroundColor: category?.bg_color || '#F3F4F6',
        borderLeft: `3px solid ${category?.color || '#6B7280'}`,
      }}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text leading-snug truncate">{card.title}</p>
        {card.description && (
          <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-1">
            {card.description.replace(/<[^>]*>/g, '')}
          </p>
        )}
      </div>

      {canEdit && (
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            className="p-1 rounded hover:bg-white/60 text-text-secondary hover:text-primary transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1 rounded hover:bg-white/60 text-text-secondary hover:text-red-500 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
