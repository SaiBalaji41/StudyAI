import json
from datetime import datetime, timezone
from typing import Any

from config import LOCAL_DB_FILE

_db_cache: dict[str, Any] | None = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _default_user_data() -> dict[str, Any]:
    return {
        "materials": {},
        "summaries": {},
        "flashcards": {},
        "quizzes": {},
        "quiz_results": [],
        "schedules": {},
        "insights": {},
        "chat_sessions": {},
        "analytics": {
            "study_sessions": [],
            "completed_tasks": [],
            "pomodoro_sessions": [],
            "goals": [],
            "streak": {"current": 0, "longest": 0, "last_study_date": ""},
        },
    }


def _default_db() -> dict[str, Any]:
    return {
        "users": {},
        "sessions": {},
        "user_data": {}
    }


def _load_db() -> dict[str, Any]:
    global _db_cache
    if _db_cache is not None:
        return _db_cache

    if LOCAL_DB_FILE.exists():
        with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
            try:
                stored = json.load(f)
            except json.JSONDecodeError:
                stored = {}
        
        # Simple migration/initialization
        if "users" not in stored:
            stored["users"] = {}
        if "sessions" not in stored:
            stored["sessions"] = {}
        if "user_data" not in stored:
            stored["user_data"] = {}
            
        _db_cache = stored
        return _db_cache

    _db_cache = _default_db()
    return _db_cache


def _write_db(data: dict[str, Any]) -> None:
    LOCAL_DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _save_db(data: dict[str, Any]) -> None:
    global _db_cache
    _db_cache = data
    _write_db(data)


def invalidate_cache() -> None:
    global _db_cache
    _db_cache = None


def _get_current_user_id() -> str:
    try:
        from flask import has_app_context, g
        if has_app_context() and hasattr(g, 'user_id'):
            return g.user_id
    except ImportError:
        pass
    return "default_user"


def _get_user_db(db: dict[str, Any]) -> dict[str, Any]:
    user_id = _get_current_user_id()
    if user_id not in db["user_data"]:
        db["user_data"][user_id] = _default_user_data()
        _save_db(db)
    return db["user_data"][user_id]


