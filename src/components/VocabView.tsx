import React from 'react';
import type { VocabItem } from '../types';
import './VocabView.css';

interface VocabViewProps {
  items: VocabItem[];
  title: string;
}

const VocabView: React.FC<VocabViewProps> = ({ items, title }) => {
  return (
    <div className="vocab-view">
      <header className="view-header">
        <h1>Vocabulary: {title}</h1>
        <p>{items.length} terms to master</p>
      </header>
      <div className="vocab-grid">
        {items.map((item, index) => (
          <div key={index} className="vocab-card">
            <div className="vocab-term">{item.term}</div>
            <div className="vocab-definition">{item.definition}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VocabView;
