import type { Candidate, Job, Stage } from '../types/database'
import { STAGES } from '../types/database'
import CandidateCard from './CandidateCard'

interface KanbanBoardProps {
  candidates: Candidate[]
  jobsById: Map<string, Job>
  onStageChange: (candidateId: string, stage: Stage) => void
  onAssessed: (candidateId: string, score: number, summary: string) => void
  onDelete: (candidateId: string) => void
}

export default function KanbanBoard({ candidates, jobsById, onStageChange, onAssessed, onDelete }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {STAGES.map((stage) => {
        const stageCandidates = candidates.filter((c) => c.stage === stage.value)

        return (
          <div key={stage.value} className="rounded-lg bg-slate-100 p-2">
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {stage.label} <span className="text-slate-400">({stageCandidates.length})</span>
            </h3>

            <div className="space-y-2">
              {stageCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  jobTitle={jobsById.get(candidate.job_id)?.title ?? 'Unknown job'}
                  onStageChange={onStageChange}
                  onAssessed={onAssessed}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
