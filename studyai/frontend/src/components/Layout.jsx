import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useBackend } from '../context/BackendContext';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, User } from 'lucide-react';
import {
  IconDashboard, IconUpload, IconBook, IconSummary, IconCards,
  IconQuiz, IconCalendar, IconChart, IconTutor, IconFocus,
  IconInsight, IconSun, IconMoon, IconMenu, IconSparkle, IconTrophy,
} from './Icons';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
  { path: '/library', label: 'Library', Icon: IconBook },
  { path: '/upload', label: 'Upload', Icon: IconUpload },
  { path: '/summary', label: 'Summary', Icon: IconSummary },
  { path: '/insights', label: 'Insights', Icon: IconInsight },
  { path: '/flashcards', label: 'Flashcards', Icon: IconCards },
  { path: '/quiz', label: 'Quiz', Icon: IconQuiz },
  { path: '/tutor', label: 'AI Tutor', Icon: IconTutor },
  { path: '/schedule', label: 'Schedule', Icon: IconCalendar },
  { path: '/focus', label: 'Focus Timer', Icon: IconFocus },
  { path: '/achievements', label: 'Achievements', Icon: IconTrophy },
  { path: '/analytics', label: 'Analytics', Icon: IconChart },
  { path: '/settings', label: 'Configuration', Icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { aiMode, storageMode } = useBackend();
  const { user, logout } = useAuth();
  const location = useLocation();



  return (
    <div className="app-layout">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon"><IconSparkle /></div>
          <div>
            <h1>StudyAI</h1>
            <p>Smart Study Companion</p>
          </div>
        </div>

        <nav>
          <ul className="nav-links">
            {navItems.map(({ path, label, Icon }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  end={path === '/dashboard'}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nav-icon"><Icon /></span>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="top-bar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <IconMenu />
          </button>
          <div className="top-bar-title">
            {navItems.find((n) => n.path === location.pathname)?.label || 'StudyAI'}
          </div>
          <div className="top-bar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
                  <User size={16} />
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.username}</span>
                </div>
                <button 
                  onClick={logout} 
                  title="Log out"
                  style={{ 
                    background: 'transparent', border: 'none', color: 'var(--danger)', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
