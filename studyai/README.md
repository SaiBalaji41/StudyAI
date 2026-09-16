# StudyAI — Next-Gen AI Study Companion & Learning Platform

StudyAI is a full-stack, AI-powered intelligent study platform that transforms lecture slides, textbook chapters, scanned notes, research papers, web articles, and YouTube video lectures into structured summaries, Anki-style spaced repetition flashcards, adaptive quizzes, and interactive calendar study schedules.

---

## 🚀 Key Features

### 📚 Universal Material Ingestion
- **Document & Slides Parsing** — PDF, Word (.docx), PowerPoint (.pptx), and Plain Text (.txt).
- **Multimodal OCR** — Upload pictures, diagrams, and scanned notes (.png, .jpg, .jpeg) for instant OCR text extraction.
- **Web Article Scraper** — Paste any web article or documentation link (e.g. Wikipedia, ArXiv) to extract clean learning content.
- **YouTube Video Transcript Parser** — Paste any YouTube lecture or tutorial link to extract spoken subtitles directly into notes.

### 🧠 Intelligent Study Engines
- **Smart Summary Generator** — High-yield markdown summaries with executive overviews, core concepts, definitions, and revision bullet points.
- **Anki-Style Flashcard System (SuperMemo SM-2)** — Spaced repetition flashcards with 3D card flips, Text-to-Speech (TTS) audio narration, keyboard shortcuts (`Space`, `1-4`, `←/→`, `S`), and due-date scheduling.
- **Adaptive Quiz Generator** — Multiple Choice (MCQ with multi-select support), True/False, and Short Answer questions with automated grading, instant explanations, and weak-topic diagnostics.
- **AI Tutor Companion** — Interactive chat assistant with context awareness of your specific material, notes highlighting, and annotations.
- **7-Day Study Planner** — Generates personalized daily study schedules with calendar export (.ics) and JSON download.
- **Learning Intelligence & Insights** — Exam tips, common pitfalls, memory mnemonics, study priorities, and targeted practice for identified weak topics.

### 📊 Gamification & Focus
- **XP Progression & Levels** — Earn experience points for studying, taking quizzes, reviewing flashcards, and completing goals.
- **Achievement Gallery** — 20 unlockable achievement badges celebrating learning milestones.
- **Pomodoro Focus Timer** — Configurable focus intervals (25/5/15 min) with session tracking.
- **Analytics & Heatmap** — Track scores over time, study streaks, weak topics breakdown, and daily study activity trends.

### 🔐 Security, Identity & Multi-Engine AI
- **Secure Authentication** — User registration, login with username/email, password encryption with PBKDF2/Werkzeug, and user data isolation.
- **Multi-Provider AI Engine** — Groq (Llama 3.3 70B), Google Gemini (1.5 Flash), OpenAI (GPT-4o mini), Anthropic Claude (3.5 Sonnet), DeepSeek, plus offline algorithmic fallback.
- **Dual Storage Support** — Cloud persistence with Supabase or offline local JSON caching.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, Chart.js, React Markdown, Lucide Icons, Vanilla CSS Design System |
| **Backend** | Python 3.12, Flask REST API, Gunicorn / Waitress |
| **AI Providers** | Groq, Google Generative AI, OpenAI, Anthropic, DeepSeek, Local AI Engine |
| **Document Processing** | PyPDF2, python-docx, python-pptx, BeautifulSoup4, youtube-transcript-api |
| **Database & Storage** | Supabase (PostgreSQL + Object Storage) + In-memory & Local JSON fallback |

---

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd studyai/backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

Configure your environment variables in `.env`:
```ini
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
FLASK_SECRET_KEY=studyai-dev-secret
FLASK_PORT=5000
FLASK_DEBUG=false

# Optional Supabase Cloud Storage
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

Run the backend server:
```bash
python app.py
```
Backend runs on `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

---

### 2. Frontend Setup

```bash
cd studyai/frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` (or `http://localhost:5173`).

To build for production:
```bash
npm run build
```

---

## 🚢 Deployment

### Backend (Render)
1. Use `render.yaml` or create a new Web Service on [Render](https://render.com).
2. Set Root Directory to `backend` (or `studyai/backend`).
3. Set Build Command to `pip install -r requirements.txt`.
4. Set Start Command to `gunicorn wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120`.
5. Set `GROQ_API_KEY` and other optional AI keys in the Render dashboard.

### Frontend (Vercel / Netlify / Render Static Site)
1. Connect the repository and set Root Directory to `studyai/frontend`.
2. Framework preset: **Vite**.
3. Build Command: `npm run build`, Output Directory: `dist`.
4. Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api`.

---

## 🧪 Testing

Run the automated backend test suite covering all endpoints and fallbacks:
```bash
cd studyai/backend
python test_all_endpoints.py
```

---

## 📄 License
Educational & open-source project for students and researchers.
