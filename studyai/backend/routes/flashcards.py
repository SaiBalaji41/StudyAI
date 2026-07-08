from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from services.ai_service import ai_service
from services.storage_service import storage_service

flashcards_bp = Blueprint("flashcards", __name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@flashcards_bp.route("/<material_id>", methods=["POST"])
def generate_flashcards(material_id: str):
    try:
        material = storage_service.get_material(material_id)
        if not material:
            return jsonify({"error": "Material not found"}), 404

        data = request.get_json(silent=True) or {}
        count = min(max(int(data.get("count", 10)), 5), 30)

        cards = ai_service.generate_flashcards(material["content"], count)
        deck = {
            "material_id": material_id,
            "material_title": material["title"],
            "cards": cards,
            "total_count": len(cards),
            "mastered_count": 0,
            "known_cards": [],
            "generated_at": _now_iso(),
        }

        storage_service.save_flashcards(material_id, deck)
        return jsonify({"deck": deck})

    except ValueError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Flashcard generation failed: {str(e)}"}), 500


@flashcards_bp.route("/<material_id>", methods=["GET"])
def get_flashcards(material_id: str):
    deck = storage_service.get_flashcards(material_id)
    if not deck:
        return jsonify({"error": "Flashcards not found. Generate a deck first."}), 404
    return jsonify({"deck": deck})


@flashcards_bp.route("/<material_id>/progress", methods=["PUT"])
def update_flashcard_progress(material_id: str):
    deck = storage_service.get_flashcards(material_id)
    if not deck:
        return jsonify({"error": "Flashcards not found"}), 404

    data = request.get_json(silent=True) or {}
    card_id = data.get("card_id")
    known = data.get("known", False)

    if not card_id:
        return jsonify({"error": "card_id is required"}), 400

    known_cards = set(deck.get("known_cards", []))
    if known:
        known_cards.add(card_id)
    else:
        known_cards.discard(card_id)

    deck["known_cards"] = list(known_cards)
    deck["mastered_count"] = len(known_cards)
    storage_service.save_flashcards(material_id, deck)

    return jsonify({"deck": deck})
