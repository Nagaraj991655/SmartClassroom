from fastapi import APIRouter, Depends, Response
from app.model.schemas import (
    LoginRequest,
    TokenResponse,
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
from app.controller.auth_controller import (
    login_user,
    request_admin_otp,
    verify_admin_otp,
    reset_admin_password,
    request_student_otp,
    verify_student_otp,
    reset_student_password,
    request_teacher_otp,
    verify_teacher_otp,
    reset_teacher_password
)
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, response: Response):
    token_resp = login_user(data)
    response.set_cookie(
        key="smartclass_jwt",
        value=token_resp.access_token,
        max_age=7 * 24 * 3600,
        httponly=False,
        samesite="lax",
        path="/"
    )
    return token_resp

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}

# Admin Password Recovery
@router.post("/admin/forgot-password")
def admin_forgot_password(data: AdminForgotPasswordRequest):
    return request_admin_otp(data)

@router.post("/admin/verify-otp")
def admin_verify_otp(data: AdminVerifyOtpRequest):
    return verify_admin_otp(data)

@router.post("/admin/reset-password")
def admin_reset_password(data: AdminResetPasswordRequest):
    return reset_admin_password(data)

# Student Password Recovery
@router.post("/student/forgot-password")
def student_forgot_password(data: StudentForgotPasswordRequest):
    return request_student_otp(data)

@router.post("/student/verify-otp")
def student_verify_otp(data: StudentVerifyOtpRequest):
    return verify_student_otp(data)

@router.post("/student/reset-password")
def student_reset_password(data: StudentResetPasswordRequest):
    return reset_student_password(data)

# Teacher / Faculty Password Recovery
@router.post("/teacher/forgot-password")
def teacher_forgot_password(data: TeacherForgotPasswordRequest):
    return request_teacher_otp(data)

@router.post("/teacher/verify-otp")
def teacher_verify_otp(data: TeacherVerifyOtpRequest):
    return verify_teacher_otp(data)

@router.post("/teacher/reset-password")
def teacher_reset_password(data: TeacherResetPasswordRequest):
    return reset_teacher_password(data)



