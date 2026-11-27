export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const BASE = `${API}/api/v1`

const store = {
  get access() { return localStorage.getItem('access') },
  get refresh() { return localStorage.getItem('refresh') },
  set(tokens) {
    if (tokens.access) localStorage.setItem('access', tokens.access)
    if (tokens.refresh) localStorage.setItem('refresh', tokens.refresh)
  },
  clear() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
  },
}
export const tokens = store

export class ApiError extends Error {
  constructor(status, data) {
    super(flatten(data) || `Error ${status}`)
    this.status = status
    this.data = data
  }
}

function flatten(data) {
  if (!data) return ''
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  return Object.entries(data)
    .map(([k, v]) => `${['error', 'non_field_errors'].includes(k) ? '' : k + ': '}${Array.isArray(v) ? v.join(' ') : v}`)
    .join(' · ')
}

async function refreshAccess() {
  if (!store.refresh) return false
  const res = await fetch(`${BASE}/accounts/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: store.refresh }),
  })
  if (!res.ok) return false
  store.set(await res.json())
  return true
}

async function request(method, path, body, retry = true) {
  const headers = {}
  const isForm = body instanceof FormData
  if (body && !isForm) headers['Content-Type'] = 'application/json'
  if (store.access) headers.Authorization = `Bearer ${store.access}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })
  if (res.status === 401 && retry && (await refreshAccess())) return request(method, path, body, false)
  if (res.status === 401) store.clear()
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
}

export const qs = (params = {}) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== false),
  ).toString()
  return s ? `?${s}` : ''
}

// DRF list responses are paginated ({count, results}) except for a few plain lists.
export const rows = (d) => (Array.isArray(d) ? d : d?.results ?? [])

export const media = (u) => (!u ? '' : u.startsWith('http') ? u : `${API}${u}`)

export const LABELS = {
  type: { fulltime: 'Full Time', parttime: 'Part Time', remote: 'Remote', freelance: 'Freelance', internship: 'Internship' },
  salary_type: { monthly: 'Monthly', hourly: 'Hourly', yearly: 'Yearly' },
  level: { entry: 'Entry Level', mid: 'Mid Level', senior: 'Senior Level', director: 'Director', vp: 'VP or Above' },
  experience: { '0-1': '0-1 Years', '1-2': '1-2 Years', '2-3': '2-3 Years', '3-5': '3-5 Years', '5+': '5+ Years' },
  org: { startup: 'Startup', public: 'Public', private: 'Private', ngo: 'NGO' },
}

export const money = (n) => `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
