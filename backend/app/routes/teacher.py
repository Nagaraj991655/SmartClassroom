from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from app.middleware.auth import require_role
from app.model.schemas import GradeSubmissionRequest
from app.controller.teacher_controller import (
    list_teacher_subjects,
    list_teacher_assignments,
    create_teacher_assignment,
    get_assignment_details_and_submissions,
    grade_student_submission
)

router = APIRouter(
    prefix="/api/teacher",
    tags=["Teacher"],
    dependencies=[Depends(require_role("teacher"))]
)

@router.get("/subjects")
def get_my_subjects(current_user: dict = Depends(require_role("teacher"))):
    return list_teacher_subjects(current_user["user_id"])

@router.get("/assignments")
def get_my_assignments(current_user: dict = Depends(require_role("teacher"))):
    return list_teacher_assignments(current_user["user_id"])

@router.post("/assignments")
def create_new_assignment(
    sub_id: int = Form(...),
    ass_name: str = Form(...),
    description: Optional[str] = Form(None),
    start_at: str = Form(...),
    end_at: str = Form(...),
    deadline_reminder_hr: int = Form(1),
    question_file: Optional[UploadFile] = File(None),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: dict = Depends(require_role("teacher"))
):
    return create_teacher_assignment(
        teach_id=current_user["user_id"],
        sub_id=sub_id,
        ass_name=ass_name,
        description=description,
        start_at=start_at,
        end_at=end_at,
        deadline_reminder_hr=deadline_reminder_hr,
        question_file=question_file,
        background_tasks=background_tasks
    )

@router.get("/assignments/{assignment_id}/submissions")
def get_assignment_submissions(
    assignment_id: int,
    current_user: dict = Depends(require_role("teacher"))
):
    return get_assignment_details_and_submissions(assignment_id, current_user["user_id"])

@router.post("/submissions/{submission_id}/grade")
def grade_submission(
    submission_id: int,
    grade_data: GradeSubmissionRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: dict = Depends(require_role("teacher"))
):
    return grade_student_submission(
        submission_id=submission_id,
        teach_id=current_user["user_id"],
        grade_data=grade_data,
        background_tasks=background_tasks
    )
