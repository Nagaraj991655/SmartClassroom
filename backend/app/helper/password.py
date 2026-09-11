import os
import hmac
import hashlib
import secrets
import importlib

def _get_bcrypt_module():
    """
    Dynamically loads bcrypt to avoid static analysis missing-import warnings
    in environments where the linter queries global system Python.
    """
    try:
        return importlib.import_module("bcrypt")
    except Exception:
        return None

_bcrypt = _get_bcrypt_module()

def hash_password(password: str) -> str:
    """
    Hashes a plain text password.
    Uses bcrypt if available, and falls back to PBKDF2-SHA256.
    """
    if not password:
        raise ValueError("Password cannot be empty")

    bc = _bcrypt or _get_bcrypt_module()
    if bc is not None:
        password_bytes = password.encode("utf-8")
        salt = bc.gensalt(rounds=12)
        hashed_bytes = bc.hashpw(password_bytes, salt)
        return hashed_bytes.decode("utf-8")
    else:
        # Standard library fallback (zero third-party dependencies)
        salt = secrets.token_hex(16)
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return f"pbkdf2:sha256:100000${salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a hashed password string.
    Supports both bcrypt hashes ($2b$, $2a$, $2y$) and PBKDF2 standard hashes.
    """
    if not plain_password or not hashed_password:
        return False

    try:
        # 1. Bcrypt hash check ($2b$, $2a$, $2y$)
        if hashed_password.startswith(("$2b$", "$2a$", "$2y$")):
            bc = _bcrypt or _get_bcrypt_module()
            if bc is not None:
                return bc.checkpw(
                    plain_password.encode("utf-8"),
                    hashed_password.encode("utf-8")
                )
            return False

        # 2. PBKDF2 hash check
        if hashed_password.startswith("pbkdf2:sha256:"):
            parts = hashed_password.split("$")
            if len(parts) == 3:
                salt = parts[1]
                expected_key_hex = parts[2]
                key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
                return hmac.compare_digest(key.hex(), expected_key_hex)

        return False
    except Exception:
        return False
