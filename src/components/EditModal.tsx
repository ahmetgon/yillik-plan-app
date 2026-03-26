import { useState, useRef } from 'react'
import { X, Bold, Italic, Underline, List } from 'lucide-react'
import type { Card, Category } from '../types'
import { MONTHS_TR, WEEKS } from '../types'

interface Props {
  card: Partial<Card> & { month: number; week: number }
  categories: Category[]
  isNew: boolean
  onSave: (data: Partial<Card>) => Promise<void>
  onClose: () => void
}

export function EditModal({ card, categories, isNew, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    title: card.title || '',
    description: card.description || '',
    category_id: card.category_id || null as number | null,
    month: card.month,
    week: card.week,
  })
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const desc = editorRef.current?.innerHTML || form.description
      await onSave({
        title: form.title.trim(),
        description: desc || null,
        category_id: form.category_id,
        month: form.month,
        week: form.week,
      })
    } finally {
      setSaving(false)
    }
  }

  const execCmd = (cmd: string) => {
    document.execCommand(cmd, false)
    editorRef.current?.focus()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="animate-slide-up bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold text-text font-[family-name:var(--font-heading)]">
            {isNew ? 'Yeni Kart Ekle' : 'Karti Duzenle'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Baslik *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
              className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Kart basligini girin..."
            />
          </div>

          {/* Month & Week */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Ay</label>
              <select
                value={form.month}
                onChange={e => setForm(p => ({ ...p, month: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {MONTHS_TR.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Hafta</label>
              <select
                value={form.week}
                onChange={e => setForm(p => ({ ...p, week: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {WEEKS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Kategori</label>
            <div className="relative">
              <select
                value={form.category_id || ''}
                onChange={e => setForm(p => ({ ...p, category_id: e.target.value ? Number(e.target.value) : null }))}
                className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="">Kategori secin...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {form.category_id && (
                <span
                  className="absolute right-8 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                  style={{ backgroundColor: categories.find(c => c.id === form.category_id)?.color }}
                />
              )}
            </div>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Detay</label>
            <div className="border border-border rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <div className="flex items-center gap-0.5 px-2 py-1.5 bg-surface-alt border-b border-border">
                <button type="button" onClick={() => execCmd('bold')} className="p-1.5 rounded hover:bg-white text-text-secondary hover:text-text" title="Kalin">
                  <Bold size={14} />
                </button>
                <button type="button" onClick={() => execCmd('italic')} className="p-1.5 rounded hover:bg-white text-text-secondary hover:text-text" title="Italik">
                  <Italic size={14} />
                </button>
                <button type="button" onClick={() => execCmd('underline')} className="p-1.5 rounded hover:bg-white text-text-secondary hover:text-text" title="Alti Cizili">
                  <Underline size={14} />
                </button>
                <div className="w-px h-4 bg-border mx-1" />
                <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-1.5 rounded hover:bg-white text-text-secondary hover:text-text" title="Liste">
                  <List size={14} />
                </button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                className="min-h-[120px] px-3 py-2.5 text-sm text-text outline-none bg-white prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: form.description }}
                onBlur={() => {
                  if (editorRef.current) {
                    setForm(p => ({ ...p, description: editorRef.current!.innerHTML }))
                  }
                }}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-alt rounded-lg hover:bg-border transition-colors"
          >
            Vazgec
          </button>
          <button
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={saving || !form.title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : isNew ? 'Ekle' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
