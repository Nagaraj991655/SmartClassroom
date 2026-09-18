import logging
from app.config.db import fetch_one, execute_insert, execute_query, get_db_cursor
from app.helper.password import hash_password

logger = logging.getLogger("smartclassroom.seed")

def run_seed():
    """
    Seeds default admin, departments, and subjects if the database is newly initialized.
    """
    try:
        # 0. Migration check: rename staff_id to username in admins table if present
        try:
            col_check = fetch_one("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'admins' 
                  AND COLUMN_NAME = 'staff_id'
            """)
            if col_check:
                execute_query("ALTER TABLE admins CHANGE COLUMN staff_id username VARCHAR(50) NOT NULL")
                logger.info("Migrated admins table: column 'staff_id' renamed to 'username'")
        except Exception as mig_err:
            logger.warning(f"Admins table column migration notice: {mig_err}")

        # 1. Admin
        admin = fetch_one("SELECT * FROM admins LIMIT 1")
        if not admin:
            hashed = hash_password("admin123")
            execute_insert(
                "INSERT INTO admins (username, email, password_hash) VALUES (%s, %s, %s)",
                ("admin", "admin@ucj.ac.lk", hashed)
            )
            logger.info("Created default administrator: admin / admin@ucj.ac.lk / admin123")

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

        # 4. Assignment Question Views Tracking Table
        execute_query("""
            CREATE TABLE IF NOT EXISTS assignment_question_views (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                assignment_id INT UNSIGNED NOT NULL,
                std_id VARCHAR(20) NOT NULL,
                first_viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                view_count INT UNSIGNED NOT NULL DEFAULT 1,
                first_downloaded_at DATETIME NULL,
                last_downloaded_at DATETIME NULL,
                download_count INT UNSIGNED NOT NULL DEFAULT 0,
                PRIMARY KEY (id),
                UNIQUE KEY uq_assignment_student_view (assignment_id, std_id),
                KEY idx_aqv_assignment (assignment_id),
                KEY idx_aqv_student (std_id),
                CONSTRAINT fk_aqv_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE,
                CONSTRAINT fk_aqv_student FOREIGN KEY (std_id) REFERENCES students(std_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)

    except Exception as e:
        logger.error(f"Seed check error: {e}")
