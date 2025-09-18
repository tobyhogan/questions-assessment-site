// Data types for quiz assessment system

export interface QuizScale {
  id: string;
  name: string;
  description: string;
  positiveLabel: string;
  negativeLabel: string;
}

export interface QuizOption {
  text: string;
  weights: { [scaleId: string]: number };
}

export interface Question {
  id: number;
  text: string;
  type: 'likert-scale' | 'multiple-choice';
  weights?: { [scaleId: string]: number }; // For Likert scale questions
  options?: QuizOption[]; // For multiple choice questions
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  questionCount: number;
  scales: QuizScale[];
  personalityTypes?: { [key: string]: string };
}

export interface QuizData {
  id: string;
  questions: Question[];
}

export interface QuizList {
  quizzes: Quiz[];
}

export interface QuizAnswer {
  questionId: number;
  selectedOption: number; // index of selected option
}

export interface QuizResult {
  quizId: string;
  scores: { [scaleId: string]: number };
  personalityType?: string;
  completedAt: Date;
}
