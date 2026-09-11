import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Candidate, Job, Stage } from '../types/database'
import KanbanBoard from '../components/KanbanBoard'
import CandidateFormModal from '../components/CandidateFormModal'

interface CandidatesPageProps {
  organizationId: string | null
}

export default function CandidatesPage({ organizationId }: CandidatesPageProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [jobFilter, setJobFilter] = useState('all')
  const [nameFilter, setNameFilter] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!organizationId) {
      setJobs([])
      setCandidates([])
      setLoading(false)
      return
    }

    loadData(organizationId)
  }, [organizationId])

  async function loadData(orgId: string) {
    setLoading(true)

    const [jobsResult, candidatesResult] = await Promise.all([
      supabase.from('jobs').select('*').eq('organization_id', orgId).order('title'),
      supabase
        .from('candidates')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
    ])

    setJobs(jobsResult.data ?? [])
    setCandidates(candidatesResult.data ?? [])
    setLoading(false)
  }

  const jobsById = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs])

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      if (jobFilter !== 'all' && candidate.job_id !== jobFilter) return false
      if (nameFilter && !candidate.full_name.toLowerCase().includes(nameFilter.toLowerCase())) return false
      return true
    })
  }, [candidates, jobFilter, nameFilter])

  async function handleStageChange(candidateId: string, stage: Stage) {
    setCandidates((prev) => prev.map((c) => (c.id === candidateId ? { ...c, stage } : c)))
    await supabase.from('candidates').update({ stage }).eq('id', candidateId)
  }

  function handleAssessed(candidateId: string, score: number, summary: string) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, ai_score: score, ai_summary: summary } : c)),
    )
  }

  if (!organizationId) {
    return <p className="text-sm text-slate-500">No organization selected.</p>
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Candidates</h2>

        <button
          onClick={() => setShowForm(true)}
          disabled={jobs.length === 0}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          title={jobs.length === 0 ? 'Add a job first' : undefined}
        >
          Add candidate
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={jobFilter}
          onChange={(event) => setJobFilter(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All jobs</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>

        <input
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
          placeholder="Filter by candidate name..."
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <KanbanBoard
          candidates={filteredCandidates}
          jobsById={jobsById}
          onStageChange={handleStageChange}
          onAssessed={handleAssessed}
        />
      )}

      {showForm && (
        <CandidateFormModal
          organizationId={organizationId}
          jobs={jobs}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            loadData(organizationId)
          }}
        />
      )}
    </div>
  )
}
