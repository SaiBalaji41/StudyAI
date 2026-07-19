from typing import Any


ACHIEVEMENT_DEFINITIONS = [
    {
        "id": "first_upload",
        "title": "First Steps",
        "icon": "📚",
        "description": "Upload your first study material",
        "category": "Getting Started",
        "target": 1,
        "metric": "materials_count",
    },
    {
        "id": "library_keeper",
        "title": "Library Keeper",
        "icon": "🗂️",
        "description": "Upload 3 or more study materials",
        "category": "Getting Started",
        "target": 3,
        "metric": "materials_count",
    },
    {
        "id": "first_summary",
        "title": "Summarizer",
        "icon": "📝",
        "description": "Generate your first AI summary",
        "category": "AI Tools",
        "target": 1,
        "metric": "summaries_count",
    },
    {
        "id": "flashcard_user",
        "title": "Card Shark",
        "icon": "🃏",
        "description": "Create your first flashcard deck",
        "category": "AI Tools",
        "target": 1,
        "metric": "flashcards_count",
    },
    {
        "id": "insight_seeker",
        "title": "Insight Seeker",
        "icon": "💡",
        "description": "Generate AI study insights",
        "category": "AI Tools",
        "target": 1,
        "metric": "insights_count",
    },
    {
        "id": "schedule_planner",
        "title": "Master Planner",
        "icon": "📅",
        "description": "Create a personalized study schedule",
        "category": "AI Tools",
        "target": 1,
        "metric": "schedules_count",
    },
    {
        "id": "tutor_chat",
        "title": "Curious Mind",
        "icon": "💬",
        "description": "Chat with the AI tutor",
        "category": "AI Tools",
        "target": 1,
        "metric": "tutor_messages",
    },
    {
        "id": "first_quiz",
        "title": "Quiz Taker",
        "icon": "🎯",
        "description": "Complete your first quiz",
        "category": "Quizzes",
        "target": 1,
        "metric": "quizzes_taken",
    },
    {
        "id": "quiz_master",
        "title": "Quiz Master",
        "icon": "🏆",
        "description": "Complete 5 quizzes",
        "category": "Quizzes",
        "target": 5,
        "metric": "quizzes_taken",
    },
    {
        "id": "quiz_legend",
        "title": "Quiz Legend",
        "icon": "👑",
        "description": "Complete 10 quizzes",
        "category": "Quizzes",
        "target": 10,
        "metric": "quizzes_taken",
    },
    {
        "id": "high_scorer",
        "title": "High Achiever",
        "icon": "⭐",
        "description": "Maintain 80%+ average quiz score (3+ quizzes)",
        "category": "Quizzes",
        "target": 80,
        "metric": "average_score",
        "requires_min_quizzes": 3,
    },
    {
        "id": "perfect_score",
        "title": "Perfect Score",
        "icon": "💯",
        "description": "Score 100% on any quiz",
        "category": "Quizzes",
        "target": 1,
        "metric": "perfect_quizzes",
    },
    {
        "id": "streak_3",
        "title": "On Fire",
        "icon": "🔥",
        "description": "Maintain a 3-day study streak",
        "category": "Habits",
        "target": 3,
        "metric": "study_streak",
    },
    {
        "id": "streak_7",
        "title": "Dedicated Learner",
        "icon": "💪",
        "description": "Maintain a 7-day study streak",
        "category": "Habits",
        "target": 7,
        "metric": "study_streak",
    },
    {
        "id": "streak_14",
        "title": "Unstoppable",
        "icon": "⚡",
        "description": "Maintain a 14-day study streak",
        "category": "Habits",
        "target": 14,
        "metric": "study_streak",
    },
    {
        "id": "focus_hour",
        "title": "Deep Focus",
        "icon": "🧘",
        "description": "Complete 60+ minutes of focused study",
        "category": "Focus",
        "target": 60,
        "metric": "focus_minutes",
    },
    {
        "id": "focus_marathon",
        "title": "Focus Marathon",
        "icon": "🏃",
        "description": "Complete 120+ minutes of focused study",
        "category": "Focus",
        "target": 120,
        "metric": "focus_minutes",
    },
    {
        "id": "pomodoro_starter",
        "title": "Pomodoro Starter",
        "icon": "⏱️",
        "description": "Complete your first focus session",
        "category": "Focus",
        "target": 1,
        "metric": "pomodoro_sessions",
    },
    {
        "id": "goal_setter",
        "title": "Goal Setter",
        "icon": "🎖️",
        "description": "Create your first study goal",
        "category": "Goals",
        "target": 1,
        "metric": "goals_count",
    },
    {
        "id": "goal_crusher",
        "title": "Goal Crusher",
        "icon": "✅",
        "description": "Complete a study goal",
        "category": "Goals",
        "target": 1,
        "metric": "goals_completed",
    },
]


def _count_tutor_messages(chat_sessions: dict) -> int:
    total = 0
    for session in chat_sessions.values():
        for msg in session.get("messages", []):
            if msg.get("role") == "user":
                total += 1
    return total


