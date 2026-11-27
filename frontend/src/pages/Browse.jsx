import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Bookmark, Facebook, Globe, Link2, Mail, MapPin, Phone, Search, Twitter } from 'react-feather'
import { Briefcase } from '@phosphor-icons/react'
import { api, qs, rows, LABELS, media } from '../api'
import { useAuth } from '../auth'
import { JobRow, Mark, PageHead, Pager } from '../components/figma'
import { Spinner, useFetch } from '../components/ui'
import { useSaved } from '../useSaved'

const Empty = ({ children }) => <div className="f-empty">{children}</div>
const Radios = ({ name, value, onChange, options }) => (
  <div className="f-radio">{[['', 'All'], ...options].map(([v, l]) => <label key={v}><input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} />{l}</label>)}</div>
)
const ORG = [['startup', 'Startup'], ['public', 'Public'], ['private', 'Private Company'], ['ngo', 'NGO']]

export function Employers() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || 1)
  const org = sp.get('organization_type') || ''
  const country = sp.get('country') || ''
  const [c, setC] = useState(country)
  useEffect(() => setC(country), [country])
  const { data, loading } = useFetch(() => api.get(`/companies/${qs({ organization_type: org, country, page, page_size: 8 })}`), [sp.toString()])
  const set = (k, v) => { const n = Object.fromEntries(sp); v ? (n[k] = v) : delete n[k]; delete n.page; setSp(n) }
  const list = rows(data)
  return (
    <>
      <PageHead title="Find Employers" trail={[[null, 'Find Employers']]} />
      <div className="f-finder">
        <div className="f-container">
          <form className="f-adv" onSubmit={(e) => { e.preventDefault(); set('country', c) }}>
            <label className="fld"><Search size={24} /><input placeholder="Country" value={c} onChange={(e) => setC(e.target.value)} /></label>
            <button className="f-btn lg">Find Employers</button>
          </form>
        </div>
      </div>
      <div className="f-container">
        <div className="f-browse">
          <aside className="f-filter"><div className="sec"><h5>Organization Type</h5><Radios name="org" value={org} onChange={(v) => set('organization_type', v)} options={ORG} /></div></aside>
          <div>
            {loading ? <Spinner /> : list.length === 0 ? <Empty>No employers found.</Empty> : (
              <div className="f-rows">
                {list.map((e) => (
                  <div key={e.id} className="f-erow">
                    <Link to={`/employers/${e.id}`} className="co"><Mark name={e.name} src={e.logo} />
                      <div><h4>{e.name}</h4><div className="m"><span><MapPin size={22} color="#9199a3" />{e.country?.name || '—'}</span>{e.organization_type && <span><Briefcase size={22} color="#9199a3" />{LABELS.org[e.organization_type]}</span>}</div></div></Link>
                    <Link to={`/employers/${e.id}`} className="f-btn soft">Open Position ({e.job_count}) <ArrowRight size={24} /></Link>
                  </div>
                ))}
              </div>
            )}
            <Pager count={data?.count} page={page} size={8} onPage={(p) => setSp({ ...Object.fromEntries(sp), page: p })} />
          </div>
        </div>
      </div>
    </>
  )
}

