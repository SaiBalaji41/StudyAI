from collections import defaultdict

from flask import Blueprint, jsonify

from services.achievements import achievement_summary, build_metrics, compute_achievements
from services.storage_service import storage_service

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/", methods=["GET"])
def get_analytics():
    data = storage_service.get_analytics()
    quiz_results = data.get("quiz_results", [])
    metrics = build_metrics(data)
    achievements = compute_achievements(data)
    ach_summary = achievement_summary(achievements)

    scores_over_time = []
    for result in sorted(quiz_results, key=lambda r: r.get("completed_at", "")):
        scores_over_time.append({
            "date": result.get("completed_at", "")[:10],
            "score": result.get("percentage", 0),
            "material": result.get("material_title", "Unknown"),
            "quiz_type": result.get("quiz_type", ""),
        })

    weak_topic_counts: dict[str, int] = defaultdict(int)
    for result in quiz_results:
        for wt in result.get("weak_topics", []):
            topic = wt.get("topic", "General")
            weak_topic_counts[topic] += wt.get("incorrect_count", 1)

    weak_topics_breakdown = [
        {"topic": topic, "count": count}
        for topic, count in sorted(weak_topic_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    quiz_type_counts: dict[str, int] = defaultdict(int)
    for result in quiz_results:
        quiz_type_counts[result.get("quiz_type", "unknown")] += 1

    analytics_data = data.get("analytics", {})
    streak = analytics_data.get("streak", {"current": 0, "longest": 0, "last_study_date": ""})
    goals = analytics_data.get("goals", [])

    return jsonify({
        "overview": {
            "materials_count": metrics["materials_count"],
            "summaries_count": metrics["summaries_count"],
            "flashcards_count": metrics["flashcards_count"],
            "schedules_count": metrics["schedules_count"],
            "insights_count": metrics.get("insights_count", 0),
            "total_quizzes_taken": metrics["quizzes_taken"],
            "average_score": metrics["average_score"],
            "study_streak": metrics["study_streak"],
            "longest_streak": metrics["longest_streak"],
            "total_focus_minutes": metrics["focus_minutes"],
            "goals_count": metrics["goals_count"],
            "goals_completed": metrics["goals_completed"],
            "tutor_messages": metrics["tutor_messages"],
            "achievements_unlocked": ach_summary["unlocked_count"],
            "achievements_total": ach_summary["total"],
        },
        "scores_over_time": scores_over_time,
        "weak_topics_breakdown": weak_topics_breakdown,
        "quiz_type_distribution": [
            {"type": k, "count": v} for k, v in quiz_type_counts.items()
        ],
        "recent_results": quiz_results[:10],
        "achievements": achievements,
        "achievement_summary": ach_summary,
        "goals": goals,
        "streak": streak,
        "storage_mode": storage_service.storage_mode,
    })
