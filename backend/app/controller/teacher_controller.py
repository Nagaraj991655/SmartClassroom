from datetime import datetime
from typing import Optional
from fastapi import UploadFile, HTTPException, BackgroundTasks
from app.model.schemas import GradeSubmissionRequest
from app.model.teacher_model import (
    get_teacher_subjects,
    create_assignment,
    get_teacher_assignments,
    get_assignment_by_id,
    get_assignment_submissions_and_pending,
    grade_submission,
    get_submission_student_details,
    get_enrolled_student_emails_for_subject,
    get_subject_name_by_id
)
from app.helper.storage import save_assignment_question_file
from app.helper.mailer import send_assignment_opened_email, send_grade_published_email

def list_teacher_subjects(teach_id: str):
    return get_teacher_subjects(teach_id)

def list_teacher_assignments(teach_id: str):
    return get_teacher_assignments(teach_id)

def create_teacher_assignment(
    teach_id: str,
    sub_id: int,
    ass_name: str,
    description: Optional[str],
    start_at: str,
    end_at: str,
    deadline_reminder_hr: int,
    question_file: Optional[UploadFile],
    background_tasks: BackgroundTasks
):
    # Validate dates
    try:
        dt_start = datetime.fromisoformat(start_at.replace("Z", ""))
        dt_end = datetime.fromisoformat(end_at.replace("Z", ""))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format for start_at or end_at. Use ISO format (YYYY-MM-DDTHH:MM:SS)")

    if dt_end <= dt_start:
        raise HTTPException(status_code=400, detail="Assignment end deadline must be after opening time")

    if not (1 <= deadline_reminder_hr <= 8):
        raise HTTPException(status_code=400, detail="Deadline reminder hours must be between 1 and 8 hours")

    doc_url = None
    if question_file and question_file.filename:
        doc_url = save_assignment_question_file(question_file, prefix=f"teacher_{teach_id}")

    assignment_id = create_assignment(
        sub_id=sub_id,
        teach_id=teach_id,
        ass_name=ass_name,
        description=description,
        doc_url=doc_url,
        start_at=start_at,
        end_at=end_at,
        deadline_reminder_hr=deadline_reminder_hr
    )

    # Trigger email notification to students enrolled in subject in background
    enrolled_emails = get_enrolled_student_emails_for_subject(sub_id)
    subject_display_name = get_subject_name_by_id(sub_id) or f"Subject #{sub_id}"
    notified_count = 0
    if enrolled_emails:
        notified_count = len(enrolled_emails)
        background_tasks.add_task(
            send_assignment_opened_email,
            student_emails=enrolled_emails,
            assignment_title=ass_name,
            subject_name=subject_display_name,
            start_at=str(start_at),
            end_at=str(end_at)
        )

    return {
        "message": "Assignment created successfully",
        "assignment_id": assignment_id,
        "doc_url": doc_url,
        "notified_count": notified_count,
        "subject_name": subject_display_name
    }

def get_assignment_details_and_submissions(assignment_id: int, teach_id: str):
    data = get_assignment_submissions_and_pending(assignment_id)
    if not data:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if data["assignment"]["teach_id"] != teach_id:
        raise HTTPException(status_code=403, detail="You are not authorized to view submissions for this assignment")
    return data

def grade_student_submission(
    submission_id: int,
    teach_id: str,
    grade_data: GradeSubmissionRequest,
    background_tasks: BackgroundTasks
):
    student_details = get_submission_student_details(submission_id)
    if not student_details:
        raise HTTPException(status_code=404, detail="Submission not found")

    grade_submission(
        submission_id=submission_id,
        teach_id=teach_id,
        marks=grade_data.marks,
        feedback=grade_data.feedback
    )

    # Trigger email notification to student in background
    if student_details.get("email"):
        background_tasks.add_task(
            send_grade_published_email,
            student_email=student_details["email"],
            student_name=student_details.get("std_name", "Student"),
            assignment_title=student_details.get("ass_name", "Assignment"),
            marks=grade_data.marks,
            feedback=grade_data.feedback
        )

    return {"message": "Grade recorded successfully", "marks": grade_data.marks}
