import secrets
from fastapi import HTTPException, status
from app.model.schemas import (
    LoginRequest,
    TokenResponse,
    UserProfile,
    AdminForgotPasswordRequest,
    AdminVerifyOtpRequest,
    AdminResetPasswordRequest,
    StudentForgotPasswordRequest,
    StudentVerifyOtpRequest,
    StudentResetPasswordRequest,
    TeacherForgotPasswordRequest,
    TeacherVerifyOtpRequest,
    TeacherResetPasswordRequest,
    MessageResponse
)
from app.model.auth_model import (
    get_admin_by_email,
    get_teacher_by_id,
    get_student_by_id,
    save_admin_reset_otp,
    verify_admin_reset_otp,
    set_admin_reset_token,
    verify_admin_reset_token,
    update_admin_password_by_email,
    get_student_by_email,
    save_student_reset_otp,
    verify_student_reset_otp,
    set_student_reset_token,
    verify_student_reset_token,
    update_student_password_by_email,
    get_teacher_by_email,
    save_teacher_reset_otp,
    verify_teacher_reset_otp,
    set_teacher_reset_token,
    verify_teacher_reset_token,
    update_teacher_password_by_email
)
from app.helper.password import verify_password, hash_password
from app.helper.mailer import send_admin_otp_email, send_student_otp_email, send_teacher_otp_email
from app.middleware.auth import create_access_token

def login_user(login_data: LoginRequest) -> TokenResponse:
    role = login_data.role.lower().strip()
    identifier = login_data.identifier.strip()
    password = login_data.password

    user_record = None
    user_id = None
    user_name = None
    user_email = None

    if role == "admin":
        # Admin strictly logs in using Email + Password
        user_record = get_admin_by_email(identifier)
        if user_record:
            user_id = user_record.get("username") or user_record.get("staff_id") or "admin"
            user_name = user_record.get("username") or "Admin"
            user_email = user_record["email"]

    elif role == "teacher":
        # Teacher strictly logs in using Teacher ID (Staff ID) + Password
        user_record = get_teacher_by_id(identifier)
        if user_record:
            user_id = user_record["teach_id"]
            user_name = user_record["teach_name"]
            user_email = user_record["email"]

    elif role == "student":
        # Student strictly logs in using Student ID (Index Number) + Password
        user_record = get_student_by_id(identifier)
        if user_record:
            user_id = user_record["std_id"]
            user_name = user_record["std_name"]
            user_email = user_record["email"]

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role specified. Must be 'admin', 'teacher', or 'student'."
        )

    if not user_record or not verify_password(password, user_record["password_hash"]):
        error_msg = {
            "admin": "Invalid email or password.",
            "teacher": "Invalid teacher ID or password.",
            "student": "Invalid student index number or password."
        }.get(role, "Invalid credentials. Please check your credentials.")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_msg
        )

    token_payload = {
        "user_id": user_id,
        "name": user_name,
        "username": user_id if role == "admin" else None,
        "email": user_email,
        "role": role,
        "dep_id": user_record.get("dep_id")
    }

    token = create_access_token(token_payload)

    profile = UserProfile(
        user_id=user_id,
        name=user_name,
        username=user_id if role == "admin" else None,
        email=user_email,
        role=role,
        dep_id=user_record.get("dep_id")
    )

    return TokenResponse(access_token=token, token_type="bearer", user=profile)

def request_admin_otp(req: AdminForgotPasswordRequest) -> dict:
    """Checks if email belongs to an administrator and sends a 6-digit OTP."""
    admin = get_admin_by_email(req.email)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No administrator account found with this email address. Please check and try again."
        )

    # Generate a cryptographically secure 6-digit OTP code (100000 - 999999)
    otp_code = str(secrets.randbelow(900000) + 100000)

    # Store OTP in database with 10-minute expiry
    save_admin_reset_otp(admin["email"], otp_code, valid_minutes=10)

    # Send OTP to the admin's email using Gmail SMTP
    mail_sent = send_admin_otp_email(admin["email"], otp_code, valid_minutes=10)

    return {
        "success": True,
        "message": f"A 6-digit verification code has been dispatched to {admin['email']}.",
        "email": admin["email"]
    }

def verify_admin_otp(req: AdminVerifyOtpRequest) -> dict:
    """Validates the 6-digit OTP code and issues a reset session token."""
    record = verify_admin_reset_otp(req.email, req.otp)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check the code and try again."
        )

    # Generate a secure one-time reset token for changing the password
    reset_token = secrets.token_urlsafe(32)
    set_admin_reset_token(record["id"], reset_token)

    return {
        "success": True,
        "message": "Verification code successfully validated.",
        "reset_token": reset_token
    }

