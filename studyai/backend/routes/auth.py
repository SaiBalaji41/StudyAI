import uuid
import secrets
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, g
from werkzeug.security import generate_password_hash, check_password_hash

from services.storage_service import storage_service
from utils.auth_middleware import require_auth

auth_bp = Blueprint("auth", __name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json or {}
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    username = data.get("username", "").strip()
    password = data.get("password", "")
    
    # Validation
    if not full_name or not email or not username or not password:
        return jsonify({"error": "All fields are required"}), 400
        
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
    import re
    if not re.search(r'[^a-zA-Z0-9]', username):
        return jsonify({"error": "Username must contain at least one special character"}), 400
        
    if "@" not in email or "." not in email:
        return jsonify({"error": "Invalid email format"}), 400
        
    # Check if user exists
    if storage_service.get_user_by_email(email):
        return jsonify({"error": "Email already registered"}), 400
    if storage_service.get_user_by_username(username):
        return jsonify({"error": "Username already taken"}), 400
        
    user_id = str(uuid.uuid4())
    password_hash = generate_password_hash(password)
    
    user = {
        "id": user_id,
        "full_name": full_name,
        "email": email,
        "username": username,
        "password_hash": password_hash,
        "created_at": _now_iso()
    }
    
    storage_service.create_user(user)
    
    # Auto login
    token = secrets.token_hex(32)
    storage_service.create_session(token, user_id)
    
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    
    return jsonify({
        "message": "Signup successful",
        "user": safe_user,
        "token": token
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    identifier = data.get("identifier", "").strip().lower()
    password = data.get("password", "")
    
    if not identifier or not password:
        return jsonify({"error": "Identifier and password required"}), 400
        
    # Find user by email or username
    user = storage_service.get_user_by_email(identifier)
    if not user:
        user = storage_service.get_user_by_username(identifier)
        
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401
        
    token = secrets.token_hex(32)
    storage_service.create_session(token, user["id"])
    
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    
    return jsonify({
        "message": "Login successful",
        "user": safe_user,
        "token": token
    }), 200


@auth_bp.route("/logout", methods=["POST"])
@require_auth
def logout():
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        storage_service.delete_session(token)
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    user_id = g.user_id
    user = storage_service.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return jsonify({"user": safe_user}), 200


@auth_bp.route("/profile", methods=["PUT"])
@require_auth
def update_profile():
    user_id = g.user_id
    data = request.json or {}
    
    username = data.get("username")
    
    updates = {}
    if username:
        username = username.strip()
        import re
        if not re.search(r'[^a-zA-Z0-9]', username):
            return jsonify({"error": "Username must contain at least one special character"}), 400
        existing = storage_service.get_user_by_username(username)
        if existing and existing["id"] != user_id:
            return jsonify({"error": "Username already taken"}), 400
        updates["username"] = username
        
    if updates:
        updated_user = storage_service.update_user(user_id, updates)
        if updated_user:
            safe_user = {k: v for k, v in updated_user.items() if k != "password_hash"}
            return jsonify({"message": "Profile updated", "user": safe_user}), 200
            
    return jsonify({"error": "No updates provided or user not found"}), 400


@auth_bp.route("/password", methods=["PUT"])
@require_auth
def update_password():
    user_id = g.user_id
    data = request.json or {}
    
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    
    if not current_password or not new_password:
        return jsonify({"error": "Current and new password are required"}), 400
        
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters long"}), 400
        
    user = storage_service.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if not check_password_hash(user["password_hash"], current_password):
        return jsonify({"error": "Incorrect current password"}), 401
        
    updates = {"password_hash": generate_password_hash(new_password)}
    storage_service.update_user(user_id, updates)
    
    return jsonify({"message": "Password updated successfully"}), 200

@auth_bp.route("/account", methods=["DELETE"])
@require_auth
def delete_account():
    user_id = g.user_id
    success = storage_service.delete_user(user_id)
    if success:
        return jsonify({"message": "Account deleted successfully"}), 200
    return jsonify({"error": "Failed to delete account"}), 500
