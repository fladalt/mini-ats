import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Organization } from '../types/database'

export type Tab = 'jobs' | 'candidates' | 'accounts'

interface LayoutProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  activeOrgId: string | null
  onOrgChange: (orgId: string) => void
  children: ReactNode
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'jobs', label: 'Jobs' },
  { key: 'candidates', label: 'Candidates' },
]

export default function Layout({ activeTab, onTabChange, activeOrgId, onOrgChange, children }: LayoutProps) {
  const { profile, signOut } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (!isAdmin) return

    supabase
      .from('organizations')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setOrganizations(data ?? [])

        if (data && data.length > 0 && !activeOrgId) {
          onOrgChange(data[0].id)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const tabs = isAdmin ? [...TABS, { key: 'accounts' as Tab, label: 'Accounts' }] : TABS

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <span className="text-lg font-semibold text-slate-900">Mini ATS</span>
            <nav className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    activeTab === tab.key
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && activeTab !== 'accounts' && (
              <select
                value={activeOrgId ?? ''}
                onChange={(event) => onOrgChange(event.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                {organizations.length === 0 && <option value="">No organizations yet</option>}
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    Viewing: {org.name}
                  </option>
                ))}
              </select>
            )}

            <span className="text-sm text-slate-600">
              {profile?.full_name} {isAdmin && <span className="text-slate-400">(admin)</span>}
            </span>

            <button
              onClick={() => signOut()}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
