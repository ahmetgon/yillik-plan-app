import { Calendar, LogOut, Settings, User } from 'lucide-react'
import type { User as UserType, Tenant } from '../types'

interface Props {
  tenant: Tenant | null
  user: UserType | null
  isAdmin: boolean
  onLogout: () => void
  onSettingsClick: () => void
}

export function Header({ tenant, user, isAdmin, onLogout, onSettingsClick }: Props) {
  return (
    <header className="bg-navy text-white shadow-lg">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <Calendar size={20} className="text-primary-light" />
          </div>
          <div>
            <h1 className="text-base font-bold font-[family-name:var(--font-heading)] leading-tight">
              {tenant?.name || 'Yillik Plan'}
            </h1>
            <p className="text-xs text-white/50">{tenant?.year || new Date().getFullYear()} Yillik Iletisim Takvimi</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
              <User size={14} />
              <span>{user.name}</span>
              <span className="text-[10px] uppercase tracking-wide bg-white/10 px-1.5 py-0.5 rounded">
                {user.role}
              </span>
            </div>
            {isAdmin && (
              <button
                onClick={onSettingsClick}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                title="Yonetim Paneli"
              >
                <Settings size={18} />
              </button>
            )}
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              title="Cikis Yap"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
