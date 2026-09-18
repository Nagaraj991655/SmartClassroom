from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory containing .env
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # Comma-separated browser origins allowed to call the API.
    CORS_ORIGINS: str = "*"

    # Local development uses DB_HOST_LOCAL; Vercel uses DB_HOST_ONLINE.
    DB_HOST_LOCAL: str = "localhost"
    DB_HOST_ONLINE: str = ""
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "smart_class"

    # JWT Authentication
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Google App Password Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "SmartClassroom-UCJ"

    # Storage Directories
    ASSIGNMENT_QUESTIONS_DIR: str = "storage/assignment_questions"
    STUDENT_SUBMISSIONS_DIR: str = "storage/student_submissions"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
