import { useState } from 'react'
import { LogIn } from 'lucide-react'

interface Props {
  onLogin: (email: string, password: string) => Promise<void>
  error: string | null
}

export function LoginModal({ onLogin, error }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onLogin(email, password)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy to-navy-light p-4">
      <div className="animate-slide-up bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <LogIn size={28} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text font-[family-name:var(--font-heading)]">Yillik Plan</h1>
          <p className="text-sm text-text-secondary mt-1">Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="ornek@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="********"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}
