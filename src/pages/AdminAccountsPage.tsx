import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Organization, Profile, Role } from '../types/database'

export default function AdminAccountsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const [role, setRole] = useState<Role>('customer')
  const [orgMode, setOrgMode] = useState<'existing' | 'new'>('new')
  const [organizationId, setOrganizationId] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const [orgsResult, profilesResult] = await Promise.all([
      supabase.from('organizations').select('*').order('name'),
      supabase.from('profiles').select('*').order('full_name'),
    ])

    setOrganizations(orgsResult.data ?? [])
    setProfiles(profilesResult.data ?? [])
    setLoading(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    const { data, error } = await supabase.functions.invoke('admin-create-account', {
      body: {
        email,
        password,
        full_name: fullName,
        role,
        ...(role === 'customer' && orgMode === 'existing' ? { organization_id: organizationId } : {}),
        ...(role === 'customer' && orgMode === 'new' ? { organization_name: organizationName } : {}),
      },
    })

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    if (data?.error) {
      setError(data.error)
      setSaving(false)
      return
    }

    setSuccess(`Account created for ${email}`)
    setFullName('')
    setEmail('')
    setPassword('')
    setOrganizationName('')
    setSaving(false)
    loadData()
  }

  const admins = profiles.filter((p) => p.role === 'admin')

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Organizations & users</h2>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="font-medium text-slate-900">Admins</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {admins.map((admin) => (
                  <li key={admin.id}>{admin.full_name}</li>
                ))}
              </ul>
            </div>

            {organizations.map((org) => (
              <div key={org.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="font-medium text-slate-900">{org.name}</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {profiles
                    .filter((p) => p.organization_id === org.id && p.role === 'customer')
                    .map((p) => (
                      <li key={p.id}>{p.full_name}</li>
                    ))}
                  {profiles.filter((p) => p.organization_id === org.id && p.role === 'customer').length === 0 && (
                    <li className="text-slate-400">No users yet.</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Create account</h2>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Account type</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {role === 'customer' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Organization</label>
              <div className="mb-2 flex gap-3 text-sm">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={orgMode === 'new'}
                    onChange={() => setOrgMode('new')}
                  />
                  New
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={orgMode === 'existing'}
                    onChange={() => setOrgMode('existing')}
                  />
                  Existing
                </label>
              </div>

              {orgMode === 'new' ? (
                <input
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  placeholder="Organization name"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              ) : (
                <select
                  value={organizationId}
                  onChange={(event) => setOrganizationId(event.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
