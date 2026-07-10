import { useState } from 'react';
import {
  Book, Folder, FileText, Layers, Lightbulb, Calendar, MessageSquare, Target,
  Trophy, Crown, Star, CheckCircle, Flame, Dumbbell, Zap, BrainCircuit, Activity,
  Timer, Flag, CheckSquare
} from 'lucide-react';
import Select from './Select';

const ICON_MAP = {
  first_upload: <Book size={36} color="#60a5fa" />,
  library_keeper: <Folder size={36} color="#fbbf24" />,
  first_summary: <FileText size={36} color="#a78bfa" />,
  flashcard_user: <Layers size={36} color="#f472b6" />,
  insight_seeker: <Lightbulb size={36} color="#facc15" />,
  schedule_planner: <Calendar size={36} color="#38bdf8" />,
  tutor_chat: <MessageSquare size={36} color="#a78bfa" />,
  first_quiz: <Target size={36} color="#f43f5e" />,
  quiz_master: <Trophy size={36} color="#fbbf24" />,
  quiz_legend: <Crown size={36} color="#f59e0b" />,
  high_scorer: <Star size={36} color="#fcd34d" />,
  perfect_score: <CheckCircle size={36} color="#34d399" />,
  streak_3: <Flame size={36} color="#f97316" />,
  streak_7: <Dumbbell size={36} color="#8b5cf6" />,
  streak_14: <Zap size={36} color="#eab308" />,
  focus_hour: <BrainCircuit size={36} color="#10b981" />,
  focus_marathon: <Activity size={36} color="#059669" />,
  pomodoro_starter: <Timer size={36} color="#a78bfa" />,
  goal_setter: <Flag size={36} color="#fb7185" />,
  goal_crusher: <CheckSquare size={36} color="#4ade80" />,
};

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
          <div style={{ minWidth: '150px' }}>
            <Select 
              value={category} 
              onChange={setCategory}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(c => ({ value: c, label: c }))
              ]}
            />
          </div>
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
              <div className="achievement-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '0.5rem' }}>
                {ICON_MAP[a.id] || a.icon}
              </div>
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
