import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ArrowRight, Sparkles, Sun, Moon 
} from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const stats = [
    { value: '50k+', label: 'Active Students' },
    { value: '1.2M+', label: 'Materials Summarized' },
    { value: '98.4%', label: 'Score Improvement' },
    { value: '150k+', label: 'Flashcards Reviewed' }
  ];


  return (
    <div className="landing-container" style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      {/* Header */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--primary)', color: '#fff', padding: '0.5rem',
            borderRadius: '12px', display: 'flex', alignItems: 'center'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>StudyAI</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Study Platform</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button 
            onClick={toggleTheme}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text)', display: 'flex', alignItems: 'center'
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {user ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: '500' }}>Log In</Link>
              <Link to="/signup" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Get Started <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '6rem 2rem 4rem 2rem', textAlign: 'center', maxWidth: '1000px', margin: '0 auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem'
      }}>
        <div className="landing-badge" style={{
          background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary-light)',
          padding: '0.5rem 1rem', borderRadius: '100px', border: '1px solid rgba(124, 58, 237, 0.3)',
          fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'pulse 3s infinite'
        }}>
          <Sparkles size={16} /> Presenting StudyAI v2.0 Production Upgrade
        </div>

        <h1 style={{
          fontSize: '3.5rem', fontWeight: '800', lineHeight: 1.2,
          background: 'linear-gradient(135deg, var(--text) 30%, var(--primary-light) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          maxWidth: '850px'
        }}>
          Unlock the Full Power of AI in Your Everyday Studies
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '750px', lineHeight: 1.6 }}>
          Transform textbook chapters, notes, slide packets, images, web links, and YouTube videos into structured study summaries, interactive Anki flashcards, adaptive quizzes, and calendar study plans.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', borderRadius: '16px' }}>
              Go to Dashboard <ArrowRight size={18} />
            </Link>
          ) : (
              <Link to="/signup" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', borderRadius: '16px' }}>
                Start Free Trial <ArrowRight size={18} />
              </Link>
          )}
        </div>
      </section>

      {/* Stats Counter Section */}
      <section style={{
        padding: '3rem 2rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(5px)'
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', textAlign: 'center'
        }}>
          {stats.map((stat, i) => (
            <div key={i}>
              <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary-light)', marginBottom: '0.25rem' }}>{stat.value}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>




      {/* Footer */}
      <footer style={{
        padding: '3rem 2rem', borderTop: '1px solid var(--border)', textAlign: 'center',
        background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', fontSize: '0.9rem'
      }}>
        <p>© 2026 StudyAI Companion. Ultimate Production Upgrade Master Suite. All rights reserved.</p>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
      `}} />
    </div>
  );
}
