import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Job } from '../types/database'

interface CandidateFormModalProps {
  organizationId: string
  jobs: Job[]
  onClose: () => void
  onCreated: () => void
}

export default function CandidateFormModal({ organizationId, jobs, onClose, onCreated }: CandidateFormModalProps) {
  const [jobId, setJobId] = useState(jobs[0]?.id ?? '')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setError('')

    const { error } = await supabase.from('candidates').insert({
      organization_id: organizationId,
      job_id: jobId,
      full_name: fullName,
      email: email || null,
      linkedin_url: linkedinUrl || null,
      resume_text: resumeText || null,
      stage: 'new',
    })

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    onCreated()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-3 rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold text-slate-900">Add candidate</h2>

        <div>
          <label htmlFor="candidate-job" className="mb-1 block text-sm font-medium text-slate-700">
            Job
          </label>
          <select
            id="candidate-job"
            value={jobId}
            onChange={(event) => setJobId(event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="candidate-name" className="mb-1 block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="candidate-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="candidate-email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="candidate-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="candidate-linkedin" className="mb-1 block text-sm font-medium text-slate-700">
            LinkedIn URL
          </label>
          <input
            id="candidate-linkedin"
            type="url"
            value={linkedinUrl}
            onChange={(event) => setLinkedinUrl(event.target.value)}
            placeholder="https://linkedin.com/in/..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="candidate-resume" className="mb-1 block text-sm font-medium text-slate-700">
            CV text (optional, for AI assessment)
          </label>
          <textarea
            id="candidate-resume"
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            rows={4}
            placeholder="Paste the candidate's CV text here"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || jobs.length === 0}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add candidate'}
          </button>
        </div>
      </form>
    </div>
  )
}
