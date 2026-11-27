import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth'
import { Layout } from './components/Layout'
import { About, BlogDetail, BlogList, ComingSoon, Contact, Faqs, NotFound, Terms } from './pages/Static'
import { Protected } from './components/ui'
import Home from './pages/Home'
import { ForgotPassword, ResetPassword, SignIn, SignUp, VerifyEmail } from './pages/Auth'
import { JobDetail, Jobs } from './pages/Jobs'
import { CandidateDetail, Candidates, EmployerDetail, Employers } from './pages/Browse'
import { AppliedJobs, CandidateOverview, CandidateSettings, FavoriteJobs, JobAlerts } from './pages/CandidateDash'
import { Applications, Billing, EmployerOverview, EmployerSettings, MyJobs, PostJob, Pricing, SavedCandidates, SetupWizard } from './pages/EmployerDash'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/employers" element={<Employers />} />
            <Route path="/employers/:id" element={<EmployerDetail />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidates/:id" element={<CandidateDetail />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faqs" element={<Faqs />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:id" element={<BlogDetail />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
          </Route>

          <Route path="/dashboard" element={<Protected role="candidate"><Outlet /></Protected>}>
            <Route index element={<CandidateOverview />} />
            <Route path="applied" element={<AppliedJobs />} />
            <Route path="favorites" element={<FavoriteJobs />} />
            <Route path="alerts" element={<JobAlerts />} />
            <Route path="settings" element={<CandidateSettings />} />
          </Route>

          <Route path="/employer" element={<Protected role="employer"><Outlet /></Protected>}>
            <Route index element={<EmployerOverview />} />
            <Route path="post-job" element={<PostJob />} />
            <Route path="my-jobs" element={<MyJobs />} />
            <Route path="applications" element={<Applications />} />
            <Route path="applications/:jobId" element={<Applications />} />
            <Route path="saved" element={<SavedCandidates />} />
            <Route path="billing" element={<Billing />} />
            <Route path="profile" element={<EmployerSettings />} />
            <Route path="settings" element={<EmployerSettings account />} />
            <Route path="setup" element={<SetupWizard />} />
          </Route>

          <Route element={<Layout />}><Route path="*" element={<NotFound />} /></Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
