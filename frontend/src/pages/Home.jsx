import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, Search, Star } from 'react-feather'
import { Briefcase, Buildings, Users, PenNib, Code, Megaphone, MonitorPlay, MusicNotes, ChartBar, FirstAidKit, Database, UserPlus, CloudArrowUp, MagnifyingGlassPlus, SealCheck } from '@phosphor-icons/react'
import { api, qs, rows } from '../api'
import { JobRow, Mark } from '../components/figma'
import { useFetch } from '../components/ui'
import { useSaved } from '../useSaved'

const catIcons = [PenNib, Code, Megaphone, MonitorPlay, MusicNotes, ChartBar, FirstAidKit, Database]
const TESTI = [
  ['Ut ullamcorper hendrerit tempor. Aliquam in rutrum dui. Maecenas ac placerat metus, in faucibus est.', 'Robert Fox', 'UI/UX Designer'],
  ['Mauris eget lorem odio. Mauris convallis justo molestie metus aliquam lacinia. Suspendisse ut dui vulputate augue condimentum ornare. Morbi vitae tristique ligula.', 'Bessie Cooper', 'Creative Director'],
  ['Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Maecenas eu consequat nibh. Ut egestas, nisi eget tincidunt commodo.', 'Jane Cooper', 'Photographer'],
]

