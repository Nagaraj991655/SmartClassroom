import mimetypes
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
    
    # Restrict question paper downloads if assignment start time has not arrived yet
    if category == "assignment_questions":
        try:
            from datetime import datetime
            from app.config.db import fetch_one
            sql = "SELECT start_at FROM assignments WHERE doc_url LIKE %s LIMIT 1"
            row = fetch_one(sql, (f"%{filename}",))
            if row and row.get("start_at"):
                start_at = row["start_at"]
                if isinstance(start_at, str):
                    start_at = datetime.fromisoformat(start_at.replace("Z", ""))
                if datetime.now() < start_at:
                    raise HTTPException(
                        status_code=403,
                        detail="Access denied: This question paper is locked until the assignment start date and time."
                    )
        except HTTPException:
            raise
        except Exception:
            pass

    mime_type, _ = mimetypes.guess_type(filename)
    if not mime_type:
        mime_type = "application/octet-stream"

    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type=mime_type,
        content_disposition_type="inline"
    )
