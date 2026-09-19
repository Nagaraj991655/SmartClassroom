import os
from pathlib import Path
from contextlib import contextmanager
from dotenv import load_dotenv
import pymysql
import pymysql.cursors

# Ensure .env is loaded into environment variables
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_file_path = BASE_DIR / ".env"
if not env_file_path.exists() and (BASE_DIR.parent / ".env").exists():
    env_file_path = BASE_DIR.parent / ".env"

if env_file_path.exists():
    load_dotenv(dotenv_path=env_file_path, override=False)

try:
    from app.config.settings import settings
except ImportError:
    settings = None

def get_db_config():
    """
    Dynamically loads database connection configuration from settings and .env.
    Supports DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
    Falls back to DB_HOST_ONLINE (on Vercel) or DB_HOST_LOCAL (local) if DB_HOST is omitted.
    """
    is_vercel = os.getenv("VERCEL", "").lower() == "1"

    # Host resolution:
    # 1. DB_HOST from settings or os.getenv takes top priority
    # 2. Vercel online host if running on Vercel
    # 3. Local host fallback
    if is_vercel:
        host = (
            (getattr(settings, "DB_HOST_ONLINE", "") if settings else "")
            or (getattr(settings, "DB_HOST", "") if settings else "")
            or os.getenv("DB_HOST_ONLINE", "")
            or os.getenv("DB_HOST", "")
        )
    else:
        host = (
            (getattr(settings, "DB_HOST", "") if settings else "")
            or (getattr(settings, "DB_HOST_LOCAL", "") if settings else "")
            or os.getenv("DB_HOST", "")
            or os.getenv("DB_HOST_LOCAL", "")
            or "localhost"
        )

    port_raw = (getattr(settings, "DB_PORT", None) if settings else None) or os.getenv("DB_PORT", 3306)
    try:
        port = int(port_raw)
    except (ValueError, TypeError):
        port = 3306

    user = (getattr(settings, "DB_USER", "") if settings else "") or os.getenv("DB_USER", "root")
    password = (
        (getattr(settings, "DB_PASSWORD", "") if settings else "")
        if (getattr(settings, "DB_PASSWORD", None) if settings else None) is not None
        else os.getenv("DB_PASSWORD", "")
    )
    database = (getattr(settings, "DB_NAME", "") if settings else "") or os.getenv("DB_NAME", "smart_class")

    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "database": database,
    }

# Backward compatibility attributes
_initial_cfg = get_db_config()
DEFAULT_HOST = _initial_cfg["host"]
DEFAULT_PORT = _initial_cfg["port"]
DEFAULT_USER = _initial_cfg["user"]
DEFAULT_PASSWORD = _initial_cfg["password"]
DEFAULT_NAME = _initial_cfg["database"]

def get_db_connection():
    """
    Creates and returns a MySQL database connection using PyMySQL.
    Reads connection credentials and host configuration dynamically from .env.
    """
    cfg = get_db_config()
    if not cfg["host"]:
        raise RuntimeError("Database host is not configured. Please set DB_HOST in your backend/.env file.")

    return pymysql.connect(
        host=cfg["host"],
        port=cfg["port"],
        user=cfg["user"],
        password=cfg["password"],
        database=cfg["database"],
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
        connect_timeout=15
    )

@contextmanager
def get_db_cursor():
    """
    Context manager that yields a dictionary cursor.
    Automatically commits transactions upon success, and rolls back on exception.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def fetch_all(sql: str, params: tuple = None):
    """Utility function to execute a query and return all rows as dicts."""
    with get_db_cursor() as cursor:
        cursor.execute(sql, params or ())
        return cursor.fetchall()

def fetch_one(sql: str, params: tuple = None):
    """Utility function to execute a query and return a single row as dict."""
    with get_db_cursor() as cursor:
        cursor.execute(sql, params or ())
        return cursor.fetchone()

def execute_query(sql: str, params: tuple = None) -> int:
    """Utility function to execute INSERT/UPDATE/DELETE and return affected rows."""
    with get_db_cursor() as cursor:
        cursor.execute(sql, params or ())
        return cursor.rowcount

def execute_insert(sql: str, params: tuple = None) -> int:
    """Utility function to execute an INSERT and return the last inserted ID."""
    with get_db_cursor() as cursor:
        cursor.execute(sql, params or ())
        return cursor.lastrowid
