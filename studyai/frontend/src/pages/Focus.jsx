import { useEffect, useState } from 'react';
import { getFocusStats, getGoals, createGoal, updateGoal } from '../services/api';
import PomodoroTimer from '../components/PomodoroTimer';
import PageHero from '../components/PageHero';
import { useToast } from '../context/ToastContext';

export default function Focus() {
  const [stats, setStats] = useState(null);
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    getFocusStats().then((res) => {
      setStats({
        study_streak: res.data.streak?.current || 0,
        total_focus_minutes: res.data.total_focus_minutes || 0,
      });
    }).catch(() => {});
    getGoals().then((res) => setGoals(res.data.goals)).catch(() => {});
  }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    try {
      const res = await createGoal({ title: newGoal, target: 5, unit: 'sessions' });
      setGoals((prev) => [...prev, res.data.goal]);
      setNewGoal('');
      addToast('Goal created!', 'success');
    } catch {
      addToast('Failed to create goal', 'error');
    }
  };

  const toggleGoal = async (goal) => {
    const completed = !goal.completed;
    try {
      await updateGoal(goal.id, { completed, progress: completed ? goal.target : goal.progress });
      setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, completed } : g));
    } catch { /* ignore */ }
  };

  return (
    <div>
      <PageHero badge="Focus Mode" title="Pomodoro Focus Timer" subtitle="Stay focused with timed study sessions. Build habits and track your progress." />

      <div className="two-col">
        <div className="card card-glow">
          <PomodoroTimer />
        </div>

        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Focus Stats</h3>
            <div className="card-grid" style={{ marginBottom: 0 }}>
              <div className="stat-card">
                <div className="stat-value">{stats?.total_focus_minutes || 0}m</div>
                <div className="stat-label">Total Focus Time</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats?.study_streak || 0}</div>
                <div className="stat-label">Day Streak</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Study Goals</h3>
            <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="e.g., Complete 5 quizzes this week"
                className="goal-input"
              />
              <button type="submit" className="btn btn-primary">Add</button>
            </form>
            {goals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No goals yet. Set one above!</p>
            ) : (
              goals.map((g) => (
                <div key={g.id} className="goal-item">
                  <input type="checkbox" checked={g.completed} onChange={() => toggleGoal(g)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, textDecoration: g.completed ? 'line-through' : 'none', opacity: g.completed ? 0.6 : 1 }}>
                      {g.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {g.progress || 0}/{g.target} {g.unit}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
