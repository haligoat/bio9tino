import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { FlashcardItem } from '../types';
import './FlashcardView.css';

interface FlashcardViewProps {
  items: FlashcardItem[];
  title: string;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ items, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (items.length === 0) return <div>No flashcards available.</div>;

  const currentCard = items[currentIndex];

  return (
    <div className="flashcard-view">
      <header className="view-header">
        <h1>Flashcards</h1>
        <p>Card {currentIndex + 1} of {items.length}</p>
      </header>

      <div className="flashcard-container">
        <div 
          className={`flashcard ${isFlipped ? 'flipped' : ''}`} 
          onClick={handleFlip}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <div className="card-label">Question</div>
              <div className="card-content">{currentCard.question}</div>
              <div className="card-hint">Click to flip</div>
            </div>
            <div className="flashcard-back">
              <div className="card-label">Answer</div>
              <div className="card-content">{currentCard.answer}</div>
              <div className="card-hint">Click to flip back</div>
            </div>
          </div>
        </div>

        <div className="flashcard-controls">
          <button onClick={handlePrev} className="control-btn" title="Previous">
            <ChevronLeft size={24} />
          </button>
          <button onClick={() => setIsFlipped(!isFlipped)} className="control-btn" title="Flip">
            <RotateCcw size={24} />
          </button>
          <button onClick={handleNext} className="control-btn" title="Next">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardView;
