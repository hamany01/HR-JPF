export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string;
  criteria: string[];
  questions: string[];
  status: 'active' | 'draft' | 'paused' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  job_id: string;
  name: string;
  phone: string;
  email: string;
  cv_url: string;
  status: CandidateStatus;
  interview_date: string | null;
  meeting_link: string | null;
  questions_token: string;
  invitation_sent_at: string | null;
  link_sent_at: string | null;
  queue_number?: number;
  is_online?: boolean;
  created_at: string;
}

export type CandidateStatus =
  | 'pending'
  | 'scheduled'
  | 'invited'
  | 'link_sent'
  | 'questioned'
  | 'interviewed'
  | 'evaluated'
  | 'accepted'
  | 'rejected'
  | 'no_show';

export interface Evaluation {
  candidate_id: string;
  job_id: string;
  scores: Record<number, number>;
  positives: string;
  negatives: string;
  notes: string;
  total_score: number;
  score_percentage: number;
  final_decision: string;
  evaluated_at: string;
}

export interface PreAnswers {
  answers: Record<number, string>;
  submitted_at: string;
  is_completed: boolean;
}

export interface AIAnalysis {
  candidate_id: string;
  summary: string;
  skills_score: number;
  sentiment: string;
  analyzed_at: string;
}

export interface WATemplate {
  id: string;
  name: string;
  content: string;
}

export interface InterviewSession {
  job_id: string;
  current_queue_number: number;
  status: 'active' | 'paused' | 'finished';
  last_updated: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface AppDatabase {
  jobs: Job[];
  candidates: Candidate[];
  evaluations: Record<string, Evaluation>;
  preAnswers: Record<string, PreAnswers>;
  aiAnalyses: Record<string, AIAnalysis>;
  templates: WATemplate[];
  notifications: AppNotification[];
  sessions: Record<string, InterviewSession>;
}
