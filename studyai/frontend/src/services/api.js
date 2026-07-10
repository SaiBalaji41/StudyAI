import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studyai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('studyai_token');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
            window.location.href = '/login';
        }
    }
    if (!error.response) {
      error.message = 'Cannot reach backend. Start the Flask server on port 5000.';
    }
    return Promise.reject(error);
  },
);

export const authSignup = (data) => api.post('/auth/signup', data);
export const authLogin = (data) => api.post('/auth/login', data);
export const authLogout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const authUpdateProfile = (data) => api.put('/auth/profile', data);
export const authUpdatePassword = (data) => api.put('/auth/password', data);
export const authDeleteAccount = () => api.delete('/auth/account');

export const checkBackendHealth = () => api.get('/health');

export const uploadMaterial = (formData) =>
  api.post('/materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMaterials = () => api.get('/materials/');
export const deleteMaterial = (id) => api.delete(`/materials/${id}`);
export const searchMaterials = (q) => api.get('/materials/search', { params: { q } });

export const generateSummary = (materialId) => api.post(`/summary/${materialId}`);
export const getSummary = (materialId) => api.get(`/summary/${materialId}`);

export const generateInsights = (materialId) => api.post(`/insights/${materialId}`);
export const getInsights = (materialId) => api.get(`/insights/${materialId}`);
export const generatePractice = (materialId) => api.post(`/insights/${materialId}/practice`);

export const generateFlashcards = (materialId, count = 10) =>
  api.post(`/flashcards/${materialId}`, { count });
export const getFlashcards = (materialId) => api.get(`/flashcards/${materialId}`);
export const updateFlashcardProgress = (materialId, cardId, known) =>
  api.put(`/flashcards/${materialId}/progress`, { card_id: cardId, known });

export const generateQuiz = (materialId, quizType, numQuestions) =>
  api.post(`/quiz/generate/${materialId}`, { quiz_type: quizType, num_questions: numQuestions });
export const submitQuiz = (quizId, answers) => api.post(`/quiz/submit/${quizId}`, { answers });
export const getQuizResults = (materialId) =>
  api.get('/quiz/results', { params: materialId ? { material_id: materialId } : {} });

export const generateSchedule = (materialId) => api.post(`/schedule/generate/${materialId}`);
export const getSchedules = () => api.get('/schedule/');
export const updateScheduleTask = (scheduleId, dayIndex, taskIndex, completed) =>
  api.put(`/schedule/${scheduleId}/task`, { day_index: dayIndex, task_index: taskIndex, completed });
export const exportSchedule = (scheduleId) =>
  api.get(`/schedule/${scheduleId}/export`, { responseType: 'blob' });

export const chatWithTutor = (materialId, message) =>
  api.post(`/tutor/chat/${materialId}`, { message });
export const getChatHistory = (materialId) => api.get(`/tutor/chat/${materialId}`);
export const clearChat = (materialId) => api.delete(`/tutor/chat/${materialId}`);

export const getGoals = () => api.get('/goals/');
export const createGoal = (data) => api.post('/goals/', data);
export const updateGoal = (goalId, data) => api.put(`/goals/${goalId}`, data);
export const recordPomodoro = (data) => api.post('/goals/pomodoro', data);
export const getFocusStats = () => api.get('/goals/streak');

export const getAnalytics = () => api.get('/analytics/');
export const getAchievements = () => api.get('/achievements/');
