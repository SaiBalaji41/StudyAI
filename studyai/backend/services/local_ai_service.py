import re
from typing import Any


def _sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s.strip() for s in parts if len(s.strip()) > 20]


def _chunks(text: str, size: int = 120) -> list[str]:
    words = text.split()
    chunks = []
    current = []
    length = 0
    for word in words:
        if length + len(word) > size and current:
            chunks.append(" ".join(current))
            current = [word]
            length = len(word)
        else:
            current.append(word)
            length += len(word) + 1
    if current:
        chunks.append(" ".join(current))
    return chunks


def _keywords(text: str, limit: int = 8) -> list[str]:
    words = re.findall(r"\b[A-Za-z]{5,}\b", text)
    freq: dict[str, int] = {}
    for w in words:
        low = w.lower()
        if low not in {"which", "their", "there", "about", "these", "those", "where", "while"}:
            freq[low] = freq.get(low, 0) + 1
    ranked = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [w.title() for w, _ in ranked[:limit]]


class LocalAIService:
    """Fast offline fallback when Groq API is unavailable."""

    def generate_summary(self, content: str, title: str) -> dict[str, Any]:
        sents = _sentences(content)
        overview = " ".join(sents[:3]) if sents else content[:500]
        concepts = _keywords(content, 6) or ["Core Topic", "Key Ideas", "Main Theme"]
        definitions = []
        for sent in sents[:4]:
            if ":" in sent:
                term, definition = sent.split(":", 1)
                definitions.append({"term": term.strip()[:60], "definition": definition.strip()[:200]})
            elif " is " in sent.lower():
                idx = sent.lower().index(" is ")
                definitions.append({"term": sent[:idx].strip()[:60], "definition": sent[idx + 4:].strip()[:200]})
        if not definitions and sents:
            definitions = [{"term": concepts[0], "definition": sents[0][:200]}]

        principles = [s[:120] for s in sents[1:5]] or [overview[:120]]
        revision = [f"Review: {c}" for c in concepts[:5]]
        md = "\n".join([
            f"# {title}",
            f"\n## Overview\n{overview}",
            "\n## Key Concepts",
            *[f"- {c}" for c in concepts],
            "\n## Important Definitions",
            *[f"**{d['term']}**: {d['definition']}" for d in definitions],
            "\n## Core Principles",
            *[f"- {p}" for p in principles],
            "\n## Revision Notes",
            *[f"- {n}" for n in revision],
        ])
        return {
            "title": title,
            "overview": overview,
            "key_concepts": concepts,
            "definitions": definitions[:6],
            "core_principles": principles,
            "revision_notes": revision,
            "markdown": md,
        }

    def generate_flashcards(self, content: str, count: int = 10) -> list[dict[str, Any]]:
        sents = _sentences(content) or _chunks(content, 100)
        cards = []
        difficulties = ["easy", "medium", "hard"]
        for i, sent in enumerate(sents[:count]):
            topic = _keywords(sent, 1)[0] if _keywords(sent, 1) else "General"
            cards.append({
                "id": f"card_{i + 1}",
                "question": f"What is described here: {sent[:80]}...?" if len(sent) > 80 else f"Explain: {sent[:60]}?",
                "answer": sent,
                "topic": topic,
                "difficulty": difficulties[i % 3],
            })
        while len(cards) < min(count, 5) and content:
            cards.append({
                "id": f"card_{len(cards) + 1}",
                "question": f"Summarize a key point from {topic if cards else 'this material'}",
                "answer": content[:200],
                "topic": "General",
                "difficulty": "medium",
            })
        return cards[:count]

    def generate_quiz(self, content: str, quiz_type: str, num_questions: int) -> list[dict[str, Any]]:
        sents = _sentences(content) or _chunks(content, 90)
        questions = []
        topics = _keywords(content, num_questions) or ["General"]

        for i in range(num_questions):
            sent = sents[i % len(sents)] if sents else content[:100]
            topic = topics[i % len(topics)]
            qid = f"q_{i + 1}"

            if quiz_type == "true_false":
                questions.append({
                    "id": qid,
                    "question": f"True or False: {sent[:100]}",
                    "type": "true_false",
                    "options": ["True", "False"],
                    "correct_answer": "True",
                    "explanation": f"Based on the study material: {sent[:150]}",
                    "topic": topic,
                })
            elif quiz_type == "short_answer":
                questions.append({
                    "id": qid,
                    "question": f"Briefly explain: {topic}",
                    "type": "short_answer",
                    "correct_answer": sent[:150],
                    "explanation": "Compare your answer with the material.",
                    "topic": topic,
                })
            else:
                distractors = [s[:40] for s in sents[i + 1:i + 4]] or ["Option B", "Option C", "Option D"]
                while len(distractors) < 3:
                    distractors.append(f"Alternative {len(distractors) + 1}")
                options = [sent[:60]] + distractors[:3]
                questions.append({
                    "id": qid,
                    "question": f"Which statement best matches the material about {topic}?",
                    "type": "mcq",
                    "options": options,
                    "correct_answer": options[0],
                    "explanation": sent[:200],
                    "topic": topic,
                })
        return questions

    def evaluate_short_answer(self, question: str, expected: str, user_answer: str) -> dict[str, Any]:
        if not user_answer.strip():
            return {"is_correct": False, "score": 0, "feedback": "No answer provided."}
        exp_words = set(re.findall(r"\b\w{4,}\b", expected.lower()))
        usr_words = set(re.findall(r"\b\w{4,}\b", user_answer.lower()))
        overlap = len(exp_words & usr_words)
        score = min(100, int((overlap / max(len(exp_words), 1)) * 100))
        return {
            "is_correct": score >= 60,
            "score": score,
            "feedback": "Good match with expected answer." if score >= 60 else "Try including more key terms from the material.",
        }

    def identify_weak_topics(self, incorrect_questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        topics: dict[str, int] = {}
        for q in incorrect_questions:
            topic = q.get("topic", "General")
            topics[topic] = topics.get(topic, 0) + 1
        return [
            {"topic": t, "incorrect_count": c, "priority": "high" if c >= 2 else "medium"}
            for t, c in sorted(topics.items(), key=lambda x: x[1], reverse=True)
        ]

    def generate_schedule(self, content: str, weak_topics: list[dict[str, Any]], material_title: str) -> dict[str, Any]:
        focus = [wt.get("topic", "Review") for wt in weak_topics[:3]] or _keywords(content, 3) or ["Core Topics"]
        days = []
        for d in range(1, 8):
            topic = focus[(d - 1) % len(focus)]
            days.append({
                "day": d,
                "date_label": f"Day {d}",
                "focus_topics": [topic],
                "time_slots": [
                    {"time": "9:00 AM - 10:00 AM", "task": f"Review {topic}", "type": "review", "completed": False},
                    {"time": "10:15 AM - 11:15 AM", "task": "Practice questions", "type": "practice", "completed": False},
                    {"time": "2:00 PM - 3:00 PM", "task": "Quick quiz", "type": "quiz", "completed": False},
                ],
                "tasks": [
                    {"title": f"Study {topic}", "description": f"Read and summarize {topic}", "priority": "high" if d <= 3 else "medium", "completed": False},
                    {"title": "Practice", "description": "Complete practice exercises", "priority": "medium", "completed": False},
                ],
                "study_tip": "Take short breaks every 45 minutes for better retention.",
            })
        return {
            "title": f"7-Day Plan: {material_title}",
            "overview": f"Personalized study plan covering {', '.join(focus)}.",
            "days": days,
        }

    def chat_with_tutor(self, content: str, material_title: str, message: str, history: list[dict[str, str]]) -> str:
        msg_lower = message.lower()
        sents = _sentences(content)
        if any(w in msg_lower for w in ("summary", "overview", "explain")):
            return f"Here's an overview of **{material_title}**:\n\n{sents[0] if sents else content[:300]}\n\nKey areas to focus on: {', '.join(_keywords(content, 4))}."
        if any(w in msg_lower for w in ("exam", "test", "important")):
            return f"For exams on **{material_title}**, focus on:\n" + "\n".join(f"- {k}" for k in _keywords(content, 5))
        if sents:
            return f"Regarding your question about **{material_title}**:\n\n{sents[0]}\n\n{sents[1] if len(sents) > 1 else ''}\n\nWould you like me to explain any specific concept in more detail?"
        return f"I can help you study **{material_title}**. Try asking about key concepts, exam tips, or request an explanation of specific topics."

    def generate_insights(self, content: str, title: str) -> dict[str, Any]:
        concepts = _keywords(content, 6) or ["Main Topic"]
        sents = _sentences(content)
        return {
            "exam_tips": [
                "Review key concepts daily in the week before your exam.",
                f"Focus extra time on: {', '.join(concepts[:3])}.",
                "Practice active recall instead of passive re-reading.",
            ],
            "common_mistakes": [
                "Skipping revision of foundational concepts.",
                "Not practicing with quiz questions before the exam.",
            ],
            "memory_techniques": [
                "Create acronyms from key terms.",
                "Teach the material to someone else to reinforce memory.",
            ],
            "key_formulas": [],
            "study_priority": [
                {"topic": c, "importance": "high" if i < 2 else "medium", "reason": "Frequently referenced in material"}
                for i, c in enumerate(concepts[:4])
            ],
            "estimated_study_hours": max(2, len(content.split()) // 200),
            "difficulty_rating": "medium",
            "mind_map": {
                "central_topic": title,
                "branches": [{"label": c, "children": [f"Detail about {c}"]} for c in concepts[:4]],
            },
        }

    def generate_practice_for_weak_topics(self, content: str, weak_topics: list[str], count: int = 5) -> list[dict[str, Any]]:
        topics = weak_topics or _keywords(content, 3) or ["General"]
        sents = _sentences(content)
        questions = []
        for i in range(count):
            topic = topics[i % len(topics)]
            sent = sents[i % len(sents)] if sents else content[:100]
            questions.append({
                "id": f"practice_{i + 1}",
                "question": f"Practice: Explain {topic} in your own words.",
                "hint": f"Think about: {sent[:80]}",
                "answer": sent,
                "topic": topic,
                "explanation": "Compare your answer with the material.",
            })
        return questions


local_ai_service = LocalAIService()
