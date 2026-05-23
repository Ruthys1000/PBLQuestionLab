export type AppMode = 'home' | 'generate' | 'diagnose' | 'results' | 'diagnosis' | 'brief' | 'archive'

export interface StressCriterion {
  score: number
  explanation: string
}

export interface StressTest {
  open_ended: StressCriterion
  content_connection: StressCriterion
  authenticity: StressCriterion
  age_appropriate: StressCriterion
  tension_dilemma: StressCriterion
  interdisciplinary: StressCriterion
  independent_inquiry: StressCriterion
  meaningful_product: StressCriterion
  information_available: StressCriterion
  not_googleable: StressCriterion
  overall_score: number
}

export interface AlternativeFormulation {
  question: string
  explanation: string
}

export interface BigQuestion {
  id: string
  question: string
  why_it_works: string
  strengths: string[]
  weaknesses: string[]
  sub_questions: string[]
  product_ideas: string[]
  alternative_formulations: AlternativeFormulation[]
  stress_test: StressTest
}

export interface RubricRow {
  criterion: string
  beginning: string
  developing: string
  proficient: string
}

export interface ProjectBrief {
  project_title: string
  teacher_summary: string
  learning_goals: string[]
  knowledge_content: string[]
  sub_questions: string[]
  inquiry_stages: string[]
  rubric: RubricRow[]
  opening_experience: string
}

export interface FormInput {
  topic: string
  grade: string
  subjects: string[]
  learning_goals: string
  required_content: string
  duration: string
  context: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
  preferred_product: string
  boldness: 'conservative' | 'balanced' | 'bold'
}

export interface DiagnoseInput {
  existing_question: string
  topic: string
  grade: string
  subjects: string[]
  learning_goals: string
  required_content: string
  duration: string
  boldness: 'conservative' | 'balanced' | 'bold'
}

export interface ArchiveItem {
  id: string
  topic: string
  grade: string
  subjects: string
  question: string
  overall_score: number
  full_data?: string
  created_at: string
}

export interface DiagnosisResult {
  overall_score: number
  what_works: string[]
  what_doesnt_work: string[]
  why_problematic: string
  learning_impact: string
  direction: string
  alternative_formulations: AlternativeFormulation[]
  stress_test: StressTest
}
