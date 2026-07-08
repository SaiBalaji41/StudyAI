from flask import Flask, jsonify
from flask_cors import CORS

from config import FLASK_DEBUG, FLASK_PORT, FLASK_SECRET_KEY
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
from services.ai_service import ai_service
from services.storage_service import storage_service


def create_app() -> Flask:
    app = Flask(__name__)
    app.secret_key = FLASK_SECRET_KEY
    app.config["JSON_SORT_KEYS"] = False
    app.config["JSONIFY_PRETTYPRINT_REGULAR"] = False
    CORS(app, resources={r"/api/*": {"origins": "*"}})

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
