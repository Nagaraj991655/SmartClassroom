from typing import Optional, Dict, Any
from app.config.db import fetch_one, execute_query, execute_insert

def get_admin_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Finds admin by email (with case-insensitive and domain variant tolerance)."""
    clean_email = email.strip().lower()
    sql = "SELECT * FROM admins WHERE LOWER(email) = %s LIMIT 1"
    admin = fetch_one(sql, (clean_email,))
    if admin:
        return admin

    # Check common Gmail domain variants (e.g. perinpamoorthytharanan2@gmail vs @gmail.com)
    if clean_email.endswith("@gmail.com"):
        alt = clean_email[:-4]  # without .com
        admin = fetch_one(sql, (alt,))
        if admin:
            return admin
    elif clean_email.endswith("@gmail"):
        alt = clean_email + ".com"
        admin = fetch_one(sql, (alt,))
        if admin:
            return admin

    return None

def save_admin_reset_otp(email: str, otp_code: str, valid_minutes: int = 10) -> int:
    """Stores a 6-digit OTP code for administrator password reset."""
    clean_email = email.strip().lower()
    # Invalidate existing active OTPs for this email
    execute_query("DELETE FROM admin_password_resets WHERE LOWER(email) = %s", (clean_email,))

    sql = """
        INSERT INTO admin_password_resets (email, otp_code, expires_at)
        VALUES (%s, %s, DATE_ADD(NOW(), INTERVAL %s MINUTE))
    """
    return execute_insert(sql, (clean_email, otp_code, valid_minutes))

def verify_admin_reset_otp(email: str, otp_code: str) -> Optional[Dict[str, Any]]:
    """Verifies whether the submitted OTP matches and is not expired."""
    clean_email = email.strip().lower()
    clean_otp = otp_code.strip()
    sql = """
        SELECT * FROM admin_password_resets 
        WHERE LOWER(email) = %s AND otp_code = %s AND expires_at > NOW()
        ORDER BY id DESC LIMIT 1
    """
    return fetch_one(sql, (clean_email, clean_otp))

def set_admin_reset_token(reset_id: int, reset_token: str) -> bool:
    """Assigns an authorized reset token to allow password change after OTP verification."""
    sql = "UPDATE admin_password_resets SET reset_token = %s WHERE id = %s"
    execute_query(sql, (reset_token, reset_id))
    return True

def verify_admin_reset_token(email: str, reset_token: str) -> Optional[Dict[str, Any]]:
    """Verifies that the authorized reset token matches and is not expired."""
    clean_email = email.strip().lower()
    sql = """
        SELECT * FROM admin_password_resets
        WHERE LOWER(email) = %s AND reset_token = %s AND expires_at > NOW()
        ORDER BY id DESC LIMIT 1
    """
    return fetch_one(sql, (clean_email, reset_token.strip()))

def update_admin_password_by_email(admin_record_email: str, password_hash: str) -> bool:
    """Updates the administrator's password in the admins table and clears reset tokens."""
    sql = "UPDATE admins SET password_hash = %s WHERE email = %s"
    execute_query(sql, (password_hash, admin_record_email))
    # Clear reset records for this email
    execute_query("DELETE FROM admin_password_resets WHERE LOWER(email) = %s", (admin_record_email.strip().lower(),))
    return True


def get_teacher_by_id(teach_id: str) -> Optional[Dict[str, Any]]:
    """Finds teacher strictly by teacher ID (teach_id)."""
    sql = "SELECT * FROM teachers WHERE teach_id = %s LIMIT 1"
    return fetch_one(sql, (teach_id,))

def get_student_by_id(std_id: str) -> Optional[Dict[str, Any]]:
    """Finds student strictly by student index number (std_id)."""
    sql = "SELECT * FROM students WHERE std_id = %s LIMIT 1"
    return fetch_one(sql, (std_id,))

