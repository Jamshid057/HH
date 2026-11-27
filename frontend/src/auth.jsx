import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, tokens } from './api'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!tokens.access)

  const load = useCallback(async () => {
    if (!tokens.access) { setUser(null); setLoading(false); return }
    try { setUser(await api.get('/accounts/me/')) } catch { setUser(null) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const login = async (email, password) => {
    const t = await api.post('/accounts/login/', { email, password })
    tokens.set(t)
    await load()
    return t.role
  }
  const logout = () => { tokens.clear(); setUser(null) }

  return <Ctx.Provider value={{ user, loading, login, logout, reload: load }}>{children}</Ctx.Provider>
}
