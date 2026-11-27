import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Calendar, ChevronDown, User } from 'react-feather'
import { Briefcase, Buildings, Users } from '@phosphor-icons/react'
import { api, fmtDate, media, qs, rows } from '../api'
import { PageHead, Pager } from '../components/figma'
import { Spinner, useFetch } from '../components/ui'
import { Notice, useAction } from '../components/shared'

const LOREM = 'Praesent non sem facilisis, hendrerit nisi vitae, volutpat quam. Aliquam metus massa, malesuada id est vel, pharetra ultricies arcu. Sed posuere mi at nisl finibus, a suscipit ante ornare.'
const nIN = (v) => (v ?? 0).toLocaleString('en-IN')

export function About() {
  const { data } = useFetch(() => api.get('/common/statistics/'))
  const d = data || {}
  return (
    <>
      <PageHead title="About us" trail={[[null, 'About']]} />
      <div className="f-container fx-hero fx-split">
        <div><div className="eyebrow">Who we are</div><h1>We’re highly skilled and professionals team.</h1><p className="lead">{LOREM}</p></div>
        <div className="fx-stats">{[[Briefcase, d.total_jobs, 'Live Job'], [Buildings, d.total_companies, 'Companies'], [Users, d.total_candidates, 'Candidates']].map(([I, v, l]) => <div key={l}><div className="ic"><I size={40} weight="duotone" /></div><div><b>{nIN(v)}</b><span className="f-sub">{l}</span></div></div>)}</div>
      </div>
      <div className="f-container"><div className="fx-img">Team photo</div></div>
      <div className="f-container fx-hero fx-split">
        <div className="fx-img" style={{ height: 320 }}>Illustration</div>
        <div><div className="eyebrow">Our Mission</div><h1>Our mission is help people to find the perfect job.</h1><p className="lead">{LOREM}</p></div>
      </div>
      <section className="f-section gray"><div className="f-container"><div className="f-cta">
        <div className="a"><div><h3>Become a Candidate</h3><p>Cras in massa pellentesque, mollis ligula non, luctus dui. Morbi sed efficitur dolor.</p></div><Link to="/signup" className="f-btn white">Register now <ArrowRight size={24} /></Link></div>
        <div className="b"><div><h3>Become a Employer</h3><p>Cras in massa pellentesque, mollis ligula non, luctus dui. Morbi sed efficitur dolor.</p></div><Link to="/signup?role=employer" className="f-btn white">Register now <ArrowRight size={24} /></Link></div>
      </div></div></section>
    </>
  )
}

export function Contact() {
  const [st, run] = useAction()
  const submit = (e) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.target))
    run(async () => { await api.post('/common/contact/', f); e.target.reset() }, 'Message sent. We will get back to you soon.')
  }
  return (
    <>
      <PageHead title="Contact" trail={[[null, 'Contact']]} />
      <div className="f-container fx-hero fx-split" style={{ alignItems: 'start' }}>
        <div><div className="eyebrow">Who we are</div><h1>We care about customer services</h1><p className="lead">Want to chat? We’d love to hear from you! Get in touch with our Customer Success Team to inquire about speaking events, advertising rates, or just say hello.</p>
          <a className="f-btn lg" href="mailto:support@myjob.uz" style={{ marginTop: 32 }}>Email Support</a></div>
        <form className="fx-form" onSubmit={submit}>
          <h3>Get in Touch</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}><input name="name" placeholder="Name" required /><input name="email" type="email" placeholder="Email" required /></div>
          <input name="subject" placeholder="Subjects" /><textarea name="message" placeholder="Message" required />
          <Notice state={st} /><button className="f-btn lg" disabled={st.busy}>Send Message</button>
        </form>
      </div>
    </>
  )
}

const FAQ = [['Your Account', 4], ['Employers and Jobs', 3], ['Candidate & Resume', 3]]
export function Faqs() {
  return (
    <>
      <PageHead title="FAQs" trail={[[null, 'FAQs']]} />
      <div className="f-container fx-faq" style={{ maxWidth: 800, padding: '40px 0 100px' }}>
        {FAQ.map(([t, n]) => (
          <div key={t}><h4>{t}</h4>{Array.from({ length: n }, (_, i) => (
            <details key={i} open={t === FAQ[0][0] && i === 1}><summary>Donec in ipsum sit amet mi tincidunt lacinia ut id risus.<ChevronDown size={16} /></summary><p>{LOREM}</p></details>
          ))}</div>
        ))}
      </div>
    </>
  )
}

export function Terms() {
  return (
    <>
      <PageHead title="Terms & Conditions" trail={[[null, 'Terms & Conditions']]} />
      <div className="f-container fx-terms" style={{ maxWidth: 900, padding: '60px 0 100px' }}>
        {['01. Terms & Condition', '02. Limitations', '03. Privacy', '04. Changes'].map((t) => (
          <div key={t}><h3>{t}</h3><p>{LOREM}</p><ul><li>In ac turpis mi. Donec quis semper neque. Nulla cursus gravida interdum.</li><li>Curabitur luctus sapien augue, mattis faucibus.</li><li>Aenean vel metus leo. Vivamus nec neque a libero.</li></ul></div>
        ))}
      </div>
    </>
  )
}

