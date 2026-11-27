import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bookmark, Check, Download, Eye, MoreVertical, PlusCircle, UploadCloud, X, XCircle } from 'react-feather'
import { Briefcase, BookmarkSimple, Buildings, Gear, Plus, Stack, UserCircle, Receipt, FileText, Globe, At as AtSign } from '@phosphor-icons/react'
import { api, rows, LABELS, fmtDate, media } from '../api'
import { useAuth } from '../auth'
import { Brand, DashShell, Mark, PageHead, Pager } from '../components/figma'
import { Spinner, useFetch } from '../components/ui'
import { ChangePassword, F, Notice, SocialLinks, toBody, useAction, useForm } from '../components/shared'

const Empty = ({ children }) => <div className="f-empty">{children}</div>
const daysLeft = (d) => Math.ceil((new Date(d) - Date.now()) / 864e5)
const NAV = [
  ['/employer', 'Overview', Stack], ['/employer/profile', 'Employers Profile', UserCircle], ['/employer/post-job', 'Post a Job', PlusCircle], ['/employer/my-jobs', 'My Jobs', Briefcase],
  ['/employer/saved', 'Saved Candidate', BookmarkSimple], ['/employer/billing', 'Plans & Billing', Receipt], ['/employers', 'All Companies', Buildings], ['/employer/settings', 'Settings', Gear],
]
export function EmployerLayout({ children }) {
  const { user } = useAuth()
  return (
    <DashShell role="employer" title="Employers Dashboard" items={NAV}>
      {user && !user.has_company ? (
        <div className="f-empty"><h3 style={{ color: 'var(--g-900)', marginBottom: 12 }}>Set up your company first</h3><Link to="/employer/setup" className="f-btn">Start account setup <ArrowRight size={24} /></Link></div>
      ) : children}
    </DashShell>
  )
}

const stTone = (j) => (j.status === 'active' && daysLeft(j.expiration_date) >= 0 ? ['green', 'Active', <Check size={16} key="c" />] : ['red', 'Expire', <XCircle size={16} key="x" />])

