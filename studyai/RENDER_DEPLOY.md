# Deploy StudyAI Backend on Render

## Quick deploy (recommended)

1. Push the `studyai` folder to GitHub.
2. Go to [render.com](https://render.com) → **New** → **Blueprint**.
3. Connect your repo and select the `render.yaml` file.
4. In the Render dashboard, set **Environment Variables**:
   - `GROQ_API_KEY` — your key from [console.groq.com](https://console.groq.com)
   - `CORS_ORIGINS` — your frontend URL(s), e.g. `https://your-app.onrender.com,http://localhost:3000`
5. Click **Apply** and wait for the deploy to finish.
6. Open `https://your-service.onrender.com/api/health` — you should see `"status": "healthy"`.

## Manual deploy (without Blueprint)

1. **New** → **Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory:** `backend` (or `studyai/backend` if repo root is `Vibe Coding`)
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120`
   - **Health Check Path:** `/api/health`
3. Add environment variables (see table below).
4. Deploy.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes (for Groq AI) | Groq API key. Without it, local AI fallback is used. |
| `FLASK_SECRET_KEY` | Yes | Random secret string (Render can auto-generate). |
| `CORS_ORIGINS` | Recommended | Comma-separated frontend URLs allowed to call the API. Use `*` for testing. |
| `GROQ_MODEL` | No | Default: `llama-3.3-70b-versatile` |
| `FLASK_DEBUG` | No | Keep `false` in production. |
| `PYTHON_VERSION` | No | e.g. `3.12.3` |

## Connect your frontend

After deploy, set the frontend API URL to your Render backend:

**`frontend/.env`**
```
VITE_API_URL=https://your-studyai-backend.onrender.com/api
```

Rebuild or restart the frontend:
```bash
cd studyai/frontend
npm run dev
```

For a hosted frontend (Vercel, Netlify, Render static site), set `VITE_API_URL` in that platform’s environment variables and redeploy.

## Important: data storage on Render

Render’s filesystem is **ephemeral** — uploaded materials and quiz data in `local_db.json` are **lost on redeploy or restart**.

For production persistence, use one of:

- **Firebase** (Firestore + Storage) — set `FIREBASE_CREDENTIALS_PATH` and upload credentials
- **Render Persistent Disk** — mount a disk at `backend/data` (paid plans)

For demos and testing, local JSON on Render works but data resets when the service restarts.

## Free tier notes

- Render free web services **spin down after ~15 minutes** of inactivity; the first request may take 30–60 seconds.
- Keep `gunicorn` timeout at **120** seconds for long AI requests.

## Verify deployment

```bash
curl https://your-studyai-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "StudyAI Backend",
  "storage_mode": "local_json",
  "ai_mode": "groq",
  "model": "llama-3.3-70b-versatile"
}
```
