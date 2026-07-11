import json
import uuid
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, Response

from services.ai_service import ai_service
from services.storage_service import storage_service

schedule_bp = Blueprint("schedule", __name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@schedule_bp.route("/generate/<material_id>", methods=["POST"])
def generate_schedule(material_id: str):
    try:
        material = storage_service.get_material(material_id)
        if not material:
            return jsonify({"error": "Material not found"}), 404

        quiz_results = storage_service.get_quiz_results(material_id)
        weak_topics = []
        for result in quiz_results:
            weak_topics.extend(result.get("weak_topics", []))

        seen = set()
        unique_weak = []
        for wt in weak_topics:
            topic = wt.get("topic", "")
            if topic and topic not in seen:
                seen.add(topic)
                unique_weak.append(wt)

        schedule_data = ai_service.generate_schedule(
            material["content"], unique_weak, material["title"]
        )

        schedule_id = str(uuid.uuid4())
        schedule = {
            "id": schedule_id,
            "material_id": material_id,
            "material_title": material["title"],
            "title": schedule_data.get("title", f"7-Day Plan: {material['title']}"),
            "overview": schedule_data.get("overview", ""),
            "days": schedule_data.get("days", []),
            "weak_topics_used": unique_weak,
            "created_at": _now_iso(),
        }

        storage_service.save_schedule(schedule_id, schedule)
        return jsonify({"schedule": schedule})

    except ValueError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Schedule generation failed: {str(e)}"}), 500


@schedule_bp.route("/", methods=["GET"])
def list_schedules():
    schedules = storage_service.list_schedules()
    return jsonify({"schedules": schedules})


@schedule_bp.route("/<schedule_id>", methods=["GET"])
def get_schedule(schedule_id: str):
    schedule = storage_service.get_schedule(schedule_id)
    if not schedule:
        return jsonify({"schedule": None}), 200
    return jsonify({"schedule": schedule})


@schedule_bp.route("/<schedule_id>/task", methods=["PUT"])
def update_task(schedule_id: str):
    data = request.get_json(silent=True) or {}
    day_index = data.get("day_index")
    task_index = data.get("task_index")
    completed = data.get("completed", False)

    if day_index is None or task_index is None:
        return jsonify({"error": "day_index and task_index are required"}), 400

    schedule = storage_service.update_schedule_task(
        schedule_id, int(day_index), int(task_index), bool(completed)
    )
    if not schedule:
        return jsonify({"error": "Schedule or task not found"}), 404

    return jsonify({"schedule": schedule})


@schedule_bp.route("/<schedule_id>/export", methods=["GET"])
def export_schedule(schedule_id: str):
    schedule = storage_service.get_schedule(schedule_id)
    if not schedule:
        return jsonify({"error": "Schedule not found"}), 404

    return Response(
        json.dumps(schedule, indent=2),
        mimetype="application/json",
        headers={"Content-Disposition": f"attachment; filename=schedule_{schedule_id}.json"},
    )
