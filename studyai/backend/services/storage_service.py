import uuid
from typing import Any

from config import SUPABASE_URL, SUPABASE_KEY
from services.local_storage import local_storage

_supabase_initialized = False
_db = None


def _init_supabase() -> bool:
    global _supabase_initialized, _db
    if _supabase_initialized:
        return _db is not None

    _supabase_initialized = True
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False

    try:
        from supabase import create_client
        _db = create_client(SUPABASE_URL, SUPABASE_KEY)
        return True
    except Exception as e:
        print(f"Error initializing Supabase: {e}")
        _db = None
        return False


class StorageService:
    def __init__(self) -> None:
        self.use_supabase = _init_supabase()

    def _save_document(self, collection: str, doc_id: str, data: dict[str, Any]) -> dict[str, Any]:
        if self.use_supabase and _db:
            try:
                _db.table("documents").upsert({
                    "id": doc_id,
                    "collection": collection,
                    "data": data
                }).execute()
            except Exception as e:
                print(f"Supabase save error: {e}")
        return data

    def _get_document(self, collection: str, doc_id: str) -> dict[str, Any] | None:
        if self.use_supabase and _db:
            try:
                response = _db.table("documents").select("data").eq("collection", collection).eq("id", doc_id).execute()
                if response.data:
                    return response.data[0]["data"]
            except Exception as e:
                print(f"Supabase get error: {e}")
        return None

    def _list_documents(self, collection: str) -> list[dict[str, Any]]:
        if self.use_supabase and _db:
            try:
                response = _db.table("documents").select("data").eq("collection", collection).execute()
                docs = [row["data"] for row in response.data]
                docs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                return docs
            except Exception as e:
                print(f"Supabase list error: {e}")
        return []

    def _delete_document(self, collection: str, doc_id: str) -> bool:
        if self.use_supabase and _db:
            try:
                _db.table("documents").delete().eq("collection", collection).eq("id", doc_id).execute()
                return True
            except Exception as e:
                print(f"Supabase delete error: {e}")
                return False
        return False

    def save_material(self, material: dict[str, Any]) -> dict[str, Any]:
        if self.use_supabase:
            return self._save_document("materials", material["id"], material)
        return local_storage.save_material(material)

    def get_material(self, material_id: str) -> dict[str, Any] | None:
        if self.use_supabase:
            return self._get_document("materials", material_id)
        return local_storage.get_material(material_id)

    def list_materials(self) -> list[dict[str, Any]]:
        if self.use_supabase:
            return self._list_documents("materials")
        return local_storage.list_materials()

    def upload_file(self, file_data: bytes, filename: str, material_id: str) -> str | None:
        if self.use_supabase and _db:
            try:
                file_path = f"{material_id}/{filename}"
                _db.storage.from_("materials").upload(file_path, file_data)
                return _db.storage.from_("materials").get_public_url(file_path)
            except Exception as e:
                print(f"Supabase upload error: {e}")
                return None
        return None

    def save_summary(self, material_id: str, summary: dict[str, Any]) -> dict[str, Any]:
        if self.use_supabase:
            return self._save_document("summaries", material_id, summary)
        return local_storage.save_summary(material_id, summary)

    def get_summary(self, material_id: str) -> dict[str, Any] | None:
        if self.use_supabase:
            return self._get_document("summaries", material_id)
        return local_storage.get_summary(material_id)

    def save_flashcards(self, material_id: str, deck: dict[str, Any]) -> dict[str, Any]:
        if self.use_supabase:
            return self._save_document("flashcards", material_id, deck)
        return local_storage.save_flashcards(material_id, deck)

    def get_flashcards(self, material_id: str) -> dict[str, Any] | None:
        if self.use_supabase:
            return self._get_document("flashcards", material_id)
        return local_storage.get_flashcards(material_id)

    def save_quiz(self, quiz_id: str, quiz: dict[str, Any]) -> dict[str, Any]:
        if self.use_supabase:
            return self._save_document("quizzes", quiz_id, quiz)
        return local_storage.save_quiz(quiz_id, quiz)

    def get_quiz(self, quiz_id: str) -> dict[str, Any] | None:
        if self.use_supabase:
            return self._get_document("quizzes", quiz_id)
        return local_storage.get_quiz(quiz_id)

    def save_quiz_result(self, result: dict[str, Any]) -> dict[str, Any]:
        if self.use_supabase:
            result_id = result.get("id", str(uuid.uuid4()))
            return self._save_document("quiz_results", result_id, result)
        return local_storage.save_quiz_result(result)

    def get_quiz_results(self, material_id: str | None = None) -> list[dict[str, Any]]:
        if self.use_supabase and _db:
            try:
                query = _db.table("documents").select("data").eq("collection", "quiz_results")
                if material_id:
                    query = query.eq("data->>material_id", material_id)
                response = query.execute()
                results = [row["data"] for row in response.data]
                results.sort(key=lambda r: r.get("completed_at", ""), reverse=True)
                return results
            except Exception as e:
                print(f"Supabase get_quiz_results error: {e}")
                return []
        return local_storage.get_quiz_results(material_id)

    def save_schedule(self, schedule_id: str, schedule: dict[str, Any]) -> dict[str, Any]:
        if self.use_supabase:
            return self._save_document("schedules", schedule_id, schedule)
        return local_storage.save_schedule(schedule_id, schedule)

    def get_schedule(self, schedule_id: str) -> dict[str, Any] | None:
        if self.use_supabase:
            return self._get_document("schedules", schedule_id)
        return local_storage.get_schedule(schedule_id)

    def list_schedules(self) -> list[dict[str, Any]]:
        if self.use_supabase:
            return self._list_documents("schedules")
        return local_storage.list_schedules()

    def update_schedule_task(
        self, schedule_id: str, day_index: int, task_index: int, completed: bool
    ) -> dict[str, Any] | None:
        if self.use_supabase:
            schedule = self.get_schedule(schedule_id)
            if not schedule:
                return None
            try:
                schedule["days"][day_index]["tasks"][task_index]["completed"] = completed
                self._save_document("schedules", schedule_id, schedule)
                return schedule
            except (IndexError, KeyError):
                return None
        return local_storage.update_schedule_task(schedule_id, day_index, task_index, completed)

    def delete_material(self, material_id: str) -> bool:
        if self.use_supabase:
            self._delete_document("materials", material_id)
            self._delete_document("summaries", material_id)
            self._delete_document("flashcards", material_id)
            self._delete_document("insights", material_id)
            self._delete_document("chat_sessions", material_id)
            return True
        return local_storage.delete_material(material_id)

    def save_insights(self, material_id: str, insights: dict[str, Any]) -> dict[str, Any]:
        if self.use_supabase:
            return self._save_document("insights", material_id, insights)
        return local_storage.save_insights(material_id, insights)

    def get_insights(self, material_id: str) -> dict[str, Any] | None:
        if self.use_supabase:
            return self._get_document("insights", material_id)
        return local_storage.get_insights(material_id)

    def save_chat_session(self, material_id: str, session: dict[str, Any]) -> dict[str, Any]:
        if self.use_supabase:
            return self._save_document("chat_sessions", material_id, session)
        return local_storage.save_chat_session(material_id, session)

    def get_chat_session(self, material_id: str) -> dict[str, Any] | None:
        if self.use_supabase:
            return self._get_document("chat_sessions", material_id)
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
        if self.use_supabase and _db:
            try:
                quiz_results = self._list_documents("quiz_results")
                materials = self._list_documents("materials")
                summaries = self._list_documents("summaries")
                flashcards = self._list_documents("flashcards")
                schedules = self._list_documents("schedules")
                return {
                    "quiz_results": quiz_results,
                    "materials_count": len(materials),
                    "summaries_count": len(summaries),
                    "flashcards_count": len(flashcards),
                    "schedules_count": len(schedules),
                    "insights_count": 0,
                    "chat_sessions": {},
                    "analytics": local_storage.get_analytics().get("analytics", {}),
                }
            except Exception as e:
                print(f"Supabase analytics error: {e}")
        return local_storage.get_analytics()

    @property
    def storage_mode(self) -> str:
        return "supabase" if self.use_supabase else "local_json"


storage_service = StorageService()
