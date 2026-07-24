import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authUpdateProfile, authUpdatePassword, authDeleteAccount } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Loader2, Save, KeyRound, User, Mail, AtSign, Trash2, AlertTriangle, X, Brain, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    selected_model_provider: user?.selected_model_provider || 'groq',
    groq_api_key: user?.groq_api_key || '',
    openai_api_key: user?.openai_api_key || '',
    gemini_api_key: user?.gemini_api_key || '',
    claude_api_key: user?.claude_api_key || '',
    deepseek_api_key: user?.deepseek_api_key || '',
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { data } = await authUpdateProfile(profileData);
      updateProfile(data.user);
      addToast('success', 'Profile updated successfully');
    } catch (error) {
      addToast('error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      await authUpdatePassword(passwordData);
      addToast('success', 'Password updated successfully');
      setPasswordData({ current_password: '', new_password: '' });
    } catch (error) {
      addToast('error', error.response?.data?.error || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const confirmDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await authDeleteAccount();
      addToast('success', 'Account deleted successfully.');
      logout();
      navigate('/login');
    } catch (error) {
      addToast('error', error.response?.data?.error || 'Failed to delete account');
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) return null;

  return (
    <div className="settings-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>Configuration</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Profile Section */}
        <div className="card" style={{ padding: '2rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
            <User size={20} className="text-primary" /> Profile Details
          </h2>
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Full Name (Cannot be changed)</label>
              <div className="input-with-icon">
                <User size={18} />
                <input 
                  type="text" 
                  value={user.full_name} 
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address (Cannot be changed)</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input 
                  type="email" 
                  value={user.email} 
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Username</label>
              <div className="input-with-icon">
                <AtSign size={18} />
                <input 
                  type="text" 
                  value={profileData.username} 
                  onChange={e => setProfileData({...profileData, username: e.target.value})}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={profileLoading} style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
              {profileLoading ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              Save Profile
            </button>
          </form>
        </div>

        {/* AI Engine Settings */}
        <div className="card" style={{ padding: '2rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
            <Brain size={20} className="text-primary" /> AI Model & Key Configuration
          </h2>
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Default AI Provider</label>
              <select 
                value={profileData.selected_model_provider}
                onChange={e => setProfileData({...profileData, selected_model_provider: e.target.value})}
                style={{ 
                  width: '100%', padding: '0.75rem', 
                  background: 'var(--select-bg)', border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                  outline: 'none'
                }}
              >
                <option value="groq">Groq (Llama 3.3)</option>
                <option value="openai">OpenAI (GPT-4o / Mini)</option>
                <option value="gemini">Google Gemini (Gemini 2.5)</option>
                <option value="claude">Anthropic Claude (Claude 3.5)</option>
                <option value="deepseek">DeepSeek (deepseek-chat)</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Select the default provider for your study summaries, flashcards, quizzes, and chat tutor.
              </p>
            </div>

            {['groq', 'openai', 'gemini', 'claude', 'deepseek'].map((provider) => {
              const keyField = `${provider}_api_key`;
              const label = provider === 'groq' ? 'Groq' : provider === 'openai' ? 'OpenAI' : provider === 'gemini' ? 'Gemini' : provider === 'claude' ? 'Claude' : 'DeepSeek';
              const keyValue = profileData[keyField] || '';
              return (
                <div className="form-group" key={provider}>
                  <label>{label} API Key (Optional)</label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <KeyRound size={18} />
                    <input 
                      type={showApiKeys[provider] ? 'text' : 'password'} 
                      placeholder={`Enter custom ${label} API key`}
                      value={profileData[keyField]} 
                      onChange={e => setProfileData({...profileData, [keyField]: e.target.value})}
                      style={{ width: '100%', paddingRight: '2.75rem' }}
                    />
                    {keyValue.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowApiKeys({ ...showApiKeys, [provider]: !showApiKeys[provider] })}
                        style={{
                          position: 'absolute',
                          right: '1rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          zIndex: 10
                        }}
                      >
                        {showApiKeys[provider] ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button type="submit" className="btn btn-primary" disabled={profileLoading} style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
              {profileLoading ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              Save Configuration
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="card" style={{ padding: '2rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
            <KeyRound size={20} className="text-primary" /> Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Current Password</label>
              <div className="input-with-icon">
                <KeyRound size={18} />
                <input 
                  type={showCurrentPassword ? "text" : "password"} 
                  value={passwordData.current_password} 
                  onChange={e => setPasswordData({...passwordData, current_password: e.target.value})}
                  required
                  style={{ paddingRight: '2.75rem' }}
                />
                {passwordData.current_password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 10
                    }}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>New Password (Min 6 chars)</label>
              <div className="input-with-icon">
                <KeyRound size={18} />
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={passwordData.new_password} 
                  onChange={e => setPasswordData({...passwordData, new_password: e.target.value})}
                  required
                  minLength={6}
                  style={{ paddingRight: '2.75rem' }}
                />
                {passwordData.new_password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 10
                    }}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={passwordLoading} style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
              {passwordLoading ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              Update Password
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--danger)' }}>
            <AlertTriangle size={20} /> Danger Zone
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text)' }}>Delete Account</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px' }}>
                Once you delete your account, there is no going back. All your isolated data, study materials, and progress will be completely wiped out.
              </p>
            </div>
            <button onClick={() => setShowDeleteModal(true)} className="btn" style={{ background: 'var(--danger)', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={18} /> Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card" style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative',
            animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <button 
              onClick={() => setShowDeleteModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--danger)' }}>
                <AlertTriangle size={36} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Delete Account?</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                You are about to permanently delete your account. This action will completely erase all your files, progress, and study materials. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteModal(false)} 
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '16px' }}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button 
                  className="btn" 
                  onClick={confirmDeleteAccount} 
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '16px', background: 'var(--danger)', color: 'white', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? <Loader2 size={18} className="spin" /> : <Trash2 size={18} />}
                  Delete
                </button>
              </div>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          `}} />
        </div>
      )}
    </div>
  );
}
