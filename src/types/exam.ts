export interface Section {
  number: number;
  title: string;
  duration_minutes: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  sections_json: Section[];
  language_options: string[];
  created_by: string | null;
  created_at: string;
}

export type QuestionType = 'text' | 'image' | 'audio';

export interface Question {
  id: string;
  exam_id: string;
  section_number: number;
  category: string;
  type: QuestionType;
  content_text: string;
  image_url: string | null;
  audio_url: string | null;
  options_json: string[];
  correct_answer: string;
  explanation: string | null;
  question_order: number;
  created_at: string;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  current_section: number;
  answers_json: Record<string, string>;
  audio_play_json: Record<string, number>;
  section_finished_json: Record<string, boolean>;
  section_times_json: Record<string, number>;
  flagged_questions_json: string[];
  score_section_json: Record<string, number> | null;
  total_score_250: number | null;
  started_at: string;
  submitted_at: string | null;
}

export interface ExamState {
  currentSection: number;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  audioPlayCount: Record<string, number>;
  sectionFinished: Record<string, boolean>;
  sectionTimes: Record<string, number>;
  flaggedQuestions: string[];
  timeRemaining: number;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface CategoryScore {
  category: string;
  correct: number;
  total: number;
  percentage: number;
}
