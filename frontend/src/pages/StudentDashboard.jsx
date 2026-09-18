import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AdminResetPasswordModal from '../components/AdminResetPasswordModal';
import ucjIcon from '../assets/logo/ucj-icon.png';
import {
  Home,
  FileText,
  Award,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  RefreshCw,
  Bell,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  Download,
  UploadCloud,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  GraduationCap,
  Calendar,
  Mail,
  Building,
  KeyRound,
  ShieldCheck,
  Eye,
  ExternalLink,
  FileCheck,
  Check,
  Layers,
  ArrowRight,
  MessageSquare,
  Lock,
  PlayCircle
} from 'lucide-react';

export default function StudentDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Filter & Search states for Assignments
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentSubjectFilter, setAssignmentSubjectFilter] = useState('');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('all');

  // Submit Modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Feedback / View Grade Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);

  // Question Paper Preview Modal
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState(null);

  // Reset Password Modal
  const [showResetModal, setShowResetModal] = useState(false);

  // Load all student data
  const loadData = async () => {
    setLoading(true);
    try {
      const [profData, subsData, assData, resData] = await Promise.all([
        api.studentGetProfile().catch(() => null),
        api.studentGetSubjects().catch(() => []),
        api.studentGetAssignments().catch(() => []),
        api.studentGetGrades().catch(() => [])
      ]);
      if (profData) setProfile(profData);
      setSubjects(Array.isArray(subsData) ? subsData : []);
      setAssignments(Array.isArray(assData) ? assData : []);
      setResults(Array.isArray(resData) ? resData : []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load student data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => {
      setMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // ── Navigation & Section Detection ──
  const studentSections = ['home', 'assignments', 'grades', 'profile'];
  const sectionFromUrl = location.pathname.replace(/^\/student\/(st_dashboard|dashboard)\/?/, '').split('/')[0];
  const activeSection = studentSections.includes(sectionFromUrl) ? sectionFromUrl : 'home';

  const handleNavClick = (sectionKey) => {
    navigate(`/student/st_dashboard/${sectionKey}`);
    setMobileMenuOpen(false);
    document.querySelector('.admin-main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Derived Student Profile Information ──
  const studentName = profile?.std_name || user?.name || user?.user_name || 'Student';
  const studentId = profile?.std_id || user?.user_id || 'STU-000';
  const studentEmail = profile?.email || user?.email || '';
  const departmentName = profile?.dep_name || 'Information Technology';
  const studentInitial = (studentName || 'S').charAt(0).toUpperCase();

  // Helper date calculators
  const isPastDeadline = (endAt) => {
    if (!endAt) return false;
    return new Date() > new Date(endAt);
  };

  const isUpcoming = (startAt) => {
    if (!startAt) return false;
    return new Date() < new Date(startAt);
  };

  const isDueSoon = (endAt) => {
    if (!endAt) return false;
    const now = new Date();
    const end = new Date(endAt);
    const diffHours = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 72; // Within 3 days
  };

  const formatDeadline = (dateStr) => {
    if (!dateStr) return 'No date specified';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const end = new Date(dateStr);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return 'Deadline passed';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h remaining`;
    return `${diffHours}h ${Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))}m remaining`;
  };

  const getTimeUntilStart = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const start = new Date(dateStr);
    const diffMs = start.getTime() - now.getTime();
    if (diffMs <= 0) return 'Opening now';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `Starts in ${diffDays}d ${diffHours % 24}h`;
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Starts in ${diffHours}h ${diffMins}m`;
  };

  // Calculations for KPI Cards
  const totalAssignmentsCount = assignments.length;
  const submittedAssignments = assignments.filter((a) => !!a.submission_id);
  const submittedCount = submittedAssignments.length;
  const gradedAssignments = assignments.filter((a) => a.marks !== null && a.marks !== undefined);
  const gradedCount = gradedAssignments.length;
  const pendingAssignments = assignments.filter(
    (a) => !a.submission_id && !isPastDeadline(a.end_at) && !isUpcoming(a.start_at)
  );
  const pendingCount = pendingAssignments.length;
  const upcomingAssignments = assignments.filter(
    (a) => isUpcoming(a.start_at)
  );
  const upcomingCount = upcomingAssignments.length;

  // Average marks calculation
  const averageMarks = useMemo(() => {
    if (results.length === 0) return 0;
    const total = results.reduce((acc, r) => acc + (parseFloat(r.marks) || 0), 0);
    return Math.round(total / results.length);
  }, [results]);

  // Highest score
  const highestScore = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.max(...results.map((r) => parseFloat(r.marks) || 0));
  }, [results]);

  // Ongoing assignments (active coursework: started and not past deadline)
  const ongoingAssignments = useMemo(() => {
    return assignments
      .filter((a) => !isUpcoming(a.start_at) && !isPastDeadline(a.end_at))
      .sort((a, b) => new Date(a.end_at) - new Date(b.end_at));
  }, [assignments]);

  // Upcoming assignments (scheduled coursework: start time in future)
  const upcomingAssignmentsList = useMemo(() => {
    return assignments
      .filter((a) => isUpcoming(a.start_at))
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  }, [assignments]);

  // Urgent assignments (active coursework: pending, already started, not passed deadline)
  const urgentAssignments = useMemo(() => {
    return ongoingAssignments.filter((a) => !a.submission_id).slice(0, 3);
  }, [ongoingAssignments]);

  // Filtered Coursework Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((ass) => {
      const q = assignmentSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ass.ass_name?.toLowerCase().includes(q) ||
        ass.sub_name?.toLowerCase().includes(q) ||
        ass.teach_name?.toLowerCase().includes(q) ||
        (ass.description && ass.description.toLowerCase().includes(q));

      const matchesSubject =
        !assignmentSubjectFilter || String(ass.sub_id) === String(assignmentSubjectFilter);

      let matchesStatus = true;
      const past = isPastDeadline(ass.end_at);
      const upcoming = isUpcoming(ass.start_at);
      const isSubmitted = !!ass.submission_id;
      const isGraded = ass.marks !== null && ass.marks !== undefined;

      if (assignmentStatusFilter === 'pending') {
        matchesStatus = !isSubmitted && !past && !upcoming;
      } else if (assignmentStatusFilter === 'upcoming') {
        matchesStatus = upcoming && !isSubmitted;
      } else if (assignmentStatusFilter === 'submitted') {
        matchesStatus = isSubmitted && !isGraded;
      } else if (assignmentStatusFilter === 'graded') {
        matchesStatus = isGraded;
      } else if (assignmentStatusFilter === 'closed') {
        matchesStatus = past && !isSubmitted;
      }

      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [assignments, assignmentSearch, assignmentSubjectFilter, assignmentStatusFilter]);

  // Question Paper Preview & Download Activity Handlers
  const handleViewQuestionPaper = (assignment) => {
    if (isUpcoming(assignment?.start_at)) {
      setMessage({
        type: 'error',
        text: `Question Paper is locked until the assignment starts on ${formatDeadline(assignment.start_at)}.`
      });
      return;
    }
    setViewingAssignment(assignment);
    setShowQuestionModal(true);
    if (assignment?.assignment_id) {
      api.studentTrackQuestionActivity(assignment.assignment_id, 'view').catch(() => {});
    }
  };

  const handleDownloadQuestionPaper = (e, assignment) => {
    if (isUpcoming(assignment?.start_at)) {
      if (e && e.preventDefault) e.preventDefault();
      setMessage({
        type: 'error',
        text: `Question Paper download is locked until the assignment starts on ${formatDeadline(assignment.start_at)}.`
      });
      return;
    }
    if (assignment?.assignment_id) {
      api.studentTrackQuestionActivity(assignment.assignment_id, 'download').catch(() => {});
    }
  };

  // Submission Modal handlers
  const handleOpenSubmitModal = (assignment) => {
    if (isUpcoming(assignment?.start_at)) {
      setMessage({
        type: 'error',
        text: `Submissions are locked until the assignment start time: ${formatDeadline(assignment.start_at)}.`
      });
      return;
    }
    if (isPastDeadline(assignment?.end_at)) {
      setMessage({
        type: 'error',
        text: 'The deadline for this assignment has passed. Submissions are closed.'
      });
      return;
    }
    setSubmittingAssignment(assignment);
    setSubmissionFile(null);
    setShowSubmitModal(true);
  };

  const handleUploadSubmission = async (e) => {
    e.preventDefault();
    if (!submissionFile) {
      setMessage({ type: 'error', text: 'Please select an answer file to upload.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.studentSubmitAssignment(
        submittingAssignment.assignment_id,
        submissionFile
      );
      setMessage({
        type: 'success',
        text: res.message || 'Coursework assignment submitted successfully!'
      });
      setShowSubmitModal(false);
      setSubmissionFile(null);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit assignment file.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenFeedback = (grade) => {
    setSelectedGrade(grade);
    setShowFeedbackModal(true);
  };

  return (
    <div className="admin-layout">
      {/* Mobile Header Bar */}
      <div className="admin-mobile-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img
            src={ucjIcon}
            alt="UCJ Logo"
            style={{ width: '28px', height: '28px', objectFit: 'contain' }}
          />
          <div className="admin-brand-text" style={{ fontSize: '1.2rem' }}>
            <span className="admin-brand-white">Smart</span>
            <span className="admin-brand-blue" style={{ color: '#3b82f6' }}>Class</span>
          </div>
        </div>
        <button
          className="admin-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <div
        className={`admin-sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* ──────────────────── SIDEBAR (Obsidian Layout) ──────────────────── */}
      <aside
        className={`admin-sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${
          mobileMenuOpen ? 'open' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="admin-sidebar-header">
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <img
                src={ucjIcon}
                alt="UCJ Logo"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                }}
              />
              <div className="admin-brand-text">
                <span className="admin-brand-white">Smart</span>
                <span className="admin-brand-blue" style={{ color: '#3b82f6' }}>Class</span>
              </div>
            </div>
          ) : (
            <img
              src={ucjIcon}
              alt="UCJ Logo"
              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            />
          )}

          {/* Toggle button */}
          <button
            type="button"
            className="admin-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Student Profile Squircle */}
        <div className="admin-sidebar-user">
          <div
            className="admin-avatar-squircle"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 6px 18px rgba(37, 99, 235, 0.45)'
            }}
          >
            {studentInitial}
          </div>
          {!isCollapsed && (
            <div className="admin-user-details">
              <span className="admin-user-badge" style={{ color: '#60a5fa' }}>STUDENT</span>
              <span className="admin-user-title" title={studentName}>
                {studentName}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                {studentId}
              </span>
            </div>
          )}
        </div>

        {/* Horizontal Divider */}
        <div className="admin-sidebar-divider" />

        {/* Navigation Items */}
        <nav className="admin-nav">
          {/* 1. Home / Dashboard */}
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
            title="Home"
          >
            <Home size={21} />
            {!isCollapsed && <span>Home</span>}
          </button>

          {/* 2. Assignment */}
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'assignments' ? 'active' : ''}`}
            onClick={() => handleNavClick('assignments')}
            title="Assignment"
          >
            <FileText size={21} />
            {!isCollapsed && <span>Assignment</span>}
          </button>

          {/* 3. Grades */}
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'grades' ? 'active' : ''}`}
            onClick={() => handleNavClick('grades')}
            title="Grades"
          >
            <Award size={21} />
            {!isCollapsed && <span>Grades</span>}
          </button>

          {/* 4. Profile */}
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('profile')}
            title="Profile"
          >
            <User size={21} />
            {!isCollapsed && <span>Profile</span>}
          </button>
        </nav>

        {/* Horizontal Divider */}
        <div className="admin-sidebar-divider" />

        {/* Sidebar Bottom: Log Out */}
        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="admin-signout-btn"
            onClick={onLogout}
            title="Log Out"
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ──────────────────── MAIN CONTENT AREA ──────────────────── */}
      <main className="admin-main">
        <div className="admin-content-container">
          {/* Top Greeting Bar */}
          <div className="admin-top-greeting-bar">
            <div>
              <div className="admin-greeting-title">
                  {activeSection === 'home' && `Welcome back, ${studentName}!`}
                  {activeSection === 'assignments' && 'Coursework Assignments'}
                  {activeSection === 'grades' && 'Academic Marks & Evaluation'}
                  {activeSection === 'profile' && 'Student Profile'}
                </div>
                <div className="admin-greeting-sub">
                  {activeSection === 'home' && `Department of ${departmentName} · Index No: ${studentId}`}
                  {activeSection === 'assignments' && 'Download question papers, upload answer documents, and monitor evaluation progress.'}
                  {activeSection === 'grades' && 'Review marks awarded by faculty, evaluator feedback comments, and graded solutions.'}
                  {activeSection === 'profile' && 'Manage your student registry credentials, department affiliation, and account security.'}
                </div>
              </div>

            <div className="admin-top-actions">
              <span
                className="admin-role-pill"
                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
              >
                Student
              </span>
              <button
                type="button"
                className="admin-action-circle"
                onClick={loadData}
                title="Refresh data"
              >
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
              </button>
              <button
                type="button"
                className="admin-action-circle"
                onClick={() => setMessage({ type: 'success', text: 'All course systems and repositories operational.' })}
                title="Notifications"
              >
                <Bell size={16} />
              </button>
            </div>
          </div>

          {/* Notification Messages */}
          {message && (
            <div
              className={`alert-banner ${
                message.type === 'success' ? 'alert-success' : 'alert-error'
              }`}
              style={{ marginBottom: '1.25rem' }}
            >
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span style={{ flex: 1 }}>{message.text}</span>
              <button
                type="button"
                onClick={() => setMessage(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 1: HOME
             ═══════════════════════════════════════════════ */}
          {activeSection === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* KPI Stat Cards */}
              <div className="stat-grid">
                {/* 1. Enrolled Subjects */}
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#eff6ff' }}>
                    <BookOpen size={22} color="#2563eb" />
                  </div>
                  <div>
                    <div className="stat-number">{subjects.length}</div>
                    <div className="stat-label">Enrolled Subjects</div>
                  </div>
                </div>

                {/* 2. Ongoing Coursework */}
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#ecfdf5' }}>
                    <PlayCircle size={22} color="#059669" />
                  </div>
                  <div>
                    <div className="stat-number">{ongoingAssignments.length}</div>
                    <div className="stat-label">Ongoing Coursework</div>
                  </div>
                </div>

                {/* 3. Upcoming Coursework */}
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fffbeb' }}>
                    <Calendar size={22} color="#d97706" />
                  </div>
                  <div>
                    <div className="stat-number">{upcomingAssignmentsList.length}</div>
                    <div className="stat-label">Upcoming Coursework</div>
                  </div>
                </div>

                {/* 4. Pending Submissions */}
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fef2f2' }}>
                    <Clock size={22} color="#dc2626" />
                  </div>
                  <div>
                    <div className="stat-number">{pendingCount}</div>
                    <div className="stat-label">Pending Submissions</div>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="admin-quick-grid">
                <div
                  className="admin-quick-card"
                  onClick={() => handleNavClick('assignments')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="admin-quick-icon" style={{ background: '#eff6ff' }}>
                    <FileText size={20} color="#2563eb" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                      Browse Coursework
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {ongoingAssignments.length > 0
                        ? `${ongoingAssignments.length} active assignments currently open`
                        : 'View all department coursework'}
                    </div>
                  </div>
                </div>

                <div
                  className="admin-quick-card"
                  onClick={() => handleNavClick('grades')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="admin-quick-icon" style={{ background: '#ecfdf5' }}>
                    <Award size={20} color="#059669" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                      View Academic Grades
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {results.length > 0 ? `Average Score: ${averageMarks}/100` : 'Check evaluation results'}
                    </div>
                  </div>
                </div>

                <div
                  className="admin-quick-card"
                  onClick={() => handleNavClick('profile')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="admin-quick-icon" style={{ background: '#fef3c7' }}>
                    <User size={20} color="#d97706" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                      Student Profile
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Review credentials & change password
                    </div>
                  </div>
                </div>
              </div>

              {/* 🟢 SECTION: ONGOING ASSIGNMENTS */}
              <div className="card" style={{ border: '1px solid #bfdbfe', boxShadow: '0 4px 16px rgba(37, 99, 235, 0.05)' }}>
                <div
                  className="card-header"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '1.1rem 1.35rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: '#2563eb',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <PlayCircle size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: '#1e3a8a' }}>
                        Ongoing Coursework (Active Now)
                      </h3>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                        Assignments open for question paper download and answer submissions
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      className="badge"
                      style={{
                        background: ongoingAssignments.length > 0 ? '#dbeafe' : '#f1f5f9',
                        color: ongoingAssignments.length > 0 ? '#1d4ed8' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}
                    >
                      {ongoingAssignments.length} Active
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNavClick('assignments')}
                      className="btn btn-secondary btn-sm"
                      style={{ background: '#ffffff', borderColor: '#cbd5e1', fontWeight: 600 }}
                    >
                      <span>View All</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  {ongoingAssignments.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '2.5rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.65rem',
                        color: '#64748b'
                      }}
                    >
                      <CheckCircle2 size={36} color="#10b981" />
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                        No Ongoing Coursework Due
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', maxWidth: '400px' }}>
                        You don't have any active assignments waiting for submission right now. Great job staying on track!
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.15rem' }}>
                      {ongoingAssignments.map((ass) => {
                        const isSubmitted = !!ass.submission_id;
                        return (
                          <div
                            key={ass.assignment_id}
                            style={{
                              background: '#ffffff',
                              borderRadius: '12px',
                              padding: '1.2rem',
                              border: isSubmitted ? '1px solid #bbf7d0' : '1px solid #fed7aa',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '0.85rem',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                              position: 'relative'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.45rem' }}>
                                <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                                  {ass.sub_name}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: isDueSoon(ass.end_at) ? '#dc2626' : '#d97706'
                                  }}
                                >
                                  {getTimeRemaining(ass.end_at)}
                                </span>
                              </div>

                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', lineHeight: 1.35 }}>
                                {ass.ass_name}
                              </div>

                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                                Instructor: {ass.teach_name}
                              </div>

                              {ass.description && (
                                <div
                                  style={{
                                    fontSize: '0.8rem',
                                    color: '#475569',
                                    marginTop: '6px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {ass.description}
                                </div>
                              )}

                              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {isSubmitted ? (
                                  <span
                                    className="badge badge-success"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem' }}
                                  >
                                    <Check size={12} />
                                    <span>Submitted {new Date(ass.submitted_at).toLocaleDateString()}</span>
                                  </span>
                                ) : (
                                  <span
                                    className="badge badge-warning"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem' }}
                                  >
                                    <Clock size={12} />
                                    <span>Pending Submission</span>
                                  </span>
                                )}
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  Deadline: {formatDeadline(ass.end_at)}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                              {ass.question_doc_url && (
                                <button
                                  type="button"
                                  onClick={() => handleViewQuestionPaper(ass)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ flex: 1, minWidth: '100px', justifyContent: 'center', gap: '0.35rem', background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}
                                >
                                  <Eye size={13} />
                                  <span>View Paper</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenSubmitModal(ass)}
                                className="btn btn-primary btn-sm"
                                style={{ flex: 1, minWidth: '110px', justifyContent: 'center', gap: '0.35rem' }}
                              >
                                <UploadCloud size={13} />
                                <span>{isSubmitted ? 'Resubmit' : 'Submit Work'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 🔒 SECTION: UPCOMING ASSIGNMENTS */}
              <div className="card" style={{ border: '1px solid #fde68a', boxShadow: '0 4px 16px rgba(217, 119, 6, 0.05)' }}>
                <div
                  className="card-header"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #fffdfa 0%, #fef3c7 100%)',
                    borderBottom: '1px solid #fef08a',
                    padding: '1.1rem 1.35rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: '#d97706',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: '#92400e' }}>
                        Upcoming Coursework (Scheduled)
                      </h3>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#78350f' }}>
                        Future assignments scheduled by instructors that will unlock on their start date
                      </p>
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: upcomingAssignmentsList.length > 0 ? '#fef3c7' : '#f1f5f9',
                      color: upcomingAssignmentsList.length > 0 ? '#92400e' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      border: '1px solid #fde68a'
                    }}
                  >
                    {upcomingAssignmentsList.length} Scheduled
                  </span>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  {upcomingAssignmentsList.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '2.5rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.65rem',
                        color: '#64748b'
                      }}
                    >
                      <Calendar size={36} color="#94a3b8" />
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                        No Upcoming Assignments Scheduled
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', maxWidth: '400px' }}>
                        There are no future coursework tasks scheduled ahead at this time. All new assignments will appear here once planned by faculty.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.15rem' }}>
                      {upcomingAssignmentsList.map((ass) => (
                        <div
                          key={ass.assignment_id}
                          style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            padding: '1.2rem',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '0.85rem',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.45rem' }}>
                              <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.72rem', fontWeight: 700 }}>
                                {ass.sub_name}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: '#d97706',
                                  background: '#fffbeb',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #fef3c7'
                                }}
                              >
                                {getTimeUntilStart(ass.start_at)}
                              </span>
                            </div>

                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', lineHeight: 1.35 }}>
                              {ass.ass_name}
                            </div>

                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                              Instructor: {ass.teach_name}
                            </div>

                            {ass.description && (
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: '#475569',
                                  marginTop: '6px',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {ass.description}
                              </div>
                            )}

                            <div
                              style={{
                                marginTop: '0.85rem',
                                padding: '8px 10px',
                                background: '#fafaf9',
                                borderRadius: '8px',
                                border: '1px solid #f5f5f4',
                                fontSize: '0.75rem',
                                color: '#44403c',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#78716c' }}>Unlocks On:</span>
                                <strong style={{ color: '#d97706' }}>{formatDeadline(ass.start_at)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#78716c' }}>Submission Deadline:</span>
                                <strong style={{ color: '#0f172a' }}>{formatDeadline(ass.end_at)}</strong>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              padding: '8px',
                              background: '#fffbeb',
                              border: '1px dashed #fde68a',
                              borderRadius: '8px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              color: '#92400e'
                            }}
                          >
                            <Lock size={13} color="#d97706" />
                            <span>Question paper and answers unlock automatically at start time</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Enrolled Subjects Grid */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                      Enrolled Department Subjects
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Subjects automatically assigned under {departmentName}
                    </p>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '0.8rem' }}>
                    {subjects.length} Subjects
                  </span>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  {subjects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No subjects linked to your department yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                      {subjects.map((sub) => {
                        const subAssignments = assignments.filter((a) => a.sub_id === sub.sub_id);
                        return (
                          <div
                            key={sub.sub_id}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '1.1rem 1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.85rem'
                            }}
                          >
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <BookOpen size={20} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: '#0f172a',
                                  fontSize: '0.92rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={sub.sub_name}
                              >
                                {sub.sub_name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                {subAssignments.length} {subAssignments.length === 1 ? 'assignment' : 'assignments'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Evaluation Results Preview */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                      Recent Academic Evaluations
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Evaluations awarded by course instructors
                    </p>
                  </div>
                  {results.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleNavClick('grades')}
                      className="btn btn-secondary btn-sm"
                    >
                      <span>View All Grades ({results.length})</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>

                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Assignment</th>
                        <th>Evaluator</th>
                        <th>Marks</th>
                        <th>Feedback</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              <Award size={32} color="#94a3b8" />
                              <div style={{ fontWeight: 600, color: '#475569' }}>No evaluations recorded yet</div>
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                Your marks and teacher feedback will appear here once assignments are evaluated.
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        results.slice(0, 5).map((res) => (
                          <tr key={res.grade_id}>
                            <td>
                              <span className="badge badge-primary">{res.sub_name}</span>
                            </td>
                            <td style={{ fontWeight: 600, color: '#0f172a' }}>{res.ass_name}</td>
                            <td>
                              <span style={{ fontSize: '0.85rem', color: '#475569' }}>{res.teach_name}</span>
                            </td>
                            <td>
                              <span
                                className="badge"
                                style={{
                                  background:
                                    parseFloat(res.marks) >= 75
                                      ? '#ecfdf5'
                                      : parseFloat(res.marks) >= 50
                                      ? '#eff6ff'
                                      : '#fef2f2',
                                  color:
                                    parseFloat(res.marks) >= 75
                                      ? '#059669'
                                      : parseFloat(res.marks) >= 50
                                      ? '#2563eb'
                                      : '#dc2626',
                                  fontWeight: 800,
                                  fontSize: '0.88rem'
                                }}
                              >
                                {res.marks} / 100
                              </span>
                            </td>
                            <td style={{ maxWidth: '280px' }}>
                              <div
                                style={{
                                  fontSize: '0.82rem',
                                  color: '#475569',
                                  fontStyle: 'italic',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={res.feedback || 'No remarks provided'}
                              >
                                {res.feedback ? `"${res.feedback}"` : 'No remarks provided.'}
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleOpenFeedback(res)}
                                className="btn btn-secondary btn-sm"
                                title="View details"
                              >
                                <Eye size={13} />
                                <span>Details</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 2: ASSIGNMENT
             ═══════════════════════════════════════════════ */}
          {activeSection === 'assignments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              {/* Assignment Metric Summary Cards */}
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#eff6ff' }}>
                    <FileText size={22} color="#2563eb" />
                  </div>
                  <div>
                    <div className="stat-number">{assignments.length}</div>
                    <div className="stat-label">Total Coursework</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fffbeb' }}>
                    <Clock size={22} color="#d97706" />
                  </div>
                  <div>
                    <div className="stat-number">{pendingCount}</div>
                    <div className="stat-label">Pending Submission</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#ecfdf5' }}>
                    <FileCheck size={22} color="#059669" />
                  </div>
                  <div>
                    <div className="stat-number">{submittedCount}</div>
                    <div className="stat-label">Submitted Papers</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#f5f3ff' }}>
                    <Award size={22} color="#7c3aed" />
                  </div>
                  <div>
                    <div className="stat-number">{gradedCount}</div>
                    <div className="stat-label">Evaluated / Graded</div>
                  </div>
                </div>
              </div>

              {/* Search & Multi-Filter Toolbar */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Search input */}
                  <div style={{ position: 'relative', flex: '1 1 260px' }}>
                    <Search
                      size={17}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8'
                      }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search coursework by title, subject, or instructor..."
                      value={assignmentSearch}
                      onChange={(e) => setAssignmentSearch(e.target.value)}
                      style={{ paddingLeft: '38px', height: '42px' }}
                    />
                  </div>

                  {/* Subject filter */}
                  <select
                    className="form-control"
                    value={assignmentSubjectFilter}
                    onChange={(e) => setAssignmentSubjectFilter(e.target.value)}
                    style={{ flex: '0 1 200px', height: '42px' }}
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.sub_id} value={s.sub_id}>
                        {s.sub_name}
                      </option>
                    ))}
                  </select>

                  {/* Status filter */}
                  <select
                    className="form-control"
                    value={assignmentStatusFilter}
                    onChange={(e) => setAssignmentStatusFilter(e.target.value)}
                    style={{ flex: '0 1 180px', height: '42px' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Submission</option>
                    <option value="upcoming">Upcoming (Locked)</option>
                    <option value="submitted">Submitted</option>
                    <option value="graded">Graded / Evaluated</option>
                    <option value="closed">Closed / Past Due</option>
                  </select>

                  {/* Clear / Reset Filters */}
                  {(assignmentSearch || assignmentSubjectFilter || assignmentStatusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssignmentSearch('');
                        setAssignmentSubjectFilter('');
                        setAssignmentStatusFilter('all');
                      }}
                      className="btn btn-secondary"
                      style={{ height: '42px', padding: '0 1rem' }}
                      title="Clear all filters"
                    >
                      <RotateCcw size={15} />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', padding: '0 0.25rem' }}>
                  <span>
                    Showing <strong>{filteredAssignments.length}</strong> of <strong>{assignments.length}</strong> coursework assignments
                  </span>
                </div>
              </div>

              {/* Coursework Table / Cards */}
              <div className="card">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Subject & Faculty</th>
                        <th>Assignment Details</th>
                        <th>Question Paper</th>
                        <th>Submission Deadline</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                              <FileText size={36} color="#94a3b8" />
                              <div style={{ fontWeight: 700, color: '#334155', fontSize: '1rem' }}>
                                No coursework assignments found
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#94a3b8', maxWidth: '400px' }}>
                                {assignmentSearch || assignmentSubjectFilter || assignmentStatusFilter !== 'all'
                                  ? 'No assignments match your active search and filter criteria.'
                                  : 'No assignments are currently published for your enrolled department subjects.'}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredAssignments.map((ass) => {
                          const past = isPastDeadline(ass.end_at);
                          const upcoming = isUpcoming(ass.start_at);
                          const isSubmitted = !!ass.submission_id;
                          const isGraded = ass.marks !== null && ass.marks !== undefined;

                          return (
                            <tr key={ass.assignment_id}>
                              {/* Subject & Teacher */}
                              <td>
                                <span className="badge badge-primary">{ass.sub_name}</span>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                                  {ass.teach_name}
                                </div>
                              </td>

                              {/* Details */}
                              <td style={{ maxWidth: '320px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.94rem' }}>
                                  {ass.ass_name}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.8rem',
                                    color: '#64748b',
                                    marginTop: '2px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                  title={ass.description || 'No description'}
                                >
                                  {ass.description || 'No description provided.'}
                                </div>
                              </td>

                              {/* Question File */}
                              <td>
                                {upcoming ? (
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.4rem',
                                      background: '#f8fafc',
                                      color: '#64748b',
                                      border: '1px dashed #cbd5e1',
                                      padding: '4px 10px',
                                      borderRadius: '8px',
                                      fontSize: '0.78rem',
                                      fontWeight: 600
                                    }}
                                    title={`Question paper unlocks on ${formatDeadline(ass.start_at)}`}
                                  >
                                    <Lock size={12} color="#94a3b8" />
                                    <span>Locked until start</span>
                                  </div>
                                ) : ass.question_doc_url ? (
                                  <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleViewQuestionPaper(ass)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ gap: '0.35rem', background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}
                                      title="View Question Paper in page"
                                    >
                                      <Eye size={13} />
                                      <span>View</span>
                                    </button>
                                    <a
                                      href={api.fileUrl(ass.question_doc_url)}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => handleDownloadQuestionPaper(e, ass)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ gap: '0.35rem' }}
                                      title="Download Question Paper"
                                    >
                                      <Download size={13} />
                                      <span>Download</span>
                                    </a>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>None</span>
                                )}
                              </td>

                              {/* Deadline */}
                              <td>
                                <div
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: past ? 600 : 500,
                                    color: past ? '#dc2626' : '#0f172a'
                                  }}
                                >
                                  {formatDeadline(ass.end_at)}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: past ? '#dc2626' : isDueSoon(ass.end_at) ? '#d97706' : '#059669',
                                    marginTop: '2px'
                                  }}
                                >
                                  {getTimeRemaining(ass.end_at)}
                                </div>
                              </td>

                              {/* Status */}
                              <td>
                                {isGraded ? (
                                  <div>
                                    <span
                                      className="badge badge-success"
                                      style={{ fontWeight: 700, cursor: 'pointer' }}
                                      onClick={() => handleOpenFeedback(ass)}
                                      title="Click to view evaluation feedback"
                                    >
                                      Graded: {ass.marks}/100
                                    </span>
                                    {ass.feedback && (
                                      <div
                                        style={{
                                          fontSize: '0.72rem',
                                          color: '#475569',
                                          fontStyle: 'italic',
                                          marginTop: '3px',
                                          maxWidth: '180px',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}
                                      >
                                        "{ass.feedback}"
                                      </div>
                                    )}
                                  </div>
                                ) : isSubmitted ? (
                                  <div>
                                    <span className="badge badge-primary">Submitted</span>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                      {new Date(ass.submitted_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                ) : upcoming ? (
                                  <span
                                    className="badge"
                                    style={{
                                      background: '#f1f5f9',
                                      color: '#475569',
                                      border: '1px solid #cbd5e1',
                                      fontWeight: 600
                                    }}
                                  >
                                    🔒 Upcoming (Starts {new Date(ass.start_at).toLocaleDateString()})
                                  </span>
                                ) : past ? (
                                  <span className="badge badge-danger">Missed / Closed</span>
                                ) : (
                                  <span className="badge badge-warning">Pending Submission</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center' }}>
                                  {/* If upcoming: Show locked badge */}
                                  {upcoming && !isSubmitted && (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        fontSize: '0.78rem',
                                        color: '#94a3b8',
                                        fontWeight: 600,
                                        padding: '4px 10px',
                                        background: '#f8fafc',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0'
                                      }}
                                      title={`Submissions open on ${formatDeadline(ass.start_at)}`}
                                    >
                                      <Lock size={12} />
                                      <span>Opens Soon</span>
                                    </span>
                                  )}

                                  {/* Upload / Resubmit button if active (not upcoming, and not past deadline) */}
                                  {!past && !upcoming && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenSubmitModal(ass)}
                                      className="btn btn-primary btn-sm"
                                    >
                                      <UploadCloud size={13} />
                                      <span>{isSubmitted ? 'Resubmit' : 'Submit'}</span>
                                    </button>
                                  )}

                                  {/* View / Download submitted file if available */}
                                  {isSubmitted && ass.submission_doc_url && (
                                    <a
                                      href={api.fileUrl(ass.submission_doc_url)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="btn btn-secondary btn-sm"
                                      title="Download my submitted file"
                                    >
                                      <Download size={13} />
                                      <span>My Work</span>
                                    </a>
                                  )}

                                  {/* Feedback modal button if graded */}
                                  {isGraded && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenFeedback(ass)}
                                      className="btn btn-secondary btn-sm"
                                      title="View grade remarks"
                                    >
                                      <Eye size={13} />
                                      <span>Feedback</span>
                                    </button>
                                  )}

                                  {/* Past and not submitted */}
                                  {past && !isSubmitted && (
                                    <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
                                      Closed
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 3: GRADES
             ═══════════════════════════════════════════════ */}
          {activeSection === 'grades' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Performance KPI Cards */}
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#ecfdf5' }}>
                    <Award size={22} color="#059669" />
                  </div>
                  <div>
                    <div className="stat-number">{results.length}</div>
                    <div className="stat-label">Evaluated Coursework</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#eff6ff' }}>
                    <Sparkles size={22} color="#2563eb" />
                  </div>
                  <div>
                    <div className="stat-number">{averageMarks}%</div>
                    <div className="stat-label">Overall Average Mark</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#f5f3ff' }}>
                    <CheckCircle2 size={22} color="#7c3aed" />
                  </div>
                  <div>
                    <div className="stat-number">{highestScore} / 100</div>
                    <div className="stat-label">Highest Score</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fffbeb' }}>
                    <Clock size={22} color="#d97706" />
                  </div>
                  <div>
                    <div className="stat-number">{Math.max(0, submittedCount - results.length)}</div>
                    <div className="stat-label">Awaiting Teacher Grading</div>
                  </div>
                </div>
              </div>

              {/* Detailed Grades Table */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                      Academic Performance & Evaluator Feedback
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Official grades issued by University College of Jaffna faculty
                    </p>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Assignment</th>
                        <th>Instructor</th>
                        <th>Marks Awarded</th>
                        <th>Faculty Remarks & Feedback</th>
                        <th>Submitted File</th>
                        <th>Graded On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                              <Award size={40} color="#94a3b8" />
                              <div style={{ fontWeight: 700, color: '#334155', fontSize: '1.05rem' }}>
                                No evaluated grades recorded yet
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '420px' }}>
                                Once your course teachers assess your submitted solution documents, your marks and remarks will appear in this grade report.
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        results.map((res) => {
                          const markVal = parseFloat(res.marks) || 0;
                          return (
                            <tr key={res.grade_id}>
                              {/* Subject */}
                              <td>
                                <span className="badge badge-primary">{res.sub_name}</span>
                              </td>

                              {/* Assignment */}
                              <td style={{ fontWeight: 700, color: '#0f172a' }}>
                                {res.ass_name}
                              </td>

                              {/* Teacher */}
                              <td>
                                <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                                  {res.teach_name}
                                </span>
                              </td>

                              {/* Marks with Visual Indicator */}
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span
                                    className="badge"
                                    style={{
                                      fontSize: '0.92rem',
                                      fontWeight: 800,
                                      background: markVal >= 75 ? '#ecfdf5' : markVal >= 50 ? '#eff6ff' : '#fef2f2',
                                      color: markVal >= 75 ? '#059669' : markVal >= 50 ? '#2563eb' : '#dc2626',
                                      alignSelf: 'flex-start'
                                    }}
                                  >
                                    {res.marks} / 100
                                  </span>
                                  {/* Progress bar */}
                                  <div
                                    style={{
                                      width: '90px',
                                      height: '5px',
                                      background: '#e2e8f0',
                                      borderRadius: '3px',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${Math.min(100, Math.max(0, markVal))}%`,
                                        height: '100%',
                                        background: markVal >= 75 ? '#10b981' : markVal >= 50 ? '#3b82f6' : '#ef4444',
                                        borderRadius: '3px'
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Feedback */}
                              <td style={{ maxWidth: '280px' }}>
                                <div
                                  style={{
                                    fontSize: '0.82rem',
                                    color: '#334155',
                                    fontStyle: 'italic',
                                    background: '#f8fafc',
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: '8px',
                                    borderLeft: '3px solid #3b82f6'
                                  }}
                                >
                                  {res.feedback ? `"${res.feedback}"` : 'No comments provided.'}
                                </div>
                              </td>

                              {/* Submitted File */}
                              <td>
                                {res.submission_doc_url ? (
                                  <a
                                    href={api.fileUrl(res.submission_doc_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary btn-sm"
                                  >
                                    <Download size={13} />
                                    <span>View File</span>
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>None</span>
                                )}
                              </td>

                              {/* Graded At */}
                              <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {res.graded_at ? new Date(res.graded_at).toLocaleDateString() : 'Recently'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 4: PROFILE
             ═══════════════════════════════════════════════ */}
          {activeSection === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Profile Hero Card */}
              <div className="admin-profile-hero">
                <div className="admin-profile-left">
                  <div
                    className="admin-profile-avatar-large"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)'
                    }}
                  >
                    {studentInitial}
                  </div>
                  <div>
                    <div className="admin-profile-name">{studentName}</div>
                    <div className="admin-profile-email">
                      <Mail size={15} />
                      <span>{studentEmail || 'Email not registered'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <KeyRound size={15} />
                    <span>Change Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="btn btn-secondary btn-sm"
                    style={{
                      background: 'rgba(255, 82, 82, 0.2)',
                      color: '#ff6e6e',
                      borderColor: 'rgba(255, 82, 82, 0.3)'
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Profile Meta Grid */}
              <div className="admin-profile-meta-grid">
                <div className="admin-meta-box">
                  <div className="admin-meta-label">Student Index Number</div>
                  <div className="admin-meta-value" style={{ fontFamily: 'monospace', color: '#2563eb' }}>
                    {studentId}
                  </div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Academic Role</div>
                  <div className="admin-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={18} color="#10b981" />
                    <span>Undergraduate Student</span>
                  </div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Department</div>
                  <div className="admin-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building size={16} color="#64748b" />
                    <span>Department of {departmentName}</span>
                  </div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Official Email</div>
                  <div className="admin-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={16} color="#64748b" />
                    <span>{studentEmail || 'None'}</span>
                  </div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Enrolled Subjects</div>
                  <div className="admin-meta-value">{subjects.length} Subjects</div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Session Security</div>
                  <div className="admin-meta-value" style={{ color: '#059669', fontSize: '0.98rem' }}>
                    ● Active Student JWT Bearer
                  </div>
                </div>
              </div>

              {/* Enrolled Subjects List */}
              <div className="card">
                <div className="card-header">
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                    Enrolled Department Coursework Subjects
                  </h3>
                </div>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Subject ID</th>
                        <th>Subject Name</th>
                        <th>Department</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No enrolled subjects found.
                          </td>
                        </tr>
                      ) : (
                        subjects.map((sub) => (
                          <tr key={sub.sub_id}>
                            <td>
                              <span className="badge badge-primary">{sub.sub_id}</span>
                            </td>
                            <td style={{ fontWeight: 600, color: '#0f172a' }}>{sub.sub_name}</td>
                            <td>Department of {departmentName}</td>
                            <td>
                              <span className="badge badge-success" style={{ gap: '0.25rem' }}>
                                <Check size={12} />
                                <span>Enrolled</span>
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════
          MODAL: SUBMIT ASSIGNMENT WORK
         ═══════════════════════════════════════════════ */}
      {showSubmitModal && submittingAssignment && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '560px', width: '100%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    {submittingAssignment.submission_id ? 'Resubmit Coursework' : 'Submit Assignment'}
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {submittingAssignment.ass_name} ({submittingAssignment.sub_name})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.6rem', borderRadius: '8px' }}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmission}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* Deadline Notice */}
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#eff6ff',
                    borderRadius: '10px',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <Clock size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem', color: '#1e3a8a' }}>
                    <strong>Final Submission Deadline:</strong>{' '}
                    {formatDeadline(submittingAssignment.end_at)} (
                    <span style={{ fontWeight: 700 }}>{getTimeRemaining(submittingAssignment.end_at)}</span>)
                  </div>
                </div>

                {/* Question document reminder */}
                {submittingAssignment.question_doc_url && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                      Need to review the task questions?
                    </span>
                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                      <button
                        type="button"
                        onClick={() => handleViewQuestionPaper(submittingAssignment)}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '0.35rem', background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}
                      >
                        <Eye size={13} />
                        <span>View Paper</span>
                      </button>
                      <a
                        href={api.fileUrl(submittingAssignment.question_doc_url)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleDownloadQuestionPaper(submittingAssignment)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* File Upload Dropzone */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Select Answer / Report Document <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="file"
                    required
                    className="form-control"
                    accept=".pdf,.doc,.docx,.zip,.rar,.txt"
                    onChange={(e) => setSubmissionFile(e.target.files[0] || null)}
                    style={{ height: 'auto', padding: '0.65rem' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                    Accepted formats: PDF, Word (DOC, DOCX), ZIP, RAR, Plain Text. Files are securely archived in University College of Jaffna submissions vault.
                  </div>
                </div>

                {/* Selected File Preview */}
                {submissionFile && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.82rem',
                      color: '#166534'
                    }}
                  >
                    <CheckCircle2 size={16} color="#16a34a" />
                    <span style={{ fontWeight: 600 }}>Ready to upload:</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {submissionFile.name} ({(submissionFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !submissionFile}
                >
                  {submitting ? 'Uploading Answer...' : 'Upload & Submit Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          MODAL: VIEW EVALUATOR FEEDBACK & MARKS
         ═══════════════════════════════════════════════ */}
      {showFeedbackModal && selectedGrade && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Award size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    Evaluation Results
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {selectedGrade.ass_name} ({selectedGrade.sub_name})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.6rem', borderRadius: '8px' }}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Score Box */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  color: '#ffffff',
                  textAlign: 'center',
                  boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)'
                }}
              >
                <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9 }}>
                  Official Awarded Score
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.3rem 0' }}>
                  {selectedGrade.marks} <span style={{ fontSize: '1.25rem', opacity: 0.8 }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.82rem', opacity: 0.85 }}>
                  Evaluated by: {selectedGrade.teach_name}
                </div>
              </div>

              {/* Feedback remarks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Faculty Remarks & Comments
                </label>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1rem',
                    fontSize: '0.9rem',
                    color: '#1e293b',
                    lineHeight: 1.5,
                    fontStyle: selectedGrade.feedback ? 'italic' : 'normal'
                  }}
                >
                  {selectedGrade.feedback ? `"${selectedGrade.feedback}"` : 'No specific comments provided by evaluator.'}
                </div>
              </div>

              {/* Submitted file link */}
              {selectedGrade.submission_doc_url && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.82rem', color: '#1e3a8a', fontWeight: 500 }}>
                    Your Submitted Solution Document
                  </span>
                  <a
                    href={api.fileUrl(selectedGrade.submission_doc_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          MODAL: VIEW QUESTION PAPER
         ═══════════════════════════════════════════════ */}
      {showQuestionModal && viewingAssignment && (
        <div className="modal-backdrop">
          <div
            className="modal-content"
            style={{
              maxWidth: '980px',
              width: '95vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              className="modal-header"
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                background: '#ffffff',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <FileText size={22} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{viewingAssignment.sub_name}</span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Faculty: <strong>{viewingAssignment.teach_name}</strong>
                    </span>
                  </div>
                  <h3
                    style={{
                      margin: '0.2rem 0 0 0',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={viewingAssignment.ass_name}
                  >
                    Question Paper: {viewingAssignment.ass_name}
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <a
                  href={api.fileUrl(viewingAssignment.question_doc_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  title="Open in new browser tab"
                  style={{ gap: '0.35rem' }}
                >
                  <ExternalLink size={14} />
                  <span>Open Full</span>
                </a>
                <a
                  href={api.fileUrl(viewingAssignment.question_doc_url)}
                  download
                  onClick={() => handleDownloadQuestionPaper(viewingAssignment)}
                  className="btn btn-secondary btn-sm"
                  title="Download question paper"
                  style={{ gap: '0.35rem' }}
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.35rem 0.6rem', borderRadius: '8px' }}
                  title="Close viewer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              className="modal-body"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                background: '#f8fafc'
              }}
            >
              {/* Assignment Instructions / Description if present */}
              {viewingAssignment.description && (
                <div
                  style={{
                    padding: '0.85rem 1.15rem',
                    background: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '0.3rem'
                    }}
                  >
                    Teacher's Coursework Instructions
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    {viewingAssignment.description}
                  </div>
                </div>
              )}

              {/* Document Viewer Container */}
              <div
                style={{
                  flex: 1,
                  minHeight: '520px',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden'
                }}
              >
                {(() => {
                  if (isUpcoming(viewingAssignment?.start_at)) {
                    return (
                      <div
                        style={{
                          padding: '4rem 1.5rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '1rem'
                        }}
                      >
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: '#fef3c7',
                            color: '#d97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Lock size={32} />
                        </div>
                        <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: 700 }}>
                          Question Paper Locked
                        </h4>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem', maxWidth: '420px', lineHeight: 1.5 }}>
                          This question paper will automatically unlock when the assignment starts on{' '}
                          <strong>{formatDeadline(viewingAssignment.start_at)}</strong>.
                        </p>
                      </div>
                    );
                  }

                  const url = viewingAssignment.question_doc_url || '';
                  const ext = url.split('.').pop().toLowerCase();
                  const fullUrl = api.fileUrl(url);

                  if (ext === 'pdf') {
                    return (
                      <iframe
                        src={fullUrl}
                        title={`Question Paper - ${viewingAssignment.ass_name}`}
                        style={{
                          width: '100%',
                          height: '600px',
                          border: 'none',
                          background: '#525659'
                        }}
                      />
                    );
                  }

                  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
                    return (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#0f172a',
                          padding: '1.5rem',
                          minHeight: '500px',
                          overflow: 'auto'
                        }}
                      >
                        <img
                          src={fullUrl}
                          alt={`Question Paper - ${viewingAssignment.ass_name}`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '560px',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
                          }}
                        />
                      </div>
                    );
                  }

                  if (ext === 'txt') {
                    return (
                      <iframe
                        src={fullUrl}
                        title={`Question Paper - ${viewingAssignment.ass_name}`}
                        style={{
                          width: '100%',
                          height: '520px',
                          border: 'none',
                          background: '#ffffff',
                          padding: '1rem'
                        }}
                      />
                    );
                  }

                  return (
                    <div
                      style={{
                        padding: '3.5rem 1.5rem',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.85rem'
                      }}
                    >
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '16px',
                          background: '#eff6ff',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FileText size={32} />
                      </div>
                      <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: 700 }}>
                        Document Preview ({ext.toUpperCase()})
                      </h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem', maxWidth: '440px', lineHeight: 1.5 }}>
                        This question file format (.{ext}) cannot be rendered directly in the embedded browser preview. Please download the file to open it with your device's application.
                      </p>
                      <a
                        href={fullUrl}
                        download
                        className="btn btn-primary"
                        style={{ marginTop: '0.5rem', gap: '0.5rem' }}
                      >
                        <Download size={15} />
                        <span>Download Question Document</span>
                      </a>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="modal-footer"
              style={{
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid #e2e8f0',
                background: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                flexShrink: 0
              }}
            >
              <div
                style={{
                  fontSize: '0.82rem',
                  color: isPastDeadline(viewingAssignment.end_at) ? '#dc2626' : '#059669',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Clock size={15} />
                <span>
                  Deadline: {formatDeadline(viewingAssignment.end_at)} (
                  {getTimeRemaining(viewingAssignment.end_at)})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isPastDeadline(viewingAssignment.end_at) && !isUpcoming(viewingAssignment.start_at) && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuestionModal(false);
                      handleOpenSubmitModal(viewingAssignment);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.35rem' }}
                  >
                    <UploadCloud size={14} />
                    <span>
                      {viewingAssignment.submission_id ? 'Resubmit Coursework' : 'Submit Coursework'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          MODAL: RESET PASSWORD (Student)
         ═══════════════════════════════════════════════ */}
      <AdminResetPasswordModal
        isOpen={showResetModal}
        role="student"
        initialEmail={studentEmail}
        onClose={() => setShowResetModal(false)}
        onResetSuccess={() => {
          setMessage({
            type: 'success',
            text: 'Password updated successfully! Please use your new password next time you sign in.'
          });
          setShowResetModal(false);
        }}
      />
    </div>
  );
}
