import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import {
  GraduationCap, BookOpen, Shield,
  Lock, User, Mail,
  AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import classroomBg from '../assets/classroom-bg.jpg';

const ROLE_CONFIGS = {
  student: {
    title: 'Student Login',
    subtitle: 'Access course assignments, submit your work, and view grades.',
    idLabel: 'Student Index Number',
    idPlaceholder: 'e.g. ST2026001',
    inputType: 'text',
    icon: GraduationCap,
    color: '#2563eb',
    bgLight: '#eff6ff',
    borderColor: '#bfdbfe',
    demoId: 'ST2026001',
    demoPass: 'studentPassword123',
    tagline: 'Student Portal',
  },
  teacher: {
    title: 'Teacher Login',
    subtitle: 'Create assignments, track submissions, and grade student work.',
    idLabel: 'Teacher ID (Staff ID)',
    idPlaceholder: 'e.g. T001',
    inputType: 'text',
    icon: BookOpen,
    color: '#0891b2',
    bgLight: '#ecfeff',
    borderColor: '#a5f3fc',
    demoId: 'T001',
    demoPass: 'teacherPassword123',
    tagline: 'Teacher Portal',
  },
  admin: {
    title: 'Administrator Login',
    subtitle: 'Manage faculty, students, departments, and system configurations.',
    idLabel: 'Administrator Email',
    idPlaceholder: 'e.g. admin@ucj.ac.lk',
    inputType: 'email',
    icon: Shield,
    color: '#7c3aed',
    bgLight: '#f5f3ff',
    borderColor: '#ddd6fe',
    demoId: 'admin@ucj.ac.lk',
    demoPass: 'admin123',
    tagline: 'Admin Portal',
  },
};

export default function RoleLoginPage({ role, onLoginSuccess, onBack }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const firstInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const config = ROLE_CONFIGS[role];
  const IconComponent = config.icon;

  const handleDemoFill = () => {
    setIdentifier(config.demoId);
    setPassword(config.demoPass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter both identifier and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.login(role, identifier.trim(), password);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper" style={styles.pageWrapper}>
      {/* Left Panel — Background Image */}
      <div className="login-left-panel" style={styles.leftPanel}>
        <img src={classroomBg} alt="Modern university classroom" style={styles.bgImage} />
        <div style={styles.overlay} />
        <div style={styles.leftContent}>
          <div style={styles.brandRow}>
            <div style={{ ...styles.brandIcon, borderColor: `${config.color}55` }}>
              <IconComponent size={28} color="#fff" />
            </div>
            <span style={styles.brandName}>SmartClassroom</span>
          </div>
          <div style={{
            display: 'inline-block',
            padding: '0.3rem 0.9rem',
            borderRadius: '20px',
            background: `${config.color}22`,
            border: `1px solid ${config.color}44`,
            color: '#fff',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            marginBottom: '1rem',
          }}>
            {config.tagline}
          </div>
          <h1 style={styles.heroTitle}>
            University College<br />of Jaffna
          </h1>
          <p style={styles.heroSubtitle}>
            {config.subtitle}
          </p>
          <div style={styles.featureList}>
            {['Secure Authentication', 'Role-Based Access', 'Real-time Updates'].map((item) => (
              <div key={item} style={styles.featureItem}>
                <CheckCircle2 size={16} color="#86efac" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="login-right-panel" style={styles.rightPanel}>
        <div style={styles.formContainer}>
          {/* Back Button */}
          <button type="button" onClick={onBack} style={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Back to role selection</span>
          </button>

          {/* Header */}
          <div style={styles.formHeader}>
            <div style={{
              ...styles.headerIconWrap,
              background: config.bgLight,
              border: `1px solid ${config.borderColor}`,
            }}>
              <IconComponent size={28} color={config.color} />
            </div>
            <h2 style={styles.formTitle}>{config.title}</h2>
            <p style={styles.formSubtitle}>{config.subtitle}</p>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBanner}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>{config.idLabel}</label>
              <div style={styles.inputWrapper}>
                {config.inputType === 'email'
                  ? <Mail size={16} style={styles.inputIcon} />
                  : <User size={16} style={styles.inputIcon} />
                }
                <input
                  ref={firstInputRef}
                  type={config.inputType || 'text'}
                  placeholder={config.idPlaceholder}
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
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = config.color;
                    e.target.style.background = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#f8fafc';
                  }}
                />
              </div>
            </div>

            <div style={{ ...styles.fieldGroup, marginBottom: '1.75rem' }}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
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
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = config.color;
                    e.target.style.background = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#f8fafc';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
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
                ...styles.submitBtn,
                backgroundColor: config.color,
                opacity: loading ? 0.7 : 1,
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

          {/* Demo fill */}
          <div style={styles.demoSection}>
            <button type="button" onClick={handleDemoFill} style={styles.demoBtn}>
              <CheckCircle2 size={13} color="#10b981" />
              <span>Auto-fill demo credentials</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ─── Styles ─── */
const styles = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'row',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  leftPanel: {
    position: 'relative',
    flex: '1 1 50%',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.45) 60%, rgba(15, 23, 42, 0.25) 100%)',
  },
  leftContent: {
    position: 'relative',
    zIndex: 2,
    padding: '3rem 2.5rem',
    maxWidth: '520px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    marginBottom: '0.75rem',
  },
  brandIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.01em',
  },
  heroTitle: {
    fontSize: '2.25rem',
    fontWeight: 800,
    color: '#ffffff',
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
    marginBottom: '0.75rem',
  },
  heroSubtitle: {
    fontSize: '0.95rem',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.88rem',
    color: 'rgba(255,255,255,0.85)',
  },
  rightPanel: {
    flex: '1 1 50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    padding: '2rem',
    minHeight: '100vh',
    overflowY: 'auto',
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '0.82rem',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '0.4rem 0',
    marginBottom: '1.5rem',
    fontFamily: 'inherit',
    transition: 'color 0.15s ease',
  },
  formHeader: {
    marginBottom: '1.75rem',
  },
  headerIconWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  formTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    marginBottom: '0.3rem',
  },
  formSubtitle: {
    fontSize: '0.85rem',
    color: '#64748b',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.7rem 0.9rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#991b1b',
    fontSize: '0.83rem',
    marginBottom: '1.25rem',
  },
  fieldGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '0.4rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.85rem',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.7rem 0.9rem 0.7rem 2.5rem',
    fontSize: '0.9rem',
    color: '#0f172a',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease, background 0.15s ease',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
  },
  submitBtn: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.92rem',
    fontWeight: 600,
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s ease',
  },
  demoSection: {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px dashed #e2e8f0',
    textAlign: 'center',
  },
  demoBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    textDecoration: 'underline',
    fontFamily: 'inherit',
  },
};
