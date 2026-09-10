from typing import List, Dict, Any, Optional
from app.config.db import fetch_all, fetch_one, execute_query, execute_insert, get_db_cursor

# Departments
def get_all_departments() -> List[Dict[str, Any]]:
    sql = "SELECT * FROM departments ORDER BY dep_name ASC"
    return fetch_all(sql)

def create_department(dep_name: str) -> int:
    sql = "INSERT INTO departments (dep_name) VALUES (%s)"
    return execute_insert(sql, (dep_name,))

# Subjects
def get_all_subjects() -> List[Dict[str, Any]]:
    sql = "SELECT * FROM subjects ORDER BY sub_name ASC"
    return fetch_all(sql)

def create_subject(sub_name: str) -> int:
    sql = "INSERT INTO subjects (sub_name) VALUES (%s)"
    return execute_insert(sql, (sub_name,))

def link_department_subject(dep_id: int, sub_id: int):
    sql = "INSERT IGNORE INTO department_subjects (dep_id, sub_id) VALUES (%s, %s)"
    return execute_query(sql, (dep_id, sub_id))

def get_subjects_by_department(dep_id: int) -> List[Dict[str, Any]]:
    sql = """
        SELECT s.sub_id, s.sub_name 
        FROM subjects s
        JOIN department_subjects ds ON s.sub_id = ds.sub_id
        WHERE ds.dep_id = %s
        ORDER BY s.sub_name ASC
    """
    return fetch_all(sql, (dep_id,))

# Teachers
def get_all_teachers() -> List[Dict[str, Any]]:
    sql = """
        SELECT t.teach_id, t.teach_name, t.email, t.created_at,
               GROUP_CONCAT(s.sub_name SEPARATOR ', ') AS subjects_taught,
               GROUP_CONCAT(s.sub_id SEPARATOR ',') AS subject_ids
        FROM teachers t
        LEFT JOIN teacher_subjects ts ON t.teach_id = ts.teach_id
        LEFT JOIN subjects s ON ts.sub_id = s.sub_id
        GROUP BY t.teach_id
        ORDER BY t.teach_name ASC
    """
    return fetch_all(sql)

def create_teacher(teach_id: str, teach_name: str, email: str, password_hash: str, subject_ids: List[int] = None) -> bool:
    with get_db_cursor() as cursor:
        cursor.execute(
            "INSERT INTO teachers (teach_id, teach_name, email, password_hash) VALUES (%s, %s, %s, %s)",
            (teach_id, teach_name, email, password_hash)
        )
        if subject_ids:
            for sub_id in subject_ids:
                cursor.execute(
                    "INSERT INTO teacher_subjects (teach_id, sub_id) VALUES (%s, %s)",
                    (teach_id, sub_id)
                )
    return True

# Students
def get_all_students() -> List[Dict[str, Any]]:
    sql = """
        SELECT s.std_id, s.std_name, s.email, s.dep_id, s.created_at, d.dep_name,
               GROUP_CONCAT(sub.sub_name SEPARATOR ', ') AS enrolled_subjects,
               GROUP_CONCAT(sub.sub_id SEPARATOR ',') AS enrolled_subject_ids
        FROM students s
        LEFT JOIN departments d ON s.dep_id = d.dep_id
        LEFT JOIN student_subjects ss ON s.std_id = ss.std_id
        LEFT JOIN subjects sub ON ss.sub_id = sub.sub_id
        GROUP BY s.std_id
        ORDER BY s.std_name ASC
    """
    return fetch_all(sql)

def create_student(std_id: str, std_name: str, email: str, password_hash: str, dep_id: int, subject_ids: List[int] = None) -> bool:
    with get_db_cursor() as cursor:
        cursor.execute(
            "INSERT INTO students (std_id, std_name, email, password_hash, dep_id) VALUES (%s, %s, %s, %s, %s)",
            (std_id, std_name, email, password_hash, dep_id)
        )
        if subject_ids:
            for sub_id in subject_ids:
                cursor.execute(
                    "INSERT INTO student_subjects (std_id, sub_id) VALUES (%s, %s)",
                    (std_id, sub_id)
                )
    return True

# Overview Statistics
def get_system_stats() -> Dict[str, int]:
    stats = {}
    stats["students_count"] = fetch_one("SELECT COUNT(*) as c FROM students")["c"]
    stats["teachers_count"] = fetch_one("SELECT COUNT(*) as c FROM teachers")["c"]
    stats["departments_count"] = fetch_one("SELECT COUNT(*) as c FROM departments")["c"]
    stats["subjects_count"] = fetch_one("SELECT COUNT(*) as c FROM subjects")["c"]
    stats["assignments_count"] = fetch_one("SELECT COUNT(*) as c FROM assignments")["c"]
    stats["submissions_count"] = fetch_one("SELECT COUNT(*) as c FROM submissions")["c"]
    return stats
