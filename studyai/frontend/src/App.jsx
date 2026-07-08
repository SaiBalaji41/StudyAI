import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { BackendProvider } from './context/BackendContext';
import Layout from './components/Layout';
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

export default function App() {
  return (
    <ThemeProvider>
      <BackendProvider>
        <ToastProvider>
          <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
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
          </Route>
        </Routes>
        </ToastProvider>
      </BackendProvider>
    </ThemeProvider>
  );
}
