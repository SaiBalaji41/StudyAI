# StudyAI — Smart AI Study Companion & Quiz Generator

StudyAI is a web-based, AI-powered study companion that helps students convert notes, textbooks, and study materials into structured, interactive learning content.

## Features

### Core
- **Material Upload** — PDF, DOCX, TXT, and pasted text with drag-and-drop
- **Material Library** — Search, browse, and delete study materials
- **AI Summary Generator** — Structured markdown summaries with key concepts, definitions, and revision notes
- **Flashcard Engine** — AI-generated flashcards with 3D flip, shuffle, and mastery tracking
- **Adaptive Quiz Generator** — MCQ, True/False, Short Answer with timer and auto-evaluation
- **Weak Topic Identification** — Performance-based topic analysis from quiz results
- **Personalized Study Schedule** — 7-day AI-generated study plans with task tracking
- **Learning Analytics Dashboard** — Charts, streaks, achievements, and progress tracking

### New Advanced Features
- **AI Tutor Chat** — Conversational AI tutor for your study materials
- **Study Insights** — Exam tips, mind maps, memory techniques, study priority analysis
- **Targeted Practice** — AI-generated practice questions for weak topics
- **Pomodoro Focus Timer** — 25/5/15 minute focus sessions with tracking
- **Study Goals** — Set and track personal study goals
- **Achievements System** — Unlock badges for study milestones
- **Study Streaks** — Daily streak tracking to build habits
- **Dark/Light Theme** — Toggle between themes
- **Toast Notifications** — Real-time feedback on actions
- **Responsive Mobile UI** — Collapsible sidebar with mobile navigation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, Chart.js, React Markdown |
| Backend | Python Flask (REST API) |
| Database | Firebase Firestore + local JSON fallback |
| File Storage | Firebase Storage |
| AI Engine | Groq API (Llama 3.3-70B Versatile) |

## Prerequisites

- Python 3.10+
- Node.js 18+
- Groq API key ([console.groq.com](https://console.groq.com))
- (Optional) Firebase project for cloud storage

## Setup

### 1. Backend

```bash
cd studyai/backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

Edit `.env` and set your `GROQ_API_KEY`:

```
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend:

```bash
python app.py
```

Backend runs at `http://localhost:5000`

### 2. Frontend

```bash
cd studyai/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

## Firebase (Optional)

To use Firebase instead of local JSON storage:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore and Storage
3. Download service account credentials as `firebase-credentials.json`
4. Place it in `backend/` and update `.env`:

```
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

Without Firebase, the app uses local JSON storage in `backend/data/local_db.json`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/materials/upload` | Upload study material |
| GET | `/api/materials/` | List materials |
| POST | `/api/summary/:id` | Generate summary |
| POST | `/api/flashcards/:id` | Generate flashcards |
| POST | `/api/quiz/generate/:id` | Generate quiz |
| POST | `/api/quiz/submit/:id` | Submit quiz answers |
| POST | `/api/schedule/generate/:id` | Generate study schedule |
| POST | `/api/tutor/chat/:id` | Chat with AI tutor |
| POST | `/api/insights/:id` | Generate study insights |
| POST | `/api/insights/:id/practice` | Generate weak-topic practice |
| GET | `/api/materials/search?q=` | Search materials |
| DELETE | `/api/materials/:id` | Delete material |
| GET/POST | `/api/goals/` | Study goals |
| POST | `/api/goals/pomodoro` | Record focus session |
| GET | `/api/analytics/` | Get analytics data |

## Project Structure

```
studyai/
├── backend/
│   ├── app.py              # Flask application entry point
│   ├── config.py           # Configuration
│   ├── requirements.txt    # Python dependencies
│   ├── routes/             # API route blueprints
│   ├── services/           # AI, storage, file processing
│   └── data/               # Local JSON fallback storage
├── frontend/
│   ├── src/
│   │   ├── pages/          # Dashboard, Upload, Summary, etc.
│   │   ├── components/     # Reusable UI components
│   │   └── services/       # API client
│   └── package.json
└── README.md
```

## License

College project — for educational purposes.
