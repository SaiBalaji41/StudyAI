from functools import wraps
from flask import request, jsonify, g
from services.storage_service import storage_service

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401
            
        token = auth_header.split(" ")[1]
        user_id = storage_service.get_session(token)
        
        if not user_id:
            return jsonify({"error": "Invalid or expired session"}), 401
            
        g.user_id = user_id
        return f(*args, **kwargs)
    return decorated
