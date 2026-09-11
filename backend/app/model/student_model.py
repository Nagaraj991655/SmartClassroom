from typing import List, Dict, Any, Optional
from datetime import datetime
from app.config.db import fetch_all, fetch_one, execute_query, execute_insert

def get_student_profile(std_id: str) -> Optional[Dict[str, Any]]:
    sql = """
        SELECT s.std_id, s.std_name, s.email, s.dep_id, d.dep_name, s.created_at
        FROM students s
        JOIN departments d ON s.dep_id = d.dep_id
        WHERE s.std_id = %s
    """
    return fetch_one(sql, (std_id,))

def get_student_enrolled_subjects(std_id: str) -> List[Dict[str, Any]]:
    sql = """
        SELECT s.sub_id, s.sub_name
        FROM subjects s
        JOIN student_subjects ss ON s.sub_id = ss.sub_id
        WHERE ss.std_id = %s
        ORDER BY s.sub_name ASC
    """
    return fetch_all(sql, (std_id,))

def get_student_assignments(std_id: str) -> List[Dict[str, Any]]:
    sql = """
        SELECT 
            a.assignment_id,
            a.sub_id,
            s.sub_name,
            t.teach_name,
            a.ass_name,
            a.description,
            a.doc_url AS question_doc_url,
            a.start_at,
            a.end_at,
            a.created_at,
            sub.submission_id,
            sub.doc_url AS submission_doc_url,
            sub.submitted_at,
            sub.status AS submission_status,
            g.grade_id,
            g.marks,
            g.feedback,
            g.graded_at
        FROM assignments a
        JOIN student_subjects ss ON a.sub_id = ss.sub_id AND ss.std_id = %s
        JOIN subjects s ON a.sub_id = s.sub_id
        JOIN teachers t ON a.teach_id = t.teach_id
        LEFT JOIN submissions sub ON a.assignment_id = sub.assignment_id AND sub.std_id = %s
        LEFT JOIN grades g ON sub.submission_id = g.submission_id
        ORDER BY a.end_at ASC
    """
    return fetch_all(sql, (std_id, std_id))

def get_assignment_for_student(assignment_id: int, std_id: str) -> Optional[Dict[str, Any]]:
    sql = """
        SELECT a.*, s.sub_name, t.teach_name
        FROM assignments a
        JOIN student_subjects ss ON a.sub_id = ss.sub_id AND ss.std_id = %s
        JOIN subjects s ON a.sub_id = s.sub_id
        JOIN teachers t ON a.teach_id = t.teach_id
        WHERE a.assignment_id = %s
    """
    return fetch_one(sql, (std_id, assignment_id))

def submit_assignment(assignment_id: int, std_id: str, doc_url: str) -> int:
    sql = """
        INSERT INTO submissions (assignment_id, std_id, doc_url, submitted_at, status)
        VALUES (%s, %s, %s, CURRENT_TIMESTAMP, 'submitted')
        ON DUPLICATE KEY UPDATE
            doc_url = VALUES(doc_url),
            submitted_at = CURRENT_TIMESTAMP,
            status = 'submitted'
    """
    return execute_query(sql, (assignment_id, std_id, doc_url))

def get_student_results(std_id: str) -> List[Dict[str, Any]]:
    sql = """
        SELECT 
            g.grade_id,
            g.marks,
            g.feedback,
            g.graded_at,
            a.ass_name,
            s.sub_name,
            t.teach_name,
            sub.submitted_at,
            sub.doc_url AS submission_doc_url
        FROM grades g
        JOIN submissions sub ON g.submission_id = sub.submission_id
        JOIN assignments a ON sub.assignment_id = a.assignment_id
        JOIN subjects s ON a.sub_id = s.sub_id
        JOIN teachers t ON g.teach_id = t.teach_id
        WHERE sub.std_id = %s
        ORDER BY g.graded_at DESC
    """
    return fetch_all(sql, (std_id,))
