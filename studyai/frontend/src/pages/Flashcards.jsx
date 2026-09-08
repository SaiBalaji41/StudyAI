import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import { 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  Keyboard, 
  Layers, 
  Clock,
  BookOpen
} from 'lucide-react';

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
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    getMaterials().then((res) => setMaterials(res.data.materials || [])).catch(() => {});
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

  const handleShuffle = () => {
    if (!deck || !deck.cards?.length) return;
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

  const handleRatingSubmit = useCallback(async (rating) => {
    if (!deck || !selectedId || !currentCard) return;
    try {
      const res = await reviewFlashcard(selectedId, currentCard.id, rating);
      setDeck(res.data.deck);
      
      // Advance to next card or loop
      setFlipped(false);
      if (currentIndex < activeCards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    }
  }, [deck, selectedId, currentCard, currentIndex, activeCards.length]);

  // Audio Speech Synthesis
  const speakText = (text, e) => {
    if (e) e.stopPropagation();
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_~[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Keyboard Navigation Support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input/textarea/select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (!deck || !activeCards.length || loading) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setFlipped(prev => !prev);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFlipped(false);
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFlipped(false);
        setCurrentIndex(prev => Math.min(activeCards.length - 1, prev + 1));
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleShuffle();
      } else if (flipped) {
        if (e.key === '1') handleRatingSubmit(1);
        else if (e.key === '2') handleRatingSubmit(2);
        else if (e.key === '3') handleRatingSubmit(3);
        else if (e.key === '4') handleRatingSubmit(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deck, activeCards, loading, flipped, handleRatingSubmit]);

  // Estimate interval preview for SM-2 buttons
  const getIntervalPreview = (rating, card) => {
    if (!card) return '';
    const reps = card.repetitions || 0;
    const ease = card.ease || 2.5;
    const interval = card.interval || 0;

    if (rating === 1) return '< 10m';
    if (rating === 2) {
      if (reps === 0) return '1d';
      return `${Math.max(1, Math.round((interval || 1) * 1.2))}d`;
    }
    if (rating === 3) {
      if (reps === 0) return '1d';
      if (reps === 1) return '6d';
      return `${Math.max(1, Math.round(interval * ease))}d`;
    }
    if (rating === 4) {
      if (reps === 0) return '4d';
      if (reps === 1) return '8d';
      return `${Math.max(1, Math.round(interval * ease * 1.3))}d`;
    }
    return '';
  };

  const totalCount = deck?.total_count || deck?.cards?.length || 1;
  const masteredCount = deck?.mastered_count || 0;
  const progressPercent = Math.min(100, Math.round((masteredCount / totalCount) * 100));

  return (
    <div>
      <PageHero 
        badge="Flashcards" 
        title="AI Flashcard Deck" 
        subtitle="Master your study material using standard Anki SM-2 spaced repetition." 
      />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <MaterialSelector 
            materials={materials} 
            selectedId={selectedId} 
            onChange={setSelectedId} 
          />
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Number of Cards</label>
            <Select 
              value={count} 
              onChange={setCount}
              options={[5, 10, 15, 20, 25, 30].map(n => ({ value: n, label: `${n} cards` }))}
            />
          </div>
          <div>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '42px' }}
              onClick={handleGenerate} 
              disabled={!selectedId || loading}
            >
              <Sparkles size={16} />
              {loading ? 'Generating...' : deck ? 'Regenerate Deck' : 'Generate Flashcards'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <LoadingSpinner message="AI is creating your flashcards..." />}

      {!deck && !loading && (
        <div className="card empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div className="empty-state-icon" style={{ color: 'var(--primary-light)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <Layers size={52} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem' }}>Ready to Supercharge Your Memory</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
            Select a study material above to generate intelligent Anki-style flashcards with spaced repetition algorithms.
          </p>
        </div>
      )}

      {deck && !loading && (
        <>
          {/* Spaced Repetition Mode Selector & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className={`btn ${reviewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setReviewMode('all'); setCurrentIndex(0); setFlipped(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <BookOpen size={16} />
                All Cards ({deck.cards.length})
              </button>
              <button 
                className={`btn ${reviewMode === 'due' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setReviewMode('due'); setCurrentIndex(0); setFlipped(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Clock size={16} />
                Due Reviews ({dueCards.length})
                {dueCards.length > 0 && (
                  <span style={{ 
                    background: 'var(--danger)', 
                    color: 'white', 
                    padding: '0.1rem 0.45rem', 
                    borderRadius: '10px', 
                    fontSize: '0.72rem',
                    fontWeight: '700'
                  }}>
                    {dueCards.length}
                  </span>
                )}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleShuffle}
                title="Shuffle Cards (S)"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
              >
                <Shuffle size={15} />
                Shuffle
              </button>
              <button 
                className={`btn ${showShortcuts ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setShowShortcuts(!showShortcuts)}
                title="Toggle Keyboard Shortcuts"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
              >
                <Keyboard size={15} />
                Shortcuts
              </button>
            </div>
          </div>

          {/* Mastered Progress Bar */}
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
              <span style={{ fontWeight: '600', color: 'var(--text)' }}>
                {activeCards.length > 0 ? `Card ${currentIndex + 1} of ${activeCards.length}` : 'No cards to review'}
              </span>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />
                Mastered: <strong>{masteredCount}/{totalCount}</strong> ({progressPercent}%)
              </span>
            </div>
            <div className="progress-bar" style={{ marginTop: '0.6rem', height: '8px' }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%`, transition: 'width 0.4s ease' }}
              />
            </div>
          </div>

          {showShortcuts && (
            <div className="alert alert-info" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <strong>Keyboard Shortcuts:</strong> Press <kbd style={{ background: 'rgba(255,255,255,0.15)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>Space</kbd> to flip card · <kbd style={{ background: 'rgba(255,255,255,0.15)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>←</kbd> Previous · <kbd style={{ background: 'rgba(255,255,255,0.15)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>→</kbd> Next · <kbd style={{ background: 'rgba(255,255,255,0.15)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>1-4</kbd> to Rate recalled answer · <kbd style={{ background: 'rgba(255,255,255,0.15)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>S</kbd> to Shuffle.
            </div>
          )}

          {activeCards.length === 0 ? (
            <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Spaced Repetition Complete!</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem', maxWidth: '440px', margin: '0.5rem auto 1.5rem auto' }}>
                You have finished all due cards for this session according to the SM-2 spaced repetition schedule.
              </p>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setReviewMode('all'); setCurrentIndex(0); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <BookOpen size={16} />
                Review All Cards Now
              </button>
            </div>
          ) : (
            currentCard && (
              <div className="flashcard-container">
                <div
                  className={`flashcard ${flipped ? 'flipped' : ''}`}
                  onClick={() => setFlipped(!flipped)}
                  title="Click to flip card"
                >
                  {/* Front Side: Question */}
                  <div className="flashcard-face flashcard-front">
                    <div className="flashcard-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge badge-${currentCard.difficulty || 'medium'}`}>
                          {currentCard.difficulty || 'medium'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                          {currentCard.topic || 'General'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          className="btn-icon"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                          onClick={(e) => speakText(currentCard.question, e)}
                          title="Read Question Aloud"
                        >
                          <Volume2 size={18} />
                        </button>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(124, 58, 237, 0.15)', color: 'var(--primary-light)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: '600' }}>
                          Question
                        </span>
                      </div>
                    </div>

                    <div className="flashcard-body">
                      <div className="flashcard-markdown markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {currentCard.question}
                        </ReactMarkdown>
                      </div>
                    </div>

                    <div className="flashcard-footer">
                      <span>
                        {currentCard.next_review_date && (
                          <>Due: {new Date(currentCard.next_review_date).toLocaleDateString()}</>
                        )}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-light)', fontWeight: '500' }}>
                        <RotateCw size={13} />
                        Click card or press Space to flip
                      </span>
                    </div>
                  </div>

                  {/* Back Side: Answer */}
                  <div className="flashcard-face flashcard-back">
                    <div className="flashcard-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge badge-${currentCard.difficulty || 'medium'}`}>
                          {currentCard.difficulty || 'medium'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                          {currentCard.topic || 'General'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          className="btn-icon"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                          onClick={(e) => speakText(currentCard.answer, e)}
                          title="Read Answer Aloud"
                        >
                          <Volume2 size={18} />
                        </button>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--secondary)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: '600' }}>
                          Answer
                        </span>
                      </div>
                    </div>

                    <div className="flashcard-body">
                      <div className="flashcard-markdown markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {currentCard.answer}
                        </ReactMarkdown>
                      </div>
                    </div>

                    <div className="flashcard-footer">
                      <span style={{ color: 'var(--text-muted)' }}>
                        Repetitions: {currentCard.repetitions || 0} · Ease: {(currentCard.ease || 2.5).toFixed(1)}
                      </span>
                      <span style={{ color: 'var(--secondary)', fontWeight: '500' }}>
                        Rate recall below
                      </span>
                    </div>
                  </div>
                </div>

                {/* SM-2 Spaced Repetition Rating UI */}
                {flipped && (
                  <div className="flashcard-ratings-grid">
                    <button 
                      onClick={() => handleRatingSubmit(1)}
                      className="rating-btn rating-btn-again"
                      title="Forgot answer (Press 1)"
                    >
                      <span className="rating-label">Again [1]</span>
                      <span className="rating-interval">{getIntervalPreview(1, currentCard)}</span>
                    </button>
                    <button 
                      onClick={() => handleRatingSubmit(2)}
                      className="rating-btn rating-btn-hard"
                      title="Remembered with difficulty (Press 2)"
                    >
                      <span className="rating-label">Hard [2]</span>
                      <span className="rating-interval">{getIntervalPreview(2, currentCard)}</span>
                    </button>
                    <button 
                      onClick={() => handleRatingSubmit(3)}
                      className="rating-btn rating-btn-good"
                      title="Remembered well (Press 3)"
                    >
                      <span className="rating-label">Good [3]</span>
                      <span className="rating-interval">{getIntervalPreview(3, currentCard)}</span>
                    </button>
                    <button 
                      onClick={() => handleRatingSubmit(4)}
                      className="rating-btn rating-btn-easy"
                      title="Perfect recall (Press 4)"
                    >
                      <span className="rating-label">Easy [4]</span>
                      <span className="rating-interval">{getIntervalPreview(4, currentCard)}</span>
                    </button>
                  </div>
                )}

                {/* Bottom Flashcard Navigation Controls */}
                <div className="flashcard-controls">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => { setFlipped(false); setCurrentIndex(Math.max(0, currentIndex - 1)); }}
                    disabled={currentIndex === 0}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setFlipped(!flipped)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RotateCw size={15} />
                    {flipped ? 'Show Question' : 'Show Answer'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => { setFlipped(false); setCurrentIndex(Math.min(activeCards.length - 1, currentIndex + 1)); }}
                    disabled={currentIndex === activeCards.length - 1}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    Next
                    <ChevronRight size={16} />
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
