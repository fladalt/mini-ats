import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Job } from '../types/database'

interface JobsPageProps {
  organizationId: string | null
}

export default function JobsPage({ organizationId }: JobsPageProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!organizationId) {
      setJobs([])
      setLoading(false)
      return
    }

    loadJobs(organizationId)
  }, [organizationId])

  async function loadJobs(orgId: string) {
    setLoading(true)

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setJobs(data ?? [])
    }

    setLoading(false)
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!organizationId) return

    setSaving(true)
    setError('')

    const { error } = await supabase.from('jobs').insert({
      organization_id: organizationId,
      title,
      description: description || null,
    })

    if (error) {
      setError(error.message)
    } else {
      setTitle('')
      setDescription('')
      await loadJobs(organizationId)
    }

    setSaving(false)
  }

  async function handleDelete(job: Job) {
    if (!organizationId) return
    if (!confirm(`Delete "${job.title}"? This can't be undone.`)) return

    const { error } = await supabase.from('jobs').delete().eq('id', job.id)

    if (error) {
      setError(error.message)
    } else {
      setJobs((prev) => prev.filter((j) => j.id !== job.id))
    }
  }

  if (!organizationId) {
    return <p className="text-sm text-slate-500">No organization selected.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Jobs</h2>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-500">No jobs yet.</p>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li key={job.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <div>
                  <h3 className="font-medium text-slate-900">{job.title}</h3>
                  {job.description && (
                    <p className="mt-1 text-sm text-slate-600">{job.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(job)}
                  className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Add a job</h2>

        <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <label htmlFor="job-title" className="mb-1 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="job-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="job-description" className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="job-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add job'}
          </button>
        </form>
      </div>
    </div>
  )
}
