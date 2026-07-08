import { useEffect, useState, useRef } from 'react';
import { generateQuiz, getMaterials, submitQuiz } from '../services/api';
import MaterialSelector from '../components/MaterialSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHero from '../components/PageHero';

export default function Quiz() {
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [quizType, setQuizType] = useState('mcq');
  const [numQuestions, setNumQuestions] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    getMaterials().then((res) => setMaterials(res.data.materials)).catch(() => {});
  }, []);

  useEffect(() => {
    if (quiz && !result) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [quiz, result]);

  const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleGenerate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    setQuiz(null);
    setResult(null);
    setAnswers({});
    setTimer(0);
    try {
      const res = await generateQuiz(selectedId, quizType, numQuestions);
      setQuiz(res.data.quiz);
    } catch (err) {
      setError(err.response?.data?.error || 'Quiz generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await submitQuiz(quiz.id, answers);
      setResult(res.data.result);
    } catch (err) {
      setError(err.response?.data?.error || 'Quiz submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectAnswer = (questionId, answer) => {
    if (result) return;
    setAnswers({ ...answers, [questionId]: answer });
  };

  const allAnswered = quiz?.questions?.length > 0 && quiz.questions.every((q) => {
    const ans = answers[q.id];
    return ans !== undefined && ans !== null && String(ans).trim() !== '';
  });

  return (
    <div>
      <PageHero badge="Adaptive Quiz" title="AI Quiz Generator" subtitle="Test your knowledge with MCQ, True/False, and Short Answer quizzes with auto-evaluation." />

      {!quiz && !result && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <MaterialSelector materials={materials} selectedId={selectedId} onChange={setSelectedId} />
          <div className="form-group">
            <label>Quiz Type</label>
            <select value={quizType} onChange={(e) => setQuizType(e.target.value)}>
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
            </select>
          </div>
          <div className="form-group">
            <label>Number of Questions</label>
            <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
              {[3, 5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>{n} questions</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={!selectedId || loading}>
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <LoadingSpinner message="AI is creating your quiz..." />}

      {quiz && !result && !loading && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>{quiz.material_title} — {quiz.quiz_type.replace('_', ' ').toUpperCase()}</h3>
            <div className={`quiz-timer ${timer > 300 ? 'warning' : ''}`}>⏱️ {formatTimer(timer)}</div>
          </div>

          {quiz.questions.map((q, idx) => (
            <div key={q.id} className="quiz-question">
              <h4>Q{idx + 1}. {q.question}</h4>
              <span className="badge badge-medium" style={{ marginTop: '0.5rem' }}>{q.topic}</span>

              {q.type === 'short_answer' || quiz.quiz_type === 'short_answer' ? (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => selectAnswer(q.id, e.target.value)}
                    placeholder="Type your answer here..."
                    rows={3}
                  />
                </div>
              ) : (
                <div className="quiz-options">
                  {(q.options || []).map((opt) => (
                    <button
                      key={opt}
                      className={`quiz-option ${answers[q.id] === opt ? 'selected' : ''}`}
                      onClick={() => selectAnswer(q.id, opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
            >
              {submitting ? 'Evaluating...' : 'Submit Quiz'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setQuiz(null); setAnswers({}); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3>Quiz Results</h3>
            <div className="stat-value" style={{ fontSize: '3rem', margin: '1rem 0' }}>
              {result.percentage}%
            </div>
            <p>{result.score} / {result.total} correct · Time: {formatTimer(timer)}</p>
          </div>

          {result.weak_topics?.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>Weak Topics Identified</h4>
              {result.weak_topics.map((wt, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{wt.topic}</span>
                  <span className={`badge badge-${wt.priority === 'high' ? 'hard' : 'medium'}`}>
                    {wt.incorrect_count} incorrect · {wt.priority} priority
                  </span>
                </div>
              ))}
            </div>
          )}

          <h4 style={{ marginBottom: '1rem' }}>Question Review</h4>
          {result.results.map((r, idx) => (
            <div key={r.question_id} className="quiz-question">
              <h4>
                Q{idx + 1}. {r.question}
                <span style={{ marginLeft: '0.5rem' }}>{r.is_correct ? '✅' : '❌'}</span>
              </h4>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Your answer: <strong>{r.user_answer || '(no answer)'}</strong>
              </p>
              {!r.is_correct && (
                <p style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>
                  Correct answer: <strong>{r.correct_answer}</strong>
                </p>
              )}
              {r.explanation && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {r.explanation}
                </p>
              )}
              {r.feedback && (
                <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '0.25rem' }}>
                  Feedback: {r.feedback}
                </p>
              )}
            </div>
          ))}

          <button className="btn btn-primary" onClick={() => { setQuiz(null); setResult(null); setAnswers({}); }}>
            Take Another Quiz
          </button>
        </div>
      )}
    </div>
  );
}
