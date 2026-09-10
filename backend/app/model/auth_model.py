from typing import Optional, Dict, Any
from app.config.db import fetch_one

def get_admin_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Finds admin strictly by email."""
    sql = "SELECT * FROM admins WHERE email = %s LIMIT 1"
    return fetch_one(sql, (email,))

def get_teacher_by_id(teach_id: str) -> Optional[Dict[str, Any]]:
    """Finds teacher strictly by teacher ID (teach_id)."""
    sql = "SELECT * FROM teachers WHERE teach_id = %s LIMIT 1"
    return fetch_one(sql, (teach_id,))

def get_student_by_id(std_id: str) -> Optional[Dict[str, Any]]:
    """Finds student strictly by student index number (std_id)."""
    sql = "SELECT * FROM students WHERE std_id = %s LIMIT 1"
    return fetch_one(sql, (std_id,))
