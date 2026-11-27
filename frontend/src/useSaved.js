import { useCallback, useEffect, useState } from 'react'
import { api, rows } from './api'
import { useAuth } from './auth'

// Wishlist (saved jobs) of the signed-in candidate, with optimistic toggle.
export function useSaved() {
  const { user } = useAuth()
  const [ids, setIds] = useState(new Set())

  useEffect(() => {
    if (user?.role !== 'candidate') { setIds(new Set()); return }
    api.get('/candidates/wishlist/?page_size=100').then((d) => setIds(new Set(rows(d).map((w) => w.job_id)))).catch(() => {})
  }, [user])

  const toggle = useCallback(async (job) => {
    const id = job.id ?? job.job_id
    if (user?.role !== 'candidate') { window.location.href = '/signin'; return }
    setIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
    try { await api.post(`/candidates/wishlist/${id}/`) } catch {
      setIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
    }
  }, [user])

  return { isSaved: (id) => ids.has(id), toggle }
}
