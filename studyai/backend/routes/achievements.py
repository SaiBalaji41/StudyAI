from flask import Blueprint, jsonify

from services.achievements import achievement_summary, compute_achievements
from services.storage_service import storage_service

achievements_bp = Blueprint("achievements", __name__)


@achievements_bp.route("/", methods=["GET"])
def get_achievements():
    data = storage_service.get_analytics()
    achievements = compute_achievements(data)
    summary = achievement_summary(achievements)
    return jsonify({
        "achievements": achievements,
        "summary": summary,
    })
