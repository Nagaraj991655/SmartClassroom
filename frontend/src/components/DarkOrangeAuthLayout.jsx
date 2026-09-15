import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import {
  Lock,
  User,
  Mail,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import ucjLogo from '../assets/logo/ucj-logo.svg';

export default function DarkOrangeAuthLayout({
  role,
  portalBadge,
  title,
  subtitle,
  idLabel,
  idPlaceholder,
  inputType = 'text',
  icon: PortalIcon,
  backgroundImage,
  demoId,
  demoPass,
  onLoginSuccess
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const firstInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const handleDemoFill = () => {
    setIdentifier(demoId);
    setPassword(demoPass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please provide both credentials.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.login(role, identifier.trim(), password);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper" style={styles.pageWrapper}>
      {/* Left Panel: Real Campus Photography + Institutional Branding */}
      <div className="login-left-panel" style={styles.leftPanel}>
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt="University College of Jaffna Campus"
            style={styles.bgImage}
          />
        )}
        <div style={styles.imageOverlay} />
        
        <div className="login-left-content" style={styles.leftContent}>
          <div style={styles.brandRow}>
            <div style={styles.logoBadge}>
              <img src={ucjLogo} alt="UCJ U Logo" style={styles.ucjLogoImg} />
            </div>
            <div>
              <div style={styles.brandTitle}>University College of Jaffna</div>
              <div style={styles.brandSub}>SmartClassroom Academic Portal</div>
            </div>
          </div>

          <div style={styles.badgePill}>
            <span style={styles.badgeDot} />
            {portalBadge}
          </div>

          <h1 className="login-hero-heading" style={styles.heroHeading}>
            Official Academic Management System
          </h1>

          <p className="login-hero-description" style={styles.heroDescription}>
            University College of Jaffna — Empowering vocational and technical education with unified coursework, assignment tracking, and grade evaluation.
          </p>

          <div className="login-highlight-list" style={styles.highlightList}>
            <div style={styles.highlightItem}>
              <CheckCircle2 size={16} color="#f97316" style={{ flexShrink: 0 }} />
              <span>Dedicated portal security with isolated role endpoints</span>
            </div>
            <div style={styles.highlightItem}>
              <CheckCircle2 size={16} color="#f97316" style={{ flexShrink: 0 }} />
              <span>Direct submission and real-time evaluation workflow</span>
            </div>
            <div style={styles.highlightItem}>
              <CheckCircle2 size={16} color="#f97316" style={{ flexShrink: 0 }} />
              <span>Encrypted token authentication and institutional compliance</span>
            </div>
          </div>

          <div className="login-left-footer" style={styles.leftFooterNote}>
            © 2026 University College of Jaffna · Sri Lanka
          </div>
        </div>
      </div>

      {/* Right Panel: Clean, Dark & Orange Professional Form */}
      <div className="login-right-panel" style={styles.rightPanel}>
        <div style={styles.formCard}>
          {/* Top Portal Tag with UCJ Logo & Icon */}
          <div style={styles.cardHeader}>
            <div style={styles.portalIconContainer}>
              <img src={ucjLogo} alt="UCJ" style={{ width: '30px', height: '30px' }} />
            </div>
            <div style={styles.cardHeaderTexts}>
              <span style={styles.tagText}>{portalBadge}</span>
              <h2 style={styles.formTitle}>{title}</h2>
            </div>
          </div>

          <p style={styles.formSubtitle}>{subtitle}</p>

          {/* Error Message */}
          {error && (
            <div style={styles.errorAlert}>
              <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0 }} />
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={styles.form} autoComplete="off">
            <div style={styles.formGroup}>
              <label style={styles.label}>{idLabel}</label>
              <div style={styles.inputContainer}>
                {inputType === 'email' ? (
                  <Mail size={16} style={styles.inputIcon} />
                ) : (
                  <User size={16} style={styles.inputIcon} />
                )}
                <input
                  ref={firstInputRef}
                  type={inputType}
                  className="login-input"
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
                    e.target.style.borderColor = '#ea580c';
                    e.target.style.backgroundColor = '#151924';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#272d3f';
                    e.target.style.backgroundColor = '#0d1017';
                  }}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Password</label>
              </div>
              <div style={styles.inputContainer}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Enter account password"
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
                    e.target.style.borderColor = '#ea580c';
                    e.target.style.backgroundColor = '#151924';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#272d3f';
                    e.target.style.backgroundColor = '#0d1017';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#c2410c';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#ea580c';
              }}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div style={styles.demoWrapper}>
            <button
              type="button"
              onClick={handleDemoFill}
              style={styles.demoButton}
              title="Click to fill test credentials"
            >
              <CheckCircle2 size={13} color="#f97316" />
              <span>Fill demo {role} credentials</span>
            </button>
          </div>

          <div style={styles.cardFooter}>
            <span>University College of Jaffna · Official SmartClassroom Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#090b10',
    color: '#f1f5f9',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  leftPanel: {
    position: 'relative',
    flex: '1 1 52%',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
    backgroundColor: '#090b10',
    borderRight: '1px solid #1e2433',
  },
  bgImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'brightness(0.70) contrast(1.08)',
  },
  imageOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(9, 11, 16, 0.40) 0%, rgba(9, 11, 16, 0.75) 45%, rgba(9, 11, 16, 0.96) 100%)',
  },
  leftContent: {
    position: 'relative',
    zIndex: 2,
    padding: '3.5rem 3rem',
    maxWidth: '560px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    marginBottom: '1.75rem',
  },
  logoBadge: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
  },
  ucjLogoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  brandTitle: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.02em',
    lineHeight: 1.15,
  },
  brandSub: {
    fontSize: '0.78rem',
    color: '#fb923c',
    fontWeight: 600,
  },
  badgePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.3rem 0.8rem',
    borderRadius: '6px',
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    border: '1px solid rgba(234, 88, 12, 0.35)',
    color: '#fb923c',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: '1.25rem',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#f97316',
  },
  heroHeading: {
    fontSize: '2.1rem',
    fontWeight: 800,
    color: '#ffffff',
    lineHeight: 1.22,
    letterSpacing: '-0.03em',
    marginBottom: '1rem',
  },
  heroDescription: {
    fontSize: '0.92rem',
    color: '#cbd5e1',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  highlightList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '2.5rem',
  },
  highlightItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    fontSize: '0.85rem',
    color: '#e2e8f0',
    fontWeight: 500,
  },
  leftFooterNote: {
    fontSize: '0.75rem',
    color: '#64748b',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '1rem',
  },

  /* Right Panel */
  rightPanel: {
    flex: '1 1 48%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090b10',
    padding: '2.5rem',
    minHeight: '100vh',
    overflowY: 'auto',
  },
  formCard: {
    width: '100%',
    maxWidth: '430px',
    backgroundColor: '#12151f',
    border: '1px solid #222736',
    borderRadius: '12px',
    padding: '2.25rem',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    marginBottom: '0.5rem',
  },
  portalIconContainer: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
    border: '1px solid rgba(234, 88, 12, 0.22)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardHeaderTexts: {
    display: 'flex',
    flexDirection: 'column',
  },
  tagText: {
    fontSize: '0.72rem',
    color: '#fb923c',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  formTitle: {
    fontSize: '1.45rem',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
    margin: 0,
  },
  formSubtitle: {
    fontSize: '0.84rem',
    color: '#94a3b8',
    lineHeight: 1.5,
    marginBottom: '1.5rem',
    marginTop: '0.5rem',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.75rem 0.9rem',
    backgroundColor: '#261214',
    border: '1px solid #5a1e22',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '0.82rem',
    marginBottom: '1.25rem',
  },
  errorText: {
    lineHeight: 1.4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.15rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.85rem',
    color: '#64748b',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.72rem 0.9rem 0.72rem 2.5rem',
    fontSize: '0.88rem',
    color: '#f8fafc',
    backgroundColor: '#0d1017',
    border: '1px solid #272d3f',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
  },
  passwordToggle: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: '0.5rem',
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#ea580c',
    border: 'none',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease',
  },
  demoWrapper: {
    marginTop: '1.25rem',
    paddingTop: '1rem',
    borderTop: '1px dashed #222736',
    display: 'flex',
    justifyContent: 'center',
  },
  demoButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.78rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: 'underline',
    fontFamily: 'inherit',
  },
  cardFooter: {
    marginTop: '1.25rem',
    paddingTop: '0.85rem',
    borderTop: '1px solid #1a1e2b',
    fontSize: '0.72rem',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 1.4,
  },
};
