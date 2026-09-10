import logging
from app.config.db import fetch_one, execute_insert, execute_query, get_db_cursor
from app.helper.password import hash_password

logger = logging.getLogger("smartclassroom.seed")

def run_seed():
    """
    Seeds default admin, departments, and subjects if the database is newly initialized.
    """
    try:
        # 1. Admin
        admin = fetch_one("SELECT * FROM admins LIMIT 1")
        if not admin:
            hashed = hash_password("admin123")
            execute_insert(
                "INSERT INTO admins (staff_id, email, password_hash) VALUES (%s, %s, %s)",
                ("ADM001", "admin@ucj.ac.lk", hashed)
            )
            logger.info("Created default administrator: ADM001 / admin@ucj.ac.lk / admin123")

        # 2. Departments
        dep_count = fetch_one("SELECT COUNT(*) AS c FROM departments")["c"]
        if dep_count == 0:
            execute_query(
                "INSERT INTO departments (dep_id, dep_name) VALUES (1, 'IT'), (2, 'Civil'), (3, 'Arts')"
            )
            logger.info("Created default departments: IT, Civil, Arts")

        # 3. Subjects
        sub_count = fetch_one("SELECT COUNT(*) AS c FROM subjects")["c"]
        if sub_count == 0:
            execute_query(
                """
                INSERT INTO subjects (sub_id, sub_name) VALUES 
                (1, 'Java Programming'), 
                (2, 'Mathematics for Computing'), 
                (3, 'Technical English'), 
                (4, 'Civil Engineering Drawing'), 
                (5, 'Tamil Literature')
                """
            )
            # Department Subjects
            execute_query(
                """
                INSERT IGNORE INTO department_subjects (dep_id, sub_id) VALUES 
                (1, 1), (1, 2), (1, 3),
                (2, 4), (2, 2), (2, 3),
                (3, 5), (3, 3)
                """
            )
            logger.info("Created default subjects and department links")

    except Exception as e:
        logger.error(f"Seed check error: {e}")
