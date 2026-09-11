export type Role = 'admin' | 'customer'

export type Stage = 'new' | 'screening' | 'interview' | 'offer' | 'rejected'

export const STAGES: { value: Stage; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
]

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string | null
  full_name: string
  role: Role
  created_at: string
}

export interface Job {
  id: string
  organization_id: string
  title: string
  description: string | null
  created_at: string
}

export interface Candidate {
  id: string
  organization_id: string
  job_id: string
  full_name: string
  email: string | null
  linkedin_url: string | null
  stage: Stage
  resume_text: string | null
  ai_score: number | null
  ai_summary: string | null
  ai_assessed_at: string | null
  created_at: string
}
