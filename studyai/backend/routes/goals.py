import uuid
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from services.storage_service import storage_service

goals_bp = Blueprint("goals", __name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@goals_bp.route("/", methods=["GET"])
def list_goals():
    return jsonify({"goals": storage_service.get_goals()})


@goals_bp.route("/", methods=["POST"])
def create_goal():
    data = request.get_json(silent=True) or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    goal = {
        "id": str(uuid.uuid4()),
        "title": title,
        "description": data.get("description", ""),
        "target": data.get("target", 1),
        "progress": 0,
        "unit": data.get("unit", "tasks"),
        "deadline": data.get("deadline", ""),
        "completed": False,
        "created_at": _now_iso(),
    }
    storage_service.save_goal(goal)
    return jsonify({"goal": goal}), 201


@goals_bp.route("/<goal_id>", methods=["PUT"])
def update_goal(goal_id: str):
    data = request.get_json(silent=True) or {}
    goal = storage_service.update_goal(goal_id, data)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    return jsonify({"goal": goal})


@goals_bp.route("/pomodoro", methods=["POST"])
def record_pomodoro():
    data = request.get_json(silent=True) or {}
    session = {
        "id": str(uuid.uuid4()),
        "duration_minutes": data.get("duration_minutes", 25),
        "type": data.get("type", "focus"),
        "completed_at": _now_iso(),
    }
    storage_service.save_pomodoro_session(session)
    storage_service.record_study_activity()
    return jsonify({"session": session})


@goals_bp.route("/pomodoro", methods=["GET"])
def get_pomodoro_sessions():
    return jsonify({"sessions": storage_service.get_pomodoro_sessions()})


@goals_bp.route("/streak", methods=["GET"])
def get_streak():
    data = storage_service.get_analytics()
    streak = data.get("analytics", {}).get("streak", {"current": 0, "longest": 0, "last_study_date": ""})
    sessions = storage_service.get_pomodoro_sessions()
    focus_minutes = sum(
        s.get("duration_minutes", 0) for s in sessions if s.get("type", "focus") == "focus"
    )
    return jsonify({"streak": streak, "total_focus_minutes": focus_minutes})
