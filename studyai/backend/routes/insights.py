from datetime import datetime, timezone

from flask import Blueprint, jsonify

from services.ai_service import ai_service
from services.storage_service import storage_service

insights_bp = Blueprint("insights", __name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@insights_bp.route("/<material_id>", methods=["POST"])
def generate_insights(material_id: str):
    try:
        material = storage_service.get_material(material_id)
        if not material:
            return jsonify({"error": "Material not found"}), 404

        existing = storage_service.get_insights(material_id)
        if existing:
            return jsonify({"insights": existing, "cached": True})

        data = ai_service.generate_insights(material["content"], material["title"])
        insights = {
            "material_id": material_id,
            "material_title": material["title"],
            **data,
            "generated_at": _now_iso(),
        }
        storage_service.save_insights(material_id, insights)
        storage_service.record_study_activity()
        return jsonify({"insights": insights, "cached": False})

    except ValueError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Insights generation failed: {str(e)}"}), 500


@insights_bp.route("/<material_id>", methods=["GET"])
def get_insights(material_id: str):
    insights = storage_service.get_insights(material_id)
    if not insights:
        return jsonify({"insights": None}), 200
    return jsonify({"insights": insights})


@insights_bp.route("/<material_id>/practice", methods=["POST"])
def generate_practice(material_id: str):
    try:
        material = storage_service.get_material(material_id)
        if not material:
            return jsonify({"error": "Material not found"}), 404

        quiz_results = storage_service.get_quiz_results(material_id)
        weak_topics = []
        for result in quiz_results:
            for wt in result.get("weak_topics", []):
                topic = wt.get("topic", "")
                if topic and topic not in weak_topics:
                    weak_topics.append(topic)

        questions = ai_service.generate_practice_for_weak_topics(
            material["content"], weak_topics, count=5
        )
        return jsonify({"questions": questions, "weak_topics": weak_topics})

    except ValueError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Practice generation failed: {str(e)}"}), 500
