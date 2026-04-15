import { useState } from 'react'
import type { AuthUser } from '../api/authApi'

const TOKEN_KEY = 'rd_token'
const USER_KEY = 'rd_user'

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  })

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  const updateUser = (newUser: AuthUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setUser(newUser)
  }

  return { token, user, isLoggedIn: token !== null, login, logout, updateUser }
}