export function NotFound() {
  const nav = useNavigate()
  return (
    <div className="f-container fx-center"><div className="box"><h1>Opps! Page not found</h1><p>Something went wrong. It's look like the link is broken or the page is removed.</p>
      <div style={{ display: 'flex', gap: 12 }}><Link to="/" className="f-btn lg">Home <ArrowRight size={24} /></Link><button className="f-btn line lg" onClick={() => nav(-1)}>Go Back</button></div></div></div>
  )
}

export function ComingSoon() {
  const [st, run] = useAction()
  return (
    <div className="f-container fx-center"><div className="box" style={{ maxWidth: 520 }}><h1>Our website is under construction</h1><p>In ac turpis mi. Donec quis semper neque. Nulla cursus gravida interdum. Curabitur luctus sapien.</p>
      <form style={{ display: 'flex', gap: 12 }} onSubmit={(e) => { e.preventDefault(); run(async () => { await api.post('/common/contact/', { name: 'Subscriber', email: e.target.email.value, subject: 'Subscribe', message: 'Coming soon subscription' }) }, 'Thanks — we will notify you.') }}>
        <input name="email" type="email" placeholder="Email Address" required style={{ flex: 1, height: 48, border: '1px solid var(--g-100)', borderRadius: 5, padding: '0 18px' }} /><button className="f-btn" disabled={st.busy}>Subscribe <ArrowRight size={24} /></button></form>
      <Notice state={st} /></div></div>
  )
}

export function BlogList() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || 1)
  const category = sp.get('category') || ''
  const search = sp.get('search') || ''
  const cats = useFetch(() => api.get('/common/blog/categories/'))
  const { data, loading } = useFetch(() => api.get(`/common/blog/${qs({ category, search, page, page_size: 8 })}`), [sp.toString()])
  const set = (k, v) => { const n = Object.fromEntries(sp); v ? (n[k] = v) : delete n[k]; delete n.page; setSp(n) }
  return (
    <>
      <PageHead title="Blog" trail={[[null, 'Blog']]} />
      <div className="f-container fx-blog">
        <aside>
          <input className="fa-input" style={{ width: '100%', height: 48, border: '1px solid var(--g-100)', borderRadius: 5, padding: '0 18px', marginBottom: 32 }} placeholder="Search..." defaultValue={search} onKeyDown={(e) => e.key === 'Enter' && set('search', e.target.value)} />
          <h5 style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>Category</h5>
          <div className="fx-cat"><a href="#" className={!category ? 'on' : ''} onClick={(e) => { e.preventDefault(); set('category', '') }}>All</a>
            {(cats.data || []).map((c) => <a key={c.name} href="#" className={category === c.name ? 'on' : ''} onClick={(e) => { e.preventDefault(); set('category', c.name) }}><span>{c.name}</span><span>{c.count}</span></a>)}</div>
        </aside>
        <div>
          {loading ? <Spinner /> : rows(data).length === 0 ? <div className="f-empty">No posts yet.</div> : rows(data).map((p) => (
            <article key={p.id} className="fx-post">
              <Link to={`/blog/${p.id}`} className="im" style={p.image ? { backgroundImage: `url(${media(p.image)})` } : {}} />
              <div><div className="m"><span><User size={14} /> {p.author}</span><span><Calendar size={14} /> {fmtDate(p.created_at)}</span>{p.category && <span>{p.category}</span>}</div>
                <h4><Link to={`/blog/${p.id}`}>{p.title}</Link></h4><p>{p.excerpt}</p><Link to={`/blog/${p.id}`} className="f-sub" style={{ color: 'var(--p-500)', fontWeight: 500 }}>Read More →</Link></div>
            </article>
          ))}
          <Pager count={data?.count} page={page} size={8} onPage={(p) => setSp({ ...Object.fromEntries(sp), page: p })} />
        </div>
      </div>
    </>
  )
}

export function BlogDetail() {
  const { id } = useParams()
  const { data: p, loading, error } = useFetch(() => api.get(`/common/blog/${id}/`), [id])
  if (loading) return <Spinner />
  if (error) return <NotFound />
  return (
    <>
      <PageHead title="Single Blog" trail={[['/blog', 'Blog'], [null, p.title]]} />
      <div className="f-container" style={{ maxWidth: 860, padding: '60px 0 100px' }}>
        <h1 style={{ fontSize: 36, lineHeight: '44px', fontWeight: 500, letterSpacing: 0 }}>{p.title}</h1>
        <div className="fx-post" style={{ gridTemplateColumns: '1fr', border: 0, padding: '16px 0' }}><div className="m"><span><User size={14} /> {p.author}</span><span><Calendar size={14} /> {fmtDate(p.created_at)}</span>{p.category && <span>{p.category}</span>}</div></div>
        {p.image && <img src={media(p.image)} alt="" style={{ borderRadius: 12, margin: '16px 0 32px', width: '100%' }} />}
        <div className="txt" style={{ fontSize: 16, lineHeight: '26px', color: 'var(--g-600)', whiteSpace: 'pre-line' }}>{p.body}</div>
      </div>
    </>
  )
}
