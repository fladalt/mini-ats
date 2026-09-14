import { useState } from 'react'
import type { Candidate, Stage } from '../types/database'
import { STAGES } from '../types/database'
import { supabase } from '../lib/supabase'

interface CandidateCardProps {
  candidate: Candidate
  jobTitle: string
  onStageChange: (candidateId: string, stage: Stage) => void
  onAssessed: (candidateId: string, score: number, summary: string) => void
  onDelete: (candidateId: string) => void
}

export default function CandidateCard({ candidate, jobTitle, onStageChange, onAssessed, onDelete }: CandidateCardProps) {
  const [assessing, setAssessing] = useState(false)
  const [assessError, setAssessError] = useState('')

  async function handleAssess() {
    setAssessing(true)
    setAssessError('')

    const { data, error } = await supabase.functions.invoke('assess-candidate-cv', {
      body: { candidate_id: candidate.id },
    })

    if (error || data?.error) {
      setAssessError(data?.error ?? error?.message ?? 'Assessment failed')
    } else {
      onAssessed(candidate.id, data.score, data.summary)
    }

    setAssessing(false)
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">{candidate.full_name}</p>
        <div className="flex shrink-0 items-center gap-1">
          {candidate.ai_score !== null && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {candidate.ai_score}
            </span>
          )}
          <button
            onClick={() => onDelete(candidate.id)}
            title="Delete candidate"
            className="text-xs text-slate-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      </div>

      <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
        {jobTitle}
      </span>

      {candidate.linkedin_url && (
        <a
          href={candidate.linkedin_url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block truncate text-xs text-indigo-600 hover:underline"
        >
          LinkedIn
        </a>
      )}

      {candidate.ai_summary && (
        <p className="mt-2 line-clamp-3 text-xs text-slate-500">{candidate.ai_summary}</p>
      )}

      {candidate.resume_text && candidate.ai_score === null && (
        <button
          onClick={handleAssess}
          disabled={assessing}
          className="mt-2 w-full rounded border border-indigo-200 bg-indigo-50 px-1.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
        >
          {assessing ? 'Assessing...' : 'Run AI assessment'}
        </button>
      )}

      {assessError && <p className="mt-1 text-xs text-red-600">{assessError}</p>}

      <select
        value={candidate.stage}
        onChange={(event) => onStageChange(candidate.id, event.target.value as Stage)}
        className="mt-2 w-full rounded border border-slate-200 px-1.5 py-1 text-xs"
      >
        {STAGES.map((stage) => (
          <option key={stage.value} value={stage.value}>
            Move to: {stage.label}
          </option>
        ))}
      </select>
    </div>
  )
}
