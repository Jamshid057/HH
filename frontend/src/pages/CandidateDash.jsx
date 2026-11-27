import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bookmark, Calendar, Check, DollarSign, MapPin, Trash2, UploadCloud, X } from 'react-feather'
import { Briefcase, BookmarkSimple, BellRinging, Gear, Stack, User, UserCircle, Globe, FileText } from '@phosphor-icons/react'
import { api, rows, LABELS, fmtDate, media } from '../api'
import { useAuth } from '../auth'
import { DashShell, Mark, Pager } from '../components/figma'
import { Spinner, useFetch } from '../components/ui'
import { ChangePassword, F, Notice, SocialLinks, toBody, useAction, useForm } from '../components/shared'

const stCls = { pending: ['amber', 'Pending'], reviewed: ['blue', 'Reviewed'], accepted: ['green', 'Active'], rejected: ['red', 'Rejected'] }

export function CandidateLayout({ children }) {
  const alerts = useFetch(() => api.get('/jobs/alerts/?page_size=1'))
  const n = alerts.data?.count ?? (Array.isArray(alerts.data) ? alerts.data.length : 0)
  const items = [
    ['/dashboard', 'Overview', Stack], ['/dashboard/applied', 'Applied Jobs', Briefcase], ['/dashboard/favorites', 'Favorite Jobs', BookmarkSimple],
    ['/dashboard/alerts', 'Job Alert', BellRinging, n ? String(n).padStart(2, '0') : ''], ['/dashboard/settings', 'Settings', Gear],
  ]
  return <DashShell role="candidate" title="Candidate Dashboard" items={items}>{children}</DashShell>
}

const Empty = ({ children }) => <div className="f-empty">{children}</div>

