import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, RotateCcw, Shuffle } from 'lucide-react';
import type { VocabItem } from '../types';
import './FlashcardsView.css';

interface FlashcardsViewProps {
  items: VocabItem[];
}

const shuffleIndexes = (length: number) => {
  const indexes = Array.from({ length }, (_, index) => index);

  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }

  return indexes;
};

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ items }) => {
  const orderedIndexes = useMemo(() => items.map((_, index) => index), [items]);
  const [cardOrder, setCardOrder] = useState(orderedIndexes);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (items.length === 0) return <div>No flashcards available.</div>;

  const currentCard = items[cardOrder[currentPosition]];
  const progressPercent = Math.round(((currentPosition + 1) / items.length) * 100);

  const goToCard = (position: number) => {
    setCurrentPosition(position);
    setIsFlipped(false);
  };

  const handlePrevious = () => {
    goToCard(currentPosition === 0 ? items.length - 1 : currentPosition - 1);
  };

  const handleNext = () => {
    goToCard(currentPosition === items.length - 1 ? 0 : currentPosition + 1);
  };

  const handleShuffle = () => {
    setCardOrder(shuffleIndexes(items.length));
    goToCard(0);
  };

  const handleReset = () => {
    setCardOrder(orderedIndexes);
    goToCard(0);
  };

  return (
    <div className="flashcards-view">
      <header className="view-header">
        <h1>Flashcards</h1>
        <div className="flashcard-progress-meta">
          <span>Card {currentPosition + 1} of {items.length}</span>
          <span>{progressPercent}%</span>
        </div>
        <div
          className="flashcard-progress-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={currentPosition + 1}
          aria-label="Flashcard progress"
        >
          <div className="flashcard-progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </header>

      <button
        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
        onClick={() => setIsFlipped((flipped) => !flipped)}
        type="button"
      >
        <span className="flashcard-label">{isFlipped ? 'Definition' : 'Term'}</span>
        <span className="flashcard-content">{isFlipped ? currentCard.definition : currentCard.term}</span>
      </button>

      <div className="flashcard-actions">
        <button className="flashcard-action-btn" onClick={handlePrevious} type="button">
          <ArrowLeft size={20} /> Previous
        </button>
        <button className="flashcard-action-btn primary" onClick={() => setIsFlipped((flipped) => !flipped)} type="button">
          <RotateCcw size={20} /> Flip
        </button>
        <button className="flashcard-action-btn" onClick={handleNext} type="button">
          Next <ArrowRight size={20} />
        </button>
      </div>

      <div className="flashcard-secondary-actions">
        <button className="flashcard-tool-btn" onClick={handleShuffle} type="button">
          <Shuffle size={18} /> Shuffle
        </button>
        <button className="flashcard-tool-btn" onClick={handleReset} type="button">
          <RefreshCw size={18} /> Reset
        </button>
      </div>
    </div>
  );
};

export default FlashcardsView;
