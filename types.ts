export type AppMode = 'home' | 'generate' | 'diagnose' | 'results' | 'diagnosis' | 'brief'

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

export interface Differentiation {
  support: string
  extension: string
}

export interface BigQuestion {
  id: string
  question: string
  why_it_works: string
  strengths: string[]
  weaknesses: string[]
  content_covered: string[]
  disciplines: string[]
  skills: string[]
  sub_questions: string[]
  product_ideas: string[]
  project_intro: string
  research_sources: string[]
  differentiation: Differentiation
  pedagogical_risks: string[]
  improvement_suggestions: string[]
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
  driving_question: string
  teacher_summary: string
  learning_goals: string[]
  knowledge_content: string[]
  skills: string[]
  sub_questions: string[]
  inquiry_stages: string[]
  possible_products: string[]
  rubric: RubricRow[]
  differentiation: Differentiation
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
