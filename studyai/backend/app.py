from flask import Flask, jsonify
from flask_cors import CORS

from config import CORS_ORIGINS, FLASK_DEBUG, FLASK_PORT, FLASK_SECRET_KEY
from routes.achievements import achievements_bp
from routes.analytics import analytics_bp
from routes.flashcards import flashcards_bp
from routes.goals import goals_bp
from routes.insights import insights_bp
from routes.materials import materials_bp
from routes.quiz import quiz_bp
from routes.schedule import schedule_bp
from routes.summary import summary_bp
from routes.tutor import tutor_bp
from routes.auth import auth_bp
from services.ai_service import ai_service
from services.storage_service import storage_service


def create_app() -> Flask:
    app = Flask(__name__)
    app.secret_key = FLASK_SECRET_KEY
    app.config["JSON_SORT_KEYS"] = False
    app.config["JSONIFY_PRETTYPRINT_REGULAR"] = False
    cors_origins = "*" if CORS_ORIGINS == "*" else [o.strip() for o in CORS_ORIGINS.split(",") if o.strip()]
    CORS(app, resources={r"/api/*": {"origins": cors_origins}})

    app.register_blueprint(materials_bp, url_prefix="/api/materials")
    app.register_blueprint(summary_bp, url_prefix="/api/summary")
    app.register_blueprint(flashcards_bp, url_prefix="/api/flashcards")
    app.register_blueprint(quiz_bp, url_prefix="/api/quiz")
    app.register_blueprint(schedule_bp, url_prefix="/api/schedule")
    app.register_blueprint(achievements_bp, url_prefix="/api/achievements")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(tutor_bp, url_prefix="/api/tutor")
    app.register_blueprint(insights_bp, url_prefix="/api/insights")
    app.register_blueprint(goals_bp, url_prefix="/api/goals")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from flask import request, g
    @app.before_request
    def check_auth():
        if request.method == "OPTIONS":
            return
        if request.path.startswith("/api/auth/") or request.path.startswith("/api/health"):
            return
            
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401
            
        token = auth_header.split(" ")[1]
        user_id = storage_service.get_session(token)
        
        if not user_id:
            return jsonify({"error": "Invalid or expired session"}), 401
            
        g.user_id = user_id

    @app.route("/api/health")
    def health():
        return jsonify({
            "status": "healthy",
            "service": "StudyAI Backend",
            "storage_mode": storage_service.storage_mode,
            "ai_mode": ai_service.mode,
            "model": "llama-3.3-70b-versatile" if ai_service.mode == "groq" else "local-engine",
        })

    @app.after_request
    def add_cache_headers(response):
        if response.content_type and "application/json" in response.content_type:
            response.headers["Cache-Control"] = "no-cache"
        return response

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    print(f"StudyAI Backend running on http://localhost:{FLASK_PORT}")
    print(f"Storage mode: {storage_service.storage_mode}")
    print(f"AI mode: {ai_service.mode}")
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=FLASK_DEBUG, threaded=True)
