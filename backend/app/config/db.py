import os
import pymysql
import pymysql.cursors
from contextlib import contextmanager

try:
    from app.config.settings import settings
except ImportError:
    settings = None

# Default MySQL connection parameters per SRS / Local setup
DEFAULT_HOST = getattr(settings, "DB_HOST", "localhost") if settings else os.getenv("DB_HOST", "localhost")
DEFAULT_PORT = getattr(settings, "DB_PORT", 3306) if settings else int(os.getenv("DB_PORT", 3306))
DEFAULT_USER = getattr(settings, "DB_USER", "root") if settings else os.getenv("DB_USER", "root")
DEFAULT_PASSWORD = getattr(settings, "DB_PASSWORD", "") if settings else os.getenv("DB_PASSWORD", "")
DEFAULT_NAME = getattr(settings, "DB_NAME", "smart_class") if settings else os.getenv("DB_NAME", "smart_class")

def get_db_connection():
    """
    Creates and returns a MySQL database connection using PyMySQL.
    Connects to localhost with user 'root', empty password, and database 'smart_class'.
    """
    return pymysql.connect(
        host=DEFAULT_HOST,
        port=DEFAULT_PORT,
        user=DEFAULT_USER,
        password=DEFAULT_PASSWORD,
        database=DEFAULT_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
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
