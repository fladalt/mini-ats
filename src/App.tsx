import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginForm from './components/LoginForm'
import Layout, { type Tab } from './components/Layout'
import JobsPage from './pages/JobsPage'

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

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      activeOrgId={activeOrgId}
      onOrgChange={setActiveOrgId}
    >
      {activeTab === 'jobs' && <JobsPage organizationId={organizationId} />}
      {activeTab === 'candidates' && <p className="text-sm text-slate-500">Candidates page coming next.</p>}
      {activeTab === 'accounts' && <p className="text-sm text-slate-500">Accounts page coming next.</p>}
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
