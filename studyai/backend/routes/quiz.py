import uuid
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from services.ai_service import ai_service
from services.storage_service import storage_service

quiz_bp = Blueprint("quiz", __name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@quiz_bp.route("/generate/<material_id>", methods=["POST"])
def generate_quiz(material_id: str):
    try:
        material = storage_service.get_material(material_id)
        if not material:
            return jsonify({"error": "Material not found"}), 404

        data = request.get_json(silent=True) or {}
        quiz_type = data.get("quiz_type", "mcq")
        num_questions = min(max(int(data.get("num_questions", 5)), 3), 20)
        adaptive = data.get("adaptive", False)

        if quiz_type not in ("mcq", "true_false", "short_answer"):
            return jsonify({"error": "Invalid quiz_type. Use: mcq, true_false, short_answer"}), 400

        weak_topics = []
        if adaptive:
            quiz_results = storage_service.get_quiz_results(material_id)
            for res in quiz_results:
                for wt in res.get("weak_topics", []):
                    topic = wt.get("topic")
                    if topic and topic not in weak_topics:
                        weak_topics.append(topic)

        questions = ai_service.generate_quiz(
            material["content"], quiz_type, num_questions, weak_topics=weak_topics if weak_topics else None
        )
        quiz_id = str(uuid.uuid4())

        quiz = {
            "id": quiz_id,
            "material_id": material_id,
            "material_title": material["title"],
            "quiz_type": quiz_type,
            "questions": questions,
            "num_questions": len(questions),
            "created_at": _now_iso(),
        }

        storage_service.save_quiz(quiz_id, quiz)
        safe_quiz = {**quiz, "questions": [{k: v for k, v in q.items() if k != "correct_answer"} for q in questions]}
        return jsonify({"quiz": safe_quiz})

    except ValueError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Quiz generation failed: {str(e)}"}), 500


@quiz_bp.route("/submit/<quiz_id>", methods=["POST"])
def submit_quiz(quiz_id: str):
    try:
        quiz = storage_service.get_quiz(quiz_id)
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404

        data = request.get_json(silent=True) or {}
        answers = data.get("answers", {})

        results = []
        correct_count = 0
        incorrect_questions = []

        for question in quiz["questions"]:
            qid = question["id"]
            user_answer = answers.get(qid, "").strip()
            correct_answer = question.get("correct_answer", "")
            q_type = question.get("type", quiz["quiz_type"])

            is_correct = False
            score = 0
            feedback = ""

            if q_type == "short_answer":
                if user_answer:
                    evaluation = ai_service.evaluate_short_answer(
                        question.get("question", ""), correct_answer, user_answer
                    )
                    is_correct = evaluation.get("is_correct", False)
                    score = evaluation.get("score", 0)
                    feedback = evaluation.get("feedback", "")
                    if score >= 70:
                        is_correct = True
            else:
                if q_type == "mcq":
                    user_options = {o.strip().lower() for o in user_answer.split(",")} if user_answer else set()
                    correct_options = {o.strip().lower() for o in correct_answer.split(",")} if correct_answer else set()
                    is_correct = user_options == correct_options and len(user_options) > 0
                else:
                    is_correct = user_answer.lower().strip() == correct_answer.lower().strip()
                score = 100 if is_correct else 0

            if is_correct:
                correct_count += 1
            else:
                incorrect_questions.append(question)

            results.append({
                "question_id": qid,
                "question": question.get("question", "Question text unavailable"),
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "score": score,
                "feedback": feedback,
                "explanation": question.get("explanation", ""),
                "topic": question.get("topic", "General"),
            })

        total = len(quiz["questions"])
        percentage = round((correct_count / total) * 100, 1) if total else 0
        weak_topics = ai_service.identify_weak_topics(incorrect_questions)

        quiz_result = {
            "id": str(uuid.uuid4()),
            "quiz_id": quiz_id,
            "material_id": quiz["material_id"],
            "material_title": quiz["material_title"],
            "quiz_type": quiz["quiz_type"],
            "score": correct_count,
            "total": total,
            "percentage": percentage,
            "results": results,
            "weak_topics": weak_topics,
            "completed_at": _now_iso(),
        }

        storage_service.save_quiz_result(quiz_result)
        return jsonify({"result": quiz_result})

    except ValueError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Quiz evaluation failed: {str(e)}"}), 500


@quiz_bp.route("/results", methods=["GET"])
def get_quiz_results():
    material_id = request.args.get("material_id")
    results = storage_service.get_quiz_results(material_id)
    return jsonify({"results": results})


@quiz_bp.route("/results/<result_id>", methods=["GET"])
def get_quiz_result(result_id: str):
    results = storage_service.get_quiz_results()
    result = next((r for r in results if r.get("id") == result_id), None)
    if not result:
        return jsonify({"error": "Result not found"}), 404
    return jsonify({"result": result})
