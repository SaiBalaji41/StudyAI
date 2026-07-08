import { useState, useEffect, useRef, useCallback } from 'react';
import { recordPomodoro } from '../services/api';
import { useToast } from '../context/ToastContext';

const PRESETS = [
  { label: 'Focus', minutes: 25, type: 'focus' },
  { label: 'Short Break', minutes: 5, type: 'break' },
  { label: 'Long Break', minutes: 15, type: 'break' },
];

export default function PomodoroTimer() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef(null);
  const { addToast } = useToast();

  const totalSeconds = preset.minutes * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const reset = useCallback((p) => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setSecondsLeft(p.minutes * 60);
  }, []);

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && running) {
      setRunning(false);
      clearInterval(intervalRef.current);
      if (preset.type === 'focus') {
        setSessionsCompleted((c) => c + 1);
        recordPomodoro({ duration_minutes: preset.minutes, type: 'focus' }).catch(() => {});
        addToast('Focus session complete! Take a break.', 'success');
      } else {
        addToast('Break over! Ready to focus?', 'info');
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [running, secondsLeft, preset, addToast]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="pomodoro-widget">
      <div className="pomodoro-presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`preset-btn ${preset.label === p.label ? 'active' : ''}`}
            onClick={() => { setPreset(p); reset(p); }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="pomodoro-ring">
        <svg viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" className="pomodoro-ring-bg" />
          <circle
            cx="100" cy="100" r="90"
            className="pomodoro-ring-fill"
            strokeDasharray={565.48}
            strokeDashoffset={565.48 - (progress / 100) * 565.48}
          />
        </svg>
        <div className="pomodoro-time">{formatTime(secondsLeft)}</div>
      </div>

      <div className="pomodoro-controls">
        <button className="btn btn-primary btn-lg" onClick={() => setRunning(!running)}>
          {running ? 'Pause' : secondsLeft < totalSeconds ? 'Resume' : 'Start'}
        </button>
        <button className="btn btn-secondary" onClick={() => reset(preset)}>Reset</button>
      </div>

      <p className="pomodoro-sessions">Sessions completed today: <strong>{sessionsCompleted}</strong></p>
    </div>
  );
}
