import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'technician' | 'manager'
}

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Demo credentials
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'admin@maintainiq.com': {
    password: 'admin123',
    user: { id: '1', name: 'Alex Johnson', email: 'admin@maintainiq.com', role: 'admin' },
  },
  'tech@maintainiq.com': {
    password: 'tech123',
    user: { id: '2', name: 'Sam Rivera', email: 'tech@maintainiq.com', role: 'technician' },
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('miq_user')
    return stored ? JSON.parse(stored) : null
  })

  const login = (email: string, password: string): boolean => {
    const entry = DEMO_USERS[email]
    if (entry && entry.password === password) {
      setUser(entry.user)
      localStorage.setItem('miq_user', JSON.stringify(entry.user))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('miq_user')
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
