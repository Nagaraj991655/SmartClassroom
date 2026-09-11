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

def send_admin_otp_email(
    admin_email: str,
    otp_code: str,
    valid_minutes: int = 10
) -> bool:
    """Sends a 6-digit password reset verification code to an administrator."""
    # Ensure recipient email is well-formed for SMTP delivery
    recipient = admin_email.strip()
    if recipient.endswith("@gmail"):
        recipient = recipient + ".com"

    subject = f"[SmartClassroom] Admin Password Reset Code: {otp_code}"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 32px; background-color: #faf9f5; border: 1px solid #e8e6dc; border-radius: 12px; color: #141413;">
        <div style="border-bottom: 2px solid #d97757; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; color: #141413; font-size: 20px; font-weight: 700;">SmartClassroom &bull; Administrator Security</h2>
            <p style="margin: 4px 0 0 0; color: #7a7870; font-size: 13px;">University College of Jaffna &bull; Institutional Authentication</p>
        </div>

        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hello Administrator,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4d4c47; margin: 0 0 20px 0;">
            We received a request to reset the password for your administrator account (<strong>{admin_email}</strong>). Use the 6-digit verification code below to proceed with the password reset:
        </p>

        <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; padding: 16px 36px; background-color: #141413; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 8px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                {otp_code}
            </div>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #c2410c; font-weight: 600;">
                This code expires in {valid_minutes} minutes.
            </p>
        </div>

        <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 14px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #9a3412; line-height: 1.5;">
                <strong>Security Alert:</strong> Never share this code with anyone. Institutional staff will never ask for your verification code. If you did not initiate this request, you can safely disregard this message.
            </p>
        </div>

        <p style="color: #8c8a82; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e8e6dc;">
            University College of Jaffna &bull; Central IT Administration<br>
            Automatic notification generated by SmartClassroom Authentication Service.
        </p>
    </div>
    """
    return send_email([recipient], subject, html)

def send_student_otp_email(
    student_email: str,
    student_name: str,
    otp_code: str,
    valid_minutes: int = 10
) -> bool:
    """Sends a 6-digit password reset verification code to a student."""
    recipient = student_email.strip()
    if recipient.endswith("@gmail"):
        recipient = recipient + ".com"

    subject = f"[SmartClassroom] Student Password Reset Code: {otp_code}"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 32px; background-color: #faf9f5; border: 1px solid #e8e6dc; border-radius: 12px; color: #141413;">
        <div style="border-bottom: 2px solid #d97757; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; color: #141413; font-size: 20px; font-weight: 700;">SmartClassroom &bull; Student Portal Security</h2>
            <p style="margin: 4px 0 0 0; color: #7a7870; font-size: 13px;">University College of Jaffna &bull; Student Authentication Service</p>
        </div>

        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hello {student_name or 'Student'},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4d4c47; margin: 0 0 20px 0;">
            A password reset was requested for your student account (<strong>{student_email}</strong>). Please enter the 6-digit verification code below to reset your student password:
        </p>

        <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; padding: 16px 36px; background-color: #141413; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 8px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                {otp_code}
            </div>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #c2410c; font-weight: 600;">
                This code expires in {valid_minutes} minutes.
            </p>
        </div>

        <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 14px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #9a3412; line-height: 1.5;">
                <strong>Security Alert:</strong> Never share your verification code or student credentials with anyone. If you did not request a password reset, please notify student affairs immediately.
            </p>
        </div>

        <p style="color: #8c8a82; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e8e6dc;">
            University College of Jaffna &bull; Student Affairs &amp; IT Services<br>
            Automatic notification generated by SmartClassroom Authentication Service.
        </p>
    </div>
    """
    return send_email([recipient], subject, html)

def send_teacher_otp_email(
    teacher_email: str,
    teacher_name: str,
    otp_code: str,
    valid_minutes: int = 10
) -> bool:
    """Sends a 6-digit password reset verification code to a teacher / faculty member."""
    recipient = teacher_email.strip()
    if recipient.endswith("@gmail"):
        recipient = recipient + ".com"

    subject = f"[SmartClassroom] Faculty Password Reset Code: {otp_code}"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 32px; background-color: #faf9f5; border: 1px solid #e8e6dc; border-radius: 12px; color: #141413;">
        <div style="border-bottom: 2px solid #d97757; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; color: #141413; font-size: 20px; font-weight: 700;">SmartClassroom &bull; Faculty &amp; Staff Security</h2>
            <p style="margin: 4px 0 0 0; color: #7a7870; font-size: 13px;">University College of Jaffna &bull; Academic Authentication Service</p>
        </div>

        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hello {teacher_name or 'Faculty Member'},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4d4c47; margin: 0 0 20px 0;">
            A password reset request was initiated for your faculty account (<strong>{teacher_email}</strong>). Use the 6-digit verification code below to reset your password:
        </p>

        <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; padding: 16px 36px; background-color: #141413; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 8px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                {otp_code}
            </div>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #c2410c; font-weight: 600;">
                This code expires in {valid_minutes} minutes.
            </p>
        </div>

        <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 14px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #9a3412; line-height: 1.5;">
                <strong>Security Alert:</strong> Never share your verification code or credentials with anyone. Institutional staff will never ask for your verification code.
            </p>
        </div>

        <p style="color: #8c8a82; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e8e6dc;">
            University College of Jaffna &bull; Academic &amp; IT Services<br>
            Automatic notification generated by SmartClassroom Authentication Service.
        </p>
    </div>
    """
    return send_email([recipient], subject, html)



