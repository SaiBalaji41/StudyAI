import { useEffect, useState } from 'react';
import {
  exportSchedule,
  generateSchedule,
  getMaterials,
  getSchedules,
  updateScheduleTask,
} from '../services/api';
import MaterialSelector from '../components/MaterialSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHero from '../components/PageHero';
import { Lightbulb } from 'lucide-react';

export default function Schedule() {
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMaterials().then((res) => setMaterials(res.data.materials)).catch(() => {});
    getSchedules().then((res) => setSchedules(res.data.schedules)).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      const res = await generateSchedule(selectedId);
      setSchedule(res.data.schedule);
      getSchedules().then((r) => setSchedules(r.data.schedules));
    } catch (err) {
      setError(err.response?.data?.error || 'Schedule generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (dayIndex, taskIndex, completed) => {
    if (!schedule) return;
    try {
      const res = await updateScheduleTask(schedule.id, dayIndex, taskIndex, completed);
      setSchedule(res.data.schedule);
    } catch {
      /* ignore */
    }
  };

  const handleExport = async () => {
    if (!schedule) return;
    try {
      const res = await exportSchedule(schedule.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule_${schedule.id}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Export failed');
    }
  };

  const handleExportICS = () => {
    if (!schedule) return;
    
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StudyAI//Study Planner//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ].join('\r\n') + '\r\n';

    const startDate = new Date(schedule.created_at || new Date());
    
    schedule.days?.forEach((day) => {
      const eventDate = new Date(startDate);
      eventDate.setDate(startDate.getDate() + (day.day - 1));
      
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const dateVal = String(eventDate.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${dateVal}`;
      
      const nextDay = new Date(eventDate);
      nextDay.setDate(eventDate.getDate() + 1);
      const nextYear = nextDay.getFullYear();
      const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
      const nextDateVal = String(nextDay.getDate()).padStart(2, '0');
      const nextDateStr = `${nextYear}${nextMonth}${nextDateVal}`;

      // Export tasks as all-day events
      day.tasks?.forEach((task, taskIdx) => {
        const uid = `task_${schedule.id}_${day.day}_${taskIdx}@studyai.com`;
        const summary = `[StudyAI] ${task.title}`;
        const description = `${task.description || ''}\\nPriority: ${task.priority || 'medium'}`;
        
        icsContent += [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${dateStr}T000000Z`,
          `DTSTART;VALUE=DATE:${dateStr}`,
          `DTEND;VALUE=DATE:${nextDateStr}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${description}`,
          'END:VEVENT'
        ].join('\r\n') + '\r\n';
      });

      // Export time slots as calendar events
      day.time_slots?.forEach((slot, slotIdx) => {
        const uid = `slot_${schedule.id}_${day.day}_${slotIdx}@studyai.com`;
        const summary = `[StudyAI Focus] ${slot.task}`;
        
        let startHour = 10;
        let startMin = 0;
        let endHour = 11;
        let endMin = 0;
        
        const timeMatch = slot.time?.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          startHour = parseInt(timeMatch[1], 10);
          startMin = parseInt(timeMatch[2], 10);
          endHour = startHour + 1;
        }
        
        const pad = (num) => String(num).padStart(2, '0');
        const startStr = `${dateStr}T${pad(startHour)}${pad(startMin)}00Z`;
        const endStr = `${dateStr}T${pad(endHour)}${pad(endMin)}00Z`;
        
        icsContent += [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${dateStr}T000000Z`,
          `DTSTART:${startStr}`,
          `DTEND:${endStr}`,
          `SUMMARY:${summary}`,
          'END:VEVENT'
        ].join('\r\n') + '\r\n';
      });
    });
    
    icsContent += 'END:VCALENDAR';
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_${schedule.id}.ics`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const loadSchedule = (s) => {
    setSchedule(s);
    setSelectedId(s.material_id);
  };

  const completedTasks = schedule?.days?.reduce(
    (acc, day) => acc + (day.tasks?.filter((t) => t.completed).length || 0),
    0
  ) || 0;
  const totalTasks = schedule?.days?.reduce(
    (acc, day) => acc + (day.tasks?.length || 0),
    0
  ) || 0;

  return (
    <div>
      <PageHero badge="Study Planner" title="7-Day Study Schedule" subtitle="AI-generated personalized study plans based on your materials and quiz performance." />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <MaterialSelector materials={materials} selectedId={selectedId} onChange={setSelectedId} />
        <button className="btn btn-primary" onClick={handleGenerate} disabled={!selectedId || loading}>
          {loading ? 'Generating...' : 'Generate 7-Day Schedule'}
        </button>
      </div>

      {schedules.length > 0 && !schedule && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Previous Schedules</h4>
          <div className="material-list">
            {schedules.map((s) => (
              <div key={s.id} className="material-item">
                <div className="material-item-info">
                  <h4>{s.title}</h4>
                  <span>{s.material_title} · {new Date(s.created_at).toLocaleDateString()}</span>
                </div>
                <button className="btn btn-secondary" onClick={() => loadSchedule(s)}>View</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <LoadingSpinner message="AI is building your study plan..." />}

      {schedule && !loading && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3>{schedule.title}</h3>
              {schedule.overview && <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{schedule.overview}</p>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={handleExport}>Export JSON</button>
              <button className="btn btn-primary" onClick={handleExportICS}>Export iCalendar (.ics)</button>
            </div>
          </div>

          {totalTasks > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Progress: {completedTasks}/{totalTasks} tasks</span>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${(completedTasks / totalTasks) * 100}%` }} />
              </div>
            </div>
          )}

          {schedule.weak_topics_used?.length > 0 && (
            <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
              <strong>Weak topics prioritized:</strong>{' '}
              {schedule.weak_topics_used.map((wt) => wt.topic).join(', ')}
            </div>
          )}

          {schedule.days?.map((day, dayIdx) => (
            <div key={dayIdx} className="schedule-day">
              <h3>{day.date_label || `Day ${day.day}`}</h3>
              {day.focus_topics?.length > 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Focus: {day.focus_topics.join(', ')}
                </p>
              )}

              {day.time_slots?.map((slot, i) => (
                <div key={i} style={{ fontSize: '0.85rem', padding: '0.4rem 0', color: 'var(--text-muted)' }}>
                  🕐 {slot.time} — {slot.task}
                </div>
              ))}

              {day.tasks?.map((task, taskIdx) => (
                <div key={taskIdx} className={`schedule-task ${task.completed ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={task.completed || false}
                    onChange={(e) => handleTaskToggle(dayIdx, taskIdx, e.target.checked)}
                  />
                  <div>
                    <div className="task-title" style={{ fontWeight: 600 }}>{task.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{task.description}</div>
                    <span className={`badge badge-${task.priority === 'high' ? 'hard' : task.priority === 'medium' ? 'medium' : 'easy'}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}

              {day.study_tip && (
                <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lightbulb size={16} /> Tip: {day.study_tip}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
