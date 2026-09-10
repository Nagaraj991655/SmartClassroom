from datetime import datetime
from fastapi import UploadFile, HTTPException
from app.model.student_model import (
    get_student_profile,
    get_student_enrolled_subjects,
    get_student_assignments,
    get_assignment_for_student,
    submit_assignment,
    get_student_results
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
    return get_student_assignments(std_id)

def handle_submission(assignment_id: int, std_id: str, file: UploadFile):
    # Verify assignment belongs to student's enrolled subjects
    assignment = get_assignment_for_student(assignment_id, std_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or not enrolled in this subject")

    # Check deadline
    now = datetime.now()
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
