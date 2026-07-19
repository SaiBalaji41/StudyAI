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
        now_str = _now_iso()
        for card in cards:
            card["repetitions"] = 0
            card["ease"] = 2.5
            card["interval"] = 0
            card["next_review_date"] = now_str

        deck = {
            "material_id": material_id,
            "material_title": material["title"],
            "cards": cards,
            "total_count": len(cards),
            "mastered_count": 0,
            "known_cards": [],
            "generated_at": now_str,
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
    
    # Simple migration: make sure all cards have SM-2 attributes
    updated = False
    now_str = _now_iso()
    for card in deck.get("cards", []):
        if "ease" not in card:
            card["repetitions"] = 0
            card["ease"] = 2.5
            card["interval"] = 0
            card["next_review_date"] = now_str
            updated = True
    if updated:
        storage_service.save_flashcards(material_id, deck)
        
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
    
    # Sync standard known state with SM-2 logic
    for card in deck.get("cards", []):
        if card["id"] == card_id:
            if known:
                known_cards.add(card_id)
                card["repetitions"] = 1
                card["interval"] = 1
                card["next_review_date"] = _now_iso()
            else:
                known_cards.discard(card_id)
                card["repetitions"] = 0
                card["interval"] = 0
                card["next_review_date"] = _now_iso()

    deck["known_cards"] = list(known_cards)
    deck["mastered_count"] = len(known_cards)
    storage_service.save_flashcards(material_id, deck)

    return jsonify({"deck": deck})


def _calculate_sm2(rating: int, repetitions: int, ease: float, interval: int) -> tuple[int, float, int]:
    # SM-2 rating mapping: 1 -> Again (0), 2 -> Hard (2), 3 -> Good (4), 4 -> Easy (5)
    q = 0
    if rating == 1:
        q = 0
    elif rating == 2:
        q = 2
    elif rating == 3:
        q = 4
    elif rating == 4:
        q = 5

    if q >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = int(round(interval * ease))
        repetitions += 1
    else:
        repetitions = 0
        interval = 1

    ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if ease < 1.3:
        ease = 1.3

    return repetitions, ease, interval


@flashcards_bp.route("/<material_id>/review", methods=["PUT"])
def review_flashcard(material_id: str):
    deck = storage_service.get_flashcards(material_id)
    if not deck:
        return jsonify({"error": "Flashcards not found"}), 404

    data = request.get_json(silent=True) or {}
    card_id = data.get("card_id")
    rating = int(data.get("rating", 3)) # 1 to 4

    if not card_id or rating not in (1, 2, 3, 4):
        return jsonify({"error": "card_id and rating (1-4) are required"}), 400

    from datetime import timedelta
    found = False
    now_str = _now_iso()
    
    known_cards = set(deck.get("known_cards", []))

    for card in deck.get("cards", []):
        if card["id"] == card_id:
            found = True
            reps = card.get("repetitions", 0)
            ease = card.get("ease", 2.5)
            interval = card.get("interval", 0)

            new_reps, new_ease, new_interval = _calculate_sm2(rating, reps, ease, interval)

            card["repetitions"] = new_reps
            card["ease"] = new_ease
            card["interval"] = new_interval
            
            # Compute next review date
            next_date = datetime.now(timezone.utc) + timedelta(days=new_interval)
            card["next_review_date"] = next_date.isoformat()

            if rating >= 3:
                known_cards.add(card_id)
            else:
                known_cards.discard(card_id)
            break

    if not found:
        return jsonify({"error": "Card not found inside deck"}), 404

    deck["known_cards"] = list(known_cards)
    deck["mastered_count"] = len(known_cards)
    storage_service.save_flashcards(material_id, deck)
    
    # Record XP for study action
    storage_service.record_study_activity()

    return jsonify({"deck": deck})