def get_student_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Finds student securely by email in the students table."""
    clean_email = email.strip().lower()
    sql = "SELECT * FROM students WHERE LOWER(email) = %s LIMIT 1"
    student = fetch_one(sql, (clean_email,))
    if student:
        return student

    # Gmail domain tolerance
    if clean_email.endswith("@gmail.com"):
        alt = clean_email[:-4]
        student = fetch_one(sql, (alt,))
        if student:
            return student
    elif clean_email.endswith("@gmail"):
        alt = clean_email + ".com"
        student = fetch_one(sql, (alt,))
        if student:
            return student

    return None

def save_student_reset_otp(email: str, std_id: str, otp_code: str, valid_minutes: int = 10) -> int:
    """Stores a 6-digit OTP code for student password reset."""
    clean_email = email.strip().lower()
    execute_query("DELETE FROM student_password_resets WHERE LOWER(email) = %s", (clean_email,))
    sql = """
        INSERT INTO student_password_resets (email, std_id, otp_code, expires_at)
        VALUES (%s, %s, %s, DATE_ADD(NOW(), INTERVAL %s MINUTE))
    """
    return execute_insert(sql, (clean_email, std_id, otp_code, valid_minutes))

def verify_student_reset_otp(email: str, otp_code: str) -> Optional[Dict[str, Any]]:
    """Verifies whether the student submitted OTP matches and is not expired."""
    clean_email = email.strip().lower()
    clean_otp = otp_code.strip()
    sql = """
        SELECT * FROM student_password_resets 
        WHERE LOWER(email) = %s AND otp_code = %s AND expires_at > NOW()
        ORDER BY id DESC LIMIT 1
    """
    return fetch_one(sql, (clean_email, clean_otp))

def set_student_reset_token(reset_id: int, reset_token: str) -> bool:
    """Assigns an authorized reset token for student password change."""
    sql = "UPDATE student_password_resets SET reset_token = %s WHERE id = %s"
    execute_query(sql, (reset_token, reset_id))
    return True

def verify_student_reset_token(email: str, reset_token: str) -> Optional[Dict[str, Any]]:
    """Verifies that the authorized student reset token matches and is not expired."""
    clean_email = email.strip().lower()
    sql = """
        SELECT * FROM student_password_resets
        WHERE LOWER(email) = %s AND reset_token = %s AND expires_at > NOW()
        ORDER BY id DESC LIMIT 1
    """
    return fetch_one(sql, (clean_email, reset_token.strip()))

def update_student_password_by_email(student_email: str, password_hash: str) -> bool:
    """Updates the student's password in the students table and clears reset tokens."""
    clean_email = student_email.strip().lower()
    sql = "UPDATE students SET password_hash = %s WHERE LOWER(email) = %s"
    execute_query(sql, (password_hash, clean_email))
    execute_query("DELETE FROM student_password_resets WHERE LOWER(email) = %s", (clean_email,))
    return True

def get_teacher_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Finds teacher securely by email in the teachers table."""
    clean_email = email.strip().lower()
    sql = "SELECT * FROM teachers WHERE LOWER(email) = %s LIMIT 1"
    teacher = fetch_one(sql, (clean_email,))
    if teacher:
        return teacher

    # Gmail domain tolerance
    if clean_email.endswith("@gmail.com"):
        alt = clean_email[:-4]
        teacher = fetch_one(sql, (alt,))
        if teacher:
            return teacher
    elif clean_email.endswith("@gmail"):
        alt = clean_email + ".com"
        teacher = fetch_one(sql, (alt,))
        if teacher:
            return teacher

    return None

def save_teacher_reset_otp(email: str, teach_id: str, otp_code: str, valid_minutes: int = 10) -> int:
    """Stores a 6-digit OTP code for teacher password reset."""
    clean_email = email.strip().lower()
    execute_query("DELETE FROM teacher_password_resets WHERE LOWER(email) = %s", (clean_email,))
    sql = """
        INSERT INTO teacher_password_resets (email, teach_id, otp_code, expires_at)
        VALUES (%s, %s, %s, DATE_ADD(NOW(), INTERVAL %s MINUTE))
    """
    return execute_insert(sql, (clean_email, teach_id, otp_code, valid_minutes))

def verify_teacher_reset_otp(email: str, otp_code: str) -> Optional[Dict[str, Any]]:
    """Verifies whether the teacher submitted OTP matches and is not expired."""
    clean_email = email.strip().lower()
    clean_otp = otp_code.strip()
    sql = """
        SELECT * FROM teacher_password_resets 
        WHERE LOWER(email) = %s AND otp_code = %s AND expires_at > NOW()
        ORDER BY id DESC LIMIT 1
    """
    return fetch_one(sql, (clean_email, clean_otp))

def set_teacher_reset_token(reset_id: int, reset_token: str) -> bool:
    """Assigns an authorized reset token for teacher password change."""
    sql = "UPDATE teacher_password_resets SET reset_token = %s WHERE id = %s"
    execute_query(sql, (reset_token, reset_id))
    return True

def verify_teacher_reset_token(email: str, reset_token: str) -> Optional[Dict[str, Any]]:
    """Verifies that the authorized teacher reset token matches and is not expired."""
    clean_email = email.strip().lower()
    sql = """
        SELECT * FROM teacher_password_resets
        WHERE LOWER(email) = %s AND reset_token = %s AND expires_at > NOW()
        ORDER BY id DESC LIMIT 1
    """
    return fetch_one(sql, (clean_email, reset_token.strip()))

def update_teacher_password_by_email(teacher_email: str, password_hash: str) -> bool:
    """Updates the teacher's password in the teachers table and clears reset tokens."""
    clean_email = teacher_email.strip().lower()
    sql = "UPDATE teachers SET password_hash = %s WHERE LOWER(email) = %s"
    execute_query(sql, (password_hash, clean_email))
    execute_query("DELETE FROM teacher_password_resets WHERE LOWER(email) = %s", (clean_email,))
    return True


