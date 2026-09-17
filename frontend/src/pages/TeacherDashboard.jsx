import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AdminResetPasswordModal from '../components/AdminResetPasswordModal';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  User,
  LogOut,
  BookOpen,
  Plus,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  Eye,
  UserCheck,
  UserX,
  RefreshCw,
  Menu,
  X,
  Bell,
  KeyRound,
  Mail,
  ShieldCheck,
  ClipboardList,
  Sparkles,
  Search,
  Filter,
  Calendar
} from 'lucide-react';

export default function TeacherDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Create Assignment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    sub_id: '',
    ass_name: '',
    description: '',
    start_at: '',
    end_at: '',
    deadline_reminder_hr: 1
  });
  const [questionFile, setQuestionFile] = useState(null);

  // Submissions Modal
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionsData, setSubmissionsData] = useState(null);
  const [subsLoading, setSubsLoading] = useState(false);

  // Grade Modal
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });

  // Reset Password Modal
  const [showResetModal, setShowResetModal] = useState(false);

  // Assignments Filter & Search State
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentSubjectFilter, setAssignmentSubjectFilter] = useState('');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsData, assData] = await Promise.all([
        api.teacherGetSubjects(),
        api.teacherGetAssignments()
      ]);
      setSubjects(subsData);
      setAssignments(assData);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Helper: format Date to datetime-local string (YYYY-MM-DDTHH:MM)
  const toLocalDatetime = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Date constraint helpers
  // Opening Date: minimum is current date + 7 days (e.g. today 10th → earliest 17th), no max
  const minStartStr = toLocalDatetime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  // Minimum deadline = selected start_at + 7 days
  const getMinDeadline = (startVal) => {
    if (!startVal) return minStartStr;
    const startDate = new Date(startVal);
    return toLocalDatetime(new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleStartChange = (val) => {
    const minDeadline = getMinDeadline(val);
    setCreateForm(prev => ({
      ...prev,
      start_at: val,
      // Auto-adjust deadline if it's before the new minimum
      end_at: (!prev.end_at || prev.end_at < minDeadline) ? minDeadline : prev.end_at
    }));
  };

  useEffect(() => {
    loadData();
    // Default dates: start = now + 7 days, end = start + 7 days (now + 14 days)
    const now = new Date();
    const defaultStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const defaultEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    setCreateForm(prev => ({
      ...prev,
      start_at: toLocalDatetime(defaultStart),
      end_at: toLocalDatetime(defaultEnd)
    }));
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const messageTimer = setTimeout(() => {
      setMessage(null);
    }, 5000);
    return () => clearTimeout(messageTimer);
  }, [message]);

  // ── Navigation ──
  const teacherSections = ['home', 'assignments', 'profile'];
  const sectionFromUrl = location.pathname.replace(/^\/staff\/te_dashboard\/?/, '').split('/')[0];
  const activeSection = teacherSections.includes(sectionFromUrl) ? sectionFromUrl : 'home';

  const handleNavClick = (sectionKey) => {
    navigate(`/staff/te_dashboard/${sectionKey}`);
    setMobileMenuOpen(false);
    document.querySelector('.admin-main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Handlers ──
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('sub_id', createForm.sub_id);
      formData.append('ass_name', createForm.ass_name);
      formData.append('description', createForm.description || '');
      formData.append('start_at', createForm.start_at);
      formData.append('end_at', createForm.end_at);
      formData.append('deadline_reminder_hr', createForm.deadline_reminder_hr);
      if (questionFile) {
        formData.append('question_file', questionFile);
      }

      const res = await api.teacherCreateAssignment(formData);
      setMessage({ type: 'success', text: res.message });
      setShowCreateModal(false);
      setQuestionFile(null);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleOpenSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionsModal(true);
    setSubsLoading(true);
    try {
      const data = await api.teacherGetSubmissions(assignment.assignment_id);
      setSubmissionsData(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubsLoading(false);
    }
  };

  const handleOpenGrade = (studentSubmission) => {
    setGradingSubmission(studentSubmission);
    setGradeForm({
      marks: studentSubmission.marks !== null ? studentSubmission.marks : '',
      feedback: studentSubmission.feedback || ''
    });
    setShowGradeModal(true);
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    try {
      const res = await api.teacherGradeSubmission(
        gradingSubmission.submission_id,
        gradeForm.marks,
        gradeForm.feedback
      );
      setMessage({ type: 'success', text: res.message });
      setShowGradeModal(false);
      // Reload submissions
      if (selectedAssignment) {
        const data = await api.teacherGetSubmissions(selectedAssignment.assignment_id);
        setSubmissionsData(data);
      }
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // ── Derived data ──
  const teacherName = user?.name || user?.user_name || user?.user_id || 'Teacher';
  const teacherEmail = user?.email || '';
  const teacherId = user?.user_id || '';
  const teacherInitial = (teacherName || 'T').charAt(0).toUpperCase();

  const totalSubmissions = assignments.reduce((sum, a) => sum + (parseInt(a.total_submissions) || 0), 0);
  const totalEnrolled = assignments.reduce((sum, a) => sum + (parseInt(a.total_enrolled_students) || 0), 0);
  const pendingEvaluations = Math.max(0, totalEnrolled - totalSubmissions);

  const now = new Date();
  const activeAssignmentsCount = assignments.filter((a) => {
    const s = new Date(a.start_at);
    const e = new Date(a.end_at);
    return s <= now && e >= now;
  }).length;

  const upcomingAssignmentsCount = assignments.filter((a) => {
    const s = new Date(a.start_at);
    return s > now;
  }).length;

  const closedAssignmentsCount = assignments.filter((a) => {
    const e = new Date(a.end_at);
    return e < now;
  }).length;

  const filteredAssignments = assignments.filter((ass) => {
    const q = assignmentSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ass.ass_name?.toLowerCase().includes(q) ||
      ass.sub_name?.toLowerCase().includes(q) ||
      (ass.description && ass.description.toLowerCase().includes(q));

    const matchesSubject =
      !assignmentSubjectFilter || String(ass.sub_id) === String(assignmentSubjectFilter);

    const s = new Date(ass.start_at);
    const e = new Date(ass.end_at);
    let matchesStatus = true;
    if (assignmentStatusFilter === 'active') {
      matchesStatus = s <= now && e >= now;
    } else if (assignmentStatusFilter === 'upcoming') {
      matchesStatus = s > now;
    } else if (assignmentStatusFilter === 'closed') {
      matchesStatus = e < now;
    }

    return matchesSearch && matchesSubject && matchesStatus;
  });

  const getAssignmentStatus = (startAt, endAt) => {
    const n = new Date();
    const s = new Date(startAt);
    const e = new Date(endAt);
    if (s > n) {
      return { label: 'Upcoming', style: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' } };
    }
    if (e < n) {
      return { label: 'Closed', style: { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' } };
    }
    return { label: 'Active', style: { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' } };
  };

  return (
    <div className="admin-layout">
      {/* Mobile Top Header */}
      <div className="admin-mobile-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="admin-avatar-squircle" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>
            {teacherInitial}
          </div>
          <div className="admin-brand-text" style={{ fontSize: '1.2rem' }}>
            <span className="admin-brand-white">Smart</span>
            <span className="admin-brand-blue">Class</span>
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

      {/* Mobile Overlay */}
      <div
        className={`admin-sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* ──────────────────── SIDEBAR ──────────────────── */}
      <aside
        className={`admin-sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${
          mobileMenuOpen ? 'open' : ''
        }`}
      >
        {/* Brand Header & Toggle Button */}
        <div className="admin-sidebar-header">
          {!isCollapsed ? (
            <>
              <div className="admin-brand-text">
                <span className="admin-brand-white">Smart</span>
                <span className="admin-brand-blue">Class</span>
              </div>
              <button
                type="button"
                className="admin-toggle-btn"
                onClick={() => setIsCollapsed(true)}
                title="Collapse sidebar"
              >
                <ChevronLeft size={19} />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="admin-toggle-btn"
              onClick={() => setIsCollapsed(false)}
              title="Expand sidebar"
            >
              <ChevronRight size={19} />
            </button>
          )}
        </div>

        {/* User Card */}
        <div className="admin-sidebar-user">
          <div className="admin-avatar-squircle">
            {teacherInitial}
          </div>
          {!isCollapsed && (
            <div className="admin-user-details">
              <span className="admin-user-badge">FACULTY</span>
              <span className="admin-user-title">{teacherName}</span>
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

          {/* 2. Assignments */}
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'assignments' ? 'active' : ''}`}
            onClick={() => handleNavClick('assignments')}
            title="Assignments"
          >
            <FileText size={21} />
            {!isCollapsed && <span>Assignment</span>}
          </button>

          {/* 3. Profile */}
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

        {/* Sidebar Bottom: Sign Out */}
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
                {activeSection === 'home' && `Welcome back, ${teacherName}!`}
                {activeSection === 'assignments' && 'Assignment Management'}
                {activeSection === 'profile' && 'Faculty Profile'}
              </div>
              <div className="admin-greeting-sub">
                {activeSection === 'home' && 'Track student submissions, manage your subjects, and monitor academic progress.'}
                {activeSection === 'assignments' && 'Create coursework, configure deadline schedules, and track student submissions.'}
                {activeSection === 'profile' && 'View your academic credentials, subject affiliations, and profile settings.'}
              </div>
            </div>

            <div className="admin-top-actions">
              <span className="admin-role-pill">Faculty</span>
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
                onClick={() => setMessage({ type: 'success', text: 'All systems operating normally.' })}
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
              style={{ marginBottom: '1.5rem' }}
            >
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
              <button
                type="button"
                onClick={() => setMessage(null)}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit'
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 1: HOME
             ═══════════════════════════════════════════════ */}
          {activeSection === 'home' && (
            <div>
              {/* KPI Stat Cards */}
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#eff6ff' }}>
                    <BookOpen size={22} color="#2563eb" />
                  </div>
                  <div>
                    <div className="stat-number">{subjects.length}</div>
                    <div className="stat-label">Assigned Subjects</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fef3c7' }}>
                    <ClipboardList size={22} color="#d97706" />
                  </div>
                  <div>
                    <div className="stat-number">{assignments.length}</div>
                    <div className="stat-label">Total Assignments</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#ecfdf5' }}>
                    <UserCheck size={22} color="#059669" />
                  </div>
                  <div>
                    <div className="stat-number">{totalSubmissions}</div>
                    <div className="stat-label">Submissions Received</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fef2f2' }}>
                    <Clock size={22} color="#dc2626" />
                  </div>
                  <div>
                    <div className="stat-number">{pendingEvaluations > 0 ? pendingEvaluations : 0}</div>
                    <div className="stat-label">Pending Submissions</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="admin-quick-grid">
                <div
                  className="admin-quick-card"
                  onClick={() => { setShowCreateModal(true); }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="admin-quick-icon" style={{ background: '#eff6ff' }}>
                    <Plus size={20} color="#2563eb" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Create Assignment</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Post a new task for students</div>
                  </div>
                </div>

                <div
                  className="admin-quick-card"
                  onClick={() => handleNavClick('assignments')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="admin-quick-icon" style={{ background: '#fef3c7' }}>
                    <FileText size={20} color="#d97706" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>View Assignments</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Browse & manage all assignments</div>
                  </div>
                </div>

                <div
                  className="admin-quick-card"
                  onClick={loadData}
                  role="button"
                  tabIndex={0}
                >
                  <div className="admin-quick-icon" style={{ background: '#ecfdf5' }}>
                    <RefreshCw size={20} color="#059669" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Refresh Data</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Sync latest submissions & grades</div>
                  </div>
                </div>
              </div>

              {/* Assigned Subjects */}
              <div className="card">
                <div className="card-header">
                  <h3>Assigned Subjects ({subjects.length})</h3>
                </div>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Subject ID</th>
                        <th>Subject Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.length === 0 ? (
                        <tr>
                          <td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No subjects assigned yet.
                          </td>
                        </tr>
                      ) : (
                        subjects.map((s) => (
                          <tr key={s.sub_id}>
                            <td><span className="badge badge-primary">{s.sub_id}</span></td>
                            <td style={{ fontWeight: 600 }}>{s.sub_name}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Assignments (last 5) */}
              <div className="card">
                <div className="card-header">
                  <h3>Recent Assignments</h3>
                  <button onClick={() => handleNavClick('assignments')} className="btn btn-secondary btn-sm">
                    <span>View All</span>
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Title</th>
                        <th>Deadline</th>
                        <th>Submissions</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No assignments created yet.
                          </td>
                        </tr>
                      ) : (
                        assignments.slice(0, 5).map((ass) => (
                          <tr key={ass.assignment_id}>
                            <td><span className="badge badge-primary">{ass.sub_name}</span></td>
                            <td style={{ fontWeight: 600 }}>{ass.ass_name}</td>
                            <td style={{ fontSize: '0.85rem' }}>{new Date(ass.end_at).toLocaleString()}</td>
                            <td>
                              <span className="badge badge-success">
                                {ass.total_submissions} / {ass.total_enrolled_students}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleOpenSubmissions(ass)}
                                className="btn btn-secondary btn-sm"
                              >
                                <Eye size={14} />
                                <span>Track</span>
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
              SECTION 2: ASSIGNMENTS
             ═══════════════════════════════════════════════ */}
          {activeSection === 'assignments' && (
            <div>
              {/* Assignment Metric Summary Cards */}
              <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                    <ClipboardList size={22} />
                  </div>
                  <div>
                    <div className="stat-number">{assignments.length}</div>
                    <div className="stat-label">Total Assignments</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <CheckCircle size={22} />
                  </div>
                  <div>
                    <div className="stat-number">{activeAssignmentsCount}</div>
                    <div className="stat-label">Active & Ongoing</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <div className="stat-number">{upcomingAssignmentsCount}</div>
                    <div className="stat-label">Scheduled / Upcoming</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <div className="stat-number">{totalSubmissions}</div>
                    <div className="stat-label">Submissions Collected</div>
                  </div>
                </div>
              </div>

              {/* Assignments Directory Card */}
              <div className="card">
                {/* Header with Search and Create CTA */}
                <div
                  className="card-header"
                  style={{
                    flexWrap: 'wrap',
                    gap: '1rem',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                      Coursework & Assignments ({filteredAssignments.length})
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                      Publish coursework, monitor submission milestones, and evaluate student work.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Search Bar */}
                    <div className="admin-search-wrapper" style={{ minWidth: '220px' }}>
                      <Search size={15} className="admin-search-icon" />
                      <input
                        type="text"
                        className="admin-search-input"
                        placeholder="Search assignments..."
                        value={assignmentSearch}
                        onChange={(e) => setAssignmentSearch(e.target.value)}
                      />
                    </div>

                    {/* Create Assignment Button */}
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="btn btn-primary btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        height: '38px',
                        borderRadius: '8px',
                        padding: '0 1rem',
                        fontWeight: 600
                      }}
                    >
                      <Plus size={16} />
                      <span>Create Assignment</span>
                    </button>
                  </div>
                </div>

                {/* Filter Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.85rem 1.25rem',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    flexWrap: 'wrap',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <Filter size={15} />
                    <span>Filter:</span>
                  </div>

                  {/* Filter by Subject */}
                  <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
                    <select
                      className="form-control"
                      style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem', height: '36px', borderRadius: '8px' }}
                      value={assignmentSubjectFilter}
                      onChange={(e) => setAssignmentSubjectFilter(e.target.value)}
                    >
                      <option value="">All Subjects</option>
                      {subjects.map((s) => (
                        <option key={s.sub_id} value={s.sub_id}>
                          {s.sub_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Status */}
                  <div style={{ minWidth: '140px', flex: '1 1 140px' }}>
                    <select
                      className="form-control"
                      style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem', height: '36px', borderRadius: '8px' }}
                      value={assignmentStatusFilter}
                      onChange={(e) => setAssignmentStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Now</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="closed">Closed / Past Due</option>
                    </select>
                  </div>

                  {/* Clear Filters button */}
                  {(assignmentSearch || assignmentSubjectFilter || assignmentStatusFilter !== 'all') && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.8rem',
                        height: '36px',
                        borderRadius: '8px'
                      }}
                      onClick={() => {
                        setAssignmentSearch('');
                        setAssignmentSubjectFilter('');
                        setAssignmentStatusFilter('all');
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Table or Rich Empty State */}
                {filteredAssignments.length === 0 ? (
                  <div
                    style={{
                      padding: '3.5rem 1.5rem',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem'
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
                        justifyContent: 'center',
                        marginBottom: '0.5rem'
                      }}
                    >
                      {assignments.length === 0 ? <ClipboardList size={32} /> : <Search size={32} />}
                    </div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                      {assignments.length === 0 ? 'No Assignments Created Yet' : 'No Matching Assignments Found'}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '440px', fontSize: '0.9rem', margin: 0 }}>
                      {assignments.length === 0
                        ? 'Publish your first assignment for enrolled students with customizable deadlines, question attachments, and automated reminders.'
                        : 'No assignments matched your current search query or filter selection. Try resetting your filters to view all coursework.'}
                    </p>
                    {assignments.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary"
                        style={{ marginTop: '0.75rem' }}
                      >
                        <Plus size={16} />
                        <span>Create Assignment</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentSearch('');
                          setAssignmentSubjectFilter('');
                          setAssignmentStatusFilter('all');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '0.75rem' }}
                      >
                        Reset Search Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Assignment Details</th>
                          <th>Status & Timeline</th>
                          <th>Question File</th>
                          <th>Submissions</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssignments.map((ass) => {
                          const status = getAssignmentStatus(ass.start_at, ass.end_at);
                          const totalSub = parseInt(ass.total_submissions) || 0;
                          const totalEnrolled = parseInt(ass.total_enrolled_students) || 0;
                          const percent = totalEnrolled > 0 ? Math.round((totalSub / totalEnrolled) * 100) : 0;

                          return (
                            <tr key={ass.assignment_id}>
                              <td style={{ verticalAlign: 'middle' }}>
                                <span className="badge badge-primary" style={{ fontWeight: 600 }}>
                                  {ass.sub_name}
                                </span>
                              </td>
                              <td style={{ verticalAlign: 'middle', maxWidth: '300px' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                                  {ass.ass_name}
                                </div>
                                {ass.description ? (
                                  <div
                                    style={{
                                      fontSize: '0.8rem',
                                      color: 'var(--text-muted)',
                                      marginTop: '0.2rem',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title={ass.description}
                                  >
                                    {ass.description}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.2rem' }}>
                                    No description provided
                                  </div>
                                )}
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '0.2rem 0.55rem',
                                      borderRadius: '9999px',
                                      ...status.style
                                    }}
                                  >
                                    {status.label}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                                  <strong>Due:</strong> {new Date(ass.end_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                  Opened: {new Date(ass.start_at).toLocaleDateString()}
                                </div>
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                {ass.doc_url ? (
                                  <a
                                    href={api.fileUrl(ass.doc_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary btn-sm"
                                    style={{
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      padding: '0.3rem 0.6rem',
                                      fontSize: '0.78rem'
                                    }}
                                  >
                                    <Download size={13} />
                                    <span>Download</span>
                                  </a>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No document</span>
                                )}
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span
                                    className="badge badge-success"
                                    style={{ fontWeight: 600, fontSize: '0.78rem' }}
                                  >
                                    {totalSub} / {totalEnrolled}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    ({percent}%)
                                  </span>
                                </div>
                                {totalEnrolled > 0 && (
                                  <div
                                    style={{
                                      height: '4px',
                                      width: '100px',
                                      background: '#e2e8f0',
                                      borderRadius: '2px',
                                      marginTop: '0.35rem',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: '100%',
                                        width: `${Math.min(percent, 100)}%`,
                                        background: percent === 100 ? '#10b981' : '#2563eb',
                                        borderRadius: '2px'
                                      }}
                                    />
                                  </div>
                                )}
                              </td>
                              <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSubmissions(ass)}
                                  className="btn btn-primary btn-sm"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    fontSize: '0.82rem',
                                    padding: '0.4rem 0.75rem'
                                  }}
                                >
                                  <Eye size={14} />
                                  <span>Track & Grade</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 3: PROFILE
             ═══════════════════════════════════════════════ */}
          {activeSection === 'profile' && (
            <div>
              {/* Profile Hero Card */}
              <div className="admin-profile-hero">
                <div className="admin-profile-left">
                  <div className="admin-profile-avatar-large">
                    {teacherInitial}
                  </div>
                  <div>
                    <div className="admin-profile-name">{teacherName}</div>
                    <div className="admin-profile-email">
                      <Mail size={15} />
                      <span>{teacherEmail}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    <KeyRound size={15} />
                    <span>Change Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="btn btn-secondary btn-sm"
                    style={{ background: 'rgba(255, 82, 82, 0.2)', color: '#ff6e6e', borderColor: 'rgba(255, 82, 82, 0.3)' }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Profile Meta Grid */}
              <div className="admin-profile-meta-grid">
                <div className="admin-meta-box">
                  <div className="admin-meta-label">Staff ID</div>
                  <div className="admin-meta-value" style={{ fontFamily: 'monospace', color: '#2563eb' }}>
                    {teacherId}
                  </div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Role & Authority</div>
                  <div className="admin-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={18} color="#10b981" />
                    <span>Faculty / Teacher</span>
                  </div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Official Email</div>
                  <div className="admin-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={16} color="#64748b" />
                    <span>{teacherEmail || 'Not available'}</span>
                  </div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Assigned Subjects</div>
                  <div className="admin-meta-value">
                    {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'}
                  </div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Total Assignments Created</div>
                  <div className="admin-meta-value">{assignments.length}</div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Session Security</div>
                  <div className="admin-meta-value" style={{ color: '#059669', fontSize: '0.98rem' }}>
                    ● JWT Cookie Active (7 Days)
                  </div>
                </div>
              </div>

              {/* Subject List */}
              {subjects.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h3>Your Assigned Subjects</h3>
                  </div>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Subject ID</th>
                          <th>Subject Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((s) => (
                          <tr key={s.sub_id}>
                            <td><span className="badge badge-primary">{s.sub_id}</span></td>
                            <td style={{ fontWeight: 600 }}>{s.sub_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════
          MODAL: CREATE ASSIGNMENT
         ═══════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
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
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Create New Assignment</h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Set up coursework, question file, and submission timeline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.6rem', borderRadius: '8px' }}
                title="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAssignment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Subject</label>
                  <select
                    required
                    className="form-control"
                    value={createForm.sub_id}
                    onChange={(e) => setCreateForm({ ...createForm, sub_id: e.target.value })}
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map((s) => (
                      <option key={s.sub_id} value={s.sub_id}>{s.sub_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Assignment Title</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Lab Assignment 02 - Recursion & Trees"
                    value={createForm.ass_name}
                    onChange={(e) => setCreateForm({ ...createForm, ass_name: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Description & Instructions</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    style={{ resize: 'vertical', minHeight: '75px' }}
                    placeholder="Provide assignment guidelines, criteria, and requirements..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  />
                </div>

                <div className="assignment-modal-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Opening Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-control"
                      min={minStartStr}
                      value={createForm.start_at}
                      onChange={(e) => handleStartChange(e.target.value)}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                      Earliest opening date is 7 days from today.
                    </span>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Submission Deadline</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-control"
                      min={getMinDeadline(createForm.start_at)}
                      value={createForm.end_at}
                      onChange={(e) => setCreateForm({ ...createForm, end_at: e.target.value })}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                      Must be at least 7 days after the opening date.
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Deadline Reminder Beforehand (Hours: 1 - 8)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    required
                    className="form-control"
                    value={createForm.deadline_reminder_hr}
                    onChange={(e) => setCreateForm({ ...createForm, deadline_reminder_hr: parseInt(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    Automated notification alert sent to students before the deadline expires.
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Upload Question Document (PDF / DOC / DOCX / ZIP)
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.doc,.docx,.zip,.rar,.txt"
                    onChange={(e) => setQuestionFile(e.target.files[0])}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    File will be securely saved into the assignment question documents repository.
                  </span>
                </div>
              </div>

              <div className="modal-footer" style={{ gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  style={{ minWidth: '100px', height: '40px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minWidth: '160px', height: '40px', fontWeight: 600 }}
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          MODAL: SUBMISSION TRACKER & GRADING
         ═══════════════════════════════════════════════ */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div>
                <h3>Submission Tracker: {selectedAssignment.ass_name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Deadline: {new Date(selectedAssignment.end_at).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setShowSubmissionsModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {subsLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading submissions...</div>
              ) : submissionsData ? (
                <div>
                  {/* Status counts banner */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, background: '#ecfdf5', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserCheck color="#10b981" size={20} />
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#065f46' }}>{submissionsData.submitted_count}</div>
                        <div style={{ fontSize: '0.75rem', color: '#047857' }}>Submitted Students</div>
                      </div>
                    </div>

                    <div style={{ flex: 1, background: '#fff1f2', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserX color="#ef4444" size={20} />
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991b1b' }}>{submissionsData.pending_count}</div>
                        <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Pending Submissions</div>
                      </div>
                    </div>
                  </div>

                  {/* Submitted Students Table */}
                  <h4 style={{ marginBottom: '0.5rem' }}>Completed Submissions</h4>
                  <table className="table" style={{ marginBottom: '1.5rem' }}>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Submitted At</th>
                        <th>Submitted File</th>
                        <th>Grade</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissionsData.submitted_students.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No submissions yet.</td></tr>
                      ) : (
                        submissionsData.submitted_students.map((sub) => (
                          <tr key={sub.submission_id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{sub.std_name}</div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.std_id}</span>
                            </td>
                            <td style={{ fontSize: '0.8rem' }}>
                              {new Date(sub.submitted_at).toLocaleString()}
                            </td>
                            <td>
                              <a
                                href={api.fileUrl(sub.doc_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary btn-sm"
                              >
                                <Download size={13} />
                                <span>Answer File</span>
                              </a>
                            </td>
                            <td>
                              {sub.marks !== null ? (
                                <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                                  {sub.marks} / 100
                                </span>
                              ) : (
                                <span className="badge badge-warning">Ungraded</span>
                              )}
                            </td>
                            <td>
                              <button
                                onClick={() => handleOpenGrade(sub)}
                                className="btn btn-primary btn-sm"
                              >
                                <Award size={14} />
                                <span>{sub.marks !== null ? 'Edit Grade' : 'Grade'}</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Pending Students Table */}
                  <h4 style={{ marginBottom: '0.5rem' }}>Pending Students (Not Yet Submitted)</h4>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Index Number</th>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissionsData.pending_students.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: '#10b981' }}>All students have submitted!</td></tr>
                      ) : (
                        submissionsData.pending_students.map((st) => (
                          <tr key={st.std_id}>
                            <td><span className="badge badge-primary">{st.std_id}</span></td>
                            <td style={{ fontWeight: 600 }}>{st.std_name}</td>
                            <td>{st.email}</td>
                            <td><span className="badge badge-danger">Pending</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowSubmissionsModal(false)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          MODAL: GRADE SUBMISSION
         ═══════════════════════════════════════════════ */}
      {showGradeModal && gradingSubmission && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Grade Student Submission</h3>
              <button onClick={() => setShowGradeModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>
            <form onSubmit={handleSubmitGrade}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                  <p><strong>Student:</strong> {gradingSubmission.std_name} ({gradingSubmission.std_id})</p>
                  <p style={{ marginTop: '4px' }}>
                    <strong>Submitted Document:</strong>{' '}
                    <a href={api.fileUrl(gradingSubmission.doc_url)} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                      Download Submission
                    </a>
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Score / Marks (0 to 100)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    className="form-control"
                    placeholder="e.g. 85.0"
                    value={gradeForm.marks}
                    onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teacher Feedback (Optional)</label>
                  <textarea
                    className="form-control"
                    placeholder="Provide helpful comments, constructive feedback, or notes on student's solution..."
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  An automated email notification will be sent to the student upon recording this grade.
                </span>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowGradeModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Send Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          MODAL: RESET PASSWORD (OTP FLOW)
         ═══════════════════════════════════════════════ */}
      <AdminResetPasswordModal
        isOpen={showResetModal}
        role="teacher"
        initialEmail={teacherEmail}
        onClose={() => setShowResetModal(false)}
        onResetSuccess={() => {
          setShowResetModal(false);
          setMessage({
            type: 'success',
            text: 'Your password has been successfully reset! You can continue using your session.'
          });
        }}
      />
    </div>
  );
}
