import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Briefcase, ChevronDown, MapPin, Phone, Search, ArrowRight, Bookmark, Calendar, DollarSign, Facebook, Youtube, Instagram, Twitter } from 'react-feather'
import { SignOut } from '@phosphor-icons/react'
import { LABELS, media } from '../api'
import { useAuth } from '../auth'

export const Brand = ({ light, to = '/' }) => (
  <Link to={to} className={`f-logo ${light ? 'light' : ''}`}><Briefcase size={40} strokeWidth={2} />MyJob</Link>
)

const PALETTE = ['#6fda44', '#000000', '#ea4c89', '#1e60c6', '#e05151', '#0a65cc', '#ffa500', '#5e6670']
export function Mark({ name = '', src, size = '' }) {
  const bg = PALETTE[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length]
  return (
    <div className={`f-logo-box ${size}`} style={src ? { background: '#fff', border: '1px solid var(--line-2)' } : { background: bg }}>
      {src ? <img src={media(src)} alt={name} /> : name.slice(0, 1).toUpperCase()}
    </div>
  )
}

export function AccountMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  if (!user) {
    return (
      <div className="actions">
        <Link to="/signin" className="f-btn line">Sign In</Link>
        <Link to="/employer/post-job" className="f-btn">Post A Jobs</Link>
      </div>
    )
  }
  const emp = user.role === 'employer'
  return (
    <div className="actions" style={{ gap: 24, position: 'relative' }}>
      <span className="f-bell"><Bell size={24} /><i /></span>
      <div className="f-account" onClick={() => setOpen(!open)}>
        <span className="f-avatar48" style={{ width: 40, height: 40 }}>{user.first_name?.[0]}{user.last_name?.[0]}</span>
        My Account <ChevronDown size={20} />
      </div>
      {emp && <Link to="/employer/post-job" className="f-btn">Post Job</Link>}
      {open && (
        <div className="f-menu" onClick={() => setOpen(false)}>
          <Link to={emp ? '/employer' : '/dashboard'}>Dashboard</Link>
          <Link to={emp ? '/employer/settings' : '/dashboard/settings'}>Settings</Link>
          <button onClick={() => { logout(); nav('/') }}>Log Out</button>
        </div>
      )}
    </div>
  )
}

export function SiteHeader({ dash }) {
  const nav = useNavigate()
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [loc, setLoc] = useState('')
  const links = dash === 'candidate'
    ? [['/', 'Home'], ['/jobs', 'Find Job'], ['/employers', 'Find Employers'], ['/dashboard', 'Dashboard'], ['/dashboard/alerts', 'Job Alerts'], ['/contact', 'Customer Supports']]
    : dash === 'employer'
      ? [['/', 'Home'], ['/candidates', 'Find Candidate'], ['/employer', 'Dashboard'], ['/employer/my-jobs', 'My Jobs'], ['/employer/applications', 'Applications'], ['/contact', 'Customer Supports']]
      : [['/', 'Home'], ['/jobs', 'Find Job'], ['/employers', 'Employers'], ['/candidates', 'Candidates'], ['/pricing', 'Pricing Plans'], ['/contact', 'Customer Supports']]
  return (
    <>
      <div className="f-topbar">
        <div className="f-container">
          <nav>{links.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>{l}</NavLink>)}</nav>
          <div className="right">
            <span className="phone"><Phone size={20} />+1-202-555-0178</span>
            <span style={{ color: 'var(--g-600)', display: 'flex', alignItems: 'center', gap: 4 }}>English <ChevronDown size={16} /></span>
          </div>
        </div>
      </div>
      <header className="f-nav">
        <div className="f-container">
          <div className="left">
            <Brand />
            <form className="f-search" onSubmit={(e) => { e.preventDefault(); nav(`/jobs?${new URLSearchParams({ ...(q && { title: q }), ...(loc && { location: loc }) })}`) }}>
              <label className="loc"><MapPin size={18} color="var(--p-500)" /><input placeholder="Location" value={loc} onChange={(e) => setLoc(e.target.value)} /></label>
              <span className="div" />
              <label className="q"><Search size={24} color="var(--p-500)" /><input placeholder="Job tittle, keyword, company" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            </form>
          </div>
          <AccountMenu key={user?.id ?? 'guest'} />
        </div>
      </header>
    </>
  )
}

export function SiteFooter() {
  const col = (title, items) => (
    <div><h5>{title}</h5><ul>{items.map(([to, l]) => <li key={l}><Link to={to}>{l}</Link></li>)}</ul></div>
  )
  return (
    <footer className="f-footer">
      <div className="f-container">
        <div className="grid">
          <div>
            <Brand light />
            <p className="call">Call now: <b>(319) 555-0115</b></p>
            <p className="addr">6391 Elgin St. Celina, Delaware 10299, New York, United States of America</p>
          </div>
          {col('Quick Link', [['/about', 'About'], ['/contact', 'Contact'], ['/pricing', 'Pricing'], ['/blog', 'Blog']])}
          {col('Candidate', [['/jobs', 'Browse Jobs'], ['/employers', 'Browse Employers'], ['/dashboard', 'Candidate Dashboard'], ['/dashboard/favorites', 'Saved Jobs']])}
          {col('Employers', [['/employer/post-job', 'Post a Job'], ['/candidates', 'Browse Candidates'], ['/employer', 'Employers Dashboard'], ['/employer/my-jobs', 'Applications']])}
          {col('Support', [['/faqs', 'Faqs'], ['/terms', 'Privacy Policy'], ['/terms', 'Terms & Conditions']])}
        </div>
        <div className="bottom">
          <span>@ 2024 MyJob - Job Portal. All rights Reserved</span>
          <span className="soc"><Facebook size={20} /><Youtube size={20} /><Instagram size={20} /><Twitter size={20} /></span>
        </div>
      </div>
    </footer>
  )
}

