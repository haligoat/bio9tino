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

export interface StudyData {
  title: string;
  vocab: VocabItem[];
  quizzes: QuizItem[];
}
