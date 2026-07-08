import json
import re
from typing import Any

from groq import Groq

from config import GROQ_API_KEY, GROQ_MODEL, GROQ_CONFIGURED
from services.local_ai_service import local_ai_service


class AIService:
    def __init__(self) -> None:
        self._client = None
        self.model = GROQ_MODEL

    @property
    def mode(self) -> str:
        return "groq" if GROQ_CONFIGURED else "local"

    @property
    def client(self) -> Groq:
        if self._client is None:
            if not GROQ_CONFIGURED:
                raise ValueError("Groq client unavailable")
            self._client = Groq(api_key=GROQ_API_KEY)
        return self._client

    def _use_groq(self) -> bool:
        return GROQ_CONFIGURED

    def _call_ai(self, system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            raise ValueError(f"AI request failed: {exc}") from exc

    def _parse_json(self, text: str) -> Any:
        if not text or not text.strip():
            raise ValueError("AI returned an empty response")
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise ValueError(f"AI returned invalid JSON: {exc}") from exc

    def generate_summary(self, content: str, title: str) -> dict[str, Any]:
        if not self._use_groq():
            return local_ai_service.generate_summary(content, title)
        system_prompt = """You are an expert educational content summarizer.
Return a structured JSON object with these exact keys:
{
  "title": "string",
  "overview": "string - 2-3 paragraph topic overview",
  "key_concepts": ["array of key concept strings"],
  "definitions": [{"term": "string", "definition": "string"}],
  "core_principles": ["array of core principle strings"],
  "revision_notes": ["array of bullet-point revision notes"],
  "markdown": "string - full markdown summary combining all sections"
}
Return ONLY valid JSON, no markdown fences."""
        user_prompt = f"""Summarize this study material titled "{title}":

{content[:12000]}"""
        result = self._call_ai(system_prompt, user_prompt)
        parsed = self._parse_json(result)
        if "markdown" not in parsed:
            md_parts = [
                f"# {parsed.get('title', title)}",
                f"\n## Overview\n{parsed.get('overview', '')}",
                "\n## Key Concepts",
                *[f"- {c}" for c in parsed.get("key_concepts", [])],
                "\n## Important Definitions",
                *[f"**{d['term']}**: {d['definition']}" for d in parsed.get("definitions", [])],
                "\n## Core Principles",
                *[f"- {p}" for p in parsed.get("core_principles", [])],
                "\n## Revision Notes",
                *[f"- {n}" for n in parsed.get("revision_notes", [])],
            ]
            parsed["markdown"] = "\n".join(md_parts)
        return parsed

    def generate_flashcards(self, content: str, count: int = 10) -> list[dict[str, Any]]:
        if not self._use_groq():
            return local_ai_service.generate_flashcards(content, count)
        system_prompt = """You are an expert flashcard generator for students.
Return a JSON array of flashcard objects with id, question, answer, topic, difficulty.
Return ONLY valid JSON array."""
        user_prompt = f"Generate exactly {count} flashcards from:\n\n{content[:10000]}"
        result = self._call_ai(system_prompt, user_prompt, max_tokens=3000)
        cards = self._parse_json(result)
        for i, card in enumerate(cards):
            if "id" not in card:
                card["id"] = f"card_{i + 1}"
        return cards

    def generate_quiz(self, content: str, quiz_type: str, num_questions: int) -> list[dict[str, Any]]:
        if not self._use_groq():
            return local_ai_service.generate_quiz(content, quiz_type, num_questions)
        type_instructions = {
            "mcq": 'type "mcq", options array of 4, correct_answer, explanation, topic',
            "true_false": 'type "true_false", options ["True","False"], correct_answer, explanation, topic',
            "short_answer": 'type "short_answer", correct_answer, explanation, topic',
        }
        system_prompt = f"""Generate exactly {num_questions} {quiz_type} questions. {type_instructions.get(quiz_type, '')}
Return JSON array only."""
        user_prompt = f"Generate quiz from:\n\n{content[:10000]}"
        result = self._call_ai(system_prompt, user_prompt, max_tokens=4000)
        questions = self._parse_json(result)
        for i, q in enumerate(questions):
            if "id" not in q:
                q["id"] = f"q_{i + 1}"
        return questions

    def evaluate_short_answer(self, question: str, expected: str, user_answer: str) -> dict[str, Any]:
        if not self._use_groq():
            return local_ai_service.evaluate_short_answer(question, expected, user_answer)
        system_prompt = 'Return JSON: {"is_correct": boolean, "score": 0-100, "feedback": "string"}'
        user_prompt = f"Question: {question}\nExpected: {expected}\nStudent: {user_answer}"
        return self._parse_json(self._call_ai(system_prompt, user_prompt, max_tokens=500))

    def identify_weak_topics(self, incorrect_questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return local_ai_service.identify_weak_topics(incorrect_questions)

    def generate_schedule(self, content: str, weak_topics: list[dict[str, Any]], material_title: str) -> dict[str, Any]:
        if not self._use_groq():
            return local_ai_service.generate_schedule(content, weak_topics, material_title)
        weak_topics_str = json.dumps(weak_topics) if weak_topics else "[]"
        system_prompt = "Generate 7-day study schedule as JSON with title, overview, days array."
        user_prompt = f'Plan for "{material_title}":\n{content[:8000]}\nWeak: {weak_topics_str}'
        return self._parse_json(self._call_ai(system_prompt, user_prompt, max_tokens=5000))

    def chat_with_tutor(self, content: str, material_title: str, message: str, history: list[dict[str, str]]) -> str:
        if not self._use_groq():
            return local_ai_service.chat_with_tutor(content, material_title, message, history)
        system_prompt = f"""You are StudyAI Tutor for "{material_title}". Be clear and educational.
Context: {content[:8000]}"""
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": message})
        response = self.client.chat.completions.create(
            model=self.model, messages=messages, temperature=0.5, max_tokens=1500,
        )
        return response.choices[0].message.content or ""

    def generate_insights(self, content: str, title: str) -> dict[str, Any]:
        if not self._use_groq():
            return local_ai_service.generate_insights(content, title)
        system_prompt = "Return JSON with exam_tips, common_mistakes, memory_techniques, key_formulas, study_priority, estimated_study_hours, difficulty_rating, mind_map."
        user_prompt = f'Analyze "{title}":\n{content[:10000]}'
        return self._parse_json(self._call_ai(system_prompt, user_prompt, max_tokens=3000))

    def generate_practice_for_weak_topics(self, content: str, weak_topics: list[str], count: int = 5) -> list[dict[str, Any]]:
        if not self._use_groq():
            return local_ai_service.generate_practice_for_weak_topics(content, weak_topics, count)
        topics_str = ", ".join(weak_topics) if weak_topics else "general"
        system_prompt = f"Return JSON array of {count} practice questions with question, hint, answer, topic, explanation."
        user_prompt = f"Weak topics: {topics_str}\nMaterial:\n{content[:8000]}"
        questions = self._parse_json(self._call_ai(system_prompt, user_prompt, max_tokens=3000))
        for i, q in enumerate(questions):
            if "id" not in q:
                q["id"] = f"practice_{i + 1}"
        return questions


ai_service = AIService()
