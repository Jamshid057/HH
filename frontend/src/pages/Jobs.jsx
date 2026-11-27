import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api, qs, rows, LABELS, money, fmtDate, media } from '../api'
import { useAuth } from '../auth'
import { ArrowRight, Bell, Bookmark, Facebook, Grid, Layers, Link2, List, Mail, MapPin, Phone, Search, Sliders, Twitter, XCircle } from 'react-feather'
import { Briefcase, CalendarBlank, GraduationCap, MapPinLine, Timer, Wallet } from '@phosphor-icons/react'
import { Field, Modal, Select, Spinner, useFetch } from '../components/ui'
import { JobCardGrid, JobRow, Mark, PageHead, Pager as FPager } from '../components/figma'
import { useSaved } from '../useSaved'

const FILTERS = ['title', 'location', 'job_role_id', 'type', 'experience', 'education_id', 'job_level', 'salary_type', 'latest']

export function Jobs() {
  const [sp, setSp] = useSearchParams()
  const [view, setView] = useState('grid')
  const [adv, setAdv] = useState(false)
  const page = Number(sp.get('page') || 1)
  const size = Number(sp.get('page_size') || 12)
  const params = Object.fromEntries(FILTERS.map((k) => [k, sp.get(k) || '']))
  const [draft, setDraft] = useState(params)
  useEffect(() => setDraft(Object.fromEntries(FILTERS.map((k) => [k, sp.get(k) || '']))), [sp])

  const roles = useFetch(() => api.get('/common/job-roles/'))
  const educations = useFetch(() => api.get('/common/educations/'))
  const jobs = useFetch(() => api.get(`/jobs/${qs({ ...params, page, page_size: size })}`), [sp.toString()])
  const { isSaved, toggle } = useSaved()

  const apply = (next = draft) => {
    const n = {}
    Object.entries(next).forEach(([k, v]) => v && (n[k] = v))
    if (size !== 12) n.page_size = size
    setSp(n)
  }
  const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }))
  const label = (k, v) => ({
    job_role_id: rows(roles.data).find((r) => String(r.id) === v)?.name,
    education_id: rows(educations.data).find((e) => String(e.id) === v)?.name,
    type: LABELS.type[v], experience: LABELS.experience[v], job_level: LABELS.level[v], salary_type: LABELS.salary_type[v],
    latest: { today: 'Today', weekly: 'Last 7 days', monthly: 'Last 30 days' }[v],
  }[k] || v)
  const removeChip = (k) => { const n = { ...params, [k]: '' }; setDraft(n); apply(n) }
  const chips = FILTERS.filter((k) => params[k])
  const list = rows(jobs.data)

  return (
    <>
      <PageHead title="Find Job" trail={[[null, 'Find Job']]} />
      <div className="f-finder">
        <div className="f-container" style={{ paddingTop: 0 }}>
          <form className="f-adv" style={{ marginTop: -0 }} onSubmit={(e) => { e.preventDefault(); apply() }}>
            <label className="fld" style={{ flex: '0 0 375px' }}><Search size={24} /><input placeholder="Job tittle, Keyword..." value={draft.title} onChange={(e) => set('title')(e.target.value)} /></label>
            <label className="fld"><MapPin size={24} /><input placeholder="Location" value={draft.location} onChange={(e) => set('location')(e.target.value)} /></label>
            <label className="fld"><Layers size={24} /><select value={draft.job_role_id} onChange={(e) => set('job_role_id')(e.target.value)}><option value="">Select Category</option>{rows(roles.data).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
            <button type="button" className="advbtn" onClick={() => setAdv(!adv)}><Sliders size={20} />Advance Filter</button>
            <button className="f-btn lg">Find Job</button>
          </form>
          {adv && (
            <div className="f-advpanel">
              {[['type', 'Job Type', LABELS.type], ['experience', 'Experience', LABELS.experience], ['job_level', 'Job Level', LABELS.level], ['salary_type', 'Salary Type', LABELS.salary_type], ['latest', 'Date Posted', { today: 'Today', weekly: 'Last 7 days', monthly: 'Last 30 days' }]].map(([k, l, o]) => (
                <label key={k}>{l}<select value={draft[k]} onChange={(e) => set(k)(e.target.value)}><option value="">All</option>{Object.entries(o).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
              ))}
              <label>Education<select value={draft.education_id} onChange={(e) => set('education_id')(e.target.value)}><option value="">All</option>{rows(educations.data).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}><button className="f-btn" type="button" onClick={() => apply()}>Apply</button><button className="f-btn gray" type="button" onClick={() => { setDraft(Object.fromEntries(FILTERS.map((k) => [k, '']))); setSp({}) }}>Clear</button></div>
            </div>
          )}
        </div>
      </div>
      <div className="f-filterbar">
        <div className="f-container">
          <div className="f-chips">{chips.map((k) => <span key={k} className="f-chip">{label(k, params[k])}<button onClick={() => removeChip(k)}><XCircle size={20} /></button></span>)}</div>
          <div className="f-ctrl">
            <select className="f-sel" defaultValue="latest"><option value="latest">Latest</option></select>
            <select className="f-sel" value={size} onChange={(e) => setSp({ ...Object.fromEntries(sp), page_size: e.target.value, page: 1 })}>{[12, 24, 48].map((n) => <option key={n} value={n}>{n} per page</option>)}</select>
            <div className="f-view"><button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} title="Grid"><Grid size={18} /></button><button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} title="List"><List size={18} /></button></div>
          </div>
        </div>
      </div>
      <div className="f-results">
        <div className="f-container">
          {jobs.loading ? <Spinner /> : list.length === 0 ? <div className="f-empty">No jobs match your filters.</div> : view === 'grid' ? (
            <div className="f-gridjobs">{list.map((j) => <JobCardGrid key={j.id} job={j} onSave={toggle} saved={isSaved(j.id)} />)}</div>
          ) : (
            <div className="f-list-jobs">{list.map((j) => <JobRow key={j.id} job={j} onSave={toggle} saved={isSaved(j.id)} />)}</div>
          )}
          <FPager count={jobs.data?.count} page={page} size={size} onPage={(p) => setSp({ ...Object.fromEntries(sp), page: p })} />
        </div>
      </div>
    </>
  )
}

