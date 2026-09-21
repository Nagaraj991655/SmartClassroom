import os
import shutil
import uuid
import re
import mimetypes
import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config.settings import settings

ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".zip", ".rar", ".txt", ".png", ".jpg", ".jpeg"
}

def ensure_storage_directories():
    """Ensures that both storage directories exist on disk."""
    try:
        Path(settings.ASSIGNMENT_QUESTIONS_DIR).mkdir(parents=True, exist_ok=True)
        Path(settings.STUDENT_SUBMISSIONS_DIR).mkdir(parents=True, exist_ok=True)
    except Exception:
        pass

def sanitize_filename(filename: str) -> str:
    """Removes potentially dangerous characters from filename."""
    name = os.path.basename(filename)
    return re.sub(r'[^a-zA-Z0-9_.-]', '_', name)

def validate_file_extension(filename: str):
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '{ext}' is not allowed. Supported: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

def _save_to_vercel_blob(file: UploadFile, unique_name: str) -> str:
    """Uploads a file to Vercel Blob and returns its durable public URL."""
    token = settings.BLOB_READ_WRITE_TOKEN
    if not token:
        raise HTTPException(
            status_code=503,
            detail="File storage is not configured. Add BLOB_READ_WRITE_TOKEN to the Vercel environment."
        )

    content_type = file.content_type or mimetypes.guess_type(unique_name)[0] or "application/octet-stream"
    request = Request(
        f"https://blob.vercel-storage.com/{quote(unique_name, safe='')}",
        data=file.file.read(),
        method="PUT",
        headers={
            "Authorization": f"Bearer {token}",
            "x-api-version": "7",
            "x-content-type": content_type,
            "x-content-disposition": "inline"
        }
    )

    try:
        with urlopen(request, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, ValueError) as error:
        raise HTTPException(status_code=502, detail="Could not upload file to Vercel Blob.") from error

    blob_url = result.get("url")
    if not blob_url:
        raise HTTPException(status_code=502, detail="Vercel Blob returned an invalid upload response.")
    return blob_url

def _save_file(file: UploadFile, target_path: Path, unique_name: str) -> str:
    """Uses durable Blob storage in Vercel and the existing filesystem locally."""
    if os.getenv("VERCEL") == "1":
        return _save_to_vercel_blob(file, unique_name)

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return ""

def save_assignment_question_file(file: UploadFile, prefix: str = "assignment") -> str:
    """
    Saves an assignment question document into storage/assignment_questions/
    Returns the relative filename/URL.
    """
    ensure_storage_directories()
    validate_file_extension(file.filename)
    
    clean_name = sanitize_filename(file.filename)
    unique_name = f"{prefix}_{uuid.uuid4().hex[:8]}_{clean_name}"
    target_path = Path(settings.ASSIGNMENT_QUESTIONS_DIR) / unique_name
    blob_url = _save_file(file, target_path, unique_name)
    return blob_url or f"/api/files/assignment_questions/{unique_name}"

def save_student_submission_file(file: UploadFile, assignment_id: int, std_id: str) -> str:
    """
    Saves a student submitted document into storage/student_submissions/
    Returns the relative filename/URL.
    """
    ensure_storage_directories()
    validate_file_extension(file.filename)
    
    clean_name = sanitize_filename(file.filename)
    unique_name = f"sub_{assignment_id}_{std_id}_{uuid.uuid4().hex[:6]}_{clean_name}"
    target_path = Path(settings.STUDENT_SUBMISSIONS_DIR) / unique_name
    blob_url = _save_file(file, target_path, unique_name)
    return blob_url or f"/api/files/student_submissions/{unique_name}"

def get_file_path(category: str, filename: str) -> Path:
    """
    Resolves the secure on-disk path for a file in either storage category.
    """
    clean_filename = sanitize_filename(filename)
    if category == "assignment_questions":
        base_dir = Path(settings.ASSIGNMENT_QUESTIONS_DIR)
    elif category == "student_submissions":
        base_dir = Path(settings.STUDENT_SUBMISSIONS_DIR)
    else:
        raise HTTPException(status_code=400, detail="Invalid storage category")

    file_path = (base_dir / clean_filename).resolve()
    # Prevent directory traversal
    if not str(file_path).startswith(str(base_dir.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Requested file not found")

    return file_path
