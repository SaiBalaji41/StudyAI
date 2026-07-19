import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { BackendProvider } from './context/BackendContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Upload from './pages/Upload';
import Summary from './pages/Summary';
import Insights from './pages/Insights';
import Flashcards from './pages/Flashcards';
import Quiz from './pages/Quiz';
import Tutor from './pages/Tutor';
import Schedule from './pages/Schedule';
import Focus from './pages/Focus';
import Analytics from './pages/Analytics';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';

export default function App() {
  return (
    <ThemeProvider>
      <BackendProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="library" element={<Library />} />
                  <Route path="upload" element={<Upload />} />
                  <Route path="summary" element={<Summary />} />
                  <Route path="insights" element={<Insights />} />
                  <Route path="flashcards" element={<Flashcards />} />
                  <Route path="quiz" element={<Quiz />} />
                  <Route path="tutor" element={<Tutor />} />
                  <Route path="schedule" element={<Schedule />} />
                  <Route path="focus" element={<Focus />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="achievements" element={<Achievements />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </BackendProvider>
    </ThemeProvider>
  );
}
