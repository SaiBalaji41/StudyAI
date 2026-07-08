import uuid
from typing import Any

from config import FIREBASE_CREDENTIALS_PATH, FIREBASE_STORAGE_BUCKET
from services.local_storage import local_storage

_firebase_initialized = False
_db = None
_bucket = None


def _init_firebase() -> bool:
    global _firebase_initialized, _db, _bucket
    if _firebase_initialized:
        return _db is not None

    _firebase_initialized = True
    if not FIREBASE_CREDENTIALS_PATH:
        return False

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore, storage

        if not firebase_admin._apps:
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, {"storageBucket": FIREBASE_STORAGE_BUCKET})

        _db = firestore.client()
        _bucket = storage.bucket()
        return True
    except Exception:
        _db = None
        _bucket = None
        return False


class StorageService:
    def __init__(self) -> None:
        self.use_firebase = _init_firebase()

    def save_material(self, material: dict[str, Any]) -> dict[str, Any]:
        if self.use_firebase and _db:
            _db.collection("materials").document(material["id"]).set(material)
            return material
        return local_storage.save_material(material)

    def get_material(self, material_id: str) -> dict[str, Any] | None:
        if self.use_firebase and _db:
            doc = _db.collection("materials").document(material_id).get()
            return doc.to_dict() if doc.exists else None
        return local_storage.get_material(material_id)

    def list_materials(self) -> list[dict[str, Any]]:
        if self.use_firebase and _db:
            docs = _db.collection("materials").stream()
            materials = [doc.to_dict() for doc in docs]
            materials.sort(key=lambda m: m.get("created_at", ""), reverse=True)
            return materials
        return local_storage.list_materials()

    def upload_file(self, file_data: bytes, filename: str, material_id: str) -> str | None:
        if self.use_firebase and _bucket:
            try:
                blob = _bucket.blob(f"materials/{material_id}/{filename}")
                blob.upload_from_string(file_data)
                blob.make_public()
                return blob.public_url
            except Exception:
                return None
        return None

    def save_summary(self, material_id: str, summary: dict[str, Any]) -> dict[str, Any]:
        if self.use_firebase and _db:
            _db.collection("summaries").document(material_id).set(summary)
            return summary
        return local_storage.save_summary(material_id, summary)

    def get_summary(self, material_id: str) -> dict[str, Any] | None:
        if self.use_firebase and _db:
            doc = _db.collection("summaries").document(material_id).get()
            return doc.to_dict() if doc.exists else None
        return local_storage.get_summary(material_id)

    def save_flashcards(self, material_id: str, deck: dict[str, Any]) -> dict[str, Any]:
        if self.use_firebase and _db:
            _db.collection("flashcards").document(material_id).set(deck)
            return deck
        return local_storage.save_flashcards(material_id, deck)

    def get_flashcards(self, material_id: str) -> dict[str, Any] | None:
        if self.use_firebase and _db:
            doc = _db.collection("flashcards").document(material_id).get()
            return doc.to_dict() if doc.exists else None
        return local_storage.get_flashcards(material_id)

    def save_quiz(self, quiz_id: str, quiz: dict[str, Any]) -> dict[str, Any]:
        if self.use_firebase and _db:
            _db.collection("quizzes").document(quiz_id).set(quiz)
            return quiz
        return local_storage.save_quiz(quiz_id, quiz)

    def get_quiz(self, quiz_id: str) -> dict[str, Any] | None:
        if self.use_firebase and _db:
            doc = _db.collection("quizzes").document(quiz_id).get()
            return doc.to_dict() if doc.exists else None
        return local_storage.get_quiz(quiz_id)

    def save_quiz_result(self, result: dict[str, Any]) -> dict[str, Any]:
        if self.use_firebase and _db:
            result_id = result.get("id", str(uuid.uuid4()))
            _db.collection("quiz_results").document(result_id).set(result)
            return result
        return local_storage.save_quiz_result(result)

    def get_quiz_results(self, material_id: str | None = None) -> list[dict[str, Any]]:
        if self.use_firebase and _db:
            query = _db.collection("quiz_results")
            if material_id:
                query = query.where("material_id", "==", material_id)
            results = [doc.to_dict() for doc in query.stream()]
            results.sort(key=lambda r: r.get("completed_at", ""), reverse=True)
            return results
        return local_storage.get_quiz_results(material_id)

    def save_schedule(self, schedule_id: str, schedule: dict[str, Any]) -> dict[str, Any]:
        if self.use_firebase and _db:
            _db.collection("schedules").document(schedule_id).set(schedule)
            return schedule
        return local_storage.save_schedule(schedule_id, schedule)

    def get_schedule(self, schedule_id: str) -> dict[str, Any] | None:
        if self.use_firebase and _db:
            doc = _db.collection("schedules").document(schedule_id).get()
            return doc.to_dict() if doc.exists else None
        return local_storage.get_schedule(schedule_id)

    def list_schedules(self) -> list[dict[str, Any]]:
        if self.use_firebase and _db:
            docs = _db.collection("schedules").stream()
            schedules = [doc.to_dict() for doc in docs]
            schedules.sort(key=lambda s: s.get("created_at", ""), reverse=True)
            return schedules
        return local_storage.list_schedules()

    def update_schedule_task(
        self, schedule_id: str, day_index: int, task_index: int, completed: bool
    ) -> dict[str, Any] | None:
        if self.use_firebase and _db:
            schedule = self.get_schedule(schedule_id)
            if not schedule:
                return None
            try:
                schedule["days"][day_index]["tasks"][task_index]["completed"] = completed
                _db.collection("schedules").document(schedule_id).set(schedule)
                return schedule
            except (IndexError, KeyError):
                return None
        return local_storage.update_schedule_task(schedule_id, day_index, task_index, completed)

    def delete_material(self, material_id: str) -> bool:
        return local_storage.delete_material(material_id)

    def save_insights(self, material_id: str, insights: dict[str, Any]) -> dict[str, Any]:
        return local_storage.save_insights(material_id, insights)

    def get_insights(self, material_id: str) -> dict[str, Any] | None:
        return local_storage.get_insights(material_id)

    def save_chat_session(self, material_id: str, session: dict[str, Any]) -> dict[str, Any]:
        return local_storage.save_chat_session(material_id, session)

    def get_chat_session(self, material_id: str) -> dict[str, Any] | None:
        return local_storage.get_chat_session(material_id)

    def record_study_activity(self) -> dict[str, Any]:
        return local_storage.record_study_activity()

    def save_pomodoro_session(self, session: dict[str, Any]) -> dict[str, Any]:
        return local_storage.save_pomodoro_session(session)

    def get_pomodoro_sessions(self) -> list[dict[str, Any]]:
        return local_storage.get_pomodoro_sessions()

    def save_goal(self, goal: dict[str, Any]) -> dict[str, Any]:
        return local_storage.save_goal(goal)

    def get_goals(self) -> list[dict[str, Any]]:
        return local_storage.get_goals()

    def update_goal(self, goal_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        return local_storage.update_goal(goal_id, updates)

    def get_analytics(self) -> dict[str, Any]:
        if self.use_firebase and _db:
            quiz_results = [doc.to_dict() for doc in _db.collection("quiz_results").stream()]
            materials = [doc.to_dict() for doc in _db.collection("materials").stream()]
            summaries = [doc.to_dict() for doc in _db.collection("summaries").stream()]
            flashcards = [doc.to_dict() for doc in _db.collection("flashcards").stream()]
            schedules = [doc.to_dict() for doc in _db.collection("schedules").stream()]
            return {
                "quiz_results": quiz_results,
                "materials_count": len(materials),
                "summaries_count": len(summaries),
                "flashcards_count": len(flashcards),
                "schedules_count": len(schedules),
                "insights_count": 0,
                "chat_sessions": {},
                "analytics": {},
            }
        return local_storage.get_analytics()

    @property
    def storage_mode(self) -> str:
        return "firebase" if self.use_firebase else "local_json"


storage_service = StorageService()
