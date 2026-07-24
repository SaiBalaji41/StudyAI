import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, User, Mail, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import AnimatedAuthBackground from '../components/AnimatedAuthBackground';

export default function Signup() {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    confirm_password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.username || !formData.password) {
      setError('All fields are required');
      return;
    }
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    const result = await signup(formData);
    if (!result.success) {
      setError(result.error || 'Signup failed');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '460px', background: 'var(--bg-card)', padding: '2.5rem 2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h1>
            <p style={{ color: 'var(--text-muted)' }}>Start your learning journey today</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <UserPlus size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" name="full_name"
                    value={formData.full_name} onChange={handleChange}
                    placeholder="Full name" required
                    style={{ 
                      width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', 
                      background: 'var(--select-bg)', border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" name="username"
                    value={formData.username} onChange={handleChange}
                    placeholder="Username" required
                    style={{ 
                      width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', 
                      background: 'var(--select-bg)', border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" name="email"
                  value={formData.email} onChange={handleChange}
                  placeholder="Email address" required
                  style={{ 
                    width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', 
                    background: 'var(--select-bg)', border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type={showPassword ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="Password" required
                    style={{ 
                      width: '100%', padding: '0.75rem 2.75rem 0.75rem 2.75rem', 
                      background: 'var(--select-bg)', border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none'
                    }}
                  />
                  {formData.password.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} name="confirm_password"
                    value={formData.confirm_password} onChange={handleChange}
                    placeholder="Confirm" required
                    style={{ 
                      width: '100%', padding: '0.75rem 2.75rem 0.75rem 2.75rem', 
                      background: 'var(--select-bg)', border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none'
                    }}
                  />
                  {formData.confirm_password.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
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
            >
              {isSubmitting ? <Loader2 size={18} className="spin" /> : <><ArrowRight size={18} /> Create Account</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Sign in</Link>
          </p>
        </div>
      </div>

      <div 
        className="auth-image" 
        style={{ 
          flex: 1, 
          position: 'relative'
        }}
      >
        <AnimatedAuthBackground imageUrl="/signup-bg.png" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(0,0,0,0.1), var(--bg))', zIndex: 10 }} />
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
