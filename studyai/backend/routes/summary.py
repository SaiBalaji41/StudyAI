from datetime import datetime, timezone

from flask import Blueprint, jsonify

from services.ai_service import ai_service
from services.storage_service import storage_service

summary_bp = Blueprint("summary", __name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@summary_bp.route("/<material_id>", methods=["POST"])
def generate_summary(material_id: str):
    try:
        material = storage_service.get_material(material_id)
        if not material:
            return jsonify({"error": "Material not found"}), 404

        existing = storage_service.get_summary(material_id)
        if existing:
            return jsonify({"summary": existing, "cached": True})

        summary_data = ai_service.generate_summary(material["content"], material["title"])
        summary = {
            "material_id": material_id,
            "material_title": material["title"],
            "title": summary_data.get("title", material["title"]),
            "overview": summary_data.get("overview", ""),
            "key_concepts": summary_data.get("key_concepts", []),
            "definitions": summary_data.get("definitions", []),
            "core_principles": summary_data.get("core_principles", []),
            "revision_notes": summary_data.get("revision_notes", []),
            "markdown": summary_data.get("markdown", ""),
            "generated_at": _now_iso(),
        }

        storage_service.save_summary(material_id, summary)
        return jsonify({"summary": summary, "cached": False})

    except ValueError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Summary generation failed: {str(e)}"}), 500


@summary_bp.route("/<material_id>", methods=["GET"])
def get_summary(material_id: str):
    summary = storage_service.get_summary(material_id)
    if not summary:
        return jsonify({"error": "Summary not found. Generate one first."}), 404
    return jsonify({"summary": summary})
