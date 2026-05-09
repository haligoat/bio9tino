import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight, RefreshCw, SkipForward, ClipboardCheck } from 'lucide-react';
import type { QuizAnswer, QuizItem, QuizProgress, QuizSet } from '../types';
import './QuizView.css';

interface QuizViewProps {
  items?: QuizItem[];
  quizSets?: QuizSet[];
  selectedQuizId?: string;
  onQuizSelect?: (quizId: string) => void;
  initialProgress?: QuizProgress | null;
  onProgressChange?: (progress: QuizProgress | null) => void;
  onQuizComplete?: (score: number, total: number) => void;
}

const emptyProgress: QuizProgress = {
  currentIndex: 0,
  selectedOption: null,
  shortAnswer: '',
  showResult: false,
  score: 0,
  quizComplete: false,
  answers: [],
};

const clampProgress = (progress: QuizProgress | null | undefined, itemCount: number): QuizProgress => {
  if (!progress || itemCount === 0) return emptyProgress;

  return {
    ...progress,
    currentIndex: Math.min(Math.max(progress.currentIndex, 0), itemCount - 1),
    answers: progress.answers.slice(0, itemCount),
  };
};

const createFallbackQuizSet = (items: QuizItem[]): QuizSet => ({
  id: 'quiz-1',
  title: 'Quiz',
  description: 'Unit practice',
  items,
});

