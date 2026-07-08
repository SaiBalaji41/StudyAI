import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateSummary, getMaterials, getSummary } from '../services/api';
import MaterialSelector from '../components/MaterialSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHero from '../components/PageHero';

export default function Summary() {
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMaterials().then((res) => setMaterials(res.data.materials)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSummary(null);
      return;
    }
    getSummary(selectedId)
      .then((res) => setSummary(res.data.summary))
      .catch(() => setSummary(null));
  }, [selectedId]);

  const handleGenerate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      const res = await generateSummary(selectedId);
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.error || 'Summary generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHero badge="AI Summary" title="Smart Summary Generator" subtitle="Get structured summaries with key concepts, definitions, and revision notes." />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <MaterialSelector
          materials={materials}
          selectedId={selectedId}
          onChange={setSelectedId}
        />
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={!selectedId || loading}
        >
          {loading ? 'Generating...' : summary ? 'Regenerate Summary' : 'Generate Summary'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <LoadingSpinner message="AI is generating your summary..." />}

      {summary && !loading && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>{summary.title}</h3>

          {summary.overview && (
            <>
              <h4 style={{ color: 'var(--primary-light)', marginBottom: '0.5rem' }}>Overview</h4>
              <p style={{ marginBottom: '1.5rem' }}>{summary.overview}</p>
            </>
          )}

          {summary.key_concepts?.length > 0 && (
            <>
              <h4 style={{ color: 'var(--primary-light)', marginBottom: '0.5rem' }}>Key Concepts</h4>
              <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                {summary.key_concepts.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}

          {summary.definitions?.length > 0 && (
            <>
              <h4 style={{ color: 'var(--primary-light)', marginBottom: '0.5rem' }}>Important Definitions</h4>
              <div style={{ marginBottom: '1.5rem' }}>
                {summary.definitions.map((d, i) => (
                  <p key={i} style={{ marginBottom: '0.5rem' }}>
                    <strong>{d.term}:</strong> {d.definition}
                  </p>
                ))}
              </div>
            </>
          )}

          {summary.core_principles?.length > 0 && (
            <>
              <h4 style={{ color: 'var(--primary-light)', marginBottom: '0.5rem' }}>Core Principles</h4>
              <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                {summary.core_principles.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </>
          )}

          {summary.revision_notes?.length > 0 && (
            <>
              <h4 style={{ color: 'var(--primary-light)', marginBottom: '0.5rem' }}>Revision Notes</h4>
              <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                {summary.revision_notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </>
          )}

          {summary.markdown && (
            <>
              <h4 style={{ color: 'var(--primary-light)', marginBottom: '0.5rem', marginTop: '1rem' }}>Full Summary</h4>
              <div className="markdown-content">
                <ReactMarkdown>{summary.markdown}</ReactMarkdown>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
