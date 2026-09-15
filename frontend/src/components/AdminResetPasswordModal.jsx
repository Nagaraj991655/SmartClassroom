import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  GraduationCap,
  Briefcase
} from 'lucide-react';

export default function AdminResetPasswordModal({
  isOpen,
  role = 'admin',
  initialEmail = '',
  onClose,
  onResetSuccess
}) {
  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';
  const roleTitle = isStudent ? 'Student' : isTeacher ? 'Faculty' : 'Administrator';

  // Steps: 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS'
  const [step, setStep] = useState('EMAIL');
  const [email, setEmail] = useState('');
  const [recoveredId, setRecoveredId] = useState('');
  // 6 separate boxes for the 6-digit OTP code
  const [otpBoxes, setOtpBoxes] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // References for the 6 OTP input boxes
  const otpInputRefs = useRef([]);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  const emailInputRef = useRef(null);

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('EMAIL');
      setEmail(initialEmail || '');
      setRecoveredId('');
      setOtpBoxes(['', '', '', '', '', '']);
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setInfoMessage('');
      setResendCooldown(0);
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialEmail]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // STEP 1: Check if email exists in database table (students / teachers / admins) & send OTP when clicking "Next"
  const handleEmailNext = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError(`Please enter your ${roleTitle.toLowerCase()} email address.`);
      emailInputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      // Securely POST the email to backend — never pulls email address list to frontend
      let res;
      if (isStudent) {
        res = await api.studentForgotPassword(cleanEmail);
      } else if (isTeacher) {
        res = await api.teacherForgotPassword(cleanEmail);
      } else {
        res = await api.adminForgotPassword(cleanEmail);
      }

      setEmail(res.email || cleanEmail);
      if (res.std_id) setRecoveredId(res.std_id);
      if (res.teach_id) setRecoveredId(res.teach_id);

      setOtpBoxes(['', '', '', '', '', '']);
      setInfoMessage(`A 6-digit verification code has been sent to ${res.email || cleanEmail}.`);
      setStep('OTP');
      setResendCooldown(30);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err) {
      setError(
        err.message ||
        `No ${roleTitle.toLowerCase()} account found with this email address.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      if (isStudent) {
        await api.studentForgotPassword(email.trim());
      } else if (isTeacher) {
        await api.teacherForgotPassword(email.trim());
      } else {
        await api.adminForgotPassword(email.trim());
      }

      setInfoMessage('A new 6-digit verification code has been sent to your email.');
      setResendCooldown(45);
      setOtpBoxes(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle typing inside 6 individual OTP boxes
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...otpBoxes];
      updated[index] = '';
      setOtpBoxes(updated);
      return;
    }

    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 6).split('');
      const updated = [...otpBoxes];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          updated[index + i] = digit;
        }
      });
      setOtpBoxes(updated);
      const nextFocus = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const updated = [...otpBoxes];
    updated[index] = cleaned[0];
    setOtpBoxes(updated);

    if (index < 5 && cleaned[0]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation across 6 boxes
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpBoxes[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
        const updated = [...otpBoxes];
        updated[index - 1] = '';
        setOtpBoxes(updated);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      if (otpBoxes.every((digit) => digit !== '')) {
        e.preventDefault();
        handleVerifyOtpNext(e);
      }
    }
  };

  // Handle paste directly into OTP boxes
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    const digits = pasteData.split('');
    const updated = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      if (i < 6) updated[i] = d;
    });
    setOtpBoxes(updated);
    const focusIndex = Math.min(digits.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  // STEP 2: Verify 6-digit OTP code when clicking "Next"
  const handleVerifyOtpNext = async (e) => {
    if (e) e.preventDefault();
    const combinedOtp = otpBoxes.join('').trim();
    if (combinedOtp.length !== 6) {
      setError('Please fill all 6 boxes with the verification code.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      let res;
      if (isStudent) {
        res = await api.studentVerifyOtp(email.trim(), combinedOtp);
      } else if (isTeacher) {
        res = await api.teacherVerifyOtp(email.trim(), combinedOtp);
      } else {
        res = await api.adminVerifyOtp(email.trim(), combinedOtp);
      }

      setResetToken(res.reset_token);
      setStep('NEW_PASSWORD');
      setTimeout(() => passwordInputRef.current?.focus(), 150);
    } catch (err) {
      setError(err.message || 'Invalid or expired 6-digit OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Check matching passwords & save to user's email when clicking "Save"
  const handleSavePassword = async (e) => {
    if (e) e.preventDefault();

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (!confirmPassword) {
      setError('Please re-enter your new password to confirm.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields match.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      let res;
      if (isStudent) {
        res = await api.studentResetPassword(email.trim(), resetToken, newPassword);
      } else if (isTeacher) {
        res = await api.teacherResetPassword(email.trim(), resetToken, newPassword);
      } else {
        res = await api.adminResetPassword(email.trim(), resetToken, newPassword);
      }

      if (res.std_id) setRecoveredId(res.std_id);
      if (res.teach_id) setRecoveredId(res.teach_id);

      setStep('SUCCESS');
    } catch (err) {
      setError(err.message || `Failed to update ${roleTitle.toLowerCase()} password.`);
    } finally {
      setLoading(false);
    }
  };

  // Completion: return to login with identifier prefilled
  const handleComplete = () => {
    onClose();
    if (onResetSuccess) {
      onResetSuccess(recoveredId || email);
    }
  };

  const isOtpComplete = otpBoxes.every((digit) => digit !== '');

  return (
    <div style={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modalCard} role="dialog" aria-modal="true">
        {/* Modal Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconContainer}>
              {isStudent ? (
                <GraduationCap size={20} color="#d97757" />
              ) : isTeacher ? (
                <Briefcase size={20} color="#d97757" />
              ) : (
                <ShieldCheck size={20} color="#d97757" />
              )}
            </div>
            <div>
              <h2 style={styles.headerTitle}>{roleTitle} Password Recovery</h2>
              <p style={styles.headerSubtitle}>University College of Jaffna &bull; Security Verification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={styles.closeButton}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div style={styles.stepBar}>
          <div
            style={{
              ...styles.stepDot,
              backgroundColor: step === 'EMAIL' ? '#141413' : '#d97757',
              color: '#ffffff'
            }}
          >
            1
          </div>
          <div
            style={{
              ...styles.stepLine,
              backgroundColor: ['OTP', 'NEW_PASSWORD', 'SUCCESS'].includes(step) ? '#d97757' : '#e8e6dc'
            }}
          />
          <div
            style={{
              ...styles.stepDot,
              backgroundColor:
                step === 'OTP'
                  ? '#141413'
                  : ['NEW_PASSWORD', 'SUCCESS'].includes(step)
                  ? '#d97757'
                  : '#e8e6dc',
              color: ['OTP', 'NEW_PASSWORD', 'SUCCESS'].includes(step) ? '#ffffff' : '#8c8a82'
            }}
          >
            2
          </div>
          <div
            style={{
              ...styles.stepLine,
              backgroundColor: ['NEW_PASSWORD', 'SUCCESS'].includes(step) ? '#d97757' : '#e8e6dc'
            }}
          />
          <div
            style={{
              ...styles.stepDot,
              backgroundColor:
                step === 'NEW_PASSWORD'
                  ? '#141413'
                  : step === 'SUCCESS'
                  ? '#10b981'
                  : '#e8e6dc',
              color: ['NEW_PASSWORD', 'SUCCESS'].includes(step) ? '#ffffff' : '#8c8a82'
            }}
          >
            3
          </div>
        </div>

        {/* Body Section */}
        <div style={styles.body}>
          {/* Error Alert */}
          {error && (
            <div style={styles.errorAlert}>
              <AlertCircle size={16} color="#c2410c" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={styles.alertText}>{error}</div>
            </div>
          )}

          {/* Info Alert */}
          {infoMessage && (
            <div style={styles.infoAlert}>
              <CheckCircle2 size={16} color="#047857" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={styles.infoAlertText}>{infoMessage}</div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: Enter Email & Click "Next" -> Checks DB Table & Sends OTP        */}
          {/* ========================================================================= */}
          {step === 'EMAIL' && (
            <form onSubmit={handleEmailNext} style={styles.stepForm} autoComplete="off">
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Step 1: Enter {roleTitle} Email</h3>
                <p style={styles.sectionDesc}>
                  Please enter your registered {roleTitle.toLowerCase()} email. We will check if it exists in the system and send a 6-digit OTP code to your email.
                </p>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.inputLabel}>{roleTitle} Email Address</label>
                <div style={styles.inputWrapper}>
                  <Mail size={16} style={styles.inputPrefixIcon} />
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      isStudent
                        ? "Enter your student email (e.g. arun@ucj.ac.lk)"
                        : isTeacher
                        ? "Enter your faculty email (e.g. siva@ucj.ac.lk)"
                        : "Enter administrator email (e.g. admin@ucj.ac.lk)"
                    }
                    disabled={loading}
                    autoComplete="off"
                    style={styles.textInput}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#141413';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e8e6dc';
                    }}
                  />
                </div>
              </div>

              <div style={styles.buttonCluster}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.primaryButton,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? `Checking ${roleTitle} Registry...` : (
                    <>
                      <span>Next</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: 6 Boxes for 6-Digit OTP & Click "Next"                            */}
          {/* ========================================================================= */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtpNext} style={styles.stepForm} autoComplete="off">
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Step 2: Enter 6-Digit OTP</h3>
                <p style={styles.sectionDesc}>
                  A 6-digit verification code has been dispatched to <strong>{email}</strong>. Please enter the 6 digits in the boxes below:
                </p>
              </div>

              {/* 6 Individual Square OTP Input Boxes */}
              <div style={styles.otpBoxesContainer} onPaste={handleOtpPaste}>
                {otpBoxes.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={loading}
                    autoComplete="off"
                    style={{
                      ...styles.otpBox,
                      borderColor: digit ? '#141413' : '#e8e6dc',
                      backgroundColor: digit ? '#ffffff' : '#faf9f5'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#d97757';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.select();
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = digit ? '#141413' : '#e8e6dc';
                    }}
                  />
                ))}
              </div>

              {/* Sub-actions: Change Email & Resend OTP */}
              <div style={styles.resendRow}>
                <button
                  type="button"
                  onClick={() => {
                    setStep('EMAIL');
                    setError('');
                    setInfoMessage('');
                  }}
                  style={styles.textLink}
                >
                  <ArrowLeft size={13} style={{ marginRight: 4 }} />
                  Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    ...styles.resendLink,
                    cursor: resendCooldown > 0 || loading ? 'not-allowed' : 'pointer',
                    color: resendCooldown > 0 ? '#8c8a82' : '#d97757'
                  }}
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>

              <div style={styles.buttonCluster}>
                <button
                  type="submit"
                  disabled={loading || !isOtpComplete}
                  style={{
                    ...styles.primaryButton,
                    opacity: loading || !isOtpComplete ? 0.7 : 1,
                    cursor: loading || !isOtpComplete ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Validating 6-Digit OTP...' : (
                    <>
                      <span>Next</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: New Password & Re-enter Password -> Click "Save"                  */}
          {/* ========================================================================= */}
          {step === 'NEW_PASSWORD' && (
            <form onSubmit={handleSavePassword} style={styles.stepForm} autoComplete="off">
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Step 3: Create New Password</h3>
                <p style={styles.sectionDesc}>
                  Enter and re-enter your new {roleTitle.toLowerCase()} password. Both fields must match before saving.
                </p>
              </div>

              {/* Field 1: New Password */}
              <div style={styles.fieldGroup}>
                <label style={styles.inputLabel}>New Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={16} style={styles.inputPrefixIcon} />
                  <input
                    ref={passwordInputRef}
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmPasswordInputRef.current?.focus();
                      }
                    }}
                    placeholder="Enter new password (minimum 6 characters)"
                    disabled={loading}
                    autoComplete="new-password"
                    style={styles.textInput}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#141413';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e8e6dc';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeToggle}
                    tabIndex={-1}
                    aria-label="Toggle new password visibility"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Field 2: Re-enter New Password */}
              <div style={styles.fieldGroup}>
                <label style={styles.inputLabel}>Re-enter New Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={16} style={styles.inputPrefixIcon} />
                  <input
                    ref={confirmPasswordInputRef}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSavePassword(e);
                      }
                    }}
                    placeholder="Re-enter new password to verify match"
                    disabled={loading}
                    autoComplete="new-password"
                    style={styles.textInput}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#141413';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e8e6dc';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeToggle}
                    tabIndex={-1}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Match indicators */}
                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={styles.mismatchNotice}>✕ Passwords do not match.</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p style={styles.matchNotice}>✓ Passwords match successfully.</p>
                )}
              </div>

              <div style={styles.buttonCluster}>
                <button
                  type="submit"
                  disabled={loading || !newPassword || newPassword !== confirmPassword}
                  style={{
                    ...styles.primaryButton,
                    opacity: loading || !newPassword || newPassword !== confirmPassword ? 0.7 : 1,
                    cursor: loading || !newPassword || newPassword !== confirmPassword ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? `Saving ${roleTitle} Password...` : (
                    <>
                      <span>Save</span>
                      <CheckCircle2 size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: Success Message                                                   */}
          {/* ========================================================================= */}
          {step === 'SUCCESS' && (
            <div style={styles.successContainer}>
              <div style={styles.successIconCircle}>
                <CheckCircle2 size={42} color="#10b981" />
              </div>
              <h3 style={styles.successTitle}>Password Saved Successfully!</h3>
              <p style={styles.successSubtitle}>
                The {roleTitle.toLowerCase()} password for <strong>{email}</strong> has been updated in the database. You can now use your new password to sign into the {roleTitle} Portal.
              </p>
              <button
                type="button"
                onClick={handleComplete}
                style={styles.primaryButton}
              >
                <span>Back to {roleTitle} Sign In</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={styles.footer}>
          <span style={styles.footerNote}>
            Security protocol: OTP is valid for 10 minutes.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(20, 20, 19, 0.65)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '1.25rem',
  },
  modalCard: {
    width: '100%',
    maxWidth: '490px',
    backgroundColor: '#faf9f5',
    border: '1px solid #e8e6dc',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e8e6dc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  iconContainer: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: 'rgba(217, 119, 87, 0.12)',
    border: '1px solid rgba(217, 119, 87, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#141413',
    margin: 0,
    lineHeight: 1.25,
  },
  headerSubtitle: {
    fontSize: '0.75rem',
    color: '#7a7870',
    margin: '2px 0 0 0',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#8c8a82',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.85rem 2rem',
    backgroundColor: '#f6f5ee',
    borderBottom: '1px solid #e8e6dc',
    gap: '0.5rem',
  },
  stepDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.72rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  stepLine: {
    flex: 1,
    height: '2px',
    maxWidth: '70px',
  },
  body: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.65rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '8px',
  },
  alertText: {
    fontSize: '0.84rem',
    color: '#9a3412',
    lineHeight: 1.45,
  },
  infoAlert: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.65rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '8px',
  },
  infoAlertText: {
    fontSize: '0.84rem',
    color: '#065f46',
    lineHeight: 1.45,
  },
  stepForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  sectionHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#141413',
    margin: 0,
  },
  sectionDesc: {
    fontSize: '0.84rem',
    color: '#68665e',
    margin: 0,
    lineHeight: 1.5,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  inputLabel: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#343330',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputPrefixIcon: {
    position: 'absolute',
    left: '0.9rem',
    color: '#8c8a82',
    pointerEvents: 'none',
  },
  textInput: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.6rem',
    fontSize: '0.92rem',
    color: '#141413',
    backgroundColor: '#ffffff',
    border: '1px solid #e8e6dc',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
  },
  /* 6 Individual Square OTP Input Boxes */
  otpBoxesContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.65rem',
    margin: '0.75rem 0 0.25rem 0',
  },
  otpBox: {
    width: '46px',
    height: '52px',
    fontSize: '1.45rem',
    fontWeight: 700,
    textAlign: 'center',
    color: '#141413',
    backgroundColor: '#ffffff',
    border: '1.5px solid #e8e6dc',
    borderRadius: '10px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
    boxSizing: 'border-box',
  },
  eyeToggle: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    color: '#8c8a82',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '0.2rem',
    fontSize: '0.8rem',
  },
  textLink: {
    background: 'none',
    border: 'none',
    color: '#68665e',
    cursor: 'pointer',
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.8rem',
  },
  resendLink: {
    background: 'none',
    border: 'none',
    fontWeight: 600,
    padding: 0,
    fontSize: '0.8rem',
  },
  mismatchNotice: {
    margin: '4px 0 0 0',
    fontSize: '0.78rem',
    color: '#b91c1c',
    fontWeight: 500,
  },
  matchNotice: {
    margin: '4px 0 0 0',
    fontSize: '0.78rem',
    color: '#059669',
    fontWeight: 500,
  },
  buttonCluster: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  primaryButton: {
    width: '100%',
    padding: '0.82rem 1.4rem',
    fontSize: '0.94rem',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#141413',
    border: 'none',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.55rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '1rem 0.5rem',
    gap: '1rem',
  },
  successIconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#141413',
    margin: 0,
  },
  successSubtitle: {
    fontSize: '0.88rem',
    color: '#4d4c47',
    lineHeight: 1.55,
    margin: 0,
    maxWidth: '380px',
  },
  footer: {
    padding: '0.85rem 1.5rem',
    backgroundColor: '#f2f0e8',
    borderTop: '1px solid #e8e6dc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerNote: {
    fontSize: '0.75rem',
    color: '#7a7870',
  },
  cancelButton: {
    padding: '0.45rem 0.85rem',
    backgroundColor: 'transparent',
    color: '#4d4c47',
    fontSize: '0.82rem',
    fontWeight: 500,
    borderRadius: '6px',
    border: '1px solid #d5d2c7',
    cursor: 'pointer',
  },
};
