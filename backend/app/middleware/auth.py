import jwt
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config.settings import settings

security = HTTPBearer()

def create_access_token(data: Dict[str, Any], expires_delta: timedelta = None) -> str:
    """
    Creates a signed JWT token containing user identity and role.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT token.
    Raises HTTPException 401 if token is expired or invalid.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    FastAPI dependency to extract and authenticate the current user from Bearer token.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    user_id = payload.get("user_id")
    role = payload.get("role")
    
    if not user_id or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user identity or role.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return payload

def require_role(*allowed_roles: str):
    """
    FastAPI dependency factory for Role-Based Access Control (RBAC).
    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role("admin"))])
        def admin_view(current_user: dict = Depends(get_current_user)):
            ...
    """
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "").lower()
        allowed = [r.lower() for r in allowed_roles]
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Required role ({', '.join(allowed_roles)}), but your role is '{user_role}'"
            )
        return current_user

    return role_checker
