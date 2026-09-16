import unittest
import sys
from pathlib import Path

# Ensure backend root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app

class TestStudyAIBulk(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        
        # Sign up a unique test user
        self.user_email = f"testuser_{id(self)}@example.com"
        self.username = f"testuser_{id(self)}"
        signup_res = self.client.post("/api/auth/signup", json={
            "full_name": "Test Suite User",
            "email": self.user_email,
            "username": self.username,
            "password": "Password123!"
        })
        self.assertEqual(signup_res.status_code, 201)
        self.token = signup_res.json["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_01_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json["status"], "healthy")

    def test_02_auth_lifecycle(self):
        # Test getMe
        res = self.client.get("/api/auth/me", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json["user"]["email"], self.user_email)

        # Test profile update
        res = self.client.put("/api/auth/profile", headers=self.headers, json={
            "selected_model_provider": "groq",
            "groq_api_key": "gsk_test_mock_key"
        })
        self.assertEqual(res.status_code, 200)

        # Test password update
        res = self.client.put("/api/auth/password", headers=self.headers, json={
            "current_password": "Password123!",
            "new_password": "NewPassword123!"
        })
        self.assertEqual(res.status_code, 200)

    def test_03_materials_and_ai_pipeline(self):
        sample_text = (
            "Photosynthesis is the biological process by which green plants and certain other organisms "
            "transform light energy into chemical energy. During photosynthesis in green plants, light energy is "
            "captured and used to convert water, carbon dioxide, and minerals into oxygen and energy-rich organic compounds. "
            "Chlorophyll is the green pigment in plants that absorbs light energy required for photosynthesis. "
            "The light-dependent reactions take place in the thylakoid membrane, while the Calvin cycle occurs in the stroma. "
            "Cellular respiration is the opposite metabolic process where glucose and oxygen are converted into ATP, carbon dioxide, and water."
        )

        # Upload material
        res = self.client.post("/api/materials/upload", headers=self.headers, data={
            "title": "Photosynthesis Fundamentals",
            "text": sample_text
        })
        self.assertEqual(res.status_code, 201)
        material = res.json["material"]
        material_id = material["id"]

        # List materials
        res = self.client.get("/api/materials/", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(any(m["id"] == material_id for m in res.json["materials"]))

        # Search materials
        res = self.client.get("/api/materials/search?q=photosynthesis", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.json["materials"]) > 0)

        # Annotations
        res = self.client.post(f"/api/materials/{material_id}/annotations", headers=self.headers, json={
            "annotations": [{"id": "ann1", "text": "Chlorophyll", "comment": "Crucial pigment", "color": "yellow"}]
        })
        self.assertEqual(res.status_code, 200)

        res = self.client.get(f"/api/materials/{material_id}/annotations", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json["annotations"]), 1)

        # Summary Generation
        res = self.client.post(f"/api/summary/{material_id}", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn("summary", res.json)
        self.assertIn("overview", res.json["summary"])

        # Flashcard Generation & SM-2 Review
        res = self.client.post(f"/api/flashcards/{material_id}", headers=self.headers, json={"count": 5})
        self.assertEqual(res.status_code, 200)
        self.assertIn("deck", res.json)
        cards = res.json["deck"]["cards"]
        self.assertTrue(len(cards) > 0)
        card_id = cards[0]["id"]

        # Review card with rating 4 (Easy)
        res = self.client.put(f"/api/flashcards/{material_id}/review", headers=self.headers, json={
            "card_id": card_id,
            "rating": 4
        })
        self.assertEqual(res.status_code, 200)

        # Quiz Generation (MCQ)
        res = self.client.post(f"/api/quiz/generate/{material_id}", headers=self.headers, json={
            "quiz_type": "mcq",
            "num_questions": 3
        })
        self.assertEqual(res.status_code, 200)
        quiz = res.json["quiz"]
        quiz_id = quiz["id"]

        # Submit quiz answers
        answers = {q["id"]: (q.get("options", ["Option A"])[0] if q.get("options") else "True") for q in quiz["questions"]}
        res = self.client.post(f"/api/quiz/submit/{quiz_id}", headers=self.headers, json={"answers": answers})
        self.assertEqual(res.status_code, 200)
        self.assertIn("result", res.json)
        self.assertIn("percentage", res.json["result"])

        # Schedule Generation
        res = self.client.post(f"/api/schedule/generate/{material_id}", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        schedule = res.json["schedule"]
        schedule_id = schedule["id"]

        # Update schedule task
        if schedule.get("days") and schedule["days"][0].get("tasks"):
            res = self.client.put(f"/api/schedule/{schedule_id}/task", headers=self.headers, json={
                "day_index": 0,
                "task_index": 0,
                "completed": True
            })
            self.assertEqual(res.status_code, 200)

        # Insights Generation
        res = self.client.post(f"/api/insights/{material_id}", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn("insights", res.json)

        # Practice weak topics
        res = self.client.post(f"/api/insights/{material_id}/practice", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn("questions", res.json)

        # AI Tutor Chat
        res = self.client.post(f"/api/tutor/chat/{material_id}", headers=self.headers, json={
            "message": "Can you explain what chlorophyll does?"
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn("reply", res.json)

        # Chat History
        res = self.client.get(f"/api/tutor/chat/{material_id}", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.json["messages"]) >= 2)

        # Pomodoro recording & Goals
        res = self.client.post("/api/goals/pomodoro", headers=self.headers, json={
            "duration_minutes": 25,
            "type": "focus"
        })
        self.assertEqual(res.status_code, 200)

        res = self.client.post("/api/goals/", headers=self.headers, json={
            "title": "Master Photosynthesis",
            "target": 5,
            "unit": "sessions"
        })
        self.assertEqual(res.status_code, 201)

        # Analytics
        res = self.client.get("/api/analytics/", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn("overview", res.json)
        self.assertIn("xp", res.json["overview"])

        # Achievements
        res = self.client.get("/api/achievements/", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn("achievements", res.json)

        # Material Deletion
        res = self.client.delete(f"/api/materials/{material_id}", headers=self.headers)
        self.assertEqual(res.status_code, 200)

if __name__ == "__main__":
    unittest.main()
