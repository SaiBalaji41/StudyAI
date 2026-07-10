import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics, getMaterials } from '../services/api';
import { useBackend } from '../context/BackendContext';
import PageHero from '../components/PageHero';
import ProgressRing from '../components/ProgressRing';
import AchievementsPanel from '../components/AchievementsPanel';
import { SkeletonCard } from '../components/Skeleton';
import { 
  IconBook, IconQuiz, IconTrophy, IconFocus, IconUpload, IconSummary, 
  IconCards, IconTutor, IconInsight, IconSparkle 
} from '../components/Icons';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { connected, refresh } = useBackend();

  useEffect(() => {
    async function load() {
      try {
        const [analyticsRes, materialsRes] = await Promise.all([
          getAnalytics(), getMaterials(),
        ]);
        setAnalytics(analyticsRes.data);
        setMaterials(materialsRes.data.materials);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to connect to backend.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHero title="Dashboard" subtitle="Loading your study data..." />
        <div className="card-grid">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  const overview = analytics?.overview || {};

  return (
    <div>
      <PageHero
        badge="AI-Powered Learning"
        title="Welcome to StudyAI"
        subtitle="Transform your study materials into summaries, flashcards, quizzes, and personalized study plans."
      />

      {error && (
        <div className="alert alert-error">
          {error}
          {!connected && (
            <button className="btn btn-secondary" style={{ marginLeft: '1rem' }} onClick={refresh}>
              Retry
            </button>
          )}
        </div>
      )}

      {overview.study_streak > 0 && (
        <div className="streak-banner" style={{ marginBottom: '1.5rem' }}>
          <span className="streak-fire"><IconSparkle size={24} /></span>
          <div>
            <div className="streak-count">{overview.study_streak} Day Streak!</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Longest: {overview.longest_streak || 0} days · Keep it going!
            </div>
          </div>
        </div>
      )}

      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--primary)' }}><IconBook /></div>
          <div className="stat-value">{overview.materials_count || 0}</div>
          <div className="stat-label">Study Materials</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--secondary)' }}><IconQuiz /></div>
          <div className="stat-value">{overview.total_quizzes_taken || 0}</div>
          <div className="stat-label">Quizzes Taken</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--warning)' }}><IconTrophy /></div>
          <div className="stat-value">{overview.achievements_unlocked || 0}/{overview.achievements_total || 20}</div>
          <div className="stat-label">Achievements</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--success)' }}><IconFocus /></div>
          <div className="stat-value">{overview.total_focus_minutes || 0}m</div>
          <div className="stat-label">Focus Time</div>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/upload" className="quick-action"><span className="quick-action-icon" style={{ color: 'var(--primary)' }}><IconUpload /></span><span className="quick-action-label">Upload</span></Link>
            <Link to="/summary" className="quick-action"><span className="quick-action-icon" style={{ color: 'var(--secondary)' }}><IconSummary /></span><span className="quick-action-label">Summary</span></Link>
            <Link to="/flashcards" className="quick-action"><span className="quick-action-icon" style={{ color: 'var(--info)' }}><IconCards /></span><span className="quick-action-label">Flashcards</span></Link>
            <Link to="/quiz" className="quick-action"><span className="quick-action-icon" style={{ color: 'var(--danger)' }}><IconQuiz /></span><span className="quick-action-label">Quiz</span></Link>
            <Link to="/tutor" className="quick-action"><span className="quick-action-icon" style={{ color: 'var(--success)' }}><IconTutor /></span><span className="quick-action-label">AI Tutor</span></Link>
            <Link to="/focus" className="quick-action"><span className="quick-action-icon" style={{ color: 'var(--warning)' }}><IconFocus /></span><span className="quick-action-label">Focus</span></Link>
            <Link to="/insights" className="quick-action"><span className="quick-action-icon" style={{ color: 'var(--primary-dark)' }}><IconInsight /></span><span className="quick-action-label">Insights</span></Link>
            <Link to="/achievements" className="quick-action"><span className="quick-action-icon" style={{ color: '#fbbf24' }}><IconTrophy /></span><span className="quick-action-label">Achievements</span></Link>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <h3>Learning Progress</h3>
          <ProgressRing value={overview.average_score || 0} label="Avg Score" />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {overview.summaries_count || 0} summaries · {overview.flashcards_count || 0} decks · {overview.schedules_count || 0} plans
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <AchievementsPanel
          achievements={analytics?.achievements || []}
          summary={analytics?.achievement_summary}
          showFilters={false}
          limit={8}
        />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/achievements" className="btn btn-secondary">View All Achievements</Link>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Recent Materials</h3>
          <Link to="/library" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>View All</Link>
        </div>
        {materials.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}><IconBook size={48} /></div>
            <p>No study materials yet. Upload your first material!</p>
            <Link to="/upload" className="btn btn-primary" style={{ marginTop: '1rem' }}>Upload Now</Link>
          </div>
        ) : (
          <div className="material-list">
            {materials.slice(0, 5).map((m) => (
              <div key={m.id} className="material-item">
                <div className="material-item-info">
                  <h4>{m.title}</h4>
                  <span>
                    <span className={`source-badge source-${m.source_type}`}>{m.source_type}</span>
                    {' '}{m.word_count} words · {new Date(m.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