def reset_admin_password(req: AdminResetPasswordRequest) -> dict:
    """Verifies reset token and updates the administrator's password hash in the database."""
    record = verify_admin_reset_token(req.email, req.reset_token)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your password reset session has expired or is invalid. Please request a new verification code."
        )

    clean_new_password = req.new_password.strip()
    if len(clean_new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters in length."
        )

    admin = get_admin_by_email(req.email)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Administrator account could not be found."
        )

    new_hash = hash_password(clean_new_password)
    update_admin_password_by_email(admin["email"], new_hash)

    return {
        "success": True,
        "message": "Administrator password has been successfully updated. You may now log in with your new credentials."
    }

def request_student_otp(req: StudentForgotPasswordRequest) -> dict:
    """Securely checks if email belongs to a student and sends a 6-digit OTP."""
    student = get_student_by_email(req.email)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No student account found with this email address. Please check and try again."
        )

    # Generate a cryptographically secure 6-digit OTP code (100000 - 999999)
    otp_code = str(secrets.randbelow(900000) + 100000)

    # Store OTP in student_password_resets table with 10-minute expiry
    save_student_reset_otp(student["email"], student["std_id"], otp_code, valid_minutes=10)

    # Send OTP to the student's email using Gmail SMTP
    send_student_otp_email(student["email"], student.get("std_name", "Student"), otp_code, valid_minutes=10)

    return {
        "success": True,
        "message": f"A 6-digit verification code has been dispatched to {student['email']}.",
        "email": student["email"],
        "std_id": student["std_id"]
    }

def verify_student_otp(req: StudentVerifyOtpRequest) -> dict:
    """Validates the student's 6-digit OTP code and issues a reset session token."""
    record = verify_student_reset_otp(req.email, req.otp)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check the code and try again."
        )

    # Generate a secure one-time reset token for changing the password
    reset_token = secrets.token_urlsafe(32)
    set_student_reset_token(record["id"], reset_token)

    return {
        "success": True,
        "message": "Verification code successfully validated.",
        "reset_token": reset_token
    }

def reset_student_password(req: StudentResetPasswordRequest) -> dict:
    """Verifies reset token and updates the student's password hash in the database."""
    record = verify_student_reset_token(req.email, req.reset_token)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your password reset session has expired or is invalid. Please request a new verification code."
        )

    clean_new_password = req.new_password.strip()
    if len(clean_new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters in length."
        )

    student = get_student_by_email(req.email)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student account could not be found."
        )

    new_hash = hash_password(clean_new_password)
    update_student_password_by_email(student["email"], new_hash)

    return {
        "success": True,
        "message": "Student password has been successfully updated. You may now log in with your new credentials.",
        "std_id": student["std_id"]
    }

def request_teacher_otp(req: TeacherForgotPasswordRequest) -> dict:
    """Securely checks if email belongs to a teacher and sends a 6-digit OTP."""
    teacher = get_teacher_by_email(req.email)
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No faculty account found with this email address. Please check and try again."
        )

    # Generate a cryptographically secure 6-digit OTP code (100000 - 999999)
    otp_code = str(secrets.randbelow(900000) + 100000)

    # Store OTP in teacher_password_resets table with 10-minute expiry
    save_teacher_reset_otp(teacher["email"], teacher["teach_id"], otp_code, valid_minutes=10)

    # Send OTP to the teacher's email using Gmail SMTP
    send_teacher_otp_email(teacher["email"], teacher.get("teach_name", "Faculty Member"), otp_code, valid_minutes=10)

    return {
        "success": True,
        "message": f"A 6-digit verification code has been dispatched to {teacher['email']}.",
        "email": teacher["email"],
        "teach_id": teacher["teach_id"]
    }

def verify_teacher_otp(req: TeacherVerifyOtpRequest) -> dict:
    """Validates the teacher's 6-digit OTP code and issues a reset session token."""
    record = verify_teacher_reset_otp(req.email, req.otp)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check the code and try again."
        )

    # Generate a secure one-time reset token for changing the password
    reset_token = secrets.token_urlsafe(32)
    set_teacher_reset_token(record["id"], reset_token)

    return {
        "success": True,
        "message": "Verification code successfully validated.",
        "reset_token": reset_token
    }

def reset_teacher_password(req: TeacherResetPasswordRequest) -> dict:
    """Verifies reset token and updates the teacher's password hash in the database."""
    record = verify_teacher_reset_token(req.email, req.reset_token)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your password reset session has expired or is invalid. Please request a new verification code."
        )

    clean_new_password = req.new_password.strip()
    if len(clean_new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters in length."
        )

    teacher = get_teacher_by_email(req.email)
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty account could not be found."
        )

    new_hash = hash_password(clean_new_password)
    update_teacher_password_by_email(teacher["email"], new_hash)

    return {
        "success": True,
        "message": "Faculty password has been successfully updated. You may now log in with your new credentials.",
        "teach_id": teacher["teach_id"]
    }