export function EmployerDetail() {
  const { id } = useParams()
  const { data: c, loading, error } = useFetch(() => api.get(`/companies/${id}/`), [id])
  const jobs = useFetch(() => api.get(`/jobs/${qs({ company_id: id, page_size: 20 })}`), [id])
  const { isSaved, toggle } = useSaved()
  if (loading) return <Spinner />
  if (error) return <Empty>Employer not found.</Empty>
  const grid = [['Founded in:', c.establishment_year], ['Organization type', LABELS.org[c.organization_type]], ['Team size', c.team_size && `${c.team_size} Candidates`], ['Country', c.country?.name]].filter(([, v]) => v)
  const vision = (c.vision || '').split('\n').filter(Boolean)
  const contacts = [[Globe, 'Website', c.company_web], [Phone, 'Phone', c.phone_number], [Mail, 'Email address', c.email], [MapPin, 'Location', c.location]].filter(([, , v]) => v)
  return (
    <>
      <PageHead title="Single Employers" trail={[['/employers', 'Find Employers'], [null, 'Single Employers']]} />
      <div className="f-container" style={{ paddingTop: 32 }}>
        <div className="f-banner" style={c.banner_image ? { backgroundImage: `url(${media(c.banner_image)})` } : {}} />
        <div className="f-ecard">
          <div className="l"><Mark name={c.name} src={c.logo} size="s96" /><div><h1>{c.name}</h1><div className="sub">{c.location || c.country?.name}</div></div></div>
          <a href="#positions" className="f-btn lg">View Open Position <ArrowRight size={24} /></a>
        </div>
        <div className="f-detail" style={{ paddingTop: 36 }}>
          <div>
            <section><h5 style={{ fontSize: 20, lineHeight: '32px' }}>Description</h5><p className="txt">{c.description || 'No description yet.'}</p></section>
            {vision.length > 0 && <section><h5 style={{ fontSize: 20, lineHeight: '32px' }}>Company Vision</h5><p className="txt">{c.vision}</p></section>}
            <section className="f-share"><span style={{ fontSize: 14, color: 'var(--g-700)' }}>Share profile:</span>
              <a className="b" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" style={{ color: '#0066ff' }}><Facebook size={18} />Facebook</a>
              <a className="b" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" style={{ color: '#1da1f2' }}><Twitter size={18} />Twitter</a></section>
          </div>
          <aside>
            <div className="f-box"><div className="f-4">{grid.map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}</div></div>
            <div className="f-box"><h6>Contact Information</h6>
              <div className="f-contact">{contacts.map(([I, k, v]) => <div key={k}><I size={32} /><div><small>{k}</small><b>{v}</b></div></div>)}</div></div>
            {c.social_links?.length > 0 && <div className="f-box"><h6 style={{ fontSize: 18 }}>Follow us on:</h6><div className="f-socbtns" style={{ marginTop: 0 }}>{c.social_links.map((l) => <a key={l.id} href={l.url} target="_blank" rel="noreferrer" title={l.social_name}><Link2 size={16} /></a>)}</div></div>}
          </aside>
        </div>
        <div id="positions" className="f-related">
          <div className="f-head"><h2 className="f-h2" style={{ color: '#191f33' }}>Open Position ({rows(jobs.data).length})</h2></div>
          <div className="f-list-jobs">{rows(jobs.data).map((j) => <JobRow key={j.id} job={j} onSave={toggle} saved={isSaved(j.id)} />)}</div>
        </div>
      </div>
    </>
  )
}

function useSavedCandidates() {
  const { user } = useAuth()
  const [ids, setIds] = useState(new Set())
  useEffect(() => {
    if (user?.role !== 'employer') return
    api.get('/companies/wishlist/?page_size=100').then((d) => setIds(new Set(rows(d).map((s) => s.candidate_id)))).catch(() => {})
  }, [user])
  const toggle = async (uid) => {
    const flip = () => setIds((s) => { const n = new Set(s); n.has(uid) ? n.delete(uid) : n.add(uid); return n })
    flip()
    try { await api.post(`/companies/wishlist/${uid}/`) } catch { flip() }
  }
  return { has: (id) => ids.has(id), toggle }
}

