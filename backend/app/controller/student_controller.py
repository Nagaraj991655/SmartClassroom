from datetime import datetime
from fastapi import UploadFile, HTTPException
from app.model.student_model import (
    get_student_profile,
    get_student_enrolled_subjects,
    get_student_assignments,
    get_assignment_for_student,
    submit_assignment,
    get_student_results,
    record_student_question_activity
)
from app.helper.storage import save_student_submission_file

def get_profile(std_id: str):
    profile = get_student_profile(std_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return profile

def get_enrolled_subjects(std_id: str):
    return get_student_enrolled_subjects(std_id)

def list_assignments(std_id: str):
    assignments = get_student_assignments(std_id)
    now = datetime.now()
    for ass in assignments:
        start_time = ass.get("start_at")
        if start_time:
            if isinstance(start_time, str):
                try:
                    start_time = datetime.fromisoformat(start_time.replace("Z", ""))
                except Exception:
                    pass
            if isinstance(start_time, datetime) and now < start_time:
                ass["is_locked"] = True
                # Security: Withhold the question paper document URL until start_at is reached
                ass["question_doc_url"] = None
            else:
                ass["is_locked"] = False
    return assignments

def handle_submission(assignment_id: int, std_id: str, file: UploadFile):
    # Verify assignment belongs to student's enrolled subjects
    assignment = get_assignment_for_student(assignment_id, std_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or not enrolled in this subject")

    now = datetime.now()

    # 1. Check start time: cannot submit before start time
    start_time = assignment["start_at"]
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time.replace("Z", ""))
    if now < start_time:
        raise HTTPException(status_code=400, detail="Submission rejected: This assignment has not opened yet.")

    # 2. Check deadline: cannot submit after deadline
    deadline = assignment["end_at"]
    if isinstance(deadline, str):
        deadline = datetime.fromisoformat(deadline.replace("Z", ""))
    if now > deadline:
        raise HTTPException(status_code=400, detail="Submission rejected: The deadline for this assignment has passed.")

    # Save to storage/student_submissions
    doc_url = save_student_submission_file(file, assignment_id, std_id)

    # Record in database
    submit_assignment(assignment_id, std_id, doc_url)

    return {
        "message": "Assignment submitted successfully",
        "doc_url": doc_url
    }

def get_my_grades(std_id: str):
    return get_student_results(std_id)

def track_question_activity(assignment_id: int, std_id: str, action: str = "view"):
    assignment = get_assignment_for_student(assignment_id, std_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or not enrolled in this subject")

    now = datetime.now()
    start_time = assignment.get("start_at")
    if start_time:
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time.replace("Z", ""))
        if now < start_time:
            raise HTTPException(status_code=403, detail="Question paper is locked until the assignment start date/time.")

    record_student_question_activity(assignment_id, std_id, action)
    return {"message": f"Question paper {action} activity recorded"}
