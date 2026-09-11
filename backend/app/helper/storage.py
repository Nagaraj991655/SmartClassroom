import os
import shutil
import uuid
import re
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config.settings import settings

ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".zip", ".rar", ".txt", ".png", ".jpg", ".jpeg"
}

def ensure_storage_directories():
    """Ensures that both storage directories exist on disk."""
    Path(settings.ASSIGNMENT_QUESTIONS_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.STUDENT_SUBMISSIONS_DIR).mkdir(parents=True, exist_ok=True)

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
    
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return f"/api/files/assignment_questions/{unique_name}"

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
    
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return f"/api/files/student_submissions/{unique_name}"

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
