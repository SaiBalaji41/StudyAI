import json
from datetime import datetime, timezone
from typing import Any

from config import LOCAL_DB_FILE

_db_cache: dict[str, Any] | None = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _default_db() -> dict[str, Any]:
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


def _deep_merge(base: dict, override: dict) -> dict:
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def _sanitize_db(data: dict[str, Any]) -> dict[str, Any]:
    defaults = _default_db()
    return _deep_merge(defaults, {k: v for k, v in data.items() if k in defaults})


def _load_db() -> dict[str, Any]:
    global _db_cache
    if _db_cache is not None:
        return _db_cache

    if LOCAL_DB_FILE.exists():
        with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
            stored = json.load(f)
        cleaned = _sanitize_db(stored)
        if cleaned != stored:
            _write_db(cleaned)
        _db_cache = cleaned
        return _db_cache

    _db_cache = _default_db()
    return _db_cache


def _write_db(data: dict[str, Any]) -> None:
    LOCAL_DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    clean = _sanitize_db(data)
    with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
        json.dump(clean, f, indent=2, ensure_ascii=False)


def _save_db(data: dict[str, Any]) -> None:
    global _db_cache
    clean = _sanitize_db(data)
    _db_cache = clean
    _write_db(clean)


def invalidate_cache() -> None:
    global _db_cache
    _db_cache = None


class LocalStorage:
    """JSON file fallback with in-memory cache for fast reads."""

    def save_material(self, material: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        db["materials"][material["id"]] = material
        _save_db(db)
        return material

    def get_material(self, material_id: str) -> dict[str, Any] | None:
        return _load_db()["materials"].get(material_id)

    def list_materials(self) -> list[dict[str, Any]]:
        materials = list(_load_db()["materials"].values())
        materials.sort(key=lambda m: m.get("created_at", ""), reverse=True)
        return materials

    def save_summary(self, material_id: str, summary: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        db["summaries"][material_id] = summary
        _save_db(db)
        return summary

    def get_summary(self, material_id: str) -> dict[str, Any] | None:
        return _load_db()["summaries"].get(material_id)

    def save_flashcards(self, material_id: str, deck: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        db["flashcards"][material_id] = deck
        _save_db(db)
        return deck

    def get_flashcards(self, material_id: str) -> dict[str, Any] | None:
        return _load_db()["flashcards"].get(material_id)

    def save_quiz(self, quiz_id: str, quiz: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        db["quizzes"][quiz_id] = quiz
        _save_db(db)
        return quiz

    def get_quiz(self, quiz_id: str) -> dict[str, Any] | None:
        return _load_db()["quizzes"].get(quiz_id)

    def save_quiz_result(self, result: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        db["quiz_results"].append(result)
        _save_db(db)
        return result

    def get_quiz_results(self, material_id: str | None = None) -> list[dict[str, Any]]:
        results = _load_db()["quiz_results"]
        if material_id:
            results = [r for r in results if r.get("material_id") == material_id]
        return sorted(results, key=lambda r: r.get("completed_at", ""), reverse=True)

    def save_schedule(self, schedule_id: str, schedule: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        db["schedules"][schedule_id] = schedule
        _save_db(db)
        return schedule

    def get_schedule(self, schedule_id: str) -> dict[str, Any] | None:
        return _load_db()["schedules"].get(schedule_id)

    def list_schedules(self) -> list[dict[str, Any]]:
        schedules = list(_load_db()["schedules"].values())
        schedules.sort(key=lambda s: s.get("created_at", ""), reverse=True)
        return schedules

    def update_schedule_task(self, schedule_id: str, day_index: int, task_index: int, completed: bool) -> dict[str, Any] | None:
        db = _load_db()
        schedule = db["schedules"].get(schedule_id)
        if not schedule:
            return None
        try:
            schedule["days"][day_index]["tasks"][task_index]["completed"] = completed
            db["schedules"][schedule_id] = schedule
            _save_db(db)
            return schedule
        except (IndexError, KeyError):
            return None

    def delete_material(self, material_id: str) -> bool:
        db = _load_db()
        if material_id not in db["materials"]:
            return False
        del db["materials"][material_id]
        db["summaries"].pop(material_id, None)
        db["flashcards"].pop(material_id, None)
        db["insights"].pop(material_id, None)
        db["chat_sessions"].pop(material_id, None)
        _save_db(db)
        return True

    def save_insights(self, material_id: str, insights: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        db.setdefault("insights", {})[material_id] = insights
        _save_db(db)
        return insights

    def get_insights(self, material_id: str) -> dict[str, Any] | None:
        return _load_db().get("insights", {}).get(material_id)

    def save_chat_session(self, material_id: str, session: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        db.setdefault("chat_sessions", {})[material_id] = session
        _save_db(db)
        return session

    def get_chat_session(self, material_id: str) -> dict[str, Any] | None:
        return _load_db().get("chat_sessions", {}).get(material_id)

    def record_study_activity(self) -> dict[str, Any]:
        from datetime import timedelta
        db = _load_db()
        analytics = db.setdefault("analytics", {})
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
        analytics = db.setdefault("analytics", {})
        sessions = analytics.setdefault("pomodoro_sessions", [])
        sessions.append(session)
        _save_db(db)
        return session

    def get_pomodoro_sessions(self) -> list[dict[str, Any]]:
        return _load_db().get("analytics", {}).get("pomodoro_sessions", [])

    def save_goal(self, goal: dict[str, Any]) -> dict[str, Any]:
        db = _load_db()
        analytics = db.setdefault("analytics", {})
        goals = analytics.setdefault("goals", [])
        goals.append(goal)
        _save_db(db)
        return goal

    def get_goals(self) -> list[dict[str, Any]]:
        return _load_db().get("analytics", {}).get("goals", [])

    def update_goal(self, goal_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        db = _load_db()
        goals = db.get("analytics", {}).get("goals", [])
        for i, g in enumerate(goals):
            if g.get("id") == goal_id:
                goals[i] = {**g, **updates}
                _save_db(db)
                return goals[i]
        return None

    def get_analytics(self) -> dict[str, Any]:
        db = _load_db()
        return {
            "quiz_results": db["quiz_results"],
            "materials_count": len(db["materials"]),
            "summaries_count": len(db["summaries"]),
            "flashcards_count": len(db["flashcards"]),
            "schedules_count": len(db["schedules"]),
            "analytics": db.get("analytics", {}),
            "insights_count": len(db.get("insights", {})),
            "chat_sessions": db.get("chat_sessions", {}),
        }


local_storage = LocalStorage()
