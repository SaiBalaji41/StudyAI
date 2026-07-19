import { useEffect, useState } from 'react';
import {
  generateFlashcards,
  getFlashcards,
  getMaterials,
  reviewFlashcard,
} from '../services/api';
import MaterialSelector from '../components/MaterialSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHero from '../components/PageHero';
import Select from '../components/Select';

export default function Flashcards() {
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [deck, setDeck] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState(10);
  const [reviewMode, setReviewMode] = useState('all'); // 'all' | 'due'

  useEffect(() => {
    getMaterials().then((res) => setMaterials(res.data.materials)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDeck(null);
      return;
    }
    getFlashcards(selectedId)
      .then((res) => {
        setDeck(res.data.deck);
        setCurrentIndex(0);
        setFlipped(false);
      })
      .catch(() => setDeck(null));
  }, [selectedId]);

  const handleGenerate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      const res = await generateFlashcards(selectedId, count);
      setDeck(res.data.deck);
      setCurrentIndex(0);
      setFlipped(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Flashcard generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (rating) => {
    if (!deck || !selectedId || !currentCard) return;
    try {
      const res = await reviewFlashcard(selectedId, currentCard.id, rating);
      setDeck(res.data.deck);
      
      // Move to next card or wrap up
      setFlipped(false);
      if (currentIndex < activeCards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // if reached end, reset to 0 if cards still remain
        setCurrentIndex(0);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    }
  };

  const handleShuffle = () => {
    if (!deck) return;
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    setDeck({ ...deck, cards: shuffled });
    setCurrentIndex(0);
    setFlipped(false);
  };

  // Filter cards by due date
  const dueCards = (deck?.cards || []).filter(card => {
    if (!card.next_review_date) return true;
    return new Date(card.next_review_date) <= new Date();
  });

  const activeCards = reviewMode === 'due' ? dueCards : (deck?.cards || []);
  const currentCard = activeCards[currentIndex];

  return (
    <div>
      <PageHero badge="Flashcards" title="AI Flashcard Deck" subtitle="Master your study material using standard Anki SM-2 spaced repetition." />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <MaterialSelector materials={materials} selectedId={selectedId} onChange={setSelectedId} />
        <div className="form-group">
          <label>Number of Cards</label>
          <Select 
            value={count} 
            onChange={setCount}
            options={[5, 10, 15, 20, 25, 30].map(n => ({ value: n, label: `${n} cards` }))}
          />
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={!selectedId || loading}>
          {loading ? 'Generating...' : deck ? 'Regenerate Deck' : 'Generate Flashcards'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <LoadingSpinner message="AI is creating your flashcards..." />}

      {deck && !loading && (
        <>
          {/* Spaced Repetition Mode Selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <button 
              className={`btn ${reviewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setReviewMode('all'); setCurrentIndex(0); setFlipped(false); }}
            >
              All Cards ({deck.cards.length})
            </button>
            <button 
              className={`btn ${reviewMode === 'due' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setReviewMode('due'); setCurrentIndex(0); setFlipped(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              Due Reviews ({dueCards.length})
              {dueCards.length > 0 && <span style={{ background: 'var(--danger)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.7rem' }}>{dueCards.length}</span>}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {activeCards.length > 0 ? `Card ${currentIndex + 1} of ${activeCards.length}` : 'No cards'}{' '}
              · Mastered: {deck.mastered_count}/{deck.total_count}
            </span>
            <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${(deck.mastered_count / deck.total_count) * 100}%` }}
              />
            </div>
          </div>

          {activeCards.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <h3>🎉 Review Complete!</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                You have completed all due spaced repetition reviews for this deck.
              </p>
              <button className="btn btn-secondary" onClick={() => { setReviewMode('all'); setCurrentIndex(0); }}>
                Review All Cards
              </button>
            </div>
          ) : (
            currentCard && (
              <div className="flashcard-container">
                <div
                  className={`flashcard ${flipped ? 'flipped' : ''}`}
                  onClick={() => setFlipped(!flipped)}
                >
                  <div className="flashcard-face flashcard-front">
                    <span className={`badge badge-${currentCard.difficulty}`}>{currentCard.difficulty}</span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                      {currentCard.topic}
                    </p>
                    <h3 style={{ marginTop: '1rem' }}>{currentCard.question}</h3>
                    {currentCard.next_review_date && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
                        Next review: {new Date(currentCard.next_review_date).toLocaleDateString()}
                      </p>
                    )}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                      Click to flip
                    </p>
                  </div>
                  <div className="flashcard-face flashcard-back">
                    <p style={{ fontSize: '1.1rem' }}>{currentCard.answer}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
                      How well did you know this?
                    </p>
                  </div>
                </div>

                {/* SM-2 Spaced Repetition Rating UI */}
                {flipped && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', width: '100%', maxWidth: '500px', margin: '1.5rem auto 0 auto' }}>
                    <button 
                      onClick={() => handleRatingSubmit(1)}
                      className="btn" 
                      style={{ background: '#ef4444', color: '#fff', fontSize: '0.85rem', padding: '0.75rem 0' }}
                    >
                      Again
                    </button>
                    <button 
                      onClick={() => handleRatingSubmit(2)}
                      className="btn" 
                      style={{ background: '#f97316', color: '#fff', fontSize: '0.85rem', padding: '0.75rem 0' }}
                    >
                      Hard
                    </button>
                    <button 
                      onClick={() => handleRatingSubmit(3)}
                      className="btn" 
                      style={{ background: '#3b82f6', color: '#fff', fontSize: '0.85rem', padding: '0.75rem 0' }}
                    >
                      Good
                    </button>
                    <button 
                      onClick={() => handleRatingSubmit(4)}
                      className="btn" 
                      style={{ background: '#10b981', color: '#fff', fontSize: '0.85rem', padding: '0.75rem 0' }}
                    >
                      Easy
                    </button>
                  </div>
                )}

                <div className="flashcard-controls" style={{ marginTop: '1.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => { setFlipped(false); setCurrentIndex(Math.max(0, currentIndex - 1)); }}>
                    Previous
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setFlipped(false); setCurrentIndex(Math.min(activeCards.length - 1, currentIndex + 1)); }}>
                    Next
                  </button>
                  <button className="btn btn-secondary" onClick={handleShuffle}>
                    Shuffle
                  </button>
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
