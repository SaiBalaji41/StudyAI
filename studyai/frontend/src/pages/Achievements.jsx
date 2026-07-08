import { useEffect, useState } from 'react';
import { getAchievements } from '../services/api';
import PageHero from '../components/PageHero';
import AchievementsPanel from '../components/AchievementsPanel';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Achievements() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAchievements()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load achievements'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading achievements..." />;

  return (
    <div>
      <PageHero
        badge="Gamification"
        title="Achievement Gallery"
        subtitle="Track every milestone on your learning journey. All achievements are listed below with progress toward unlocking."
      />

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <AchievementsPanel
          achievements={data?.achievements || []}
          summary={data?.summary}
        />
      </div>
    </div>
  );
}
