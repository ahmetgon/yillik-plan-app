import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useToast } from './hooks/useToast'
import { LoginModal } from './components/LoginModal'
import { ToastContainer } from './components/Toast'
import { Dashboard } from './pages/Dashboard'
import { CalendarPage } from './pages/CalendarPage'
import { useState } from 'react'

export default function App() {
  const { user, token, isLoggedIn, canEdit, isAdmin, login, logout } = useAuth()
  const { toasts, show: showToast, dismiss: dismissToast } = useToast()
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleLogin = async (email: string, password: string) => {
    setLoginError(null)
    try {
      await login(email, password)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Giriş başarısız')
    }
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginModal onLogin={handleLogin} error={loginError} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAdmin
              ? <Dashboard token={token!} user={user!} onLogout={logout} onToast={showToast} />
              : <Navigate to="/demo" replace />
          }
        />
        <Route
          path="/:slug"
          element={
            <CalendarPage
              token={token!}
              user={user!}
              isAdmin={isAdmin}
              canEdit={canEdit}
              onLogout={logout}
              onToast={showToast}
            />
          }
        />
      </Routes>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </BrowserRouter>
  )
}
