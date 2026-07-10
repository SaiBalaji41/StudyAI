import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMaterials, deleteMaterial, searchMaterials } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHero from '../components/PageHero';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import { Book, Trash2, Search } from 'lucide-react';

export default function Library() {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' });
  const { addToast } = useToast();

  const load = async (q = '') => {
    setLoading(true);
    try {
      const res = q ? await searchMaterials(q) : await getMaterials();
      setMaterials(res.data.materials);
    } catch {
      addToast('Failed to load materials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const searchTimer = useRef(null);

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(q), 300);
  };

  const triggerDelete = (id, title) => {
    setDeleteModal({ isOpen: true, id, title });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMaterial(deleteModal.id);
      addToast('Material deleted', 'success');
      load(search);
    } catch {
      addToast('Delete failed', 'error');
    } finally {
      setDeleteModal({ isOpen: false, id: null, title: '' });
    }
  };

  return (
    <div>
      <PageHero badge="Material Library" title="Study Library" subtitle="Browse, search, and manage all your uploaded study materials." />

      <div className="search-bar">
        <span>🔍</span>
        <input placeholder="Search materials by title or content..." value={search} onChange={handleSearch} />
      </div>

      {loading ? <LoadingSpinner message="Loading library..." /> : materials.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}><Book size={48} /></div>
            <p>{search ? 'No materials match your search.' : 'Your library is empty.'}</p>
            <Link to="/upload" className="btn btn-primary" style={{ marginTop: '1rem' }}>Upload Material</Link>
          </div>
        </div>
      ) : (
        <div className="material-list">
          {materials.map((m) => (
            <div key={m.id} className="material-item">
              <div className="material-item-info">
                <h4>{m.title}</h4>
                <span>
                  <span className={`source-badge source-${m.source_type}`}>{m.source_type}</span>
                  {' '}{m.word_count} words · {new Date(m.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="material-item-actions">
                <Link to="/summary" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>Summary</Link>
                <Link to="/quiz" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>Quiz</Link>
                <button className="btn btn-ghost" onClick={() => triggerDelete(m.id, m.title)} title="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, title: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Material?"
        message={`Are you sure you want to delete "${deleteModal.title}"? This will also remove all associated summaries, flashcards, and quizzes.`}
      />
    </div>
  );
}
