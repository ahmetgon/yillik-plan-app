import { AlertTriangle } from 'lucide-react'

interface Props {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div className="animate-pop bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-text">{title}</h3>
        </div>
        <p className="text-sm text-text-secondary mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-alt rounded-lg hover:bg-border transition-colors"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  )
}
