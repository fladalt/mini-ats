import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginForm from './components/LoginForm'
import Layout, { type Tab } from './components/Layout'
import JobsPage from './pages/JobsPage'
import CandidatesPage from './pages/CandidatesPage'
import AdminAccountsPage from './pages/AdminAccountsPage'

function AuthedApp() {
  const { session, profile, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('jobs')
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)

  if (loading) {
    return <p className="p-8 text-sm text-slate-500">Loading...</p>
  }

  if (!session) {
    return <LoginForm />
  }

  if (!profile) {
    return <p className="p-8 text-sm text-slate-500">Setting up your account...</p>
  }

  const organizationId = profile.role === 'admin' ? activeOrgId : profile.organization_id
  const tab = activeTab === 'accounts' && profile.role !== 'admin' ? 'jobs' : activeTab

  return (
    <Layout
      activeTab={tab}
      onTabChange={setActiveTab}
      activeOrgId={activeOrgId}
      onOrgChange={setActiveOrgId}
    >
      {tab === 'jobs' && <JobsPage organizationId={organizationId} />}
      {tab === 'candidates' && <CandidatesPage organizationId={organizationId} />}
      {tab === 'accounts' && profile.role === 'admin' && <AdminAccountsPage />}
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthedApp />
    </AuthProvider>
  )
}

export default App