function JobsTable({ list, onChange }) {
  const [open, setOpen] = useState(null)
  const nav = useNavigate()
  const manage = async (j, body) => { await api.patch(`/jobs/${j.id}/manage/`, body); setOpen(null); onChange?.() }
  const [promo, setPromo] = useState(null)
  if (!list.length) return <Empty>No jobs posted yet. <Link to="/employer/post-job" style={{ color: 'var(--p-500)' }}>Post a job</Link></Empty>
  return (
    <>
      <div className="fd-table">
        <div className="fd-th fe-cols"><span>JOBS</span><span>STATUS</span><span>APPLICATIONS</span><span>ACTIONS</span></div>
        <div>
          {list.map((j) => {
            const [tone, label, ic] = stTone(j)
            const left = daysLeft(j.expiration_date)
            return (
              <div key={j.id} className="fd-tr fe-cols">
                <div><h4>{j.title}</h4><div className="mt"><span>{LABELS.type[j.type]}</span><span>•</span><span>{left >= 0 ? `${left} days remaining` : fmtDate(j.expiration_date)}</span></div></div>
                <span className={`fd-st ${tone}`}>{ic}{label}</span>
                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>👥 {j.apply_count} Applications</span>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <Link to={`/employer/applications/${j.id}`} className="f-btn gray">View Applications</Link>
                  <div className="fe-menu">
                    <button className="f-icon-btn" style={{ color: 'var(--g-600)' }} onClick={() => setOpen(open === j.id ? null : j.id)}><MoreVertical size={24} /></button>
                    {open === j.id && (
                      <div className="pop">
                        <button className="first" onClick={() => { setPromo(j); setOpen(null) }}><PlusCircle size={16} />Promote Job</button>
                        <Link to={`/jobs/${j.id}`}><Eye size={16} />View Detail</Link>
                        <button onClick={() => manage(j, { status: 'expired' })}><XCircle size={16} />Mark as expired</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {promo && <PromoteModal job={promo} onClose={() => setPromo(null)} onDone={() => { setPromo(null); onChange?.() }} />}
      <span style={{ display: 'none' }}>{nav.name}</span>
    </>
  )
}

export function EmployerOverview() {
  const { user } = useAuth()
  const dash = useFetch(() => (user?.has_company ? api.get('/companies/dashboard/') : Promise.resolve(null)), [user?.has_company])
  const jobs = useFetch(() => (user?.has_company ? api.get('/companies/jobs/?page_size=5') : Promise.resolve(null)), [user?.has_company])
  const d = dash.data || {}
  return (
    <EmployerLayout>
      <h3 className="fd-h">Hello, {d.name || user?.first_name}</h3>
      <p className="fd-sub">Here is your daily activities and applications</p>
      <div className="fd-stats" style={{ gridTemplateColumns: 'repeat(2, 312px)' }}>
        <div className="fd-stat" style={{ background: '#e7f0fa' }}><div><b>{d.active_job_count ?? 0}</b><span>Open Jobs</span></div><div className="ic"><Briefcase size={32} weight="duotone" /></div></div>
        <div className="fd-stat" style={{ background: '#fff6e6' }}><div><b>{d.saved_candidate_count ?? 0}</b><span>Saved Candidates</span></div><div className="ic" style={{ color: '#ffa500' }}><BookmarkSimple size={32} /></div></div>
      </div>
      <div className="fd-ttl" style={{ marginTop: 40 }}><h4>Recently Posted Jobs</h4><Link to="/employer/my-jobs">View all <ArrowRight size={24} /></Link></div>
      {jobs.loading ? <Spinner /> : <JobsTable list={rows(jobs.data)} onChange={jobs.reload} />}
    </EmployerLayout>
  )
}

export function MyJobs() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const { data, loading, reload } = useFetch(() => api.get(`/companies/jobs/?page=${page}&page_size=10${status ? `&status=${status}` : ''}`), [page, status])
  return (
    <EmployerLayout>
      <div className="fd-ttl"><h4>My Jobs <small>({data?.count ?? 0})</small></h4>
        <div className="fe-filter">Job status<select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">All Jobs</option><option value="active">Active</option><option value="draft">Draft</option><option value="expired">Expired</option></select></div></div>
      {loading ? <Spinner /> : <JobsTable list={rows(data)} onChange={reload} />}
      <Pager count={data?.count} page={page} size={10} onPage={setPage} />
    </EmployerLayout>
  )
}

const COLS = [['pending', 'All Application'], ['reviewed', 'Shortlisted'], ['accepted', 'Hired'], ['rejected', 'Rejected']]

export function Applications() {
  const { jobId } = useParams()
  const jobs = useFetch(() => api.get('/companies/jobs/?page_size=100'))
  const list = rows(jobs.data)
  const id = jobId || list[0]?.id
  const apps = useFetch(() => (id ? api.get(`/companies/jobs/${id}/applications/?page_size=100`) : Promise.resolve(null)), [id])
  const [over, setOver] = useState(null)
  const [open, setOpen] = useState(null)
  const nav = useNavigate()
  const items = rows(apps.data)
  const move = async (a, status) => { if (a.status === status) return; await api.patch(`/companies/jobs/${id}/applications/${a.id}/`, { status }); apps.reload() }
  const job = list.find((j) => String(j.id) === String(id))
  return (
    <EmployerLayout>
      <div className="fd-ttl"><div><div className="fd-sub" style={{ marginTop: 0 }}>Home / Job / <b style={{ color: 'var(--p-500)', fontWeight: 400 }}>Applications</b></div><h4 style={{ fontSize: 18, marginTop: 8 }}>Job Applications {job ? `— ${job.title}` : ''}</h4></div>
        <div className="fe-filter"><select value={id || ''} onChange={(e) => nav(`/employer/applications/${e.target.value}`)}>{list.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select></div></div>
      {apps.loading || jobs.loading ? <Spinner /> : !id ? <Empty>Post a job to receive applications.</Empty> : (
        <div className="kb">
          {COLS.map(([k, label]) => {
            const col = items.filter((a) => a.status === k)
            return (
              <div key={k} className={`kb-col ${over === k ? 'over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(k) }} onDragLeave={() => setOver(null)}
                onDrop={(e) => { e.preventDefault(); setOver(null); const a = items.find((x) => String(x.id) === e.dataTransfer.getData('text')); a && move(a, k) }}>
                <h6><span>{label} ({col.length})</span></h6>
                {col.map((a) => (
                  <div key={a.id} className="kb-card" draggable onDragStart={(e) => e.dataTransfer.setData('text', String(a.id))} onClick={() => setOpen(a)}>
                    <div className="p"><div className="f-avatar48" style={{ width: 40, height: 40 }}>{a.fullname?.[0]}</div><div><b>{a.fullname}</b><small>{a.title_headline}</small></div></div>
                    <ul><li>Applied: {fmtDate(a.applied_at)}</li></ul>
                    {a.cv && <a className="dl" href={a.cv} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><Download size={14} />Download Cv</a>}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
      {open && <ApplicationModal jobId={id} app={open} onClose={() => setOpen(null)} onHire={async () => { await move(open, 'accepted'); setOpen(null) }} />}
    </EmployerLayout>
  )
}

function ApplicationModal({ jobId, app, onClose, onHire }) {
  const { data: c } = useFetch(() => (app.candidate_id ? api.get(`/companies/jobs/${jobId}/applicant/${app.candidate_id}/`) : Promise.resolve(null)), [app.id])
  const info = c ? [['Date of birth', c.date_of_birth], ['Nationality', c.nationality], ['Marital status', c.marital_status], ['Gender', c.gender], ['Experience', LABELS.experience[c.experience]], ['Educations', (c.educations || []).join(', ')]].filter(([, v]) => v) : []
  return (
    <div className="fs-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fp-modal" style={{ padding: 32 }}>
        <button className="x" onClick={onClose}><X size={20} /></button>
        <div className="row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}><div className="f-avatar48" style={{ width: 56, height: 56 }}>{app.fullname?.[0]}</div><div><h4 style={{ fontSize: 18, fontWeight: 500 }}>{app.fullname}</h4><span className="fd-sub">{app.title_headline}</span></div></div>
          <div style={{ display: 'flex', gap: 12 }}><a className="f-btn line" href={`mailto:${app.email}`}>Send Mail</a><button className="f-btn" onClick={onHire}>Hire Candidates</button></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 32 }}>
          <div>
            <h5 style={{ fontSize: 14, letterSpacing: '.04em', marginBottom: 12 }}>BIOGRAPHY</h5><p className="txt" style={{ fontSize: 14, color: 'var(--g-600)', whiteSpace: 'pre-line' }}>{c?.biography || '—'}</p>
            <h5 style={{ fontSize: 14, letterSpacing: '.04em', margin: '24px 0 12px' }}>COVER LETTER</h5><p className="txt" style={{ fontSize: 14, color: 'var(--g-600)', whiteSpace: 'pre-line' }}>{app.letter || '—'}</p>
          </div>
          <div>
            <div className="f-box" style={{ padding: 16 }}><div className="f-4">{info.map(([k, v]) => <div key={k}><small>{k}</small><b style={{ textTransform: 'capitalize' }}>{v}</b></div>)}</div></div>
            {app.cv && <div className="f-box" style={{ padding: 16 }}><h6 style={{ fontSize: 14, marginBottom: 12 }}>Download My Resume</h6><a className="f-btn soft block sm" href={app.cv} target="_blank" rel="noreferrer"><FileText size={16} />Download</a></div>}
            <div className="f-box" style={{ padding: 16 }}><h6 style={{ fontSize: 14, marginBottom: 12 }}>Contact Information</h6><div className="f-contact" style={{ gap: 12 }}><div><AtSign size={20} /><div><small>Email address</small><b style={{ fontSize: 13 }}>{app.email}</b></div></div></div></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PromoteModal({ job, onClose, onDone }) {
  const [t, setT] = useState('featured')
  const [busy, setBusy] = useState(false)
  const go = async () => { setBusy(true); try { await api.patch(`/jobs/${job.id}/manage/`, { promote_type: t }) } finally { setBusy(false); onDone() } }
  return (
    <div className="fs-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fp-modal" style={{ width: 600, padding: 32 }}>
        <button className="x" onClick={onClose}><X size={20} /></button>
        <h5 style={{ fontSize: 18, fontWeight: 500 }}>Promote Job: {job.title}</h5>
        <p className="fd-sub" style={{ margin: '8px 0 20px' }}>Fusce commodo, sem non tempor convallis, sapien tellus bibendum turpis, non pharetra nisl velit pulvinar lectus.</p>
        <div className="kb" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {[['featured', 'Featured Your Job', 'ALWAYS ON THE TOP'], ['urgent', 'Highlight Your Job', 'HIGHLIGHT JOB WITH COLOR']].map(([k, l, p]) => (
            <label key={k} className={`fp-opt ${t === k ? 'on' : ''}`}><div className="pic">{p}</div><span style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 500, fontSize: 14 }}><input type="radio" checked={t === k} onChange={() => setT(k)} />{l}</span>
              <span className="fd-sub" style={{ marginTop: 0, fontSize: 12 }}>Sed neque diam, lacinia nec dolor et, euismod bibendum turpis.</span></label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}><button className="fd-sub" onClick={onClose}>Skip Now</button><button className="f-btn" disabled={busy} onClick={go}>PROMOTE JOB <ArrowRight size={24} /></button></div>
      </div>
    </div>
  )
}

export function PostJob() {
  const roles = useFetch(() => api.get('/common/job-roles/'))
  const educations = useFetch(() => api.get('/common/educations/'))
  const [v, set] = useForm({ title: '', tags: '', job_role: '', min_salary: '', max_salary: '', salary_type: 'monthly', education: '', experience: '', type: 'fulltime', vacancy: 1, expiration_date: '', level: '', apply_type: 'online', description: '', responsibilities: '' })
  const [st, run] = useAction()
  const [done, setDone] = useState(null)
  const submit = (e) => { e.preventDefault(); run(async () => { const r = await api.post('/jobs/create/', toBody(v)); setDone({ id: r.id, title: v.title }) }, '') }
  const opts = (o) => Object.entries(o).map(([k, l]) => <option key={k} value={k}>{l}</option>)
  return (
    <EmployerLayout>
      <h3 className="fd-h">Post a job</h3>
      <form onSubmit={submit} style={{ marginTop: 24 }}>
        <div className="fs-grid">
          <F label="Job Title" full><input value={v.title} onChange={set('title')} placeholder="Add job title, role, vacancies etc" required /></F>
          <F label="Tags"><input value={v.tags} onChange={set('tags')} placeholder="Job keyword, tags etc.." /></F>
          <F label="Job Role"><select value={v.job_role} onChange={set('job_role')}><option value="">Select...</option>{rows(roles.data).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></F>
        </div>
        <div className="fs-sec" style={{ border: 0, paddingBottom: 0, marginTop: 32 }}><h5>Salary</h5>
          <div className="fs-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <F label="Min Salary"><input type="number" min="0" value={v.min_salary} onChange={set('min_salary')} placeholder="Minimum salary..." required /></F>
            <F label="Max Salary"><input type="number" min="0" value={v.max_salary} onChange={set('max_salary')} placeholder="Maximum salary..." required /></F>
            <F label="Salary Type"><select value={v.salary_type} onChange={set('salary_type')}>{opts(LABELS.salary_type)}</select></F>
          </div></div>
        <div className="fs-sec" style={{ border: 0, paddingBottom: 0 }}><h5>Advance Information</h5>
          <div className="fs-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <F label="Education"><select value={v.education} onChange={set('education')}><option value="">Select...</option>{rows(educations.data).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></F>
            <F label="Experience"><select value={v.experience} onChange={set('experience')}><option value="">Select...</option>{opts(LABELS.experience)}</select></F>
            <F label="Job Type"><select value={v.type} onChange={set('type')}>{opts(LABELS.type)}</select></F>
            <F label="Vacancies"><input type="number" min="1" value={v.vacancy} onChange={set('vacancy')} /></F>
            <F label="Expiration Date"><input type="date" value={v.expiration_date} onChange={set('expiration_date')} required /></F>
            <F label="Job Level"><select value={v.level} onChange={set('level')}><option value="">Select...</option>{opts(LABELS.level)}</select></F>
          </div></div>
        <div className="fs-sec" style={{ background: 'var(--g-50)', padding: 24, borderRadius: 8, border: 0 }}><h5>Apply Job on:</h5>
          <div className="fs-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[['online', 'On Jobpilot', 'Candidate apply job using jobpilot & all application will show on your dashboard.'], ['external', 'External Platform', 'Candidate apply job on your website, all application on your website.'], ['email', 'On Your Email', 'Candidate apply job on your email address, and all application in your email.']].map(([k, l, d]) => (
              <label key={k} style={{ background: '#fff', borderRadius: 6, padding: 16, display: 'flex', gap: 12, cursor: 'pointer', border: v.apply_type === k ? '1px solid var(--p-500)' : '1px solid transparent' }}>
                <input type="radio" checked={v.apply_type === k} onChange={() => set('apply_type')(k)} style={{ accentColor: '#0a65cc' }} /><span><b style={{ fontWeight: 500, fontSize: 14 }}>{l}</b><br /><span className="fd-sub" style={{ fontSize: 12 }}>{d}</span></span></label>))}
          </div></div>
        <div className="fs-grid" style={{ marginTop: 32 }}>
          <F label="Description" full><textarea value={v.description} onChange={set('description')} placeholder="Add your job description..." required /></F>
          <F label="Responsibilities" full><textarea value={v.responsibilities} onChange={set('responsibilities')} placeholder="Add your job responsibilities..." /></F>
        </div>
        <Notice state={st} />
        <button className="f-btn lg" style={{ marginTop: 24 }} disabled={st.busy}>Post Job <ArrowRight size={24} /></button>
      </form>
      {done && (
        <div className="fs-modal-bg"><div className="fp-modal" style={{ width: 600 }}>
          <div style={{ padding: 32, borderBottom: '1px solid var(--g-100)' }}><b style={{ fontSize: 16, fontWeight: 500 }}>🎉 Congratulation, Your Job is successfully posted!</b><p className="fd-sub">You can manage your form my-jobs section in your dashboard</p>
            <Link to="/employer/my-jobs" className="f-btn line sm" style={{ marginTop: 16 }}>View Jobs <ArrowRight size={16} /></Link></div>
          <div style={{ padding: 32 }}><PromoteInline job={done} /></div>
        </div></div>
      )}
    </EmployerLayout>
  )
}
function PromoteInline({ job }) {
  const nav = useNavigate()
  const [t, setT] = useState('featured')
  return (
    <>
      <h5 style={{ fontSize: 18, fontWeight: 500 }}>Promote Job: {job.title}</h5>
      <div className="kb" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
        {[['featured', 'Featured Your Job', 'ALWAYS ON THE TOP'], ['urgent', 'Highlight Your Job', 'HIGHLIGHT JOB WITH COLOR']].map(([k, l, p]) => (
          <label key={k} className={`fp-opt ${t === k ? 'on' : ''}`}><div className="pic">{p}</div><span style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 500, fontSize: 14 }}><input type="radio" checked={t === k} onChange={() => setT(k)} />{l}</span></label>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}><button className="fd-sub" onClick={() => nav('/employer/my-jobs')}>Skip Now</button>
        <button className="f-btn" onClick={async () => { await api.patch(`/jobs/${job.id}/manage/`, { promote_type: t }); nav('/employer/my-jobs') }}>PROMOTE JOB <ArrowRight size={24} /></button></div>
    </>
  )
}

export function SavedCandidates() {
  const [page, setPage] = useState(1)
  const { data, loading, reload } = useFetch(() => api.get(`/companies/wishlist/?page=${page}&page_size=10`), [page])
  const list = rows(data)
  return (
    <EmployerLayout>
      <div className="fd-ttl"><h4>Saved Candidates</h4><span className="fd-sub" style={{ margin: 0 }}>All of the candidates are visible until 24 march, 2021</span></div>
      {loading ? <Spinner /> : !list.length ? <Empty>No saved candidates. <Link to="/candidates" style={{ color: 'var(--p-500)' }}>Browse candidates</Link></Empty> : list.map((s) => (
        <div key={s.id} className="fd-row">
          <div className="jb"><Mark name={s.candidate_fullname} src={s.candidate_photo} size="s56" /><div><h4>{s.candidate_fullname}</h4><div className="mt"><span>saved {fmtDate(s.saved_at)}</span></div></div></div>
          <div className="acts"><button className="f-icon-btn on" onClick={() => api.post(`/companies/wishlist/${s.candidate_id}/`).then(reload)} title="Remove"><Bookmark size={24} fill="currentColor" /></button>
            <Link className="f-btn gray" to="/candidates">View Profile <ArrowRight size={24} /></Link></div>
        </div>
      ))}
      <Pager count={data?.count} page={page} size={10} onPage={setPage} />
    </EmployerLayout>
  )
}

const PLANS = [
  { name: 'BASIC', price: 19, perks: ['Post 1 Job', 'Urgents & Featured Jobs', 'Highlights Job with Colors', 'Access & Saved 5 Candidates', '10 Days Resume Visibility', '24/7 Critical Support'] },
  { name: 'STANDARD', price: 39, rec: true, perks: ['3 Active Jobs', 'Urgents & Featured Jobs', 'Highlights Job with Colors', 'Access & Saved 10 Candidates', '20 Days Resume Visibility', '24/7 Critical Support'] },
  { name: 'PREMIUM', price: 59, perks: ['6 Active Jobs', 'Urgents & Featured Jobs', 'Highlights Job with Colors', 'Access & Saved 20 Candidates', '30 Days Resume Visibility', '24/7 Critical Support'] },
]
export function PlansGrid() {
  const [pick, setPick] = useState(null)
  return (
    <>
      <div className="plans">
        {PLANS.map((p) => (
          <div key={p.name} className={`plan ${p.rec ? 'rec' : ''}`}>
            {p.rec && <span className="tag">Recommendation</span>}
            <small>{p.name}</small><p>Praesent eget pulvinar orci. Duis ut pellentesque ligula convallis.</p>
            <div className="price">${p.price} <span>/Monthly</span></div>
            <ul>{p.perks.map((x) => <li key={x}><Check size={14} />{x}</li>)}</ul>
            <button className={`f-btn ${p.rec ? '' : 'soft'} block`} onClick={() => setPick(p)}>Choose Plan <ArrowRight size={24} /></button>
          </div>
        ))}
      </div>
      {pick && (
        <div className="fs-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && setPick(null)}>
          <div className="fs-modal"><h5>Checkout</h5>
            <div className="f-box" style={{ padding: 16 }}><div className="f-info"><div><span>Pricing Plans:</span><b>{pick.name[0] + pick.name.slice(1).toLowerCase()}</b></div><div><span>Total:</span><b>${pick.price}.00 USD</b></div></div></div>
            <div className="fs-msg err">Online payment is not connected yet, so no card details are collected here. Contact support to activate this plan.</div>
            <button className="f-btn block" style={{ marginTop: 16 }} onClick={() => setPick(null)}>Close</button></div>
        </div>
      )}
    </>
  )
}
export function Billing() {
  return (<EmployerLayout><h3 className="fd-h">Plans &amp; Billing</h3><p className="fd-sub" style={{ marginBottom: 56 }}>Choose a plan to post more jobs. Billing history will appear here once payments are connected.</p><PlansGrid /></EmployerLayout>)
}
export function Pricing() {
  return (<><PageHead title="Pricing Plans" trail={[[null, 'Pricing Plans']]} /><div className="f-container" style={{ padding: '80px 0 100px' }}><h2 className="f-h2" style={{ textAlign: 'center', marginBottom: 64 }}>Buy Premium Subscription to Post a Job</h2><PlansGrid /></div></>)
}

export function EmployerSettings({ account }) {
  const { user, reload: reloadUser, logout } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState(account ? 'account' : 'company')
  const company = useFetch(() => (user?.has_company ? api.get('/companies/me/') : Promise.resolve(null)), [user?.has_company])
  const countries = useFetch(() => api.get('/common/countries/'))
  const [v, set, setV] = useForm({})
  const [st, run] = useAction()
  useEffect(() => { const c = company.data; if (c) setV({ ...c, country: c.country?.id ?? c.country ?? '', logo: undefined, banner_image: undefined }) }, [company.data, setV])
  const save = (e) => {
    e.preventDefault()
    const { id, social_links, ...rest } = v
    run(async () => { await api.patch('/companies/me/update/', toBody(rest)); company.reload() })
  }
  const del = async () => { if (window.confirm('Delete your company permanently? This cannot be undone.')) { await api.del('/companies/me/delete/'); await reloadUser(); nav('/employer/setup') } }
  const delAcc = async () => { if (window.confirm('Delete your account permanently? This cannot be undone.')) { await api.del('/accounts/me/'); logout(); nav('/') } }
  const tabs = [['company', 'Company Info', UserCircle], ['founding', 'Founding Info', Buildings], ['social', 'Social Media Profile', Globe], ['account', 'Account Setting', Gear]]
  const opts = (o) => Object.entries(o).map(([k, l]) => <option key={k} value={k}>{l}</option>)
  const Save = <><Notice state={st} /><button className="f-btn" style={{ marginTop: 24 }} disabled={st.busy}>Save Changes</button></>
  return (
    <EmployerLayout>
      <h3 className="fd-h">Settings</h3>
      <div className="fs-tabs">{tabs.map(([k, l, I]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><I size={20} />{l}</button>)}</div>
      {company.loading ? <Spinner /> : (
        <>
          {tab === 'company' && (
            <form onSubmit={save}><h5 style={{ marginBottom: 20 }}>Logo &amp; Banner Image</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, marginBottom: 24 }}>
                <F label="Upload Logo"><label className="fs-drop">{v.logo ? <b>{v.logo.name}</b> : <><UploadCloud size={28} color="#767f8c" /><span><b>Browse photo</b> or drop here</span></>}<input type="file" accept="image/*" style={{ display: 'none' }} onChange={set('logo')} /></label></F>
                <F label="Banner Image"><label className="fs-drop">{v.banner_image ? <b>{v.banner_image.name}</b> : <><UploadCloud size={28} color="#767f8c" /><span><b>Browse photo</b> or drop here</span></>}<input type="file" accept="image/*" style={{ display: 'none' }} onChange={set('banner_image')} /></label></F>
              </div>
              <div className="fs-grid"><F label="Company name" full><input value={v.name || ''} onChange={set('name')} required /></F>
                <F label="About us" full><textarea value={v.description || ''} onChange={set('description')} placeholder="Write down about your company here. Let the candidate know who we are..." /></F></div>{Save}</form>
          )}
          {tab === 'founding' && (
            <form onSubmit={save}><div className="fs-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <F label="Organization Type"><select value={v.organization_type || ''} onChange={set('organization_type')}><option value="">Select...</option>{opts(LABELS.org)}</select></F>
              <F label="Team Size"><select value={v.team_size || ''} onChange={set('team_size')}><option value="">Select...</option>{['1-10', '10-50', '50-100', '100-200', '200+'].map((x) => <option key={x}>{x}</option>)}</select></F>
              <F label="Country"><select value={v.country || ''} onChange={set('country')}><option value="">Select...</option>{rows(countries.data).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F>
              <F label="Year of Establishment"><input type="number" value={v.establishment_year || ''} onChange={set('establishment_year')} /></F>
              <F label="Company Website"><input type="url" value={v.company_web || ''} onChange={set('company_web')} placeholder="Website url..." /></F>
              <F label="Location"><input value={v.location || ''} onChange={set('location')} /></F>
              <F label="Company Vision" full><textarea value={v.vision || ''} onChange={set('vision')} placeholder="Tell us about your company vision..." /></F></div>{Save}</form>
          )}
          {tab === 'social' && <SocialLinks />}
          {tab === 'account' && (
            <>
              <form className="fs-sec" onSubmit={save}><h5>Contact Info</h5>
                <div className="fs-grid"><F label="Phone" full><input value={v.phone_number || ''} onChange={set('phone_number')} placeholder="Phone number.." /></F><F label="Email" full><input type="email" value={v.email || ''} onChange={set('email')} placeholder="Email address" /></F></div>{Save}</form>
              <ChangePassword endpoint="/companies/change-password/" />
              <div className="fs-sec"><h5>Delete Your Account</h5><p className="fd-sub" style={{ marginTop: 0, maxWidth: 520 }}>If you delete your account, your company, jobs and all applications will be removed and cannot be restored.</p>
                <div style={{ display: 'flex', gap: 24, marginTop: 16 }}><button type="button" className="fd-st red" onClick={del}>Delete company</button><button type="button" className="fd-st red" onClick={delAcc}>Close Account</button></div></div>
            </>
          )}
        </>
      )}
    </EmployerLayout>
  )
}

const STEPS = [['Company Info', UserCircle], ['Founding Info', Buildings], ['Social Media Profile', Globe], ['Contact', AtSign]]
export function SetupWizard() {
  const { user, reload } = useAuth()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const countries = useFetch(() => api.get('/common/countries/'))
  const [v, set] = useForm({ name: '', description: '', organization_type: '', team_size: '', establishment_year: '', company_web: '', vision: '', country: '', location: '', phone_number: '', email: '' })
  const [st, run] = useAction()
  if (!user) return <Navigate to="/signin" replace />
  const next = (e) => {
    e.preventDefault()
    run(async () => {
      const body = toBody({ ...v })
      if (step === 0 && !user.has_company) { await api.post('/companies/register/', body); await reload() }
      else if (step !== 2) await api.patch('/companies/me/update/', body)
      setStep(step + 1)
    }, '')
  }
  const pct = [0, 25, 50, 75, 100][step]
  const opts = (o) => Object.entries(o).map(([k, l]) => <option key={k} value={k}>{l}</option>)
  const Nav = ({ last }) => (
    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
      {step > 0 && <button type="button" className="f-btn gray" onClick={() => setStep(step - 1)}>Previous</button>}
      <button className="f-btn" disabled={st.busy}>{last ? 'Finish Editing' : 'Save & Next'} <ArrowRight size={24} /></button>
    </div>
  )
  return (
    <div className="fw-wrap">
      <div className="fw-top"><Brand />{step < 4 && <div style={{ fontSize: 12, color: 'var(--g-500)' }}>Setup Progress <b style={{ color: 'var(--p-500)', marginLeft: 24, fontWeight: 500 }}>{pct}% Completed</b><div className="fw-bar" style={{ marginTop: 6 }}><i style={{ width: `${pct}%` }} /></div></div>}</div>
      {step === 4 ? (
        <div className="fa-center" style={{ minHeight: '60vh' }}><div className="box" style={{ width: 440 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--p-50)', display: 'grid', placeItems: 'center', margin: '0 auto', color: 'var(--p-500)' }}><Check size={36} /></div>
          <h3 style={{ fontSize: 20, fontWeight: 500 }}>🎉 Congratulations, Your profile is 100% complete!</h3>
          <p className="sub" style={{ fontSize: 14 }}>Your company profile is ready. You can now post jobs and receive applications.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}><Link to="/employer" className="f-btn soft">View Dashboard</Link><Link to="/employer/post-job" className="f-btn">Post Job <ArrowRight size={24} /></Link></div></div></div>
      ) : (
        <form className="fw-main" onSubmit={next}>
          <div className="fw-steps">{STEPS.map(([l, I], i) => <span key={l} className={i === step ? 'on' : ''}><I size={20} />{l}</span>)}</div>
          {step === 0 && <><h5 style={{ marginBottom: 20 }}>Logo &amp; Banner Image</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, marginBottom: 24 }}>
              <F label="Upload Logo"><label className="fs-drop">{v.logo ? <b>{v.logo.name}</b> : <><UploadCloud size={28} color="#767f8c" /><span><b>Browse photo</b> or drop here</span></>}<input type="file" accept="image/*" style={{ display: 'none' }} onChange={set('logo')} /></label></F>
              <F label="Banner Image"><label className="fs-drop">{v.banner_image ? <b>{v.banner_image.name}</b> : <><UploadCloud size={28} color="#767f8c" /><span><b>Browse photo</b> or drop here</span></>}<input type="file" accept="image/*" style={{ display: 'none' }} onChange={set('banner_image')} /></label></F></div>
            <div className="fs-grid"><F label="Company name" full><input value={v.name} onChange={set('name')} required /></F><F label="About us" full><textarea value={v.description} onChange={set('description')} placeholder="Write down about your company here. Let the candidate know who we are..." /></F></div></>}
          {step === 1 && <div className="fs-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <F label="Organization Type"><select value={v.organization_type} onChange={set('organization_type')}><option value="">Select...</option>{opts(LABELS.org)}</select></F>
            <F label="Team Size"><select value={v.team_size} onChange={set('team_size')}><option value="">Select...</option>{['1-10', '10-50', '50-100', '100-200', '200+'].map((x) => <option key={x}>{x}</option>)}</select></F>
            <F label="Country"><select value={v.country} onChange={set('country')}><option value="">Select...</option>{rows(countries.data).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F>
            <F label="Year of Establishment"><input type="number" value={v.establishment_year} onChange={set('establishment_year')} placeholder="yyyy" /></F>
            <F label="Company Website"><input type="url" value={v.company_web} onChange={set('company_web')} placeholder="Website url..." /></F>
            <F label="Company Vision" full><textarea value={v.vision} onChange={set('vision')} placeholder="Tell us about your company vision..." /></F></div>}
          {step === 2 && <SocialLinks />}
          {step === 3 && <div className="fs-grid"><F label="Map Location" full><input value={v.location} onChange={set('location')} /></F><F label="Phone" full><input value={v.phone_number} onChange={set('phone_number')} placeholder="Phone number.." /></F><F label="Email" full><input type="email" value={v.email} onChange={set('email')} placeholder="Email address" /></F></div>}
          <Notice state={st} />
          <Nav last={step === 3} />
        </form>
      )}
    </div>
  )
}
