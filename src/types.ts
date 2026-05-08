export interface VocabItem {
  term: string;
  definition: string;
}

export interface FlashcardItem {
  question: string;
  answer: string;
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
  flashcards: FlashcardItem[];
  quizzes: QuizItem[];
}