def build_metrics(data: dict[str, Any]) -> dict[str, Any]:
    analytics_data = data.get("analytics", {})
    quiz_results = data.get("quiz_results", [])
    chat_sessions = data.get("chat_sessions", {})
    streak = analytics_data.get("streak", {})
    pomodoro_sessions = analytics_data.get("pomodoro_sessions", [])
    goals = analytics_data.get("goals", [])

    avg_score = 0
    if quiz_results:
        avg_score = round(sum(r.get("percentage", 0) for r in quiz_results) / len(quiz_results), 1)

    perfect_quizzes = sum(1 for r in quiz_results if r.get("percentage", 0) >= 100)
    focus_minutes = sum(s.get("duration_minutes", 0) for s in pomodoro_sessions if s.get("type") == "focus")
    focus_sessions = sum(1 for s in pomodoro_sessions if s.get("type") == "focus")
    
    materials_count = data.get("materials_count", 0)
    summaries_count = data.get("summaries_count", 0)
    flashcards_count = data.get("flashcards_count", 0)
    schedules_count = data.get("schedules_count", 0)
    insights_count = data.get("insights_count", 0)
    tutor_messages = _count_tutor_messages(chat_sessions)
    goals_completed = sum(1 for g in goals if g.get("completed"))
    
    # Calculate XP
    xp = (materials_count * 50) + (summaries_count * 100) + (flashcards_count * 100) + \
         (schedules_count * 100) + (insights_count * 50) + (len(quiz_results) * 200) + \
         (focus_minutes * 10) + (tutor_messages * 10) + (goals_completed * 300)
    
    level = (xp // 1000) + 1

    return {
        "materials_count": materials_count,
        "summaries_count": summaries_count,
        "flashcards_count": flashcards_count,
        "schedules_count": schedules_count,
        "insights_count": insights_count,
        "quizzes_taken": len(quiz_results),
        "average_score": avg_score,
        "perfect_quizzes": perfect_quizzes,
        "study_streak": streak.get("current", 0),
        "longest_streak": streak.get("longest", 0),
        "focus_minutes": focus_minutes,
        "pomodoro_sessions": focus_sessions,
        "tutor_messages": tutor_messages,
        "goals_count": len(goals),
        "goals_completed": goals_completed,
        "xp": xp,
        "level": level,
    }


def compute_achievements(data: dict[str, Any]) -> list[dict[str, Any]]:
    metrics = build_metrics(data)
    results = []

    for defn in ACHIEVEMENT_DEFINITIONS:
        metric_key = defn["metric"]
        current = metrics.get(metric_key, 0)
        target = defn["target"]

        unlocked = current >= target

        if defn.get("requires_min_quizzes"):
            min_q = defn["requires_min_quizzes"]
            if metrics.get("quizzes_taken", 0) < min_q:
                unlocked = False
            progress = min(current, target) if metrics.get("quizzes_taken", 0) >= min_q else current
        else:
            progress = min(current, target)

        if target > 0:
            percentage = min(round((progress / target) * 100), 100)
        else:
            percentage = 100 if unlocked else 0

        results.append({
            "id": defn["id"],
            "title": defn["title"],
            "icon": defn["icon"],
            "description": defn["description"],
            "category": defn["category"],
            "unlocked": unlocked,
            "progress": progress,
            "target": target,
            "percentage": percentage,
            "metric_label": _metric_label(metric_key, progress, target),
        })

    return results


def _metric_label(metric: str, progress: int | float, target: int | float) -> str:
    labels = {
        "materials_count": "materials",
        "summaries_count": "summaries",
        "flashcards_count": "decks",
        "schedules_count": "schedules",
        "insights_count": "insights",
        "quizzes_taken": "quizzes",
        "average_score": "% avg score",
        "perfect_quizzes": "perfect scores",
        "study_streak": "days",
        "focus_minutes": "minutes",
        "pomodoro_sessions": "sessions",
        "tutor_messages": "messages",
        "goals_count": "goals",
        "goals_completed": "completed",
    }
    unit = labels.get(metric, "")
    if metric == "average_score":
        return f"{progress}/{target}{unit}"
    return f"{int(progress)}/{int(target)} {unit}".strip()


def achievement_summary(achievements: list[dict[str, Any]]) -> dict[str, Any]:
    unlocked = [a for a in achievements if a["unlocked"]]
    by_category: dict[str, list] = {}
    for a in achievements:
        by_category.setdefault(a["category"], []).append(a)

    return {
        "total": len(achievements),
        "unlocked_count": len(unlocked),
        "locked_count": len(achievements) - len(unlocked),
        "completion_percentage": round((len(unlocked) / len(achievements)) * 100) if achievements else 0,
        "by_category": {
            cat: {
                "total": len(items),
                "unlocked": sum(1 for i in items if i["unlocked"]),
            }
            for cat, items in by_category.items()
        },
    }
