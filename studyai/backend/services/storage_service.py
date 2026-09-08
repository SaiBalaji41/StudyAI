import uuid
import concurrent.futures
from datetime import datetime, timezone
from typing import Any

from config import SUPABASE_URL, SUPABASE_KEY
from services.local_storage import local_storage

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_current_user_id() -> str:
    try:
        from flask import has_app_context, g
        if has_app_context() and hasattr(g, 'user_id'):
            return g.user_id
    except ImportError:
        pass
    return "default_user"


_supabase_initialized = False
_db = None

# High-performance in-memory caches to eliminate repeated remote DB roundtrips
_session_cache: dict[str, str] = {}
_user_cache_by_id: dict[str, dict[str, Any]] = {}
_user_cache_by_email: dict[str, str] = {}
_user_cache_by_username: dict[str, str] = {}


def _cache_user(user: dict[str, Any] | None) -> None:
    if not user or not isinstance(user, dict) or "id" not in user:
        return
    uid = user["id"]
    _user_cache_by_id[uid] = user
    if "email" in user and user["email"]:
        _user_cache_by_email[user["email"].strip().lower()] = uid
    if "username" in user and user["username"]:
        _user_cache_by_username[user["username"].strip().lower()] = uid


def _invalidate_user_cache(user_id: str) -> None:
    user = _user_cache_by_id.pop(user_id, None)
    if user:
        if "email" in user and user["email"]:
            _user_cache_by_email.pop(user["email"].strip().lower(), None)
        if "username" in user and user["username"]:
            _user_cache_by_username.pop(user["username"].strip().lower(), None)


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
                if collection not in ("users", "sessions"):
                    user_id = _get_current_user_id()
                    if "user_id" not in data:
                        data = {**data, "user_id": user_id}
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
                    data = response.data[0]["data"]
                    if collection in ("users", "sessions"):
                        return data
                    user_id = _get_current_user_id()
                    doc_user_id = data.get("user_id") or "a90cb26a-63fe-4628-acd9-e281da87de6b"
                    if doc_user_id == user_id:
                        return data
            except Exception as e:
                print(f"Supabase get error: {e}")
        return None

    def _list_documents(self, collection: str) -> list[dict[str, Any]]:
        if self.use_supabase and _db:
            try:
                user_id = _get_current_user_id()
                query = _db.table("documents").select("data").eq("collection", collection)
                
                if user_id == "a90cb26a-63fe-4628-acd9-e281da87de6b":
                    response = query.execute()
                    docs = []
                    for row in response.data:
                        data = row["data"]
                        doc_user_id = data.get("user_id") or "a90cb26a-63fe-4628-acd9-e281da87de6b"
                        if doc_user_id == user_id:
                            docs.append(data)
                else:
                    response = query.eq("data->>user_id", user_id).execute()
                    docs = [row["data"] for row in response.data]
                
                docs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                return docs
            except Exception as e:
                print(f"Supabase list error: {e}")
        return []

    def _delete_document(self, collection: str, doc_id: str) -> bool:
        if self.use_supabase and _db:
            try:
                doc = self._get_document(collection, doc_id)
                if doc:
                    _db.table("documents").delete().eq("collection", collection).eq("id", doc_id).execute()
                    return True
            except Exception as e:
                print(f"Supabase delete error: {e}")
                return False
        return False

    def create_user(self, user: dict[str, Any]) -> dict[str, Any]:
        _cache_user(user)
        if self.use_supabase:
            return self._save_document("users", user["id"], user)
        return local_storage.create_user(user)

    def update_user(self, user_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        if self.use_supabase:
            user = self.get_user_by_id(user_id)
            if user:
                user.update(updates)
                _cache_user(user)
                self._save_document("users", user_id, user)
                return user
            return None
        updated = local_storage.update_user(user_id, updates)
        if updated:
            _cache_user(updated)
        return updated

    def delete_user(self, user_id: str) -> bool:
        _invalidate_user_cache(user_id)
        # Clear all active sessions associated with this user
        tokens_to_remove = [tok for tok, uid in _session_cache.items() if uid == user_id]
        for tok in tokens_to_remove:
            _session_cache.pop(tok, None)

        if self.use_supabase:
            if _db:
                try:
                    _db.table("documents").delete().eq("collection", "sessions").eq("data->>user_id", user_id).execute()
                except Exception as e:
                    print(f"Supabase delete user sessions error: {e}")
            self._delete_document("users", user_id)
            return True
        return local_storage.delete_user(user_id)

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        if user_id in _user_cache_by_id:
            return _user_cache_by_id[user_id]
        if self.use_supabase:
            user = self._get_document("users", user_id)
            if user:
                _cache_user(user)
            return user
        user = local_storage.get_user_by_id(user_id)
        if user:
            _cache_user(user)
        return user

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        email_clean = email.strip().lower()
        if email_clean in _user_cache_by_email:
            uid = _user_cache_by_email[email_clean]
            if uid in _user_cache_by_id:
                return _user_cache_by_id[uid]

        if self.use_supabase and _db:
            try:
                response = _db.table("documents").select("data").eq("collection", "users").eq("data->>email", email_clean).execute()
                if response.data:
                    user = response.data[0]["data"]
                    _cache_user(user)
                    return user
            except Exception as e:
                print(f"Supabase get_user_by_email error: {e}")
        user = local_storage.get_user_by_email(email_clean)
        if user:
            _cache_user(user)
        return user

    def get_user_by_username(self, username: str) -> dict[str, Any] | None:
        uname_clean = username.strip().lower()
        if uname_clean in _user_cache_by_username:
            uid = _user_cache_by_username[uname_clean]
            if uid in _user_cache_by_id:
                return _user_cache_by_id[uid]

        if self.use_supabase and _db:
            try:
                response = _db.table("documents").select("data").eq("collection", "users").ilike("data->>username", uname_clean).execute()
                if response.data:
                    user = response.data[0]["data"]
                    _cache_user(user)
                    return user
            except Exception as e:
                print(f"Supabase get_user_by_username error: {e}")
        user = local_storage.get_user_by_username(uname_clean)
        if user:
            _cache_user(user)
        return user

    def get_user_by_identifier(self, identifier: str) -> dict[str, Any] | None:
        identifier_clean = identifier.strip()
        if not identifier_clean:
            return None
            
        if "@" in identifier_clean:
            user = self.get_user_by_email(identifier_clean)
            if user:
                return user
            return self.get_user_by_username(identifier_clean)
        else:
            user = self.get_user_by_username(identifier_clean)
            if user:
                return user
            return self.get_user_by_email(identifier_clean)

    def create_session(self, token: str, user_id: str) -> None:
        _session_cache[token] = user_id
        if self.use_supabase:
            session_data = {"user_id": user_id, "created_at": _now_iso()}
            self._save_document("sessions", token, session_data)
            return
        local_storage.create_session(token, user_id)

    def get_session(self, token: str) -> str | None:
        if token in _session_cache:
            return _session_cache[token]

        if self.use_supabase:
            session = self._get_document("sessions", token)
            if session and "user_id" in session:
                _session_cache[token] = session["user_id"]
                return session["user_id"]
            return None

        uid = local_storage.get_session(token)
        if uid:
            _session_cache[token] = uid
        return uid

    def delete_session(self, token: str) -> None:
        _session_cache.pop(token, None)
        if self.use_supabase:
            self._delete_document("sessions", token)
            return
        local_storage.delete_session(token)

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
                user_id = _get_current_user_id()
                query = _db.table("documents").select("data").eq("collection", "quiz_results")
                
                if user_id == "a90cb26a-63fe-4628-acd9-e281da87de6b":
                    response = query.execute()
                    results = []
                    for row in response.data:
                        data = row["data"]
                        doc_user_id = data.get("user_id") or "a90cb26a-63fe-4628-acd9-e281da87de6b"
                        if doc_user_id == user_id:
                            if not material_id or data.get("material_id") == material_id:
                                results.append(data)
                else:
                    response = query.eq("data->>user_id", user_id).execute()
                    results = []
                    for row in response.data:
                        data = row["data"]
                        if not material_id or data.get("material_id") == material_id:
                            results.append(data)
                            
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

    def save_annotations(self, material_id: str, annotations: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if self.use_supabase:
            self._save_document("annotations", material_id, {"annotations": annotations})
            return annotations
        return local_storage.save_annotations(material_id, annotations)

    def get_annotations(self, material_id: str) -> list[dict[str, Any]]:
        if self.use_supabase:
            doc = self._get_document("annotations", material_id)
            return doc.get("annotations", []) if doc else []
        return local_storage.get_annotations(material_id)

    def get_analytics(self) -> dict[str, Any]:
        if self.use_supabase and _db:
            try:
                # Fast parallel retrieval of all 5 document collections
                with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                    f_qr = executor.submit(self._list_documents, "quiz_results")
                    f_mat = executor.submit(self._list_documents, "materials")
                    f_sum = executor.submit(self._list_documents, "summaries")
                    f_fc = executor.submit(self._list_documents, "flashcards")
                    f_sch = executor.submit(self._list_documents, "schedules")

                    quiz_results = f_qr.result()
                    materials = f_mat.result()
                    summaries = f_sum.result()
                    flashcards = f_fc.result()
                    schedules = f_sch.result()

                return {
                    "quiz_results": quiz_results,
                    "materials": materials,
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
        local_data = local_storage.get_analytics()
        local_data["materials"] = local_storage.list_materials()
        return local_data

    @property
    def storage_mode(self) -> str:
        return "supabase" if self.use_supabase else "local_json"


storage_service = StorageService()

