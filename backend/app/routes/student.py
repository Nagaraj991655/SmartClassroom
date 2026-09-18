from fastapi import APIRouter, Depends, UploadFile, File
from app.middleware.auth import require_role
from app.controller.student_controller import (
    get_profile,
    get_enrolled_subjects,
    list_assignments,
    handle_submission,
    get_my_grades,
    track_question_activity
)

router = APIRouter(
    prefix="/api/student",
    tags=["Student"],
    dependencies=[Depends(require_role("student"))]
)

@router.get("/profile")
def get_my_profile(current_user: dict = Depends(require_role("student"))):
    return get_profile(current_user["user_id"])

@router.get("/subjects")
def get_my_subjects(current_user: dict = Depends(require_role("student"))):
    return get_enrolled_subjects(current_user["user_id"])

@router.get("/assignments")
def get_my_assignments(current_user: dict = Depends(require_role("student"))):
    return list_assignments(current_user["user_id"])

@router.post("/assignments/{assignment_id}/submit")
def submit_my_assignment(
    assignment_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role("student"))
):
    return handle_submission(assignment_id, current_user["user_id"], file)

@router.post("/assignments/{assignment_id}/activity")
def record_question_paper_activity(
    assignment_id: int,
    action: str = "view",
    current_user: dict = Depends(require_role("student"))
):
    return track_question_activity(assignment_id, current_user["user_id"], action)

@router.get("/grades")
def get_my_evaluation_results(current_user: dict = Depends(require_role("student"))):
    return get_my_grades(current_user["user_id"])
