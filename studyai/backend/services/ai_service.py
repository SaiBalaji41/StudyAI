import json
import os
import re
from typing import Any

from flask import has_app_context, g
from config import GROQ_API_KEY, GROQ_MODEL, GROQ_CONFIGURED
from services.local_ai_service import local_ai_service


class AIService:
    def __init__(self) -> None:
        self.default_provider = "groq"
        self.default_models = {
            "groq": GROQ_MODEL or "llama-3.3-70b-versatile",
            "openai": "gpt-4o-mini",
            "gemini": "gemini-2.5-flash",
            "claude": "claude-3-5-sonnet-20241022",
            "deepseek": "deepseek-chat"
        }
        self.default_vision_models = {
            "groq": "llama-3.2-11b-vision-preview",
            "openai": "gpt-4o",
            "gemini": "gemini-2.5-flash",
            "claude": "claude-3-5-sonnet-20241022",
            "deepseek": "deepseek-chat"
        }

    @property
    def mode(self) -> str:
        prov, _ = self._get_active_provider_and_key()
        return prov

    def _get_active_provider_and_key(self) -> tuple[str, str]:
        """Retrieve active AI provider and key from current request user context, or fallback to environment."""
        provider = self.default_provider
        api_key = GROQ_API_KEY

        # Attempt to load from flask request context (g.user_id)
        if has_app_context() and hasattr(g, "user_id") and g.user_id:
            try:
                from services.storage_service import storage_service
                user = storage_service.get_user_by_id(g.user_id)
                if user:
                    # Retrieve user custom provider preference
                    user_provider = user.get("selected_model_provider")
                    if user_provider in self.default_models:
                        provider = user_provider

                    # Retrieve custom API key
                    key_field = f"{provider}_api_key"
                    user_key = user.get(key_field)
                    if user_key and user_key.strip():
                        return provider, user_key.strip()
            except Exception as e:
                print(f"Error fetching user provider preferences: {e}")

        # System environment fallbacks
        env_keys = {
            "groq": GROQ_API_KEY,
            "openai": os.getenv("OPENAI_API_KEY", ""),
            "gemini": os.getenv("GEMINI_API_KEY", ""),
            "claude": os.getenv("ANTHROPIC_API_KEY", ""),
            "deepseek": os.getenv("DEEPSEEK_API_KEY", "")
        }
        
        fallback_key = env_keys.get(provider, "")
        if not fallback_key:
            # If selected provider key is missing, search for any configured system key
            for p, k in env_keys.items():
                if k and k != "your_groq_api_key_here":
                    provider = p
                    fallback_key = k
                    break
                    
        return provider, fallback_key

    def _call_ai_multimodal(self, system_prompt: str, user_prompt: str, image_bytes: bytes, mime_type: str) -> str:
        """Call active provider with a multimodal text + image input."""
        provider, api_key = self._get_active_provider_and_key()
        model = self.default_vision_models.get(provider, self.default_models[provider])
        
        if not api_key:
            raise ValueError(f"No API key configured for {provider}")

        try:
            if provider == "openai" or provider == "deepseek":
                import base64
                from openai import OpenAI
                base_url = "https://api.deepseek.com" if provider == "deepseek" else None
                client = OpenAI(api_key=api_key, base_url=base_url)
                
                base64_image = base64.b64encode(image_bytes).decode("utf-8")
                messages = [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}
                            }
                        ]
                    }
                ]
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=4096
                )
                return response.choices[0].message.content or ""

            elif provider == "gemini":
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                
                gemini_model = genai.GenerativeModel(
                    model_name=model,
                    system_instruction=system_prompt
                )
                
                contents = [
                    {"mime_type": mime_type, "data": image_bytes},
                    user_prompt
                ]
                response = gemini_model.generate_content(
                    contents,
                    generation_config={"temperature": 0.3}
                )
                return response.text

            elif provider == "claude":
                import base64
                import anthropic
                client = anthropic.Anthropic(api_key=api_key)
                
                base64_image = base64.b64encode(image_bytes).decode("utf-8")
                response = client.messages.create(
                    model=model,
                    system=system_prompt,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": mime_type,
                                        "data": base64_image
                                    }
                                },
                                {
                                    "type": "text",
                                    "text": user_prompt
                                }
                            ]
                        }
                    ],
                    temperature=0.3,
                    max_tokens=4096
                )
                return response.content[0].text

            else: # groq
                import base64
                from groq import Groq
                client = Groq(api_key=api_key)
                
                base64_image = base64.b64encode(image_bytes).decode("utf-8")
                messages = [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}
                            }
                        ]
                    }
                ]
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=4096
                )
                return response.choices[0].message.content or ""

        except Exception as exc:
            raise ValueError(f"Multimodal AI request failed with {provider}: {exc}") from exc

    def _call_ai(self, system_prompt: str, user_prompt: str, max_tokens: int = 4096, history: list[dict[str, str]] | None = None) -> str:
        provider, api_key = self._get_active_provider_and_key()
        model = self.default_models.get(provider, "llama-3.3-70b-versatile")
        
        if not api_key:
            raise ValueError(f"No API key configured for {provider}")

        # Construct flat history messages
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for m in history:
                messages.append({"role": m["role"], "content": m["content"]})
        messages.append({"role": "user", "content": user_prompt})

        try:
            if provider == "openai" or provider == "groq" or provider == "deepseek":
                base_url = "https://api.deepseek.com" if provider == "deepseek" else None
                
                if provider == "groq":
                    from groq import Groq
                    client = Groq(api_key=api_key)
                else:
                    from openai import OpenAI
                    client = OpenAI(api_key=api_key, base_url=base_url)

                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=max_tokens,
                )
                return response.choices[0].message.content or ""

            elif provider == "gemini":
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                
                gemini_model = genai.GenerativeModel(
                    model_name=model,
                    system_instruction=system_prompt
                )
                
                contents = []
                if history:
                    for m in history:
                        role = "model" if m["role"] == "assistant" else m["role"]
                        if role in ("user", "model"):
                            contents.append({"role": role, "parts": [m["content"]]})
                contents.append({"role": "user", "parts": [user_prompt]})
                
                response = gemini_model.generate_content(
                    contents,
                    generation_config={
                        "temperature": 0.3,
                        "max_output_tokens": max_tokens
                    }
                )
                return response.text

            elif provider == "claude":
                import anthropic
                client = anthropic.Anthropic(api_key=api_key)
                
                claude_messages = []
                for m in messages:
                    if m["role"] in ("user", "assistant"):
                        claude_messages.append({"role": "assistant" if m["role"] == "assistant" else "user", "content": m["content"]})
                
                response = client.messages.create(
                    model=model,
                    system=system_prompt,
                    messages=claude_messages,
                    temperature=0.3,
                    max_tokens=max_tokens
                )
                return response.content[0].text

            else:
                raise ValueError(f"Unknown model provider: {provider}")

        except Exception as exc:
            raise ValueError(f"AI request failed on {provider}: {exc}") from exc

    def _parse_json(self, text: str) -> Any:
        if not text or not text.strip():
            raise ValueError("AI returned an empty response")
        cleaned = text.strip()
        
        # Robustly extract JSON block if wrapped in conversational text
        brackets = [cleaned.find(b) for b in ('[', '{') if cleaned.find(b) != -1]
        first_bracket = min(brackets) if brackets else -1
        r_brackets = [cleaned.rfind(b) for b in (']', '}') if cleaned.rfind(b) != -1]
        last_bracket = max(r_brackets) if r_brackets else -1
        
        if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
            cleaned = cleaned[first_bracket:last_bracket + 1]
            
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        try:
            return json.loads(cleaned, strict=False)
        except json.JSONDecodeError as exc:
            raise ValueError(f"AI returned invalid JSON: {exc} (response sample: {text[:150]})") from exc

    def _use_groq(self) -> bool:
        _, api_key = self._get_active_provider_and_key()
        return bool(api_key)

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

    def generate_quiz(self, content: str, quiz_type: str, num_questions: int, weak_topics: list[str] = None) -> list[dict[str, Any]]:
        if not self._use_groq():
            return local_ai_service.generate_quiz(content, quiz_type, num_questions, weak_topics)
        type_instructions = {
            "mcq": 'must include keys: "question", "type" (value="mcq"), "options" (array of 4 strings), "correct_answer" (string, single option or comma-separated options if multiple are correct), "explanation", "topic". Note that one or more options can be correct. If multiple options are correct, provide them as a comma-separated list in correct_answer.',
            "true_false": 'must include keys: "question", "type" (value="true_false"), "options" (array of ["True","False"]), "correct_answer", "explanation", "topic"',
            "short_answer": 'must include keys: "question", "type" (value="short_answer"), "correct_answer", "explanation", "topic"',
        }
        
        weak_topics_inst = ""
        if weak_topics:
            weak_topics_inst = f"\nPRIORITIZE generating questions that test the following weak topics: {', '.join(weak_topics)}."
            
        system_prompt = f"""Generate exactly {num_questions} {quiz_type} questions. {type_instructions.get(quiz_type, '')}{weak_topics_inst}
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
        try:
            weak_topics_str = json.dumps(weak_topics) if weak_topics else "[]"
            system_prompt = "Generate 7-day study schedule as JSON with title, overview, days array."
            user_prompt = f'Plan for "{material_title}":\n{content[:8000]}\nWeak: {weak_topics_str}'
            return self._parse_json(self._call_ai(system_prompt, user_prompt, max_tokens=5000))
        except ValueError:
            return local_ai_service.generate_schedule(content, weak_topics, material_title)

    def chat_with_tutor(self, content: str, material_title: str, message: str, history: list[dict[str, str]]) -> str:
        if not self._use_groq():
            return local_ai_service.chat_with_tutor(content, material_title, message, history)
        system_prompt = f"""You are StudyAI Tutor for "{material_title}". Be clear and educational.
Context: {content[:8000]}"""
        # Map assistant -> model or vice versa if needed, but here we just route it via our unified _call_ai history handler
        formatted_history = []
        for h in history[-10:]:
            formatted_history.append({"role": "assistant" if h.get("role") == "assistant" else "user", "content": h.get("content", "")})
        return self._call_ai(system_prompt, message, max_tokens=1500, history=formatted_history)

    def generate_insights(self, content: str, title: str) -> dict[str, Any]:
        if not self._use_groq():
            return local_ai_service.generate_insights(content, title)
        try:
            system_prompt = "Return JSON with exam_tips, common_mistakes, memory_techniques, key_formulas, study_priority, estimated_study_hours, difficulty_rating, mind_map."
            user_prompt = f'Analyze "{title}":\n{content[:10000]}'
            return self._parse_json(self._call_ai(system_prompt, user_prompt, max_tokens=3000))
        except ValueError:
            return local_ai_service.generate_insights(content, title)

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
