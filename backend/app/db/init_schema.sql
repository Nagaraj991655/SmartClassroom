-- ============================================================
-- SmartClassroom Database
-- Database: smart_class
-- MySQL 8.x
-- Normalized design (3NF)
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_class
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE smart_class;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS teacher_subjects;
DROP TABLE IF EXISTS student_subjects;
DROP TABLE IF EXISTS department_subjects;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS departments;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. DEPARTMENTS
-- One department can have many students and many subjects.
-- ============================================================
CREATE TABLE departments (
    dep_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    dep_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (dep_id),
    UNIQUE KEY uq_departments_name (dep_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. STUDENTS
-- Each student belongs to one department.
-- Student login uses std_id + password.
-- ============================================================
CREATE TABLE students (
    std_id VARCHAR(20) NOT NULL,
    std_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    dep_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (std_id),
    UNIQUE KEY uq_students_email (email),
    KEY idx_students_department (dep_id),

    CONSTRAINT fk_students_department
        FOREIGN KEY (dep_id)
        REFERENCES departments (dep_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. TEACHERS
-- Teacher login uses staff ID + password.
-- ============================================================
CREATE TABLE teachers (
    teach_id VARCHAR(20) NOT NULL,
    teach_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (teach_id),
    UNIQUE KEY uq_teachers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. ADMINS
-- Admin login uses staff ID + password.
-- ============================================================
CREATE TABLE admins (
    admin_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    staff_id VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (admin_id),
    UNIQUE KEY uq_admins_staff_id (staff_id),
    UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. SUBJECTS
-- A subject can be offered by multiple departments.
-- Example: Maths can belong to IT and Civil.
-- ============================================================
CREATE TABLE subjects (
    sub_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    sub_name VARCHAR(100) NOT NULL,

    PRIMARY KEY (sub_id),
    UNIQUE KEY uq_subjects_name (sub_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. DEPARTMENT_SUBJECTS
-- Many-to-many relationship:
-- Department <-> Subject
-- ============================================================
CREATE TABLE department_subjects (
    dep_id INT UNSIGNED NOT NULL,
    sub_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (dep_id, sub_id),

    KEY idx_department_subjects_subject (sub_id),

    CONSTRAINT fk_department_subjects_department
        FOREIGN KEY (dep_id)
        REFERENCES departments (dep_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_department_subjects_subject
        FOREIGN KEY (sub_id)
        REFERENCES subjects (sub_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. STUDENT_SUBJECTS
-- Many-to-many relationship:
-- Student <-> Subject
-- Only subjects selected/enrolled by the student are assigned.
-- ============================================================
CREATE TABLE student_subjects (
    std_id VARCHAR(20) NOT NULL,
    sub_id INT UNSIGNED NOT NULL,
    enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (std_id, sub_id),

    KEY idx_student_subjects_subject (sub_id),

    CONSTRAINT fk_student_subjects_student
        FOREIGN KEY (std_id)
        REFERENCES students (std_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_student_subjects_subject
        FOREIGN KEY (sub_id)
        REFERENCES subjects (sub_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8. TEACHER_SUBJECTS
-- Many-to-many relationship:
-- Teacher <-> Subject
-- A teacher can teach multiple subjects.
-- ============================================================
CREATE TABLE teacher_subjects (
    teach_id VARCHAR(20) NOT NULL,
    sub_id INT UNSIGNED NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (teach_id, sub_id),

    KEY idx_teacher_subjects_subject (sub_id),

    CONSTRAINT fk_teacher_subjects_teacher
        FOREIGN KEY (teach_id)
        REFERENCES teachers (teach_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_teacher_subjects_subject
        FOREIGN KEY (sub_id)
        REFERENCES subjects (sub_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. ASSIGNMENTS
-- A teacher creates an assignment for a subject.
--
-- Business rules to enforce in FastAPI/application:
-- * start_at should be current date/time to max 7 days ahead.
-- * end_at should be 7 to 30 days after start_at.
-- * deadline_reminder_hr must be between 1 and 8.
-- ============================================================
CREATE TABLE assignments (
    assignment_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    sub_id INT UNSIGNED NOT NULL,
    teach_id VARCHAR(20) NOT NULL,
    ass_name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    doc_url VARCHAR(500) NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    deadline_reminder_hr TINYINT UNSIGNED NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (assignment_id),

    KEY idx_assignments_subject (sub_id),
    KEY idx_assignments_teacher (teach_id),
    KEY idx_assignments_start (start_at),
    KEY idx_assignments_end (end_at),

    CONSTRAINT fk_assignments_subject
        FOREIGN KEY (sub_id)
        REFERENCES subjects (sub_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_assignments_teacher
        FOREIGN KEY (teach_id)
        REFERENCES teachers (teach_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_assignment_reminder_hours
        CHECK (deadline_reminder_hr BETWEEN 1 AND 8),

    CONSTRAINT chk_assignment_dates
        CHECK (end_at > start_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. SUBMISSIONS
-- A student submits an assignment.
-- sub_id is intentionally NOT stored here because the subject
-- is already determined through assignments.sub_id.
-- ============================================================
CREATE TABLE submissions (
    submission_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    assignment_id INT UNSIGNED NOT NULL,
    std_id VARCHAR(20) NOT NULL,
    doc_url VARCHAR(500) NOT NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'submitted',

    PRIMARY KEY (submission_id),

    -- Prevent one student from creating multiple submissions
    -- for the same assignment.
    UNIQUE KEY uq_submission_student_assignment (assignment_id, std_id),

    KEY idx_submissions_student (std_id),
    KEY idx_submissions_assignment (assignment_id),
    KEY idx_submissions_status (status),

    CONSTRAINT fk_submissions_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignments (assignment_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_submissions_student
        FOREIGN KEY (std_id)
        REFERENCES students (std_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 11. GRADES
-- One final grade record per submission.
-- ============================================================
CREATE TABLE grades (
    grade_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    submission_id INT UNSIGNED NOT NULL,
    teach_id VARCHAR(20) NOT NULL,
    marks DECIMAL(5,2) NOT NULL,
    feedback TEXT NULL,
    graded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (grade_id),

    UNIQUE KEY uq_grades_submission (submission_id),
    KEY idx_grades_teacher (teach_id),

    CONSTRAINT fk_grades_submission
        FOREIGN KEY (submission_id)
        REFERENCES submissions (submission_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_grades_teacher
        FOREIGN KEY (teach_id)
        REFERENCES teachers (teach_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_grades_marks
        CHECK (marks >= 0 AND marks <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 12. NOTIFICATIONS
-- Stores email notification scheduling/sending information.
--
-- notification_type values:
-- assignment_started
-- deadline_reminder
-- result_available
-- ============================================================
CREATE TABLE notifications (
    notification_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    std_id VARCHAR(20) NOT NULL,
    assignment_id INT UNSIGNED NOT NULL,
    notification_type VARCHAR(30) NOT NULL,
    scheduled_at DATETIME NOT NULL,
    sent_at DATETIME NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    PRIMARY KEY (notification_id),

    UNIQUE KEY uq_notification_event
        (std_id, assignment_id, notification_type),

    KEY idx_notifications_assignment (assignment_id),
    KEY idx_notifications_status_schedule (status, scheduled_at),

    CONSTRAINT fk_notifications_student
        FOREIGN KEY (std_id)
        REFERENCES students (std_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignments (assignment_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- OPTIONAL SAMPLE DATA
-- Uncomment this section if you want test data.
-- ============================================================

/*
INSERT INTO departments (dep_name) VALUES
('IT'),
('Civil'),
('Arts');

INSERT INTO subjects (sub_name) VALUES
('Java'),
('Maths'),
('English'),
('Civil Drawing'),
('Tamil');

-- IT: Java, Maths, English
INSERT INTO department_subjects (dep_id, sub_id) VALUES
(1, 1),
(1, 2),
(1, 3);

-- Civil: Civil Drawing, English, Maths
INSERT INTO department_subjects (dep_id, sub_id) VALUES
(2, 4),
(2, 3),
(2, 2);

-- Arts: Tamil, English
INSERT INTO department_subjects (dep_id, sub_id) VALUES
(3, 5),
(3, 3);
*/

-- ============================================================
-- END OF DATABASE
-- ============================================================