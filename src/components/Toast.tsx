import { CheckCircle, XCircle, X } from 'lucide-react'
import type { Toast as ToastType } from '../hooks/useToast'

interface Props {
  toasts: ToastType[]
  onDismiss: (id: number) => void
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`animate-slide-up flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span>{toast.message}</span>
          <button onClick={() => onDismiss(toast.id)} className="ml-2 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
