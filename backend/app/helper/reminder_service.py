import logging
from datetime import datetime, timedelta
from app.config.db import fetch_all, execute_query
from app.model.teacher_model import get_enrolled_student_emails_for_subject
from app.helper.mailer import send_assignment_start_reminder_email, send_deadline_reminder_email

logger = logging.getLogger("smartclassroom.reminders")

def check_and_send_assignment_reminders():
    """
    Checks for:
    1. Assignments starting within the next 1 hour (start_reminder_sent = 0)
    2. Assignments with deadlines within the next 1 hour (deadline_reminder_sent = 0)
    Sends automated emails and marks them as sent to ensure emails are sent exactly once.
    """
    now = datetime.now()
    one_hour_ahead = now + timedelta(hours=1)

    # 1. Start Reminders (starting within next 1 hour)
    sql_start = """
        SELECT a.assignment_id, a.sub_id, a.ass_name, a.start_at, a.end_at, s.sub_name
        FROM assignments a
        JOIN subjects s ON a.sub_id = s.sub_id
        WHERE a.start_reminder_sent = 0
          AND a.start_at > %s
          AND a.start_at <= %s
    """
    try:
        start_candidates = fetch_all(sql_start, (now, one_hour_ahead))
        for ass in start_candidates:
            try:
                emails = get_enrolled_student_emails_for_subject(ass["sub_id"])
                if emails:
                    send_assignment_start_reminder_email(
                        student_emails=emails,
                        assignment_title=ass["ass_name"],
                        subject_name=ass["sub_name"],
                        start_at=str(ass["start_at"]),
                        end_at=str(ass["end_at"])
                    )
                    logger.info(f"Sent 1-hr start reminder for assignment #{ass['assignment_id']} to {len(emails)} students.")
                execute_query(
                    "UPDATE assignments SET start_reminder_sent = 1 WHERE assignment_id = %s",
                    (ass["assignment_id"],)
                )
            except Exception as err:
                logger.error(f"Error sending start reminder for assignment #{ass['assignment_id']}: {err}")
    except Exception as query_err:
        logger.error(f"Error querying start reminder candidates: {query_err}")

    # 2. Deadline Reminders (closing within next 1 hour)
    sql_deadline = """
        SELECT a.assignment_id, a.sub_id, a.ass_name, a.start_at, a.end_at, s.sub_name
        FROM assignments a
        JOIN subjects s ON a.sub_id = s.sub_id
        WHERE a.deadline_reminder_sent = 0
          AND a.end_at > %s
          AND a.end_at <= %s
    """
    try:
        deadline_candidates = fetch_all(sql_deadline, (now, one_hour_ahead))
        for ass in deadline_candidates:
            try:
                # Query pending students for this assignment (who haven't submitted yet)
                sql_pending = """
                    SELECT st.email
                    FROM student_subjects ss
                    JOIN students st ON ss.std_id = st.std_id
                    LEFT JOIN submissions sub ON sub.assignment_id = %s AND sub.std_id = st.std_id
                    WHERE ss.sub_id = %s AND sub.submission_id IS NULL
                """
                pending_rows = fetch_all(sql_pending, (ass["assignment_id"], ass["sub_id"]))
                pending_emails = [r["email"] for r in pending_rows if r.get("email")]

                if pending_emails:
                    send_deadline_reminder_email(
                        student_emails=pending_emails,
                        assignment_title=ass["ass_name"],
                        subject_name=ass["sub_name"],
                        end_at=str(ass["end_at"]),
                        hours_left=1
                    )
                    logger.info(f"Sent 1-hr deadline reminder for assignment #{ass['assignment_id']} to {len(pending_emails)} pending students.")
                execute_query(
                    "UPDATE assignments SET deadline_reminder_sent = 1 WHERE assignment_id = %s",
                    (ass["assignment_id"],)
                )
            except Exception as err:
                logger.error(f"Error sending deadline reminder for assignment #{ass['assignment_id']}: {err}")
    except Exception as query_err:
        logger.error(f"Error querying deadline reminder candidates: {query_err}")