const QuizView: React.FC<QuizViewProps> = ({
  items: fallbackItems = [],
  quizSets,
  selectedQuizId,
  onQuizSelect,
  initialProgress,
  onProgressChange,
  onQuizComplete,
}) => {
  const availableQuizSets = quizSets?.length ? quizSets : [createFallbackQuizSet(fallbackItems)];
  const activeQuizSet = availableQuizSets.find((quizSet) => quizSet.id === selectedQuizId) ?? availableQuizSets[0];
  const items = activeQuizSet.items;
  const savedProgress = clampProgress(initialProgress, items.length);
  const [currentIndex, setCurrentIndex] = useState(savedProgress.currentIndex);
  const [selectedOption, setSelectedOption] = useState<string | null>(savedProgress.selectedOption);
  const [shortAnswer, setShortAnswer] = useState(savedProgress.shortAnswer);
  const [showResult, setShowResult] = useState(savedProgress.showResult);
  const [score, setScore] = useState(savedProgress.score);
  const [quizComplete, setQuizComplete] = useState(savedProgress.quizComplete);
  const [answers, setAnswers] = useState<QuizAnswer[]>(savedProgress.answers);

  const saveProgress = (progress: QuizProgress) => {
    onProgressChange?.(progress);
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      const nextProgress = {
        currentIndex: currentIndex + 1,
        selectedOption: null,
        shortAnswer: '',
        showResult: false,
        score,
        quizComplete: false,
        answers,
      };

      setCurrentIndex(nextProgress.currentIndex);
      setSelectedOption(null);
      setShortAnswer('');
      setShowResult(false);
      saveProgress(nextProgress);
    } else {
      onQuizComplete?.(score, items.length);
      saveProgress({
        currentIndex,
        selectedOption,
        shortAnswer,
        showResult,
        score,
        quizComplete: true,
        answers,
      });
      setQuizComplete(true);
    }
  };

  const handleSkip = () => {
    const currentItem = items[currentIndex];
    const nextAnswers = [...answers, {
      question: currentItem.question,
      correct: false,
      userIcon: ''
    }];

    setAnswers(nextAnswers);

    if (currentIndex < items.length - 1) {
      const nextProgress = {
        currentIndex: currentIndex + 1,
        selectedOption: null,
        shortAnswer: '',
        showResult: false,
        score,
        quizComplete: false,
        answers: nextAnswers,
      };

      setCurrentIndex(nextProgress.currentIndex);
      setSelectedOption(null);
      setShortAnswer('');
      setShowResult(false);
      saveProgress(nextProgress);
    } else {
      onQuizComplete?.(score, items.length);
      saveProgress({
        currentIndex,
        selectedOption: null,
        shortAnswer: '',
        showResult: false,
        score,
        quizComplete: true,
        answers: nextAnswers,
      });
      setQuizComplete(true);
    }
  };

  const handleSubmit = () => {
    const currentItem = items[currentIndex];
    const isCorrect = currentItem.type === 'multiple-choice'
      ? selectedOption === currentItem.answer
      : shortAnswer.trim().toLowerCase() === currentItem.answer.toLowerCase();

    const nextScore = isCorrect ? score + 1 : score;
    const nextAnswers = [...answers, {
      question: currentItem.question,
      correct: isCorrect,
      userIcon: currentItem.type === 'multiple-choice' ? selectedOption || '' : shortAnswer
    }];
    
    setScore(nextScore);
    setAnswers(nextAnswers);
    setShowResult(true);
    saveProgress({
      currentIndex,
      selectedOption,
      shortAnswer,
      showResult: true,
      score: nextScore,
      quizComplete: false,
      answers: nextAnswers,
    });
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShortAnswer('');
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
    setAnswers([]);
    onProgressChange?.(null);
  };

  const renderQuizPicker = () => {
    if (availableQuizSets.length <= 1) return null;

    return (
      <section className="quiz-picker" aria-label="Choose a quiz">
        {availableQuizSets.map((quizSet) => {
          const isActive = quizSet.id === activeQuizSet.id;

          return (
            <button
              key={quizSet.id}
              type="button"
              className={`quiz-choice ${isActive ? 'active' : ''}`}
              aria-pressed={isActive}
              onClick={() => onQuizSelect?.(quizSet.id)}
            >
              <span className="quiz-choice-icon">
                <ClipboardCheck size={22} />
              </span>
              <span className="quiz-choice-copy">
                <span className="quiz-choice-title">{quizSet.title}</span>
                <span className="quiz-choice-detail">{quizSet.items.length} questions</span>
              </span>
              <span className="quiz-choice-badge">Same difficulty</span>
            </button>
          );
        })}
      </section>
    );
  };

  if (items.length === 0) return <div>No quiz available.</div>;

  if (quizComplete) {
    return (
      <div className="quiz-view result-page">
        {renderQuizPicker()}
        <div className="result-card">
          <h1>{activeQuizSet.title} Complete!</h1>
          <div className="score-display">
            <span className="score-num">{score}</span>
            <span className="score-total">/ {items.length}</span>
          </div>
          <p className="score-message">
            {score === items.length ? 'Perfect! You mastered this!' : 'Good job! Keep practicing.'}
          </p>
          <button onClick={restartQuiz} className="restart-btn">
            <RefreshCw size={20} /> Restart Quiz
          </button>
          <div className="answer-review" aria-label="Answer review">
            {answers.map((answer, index) => (
              <div key={`${answer.question}-${index}`} className={`answer-review-row ${answer.correct ? 'correct' : 'incorrect'}`}>
                <span>{index + 1}</span>
                <p>{answer.question}</p>
                {answer.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const currentAnswer = answers[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / items.length) * 100);

  return (
    <div className="quiz-view">
      <header className="view-header">
        <div className="quiz-kicker">Choose a Form</div>
        <h1>{activeQuizSet.title}</h1>
        <p>{activeQuizSet.description}</p>
        {renderQuizPicker()}
        <div className="quiz-progress-meta">
          <span>Question {currentIndex + 1} of {items.length}</span>
          <span>{progressPercent}%</span>
        </div>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={currentIndex + 1}
          aria-label="Quiz progress"
        >
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </header>

      <div className="quiz-container">
        <div className="question-card">
          <h2 className="question-text">{currentItem.question}</h2>

          <div className="answer-section">
            {currentItem.type === 'multiple-choice' ? (
              <div className="options-grid">
                {currentItem.options?.map((option, idx) => (
                  <button
                    key={idx}
                    disabled={showResult}
                    className={`option-btn ${selectedOption === option ? 'selected' : ''} ${
                      showResult && option === currentItem.answer ? 'correct' : ''
                    } ${
                      showResult && selectedOption === option && option !== currentItem.answer ? 'incorrect' : ''
                    }`}
                    onClick={() => setSelectedOption(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="short-answer-input">
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  value={shortAnswer}
                  disabled={showResult}
                  onChange={(e) => setShortAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !showResult && handleSubmit()}
                />
              </div>
            )}
          </div>

          {showResult && currentAnswer && (
            <div className={`result-feedback ${currentAnswer.correct ? 'correct' : 'incorrect'}`}>
              {currentAnswer.correct ? (
                <><CheckCircle2 /> Correct!</>
              ) : (
                <><XCircle /> Incorrect. The correct answer was: <strong>{currentItem.answer}</strong></>
              )}
            </div>
          )}

          <div className="quiz-footer">
            {!showResult ? (
              <>
                <button className="skip-btn" onClick={handleSkip}>
                  Skip <SkipForward size={20} />
                </button>
                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={currentItem.type === 'multiple-choice' ? !selectedOption : !shortAnswer.trim()}
                >
                  Submit Answer
                </button>
              </>
            ) : (
              <button className="next-btn" onClick={handleNext}>
                {currentIndex === items.length - 1 ? 'Finish Quiz' : 'Next Question'} <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizView;
