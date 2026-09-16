# Deploy StudyAI on Render & Vercel

This guide covers deploying the **StudyAI** backend to Render and frontend to Vercel/Netlify/Render.

---

## 🚀 1. Deploy Backend on Render

### Option A: Blueprint Deploy (Fastest)

1. Push your repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your `StudyAI` repository and select `render.yaml`.
5. Under Environment Variables:
   - `GROQ_API_KEY`: Provide your Groq key from [console.groq.com](https://console.groq.com)
   - `CORS_ORIGINS`: `*` (or your frontend deployment domain, e.g., `https://your-studyai.vercel.app`)
6. Click **Apply**.
7. Once deployed, verify: `https://your-service.onrender.com/api/health` returns `{"status": "healthy"}`.

### Option B: Manual Web Service Deploy

1. Click **New +** → **Web Service** → Connect your repo.
2. Configuration:
   - **Name:** `studyai-backend`
   - **Root Directory:** `studyai/backend` (or `backend` if repo root is `studyai`)
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120`
   - **Health Check Path:** `/api/health`
3. Environment Variables:
   | Key | Value |
   |-----|-------|
   | `PYTHON_VERSION` | `3.12.3` |
   | `FLASK_DEBUG` | `false` |
   | `FLASK_SECRET_KEY` | *(Generate a random 32-char string)* |
   | `GROQ_API_KEY` | *(Your Groq API Key)* |
   | `GROQ_MODEL` | `llama-3.3-70b-versatile` |
   | `CORS_ORIGINS` | `*` |
   | `SUPABASE_URL` | *(Optional for Cloud Persistence)* |
   | `SUPABASE_KEY` | *(Optional Supabase anon key)* |

---

## 🌐 2. Deploy Frontend on Vercel / Netlify

1. Go to [Vercel](https://vercel.com) → **Add New Project** → Import your GitHub repository.
2. Settings:
   - **Root Directory:** `studyai/frontend` (or `frontend`)
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Environment Variables:
   - `VITE_API_URL` = `https://your-studyai-backend.onrender.com/api`
4. Click **Deploy**.

---

## 🔄 3. Production Health Check

Test the live deployment from terminal or browser:
```bash
curl https://your-studyai-backend.onrender.com/api/health
```

Expected Response:
```json
{
  "ai_mode": "groq",
  "model": "llama-3.3-70b-versatile",
  "service": "StudyAI Backend",
  "status": "healthy",
  "storage_mode": "supabase"
}
```
