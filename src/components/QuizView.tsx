import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight, RefreshCw } from 'lucide-react';
import type { QuizItem } from '../types';
import './QuizView.css';

interface QuizViewProps {
  items: QuizItem[];
  title: string;
}

const QuizView: React.FC<QuizViewProps> = ({ items, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answers, setAnswers] = useState<{question: string, correct: boolean, userIcon: string}[]>([]);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShortAnswer('');
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleSubmit = () => {
    const currentItem = items[currentIndex];
    let isCorrect = false;

    if (currentItem.type === 'multiple-choice') {
      isCorrect = selectedOption === currentItem.answer;
    } else {
      isCorrect = shortAnswer.trim().toLowerCase() === currentItem.answer.toLowerCase();
    }

    if (isCorrect) setScore(score + 1);
    
    setAnswers([...answers, {
      question: currentItem.question,
      correct: isCorrect,
      userIcon: currentItem.type === 'multiple-choice' ? selectedOption || '' : shortAnswer
    }]);
    
    setShowResult(true);
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShortAnswer('');
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
    setAnswers([]);
  };

  if (items.length === 0) return <div>No quiz available.</div>;

  if (quizComplete) {
    return (
      <div className="quiz-view result-page">
        <div className="result-card">
          <h1>Quiz Complete!</h1>
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
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div className="quiz-view">
      <header className="view-header">
        <h1>Quiz: {title}</h1>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          ></div>
        </div>
        <p>Question {currentIndex + 1} of {items.length}</p>
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

          {showResult && (
            <div className={`result-feedback ${answers[currentIndex].correct ? 'correct' : 'incorrect'}`}>
              {answers[currentIndex].correct ? (
                <><CheckCircle2 /> Correct!</>
              ) : (
                <><XCircle /> Incorrect. The correct answer was: <strong>{currentItem.answer}</strong></>
              )}
            </div>
          )}

          <div className="quiz-footer">
            {!showResult ? (
              <button 
                className="submit-btn" 
                onClick={handleSubmit}
                disabled={currentItem.type === 'multiple-choice' ? !selectedOption : !shortAnswer.trim()}
              >
                Submit Answer
              </button>
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