const typeTone = { fulltime: '', parttime: 'amber', remote: '', freelance: 'amber', internship: 'green' }
const short = (n) => { n = Number(n); return n >= 1000 ? `${Math.round(n / 100) / 10}K`.replace('.0K', 'K') : `${n}` }
const daysLeft = (d) => Math.max(0, Math.ceil((new Date(d) - Date.now()) / 864e5))

export function JobRow({ job, saved, onSave, onApply }) {
  const c = job.company || {}
  const left = daysLeft(job.expiration_date)
  return (
    <div className={`f-job ${job.promote_type === 'featured' ? 'feat' : ''}`}>
      <Link to={`/jobs/${job.id}`} className="info">
        <Mark name={c.name} src={c.logo} />
        <div style={{ minWidth: 0 }}>
          <div className="title">
            <h4>{job.title}</h4>
            <span className={`f-badge ${typeTone[job.type] ?? ''}`}>{LABELS.type[job.type]}</span>
            {job.promote_type === 'featured' && <span className="f-badge red">Featured</span>}
          </div>
          <div className="meta">
            <span><MapPin size={22} color="#9199a3" />{c.location || '—'}</span>
            <span><DollarSign size={22} color="#9199a3" />${short(job.min_salary)}-${short(job.max_salary)}</span>
            <span><Calendar size={22} color="#9199a3" />{left > 0 ? `${left} Days Remaining` : 'Job Expire'}</span>
          </div>
        </div>
      </Link>
      <div className="acts">
        {onSave && <button className={`f-icon-btn ${saved ? 'on' : ''}`} onClick={() => onSave(job)} title="Save job"><Bookmark size={24} fill={saved ? 'currentColor' : 'none'} /></button>}
        <Link className="f-btn soft" to={`/jobs/${job.id}`} onClick={onApply}>Apply Now <ArrowRight size={24} /></Link>
      </div>
    </div>
  )
}

export const PageHead = ({ title, trail = [] }) => (
  <div className="f-crumb"><div className="f-container"><h4>{title}</h4>
    <div className="path"><Link to="/">Home</Link>{trail.map(([to, l]) => <span key={l}>/ {to ? <Link to={to}>{l}</Link> : <b>{l}</b>}</span>)}</div></div></div>
)

export function Pager({ count, page, onPage, size = 12 }) {
  const pages = Math.ceil((count || 0) / size)
  if (pages <= 1) return null
  const from = Math.max(1, Math.min(page - 2, pages - 4))
  const list = Array.from({ length: Math.min(5, pages) }, (_, i) => from + i)
  return (
    <div className="f-pager">
      <button className="arrow" disabled={page === 1} onClick={() => onPage(page - 1)}><ArrowLeft size={24} /></button>
      {list.map((n) => <button key={n} className={n === page ? 'on' : ''} onClick={() => onPage(n)}>{String(n).padStart(2, '0')}</button>)}
      <button className="arrow next" disabled={page === pages} onClick={() => onPage(page + 1)}><ArrowRight size={24} /></button>
    </div>
  )
}

export function JobCardGrid({ job, saved, onSave }) {
  const c = job.company || {}
  return (
    <div className={`f-gcard ${job.promote_type === 'featured' ? 'feat' : ''}`}>
      {onSave && <button className={`bm ${saved ? 'on' : ''}`} onClick={() => onSave(job)} title="Save job"><Bookmark size={22} fill={saved ? 'currentColor' : 'none'} /></button>}
      <div className="co"><Mark name={c.name} src={c.logo} size="s56" />
        <div style={{ minWidth: 0 }}><b>{c.name}{job.promote_type === 'featured' && <span className="f-badge red" style={{ background: '#ffeded', color: '#ff4f4f' }}>Featured</span>}</b>
          <div className="l"><MapPin size={18} />{c.location || '—'}</div></div></div>
      <Link to={`/jobs/${job.id}`}><h4>{job.title}</h4><div className="m"><span>{LABELS.type[job.type]}</span><span>${short(job.min_salary)}-${short(job.max_salary)}</span></div></Link>
    </div>
  )
}

export function DashShell({ title, items, children, role }) {
  const { logout } = useAuth()
  const nav = useNavigate()
  return (
    <>
      <SiteHeader dash={role} />
      <div className="f-container">
        <div className="fd">
          <aside className="fd-side">
            <div>
              <h6>{title}</h6>
              {items.map(([to, label, Icon, badge]) => (
                <NavLink key={to} to={to} end className={({ isActive }) => (isActive ? 'active' : '')}><Icon size={24} />{label}{badge ? <span className="badge">{badge}</span> : null}</NavLink>
              ))}
            </div>
            <button onClick={() => { logout(); nav('/') }}><SignOut size={24} />Log-out</button>
          </aside>
          <main className="fd-main">{children}</main>
        </div>
      </div>
      <div className="fd-copy">@ 2024 MyJob - Job Portal. All rights Reserved</div>
    </>
  )
}
