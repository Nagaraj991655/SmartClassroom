import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory containing .env
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_file_path = BASE_DIR / ".env"
if not env_file_path.exists() and (BASE_DIR.parent / ".env").exists():
    env_file_path = BASE_DIR.parent / ".env"

if env_file_path.exists():
    load_dotenv(dotenv_path=env_file_path, override=False)

class Settings(BaseSettings):
    # Comma-separated browser origins allowed to call the API.
    CORS_ORIGINS: str = "*"

    # Database Configuration loaded from .env (locally) or Vercel Environment Variables (cloud)
    DB_HOST: str = ""
    DB_HOST_LOCAL: str = "localhost"
    DB_HOST_ONLINE: str = ""
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "smart_class"

    # JWT Authentication
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Google App Password Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "SmartClassroom-UCJ"

    # Storage Directories (uses /tmp on Vercel serverless environment)
    ASSIGNMENT_QUESTIONS_DIR: str = "/tmp/assignment_questions" if os.getenv("VERCEL") == "1" else "storage/assignment_questions"
    STUDENT_SUBMISSIONS_DIR: str = "/tmp/student_submissions" if os.getenv("VERCEL") == "1" else "storage/student_submissions"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
