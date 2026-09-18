import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import {
  Lock,
  User,
  Mail,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Eye,
  EyeOff,
  HelpCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import AdminResetPasswordModal from './AdminResetPasswordModal';
import ucjIcon from '../assets/logo/ucj-icon.png';

export default function HumanAuthLayout({
  role,
  portalBadge,
  title = 'Welcome Back',
  subtitle = 'Please enter your credentials to access the portal.',
  idLabel,
  idPlaceholder,
  inputType = 'text',
  backgroundImage,
  imageCaption = 'University College of Jaffna Campus',
  onLoginSuccess
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [adminResetOpen, setAdminResetOpen] = useState(false);
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(false);

  // Refs to focus input fields
  const firstInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const mobileTouchStartY = useRef(null);
  const mobileSwipeCompleted = useRef(false);

  const expandMobileSheet = () => {
    setMobileSheetExpanded(true);
  };

  const collapseMobileSheet = () => {
    setMobileSheetExpanded(false);
  };

  const handleSheetTouchStart = (event) => {
    mobileSwipeCompleted.current = false;
    mobileTouchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleSheetTouchEnd = (event) => {
    const endY = event.changedTouches[0]?.clientY;
    if (mobileTouchStartY.current !== null && endY !== undefined) {
      const verticalSwipe = mobileTouchStartY.current - endY;

      if (verticalSwipe > 24) {
        expandMobileSheet();
      } else if (verticalSwipe < -24) {
        collapseMobileSheet();
      }

      if (Math.abs(verticalSwipe) > 24) {
        mobileSwipeCompleted.current = true;
      }
    }
    mobileTouchStartY.current = null;
  };

  const handleSheetClick = () => {
    if (mobileSwipeCompleted.current) {
      mobileSwipeCompleted.current = false;
      return;
    }

    expandMobileSheet();
  };

  const handleClear = () => {
    setIdentifier('');
    setPassword('');
    setError('');
    setSuccessMessage('');
    // Auto-focus the 1st input (username / index number / email)
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };

  const handleForgotClick = () => {
    setError('');
    setSuccessMessage('');
    setAdminResetOpen(true);
  };

  const handleResetSuccess = (updatedIdentifier) => {
    if (updatedIdentifier) {
      setIdentifier(updatedIdentifier);
    }
    setPassword('');
    setError('');
    const successText = role === 'student'
      ? 'Password reset successfully! Please sign in with your student index number and new password.'
      : role === 'teacher'
      ? 'Password reset successfully! Please sign in with your teacher staff ID and new password.'
      : 'Password reset successfully! Please sign in with your new administrator password.';
    setSuccessMessage(successText);
    setTimeout(() => {
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please fill in both your identifier and password.');
      if (!identifier.trim() && firstInputRef.current) {
        firstInputRef.current.focus();
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.login(role, identifier.trim(), password);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`anthropic-login-wrapper ${mobileSheetExpanded ? 'mobile-sheet-expanded' : ''}`} style={styles.pageWrapper}>
      {/* 
        On Mobile (<= 900px):
        Right Column (Campus Image) will be displayed on TOP using flex-order or responsive CSS.
        Left Column (Form) will be placed underneath.
      */}

      {/* Form Column (Desktop: Left Side | Mobile: Below Image via CSS) */}
      <div
        className={`anthropic-form-column ${mobileSheetExpanded ? 'mobile-sheet-expanded' : ''}`}
        style={styles.formColumn}
        onClick={handleSheetClick}
        onTouchStart={handleSheetTouchStart}
        onTouchEnd={handleSheetTouchEnd}
      >
        <div className="anthropic-form-container" style={styles.formContainer}>
          {/* Top Brand Identity */}
          <div className="anthropic-brand-row" style={styles.brandRow}>
            <div style={styles.brandGroup}>
              <img
                src={ucjIcon}
                alt="University College of Jaffna Icon"
                style={styles.ucjIcon}
              />
              <div style={styles.brandTitles}>
                <span style={styles.brandMain}>SmartClassroom</span>
                <span style={styles.brandSub}>University College of Jaffna</span>
              </div>
            </div>
            <div style={styles.portalPill}>
              <span style={styles.pillDot} />
              {portalBadge}
            </div>
          </div>

          {/* Heading Section */}
          <div className="anthropic-title-section" style={styles.titleSection}>
            <h1 className="anthropic-title-text" style={styles.titleText}>{title}</h1>
            <p className="anthropic-subtitle-text" style={styles.subtitleText}>{subtitle}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={styles.errorBanner}>
              <AlertCircle size={16} color="#c2410c" style={{ flexShrink: 0 }} />
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div style={styles.successBanner}>
              <CheckCircle2 size={16} color="#047857" style={{ flexShrink: 0 }} />
              <span style={styles.successText}>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="anthropic-form-card" style={styles.form} autoComplete="off">
            {/* Field 1: Username / Index Number / Staff ID / Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>{idLabel}</label>
              <div style={styles.inputWrapper}>
                {inputType === 'email' ? (
                  <Mail size={16} style={styles.prefixIcon} />
                ) : (
                  <User size={16} style={styles.prefixIcon} />
                )}
                <input
                  ref={firstInputRef}
                  type={inputType}
                  className="anthropic-input"
                  placeholder={idPlaceholder}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (passwordInputRef.current) {
                        passwordInputRef.current.focus();
                      }
                    }
                  }}
                  disabled={loading}
                  autoFocus
                  autoComplete="off"
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#141413';
                    e.target.style.backgroundColor = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e8e6dc';
                    e.target.style.backgroundColor = '#ffffff';
                  }}
                />
              </div>
            </div>

            {/* Field 2: Password with Forgot Password link */}
            <div style={styles.fieldGroup}>
              <div style={styles.labelRow}>
                <label style={styles.fieldLabel}>Password</label>
                <button
                  type="button"
                  onClick={handleForgotClick}
                  style={styles.forgotLink}
                >
                  Forgot password?
                </button>
              </div>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.prefixIcon} />
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  className="anthropic-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  disabled={loading}
                  autoComplete="new-password"
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#141413';
                    e.target.style.backgroundColor = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e8e6dc';
                    e.target.style.backgroundColor = '#ffffff';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div style={styles.optionsRow}>
              <label style={styles.rememberOption}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Action Buttons: Sign In + Clear (Focus 1st field) */}
            <div className="anthropic-button-cluster" style={styles.buttonCluster}>
              <button
                type="submit"
                className="anthropic-submit-btn"
                disabled={loading}
                style={{
                  ...styles.submitBtn,
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#2b2a28';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#141413';
                }}
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                className="anthropic-clear-btn"
                onClick={handleClear}
                style={styles.clearBtn}
                title="Clear all fields and focus on the 1st input"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f2f0e8';
                  e.currentTarget.style.borderColor = '#d5d2c7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#faf9f5';
                  e.currentTarget.style.borderColor = '#e8e6dc';
                }}
              >
                <RotateCcw size={15} color="#68665e" />
                <span>Clear</span>
              </button>
            </div>
          </form>

          {/* Anthropic-style Editorial Footer */}
          <div className="anthropic-editorial-footer" style={styles.editorialFooter}>
            Official authentication system for University College of Jaffna. Unauthorized access attempts are monitored and recorded.
          </div>
        </div>
      </div>

      {/* Campus Image Column (Desktop: Right Side | Mobile: Top Side via CSS order: -1) */}
      <div className="anthropic-image-column" style={styles.imageColumn}>
        <img
          src={backgroundImage}
          alt={imageCaption}
          style={styles.fullBleedImage}
        />
        <div style={styles.vignetteOverlay} />

        {/* Floating Anthropic-style Pill Caption */}
        <div className="anthropic-caption-box" style={styles.captionBox}>
          <div style={styles.captionIconBox}>
            <img src={ucjIcon} alt="UCJ Icon" style={{ height: '30px', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={styles.captionTitle}>University College of Jaffna</div>
            <div style={styles.captionSub}>{imageCaption}</div>
          </div>
        </div>
      </div>


      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <div style={styles.modalIconWrap}>
                  <HelpCircle size={20} color="#d97757" />
                </div>
                <h3 style={styles.modalTitle}>Password Recovery</h3>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={{ margin: 0, marginBottom: '0.85rem', lineHeight: 1.6, color: '#3b3a36' }}>
                For security reasons, password resets are handled directly through institutional administration:
              </p>
              <ul style={styles.modalList}>
                <li><strong>Students:</strong> Contact your academic department coordinator or the student affairs desk at UCJ.</li>
                <li><strong>Faculty &amp; Staff:</strong> Contact the IT Administration Unit or submit a ticket to <code>itsupport@ucj.ac.lk</code>.</li>
                <li><strong>Administrators:</strong> Refer to the root system administrator.</li>
              </ul>
            </div>
            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                style={styles.modalDismissBtn}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Password Reset Modal (Admin, Teacher & Student) */}
      <AdminResetPasswordModal
        isOpen={adminResetOpen}
        role={role}
        initialEmail={identifier.includes('@') ? identifier : ''}
        onClose={() => setAdminResetOpen(false)}
        onResetSuccess={handleResetSuccess}
      />
    </div>
  );
}

const styles = {
  pageWrapper: {
    height: '100vh',
    width: '100%',
    maxWidth: '100vw',
    display: 'flex',
    flexDirection: 'row',
    margin: 0,
    padding: 0,
    backgroundColor: '#faf9f5', // Anthropic signature cream background
    color: '#141413',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: 'hidden',
    boxSizing: 'border-box',
    position: 'fixed',
    top: 0,
    left: 0,
  },

  /* Form Column */
  formColumn: {
    flex: '1 1 50%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 4rem',
    backgroundColor: '#faf9f5',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    scrollbarWidth: 'none',      /* Firefox */
    msOverflowStyle: 'none',     /* IE 10+ */
  },
  formContainer: {
    width: '100%',
    maxWidth: '430px',
    display: 'flex',
    flexDirection: 'column',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '2.5rem',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  ucjIcon: {
    height: '42px',
    width: 'auto',
    objectFit: 'contain',
    flexShrink: 0,
  },
  brandTitles: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandMain: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#141413',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: '0.74rem',
    color: '#7a7870',
    fontWeight: 500,
  },
  portalPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.35rem 0.8rem',
    borderRadius: '9999px',
    backgroundColor: 'rgba(217, 119, 87, 0.12)', // Anthropic Terracotta
    border: '1px solid rgba(217, 119, 87, 0.28)',
    color: '#c46344',
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  pillDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#d97757',
  },
  titleSection: {
    marginBottom: '2rem',
  },
  titleText: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#141413',
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
    margin: 0,
    marginBottom: '0.45rem',
  },
  subtitleText: {
    fontSize: '0.92rem',
    color: '#68665e',
    lineHeight: 1.55,
    margin: 0,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.75rem 0.95rem',
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  errorText: {
    fontSize: '0.84rem',
    color: '#9a3412',
    lineHeight: 1.4,
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.75rem 0.95rem',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  successText: {
    fontSize: '0.84rem',
    color: '#065f46',
    lineHeight: 1.4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: '#343330',
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: '#d97757', // Anthropic warm orange
    fontSize: '0.78rem',
    fontWeight: 500,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'none',
    transition: 'color 0.15s ease',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  prefixIcon: {
    position: 'absolute',
    left: '0.95rem',
    color: '#8c8a82',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.8rem 1rem 0.8rem 2.65rem',
    fontSize: '0.92rem',
    color: '#141413',
    backgroundColor: '#ffffff',
    border: '1px solid #e8e6dc', // Anthropic light gray border
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
  },
  eyeButton: {
    position: 'absolute',
    right: '0.85rem',
    background: 'none',
    border: 'none',
    color: '#8c8a82',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.82rem',
    color: '#68665e',
    padding: '0.1rem 0',
  },
  rememberOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontWeight: 400,
  },
  checkbox: {
    accentColor: '#141413',
    cursor: 'pointer',
  },
  buttonCluster: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  submitBtn: {
    flex: '1 1 auto',
    padding: '0.82rem 1.4rem',
    fontSize: '0.94rem',
    fontWeight: 600,
    color: '#faf9f5',
    backgroundColor: '#141413', // Anthropic Signature Dark Button
    border: 'none',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.55rem',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  clearBtn: {
    padding: '0.82rem 1.1rem',
    fontSize: '0.88rem',
    fontWeight: 500,
    color: '#4d4c47',
    backgroundColor: '#faf9f5',
    border: '1px solid #e8e6dc',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  editorialFooter: {
    fontSize: '0.74rem',
    color: '#8c8a82',
    lineHeight: 1.55,
    marginTop: '2.5rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid #e8e6dc',
  },

  /* Campus Photography Column */
  imageColumn: {
    flex: '1 1 50%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end',
    backgroundColor: '#141413',
  },
  fullBleedImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  vignetteOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(20, 20, 19, 0.05) 0%, rgba(20, 20, 19, 0.25) 55%, rgba(20, 20, 19, 0.88) 100%)',
  },
  captionBox: {
    position: 'relative',
    zIndex: 2,
    margin: '2.5rem',
    padding: '0.9rem 1.25rem',
    backgroundColor: 'rgba(250, 249, 245, 0.94)', // Anthropic cream card
    backdropFilter: 'blur(8px)',
    borderRadius: '12px',
    border: '1px solid rgba(232, 230, 220, 0.8)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  captionIconBox: {
    height: '38px',
    width: '38px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #e8e6dc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  captionTitle: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: '#141413',
    lineHeight: 1.2,
  },
  captionSub: {
    fontSize: '0.74rem',
    color: '#68665e',
    marginTop: '2px',
  },

  /* Forgot Password Modal */
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(20, 20, 19, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1.5rem',
  },
  modalBox: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#faf9f5',
    border: '1px solid #e8e6dc',
    borderRadius: '14px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e8e6dc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  modalIconWrap: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(217, 119, 87, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#141413',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#8c8a82',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
  },
  modalBody: {
    padding: '1.5rem',
    fontSize: '0.88rem',
    color: '#4d4c47',
  },
  modalList: {
    paddingLeft: '1.25rem',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    fontSize: '0.84rem',
    lineHeight: 1.5,
  },
  modalFooter: {
    padding: '1rem 1.5rem',
    backgroundColor: '#f2f0e8',
    borderTop: '1px solid #e8e6dc',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  modalDismissBtn: {
    padding: '0.55rem 1.15rem',
    backgroundColor: '#141413',
    color: '#faf9f5',
    fontSize: '0.84rem',
    fontWeight: 600,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  },
};
