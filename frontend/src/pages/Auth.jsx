import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'react-feather'
import { Briefcase, Buildings } from '@phosphor-icons/react'
import { api } from '../api'
import { useAuth } from '../auth'
import { Brand } from '../components/figma'
import { useFetch } from '../components/ui'

const nIN = (v) => (v ?? 0).toLocaleString('en-IN')

function Panel() {
  const { data } = useFetch(() => api.get('/common/statistics/'))
  const d = data || {}
  return (
    <div className="fa-panel">
      <div className="info">
        <h2>Over {nIN(d.total_candidates)} candidates waiting for good employees.</h2>
        <div className="feat">
          {[[Briefcase, d.total_jobs, 'Live Job'], [Buildings, d.total_companies, 'Companies'], [Briefcase, d.new_jobs, 'New Jobs']].map(([I, v, l], i) => (
            <div key={i}><div className="ic"><I size={32} weight="duotone" color="#fff" /></div><div><b>{nIN(v)}</b><span>{l}</span></div></div>
          ))}
        </div>
      </div>
    </div>
  )
}

const FbIcon = () => <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#1877f2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.900V12h3.4l-.5 3.500h-2.900v8.400A12 12 0 0 0 24 12z" /></svg>
const GIcon = () => <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285f4" d="M23.5 12.300c0-.8-.1-1.600-.2-2.300H12v4.500h6.500a5.600 5.600 0 0 1-2.400 3.600v3h3.900c2.300-2.100 3.500-5.200 3.500-8.800z" /><path fill="#34a853" d="M12 24c3.200 0 6-1.100 7.900-2.900l-3.900-3c-1.100.7-2.500 1.200-4 1.200-3.100 0-5.700-2.100-6.600-4.900H1.400v3.100A12 12 0 0 0 12 24z" /><path fill="#fbbc05" d="M5.400 14.300a7.200 7.200 0 0 1 0-4.600V6.600H1.400a12 12 0 0 0 0 10.800z" /><path fill="#ea4335" d="M12 4.800c1.800 0 3.300.6 4.600 1.800l3.400-3.400A12 12 0 0 0 1.400 6.600l4 3.100C6.300 6.900 8.900 4.800 12 4.800z" /></svg>

function Social({ verb, onGoogle }) {
  const [note, setNote] = useState('')
  return (
    <>
      <div className="fa-or">or</div>
      <div className="fa-soc">
        <button type="button" onClick={() => setNote('Facebook login is not connected yet.')}><FbIcon />{verb} with Facebook</button>
        <button type="button" onClick={() => (onGoogle ? onGoogle() : setNote('Google login needs a Google client id (VITE_GOOGLE_CLIENT_ID).'))}><GIcon />{verb} with Google</button>
      </div>
      {note && <div className="fa-err">{note}</div>}
    </>
  )
}

function Password({ name, placeholder, lg }) {
  const [show, setShow] = useState(false)
  return (
    <div className={`fa-input ${lg ? 'lg' : ''}`}>
      <input name={name} type={show ? 'text' : 'password'} placeholder={placeholder} required />
      <span className="eye" onClick={() => setShow(!show)} style={{ cursor: 'pointer', ...(lg ? { top: 21 } : {}) }}>{show ? <EyeOff size={22} /> : <Eye size={22} />}</span>
    </div>
  )
}

function useSubmit(fn) {
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    try { await fn(new FormData(e.target), setInfo) } catch (err) { setError(err.message) }
    setBusy(false)
  }
  return { error, info, busy, submit }
}

const Split = ({ children, onSubmit }) => (
  <div className="fa">
    <div className="fa-logo"><Brand to="/" /></div>
    <div className="fa-split">
      <form className="fa-form" onSubmit={onSubmit}><div className="box">{children}</div></form>
      <Panel />
    </div>
  </div>
)
const Msgs = ({ error, info }) => (<>{error && <div className="fa-err">{error}</div>}{info && <div className="fa-ok">{info}</div>}</>)

export function SignUp() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [role, setRole] = useState(sp.get('role') === 'employer' ? 'employer' : 'candidate')
  const { error, busy, submit } = useSubmit(async (f) => {
    const email = f.get('email')
    await api.post('/accounts/register/', { first_name: f.get('first_name'), last_name: f.get('last_name'), email, role, password: f.get('password'), conf_password: f.get('conf_password') })
    await api.post('/accounts/send-email-verify/', { email }).catch(() => {})
    nav(`/verify-email?email=${encodeURIComponent(email)}`)
  })
  return (
    <Split onSubmit={submit}>
      <div className="row between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3>Create account.</h3>
          <p className="sub">Already have account? <Link to="/signin">Log In</Link></p>
        </div>
        <select className="fa-select" value={role} onChange={(e) => setRole(e.target.value)}><option value="candidate">Candidate</option><option value="employer">Employers</option></select>
      </div>
      <div className="fa-fields">
        <div className="fa-grid2">
          <div className="fa-input"><input name="first_name" placeholder="First Name" required /></div>
          <div className="fa-input"><input name="last_name" placeholder="Last Name" required /></div>
        </div>
        <div className="fa-input"><input name="email" type="email" placeholder="Email address" required /></div>
        <Password name="password" placeholder="Password" />
        <Password name="conf_password" placeholder="Confirm Password" />
        <label className="fa-check"><input type="checkbox" required />I've read and agree with your <a href="/terms">Terms of Services</a></label>
      </div>
      <Msgs error={error} />
      <button className="f-btn lg block" disabled={busy} style={{ marginTop: -12 }}>{busy ? 'Creating…' : 'Create Account'} <ArrowRight size={24} /></button>
      <Social verb="Sign up" />
    </Split>
  )
}

