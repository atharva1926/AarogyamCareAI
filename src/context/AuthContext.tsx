import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { forgotPasswordRequest, loginRequest, signupRequest } from '../services/authService'
import type { SignupPayload, User } from '../types'

const AUTH_KEY = 'aarogyamcare.auth'

interface StoredAuth {
  user: User
  token?: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string, remember: boolean) => Promise<void>
  signup: (payload: SignupPayload) => Promise<void>
  logout: () => void
  forgotPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readAuth(): StoredAuth | null {
  const raw = localStorage.getItem(AUTH_KEY) ?? sessionStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredAuth
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readAuth()?.user ?? null)

  const persist = useCallback((auth: StoredAuth, remember: boolean) => {
    const serialized = JSON.stringify(auth)
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)
    if (remember) localStorage.setItem(AUTH_KEY, serialized)
    else sessionStorage.setItem(AUTH_KEY, serialized)
  }, [])

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const result = await loginRequest(email, password)
      persist(result, remember)
      setUser(result.user)
    },
    [persist],
  )

  const signup = useCallback(
    async (payload: SignupPayload) => {
      const result = await signupRequest(payload)
      persist(result, true)
      setUser(result.user)
    },
    [persist],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)
    setUser(null)
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    await forgotPasswordRequest(email)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      forgotPassword,
    }),
    [user, login, signup, logout, forgotPassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
