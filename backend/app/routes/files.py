from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.helper.storage import get_file_path

router = APIRouter(prefix="/api/files", tags=["File Storage"])

@router.get("/{category}/{filename}")
def serve_file(category: str, filename: str):
    """
    Serves stored files from either:
    1. assignment_questions
    2. student_submissions
    """
    file_path = get_file_path(category, filename)
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream"
    )
