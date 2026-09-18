from typing import List, Dict, Any, Optional
from datetime import datetime
from app.config.db import fetch_all, fetch_one, execute_query, execute_insert, get_db_cursor

def get_teacher_subjects(teach_id: str) -> List[Dict[str, Any]]:
    sql = """
        SELECT s.sub_id, s.sub_name
        FROM subjects s
        JOIN teacher_subjects ts ON s.sub_id = ts.sub_id
        WHERE ts.teach_id = %s
        ORDER BY s.sub_name ASC
    """
    return fetch_all(sql, (teach_id,))

def create_assignment(
    sub_id: int,
    teach_id: str,
    ass_name: str,
    description: Optional[str],
    doc_url: Optional[str],
    start_at: str,
    end_at: str,
    deadline_reminder_hr: int = 1
) -> int:
    sql = """
        INSERT INTO assignments 
        (sub_id, teach_id, ass_name, description, doc_url, start_at, end_at, deadline_reminder_hr)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    return execute_insert(
        sql,
        (sub_id, teach_id, ass_name, description, doc_url, start_at, end_at, deadline_reminder_hr)
    )

def get_teacher_assignments(teach_id: str) -> List[Dict[str, Any]]:
    sql = """
        SELECT a.*, s.sub_name,
            (SELECT COUNT(*) FROM student_subjects ss WHERE ss.sub_id = a.sub_id) AS total_enrolled_students,
            (SELECT COUNT(*) FROM submissions sub WHERE sub.assignment_id = a.assignment_id) AS total_submissions,
            (SELECT COUNT(*) FROM submissions sub 
             JOIN grades g ON sub.submission_id = g.submission_id 
             WHERE sub.assignment_id = a.assignment_id) AS total_graded
        FROM assignments a
        JOIN subjects s ON a.sub_id = s.sub_id
        WHERE a.teach_id = %s
        ORDER BY a.created_at DESC
    """
    return fetch_all(sql, (teach_id,))

def get_assignment_by_id(assignment_id: int) -> Optional[Dict[str, Any]]:
    sql = """
        SELECT a.*, s.sub_name, t.teach_name
        FROM assignments a
        JOIN subjects s ON a.sub_id = s.sub_id
        JOIN teachers t ON a.teach_id = t.teach_id
        WHERE a.assignment_id = %s
    """
    return fetch_one(sql, (assignment_id,))

def get_assignment_submissions_and_pending(assignment_id: int) -> Dict[str, Any]:
    """
    Returns submitted students and pending students for a specific assignment.
    """
    assignment = get_assignment_by_id(assignment_id)
    if not assignment:
        return None

    sub_id = assignment["sub_id"]

    # All enrolled students with their submission status and question paper activity if exists
    sql = """
        SELECT 
            st.std_id,
            st.std_name,
            st.email,
            d.dep_name,
            sub.submission_id,
            sub.doc_url,
            sub.submitted_at,
            sub.status AS submission_status,
            g.grade_id,
            g.marks,
            g.feedback,
            g.graded_at,
            aqv.first_viewed_at,
            aqv.last_viewed_at,
            COALESCE(aqv.view_count, 0) AS question_view_count,
            aqv.first_downloaded_at,
            aqv.last_downloaded_at,
            COALESCE(aqv.download_count, 0) AS question_download_count
        FROM student_subjects ss
        JOIN students st ON ss.std_id = st.std_id
        JOIN departments d ON st.dep_id = d.dep_id
        LEFT JOIN submissions sub ON sub.assignment_id = %s AND sub.std_id = st.std_id
        LEFT JOIN grades g ON sub.submission_id = g.submission_id
        LEFT JOIN assignment_question_views aqv ON aqv.assignment_id = %s AND aqv.std_id = st.std_id
        WHERE ss.sub_id = %s
        ORDER BY sub.submitted_at DESC, st.std_name ASC
    """
    records = fetch_all(sql, (assignment_id, assignment_id, sub_id))
    
    submitted = [r for r in records if r.get("submission_id") is not None]
    pending = [r for r in records if r.get("submission_id") is None]
    viewed_or_downloaded = [
        r for r in records 
        if (r.get("question_view_count", 0) > 0 or r.get("question_download_count", 0) > 0)
    ]

    return {
        "assignment": assignment,
        "total_enrolled": len(records),
        "submitted_count": len(submitted),
        "pending_count": len(pending),
        "viewed_count": len(viewed_or_downloaded),
        "submitted_students": submitted,
        "pending_students": pending
    }

def grade_submission(submission_id: int, teach_id: str, marks: float, feedback: Optional[str]) -> bool:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO grades (submission_id, teach_id, marks, feedback)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                marks = VALUES(marks),
                feedback = VALUES(feedback),
                teach_id = VALUES(teach_id),
                graded_at = CURRENT_TIMESTAMP
            """,
            (submission_id, teach_id, marks, feedback)
        )
        cursor.execute(
            "UPDATE submissions SET status = 'graded' WHERE submission_id = %s",
            (submission_id,)
        )
    return True

def get_submission_student_details(submission_id: int) -> Optional[Dict[str, Any]]:
    sql = """
        SELECT sub.submission_id, sub.assignment_id, st.std_id, st.std_name, st.email,
               a.ass_name, s.sub_name
        FROM submissions sub
        JOIN students st ON sub.std_id = st.std_id
        JOIN assignments a ON sub.assignment_id = a.assignment_id
        JOIN subjects s ON a.sub_id = s.sub_id
        WHERE sub.submission_id = %s
    """
    return fetch_one(sql, (submission_id,))

def get_enrolled_student_emails_for_subject(sub_id: int) -> List[str]:
    sql = """
        SELECT st.email
        FROM student_subjects ss
        JOIN students st ON ss.std_id = st.std_id
        WHERE ss.sub_id = %s
    """
    rows = fetch_all(sql, (sub_id,))
    return [r["email"] for r in rows if r.get("email")]

def get_subject_name_by_id(sub_id: int) -> Optional[str]:
    """Returns the subject display name for the given sub_id, or None if not found."""
    sql = "SELECT sub_name FROM subjects WHERE sub_id = %s"
    row = fetch_one(sql, (sub_id,))
    return row["sub_name"] if row else None
