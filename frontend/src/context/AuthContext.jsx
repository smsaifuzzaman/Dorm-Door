import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

const TOKEN_KEY = 'dormdoor_token'
const USER_KEY = 'dormdoor_user'
const DEMO_TOKEN = 'dormdoor_demo_token'

const DEMO_USERS = {
  'student@dormdoor.com': {
    _id: 'demo-student',
    name: 'Demo Student',
    email: 'student@dormdoor.com',
    role: 'student',
    studentId: 'DD-DEMO-1001',
  },
  'admin@dormdoor.com': {
    _id: 'demo-admin',
    name: 'Demo Admin',
    email: 'admin@dormdoor.com',
    role: 'admin',
  },
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function isDemoCredential(payload) {
  const email = normalizeEmail(payload?.email)
  if (!email || !payload?.password) return false
  return (
    (email === 'student@dormdoor.com' && payload.password === 'Student123!') ||
    (email === 'admin@dormdoor.com' && payload.password === 'Admin123!')
  )
}

function loadStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => loadStoredUser())
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)))

  useEffect(() => {
    async function fetchMe() {
      if (!token) {
        setLoading(false)
        return
      }

      if (token === DEMO_TOKEN) {
        setLoading(false)
        return
      }

      try {
        const { data } = await api.get('/auth/me')
        setUser(data.user)
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [token])

  const login = async (payload) => {
    const normalizedPayload = {
      ...payload,
      email: normalizeEmail(payload?.email),
    }

    try {
      const { data } = await api.post('/auth/login', normalizedPayload)
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      return data.user
    } catch (error) {
      if (!isDemoCredential(normalizedPayload)) {
        throw error
      }

      const demoUser = DEMO_USERS[normalizedPayload.email]
      localStorage.setItem(TOKEN_KEY, DEMO_TOKEN)
      localStorage.setItem(USER_KEY, JSON.stringify(demoUser))
      setToken(DEMO_TOKEN)
      setUser(demoUser)
      return demoUser
    }
  }

  const signup = async (payload) => {
    const normalizedPayload = {
      ...payload,
      email: normalizeEmail(payload?.email),
    }

    const { data } = await api.post('/auth/signup', normalizedPayload)
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ token, user, loading, isAuthenticated: Boolean(user), login, signup, logout }),
    [token, user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
