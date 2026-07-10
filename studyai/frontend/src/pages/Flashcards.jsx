import { useEffect, useState } from 'react';
import {
  generateFlashcards,
  getFlashcards,
  getMaterials,
  updateFlashcardProgress,
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

  const handleKnown = async (known) => {
    if (!deck || !selectedId) return;
    const card = deck.cards[currentIndex];
    try {
      const res = await updateFlashcardProgress(selectedId, card.id, known);
      setDeck(res.data.deck);
    } catch {
      /* ignore */
    }
    setFlipped(false);
    if (currentIndex < deck.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleShuffle = () => {
    if (!deck) return;
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    setDeck({ ...deck, cards: shuffled });
    setCurrentIndex(0);
    setFlipped(false);
  };

  const currentCard = deck?.cards[currentIndex];
  const isKnown = deck?.known_cards?.includes(currentCard?.id);

  return (
    <div>
      <PageHero badge="Flashcards" title="AI Flashcard Deck" subtitle="Generate, flip, shuffle, and master concepts with spaced repetition tracking." />

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
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Card {currentIndex + 1} of {deck.cards.length} · Mastered: {deck.mastered_count}/{deck.total_count}
            </span>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${(deck.mastered_count / deck.total_count) * 100}%` }}
              />
            </div>
          </div>

          {currentCard && (
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
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                    Click to flip
                  </p>
                </div>
                <div className="flashcard-face flashcard-back">
                  <p style={{ fontSize: '1.1rem' }}>{currentCard.answer}</p>
                </div>
              </div>

              <div className="flashcard-controls">
                <button className="btn btn-secondary" onClick={() => { setFlipped(false); setCurrentIndex(Math.max(0, currentIndex - 1)); }}>
                  Previous
                </button>
                <button className="btn btn-danger" onClick={() => handleKnown(false)}>
                  Still Learning
                </button>
                <button className="btn btn-success" onClick={() => handleKnown(true)}>
                  Got It!
                </button>
                <button className="btn btn-secondary" onClick={() => { setFlipped(false); setCurrentIndex(Math.min(deck.cards.length - 1, currentIndex + 1)); }}>
                  Next
                </button>
                <button className="btn btn-secondary" onClick={handleShuffle}>
                  Shuffle
                </button>
              </div>

              {isKnown && (
                <p style={{ textAlign: 'center', color: 'var(--secondary)', marginTop: '1rem' }}>
                  ✓ Marked as mastered
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
