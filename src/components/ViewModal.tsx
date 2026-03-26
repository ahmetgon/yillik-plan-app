import { useEffect, useState } from 'react'
import { X, Pencil, Trash2, Clock, User } from 'lucide-react'
import type { Card, Category, ActivityLog } from '../types'
import { MONTHS_TR, WEEKS } from '../types'
import { getCardActivities } from '../lib/api'

interface Props {
  card: Card
  category: Category | undefined
  canEdit: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ViewModal({ card, category, canEdit, onClose, onEdit, onDelete }: Props) {
  const [activities, setActivities] = useState<ActivityLog[]>([])

  useEffect(() => {
    getCardActivities(card.id).then(setActivities)
  }, [card.id])

  const weekLabel = WEEKS.find(w => w.value === card.week)?.label || ''

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const actionLabel = (action: string) => {
    switch (action) {
      case 'created': return 'olusturdu'
      case 'updated': return 'guncelledi'
      case 'deleted': return 'sildi'
      case 'moved': return 'tasidi'
      default: return action
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="animate-slide-up bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex-1 min-w-0">
            {category && (
              <span
                className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2"
                style={{ color: category.color, backgroundColor: category.bg_color }}
              >
                {category.name}
              </span>
            )}
            <h2 className="text-lg font-bold text-text font-[family-name:var(--font-heading)]">{card.title}</h2>
            <p className="text-xs text-text-muted mt-1">
              {MONTHS_TR[card.month - 1]} &middot; {weekLabel}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {card.description && (
            <div
              className="prose prose-sm max-w-none text-sm text-text-secondary leading-relaxed"
              dangerouslySetInnerHTML={{ __html: card.description }}
            />
          )}

          {!card.description && (
            <p className="text-sm text-text-muted italic">Detay eklenmemis.</p>
          )}

          {/* Activity Timeline */}
          {activities.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Clock size={12} />
                Aktivite
              </h4>
              <div className="flex flex-col gap-2.5">
                {activities.map(act => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <div className="w-5 h-5 rounded-full bg-surface-alt flex items-center justify-center shrink-0 mt-0.5">
                      <User size={10} className="text-text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-secondary">
                        <span className="font-medium text-text">{act.user_name || 'Kullanici'}</span>
                        {' '}{actionLabel(act.action)}
                        {act.details && <span className="text-text-muted"> &mdash; {act.details}</span>}
                      </p>
                      <p className="text-text-muted mt-0.5">{formatDate(act.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {canEdit && (
          <div className="flex gap-2 p-4 border-t border-border">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Pencil size={13} /> Duzenle
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 size={13} /> Sil
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
