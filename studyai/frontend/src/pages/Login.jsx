import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, User, Loader2 } from 'lucide-react';
import AnimatedAuthBackground from '../components/AnimatedAuthBackground';

export default function Login() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setIsSubmitting(true);
    await login(identifier, password);
    setIsSubmitting(false);
  };

  return (
    <div className="auth-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <div 
        className="auth-image" 
        style={{ 
          flex: 1, 
          position: 'relative'
        }}
      >
        <AnimatedAuthBackground imageUrl="/login-bg.png" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.1), var(--bg))', zIndex: 10 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-card)', padding: '3rem 2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
            <p style={{ color: 'var(--text-muted)' }}>Continue your learning journey</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Username or Email</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Enter username or email"
                  required
                  style={{ 
                    width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', 
                    background: 'var(--select-bg)', border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                    outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{ 
                    width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', 
                    background: 'var(--select-bg)', border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                    outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ 
                marginTop: '1rem', padding: '0.875rem', background: 'var(--primary)', 
                color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', 
                fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1,
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.target.style.background = 'var(--primary-dark)'}
              onMouseLeave={e => e.target.style.background = 'var(--primary)'}
            >
              {isSubmitting ? <Loader2 size={18} className="spin" /> : <><ArrowRight size={18} /> Sign In</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '600' }}>Sign up</Link>
          </p>
        </div>
      </div>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .auth-image { display: none !important; }
        }
        @media (min-width: 769px) {
          .auth-image { display: block !important; }
        }
      `}</style>
    </div>
  );
}
