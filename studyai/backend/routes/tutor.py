from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from services.ai_service import ai_service
from services.storage_service import storage_service

tutor_bp = Blueprint("tutor", __name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@tutor_bp.route("/chat/<material_id>", methods=["POST"])
def chat(material_id: str):
    try:
        material = storage_service.get_material(material_id)
        if not material:
            return jsonify({"error": "Material not found"}), 404

        data = request.get_json(silent=True) or {}
        message = data.get("message", "").strip()
        if not message:
            return jsonify({"error": "Message is required"}), 400

        session = storage_service.get_chat_session(material_id) or {
            "material_id": material_id,
            "messages": [],
            "created_at": _now_iso(),
        }

        reply = ai_service.chat_with_tutor(
            material["content"], material["title"], message, session["messages"]
        )

        session["messages"].append({"role": "user", "content": message, "timestamp": _now_iso()})
        session["messages"].append({"role": "assistant", "content": reply, "timestamp": _now_iso()})
        session["updated_at"] = _now_iso()
        storage_service.save_chat_session(material_id, session)
        storage_service.record_study_activity()

        return jsonify({"reply": reply, "session": session})

    except ValueError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Chat failed: {str(e)}"}), 500


@tutor_bp.route("/chat/<material_id>", methods=["GET"])
def get_chat_history(material_id: str):
    session = storage_service.get_chat_session(material_id)
    if not session:
        return jsonify({"messages": []})
    return jsonify({"messages": session.get("messages", [])})


@tutor_bp.route("/chat/<material_id>", methods=["DELETE"])
def clear_chat(material_id: str):
    storage_service.save_chat_session(material_id, {
        "material_id": material_id,
        "messages": [],
        "created_at": _now_iso(),
    })
    return jsonify({"message": "Chat history cleared"})
