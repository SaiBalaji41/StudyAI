import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { getAnalytics } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHero from '../components/PageHero';
import AchievementsPanel from '../components/AchievementsPanel';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8' } },
  },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#94a3b8' } },
  },
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnalytics()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  const overview = data?.overview || {};
  const scoresOverTime = data?.scores_over_time || [];
  const weakTopics = data?.weak_topics_breakdown || [];
  const quizTypes = data?.quiz_type_distribution || [];

  const lineData = {
    labels: scoresOverTime.map((s) => s.date),
    datasets: [{
      label: 'Quiz Score (%)',
      data: scoresOverTime.map((s) => s.score),
      borderColor: '#818cf8',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      tension: 0.3,
      fill: true,
    }],
  };

  const barData = {
    labels: weakTopics.map((w) => w.topic),
    datasets: [{
      label: 'Incorrect Answers',
      data: weakTopics.map((w) => w.count),
      backgroundColor: 'rgba(245, 158, 11, 0.7)',
      borderColor: '#f59e0b',
      borderWidth: 1,
    }],
  };

  const doughnutData = {
    labels: quizTypes.map((q) => q.type.replace('_', ' ').toUpperCase()),
    datasets: [{
      data: quizTypes.map((q) => q.count),
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
    }],
  };

  return (
    <div>
      <PageHero badge="Analytics" title="Learning Analytics" subtitle="Track performance trends, weak topics, achievements, and study habits." />

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-value">{overview.materials_count || 0}</div>
          <div className="stat-label">Materials</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overview.total_quizzes_taken || 0}</div>
          <div className="stat-label">Quizzes Taken</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overview.average_score || 0}%</div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overview.study_streak || 0}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overview.total_focus_minutes || 0}m</div>
          <div className="stat-label">Focus Time</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <AchievementsPanel
          achievements={data?.achievements || []}
          summary={data?.achievement_summary}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>Quiz Performance Over Time</h4>
          {scoresOverTime.length > 0 ? (
            <div className="chart-container">
              <Line data={lineData} options={chartOptions} />
            </div>
          ) : (
            <div className="empty-state"><p>Take some quizzes to see performance trends</p></div>
          )}
        </div>

        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>Weak Topics Breakdown</h4>
          {weakTopics.length > 0 ? (
            <div className="chart-container">
              <Bar data={barData} options={chartOptions} />
            </div>
          ) : (
            <div className="empty-state"><p>Complete quizzes to identify weak topics</p></div>
          )}
        </div>

        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>Quiz Type Distribution</h4>
          {quizTypes.length > 0 ? (
            <div className="chart-container">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          ) : (
            <div className="empty-state"><p>No quiz data yet</p></div>
          )}
        </div>
      </div>

      {data?.recent_results?.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Recent Quiz Results</h4>
          <div className="material-list">
            {data.recent_results.map((r) => (
              <div key={r.id} className="material-item">
                <div className="material-item-info">
                  <h4>{r.material_title}</h4>
                  <span>{r.quiz_type.replace('_', ' ').toUpperCase()} · {new Date(r.completed_at).toLocaleString()}</span>
                </div>
                <span className={`badge ${r.percentage >= 70 ? 'badge-easy' : r.percentage >= 40 ? 'badge-medium' : 'badge-hard'}`}>
                  {r.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
