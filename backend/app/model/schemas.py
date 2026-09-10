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
    dep_id: Optional[int] = None
    dep_name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

# Admin
class CreateDepartmentRequest(BaseModel):
    dep_name: str = Field(..., min_length=2, max_length=100)

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
