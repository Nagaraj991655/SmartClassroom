from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# Auth
class LoginRequest(BaseModel):
    role: str = Field(..., description="Role: admin, teacher, or student")
    identifier: str = Field(..., description="Staff ID / Index No / Email")
    password: str = Field(..., min_length=1)

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    username: Optional[str] = None
    dep_id: Optional[int] = None
    dep_name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

class AdminForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, description="Administrator registered email")

class AdminVerifyOtpRequest(BaseModel):
    email: str = Field(..., min_length=3, description="Administrator registered email")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")

class AdminResetPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, description="Administrator registered email")
    reset_token: str = Field(..., min_length=10, description="Verification session token")
    new_password: str = Field(..., min_length=6, description="New password (minimum 6 characters)")

# Student Password Reset
class StudentForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, description="Student registered email")

class StudentVerifyOtpRequest(BaseModel):
    email: str = Field(..., min_length=3, description="Student registered email")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")

class StudentResetPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, description="Student registered email")
    reset_token: str = Field(..., min_length=10, description="Verification session token")
    new_password: str = Field(..., min_length=6, description="New password (minimum 6 characters)")

# Teacher Password Reset
class TeacherForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, description="Faculty registered email")

class TeacherVerifyOtpRequest(BaseModel):
    email: str = Field(..., min_length=3, description="Faculty registered email")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")

class TeacherResetPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, description="Faculty registered email")
    reset_token: str = Field(..., min_length=10, description="Verification session token")
    new_password: str = Field(..., min_length=6, description="New password (minimum 6 characters)")

# Admin
class CreateDepartmentRequest(BaseModel):
    dep_name: str = Field(..., min_length=2, max_length=100)
    subject_names: Optional[List[str]] = None

class CreateSubjectRequest(BaseModel):
    sub_name: str = Field(..., min_length=2, max_length=100)
    dep_id: Optional[int] = None

class CreateTeacherRequest(BaseModel):
    teach_id: str = Field(..., min_length=2, max_length=20)
    teach_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    subject_ids: Optional[List[int]] = []

class CreateStudentRequest(BaseModel):
    std_id: str = Field(..., min_length=2, max_length=20)
    std_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    dep_id: int
    subject_ids: Optional[List[int]] = []

# Teacher
class GradeSubmissionRequest(BaseModel):
    marks: float = Field(..., ge=0, le=100, description="Score between 0 and 100")
    feedback: Optional[str] = None

# Generic
class MessageResponse(BaseModel):
    message: str
    success: bool = True
