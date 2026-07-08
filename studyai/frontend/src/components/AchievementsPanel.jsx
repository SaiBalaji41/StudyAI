import { useState } from 'react';

export default function AchievementsPanel({ achievements = [], summary = null, showFilters = true, limit = 0 }) {
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');

  const categories = [...new Set(achievements.map((a) => a.category))];

  let filtered = achievements;
  if (filter === 'unlocked') filtered = achievements.filter((a) => a.unlocked);
  if (filter === 'locked') filtered = achievements.filter((a) => !a.unlocked);
  if (category !== 'all') filtered = filtered.filter((a) => a.category === category);
  if (limit > 0 && !showFilters) filtered = filtered.slice(0, limit);

  const unlockedCount = summary?.unlocked_count ?? achievements.filter((a) => a.unlocked).length;
  const totalCount = summary?.total ?? achievements.length;
  const completionPct = summary?.completion_percentage ?? (totalCount ? Math.round((unlockedCount / totalCount) * 100) : 0);

  return (
    <div className="achievements-panel">
      <div className="achievements-header">
        <div>
          <h3>Achievements</h3>
          <p className="achievements-subtitle">
            {unlockedCount} of {totalCount} unlocked · {completionPct}% complete
          </p>
        </div>
        <div className="achievements-progress-ring">
          <svg viewBox="0 0 80 80" width="72" height="72">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke="url(#achGradient)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={213.6}
              strokeDashoffset={213.6 - (completionPct / 100) * 213.6}
              transform="rotate(-90 40 40)"
            />
            <defs>
              <linearGradient id="achGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--secondary)" />
              </linearGradient>
            </defs>
            <text x="40" y="44" textAnchor="middle" fill="var(--text)" fontSize="14" fontWeight="700">
              {completionPct}%
            </text>
          </svg>
        </div>
      </div>

      {showFilters && (
        <div className="achievements-filters">
          <div className="filter-tabs">
            {['all', 'unlocked', 'locked'].map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'unlocked' ? 'Unlocked' : 'Locked'}
              </button>
            ))}
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="category-select">
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      <div className="achievements-grid">
        {filtered.map((a) => (
          <div
            key={a.id}
            className={`achievement-card ${a.unlocked ? 'unlocked' : 'locked'}`}
            title={a.description}
          >
            <div className="achievement-icon-wrap">
              <div className="achievement-icon">{a.icon}</div>
              {a.unlocked && <span className="achievement-check">✓</span>}
            </div>
            <div className="achievement-title">{a.title}</div>
            <div className="achievement-desc">{a.description}</div>
            <div className="achievement-category">{a.category}</div>
            {!a.unlocked && (
              <div className="achievement-progress-wrap">
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${a.percentage}%` }} />
                </div>
                <span className="achievement-progress-label">{a.metric_label}</span>
              </div>
            )}
            {a.unlocked && <span className="achievement-unlocked-badge">Unlocked!</span>}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <p>No achievements match this filter.</p>
        </div>
      )}
    </div>
  );
}