function AppliedTable({ list }) {
  if (!list.length) return <Empty>You haven't applied to any jobs yet. <Link className="link" to="/jobs">Find jobs</Link></Empty>
  return (
    <div className="fd-table">
      <div className="fd-th fd-cols-job"><span>Job</span><span>Date Applied</span><span>Status</span><span>Action</span></div>
      <div>
        {list.map((a) => {
          const [tone, label] = stCls[a.status] || ['green', a.status]
          return (
            <div key={`${a.job_id}-${a.applied_at}`} className="fd-tr fd-cols-job">
              <div className="jb"><Mark name={a.company_name} src={a.company_logo} size="s56" />
                <div><h4>{a.title}</h4><div className="mt"><span><MapPin size={16} />{a.company_name}</span></div></div></div>
              <span>{fmtDate(a.applied_at)}</span>
              <span className={`fd-st ${tone}`}>{tone === 'green' && <Check size={16} />}{label}</span>
              <Link to={`/jobs/${a.job_id}`} className="f-btn gray">View Details</Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CandidateOverview() {
  const { user } = useAuth()
  const dash = useFetch(() => api.get('/candidates/dashboard/'))
  const applied = useFetch(() => api.get('/candidates/applied-jobs/?page_size=4'))
  const alerts = useFetch(() => api.get('/jobs/alerts/?page_size=1'))
  const d = dash.data || {}
  const photo = d.profile_photo
  const incomplete = dash.error?.status === 404
  return (
    <CandidateLayout>
      <h3 className="fd-h">Hello, {user?.first_name} {user?.last_name}</h3>
      <p className="fd-sub">Here is your daily activities and job alerts</p>
      <div className="fd-stats">
        <div className="fd-stat" style={{ background: '#e7f0fa' }}><div><b>{d.applied_jobs_count ?? 0}</b><span>Applied jobs</span></div><div className="ic"><Briefcase size={32} weight="duotone" /></div></div>
        <div className="fd-stat" style={{ background: '#fff6e6' }}><div><b>{d.wishlist_count ?? 0}</b><span>Favorite jobs</span></div><div className="ic" style={{ color: '#ffa500' }}><BookmarkSimple size={32} /></div></div>
        <div className="fd-stat" style={{ background: '#e7f6ea' }}><div><b>{alerts.data?.count ?? 0}</b><span>Job Alerts</span></div><div className="ic" style={{ color: '#0ba02c' }}><BellRinging size={32} /></div></div>
      </div>
      {(incomplete || !photo) && (
        <div className="fd-banner">
          <div className="l">{photo ? <img src={media(photo)} alt="" /> : <div className="av">{user?.first_name?.[0]}{user?.last_name?.[0]}</div>}
            <div><b>Your profile editing is not completed.</b><span>Complete your profile editing &amp; build your custom Resume</span></div></div>
          <Link to="/dashboard/settings" className="f-btn white" style={{ color: '#e05151' }}>Edit Profile <ArrowRight size={24} /></Link>
        </div>
      )}
      <div className="fd-ttl"><h4>Recently Applied</h4><Link to="/dashboard/applied">View all <ArrowRight size={24} /></Link></div>
      {applied.loading ? <Spinner /> : <AppliedTable list={rows(applied.data)} />}
    </CandidateLayout>
  )
}

export function AppliedJobs() {
  const [page, setPage] = useState(1)
  const { data, loading } = useFetch(() => api.get(`/candidates/applied-jobs/?page=${page}&page_size=8`), [page])
  return (
    <CandidateLayout>
      <div className="fd-ttl"><h4>Applied Jobs <small>({data?.count ?? 0})</small></h4></div>
      {loading ? <Spinner /> : <AppliedTable list={rows(data)} />}
      <Pager count={data?.count} page={page} size={8} onPage={setPage} />
    </CandidateLayout>
  )
}

const JobLine = ({ id, title, name, logo, at, atLabel, expired, actions }) => (
  <div className="fd-row">
    <Link to={`/jobs/${id}`} className="jb"><Mark name={name} src={logo} size="s56" />
      <div><h4>{title}</h4><div className="mt"><span><MapPin size={16} />{name}</span><span><Calendar size={16} />{atLabel} {fmtDate(at)}</span>{expired && <span className="exp">Job Expire</span>}</div></div></Link>
    <div className="acts">{actions}</div>
  </div>
)

export function FavoriteJobs() {
  const [page, setPage] = useState(1)
  const { data, loading, reload } = useFetch(() => api.get(`/candidates/wishlist/?page=${page}&page_size=10`), [page])
  const list = rows(data)
  return (
    <CandidateLayout>
      <div className="fd-ttl"><h4>Favorite Jobs <small>({data?.count ?? 0})</small></h4></div>
      {loading ? <Spinner /> : !list.length ? <Empty>No saved jobs yet.</Empty> : list.map((w) => (
        <JobLine key={w.job_id} id={w.job_id} title={w.title} name={w.company_name} logo={w.company_logo} at={w.saved_at} atLabel="Saved"
          actions={<><button className="f-icon-btn on" onClick={() => api.post(`/candidates/wishlist/${w.job_id}/`).then(reload)} title="Remove"><Bookmark size={24} fill="currentColor" /></button>
            <Link className="f-btn soft" to={`/jobs/${w.job_id}`}>Apply Now <ArrowRight size={24} /></Link></>} />
      ))}
      <Pager count={data?.count} page={page} size={10} onPage={setPage} />
    </CandidateLayout>
  )
}

export function JobAlerts() {
  const { data, loading, reload } = useFetch(() => api.get('/jobs/alerts/?page_size=50'))
  const list = rows(data)
  return (
    <CandidateLayout>
      <div className="fd-ttl"><h4>Job Alerts <small>({String(list.length).padStart(2, '0')} new jobs)</small></h4></div>
      {loading ? <Spinner /> : !list.length ? <Empty>No job alerts yet. Press the bell on a job page.</Empty> : list.map((a) => (
        <JobLine key={a.id} id={a.job_id} title={a.title} name={a.company_name} logo={a.company_logo} at={a.alerted_at} atLabel="Since"
          actions={<><button className="f-icon-btn on" onClick={() => api.post(`/jobs/${a.job_id}/alert/`).then(reload)} title="Remove alert"><BellRinging size={24} /></button>
            <Link className="f-btn soft" to={`/jobs/${a.job_id}`}>Apply Now <ArrowRight size={24} /></Link></>} />
      ))}
    </CandidateLayout>
  )
}

function AddCv({ onClose, onDone }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [st, run] = useAction()
  const submit = (e) => {
    e.preventDefault()
    run(async () => { const f = new FormData(); f.append('name', name); f.append('file', file); await api.post('/candidates/resumes/', f); onDone() }, 'CV added.')
  }
  return (
    <div className="fs-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="fs-modal" onSubmit={submit}>
        <button type="button" className="f-icon-btn" style={{ position: 'absolute', right: 12, top: 12, width: 36, height: 36 }} onClick={onClose}><X size={20} /></button>
        <h5>Add Cv/Resume</h5>
        <F label="Cv/Resume Name"><input value={name} onChange={(e) => setName(e.target.value)} required /></F>
        <div style={{ height: 16 }} />
        <F label="Upload your Cv/Resume">
          <label className="fs-drop"><UploadCloud size={32} color="#767f8c" /><span><b>{file ? file.name : 'Browse file'}</b> or drop here</span><small>Only PDF format available. Max file size 12 MB.</small>
            <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} required /></label>
        </F>
        <Notice state={st} />
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}><button type="button" className="f-btn soft" onClick={onClose}>Cancel</button><button className="f-btn" disabled={st.busy}>Add Cv/Resume</button></div>
      </form>
    </div>
  )
}

function Resumes() {
  const { data, reload } = useFetch(() => api.get('/candidates/resumes/'))
  const [open, setOpen] = useState(false)
  return (
    <div className="fs-sec">
      <h5>Your Cv/Resume</h5>
      <div className="fs-cv">
        {rows(data).map((r) => (
          <div key={r.id} className="fs-cvc">
            <a className="n" href={media(r.file)} target="_blank" rel="noreferrer"><FileText size={32} color="#0a65cc" /><div><b>{r.name}</b><small>{r.file?.split('.').pop()?.toUpperCase()}</small></div></a>
            <button type="button" className="f-icon-btn" style={{ width: 32, height: 32, color: '#e05151' }} onClick={() => api.del(`/candidates/resumes/${r.id}/`).then(reload)} title="Delete"><Trash2 size={18} /></button>
          </div>
        ))}
        <div className="fs-cvc add" onClick={() => setOpen(true)}><UploadCloud size={28} color="#0a65cc" /><div><b>Add Cv/Resume</b><small>Browse file or drop here. only pdf</small></div></div>
      </div>
      {open && <AddCv onClose={() => setOpen(false)} onDone={() => { setOpen(false); reload() }} />}
    </div>
  )
}

const NOTIFS = [['shortlisted', 'Notify me when employers shortlisted me'], ['saved', 'Notify me when employers saved my profile'], ['expire', 'Notify me when my applied jobs are expire'], ['rejected', 'Notify me when employers rejected me'], ['alerts', 'Notify me when i have up to 5 job alerts']]

function AccountTab({ profile, v, set }) {
  const nav = useNavigate()
  const { logout } = useAuth()
  const [st, run] = useAction()
  const [pst, prun] = useAction()
  const prefs = useFetch(() => api.get('/accounts/preferences/').catch(() => ({})))
  const [p, setP] = useState({})
  useEffect(() => { if (prefs.data) setP(prefs.data) }, [prefs.data])
  const flip = (k) => (e) => setP((s) => ({ ...s, [k]: e.target.checked }))
  const saveContact = (e) => { e.preventDefault(); run(() => api.patch('/candidates/me/', toBody({ location: v.location, phone_number: v.phone_number, email: v.email })).then(profile.reload)) }
  const savePrefs = (e) => { e.preventDefault(); prun(() => api.patch('/accounts/preferences/', p)) }
  const del = async () => {
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return
    await api.del('/accounts/me/'); logout(); nav('/')
  }
  return (
    <>
      <form className="fs-sec" onSubmit={saveContact}>
        <h5>Contact Info</h5>
        <div className="fs-grid">
          <F label="Map Location" full><input value={v.location || ''} onChange={set('location')} /></F>
          <F label="Phone" full><input value={v.phone_number || ''} onChange={set('phone_number')} placeholder="Phone number.." /></F>
          <F label="Email" full><input type="email" value={v.email || ''} onChange={set('email')} placeholder="Email address" /></F>
        </div>
        <Notice state={st} /><button className="f-btn" style={{ marginTop: 24 }} disabled={st.busy}>Save Changes</button>
      </form>
      <form className="fs-sec" onSubmit={savePrefs}>
        <h5>Notification</h5>
        <div className="fs-grid">{NOTIFS.map(([k, l]) => <label key={k} className="fs-chk"><input type="checkbox" checked={!!p[`n_${k}`]} onChange={flip(`n_${k}`)} />{l}</label>)}</div>
        <h5 style={{ marginTop: 32 }}>Job Alerts</h5>
        <div className="fs-grid">
          <F label="Role"><input value={p.alert_role || ''} onChange={(e) => setP({ ...p, alert_role: e.target.value })} placeholder="Your job roles" /></F>
          <F label="Location"><input value={p.alert_location || ''} onChange={(e) => setP({ ...p, alert_location: e.target.value })} placeholder="City, state, country, name" /></F>
        </div>
        <h5 style={{ marginTop: 32 }}>Profile Privacy</h5>
        <div className="fs-grid">
          <label className="fs-toggle"><input type="checkbox" checked={p.profile_public !== false} onChange={flip('profile_public')} />{p.profile_public !== false ? 'Your profile is public now' : 'Your profile is private now'}</label>
          <label className="fs-toggle"><input type="checkbox" checked={!!p.resume_public} onChange={flip('resume_public')} />{p.resume_public ? 'Your resume is public now' : 'Your resume is private now'}</label>
        </div>
        <Notice state={pst} /><button className="f-btn" style={{ marginTop: 24 }} disabled={pst.busy}>Save Changes</button>
      </form>
      <ChangePassword endpoint="/candidates/change-password/" />
      <div className="fs-sec">
        <h5>Delete Your Account</h5>
        <p className="fd-sub" style={{ marginTop: 0, maxWidth: 520 }}>If you delete your account, you will no longer be able to get information about the matched jobs, following employers, and job alert, shortlisted jobs and more. You will be abandoned from all the services of MyJob.</p>
        <button type="button" className="fd-st red" style={{ marginTop: 16 }} onClick={del}><Trash2 size={18} />Close Account</button>
      </div>
    </>
  )
}

export function CandidateSettings() {
  const [tab, setTab] = useState('personal')
  const profile = useFetch(() => api.get('/candidates/me/'))
  const educations = useFetch(() => api.get('/common/educations/'))
  const countries = useFetch(() => api.get('/common/countries/'))
  const { user } = useAuth()
  const [v, set, setV] = useForm({})
  const [st, run] = useAction()

  useEffect(() => {
    if (profile.data) {
      const p = profile.data
      setV({ first_name: user?.first_name, last_name: user?.last_name, email: p.email, title_headline: p.title_headline, experience: p.experience, personal_web: p.personal_web,
        nationality: p.nationality?.id ?? p.nationality ?? '', date_of_birth: p.date_of_birth, gender: p.gender, marital_status: p.marital_status,
        education: p.educations?.[0]?.id ?? '', biography: p.biography, location: p.location, phone_number: p.phone_number })
    } else if (profile.error?.status === 404 && user) {
      setV({ first_name: user.first_name, last_name: user.last_name, email: user.email, gender: 'male', marital_status: 'single' })
    }
  }, [profile.data, profile.error, user, setV])

  const save = (e) => {
    e.preventDefault()
    const { education, photo, ...rest } = v
    const body = toBody({ ...rest, educations: education ? [education] : undefined, profile_photo: photo })
    run(async () => { await api.patch('/candidates/me/', body); profile.reload() })
  }
  const opts = (o) => Object.entries(o).map(([k, l]) => <option key={k} value={k}>{l}</option>)
  const tabs = [['personal', 'Personal', User], ['profile', 'Profile', UserCircle], ['social', 'Social Links', Globe], ['account', 'Account Setting', Gear]]
  return (
    <CandidateLayout>
      <h3 className="fd-h">Settings</h3>
      <div className="fs-tabs">{tabs.map(([k, l, I]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><I size={20} />{l}</button>)}</div>
      {profile.loading ? <Spinner /> : (
        <>
          {tab === 'personal' && (
            <>
              <form className="fs-sec" onSubmit={save}>
                <h5>Basic Information</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
                  <F label="Profile Picture"><label className="fs-drop"><UploadCloud size={28} color="#767f8c" /><span><b>{v.photo?.name || 'Browse photo'}</b> or drop here</span><small>A photo larger than 400 pixels work best. Max photo size 5 MB.</small>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={set('photo')} /></label></F>
                  <div className="fs-grid" style={{ alignContent: 'start' }}>
                    <F label="First name"><input value={v.first_name || ''} onChange={set('first_name')} required /></F>
                    <F label="Last name"><input value={v.last_name || ''} onChange={set('last_name')} required /></F>
                    <F label="Title/headline"><input value={v.title_headline || ''} onChange={set('title_headline')} /></F>
                    <F label="Experience"><select value={v.experience || ''} onChange={set('experience')}><option value="">Select...</option>{opts(LABELS.experience)}</select></F>
                    <F label="Educations"><select value={v.education || ''} onChange={set('education')}><option value="">Select...</option>{rows(educations.data).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></F>
                    <F label="Personal Website"><input type="url" value={v.personal_web || ''} onChange={set('personal_web')} placeholder="Website url..." /></F>
                  </div>
                </div>
                <Notice state={st} /><button className="f-btn" style={{ marginTop: 24 }} disabled={st.busy}>Save Changes</button>
              </form>
              <Resumes />
            </>
          )}
          {tab === 'profile' && (
            <form onSubmit={save}>
              <div className="fs-grid">
                <F label="Nationality"><select value={v.nationality || ''} onChange={set('nationality')}><option value="">Select...</option>{rows(countries.data).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F>
                <F label="Date of Birth"><input type="date" value={v.date_of_birth || ''} onChange={set('date_of_birth')} required /></F>
                <F label="Gender"><select value={v.gender || ''} onChange={set('gender')}>{opts({ male: 'Male', female: 'Female', other: 'Other' })}</select></F>
                <F label="Marital Status"><select value={v.marital_status || ''} onChange={set('marital_status')}>{opts({ single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed' })}</select></F>
                <F label="Education"><select value={v.education || ''} onChange={set('education')}><option value="">Select...</option>{rows(educations.data).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></F>
                <F label="Experience"><select value={v.experience || ''} onChange={set('experience')}><option value="">Select...</option>{opts(LABELS.experience)}</select></F>
                <F label="Biography" full><textarea value={v.biography || ''} onChange={set('biography')} placeholder="Write down your biography here. Let the employers know who you are..." /></F>
              </div>
              <Notice state={st} /><button className="f-btn" style={{ marginTop: 24 }} disabled={st.busy}>Save Changes</button>
            </form>
          )}
          {tab === 'social' && <SocialLinks />}
          {tab === 'account' && <AccountTab profile={profile} v={v} set={set} />}
        </>
      )}
    </CandidateLayout>
  )
}
