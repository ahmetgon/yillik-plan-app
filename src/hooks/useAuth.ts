import { useState, useCallback, useEffect } from 'react'
import type { User } from '../types'
import { login as apiLogin } from '../lib/api'

const STORAGE_KEY = 'yp_auth'

interface AuthState {
  user: User | null
  token: string | null
}

function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { user: null, token: null }
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(loadAuth)

  useEffect(() => {
    if (auth.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [auth])

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password)
    setAuth({ user: result.user, token: result.token })
    return result.user
  }, [])

  const logout = useCallback(() => {
    setAuth({ user: null, token: null })
  }, [])

  const canEdit = auth.user?.role === 'admin' || auth.user?.role === 'editor'
  const isAdmin = auth.user?.role === 'admin'

  return {
    user: auth.user,
    token: auth.token,
    isLoggedIn: !!auth.token,
    canEdit,
    isAdmin,
    login,
    logout,
  }
}
