import { useEffect, useState } from 'react';
import { generateInsights, getInsights, generatePractice, getMaterials } from '../services/api';
import MaterialSelector from '../components/MaterialSelector';
import PageHero from '../components/PageHero';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Insights() {
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [insights, setInsights] = useState(null);
  const [practice, setPractice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMaterials().then((res) => setMaterials(res.data.materials)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) { setInsights(null); return; }
    getInsights(selectedId).then((res) => setInsights(res.data.insights)).catch(() => setInsights(null));
  }, [selectedId]);

  const handleGenerate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      const res = await generateInsights(selectedId);
      setInsights(res.data.insights);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const handlePractice = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await generatePractice(selectedId);
      setPractice(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate practice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHero badge="Learning Intelligence" title="AI Study Insights" subtitle="Get exam tips, memory techniques, mind maps, and targeted practice for weak topics." />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <MaterialSelector materials={materials} selectedId={selectedId} onChange={setSelectedId} />
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={!selectedId || loading}>
            {loading ? 'Analyzing...' : insights ? 'Regenerate Insights' : 'Generate Insights'}
          </button>
          <button className="btn btn-secondary" onClick={handlePractice} disabled={!selectedId || loading}>
            Practice Weak Topics
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <LoadingSpinner message="AI is analyzing your material..." />}

      {insights && !loading && (
        <>
          <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-label">Difficulty</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{insights.difficulty_rating || 'N/A'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Est. Study Hours</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{insights.estimated_study_hours || '?'}h</div>
            </div>
          </div>

          {insights.mind_map && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Mind Map</h3>
              <div className="mind-map">
                <div className="mind-map-center">{insights.mind_map.central_topic}</div>
                <div className="mind-map-branches">
                  {(insights.mind_map.branches || []).map((b, i) => (
                    <div key={i} className="mind-map-branch">
                      <h5>{b.label}</h5>
                      <ul>{(b.children || []).map((c, j) => <li key={j}>{c}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="insight-grid">
            {insights.exam_tips?.length > 0 && (
              <div className="insight-card">
                <h4>🎯 Exam Tips</h4>
                <ul>{insights.exam_tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
            )}
            {insights.common_mistakes?.length > 0 && (
              <div className="insight-card">
                <h4>⚠️ Common Mistakes</h4>
                <ul>{insights.common_mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </div>
            )}
            {insights.memory_techniques?.length > 0 && (
              <div className="insight-card">
                <h4>🧠 Memory Techniques</h4>
                <ul>{insights.memory_techniques.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
            )}
            {insights.key_formulas?.length > 0 && (
              <div className="insight-card">
                <h4>📐 Key Formulas</h4>
                <ul>{insights.key_formulas.map((f, i) => <li key={i}>{f}</li>)}</ul>
              </div>
            )}
          </div>

          {insights.study_priority?.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Study Priority</h3>
              {insights.study_priority.map((p, i) => (
                <div key={i} className="priority-item">
                  <div>
                    <strong>{p.topic}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.reason}</div>
                  </div>
                  <span className={`badge badge-${p.importance === 'high' ? 'hard' : p.importance === 'medium' ? 'medium' : 'easy'}`}>
                    {p.importance}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {practice && !loading && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Targeted Practice Questions</h3>
          {practice.weak_topics?.length > 0 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Focused on: {practice.weak_topics.join(', ')}
            </p>
          )}
          {practice.questions.map((q, i) => (
            <div key={q.id} className="quiz-question">
              <h4>Q{i + 1}. {q.question}</h4>
              <span className="badge badge-medium">{q.topic}</span>
              {q.hint && <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '0.5rem' }}>💡 Hint: {q.hint}</p>}
              <details style={{ marginTop: '0.75rem' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--primary-light)', fontSize: '0.85rem' }}>Show Answer</summary>
                <p style={{ marginTop: '0.5rem' }}><strong>Answer:</strong> {q.answer}</p>
                {q.explanation && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{q.explanation}</p>}
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
