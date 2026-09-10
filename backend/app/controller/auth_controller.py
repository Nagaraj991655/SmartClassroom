from fastapi import HTTPException, status
from app.model.schemas import LoginRequest, TokenResponse, UserProfile
from app.model.auth_model import get_admin_by_email, get_teacher_by_id, get_student_by_id
from app.helper.password import verify_password
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
            user_id = user_record["staff_id"]
            user_name = f"Admin ({user_record['staff_id']})"
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
        "email": user_email,
        "role": role,
        "dep_id": user_record.get("dep_id")
    }

    token = create_access_token(token_payload)

    profile = UserProfile(
        user_id=user_id,
        name=user_name,
        email=user_email,
        role=role,
        dep_id=user_record.get("dep_id")
    )

    return TokenResponse(access_token=token, token_type="bearer", user=profile)