export function SignIn() {
  const nav = useNavigate()
  const { login } = useAuth()
  const { error, busy, submit } = useSubmit(async (f) => {
    const role = await login(f.get('email'), f.get('password'))
    nav(role === 'employer' ? '/employer' : '/dashboard')
  })
  return (
    <Split onSubmit={submit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3>Sign in</h3>
        <p className="sub">Don't have account <Link to="/signup">Create Account</Link></p>
      </div>
      <div className="fa-fields">
        <div className="fa-input"><input name="email" type="email" placeholder="Email address" required /></div>
        <Password name="password" placeholder="Password" />
        <div className="fa-row"><label className="fa-check"><input type="checkbox" />Remember Me</label><Link to="/forgot-password">Forget password</Link></div>
      </div>
      <Msgs error={error} />
      <button className="f-btn lg block" disabled={busy} style={{ marginTop: -12 }}>{busy ? 'Signing in…' : 'Sign In'} <ArrowRight size={24} /></button>
      <Social verb="Sign in" />
    </Split>
  )
}

export function ForgotPassword() {
  const { error, info, busy, submit } = useSubmit(async (f, setInfo) => {
    await api.post('/accounts/forgot-password/', { email: f.get('email') })
    setInfo('Reset link sent — check your inbox.')
  })
  return (
    <Split onSubmit={submit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3>Forget Password</h3>
        <div><p className="sub">Go back to <Link to="/signin">Sign In</Link></p><p className="sub" style={{ marginTop: 4 }}>Don't have account <Link to="/signup">Create Account</Link></p></div>
      </div>
      <div className="fa-fields"><div className="fa-input"><input name="email" type="email" placeholder="Email address" required /></div></div>
      <Msgs error={error} info={info} />
      <button className="f-btn lg block" disabled={busy} style={{ marginTop: -12 }}>Reset Password <ArrowRight size={24} /></button>
      <Social verb="Sign in" />
    </Split>
  )
}

export function VerifyEmail() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const email = sp.get('email') || 'emailaddress@gmail.com'
  const { error, info, busy, submit } = useSubmit(async (f) => {
    await api.post('/accounts/verify-email/', { email, code: f.get('code') })
    nav('/signin')
  })
  const [msg, setMsg] = useState('')
  const resend = async (e) => {
    e.preventDefault()
    try { await api.post('/accounts/send-email-verify/', { email }); setMsg('Verification code sent.') } catch (er) { setMsg(er.message) }
  }
  return (
    <div className="fa">
      <div className="fa-logo center"><Brand to="/" /></div>
      <form className="fa-center" onSubmit={submit}>
        <div className="box">
          <div className="head"><h3>Email Verification</h3><p className="sub">We've sent an verification to <b style={{ fontWeight: 500, color: 'var(--g-900)' }}>{email}</b> to verify your email address and activate your account.</p></div>
          <div className="fa-input lg"><input name="code" maxLength={6} inputMode="numeric" placeholder="Verification Code" required /></div>
          <Msgs error={error} info={info || msg} />
          <div><button className="f-btn lg block" disabled={busy}>Verify my Account <ArrowRight size={24} /></button>
            <p className="sub" style={{ marginTop: 16 }}>Didn’t recieve any code! <a href="#" onClick={resend}>Resends</a></p></div>
        </div>
      </form>
    </div>
  )
}

export function ResetPassword() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const { error, busy, submit } = useSubmit(async (f) => {
    await api.post('/accounts/reset-password/', { token: sp.get('token'), new_password: f.get('new_password'), conf_password: f.get('conf_password') })
    nav('/signin')
  })
  return (
    <div className="fa">
      <div className="fa-logo center"><Brand to="/" /></div>
      <form className="fa-center" onSubmit={submit}>
        <div className="box">
          <div className="head"><h3>Reset Password</h3><p className="sub">Duis luctus interdum metus, ut consectetur ante consectetur sed. Suspendisse euismod viverra massa sit amet mollis.</p></div>
          <div className="fa-fields"><Password name="new_password" placeholder="New Password" /><Password name="conf_password" placeholder="Confirm Password" /></div>
          <Msgs error={error} />
          <button className="f-btn lg block" disabled={busy}>Reset Password <ArrowRight size={24} /></button>
        </div>
      </form>
    </div>
  )
}