export default function Home() {
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const stats = useFetch(() => api.get('/common/statistics/'))
  const roles = useFetch(() => api.get('/common/job-roles/'))
  const featured = useFetch(() => api.get(`/jobs/${qs({ promote_type: 'featured', page_size: 6 })}`))
  const latest = useFetch(() => api.get(`/jobs/${qs({ page_size: 6 })}`))
  const companies = useFetch(() => api.get('/companies/top/?limit=8'))
  const { isSaved, toggle } = useSaved()
  const s = stats.data || {}
  const jobs = rows(featured.data).length ? rows(featured.data) : rows(latest.data)
  const list = rows(roles.data)
  const n = (v) => (v ?? 0).toLocaleString('en-IN')

  return (
    <>
      <section className="f-hero">
        <div className="f-container">
          <div className="info">
            <div>
              <h1>Find a job that suits your interest &amp; skills.</h1>
              <p className="lead">Aliquam vitae turpis in diam convallis finibus in at risus. Nullam in scelerisque leo, eget sollicitudin velit bestibulum.</p>
            </div>
            <div>
              <form className="f-hero-search" onSubmit={(e) => { e.preventDefault(); nav(`/jobs${qs({ title, location })}`) }}>
                <label className="cell"><Search size={24} /><input placeholder="Job tittle, Keyword..." value={title} onChange={(e) => setTitle(e.target.value)} /></label>
                <label className="cell"><MapPin size={24} /><input placeholder="Your Location" value={location} onChange={(e) => setLocation(e.target.value)} /></label>
                <button className="f-btn lg">Find Job</button>
              </form>
              <p className="f-suggest" style={{ marginTop: 24 }}>Suggestion: <b> Designer,</b><b> Programing,</b><b className="hl"> Digital Marketing,</b><b> Video,</b><b> Animation.</b></p>
            </div>
          </div>
          <div className="art"><HeroArt /></div>
          <div className="f-facts">
            {[[Briefcase, s.total_jobs, 'Live Job'], [Buildings, s.total_companies, 'Companies'], [Users, s.total_candidates, 'Candidates'], [Briefcase, s.new_jobs, 'New Jobs']].map(([I, v, l], i) => (
              <div key={l} className={`f-fact ${i === 1 ? 'on' : ''}`}><div className="ic"><I size={40} weight="duotone" /></div><div><b>{n(v)}</b><span>{l}</span></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="f-section">
        <div className="f-container">
          <h2 className="f-h2" style={{ marginBottom: 50 }}>Most Popular Vacancies</h2>
          <div className="f-vac">
            {list.slice(0, 12).map((r) => (
              <Link key={r.id} to={`/jobs?job_role_id=${r.id}`}><b>{r.name}</b><span className="f-sub">{n(r.jobs_count)} Open Positions</span></Link>
            ))}
          </div>
        </div>
      </section>

      <section className="f-section gray">
        <div className="f-container">
          <h2 className="f-h2" style={{ textAlign: 'center', marginBottom: 50 }}>How jobpilot work</h2>
          <div className="f-process">
            {[[UserPlus, 'Create account', 'Aliquam facilisis egestas sapien, nec tempor leo tristique at.'], [CloudArrowUp, 'Upload CV/Resume', 'Curabitur sit amet maximus ligula. Nam a nulla ante. Nam sodales'], [MagnifyingGlassPlus, 'Find suitable job', 'Phasellus quis eleifend ex. Morbi nec fringilla nibh.'], [SealCheck, 'Apply job', 'Curabitur sit amet maximus ligula. Nam a nulla ante, Nam sodales purus.']].map(([I, t, d], i) => (
              <div key={t} className={`f-step ${i === 1 ? 'on' : ''}`}><div className="ic"><I size={32} weight="duotone" /></div><div><h4>{t}</h4><p>{d}</p></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="f-section">
        <div className="f-container">
          <div className="f-head"><h2 className="f-h2">Popular category</h2><Link to="/jobs" className="f-btn line">View All <ArrowRight size={24} /></Link></div>
          <div className="f-cats">
            {list.slice(0, 8).map((r, i) => {
              const I = catIcons[i % catIcons.length]
              return <Link key={r.id} to={`/jobs?job_role_id=${r.id}`} className={`f-cat ${i === 7 ? 'on' : ''}`}><div className="ic"><I size={32} weight="duotone" /></div><div><h4>{r.name}</h4><span>{n(r.jobs_count)} Open position</span></div></Link>
            })}
          </div>
        </div>
      </section>

      <section className="f-section" style={{ paddingTop: 0 }}>
        <div className="f-container">
          <div className="f-head"><h2 className="f-h2" style={{ color: '#191f33' }}>Featured job</h2><Link to="/jobs" className="f-btn line">View All <ArrowRight size={24} /></Link></div>
          <div className="f-jobs">
            {jobs.length === 0 && <p className="f-sub">No jobs posted yet.</p>}
            {jobs.map((j) => <JobRow key={j.id} job={j} onSave={toggle} saved={isSaved(j.id)} />)}
          </div>
        </div>
      </section>

      <section className="f-section" style={{ paddingTop: 0 }}>
        <div className="f-container">
          <div className="f-head"><h2 className="f-h2">Top companies</h2>
            <div style={{ display: 'flex', gap: 16 }}><Link to="/employers" className="f-icon-btn" style={{ background: 'var(--p-50)' }}><ArrowLeft size={24} /></Link><Link to="/employers" className="f-icon-btn" style={{ background: 'var(--p-500)', color: '#fff' }}><ArrowRight size={24} /></Link></div></div>
          <div className="f-emps">
            {rows(companies.data).map((c, i) => (
              <Link key={c.id} to={`/employers/${c.id}`} className={`f-emp ${i === 6 ? 'on' : ''}`}>
                <div className="top"><Mark name={c.name} src={c.logo} size="s56" />
                  <div><h4>{c.name}{i === 0 && <span className="f-badge red">Featured</span>}</h4><div className="loc"><MapPin size={18} />{c.country?.name || '—'}</div></div></div>
                <span className="f-btn soft block">Open Position ({c.job_count})</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="f-section gray" style={{ paddingBottom: 100 }}>
        <div className="f-container">
          <h2 className="f-h2" style={{ textAlign: 'center', marginBottom: 50, color: '#191f33' }}>Clients Testimonial</h2>
          <div className="f-testi">
            {TESTI.map(([t, nm, role]) => (
              <div key={nm} className="f-tcard">
                <div><div className="stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={28} fill="currentColor" />)}</div><p>“{t}”</p></div>
                <div className="who"><div className="l"><div className="f-avatar48">{nm[0]}</div><div><b style={{ fontWeight: 500, display: 'block', color: '#191f33' }}>{nm}</b><span className="f-sub" style={{ color: '#767e94' }}>{role}</span></div></div><span style={{ fontSize: 48, color: 'var(--p-100)', lineHeight: 1 }}>”</span></div>
              </div>
            ))}
          </div>
          <div className="f-dots"><i /><i /><i className="on" /><i /><i /></div>
        </div>
      </section>

      <section className="f-section">
        <div className="f-container f-cta">
          <div className="a"><div><h3>Become a Candidate</h3><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras cursus a dolor convallis efficitur.</p></div><Link to="/signup" className="f-btn white">Register now <ArrowRight size={24} /></Link></div>
          <div className="b"><div><h3>Become a Employers</h3><p>Cras in massa pellentesque, mollis ligula non, luctus dui. Morbi sed efficitur dolor.</p></div><Link to="/signup?role=employer" className="f-btn white">Register now <ArrowRight size={24} /></Link></div>
        </div>
      </section>
    </>
  )
}

function HeroArt() {
  return (
    <svg viewBox="0 0 492 382" width="492" height="382" fill="none" role="img" aria-label="Job search illustration">
      <ellipse cx="250" cy="330" rx="240" ry="38" fill="#e7f0fa" />
      <rect x="100" y="250" width="290" height="14" rx="4" fill="#cee0f5" />
      <rect x="130" y="150" width="190" height="110" rx="8" fill="#fff" stroke="#0a65cc" strokeWidth="3" />
      <rect x="145" y="165" width="90" height="10" rx="3" fill="#0a65cc" /><rect x="145" y="185" width="140" height="8" rx="3" fill="#cee0f5" /><rect x="145" y="203" width="120" height="8" rx="3" fill="#cee0f5" />
      <circle cx="355" cy="120" r="34" fill="#f6c9a8" /><path d="M320 120c0-26 14-44 36-44s34 16 34 40c-14-10-40-12-70 4z" fill="#18191c" />
      <path d="M330 156h50l20 94h-90z" fill="#0a65cc" />
      <circle cx="90" cy="90" r="18" fill="none" stroke="#cee0f5" strokeWidth="3" /><path d="M60 60l10 10M110 50l-6 12" stroke="#0a65cc" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
