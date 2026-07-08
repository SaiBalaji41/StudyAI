import io
from pathlib import Path

from werkzeug.datastructures import FileStorage

from config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE


class FileProcessor:
    @staticmethod
    def allowed_file(filename: str) -> bool:
        return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def validate_file(file: FileStorage) -> tuple[bool, str]:
        if not file or not file.filename:
            return False, "No file provided"

        if not FileProcessor.allowed_file(file.filename):
            return False, f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"

        file.seek(0, 2)
        size = file.tell()
        file.seek(0)

        if size > MAX_FILE_SIZE:
            return False, f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)} MB"

        if size == 0:
            return False, "File is empty"

        return True, ""

    @staticmethod
    def extract_text(file: FileStorage) -> tuple[str, str]:
        filename = file.filename or "unknown"
        ext = filename.rsplit(".", 1)[1].lower()
        file.seek(0)

        if ext == "txt":
            content = file.read().decode("utf-8", errors="ignore")
            return content.strip(), filename

        if ext == "pdf":
            return FileProcessor._extract_pdf(file), filename

        if ext == "docx":
            return FileProcessor._extract_docx(file), filename

        raise ValueError(f"Unsupported file type: {ext}")

    @staticmethod
    def _extract_pdf(file: FileStorage) -> str:
        from PyPDF2 import PdfReader

        reader = PdfReader(io.BytesIO(file.read()))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages).strip()

    @staticmethod
    def _extract_docx(file: FileStorage) -> str:
        from docx import Document

        doc = Document(io.BytesIO(file.read()))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs).strip()

    @staticmethod
    def validate_text_content(text: str) -> tuple[bool, str]:
        cleaned = text.strip()
        if not cleaned:
            return False, "Text content is empty"
        if len(cleaned) < 50:
            return False, "Text content is too short (minimum 50 characters)"
        if len(cleaned) > 50000:
            return False, "Text content is too long (maximum 50,000 characters)"
        return True, ""


file_processor = FileProcessor()
