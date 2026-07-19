import { createContext, useContext, useEffect, useState } from 'react';
import { authLogin, authSignup, authLogout, getMe } from '../services/api';
import { useToast } from './ToastContext';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('studyai_token');
      if (token) {
        try {
          const { data } = await getMe();
          setUser(data.user);
        } catch (error) {
          localStorage.removeItem('studyai_token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const { data } = await authLogin({ identifier, password });
      localStorage.setItem('studyai_token', data.token);
      setUser(data.user);
      addToast('success', 'Logged in successfully');
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || 'Login failed';
      addToast('error', msg);
      return { success: false, error: msg };
    }
  };

  const signup = async (userData) => {
    try {
      await authSignup(userData);
      // Removed auto-login logic to redirect to login page instead
      addToast('success', 'Account created! Please log in.');
      navigate('/login');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || 'Signup failed';
      addToast('error', msg);
      return { success: false, error: msg };
    }
  };

  const updateProfile = (updatedUser) => {
    setUser(updatedUser);
  };

  const logout = async () => {
    try {
      await authLogout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('studyai_token');
      setUser(null);
      navigate('/login');
      addToast('info', 'Logged out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
