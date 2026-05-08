export interface VocabItem {
  term: string;
  definition: string;
}

export interface QuizItem {
  type: 'multiple-choice' | 'short-answer';
  question: string;
  options?: string[];
  answer: string;
}

export interface QuizAnswer {
  question: string;
  correct: boolean;
  userIcon: string;
}

export interface QuizProgress {
  currentIndex: number;
  selectedOption: string | null;
  shortAnswer: string;
  showResult: boolean;
  score: number;
  quizComplete: boolean;
  answers: QuizAnswer[];
}

export interface StudyData {
  title: string;
  vocab: VocabItem[];
  quizzes: QuizItem[];
}