export function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data: job, loading, error, reload } = useFetch(() => api.get(`/jobs/${id}/`), [id])
  const co = useFetch(() => (job ? api.get(`/companies/${job.company.id}/`) : Promise.resolve(null)), [job?.company?.id])
  const related = useFetch(() => (job ? api.get(`/jobs/${qs({ job_role_id: job.job_role?.id, page_size: 7 })}`) : Promise.resolve(null)), [job?.id])
  const [applying, setApplying] = useState(false)
  const [toast, setToast] = useState('')

  if (loading) return <Spinner />
  if (error) return <div className="f-empty">Job not found.</div>

  const c = co.data || job.company
  const save = async () => {
    if (user?.role !== 'candidate') return (window.location.href = '/signin')
    await api.post(`/candidates/wishlist/${job.id}/`)
    reload()
  }
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 3000) }
  const alert = async () => {
    if (!user) return (window.location.href = '/signin')
    notify((await api.post(`/jobs/${job.id}/alert/`)).message)
  }
  const resp = (job.responsibilities || '').split('\n').map((x) => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
  const ov = [
    [CalendarBlank, 'Job Posted:', fmtDate(job.created_at)], [Timer, 'Job Expire In:', fmtDate(job.expiration_date)], [GraduationCap, 'Education', job.education?.name || '—'],
    [Wallet, 'Salary:', `${money(job.min_salary)} - ${money(job.max_salary)}`], [MapPinLine, 'Location:', c.location || '—'], [Briefcase, 'Job Type:', LABELS.type[job.type]],
    [Briefcase, 'Experience', LABELS.experience[job.experience] || '—'], [Briefcase, 'Job Level', LABELS.level[job.level] || '—'], [Briefcase, 'Vacancies', String(job.vacancy)],
  ]
  const info = [['Founded in:', c.establishment_year], ['Organization type:', LABELS.org[c.organization_type]], ['Team size:', c.team_size && `${c.team_size} Candidates`], ['Phone:', c.phone_number], ['Email:', c.email], ['Website:', c.company_web]].filter(([, v]) => v)
  const others = rows(related.data).filter((j) => j.id !== job.id).slice(0, 6)

  return (
    <>
      <PageHead title="Job Details" trail={[['/jobs', 'Find Job'], job.job_role && [`/jobs?job_role_id=${job.job_role.id}`, job.job_role.name], [null, 'Job Details']].filter(Boolean)} />
      <div className="f-jobhead">
        <div className="f-container">
          <div className="l">
            <div className="ava" style={c.logo ? {} : { background: '#0a65cc' }}>{c.logo ? <img src={media(c.logo)} alt="" /> : c.name?.[0]}</div>
            <div>
              <div className="t"><h1>{job.title}</h1>{job.promote_type === 'featured' && <span className="f-badge red" style={{ background: '#ffeded', color: '#ff4f4f' }}>Featured</span>}<span className="f-badge" style={{ color: '#0066ff' }}>{LABELS.type[job.type]}</span></div>
              <div className="meta">
                {c.company_web && <span><Link2 size={20} />{c.company_web}</span>}
                {c.phone_number && <span><Phone size={22} />{c.phone_number}</span>}
                {c.email && <span><Mail size={22} />{c.email}</span>}
                {!c.company_web && !c.phone_number && !c.email && <span><MapPin size={20} />{job.company.name}</span>}
              </div>
            </div>
          </div>
          <div className="r">
            <div className="row">
              <button className={`f-sq ${job.is_saved ? 'on' : ''}`} onClick={save} title="Save"><Bookmark size={24} fill={job.is_saved ? 'currentColor' : 'none'} /></button>
              <button className="f-sq" onClick={alert} title="Job alert"><Bell size={24} /></button>
              <button className="f-btn lg" style={{ width: 248 }} onClick={() => (user?.role === 'candidate' ? setApplying(true) : (window.location.href = '/signin'))}>Apply now <ArrowRight size={24} /></button>
            </div>
            <div className="exp">Job expire in: <b>{fmtDate(job.expiration_date)}</b></div>
          </div>
        </div>
      </div>
      <div className="f-container">
        <div className="f-detail">
          <div>
            <section><h5>Job Description</h5><p className="txt">{job.description}</p></section>
            {resp.length > 0 && <section><h5>Responsibilities</h5><div className="txt" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{resp.map((r, i) => <span key={i}>{r}</span>)}</div></section>}
            <section className="f-share"><span style={{ color: '#191f33' }}>Share this job:</span>
              <a className="b" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" style={{ color: 'var(--p-500)', borderColor: 'var(--p-100)' }}><Facebook size={18} />Facebook</a>
              <a className="b" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" style={{ color: '#1da1f2' }}><Twitter size={18} />Twitter</a>
              <a className="b" href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" style={{ color: '#ca2127' }}>Pinterest</a>
            </section>
          </div>
          <aside>
            <div className="f-box"><h6>Job Overview</h6>
              <div className="f-ov">{ov.map(([I, l, v]) => <div key={l}><I size={32} /><div><small>{l}</small><b>{v}</b></div></div>)}</div></div>
            <div className="f-box">
              <div className="row" style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 32 }}>
                <Mark name={job.company.name} src={job.company.logo} size="s96" />
                <div><h6 style={{ marginBottom: 8 }}>{job.company.name}</h6><span className="f-sub">{c.organization_type ? LABELS.org[c.organization_type] : 'Company'}</span></div>
              </div>
              <div className="f-info">{info.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
              <div className="f-socbtns">{(c.social_links || []).slice(0, 4).map((l) => <a key={l.id} href={l.url} target="_blank" rel="noreferrer" title={l.social_name}><Link2 size={16} /></a>)}
                <Link to={`/employers/${job.company.id}`} className="f-btn soft sm" style={{ marginLeft: 'auto' }}>View profile</Link></div>
            </div>
          </aside>
        </div>
        {others.length > 0 && (
          <div className="f-related">
            <div className="f-head"><h2 className="f-h2" style={{ color: '#191f33' }}>Related Jobs</h2></div>
            <div className="f-gridjobs">{others.map((j) => <JobCardGrid key={j.id} job={j} />)}</div>
          </div>
        )}
      </div>
      {applying && <ApplyModal job={job} onClose={() => setApplying(false)} onDone={(m) => { setApplying(false); notify(m); reload() }} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}

function ApplyModal({ job, onClose, onDone }) {
  const cvs = useFetch(() => api.get('/candidates/resumes/'))
  const [cv, setCv] = useState('')
  const [letter, setLetter] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const list = rows(cvs.data)

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      await api.post('/candidates/apply/', { job: job.id, cv: cv || list[0]?.id, letter })
      onDone('Application sent successfully.')
    } catch (er) { setErr(er.message) }
    setBusy(false)
  }
  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit}>
        <div className="row between mb-24"><h3>Apply Job: {job.title}</h3><button type="button" onClick={onClose} className="icon-btn" style={{ width: 36, height: 36 }}>✕</button></div>
        <Field label="Choose Resume">
          {list.length === 0
            ? <div className="alert err">You have no CV yet. <Link className="link" to="/dashboard/settings">Add a CV in settings</Link> first.</div>
            : <Select value={cv || list[0]?.id} onChange={setCv} options={list.map((c) => ({ value: c.id, label: c.name }))} />}
        </Field>
        <Field label="Cover Letter" className="mt-16"><textarea className="textarea" value={letter} onChange={(e) => setLetter(e.target.value)} placeholder="Write down your biography here. Let the employers know who you are…" /></Field>
        {err && <div className="alert err mt-16">{err}</div>}
        <div className="row mt-24"><button type="button" className="btn outline" onClick={onClose}>Cancel</button><button className="btn" disabled={busy || list.length === 0}>Apply Now →</button></div>
      </form>
    </Modal>
  )
}