class LocalStorage:
    """JSON file fallback with in-memory cache for fast reads. Now with user isolation."""

    def create_user(self, user: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        db["users"][user["id"]] = user
        _save_db(db)
        return user

    def update_user(self, user_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        db = _load_db()
        if user_id in db["users"]:
            db["users"][user_id].update(updates)
            _save_db(db)
            return db["users"][user_id]
        return None

    def delete_user(self, user_id: str) -> bool:
        db = _load_db()
        deleted = False
        
        # Remove from users table
        if user_id in db["users"]:
            del db["users"][user_id]
            deleted = True
            
        # Remove isolated user_data
        if user_id in db.get("user_data", {}):
            del db["user_data"][user_id]
            deleted = True
            
        # Remove all active sessions for this user
        sessions_to_remove = [token for token, session in db["sessions"].items() if session.get("user_id") == user_id]
        for token in sessions_to_remove:
            del db["sessions"][token]
            deleted = True
            
        if deleted:
            _save_db(db)
            
        return deleted

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        return _load_db()["users"].get(user_id)

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        for u in _load_db()["users"].values():
            if u.get("email") == email:
                return u
        return None

    def get_user_by_username(self, username: str) -> dict[str, Any] | None:
        username_lower = username.lower()
        for u in _load_db()["users"].values():
            if u.get("username", "").lower() == username_lower:
                return u
        return None

    def create_session(self, token: str, user_id: str) -> None:
        db = _load_db()
        db["sessions"][token] = {"user_id": user_id, "created_at": _now_iso()}
        _save_db(db)

    def get_session(self, token: str) -> str | None:
        session = _load_db()["sessions"].get(token)
        return session["user_id"] if session else None

    def delete_session(self, token: str) -> None:
        db = _load_db()
        if token in db["sessions"]:
            del db["sessions"][token]
            _save_db(db)

    def save_material(self, material: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        udb = _get_user_db(db)
        udb["materials"][material["id"]] = material
        _save_db(db)
        return material

    def get_material(self, material_id: str) -> dict[str, Any] | None:
        udb = _get_user_db(_load_db())
        return udb["materials"].get(material_id)

    def list_materials(self) -> list[dict[str, Any]]:
        udb = _get_user_db(_load_db())
        materials = list(udb["materials"].values())
        materials.sort(key=lambda m: m.get("created_at", ""), reverse=True)
        return materials

    def save_summary(self, material_id: str, summary: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        udb = _get_user_db(db)
        udb["summaries"][material_id] = summary
        _save_db(db)
        return summary

    def get_summary(self, material_id: str) -> dict[str, Any] | None:
        udb = _get_user_db(_load_db())
        return udb["summaries"].get(material_id)

    def save_flashcards(self, material_id: str, deck: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        udb = _get_user_db(db)
        udb["flashcards"][material_id] = deck
        _save_db(db)
        return deck

    def get_flashcards(self, material_id: str) -> dict[str, Any] | None:
        udb = _get_user_db(_load_db())
        return udb["flashcards"].get(material_id)

    def save_quiz(self, quiz_id: str, quiz: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        udb = _get_user_db(db)
        udb["quizzes"][quiz_id] = quiz
        _save_db(db)
        return quiz

    def get_quiz(self, quiz_id: str) -> dict[str, Any] | None:
        udb = _get_user_db(_load_db())
        return udb["quizzes"].get(quiz_id)

    def save_quiz_result(self, result: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        udb = _get_user_db(db)
        udb["quiz_results"].append(result)
        _save_db(db)
        return result

    def get_quiz_results(self, material_id: str | None = None) -> list[dict[str, Any]]:
        udb = _get_user_db(_load_db())
        results = udb["quiz_results"]
        if material_id:
            results = [r for r in results if r.get("material_id") == material_id]
        return sorted(results, key=lambda r: r.get("completed_at", ""), reverse=True)

    def save_schedule(self, schedule_id: str, schedule: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        udb = _get_user_db(db)
        udb["schedules"][schedule_id] = schedule
        _save_db(db)
        return schedule

    def get_schedule(self, schedule_id: str) -> dict[str, Any] | None:
        udb = _get_user_db(_load_db())
        return udb["schedules"].get(schedule_id)

    def list_schedules(self) -> list[dict[str, Any]]:
        udb = _get_user_db(_load_db())
        schedules = list(udb["schedules"].values())
        schedules.sort(key=lambda s: s.get("created_at", ""), reverse=True)
        return schedules

    def update_schedule_task(self, schedule_id: str, day_index: int, task_index: int, completed: bool) -> dict[str, Any] | None:
        db = _load_db()
        udb = _get_user_db(db)
        schedule = udb["schedules"].get(schedule_id)
        if not schedule:
            return None
        try:
            schedule["days"][day_index]["tasks"][task_index]["completed"] = completed
            udb["schedules"][schedule_id] = schedule
            _save_db(db)
            return schedule
        except (IndexError, KeyError):
            return None

    def delete_material(self, material_id: str) -> bool:
        db = _load_db()
        udb = _get_user_db(db)
        if material_id not in udb["materials"]:
            return False
        del udb["materials"][material_id]
        udb["summaries"].pop(material_id, None)
        udb["flashcards"].pop(material_id, None)
        udb["insights"].pop(material_id, None)
        udb["chat_sessions"].pop(material_id, None)
        _save_db(db)
        return True

    def save_insights(self, material_id: str, insights: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        udb = _get_user_db(db)
        udb.setdefault("insights", {})[material_id] = insights
        _save_db(db)
        return insights

    def get_insights(self, material_id: str) -> dict[str, Any] | None:
        udb = _get_user_db(_load_db())
        return udb.get("insights", {}).get(material_id)

    def save_chat_session(self, material_id: str, session: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        udb = _get_user_db(db)
        udb.setdefault("chat_sessions", {})[material_id] = session
        _save_db(db)
        return session

    def get_chat_session(self, material_id: str) -> dict[str, Any] | None:
        udb = _get_user_db(_load_db())
        return udb.get("chat_sessions", {}).get(material_id)

    def record_study_activity(self) -> dict[str, Any]:
        from datetime import timedelta
        db = _load_db()
        udb = _get_user_db(db)
        analytics = udb.setdefault("analytics", {})
        streak = analytics.setdefault("streak", {"current": 0, "longest": 0, "last_study_date": ""})
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        last = streak.get("last_study_date", "")
        if last == today:
            return streak
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
        if last == yesterday:
            streak["current"] = streak.get("current", 0) + 1
        else:
            streak["current"] = 1
        streak["longest"] = max(streak.get("longest", 0), streak["current"])
        streak["last_study_date"] = today
        _save_db(db)
        return streak

    def save_pomodoro_session(self, session: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        udb = _get_user_db(db)
        analytics = udb.setdefault("analytics", {})
        sessions = analytics.setdefault("pomodoro_sessions", [])
        sessions.append(session)
        _save_db(db)
        return session

    def get_pomodoro_sessions(self) -> list[dict[str, Any]]:
        udb = _get_user_db(_load_db())
        return udb.get("analytics", {}).get("pomodoro_sessions", [])

    def save_goal(self, goal: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        udb = _get_user_db(db)
        analytics = udb.setdefault("analytics", {})
        goals = analytics.setdefault("goals", [])
        goals.append(goal)
        _save_db(db)
        return goal

    def get_goals(self) -> list[dict[str, Any]]:
        udb = _get_user_db(_load_db())
        return udb.get("analytics", {}).get("goals", [])

    def update_goal(self, goal_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        db = _load_db()
        udb = _get_user_db(db)
        goals = udb.get("analytics", {}).get("goals", [])
        for i, g in enumerate(goals):
            if g.get("id") == goal_id:
                goals[i] = {**g, **updates}
                _save_db(db)
                return goals[i]
        return None

    def get_analytics(self) -> dict[str, Any]:
        udb = _get_user_db(_load_db())
        return {
            "quiz_results": udb["quiz_results"],
            "materials_count": len(udb["materials"]),
            "summaries_count": len(udb["summaries"]),
            "flashcards_count": len(udb["flashcards"]),
            "schedules_count": len(udb["schedules"]),
            "analytics": udb.get("analytics", {}),
            "insights_count": len(udb.get("insights", {})),
            "chat_sessions": udb.get("chat_sessions", {}),
        }

local_storage = LocalStorage()
