from fastapi import APIRouter, Depends
from app.model.schemas import LoginRequest, TokenResponse
from app.controller.auth_controller import login_user
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    return login_user(data)

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}
