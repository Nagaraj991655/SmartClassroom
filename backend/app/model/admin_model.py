from typing import List, Dict, Any, Optional
from app.config.db import fetch_all, fetch_one, execute_query, execute_insert, get_db_cursor

# Departments
def get_all_departments() -> List[Dict[str, Any]]:
    sql = "SELECT * FROM departments ORDER BY dep_name ASC"
    return fetch_all(sql)

def create_department(dep_name: str) -> int:
    sql = "INSERT INTO departments (dep_name) VALUES (%s)"
    return execute_insert(sql, (dep_name,))

def create_department_with_subjects(dep_name: str, subject_names: List[str]) -> Dict[str, int]:
    with get_db_cursor() as cursor:
        cursor.execute("INSERT INTO departments (dep_name) VALUES (%s)", (dep_name,))
        dep_id = cursor.lastrowid
        subjects_created = 0

        for subject_name in subject_names:
            cursor.execute("SELECT sub_id FROM subjects WHERE sub_name = %s", (subject_name,))
            subject = cursor.fetchone()
            if subject:
                sub_id = subject["sub_id"]
            else:
                cursor.execute("INSERT INTO subjects (sub_name) VALUES (%s)", (subject_name,))
                sub_id = cursor.lastrowid
                subjects_created += 1

            cursor.execute(
                "INSERT IGNORE INTO department_subjects (dep_id, sub_id) VALUES (%s, %s)",
                (dep_id, sub_id)
            )

        return {"dep_id": dep_id, "subjects_created": subjects_created}

def update_department(dep_id: int, dep_name: str) -> int:
    with get_db_cursor() as cursor:
        cursor.execute("SELECT dep_id FROM departments WHERE dep_id = %s", (dep_id,))
        if not cursor.fetchone():
            return 0
        cursor.execute(
            "UPDATE departments SET dep_name = %s WHERE dep_id = %s",
            (dep_name, dep_id)
        )
        return 1

def delete_department(dep_id: int) -> Dict[str, int]:
    with get_db_cursor() as cursor:
        cursor.execute("SELECT dep_id FROM departments WHERE dep_id = %s", (dep_id,))
        if not cursor.fetchone():
            return {"department_deleted": 0, "subjects_deleted": 0}

        cursor.execute("SELECT COUNT(*) AS count FROM students WHERE dep_id = %s", (dep_id,))
        if cursor.fetchone()["count"]:
            raise ValueError("Department cannot be deleted while students are assigned to it.")

        cursor.execute(
            """
            SELECT ds.sub_id
            FROM department_subjects ds
            LEFT JOIN department_subjects other
                ON other.sub_id = ds.sub_id AND other.dep_id <> ds.dep_id
            WHERE ds.dep_id = %s AND other.sub_id IS NULL
            """,
            (dep_id,)
        )
        exclusive_subject_ids = [row["sub_id"] for row in cursor.fetchall()]

        cursor.execute("DELETE FROM departments WHERE dep_id = %s", (dep_id,))
        for sub_id in exclusive_subject_ids:
            cursor.execute("DELETE FROM subjects WHERE sub_id = %s", (sub_id,))

        return {
            "department_deleted": 1,
            "subjects_deleted": len(exclusive_subject_ids)
        }

# Subjects
def get_all_subjects() -> List[Dict[str, Any]]:
    sql = """
        SELECT s.sub_id, s.sub_name, MIN(ds.dep_id) AS dep_id
        FROM subjects s
        LEFT JOIN department_subjects ds ON s.sub_id = ds.sub_id
        GROUP BY s.sub_id, s.sub_name
        ORDER BY s.sub_name ASC
    """
    return fetch_all(sql)

def create_subject(sub_name: str) -> int:
    sql = "INSERT INTO subjects (sub_name) VALUES (%s)"
    return execute_insert(sql, (sub_name,))

def update_subject(sub_id: int, sub_name: str, dep_id: Optional[int] = None) -> int:
    with get_db_cursor() as cursor:
        cursor.execute("SELECT sub_id FROM subjects WHERE sub_id = %s", (sub_id,))
        if not cursor.fetchone():
            return 0
        cursor.execute(
            "UPDATE subjects SET sub_name = %s WHERE sub_id = %s",
            (sub_name, sub_id)
        )
        cursor.execute("DELETE FROM department_subjects WHERE sub_id = %s", (sub_id,))
        if dep_id:
            cursor.execute(
                "INSERT INTO department_subjects (dep_id, sub_id) VALUES (%s, %s)",
                (dep_id, sub_id)
            )
        return 1

def delete_subject(sub_id: int) -> int:
    sql = "DELETE FROM subjects WHERE sub_id = %s"
    return execute_query(sql, (sub_id,))

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
