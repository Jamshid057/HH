import { useState } from 'react'
import { Plus, XCircle } from 'react-feather'
import { api, rows, media } from '../api'
import { Spinner, useFetch } from './ui'

export function useForm(initial) {
  const [v, setV] = useState(initial)
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e?.target ? (e.target.type === 'file' ? e.target.files[0] : e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }))
  return [v, set, setV]
}

// JSON unless a File is present, then multipart (arrays become repeated keys).
export function toBody(obj) {
  const hasFile = Object.values(obj).some((x) => x instanceof File)
  if (!hasFile) {
    const o = {}
    Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') o[k] = v })
    return o
  }
  const f = new FormData()
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v)) v.forEach((x) => f.append(k, x))
    else f.append(k, v)
  })
  return f
}

export function useAction() {
  const [state, setState] = useState({ msg: '', err: '', busy: false })
  const run = async (fn, okMsg = 'Saved successfully.') => {
    setState({ msg: '', err: '', busy: true })
    try { await fn(); setState({ msg: okMsg, err: '', busy: false }) } catch (e) { setState({ msg: '', err: e.message, busy: false }) }
  }
  return [state, run]
}

export const Notice = ({ state }) => (
  <>
    {state.err && <div className="fs-msg err">{state.err}</div>}
    {state.msg && <div className="fs-msg ok">{state.msg}</div>}
  </>
)

export const F = ({ label, full, children }) => (<div className={`fs-f ${full ? 'full' : ''}`}>{label && <label>{label}</label>}{children}</div>)

export function ChangePassword({ endpoint }) {
  const [v, set] = useForm({ current_password: '', new_password: '', confirm_password: '' })
  const [st, run] = useAction()
  return (
    <form className="fs-sec" onSubmit={(e) => { e.preventDefault(); run(() => api.patch(endpoint, v), 'Password changed.') }}>
      <h5>Change Password</h5>
      <div className="fs-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <F label="Current Password"><input type="password" placeholder="Password" value={v.current_password} onChange={set('current_password')} required /></F>
        <F label="New Password"><input type="password" placeholder="Password" value={v.new_password} onChange={set('new_password')} required /></F>
        <F label="Confirm Password"><input type="password" placeholder="Password" value={v.confirm_password} onChange={set('confirm_password')} required /></F>
      </div>
      <Notice state={st} />
      <button className="f-btn" style={{ marginTop: 24 }} disabled={st.busy}>Save Changes</button>
    </form>
  )
}

export function SocialLinks() {
  const links = useFetch(() => api.get('/socials/'))
  const platforms = useFetch(() => api.get('/socials/platforms/'))
  const [drafts, setDrafts] = useState([])
  const [st, run] = useAction()
  const plats = platforms.data || []
  const saved = rows(links.data)

  const save = (e) => {
    e.preventDefault()
    run(async () => {
      for (const d of drafts.filter((x) => x.url)) await api.post('/socials/', { social: Number(d.social || plats[0]?.id), url: d.url })
      setDrafts([]); await links.reload()
    }, 'Social links saved.')
  }
  if (links.loading) return <Spinner />
  return (
    <form onSubmit={save}>
      {saved.map((l, i) => (
        <div key={l.id} className="fs-soc">
          <select disabled><option>{l.social_name}</option></select>
          <input readOnly value={l.url} />
          <button type="button" className="x" onClick={() => api.del(`/socials/${l.id}/`).then(links.reload)} title="Remove"><XCircle size={20} /></button>
          <span style={{ display: 'none' }}>{i}</span>
        </div>
      ))}
      {drafts.map((d, i) => (
        <div key={i} className="fs-soc">
          <select value={d.social || plats[0]?.id} onChange={(e) => setDrafts((s) => s.map((x, j) => (j === i ? { ...x, social: e.target.value } : x)))}>{plats.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <input type="url" placeholder="Profile link/url..." value={d.url} onChange={(e) => setDrafts((s) => s.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
          <button type="button" className="x" onClick={() => setDrafts((s) => s.filter((_, j) => j !== i))}><XCircle size={20} /></button>
        </div>
      ))}
      <button type="button" className="fs-add" onClick={() => setDrafts((s) => [...s, { social: '', url: '' }])}><Plus size={18} />Add New Social Link</button>
      <Notice state={st} />
      <button className="f-btn" style={{ marginTop: 16 }} disabled={st.busy}>Save Changes</button>
    </form>
  )
}
