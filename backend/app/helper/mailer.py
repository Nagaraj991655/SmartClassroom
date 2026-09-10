import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional
from app.config.settings import settings

logger = logging.getLogger("smartclassroom.mailer")

def send_email(
    to_emails: List[str],
    subject: str,
    html_body: str,
    text_body: Optional[str] = None
) -> bool:
    """
    Sends an email using Gmail SMTP and Google App Password.
    Falls back gracefully with a log message if credentials are not configured or invalid.
    """
    if not to_emails:
        logger.warning("No recipient emails provided.")
        return False

    smtp_user = settings.SMTP_USER
    smtp_pass = settings.SMTP_PASSWORD.replace(" ", "")  # Google app passwords can contain spaces
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT

    # Check if configured
    if not smtp_user or not smtp_pass or "your_google_app_password" in smtp_pass or "abcd" in smtp_pass:
        logger.info(
            f"[MOCK EMAIL / APP PASSWORD NOT CONFIGURED] To: {to_emails} | Subject: {subject}"
        )
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{smtp_user}>"
        msg["To"] = ", ".join(to_emails)

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            server.starttls()

        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_emails, msg.as_string())
        server.quit()

        logger.info(f"Email successfully sent to {to_emails} - Subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email via Google SMTP: {e}")
        return False

def send_assignment_opened_email(
    student_emails: List[str],
    assignment_title: str,
    subject_name: str,
    start_at: str,
    end_at: str
) -> bool:
    """Notifies students when a new assignment is opened."""
    subject = f"[SmartClassroom] New Assignment Available: {assignment_title}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">New Assignment Notification</h2>
        <p>A new assignment has been opened in your subject <strong>{subject_name}</strong>.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Title:</strong> {assignment_title}</p>
            <p style="margin: 0 0 8px 0;"><strong>Available From:</strong> {start_at}</p>
            <p style="margin: 0;"><strong>Submission Deadline:</strong> {end_at}</p>
        </div>
        <p>Please log in to your SmartClassroom account to download the question document and submit your work before the deadline.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">University College of Jaffna &bull; SmartClassroom System</p>
    </div>
    """
    return send_email(student_emails, subject, html)

def send_deadline_reminder_email(
    student_emails: List[str],
    assignment_title: str,
    subject_name: str,
    end_at: str,
    hours_left: int
) -> bool:
    """Notifies students who have pending submissions about upcoming deadline."""
    subject = f"[Reminder] Deadline Approaching: {assignment_title}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #fecaca; border-radius: 8px;">
        <h2 style="color: #b91c1c;">Assignment Deadline Reminder</h2>
        <p>This is a reminder that the deadline for <strong>{assignment_title}</strong> in <strong>{subject_name}</strong> is in approximately <strong>{hours_left} hour(s)</strong>.</p>
        <div style="background-color: #fff1f2; padding: 16px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Title:</strong> {assignment_title}</p>
            <p style="margin: 0;"><strong>Final Deadline:</strong> {end_at}</p>
        </div>
        <p>Please submit your work on SmartClassroom immediately. Late submissions will not be accepted.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">University College of Jaffna &bull; SmartClassroom System</p>
    </div>
    """
    return send_email(student_emails, subject, html)

def send_grade_published_email(
    student_email: str,
    student_name: str,
    assignment_title: str,
    marks: float,
    feedback: Optional[str]
) -> bool:
    """Notifies a student when their assignment submission is evaluated."""
    subject = f"[SmartClassroom] Assignment Graded: {assignment_title}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #047857;">Assignment Evaluated</h2>
        <p>Hello {student_name},</p>
        <p>Your submission for <strong>{assignment_title}</strong> has been graded by your teacher.</p>
        <div style="background-color: #ecfdf5; padding: 16px; border-left: 4px solid #10b981; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 18px;"><strong>Score:</strong> <span style="color: #047857;">{marks} / 100</span></p>
            <p style="margin: 0;"><strong>Feedback:</strong> {feedback or 'No specific feedback provided.'}</p>
        </div>
        <p>Log in to your SmartClassroom dashboard to view more details.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">University College of Jaffna &bull; SmartClassroom System</p>
    </div>
    """
    return send_email([student_email], subject, html)