export function Candidates() {
  const { user, loading: authLoading } = useAuth()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || 1)
  const experience = sp.get('experience') || ''
  const gender = sp.get('gender') || ''
  const isEmployer = user?.role === 'employer' || user?.role === 'admin'
  const { data, loading, error } = useFetch(() => (isEmployer ? api.get(`/candidates/browse/${qs({ experience, gender, page, page_size: 8 })}`) : Promise.resolve(null)), [sp.toString(), isEmployer])
  const saved = useSavedCandidates()
  const set = (k, v) => { const n = Object.fromEntries(sp); v ? (n[k] = v) : delete n[k]; delete n.page; setSp(n) }
  if (authLoading) return <Spinner />
  if (!isEmployer) return <><PageHead title="Find Candidates" trail={[[null, 'Find Candidates']]} /><Empty>Only employers can browse candidates. <Link className="link" to="/signin" style={{ color: 'var(--p-500)' }}>Sign in as an employer</Link></Empty></>
  const list = rows(data)
  return (
    <>
      <PageHead title="Find Candidates" trail={[[null, 'Find Candidates']]} />
      <div className="f-container">
        <div className="f-browse">
          <aside className="f-filter">
            <div className="sec"><h5>Experience</h5><Radios name="exp" value={experience} onChange={(v) => set('experience', v)} options={Object.entries(LABELS.experience)} /></div>
            <div className="sec"><h5>Gender</h5><Radios name="gender" value={gender} onChange={(v) => set('gender', v)} options={[['male', 'Male'], ['female', 'Female'], ['other', 'Other']]} /></div>
          </aside>
          <div>
            {loading ? <Spinner /> : error ? <Empty>{error.message}</Empty> : list.length === 0 ? <Empty>No candidates found.</Empty> : (
              <div className="f-rows">
                {list.map((c) => (
                  <div key={c.id} className="f-erow">
                    <Link to={`/candidates/${c.id}`} className="co"><Mark name={c.fullname} src={c.profile_photo} />
                      <div><h4>{c.fullname}</h4><div className="m"><span>{c.title_headline || '—'}</span>{c.experience && <span><Briefcase size={22} color="#9199a3" />{LABELS.experience[c.experience]}</span>}</div></div></Link>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className={`f-icon-btn ${saved.has(c.user_id) ? 'on' : ''}`} onClick={() => saved.toggle(c.user_id)} title="Save"><Bookmark size={24} fill={saved.has(c.user_id) ? 'currentColor' : 'none'} /></button>
                      <Link to={`/candidates/${c.id}`} className="f-btn soft">View Profile <ArrowRight size={24} /></Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pager count={data?.count} page={page} size={8} onPage={(p) => setSp({ ...Object.fromEntries(sp), page: p })} />
          </div>
        </div>
      </div>
    </>
  )
}

export function CandidateDetail() {
  const { id } = useParams()
  const { data: c, loading, error } = useFetch(() => api.get(`/candidates/${id}/`), [id])
  const saved = useSavedCandidates()
  if (loading) return <Spinner />
  if (error) return <Empty>{error.status === 403 ? 'Only employers can view candidate profiles.' : 'Candidate not found.'}</Empty>
  const info = [['Date of birth', c.date_of_birth], ['Nationality', c.nationality?.name], ['Marital status', c.marital_status], ['Gender', c.gender], ['Experience', LABELS.experience[c.experience]], ['Education', c.educations?.map((e) => e.name).join(', ')]].filter(([, v]) => v)
  return (
    <>
      <PageHead title="Candidate Details" trail={[['/candidates', 'Find Candidates'], [null, c.fullname]]} />
      <div className="f-jobhead">
        <div className="f-container">
          <div className="l">
            <div className="ava" style={c.profile_photo ? {} : { background: '#0a65cc' }}>{c.profile_photo ? <img src={media(c.profile_photo)} alt="" /> : c.fullname?.[0]}</div>
            <div><div className="t"><h1>{c.fullname}</h1></div><div className="meta"><span>{c.title_headline}</span>{c.location && <span><MapPin size={20} />{c.location}</span>}</div></div>
          </div>
          <div className="r"><div className="row">
            <button className={`f-sq ${saved.has(c.user_id) ? 'on' : ''}`} onClick={() => saved.toggle(c.user_id)}><Bookmark size={24} fill={saved.has(c.user_id) ? 'currentColor' : 'none'} /></button>
            <a className="f-btn lg" href={`mailto:${c.email}`}>Send Mail <Mail size={24} /></a></div></div>
        </div>
      </div>
      <div className="f-container">
        <div className="f-detail">
          <section><h5>Biography</h5><p className="txt">{c.biography || 'No biography yet.'}</p></section>
          <aside>
            <div className="f-box"><div className="f-4">{info.map(([k, v]) => <div key={k}><small>{k}</small><b style={{ textTransform: 'capitalize' }}>{v}</b></div>)}</div></div>
            <div className="f-box"><h6>Contact Information</h6>
              <div className="f-contact">{[[Globe, 'Website', c.personal_web], [Phone, 'Phone', c.phone_number], [Mail, 'Email address', c.email]].filter(([, , v]) => v).map(([I, k, v]) => <div key={k}><I size={32} /><div><small>{k}</small><b>{v}</b></div></div>)}</div></div>
            {c.social_links?.length > 0 && <div className="f-box"><h6 style={{ fontSize: 18 }}>Follow me on:</h6><div className="f-socbtns" style={{ marginTop: 0 }}>{c.social_links.map((l) => <a key={l.id} href={l.url} target="_blank" rel="noreferrer" title={l.social_name}><Link2 size={16} /></a>)}</div></div>}
          </aside>
        </div>
      </div>
    </>
  )
}
