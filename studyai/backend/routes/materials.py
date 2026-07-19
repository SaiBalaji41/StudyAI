import uuid
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from services.file_processor import file_processor
from services.storage_service import storage_service

materials_bp = Blueprint("materials", __name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@materials_bp.route("/upload", methods=["POST"])
def upload_material():
    try:
        title = request.form.get("title", "").strip()
        raw_text = request.form.get("text", "").strip()
        url = request.form.get("url", "").strip()
        youtube_url = request.form.get("youtube_url", "").strip()
        file = request.files.get("file")

        material_id = str(uuid.uuid4())
        content = ""
        filename = ""
        source_type = "text"

        if file and file.filename:
            valid, error = file_processor.validate_file(file)
            if not valid:
                return jsonify({"error": error}), 400

            content, filename = file_processor.extract_text(file)
            source_type = filename.rsplit(".", 1)[1].lower()
            if not title:
                title = filename.rsplit(".", 1)[0]

            file.seek(0)
            file_bytes = file.read()
            storage_service.upload_file(file_bytes, filename, material_id)

        elif raw_text:
            valid, error = file_processor.validate_text_content(raw_text)
            if not valid:
                return jsonify({"error": error}), 400
            content = raw_text
            source_type = "text"
            if not title:
                title = "Pasted Text Material"
                
        elif url:
            content = file_processor.extract_from_url(url)
            source_type = "url"
            if not title:
                title = f"Web Page: {url.split('//')[-1].split('/')[0]}"
                
        elif youtube_url:
            content = file_processor.extract_from_youtube(youtube_url)
            source_type = "youtube"
            if not title:
                video_id = youtube_url.split("v=")[-1].split("&")[0] if "v=" in youtube_url else youtube_url.split("/")[-1].split("?")[0]
                title = f"YouTube Video ({video_id})"
        else:
            return jsonify({"error": "Provide a file, pasted text, web URL, or YouTube URL"}), 400

        if not content:
            return jsonify({"error": "Could not extract content from the uploaded material"}), 400

        material = {
            "id": material_id,
            "title": title,
            "filename": filename,
            "source_type": source_type,
            "content": content,
            "word_count": len(content.split()),
            "char_count": len(content),
            "created_at": _now_iso(),
        }

        storage_service.save_material(material)
        storage_service.record_study_activity()

        return jsonify({
            "message": "Material uploaded successfully",
            "material": {
                "id": material["id"],
                "title": material["title"],
                "filename": material["filename"],
                "source_type": material["source_type"],
                "word_count": material["word_count"],
                "char_count": material["char_count"],
                "created_at": material["created_at"],
            },
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@materials_bp.route("/", methods=["GET"])
def list_materials():
    materials = storage_service.list_materials()
    safe = [
        {
            "id": m["id"],
            "title": m["title"],
            "filename": m.get("filename", ""),
            "source_type": m.get("source_type", ""),
            "word_count": m.get("word_count", 0),
            "created_at": m.get("created_at", ""),
        }
        for m in materials
    ]
    return jsonify({"materials": safe})


@materials_bp.route("/search", methods=["GET"])
def search_materials():
    query = request.args.get("q", "").strip().lower()
    materials = storage_service.list_materials()
    if query:
        materials = [
            m for m in materials
            if query in m.get("title", "").lower()
            or query in m.get("content", "").lower()[:2000]
        ]
    safe = [
        {
            "id": m["id"],
            "title": m["title"],
            "filename": m.get("filename", ""),
            "source_type": m.get("source_type", ""),
            "word_count": m.get("word_count", 0),
            "created_at": m.get("created_at", ""),
        }
        for m in materials
    ]
    return jsonify({"materials": safe, "count": len(safe)})


@materials_bp.route("/<material_id>", methods=["GET"])
def get_material(material_id: str):
    material = storage_service.get_material(material_id)
    if not material:
        return jsonify({"error": "Material not found"}), 404

    return jsonify({
        "id": material["id"],
        "title": material["title"],
        "filename": material.get("filename", ""),
        "source_type": material.get("source_type", ""),
        "word_count": material.get("word_count", 0),
        "char_count": material.get("char_count", 0),
        "content_preview": material["content"][:500] + "..." if len(material["content"]) > 500 else material["content"],
        "created_at": material.get("created_at", ""),
    })


@materials_bp.route("/<material_id>", methods=["DELETE"])
def delete_material(material_id: str):
    if storage_service.delete_material(material_id):
        return jsonify({"message": "Material deleted successfully"})
    return jsonify({"error": "Material not found"}), 404


@materials_bp.route("/<material_id>/annotations", methods=["GET"])
def get_annotations(material_id: str):
    annotations = storage_service.get_annotations(material_id)
    return jsonify({"annotations": annotations})


@materials_bp.route("/<material_id>/annotations", methods=["POST"])
def save_annotations(material_id: str):
    data = request.get_json(silent=True) or {}
    annotations = data.get("annotations", [])
    saved = storage_service.save_annotations(material_id, annotations)
    return jsonify({"message": "Annotations saved successfully", "annotations": saved})
