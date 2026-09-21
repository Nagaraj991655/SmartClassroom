import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AdminResetPasswordModal from '../components/AdminResetPasswordModal';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  BookOpen,
  GraduationCap,
  Layers,
  User,
  Settings,
  LogOut,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Mail,
  Building,
  KeyRound,
  Menu,
  X,
  Bell,
  Sparkles,
  ClipboardList,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  RotateCcw,
  Calendar,
  BarChart2,
  PieChart,
  TrendingUp,
  Award,
  FileText
} from 'lucide-react';

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminChartMode, setAdminChartMode] = useState('all'); // 'all' | 'bar' | 'pie'

  // Core data states
  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departmentVisibleCount, setDepartmentVisibleCount] = useState(10);
  const [subjectVisibleCount, setSubjectVisibleCount] = useState(10);
  const [scrollingTable, setScrollingTable] = useState(null);
  const tableScrollTimer = useRef(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Search filters
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherFilterSubject, setTeacherFilterSubject] = useState('');
  const [teacherFilterDept, setTeacherFilterDept] = useState('');
  const [teacherDateFrom, setTeacherDateFrom] = useState('');
  const [teacherDateTo, setTeacherDateTo] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilterDept, setStudentFilterDept] = useState('');
  const [studentDateFrom, setStudentDateFrom] = useState('');
  const [studentDateTo, setStudentDateTo] = useState('');
  const [deptTooltip, setDeptTooltip] = useState({ visible: false, x: 0, y: 0, bottom: 0, deptName: '', subjects: '' });

  // Modals
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [staffIdError, setStaffIdError] = useState(null);

  // Form states
  const [teacherForm, setTeacherForm] = useState({
    teach_id: '',
    teach_name: '',
    email: '',
    password: '',
    subject_ids: []
  });

  const [studentForm, setStudentForm] = useState({
    std_id: '',
    std_name: '',
    email: '',
    password: '',
    dep_id: '',
    subject_ids: []
  });

  const [deptForm, setDeptForm] = useState({ dep_name: '', subject_names: [''] });
  const [subjectForm, setSubjectForm] = useState({ sub_name: '', dep_id: '' });

  const revealNextRows = (event, tableKey, totalRows, setVisibleCount) => {
    const tableContainer = event.currentTarget;
    const reachedBottom = tableContainer.scrollTop + tableContainer.clientHeight >= tableContainer.scrollHeight - 8;

    setScrollingTable(tableKey);
    if (tableScrollTimer.current) clearTimeout(tableScrollTimer.current);
    tableScrollTimer.current = setTimeout(() => {
      setScrollingTable(null);
    }, 700);

    if (reachedBottom && tableContainer.scrollHeight > tableContainer.clientHeight) {
      setVisibleCount((currentCount) => Math.min(currentCount + 10, totalRows));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, tData, stData, dData, subData] = await Promise.all([
        api.adminGetStats(),
        api.adminGetTeachers(),
        api.adminGetStudents(),
        api.adminGetDepartments(),
        api.adminGetSubjects()
      ]);
      setStats(sData);
      setTeachers(tData || []);
      setStudents(stData || []);
      setDepartments(dData || []);
      setSubjects(subData || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-hiding smooth blue scrollbar listener
    let scrollTimer = null;
    const onScroll = () => {
      document.body.classList.add('is-scrolling');
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 700);
    };

    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      if (scrollTimer) clearTimeout(scrollTimer);
      if (tableScrollTimer.current) clearTimeout(tableScrollTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!message) return undefined;

    const messageTimer = setTimeout(() => {
      setMessage(null);
    }, 5000);

    return () => clearTimeout(messageTimer);
  }, [message]);

  useEffect(() => {
    setDepartmentVisibleCount(10);
  }, [departments]);

  useEffect(() => {
    setSubjectVisibleCount(10);
  }, [subjects]);

  const calculateNextTeacherId = (existingTeachers = teachers) => {
    if (!existingTeachers || existingTeachers.length === 0) {
      return 'T001';
    }
    let maxNum = 0;
    existingTeachers.forEach((t) => {
      const tid = (t.teach_id || '').trim();
      const match = tid.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `T${String(nextNum).padStart(3, '0')}`;
  };

  const handleOpenAddTeacherModal = async () => {
    let nextId = calculateNextTeacherId(teachers);
    try {
      const res = await api.adminGetNextTeacherId();
      if (res && res.next_teach_id) {
        nextId = res.next_teach_id;
      }
    } catch (err) {
      // Fallback to client-side calculated ID
    }

    setEditingTeacher(null);
    setTeacherForm({
      teach_id: nextId,
      teach_name: '',
      email: '',
      password: '',
      subject_ids: []
    });
    setStaffIdError(null);
    setShowTeacherPassword(false);
    setShowTeacherModal(true);
  };

  const openTeacherEditor = (t) => {
    setEditingTeacher(t);
    const subIds = t.subject_ids
      ? String(t.subject_ids).split(',').map((n) => parseInt(n.trim(), 10)).filter(Boolean)
      : [];
    setTeacherForm({
      teach_id: t.teach_id,
      teach_name: t.teach_name || '',
      email: t.email || '',
      password: '',
      subject_ids: subIds
    });
    setStaffIdError(null);
    setShowTeacherPassword(false);
    setShowTeacherModal(true);
  };

  const openStudentEditor = (st) => {
    setEditingStudent(st);
    setStudentForm({
      std_id: st.std_id,
      std_name: st.std_name || '',
      email: st.email || '',
      password: '',
      dep_id: st.dep_id ? String(st.dep_id) : '',
      subject_ids: []
    });
    setShowStudentModal(true);
  };

  const handleTeachIdChange = async (val) => {
    const trimmed = val.trim();
    setTeacherForm((prev) => ({ ...prev, teach_id: val }));

    if (editingTeacher) return;

    if (!trimmed) {
      setStaffIdError('Staff ID is required.');
      return;
    }

    // Client-side check against existing teachers
    const clientExists = teachers.some(
      (t) => (t.teach_id || '').trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (clientExists) {
      setStaffIdError(`Staff ID '${trimmed}' already exists in database. Please enter a different ID.`);
      return;
    }

    // API check against database
    try {
      const res = await api.adminCheckTeacherId(trimmed);
      if (res && res.exists) {
        setStaffIdError(`Staff ID '${trimmed}' already exists in database. Please enter a different ID.`);
        return;
      }
    } catch (err) {
      // Ignore network errors on active typing
    }

    setStaffIdError(null);
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();

    if (editingTeacher) {
      try {
        const updatePayload = {
          teach_name: teacherForm.teach_name.trim(),
          email: teacherForm.email.trim(),
          subject_ids: teacherForm.subject_ids
        };
        if (teacherForm.password && teacherForm.password.trim().length >= 6) {
          updatePayload.password = teacherForm.password.trim();
        }
        const res = await api.adminUpdateTeacher(editingTeacher.teach_id, updatePayload);
        setMessage({ type: 'success', text: res.message });
        setShowTeacherModal(false);
        setEditingTeacher(null);
        setTeacherForm({ teach_id: '', teach_name: '', email: '', password: '', subject_ids: [] });
        loadData();
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      }
      return;
    }

    const cleanId = (teacherForm.teach_id || '').trim();
    if (!cleanId) {
      setStaffIdError('Staff ID is required.');
      return;
    }

    if (teachers.some((t) => (t.teach_id || '').trim().toLowerCase() === cleanId.toLowerCase())) {
      setStaffIdError(`Staff ID '${cleanId}' already exists in database. Please enter a different ID.`);
      return;
    }

    if (staffIdError) return;

    try {
      const res = await api.adminAddTeacher({
        ...teacherForm,
        teach_id: cleanId,
        teach_name: teacherForm.teach_name.trim(),
        email: teacherForm.email.trim()
      });
      setMessage({ type: 'success', text: res.message });
      setShowTeacherModal(false);
      setTeacherForm({ teach_id: '', teach_name: '', email: '', password: '', subject_ids: [] });
      setStaffIdError(null);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        const updatePayload = {
          std_name: studentForm.std_name.trim(),
          email: studentForm.email.trim().toLowerCase()
        };
        const res = await api.adminUpdateStudent(editingStudent.std_id, updatePayload);
        setMessage({ type: 'success', text: res.message });
        setShowStudentModal(false);
        setEditingStudent(null);
        setStudentForm({ std_id: '', std_name: '', email: '', password: '', dep_id: '', subject_ids: [] });
        loadData();
        return;
      }

      const res = await api.adminAddStudent({
        std_id: studentForm.std_id.trim(),
        std_name: studentForm.std_name.trim(),
        email: studentForm.email.trim().toLowerCase(),
        password: studentForm.password,
        dep_id: parseInt(studentForm.dep_id, 10),
        subject_ids: []
      });
      setMessage({ type: 'success', text: res.message });
      setShowStudentModal(false);
      setStudentForm({ std_id: '', std_name: '', email: '', password: '', dep_id: '', subject_ids: [] });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      const subjectNames = deptForm.subject_names
        .map((name) => name.trim())
        .filter(Boolean);
      const departmentData = editingDepartment
        ? { dep_name: deptForm.dep_name }
        : { dep_name: deptForm.dep_name, subject_names: subjectNames };
      const res = editingDepartment
        ? await api.adminUpdateDepartment(editingDepartment.dep_id, departmentData)
        : await api.adminAddDepartment(departmentData);
      setMessage({ type: 'success', text: res.message });
      setShowDeptModal(false);
      setEditingDepartment(null);
      setDeptForm({ dep_name: '', subject_names: [''] });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const data = {
        sub_name: subjectForm.sub_name,
        dep_id: subjectForm.dep_id ? parseInt(subjectForm.dep_id) : null
      };
      const res = editingSubject
        ? await api.adminUpdateSubject(editingSubject.sub_id, data)
        : await api.adminAddSubject(data);
      setMessage({ type: 'success', text: res.message });
      setShowSubjectModal(false);
      setEditingSubject(null);
      setSubjectForm({ sub_name: '', dep_id: '' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const openDepartmentEditor = (department) => {
    setEditingDepartment(department);
    setDeptForm({ dep_name: department.dep_name, subject_names: [''] });
    setShowDeptModal(true);
  };

  const openSubjectEditor = (subject) => {
    setEditingSubject(subject);
    setSubjectForm({
      sub_name: subject.sub_name,
      dep_id: subject.dep_id ? String(subject.dep_id) : ''
    });
    setShowSubjectModal(true);
  };

  const handleDeleteDepartment = async (department) => {
    setDeleteConfirmation({
      type: 'department',
      id: department.dep_id,
      name: department.dep_name
    });
  };

  const handleDeleteSubject = async (subject) => {
    setDeleteConfirmation({
      type: 'subject',
      id: subject.sub_id,
      name: subject.sub_name
    });
  };

  const handleDeleteTeacher = (teacher) => {
    setDeleteConfirmation({
      type: 'teacher',
      id: teacher.teach_id,
      name: teacher.teach_name
    });
  };

  const handleDeleteStudent = (student) => {
    setDeleteConfirmation({
      type: 'student',
      id: student.std_id,
      name: student.std_name
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    const pendingDelete = deleteConfirmation;
    setDeleteConfirmation(null);
    try {
      let res;
      if (pendingDelete.type === 'department') {
        res = await api.adminDeleteDepartment(pendingDelete.id);
      } else if (pendingDelete.type === 'teacher') {
        res = await api.adminDeleteTeacher(pendingDelete.id);
      } else if (pendingDelete.type === 'student') {
        res = await api.adminDeleteStudent(pendingDelete.id);
      } else {
        res = await api.adminDeleteSubject(pendingDelete.id);
      }
      setMessage({ type: 'success', text: res.message });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const adminSections = ['home', 'teachers', 'students', 'departments', 'profile', 'settings'];
  const sectionFromUrl = location.pathname.replace(/^\/staff\/ad_dashboard\/?/, '').split('/')[0];
  const activeSection = adminSections.includes(sectionFromUrl) ? sectionFromUrl : 'home';

  const handleNavClick = (sectionKey) => {
    navigate(`/staff/ad_dashboard/${sectionKey}`);
    setMobileMenuOpen(false);
    document.querySelector('.admin-main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatRegisteredDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    const d = new Date(typeof dateVal === 'string' ? dateVal.replace(' ', 'T') : dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredTeachers = teachers.filter((t) => {
    // Text search across ID, name, email
    const q = teacherSearch.toLowerCase().trim();
    if (q) {
      const matchesSearch =
        (t.teach_id && t.teach_id.toLowerCase().includes(q)) ||
        (t.teach_name && t.teach_name.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    // Filter by subject
    if (teacherFilterSubject) {
      const targetSub = teacherFilterSubject.toLowerCase().trim();
      const taughtList = (t.subjects_taught || '')
        .split(',')
        .map((s) => s.trim().toLowerCase());
      if (!taughtList.includes(targetSub)) return false;
    }

    // Filter by department (check teacher's dep_ids, departments or matched via subject)
    if (teacherFilterDept) {
      const deptId = String(teacherFilterDept);
      const teacherDepIds = t.dep_ids ? String(t.dep_ids).split(',').map((id) => id.trim()) : [];
      const teacherDeptNames = t.departments
        ? String(t.departments).split(',').map((d) => d.trim().toLowerCase())
        : [];
      
      const teacherSubIds = t.subject_ids
        ? String(t.subject_ids).split(',').map((id) => parseInt(id.trim())).filter(Boolean)
        : [];
      const deptSubjects = subjects
        .filter((s) => String(s.dep_id) === deptId)
        .map((s) => s.sub_id);
      const hasMatchingSubject = teacherSubIds.some((sid) => deptSubjects.includes(sid));

      const matchesDept =
        teacherDepIds.includes(deptId) ||
        hasMatchingSubject ||
        teacherDeptNames.includes(deptId.toLowerCase());

      if (!matchesDept) return false;
    }

    // Filter by date range (created_at)
    if (teacherDateFrom || teacherDateTo) {
      if (!t.created_at) return false;
      const regDate = new Date(typeof t.created_at === 'string' ? t.created_at.replace(' ', 'T') : t.created_at);
      if (isNaN(regDate.getTime())) return false;

      if (teacherDateFrom) {
        const from = new Date(teacherDateFrom + 'T00:00:00');
        if (regDate < from) return false;
      }
      if (teacherDateTo) {
        const to = new Date(teacherDateTo + 'T23:59:59.999');
        if (regDate > to) return false;
      }
    }

    return true;
  });

  const filteredStudents = students.filter((st) => {
    // 1. Text search by index, name, email
    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      const matchesSearch =
        (st.std_id && st.std_id.toLowerCase().includes(q)) ||
        (st.std_name && st.std_name.toLowerCase().includes(q)) ||
        (st.email && st.email.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    // 2. Filter by department
    if (studentFilterDept) {
      if (String(st.dep_id) !== String(studentFilterDept)) {
        return false;
      }
    }

    // 3. Filter by date range (created_at)
    if (studentDateFrom || studentDateTo) {
      if (!st.created_at) return false;
      const regDate = new Date(typeof st.created_at === 'string' ? st.created_at.replace(' ', 'T') : st.created_at);
      if (isNaN(regDate.getTime())) return false;

      if (studentDateFrom) {
        const from = new Date(studentDateFrom + 'T00:00:00');
        if (regDate < from) return false;
      }
      if (studentDateTo) {
        const to = new Date(studentDateTo + 'T23:59:59.999');
        if (regDate > to) return false;
      }
    }

    return true;
  });

  const adminUsername =
    user?.username ||
    user?.user_id ||
    (user?.email ? user.email.split('@')[0] : 'admin');

  const adminName = user?.name || user?.user_name || adminUsername;
  const adminEmail = user?.email || 'admin@ucj.ac.lk';
  const adminInitial = (adminName || adminUsername || 'A').charAt(0).toUpperCase();

  return (
    <div className="admin-layout">
      {/* Mobile Top Header */}
      <div className="admin-mobile-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="admin-avatar-squircle" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>
            {adminInitial}
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

      {/* PIXEL-PERFECT SIDEBAR: BLACK WITH EXPAND / COLLAPSE */}
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
            {adminInitial}
          </div>
          {!isCollapsed && (
            <div className="admin-user-details">
              <span className="admin-user-badge">ADMIN</span>
              <span className="admin-user-title">{adminName}</span>
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
            title="Dashboard"
          >
            <Home size={21} />
            {!isCollapsed && <span>Dashboard</span>}
          </button>

          {/* 2. Teachers */}
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'teachers' ? 'active' : ''}`}
            onClick={() => handleNavClick('teachers')}
            title="Teachers"
          >
            <BookOpen size={21} />
            {!isCollapsed && <span>Teachers</span>}
          </button>

          {/* 3. Students */}
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => handleNavClick('students')}
            title="Students"
          >
            <GraduationCap size={21} />
            {!isCollapsed && <span>Students</span>}
          </button>

          {/* 4. Department & Subject */}
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'departments' ? 'active' : ''}`}
            onClick={() => handleNavClick('departments')}
            title="Department & Subject"
          >
            <Layers size={21} />
            {!isCollapsed && <span>Dept & Subject</span>}
          </button>

          {/* 5. Profile */}
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('profile')}
            title="Profile"
          >
            <User size={21} />
            {!isCollapsed && <span>Profile</span>}
          </button>

          {/* 6. Settings */}
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
            title="Settings"
          >
            <Settings size={21} />
            {!isCollapsed && (
              <>
                <span>Settings</span>
                <ChevronDown size={16} className="admin-nav-item-chevron" />
              </>
            )}
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
            title="Sign Out"
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main">
        <div className="admin-content-container">
          {/* Top Greeting Bar Matching Screenshot */}
          <div className="admin-top-greeting-bar">
            <div>
              <div className="admin-greeting-title">
                Welcome back, {adminName}!
              </div>
              <div className="admin-greeting-sub">
                Here's what's happening with your classroom today.
              </div>
            </div>

            <div className="admin-top-actions">
              <span className="admin-role-pill">Admin</span>
              <button
                type="button"
                className="admin-action-circle"
                onClick={loadData}
                title="Refresh metrics"
              >
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
              </button>
              <button
                type="button"
                className="admin-action-circle"
                onClick={() => handleNavClick('settings')}
                title="Security settings"
              >
                <KeyRound size={16} />
              </button>
              <button
                type="button"
                className="admin-action-circle"
                onClick={() => setMessage({ type: 'success', text: 'All institutional systems operating normally.' })}
                title="System notifications"
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
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
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

          {/* =========================================================
              SECTION 1: DASHBOARD / HOME
             ========================================================= */}
          {activeSection === 'home' && (
            <div>
              {/* Stat KPI Cards on Cream Background */}
              {stats && (
                <div className="stat-grid">
                  <div
                    className="stat-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleNavClick('students')}
                  >
                    <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <div className="stat-number">{stats.students_count}</div>
                      <div className="stat-label">Total Students</div>
                    </div>
                  </div>

                  <div
                    className="stat-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleNavClick('teachers')}
                  >
                    <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <div className="stat-number">{stats.teachers_count}</div>
                      <div className="stat-label">Faculty Teachers</div>
                    </div>
                  </div>

                  <div
                    className="stat-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleNavClick('departments')}
                  >
                    <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                      <Layers size={24} />
                    </div>
                    <div>
                      <div className="stat-number">{stats.departments_count}</div>
                      <div className="stat-label">Total Departments</div>
                    </div>
                  </div>

                  <div
                    className="stat-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleNavClick('departments')}
                  >
                    <div className="stat-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                      <Building size={24} />
                    </div>
                    <div>
                      <div className="stat-number">{stats.subjects_count}</div>
                      <div className="stat-label">Course Subjects</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions Grid */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.85rem', fontWeight: 700 }}>Quick Actions</h3>
                <div className="admin-quick-grid">
                  <div
                    className="admin-quick-card"
                    onClick={handleOpenAddTeacherModal}
                  >
                    <div
                      className="admin-quick-icon"
                      style={{ background: '#e0e7ff', color: '#4338ca' }}
                    >
                      <Plus size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Add Teacher</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Register new faculty
                      </div>
                    </div>
                  </div>

                  <div
                    className="admin-quick-card"
                    onClick={() => setShowStudentModal(true)}
                  >
                    <div
                      className="admin-quick-icon"
                      style={{ background: '#ecfdf5', color: '#047857' }}
                    >
                      <Plus size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Add Student</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Enroll student index
                      </div>
                    </div>
                  </div>

                  <div
                    className="admin-quick-card"
                    onClick={() => setShowDeptModal(true)}
                  >
                    <div
                      className="admin-quick-icon"
                      style={{ background: '#f5f3ff', color: '#6d28d9' }}
                    >
                      <Plus size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Add Department</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Create academic unit
                      </div>
                    </div>
                  </div>

                  <div
                    className="admin-quick-card"
                    onClick={() => setShowSubjectModal(true)}
                  >
                    <div
                      className="admin-quick-icon"
                      style={{ background: '#fffbeb', color: '#b45309' }}
                    >
                      <Plus size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Add Subject</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Create curriculum course
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  ASSESSMENT ANALYTICS & VISUAL CHARTS (PIE & BAR)
                 ═══════════════════════════════════════════════════════════ */}
              {stats && stats.assessment_details && (() => {
                const details = stats.assessment_details || [];
                const upcomingCount = stats.upcoming_assignments || 0;
                const ongoingCount = stats.ongoing_assignments || 0;
                const finishedCount = stats.finished_assignments || 0;
                const totalAssessments = stats.assignments_count || 0;
                const totalPassed = stats.total_passed || 0;
                const totalFailed = stats.total_failed || 0;
                const totalGraded = stats.total_graded || 0;
                const totalSubmissions = stats.submissions_count || 0;
                const pendingGrading = Math.max(0, totalSubmissions - totalGraded);
                const passRate = totalGraded > 0 ? Math.round((totalPassed / totalGraded) * 100) : 0;

                return (
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                      padding: '1.35rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                      marginBottom: '1.5rem'
                    }}
                  >
                    {/* Analytics Header & View Mode Switcher */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <TrendingUp size={20} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                            Assessment Analytics & Insights
                          </h3>
                          <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                            Institution-wide assessment schedules, pass/fail rates, and student performance
                          </p>
                        </div>
                      </div>

                      {/* Chart View Toggle */}
                      <div
                        style={{
                          display: 'inline-flex',
                          background: '#f1f5f9',
                          padding: '3px',
                          borderRadius: '10px',
                          gap: '3px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setAdminChartMode('all')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: adminChartMode === 'all' ? '#ffffff' : 'transparent',
                            color: adminChartMode === 'all' ? '#0f172a' : '#64748b',
                            fontWeight: adminChartMode === 'all' ? 700 : 500,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            boxShadow: adminChartMode === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          All Visuals
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminChartMode('bar')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: adminChartMode === 'bar' ? '#ffffff' : 'transparent',
                            color: adminChartMode === 'bar' ? '#0f172a' : '#64748b',
                            fontWeight: adminChartMode === 'bar' ? 700 : 500,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            boxShadow: adminChartMode === 'bar' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <BarChart2 size={13} />
                          <span>Bar Chart</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminChartMode('pie')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: adminChartMode === 'pie' ? '#ffffff' : 'transparent',
                            color: adminChartMode === 'pie' ? '#0f172a' : '#64748b',
                            fontWeight: adminChartMode === 'pie' ? 700 : 500,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            boxShadow: adminChartMode === 'pie' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <PieChart size={13} />
                          <span>Pie / Donut</span>
                        </button>
                      </div>
                    </div>

                    {/* ─── DONUT CHARTS ─── */}
                    {(adminChartMode === 'all' || adminChartMode === 'pie') && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: '1.25rem'
                        }}
                      >
                        {/* Donut 1: Assignment Schedule Distribution */}
                        <div
                          style={{
                            background: '#f8fafc',
                            borderRadius: '12px',
                            padding: '1.2rem',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.94rem' }}>
                              Assessment Schedule Distribution
                            </div>
                            <span className="badge badge-primary" style={{ fontWeight: 700 }}>
                              {totalAssessments} Total
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', padding: '0.5rem 0' }}>
                            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                              <svg viewBox="0 0 160 160" width="150" height="150">
                                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#e2e8f0" strokeWidth="18" />
                                {totalAssessments > 0 ? (() => {
                                  const C = 2 * Math.PI * 60;
                                  const oDash = (ongoingCount / totalAssessments) * C;
                                  const uDash = (upcomingCount / totalAssessments) * C;
                                  const fDash = (finishedCount / totalAssessments) * C;
                                  return (
                                    <>
                                      {ongoingCount > 0 && (
                                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="#2563eb" strokeWidth="18"
                                          strokeDasharray={`${oDash} ${C}`} strokeDashoffset="0"
                                          transform="rotate(-90 80 80)" strokeLinecap="round"
                                          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                                      )}
                                      {upcomingCount > 0 && (
                                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="#8b5cf6" strokeWidth="18"
                                          strokeDasharray={`${uDash} ${C}`} strokeDashoffset={-oDash}
                                          transform="rotate(-90 80 80)" strokeLinecap="round"
                                          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                                      )}
                                      {finishedCount > 0 && (
                                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="#94a3b8" strokeWidth="18"
                                          strokeDasharray={`${fDash} ${C}`} strokeDashoffset={-(oDash + uDash)}
                                          transform="rotate(-90 80 80)" strokeLinecap="round"
                                          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                                      )}
                                    </>
                                  );
                                })() : null}
                              </svg>
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{totalAssessments}</span>
                                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Assessments</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, minWidth: '130px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563eb' }} />
                                  <span style={{ color: '#475569' }}>Ongoing</span>
                                </div>
                                <strong style={{ color: '#0f172a' }}>{ongoingCount}</strong>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6' }} />
                                  <span style={{ color: '#475569' }}>Upcoming</span>
                                </div>
                                <strong style={{ color: '#0f172a' }}>{upcomingCount}</strong>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#94a3b8' }} />
                                  <span style={{ color: '#475569' }}>Finished</span>
                                </div>
                                <strong style={{ color: '#0f172a' }}>{finishedCount}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Donut 2: Pass vs Fail Distribution */}
                        <div
                          style={{
                            background: '#f8fafc',
                            borderRadius: '12px',
                            padding: '1.2rem',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.94rem' }}>
                              Overall Pass / Fail Rate
                            </div>
                            <span
                              className="badge"
                              style={{
                                background: passRate >= 75 ? '#ecfdf5' : passRate >= 50 ? '#eff6ff' : '#fef2f2',
                                color: passRate >= 75 ? '#059669' : passRate >= 50 ? '#2563eb' : '#dc2626',
                                fontWeight: 700
                              }}
                            >
                              {passRate}% Pass
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', padding: '0.5rem 0' }}>
                            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                              <svg viewBox="0 0 160 160" width="150" height="150">
                                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#e2e8f0" strokeWidth="18" />
                                {totalGraded > 0 ? (() => {
                                  const C = 2 * Math.PI * 60;
                                  const pDash = (totalPassed / totalGraded) * C;
                                  const fDash = (totalFailed / totalGraded) * C;
                                  return (
                                    <>
                                      {totalPassed > 0 && (
                                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="#10b981" strokeWidth="18"
                                          strokeDasharray={`${pDash} ${C}`} strokeDashoffset="0"
                                          transform="rotate(-90 80 80)" strokeLinecap="round"
                                          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                                      )}
                                      {totalFailed > 0 && (
                                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="#ef4444" strokeWidth="18"
                                          strokeDasharray={`${fDash} ${C}`} strokeDashoffset={-pDash}
                                          transform="rotate(-90 80 80)" strokeLinecap="round"
                                          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                                      )}
                                    </>
                                  );
                                })() : null}
                              </svg>
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{passRate}%</span>
                                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Pass Rate</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, minWidth: '130px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                                  <span style={{ color: '#475569' }}>Passed (≥50)</span>
                                </div>
                                <strong style={{ color: '#0f172a' }}>{totalPassed}</strong>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                                  <span style={{ color: '#475569' }}>Failed (&lt;50)</span>
                                </div>
                                <strong style={{ color: '#0f172a' }}>{totalFailed}</strong>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.45rem' }}>
                                <span style={{ color: '#64748b' }}>Pending Grade</span>
                                <strong style={{ color: '#0f172a' }}>{pendingGrading}</strong>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                <span style={{ color: '#64748b' }}>Total Graded</span>
                                <strong style={{ color: '#0f172a' }}>{totalGraded}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ─── BAR CHART: Per-Assessment Breakdown ─── */}
                    {(adminChartMode === 'all' || adminChartMode === 'bar') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.94rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <BarChart2 size={16} color="#2563eb" />
                          Per-Assessment Student Performance
                        </div>

                        {details.length === 0 ? (
                          <div style={{
                            textAlign: 'center',
                            padding: '2.5rem 1.5rem',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px dashed #cbd5e1',
                            color: '#64748b',
                            fontSize: '0.88rem'
                          }}>
                            <FileText size={36} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
                            <div style={{ fontWeight: 600 }}>No assessments found</div>
                            <div style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>Assessment data will appear here once teachers publish assignments.</div>
                          </div>
                        ) : (
                          details.map((d) => {
                            const enrolled = d.enrolled_count || 0;
                            const passed = d.passed_count || 0;
                            const failed = d.failed_count || 0;
                            const pending = d.pending_count || 0;
                            const avgMarks = d.average_marks != null ? d.average_marks : null;
                            const total = enrolled || 1;
                            const passPct = Math.round((passed / total) * 100);
                            const failPct = Math.round((failed / total) * 100);
                            const pendingPct = Math.round((pending / total) * 100);
                            const statusColor = d.status === 'ongoing' ? '#2563eb' : d.status === 'upcoming' ? '#8b5cf6' : '#64748b';
                            const statusBg = d.status === 'ongoing' ? '#eff6ff' : d.status === 'upcoming' ? '#f5f3ff' : '#f1f5f9';
                            const statusLabel = d.status === 'ongoing' ? '🟢 Active' : d.status === 'upcoming' ? '🔒 Upcoming' : 'Completed';

                            return (
                              <div
                                key={d.assignment_id}
                                style={{
                                  background: '#f8fafc',
                                  borderRadius: '12px',
                                  padding: '1rem 1.2rem',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.65rem'
                                }}
                              >
                                {/* Assignment Header */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                                    <span
                                      className="badge"
                                      style={{
                                        background: '#dbeafe',
                                        color: '#1e40af',
                                        fontWeight: 600,
                                        fontSize: '0.72rem',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {d.sub_name}
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {d.ass_name}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        color: statusColor,
                                        background: statusBg,
                                        padding: '3px 10px',
                                        borderRadius: '20px',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {statusLabel}
                                    </span>
                                    {avgMarks != null && (
                                      <span
                                        className="badge"
                                        style={{
                                          background: avgMarks >= 75 ? '#ecfdf5' : avgMarks >= 50 ? '#eff6ff' : '#fef2f2',
                                          color: avgMarks >= 75 ? '#059669' : avgMarks >= 50 ? '#2563eb' : '#dc2626',
                                          fontWeight: 700,
                                          fontSize: '0.72rem'
                                        }}
                                      >
                                        Avg: {avgMarks}%
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Stacked Progress Bar */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                                    <span>{enrolled} enrolled students</span>
                                    <span style={{ fontWeight: 600 }}>
                                      {d.submitted_count || 0} / {enrolled} submitted
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      width: '100%',
                                      height: '22px',
                                      borderRadius: '11px',
                                      background: '#e2e8f0',
                                      overflow: 'hidden',
                                      display: 'flex',
                                      position: 'relative'
                                    }}
                                  >
                                    {passed > 0 && (
                                      <div
                                        style={{
                                          width: `${passPct}%`,
                                          height: '100%',
                                          background: 'linear-gradient(90deg, #10b981, #34d399)',
                                          transition: 'width 0.6s ease',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        {passPct >= 12 && (
                                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
                                            {passed} pass
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {failed > 0 && (
                                      <div
                                        style={{
                                          width: `${failPct}%`,
                                          height: '100%',
                                          background: 'linear-gradient(90deg, #ef4444, #f87171)',
                                          transition: 'width 0.6s ease',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        {failPct >= 12 && (
                                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
                                            {failed} fail
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {pending > 0 && (
                                      <div
                                        style={{
                                          width: `${pendingPct}%`,
                                          height: '100%',
                                          background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                                          transition: 'width 0.6s ease',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        {pendingPct >= 14 && (
                                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
                                            {pending} pending
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Stats Footer */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.76rem', color: '#64748b' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                                    <span>{passed} passed</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                                    <span>{failed} failed</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                                    <span>{pending} pending</span>
                                  </div>
                                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem' }}>
                                    <Award size={12} color="#64748b" />
                                    <span>by {d.teach_name}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Institution System Health Card */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 style={{ fontSize: '1.15rem' }}>Institutional Governance Status</h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                      SmartClassroom platform verified and active for University College of Jaffna.
                    </p>
                  </div>
                  <span className="badge badge-success">Operational</span>
                </div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <ShieldCheck size={20} color="#10b981" />
                    <span>Role-Based Access Control (RBAC) active on all administrator and academic endpoints.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <KeyRound size={20} color="#2563eb" />
                    <span>JWT cookie token verification guarding master route <code>/staff/ad_dashboard</code>.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <Building size={20} color="#7c3aed" />
                    <span>PostgreSQL database connected with automated schema seeding.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              SECTION 2: TEACHERS
             ========================================================= */}
          {activeSection === 'teachers' && (
            <div className="card">
              <div
                className="card-header"
                style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}
              >
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>Faculty Teachers</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Staff credentials, assigned subjects, and teaching profiles ({teachers.length} total)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div className="admin-search-wrapper">
                    <Search size={15} className="admin-search-icon" />
                    <input
                      type="text"
                      className="admin-search-input"
                      placeholder="Search by ID, name, email..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddTeacherModal}
                    className="btn btn-primary btn-sm"
                    style={{ background: '#2563eb', borderColor: '#2563eb' }}
                  >
                    <Plus size={16} />
                    <span>Add Teacher</span>
                  </button>
                </div>
              </div>

              {/* Filter Controls Bar */}
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
                  <span>Filters:</span>
                </div>

                {/* Filter by Department */}
                <div style={{ minWidth: '150px', flex: '1 1 150px' }}>
                  <select
                    className="form-control"
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem', height: '36px', borderRadius: '8px' }}
                    value={teacherFilterDept}
                    onChange={(e) => setTeacherFilterDept(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.dep_id} value={d.dep_id}>
                        {d.dep_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Subject */}
                <div style={{ minWidth: '150px', flex: '1 1 150px' }}>
                  <select
                    className="form-control"
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem', height: '36px', borderRadius: '8px' }}
                    value={teacherFilterSubject}
                    onChange={(e) => setTeacherFilterSubject(e.target.value)}
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.sub_id} value={s.sub_name}>
                        {s.sub_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Date Range */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>From:</span>
                    <input
                      type="date"
                      className="form-control"
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '36px', borderRadius: '8px', width: '135px' }}
                      value={teacherDateFrom}
                      onChange={(e) => setTeacherDateFrom(e.target.value)}
                      title="Registration Start Date"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>To:</span>
                    <input
                      type="date"
                      className="form-control"
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '36px', borderRadius: '8px', width: '135px' }}
                      value={teacherDateTo}
                      onChange={(e) => setTeacherDateTo(e.target.value)}
                      title="Registration End Date"
                    />
                  </div>
                </div>

                {/* Clear Filters button */}
                {(teacherSearch || teacherFilterSubject || teacherFilterDept || teacherDateFrom || teacherDateTo) && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      borderRadius: '8px'
                    }}
                    onClick={() => {
                      setTeacherSearch('');
                      setTeacherFilterSubject('');
                      setTeacherFilterDept('');
                      setTeacherDateFrom('');
                      setTeacherDateTo('');
                    }}
                    title="Reset all filters"
                  >
                    <RotateCcw size={13} />
                    <span>Clear</span>
                  </button>
                )}

                {/* Count badge */}
                <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredTeachers.length}</strong> of {teachers.length} teachers
                </div>
              </div>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Teacher ID</th>
                      <th>Teacher Name</th>
                      <th>Email Address</th>
                      <th>Subjects Assigned</th>
                      <th>Registered Date</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                          {teachers.length === 0
                            ? 'No teachers registered yet.'
                            : 'No teachers match your search or filter criteria.'}
                        </td>
                      </tr>
                    ) : (
                      filteredTeachers.map((t) => (
                        <tr key={t.teach_id}>
                          <td>
                            <span className="badge badge-primary">{t.teach_id}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{t.teach_name}</td>
                          <td>{t.email}</td>
                          <td>
                            {t.subjects_taught ? (
                              <span style={{ fontWeight: 500 }}>{t.subjects_taught}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>None assigned</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {formatRegisteredDate(t.created_at)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                title="Edit Teacher"
                                onClick={() => openTeacherEditor(t)}
                                style={{ padding: '0.3rem 0.45rem', lineHeight: 1 }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm"
                                title="Delete Teacher"
                                onClick={() => handleDeleteTeacher(t)}
                                style={{ padding: '0.3rem 0.45rem', lineHeight: 1, color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              SECTION 3: STUDENTS
             ========================================================= */}
          {activeSection === 'students' && (
            <div className="card">
              <div
                className="card-header"
                style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}
              >
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>Enrolled Students</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Student index numbers, departments, and course enrollments ({students.length} total)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div className="admin-search-wrapper">
                    <Search size={15} className="admin-search-icon" />
                    <input
                      type="text"
                      className="admin-search-input"
                      placeholder="Search index, name, email..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudent(null);
                      setStudentForm({ std_id: '', std_name: '', email: '', password: '', dep_id: '', subject_ids: [] });
                      setShowStudentModal(true);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ background: '#2563eb', borderColor: '#2563eb' }}
                  >
                    <Plus size={16} />
                    <span>Add Student</span>
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
                  <span>Filters:</span>
                </div>

                {/* Filter by Department */}
                <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
                  <select
                    className="form-control"
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem', height: '36px', borderRadius: '8px' }}
                    value={studentFilterDept}
                    onChange={(e) => setStudentFilterDept(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.dep_id} value={d.dep_id}>
                        {d.dep_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Date Range */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>From:</span>
                    <input
                      type="date"
                      className="form-control"
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '36px', borderRadius: '8px', width: '135px' }}
                      value={studentDateFrom}
                      onChange={(e) => setStudentDateFrom(e.target.value)}
                      title="Registration Start Date"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>To:</span>
                    <input
                      type="date"
                      className="form-control"
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '36px', borderRadius: '8px', width: '135px' }}
                      value={studentDateTo}
                      onChange={(e) => setStudentDateTo(e.target.value)}
                      title="Registration End Date"
                    />
                  </div>
                </div>

                {/* Clear Filters button */}
                {(studentSearch || studentFilterDept || studentDateFrom || studentDateTo) && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      borderRadius: '8px'
                    }}
                    onClick={() => {
                      setStudentSearch('');
                      setStudentFilterDept('');
                      setStudentDateFrom('');
                      setStudentDateTo('');
                    }}
                    title="Reset all filters"
                  >
                    <RotateCcw size={13} />
                    <span>Clear</span>
                  </button>
                )}

                {/* Count badge */}
                <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredStudents.length}</strong> of {students.length} students
                </div>
              </div>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Index Number</th>
                      <th>Student Name</th>
                      <th>Department</th>
                      <th>Email Address</th>
                      <th>Enrolled Subjects</th>
                      <th>Registered Date</th>
                      <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                          {students.length === 0
                            ? 'No students registered yet.'
                            : 'No students match your search or filter criteria.'}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => (
                        <tr key={st.std_id}>
                          <td>
                            <span className="badge badge-primary">{st.std_id}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{st.std_name}</td>
                          <td
                            style={{ position: 'relative' }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDeptTooltip({
                                visible: true,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                                bottom: rect.bottom,
                                deptName: st.dep_name || 'General',
                                subjects: st.enrolled_subjects || ''
                              });
                            }}
                            onMouseLeave={() => {
                              setDeptTooltip((prev) => ({ ...prev, visible: false }));
                            }}
                          >
                            <span
                              className="badge badge-success"
                              style={{
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Building size={12} />
                              <span>{st.dep_name || 'General'}</span>
                            </span>
                          </td>
                          <td>{st.email}</td>
                          <td>
                            {st.enrolled_subjects ? (
                              <span style={{ fontWeight: 500 }}>{st.enrolled_subjects}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>None enrolled</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {formatRegisteredDate(st.created_at)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                title="Edit Student"
                                onClick={() => openStudentEditor(st)}
                                style={{ padding: '0.3rem 0.45rem', lineHeight: 1 }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm"
                                title="Delete Student"
                                onClick={() => handleDeleteStudent(st)}
                                style={{ padding: '0.3rem 0.45rem', lineHeight: 1, color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              SECTION 4: DEPARTMENTS & SUBJECTS
             ========================================================= */}
          {activeSection === 'departments' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '1.75rem'
              }}
            >
              {/* Academic Departments */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 style={{ fontSize: '1.15rem' }}>Academic Departments</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Total: {departments.length} departments
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDepartment(null);
                      setDeptForm({ dep_name: '', subject_names: [''] });
                      setShowDeptModal(true);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <Plus size={15} />
                    <span>Add Dept</span>
                  </button>
                </div>
                <div
                  className={`table-responsive admin-lazy-table ${scrollingTable === 'departments' ? 'is-table-scrolling' : ''}`}
                  onScroll={(event) => revealNextRows(event, 'departments', departments.length, setDepartmentVisibleCount)}
                  style={{ maxHeight: '430px', overflowY: 'auto' }}
                >
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Dept ID</th>
                        <th>Department Name</th>
                        <th style={{ width: '120px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            No departments created yet.
                          </td>
                        </tr>
                      ) : (
                        departments.slice(0, departmentVisibleCount).map((d) => (
                          <tr key={d.dep_id}>
                            <td>
                              <span className="badge badge-primary">#{d.dep_id}</span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{d.dep_name}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  title={`Edit ${d.dep_name}`}
                                  aria-label={`Edit ${d.dep_name}`}
                                  onClick={() => openDepartmentEditor(d)}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  title={`Delete ${d.dep_name}`}
                                  aria-label={`Delete ${d.dep_name}`}
                                  onClick={() => handleDeleteDepartment(d)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Course Subjects */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 style={{ fontSize: '1.15rem' }}>Course Subjects</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Total: {subjects.length} subjects
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSubject(null);
                      setSubjectForm({ sub_name: '', dep_id: '' });
                      setShowSubjectModal(true);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <Plus size={15} />
                    <span>Add Subject</span>
                  </button>
                </div>
                <div
                  className={`table-responsive admin-lazy-table ${scrollingTable === 'subjects' ? 'is-table-scrolling' : ''}`}
                  onScroll={(event) => revealNextRows(event, 'subjects', subjects.length, setSubjectVisibleCount)}
                  style={{ maxHeight: '430px', overflowY: 'auto' }}
                >
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Sub ID</th>
                        <th>Subject Title</th>
                        <th style={{ width: '120px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            No subjects created yet.
                          </td>
                        </tr>
                      ) : (
                        subjects.slice(0, subjectVisibleCount).map((sub) => (
                          <tr key={sub.sub_id}>
                            <td>
                              <span className="badge badge-primary">#{sub.sub_id}</span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{sub.sub_name}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  title={`Edit ${sub.sub_name}`}
                                  aria-label={`Edit ${sub.sub_name}`}
                                  onClick={() => openSubjectEditor(sub)}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  title={`Delete ${sub.sub_name}`}
                                  aria-label={`Delete ${sub.sub_name}`}
                                  onClick={() => handleDeleteSubject(sub)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
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

          {/* =========================================================
              SECTION 5: PROFILE
             ========================================================= */}
          {activeSection === 'profile' && (
            <div>
              {/* Profile Hero Card */}
              <div className="admin-profile-hero">
                <div className="admin-profile-left">
                  <div className="admin-profile-avatar-large">
                    {adminInitial}
                  </div>
                  <div>
                    <div className="admin-profile-name">{adminName}</div>
                    <div className="admin-profile-email">
                      <Mail size={15} />
                      <span>{adminEmail}</span>
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
                  <div className="admin-meta-label">Admin Username</div>
                  <div className="admin-meta-value" style={{ fontFamily: 'monospace', color: '#2563eb' }}>
                    {user?.username || user?.user_id || 'admin'}
                  </div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Role & Authority</div>
                  <div className="admin-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={18} color="#10b981" />
                    <span>Institutional Administrator</span>
                  </div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Institutional Affiliation</div>
                  <div className="admin-meta-value">University College of Jaffna</div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Session Security</div>
                  <div className="admin-meta-value" style={{ color: '#059669', fontSize: '0.98rem' }}>
                    ● JWT Cookie Active (7 Days)
                  </div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Jurisdiction</div>
                  <div className="admin-meta-value" style={{ fontSize: '0.95rem' }}>
                    Central Management & Student Records
                  </div>
                </div>

                <div className="admin-meta-box">
                  <div className="admin-meta-label">Access Permissions</div>
                  <div className="admin-meta-value" style={{ fontSize: '0.95rem', color: '#ff5733' }}>
                    Super-Admin Full Control
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              SECTION 6: SETTINGS (PASSWORD RESET)
             ========================================================= */}
          {activeSection === 'settings' && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>System Settings & Security</h1>
                <p className="subtitle" style={{ marginBottom: 0 }}>
                  Manage institutional administrator credentials, two-factor password reset, and session tokens.
                </p>
              </div>

              {/* Password Reset Card */}
              <div className="admin-settings-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: 'rgba(37, 99, 235, 0.12)',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <KeyRound size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem', fontWeight: 700 }}>
                      Administrator Password Reset
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                      Change your administrator master password securely. The system checks your registered institutional email (
                      <strong>{adminEmail}</strong>) in the database and dispatches a verified 6-digit OTP code before setting your new password.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '1.1rem 1.25rem',
                    border: '1px solid #e2e8f0',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>1. Email Check:</span>
                    <span style={{ color: '#475569' }}>POST securely to verify administrator account exists</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>2. 6-Digit OTP:</span>
                    <span style={{ color: '#475569' }}>Entered via 6 auto-advancing verification boxes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>3. Password Match:</span>
                    <span style={{ color: '#475569' }}>Verify new password & re-enter new password before saving</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="btn btn-primary"
                  style={{ background: '#2563eb', borderColor: '#2563eb', padding: '0.75rem 1.5rem', fontSize: '0.92rem' }}
                >
                  <KeyRound size={17} />
                  <span>Reset Administrator Password</span>
                </button>
              </div>

              {/* Session Security Details Card */}
              <div className="admin-settings-card">
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <ShieldCheck size={20} color="#10b981" />
                  <span>Session & Token Security</span>
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1rem'
                  }}
                >
                  <div style={{ background: '#faf6ed', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Token Storage
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
                      JWT Cookie (<code>smartclass_jwt</code>)
                    </div>
                  </div>

                  <div style={{ background: '#faf6ed', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Cookie Lifespan
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
                      7 Days Persistent
                    </div>
                  </div>

                  <div style={{ background: '#faf6ed', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Route Access Guard
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
                      /staff/ad_dashboard (Strict Admin)
                    </div>
                  </div>

                  <div style={{ background: '#faf6ed', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Fallback Redirect
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
                      /staff/adlogin
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =========================================================
          MODAL: RESET PASSWORD (OTP FLOW)
         ========================================================= */}
      <AdminResetPasswordModal
        isOpen={showResetModal}
        role="admin"
        initialEmail={adminEmail}
        onClose={() => setShowResetModal(false)}
        onResetSuccess={() => {
          setShowResetModal(false);
          setMessage({
            type: 'success',
            text: 'Administrator password has been successfully reset! You can continue using your session.'
          });
        }}
      />

      {deleteConfirmation && (
        <div className="modal-backdrop">
          <div className="modal-content" role="alertdialog" aria-modal="true" aria-labelledby="delete-confirmation-title">
            <div className="modal-header">
              <h3 id="delete-confirmation-title">Confirm Delete</h3>
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="btn btn-secondary btn-sm"
                aria-label="Close delete confirmation"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <AlertCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>
                  {deleteConfirmation.type === 'department'
                    ? `Delete department "${deleteConfirmation.name}" and subjects linked only to it?`
                    : deleteConfirmation.type === 'teacher'
                    ? `Delete teacher "${deleteConfirmation.name}" (${deleteConfirmation.id})? This cannot be undone.`
                    : deleteConfirmation.type === 'student'
                    ? `Delete student "${deleteConfirmation.name}" (${deleteConfirmation.id})? This cannot be undone.`
                    : `Delete subject "${deleteConfirmation.name}"?`}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmation(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADD TEACHER
         ========================================================= */}
      {showTeacherModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <button
                type="button"
                onClick={() => { setShowTeacherModal(false); setEditingTeacher(null); }}
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTeacher}>
              <div className="modal-body">
                {!editingTeacher && (
                  <div className="form-group">
                    <label className="form-label">Staff ID</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. T002"
                      value={teacherForm.teach_id}
                      onChange={(e) => handleTeachIdChange(e.target.value)}
                      style={staffIdError ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                    />
                    {staffIdError && (
                      <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>{staffIdError}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Teacher Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Dr. John Doe"
                    value={teacherForm.teach_name}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, teach_name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Official Email</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. teacher@ucj.lk"
                    value={teacherForm.email}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, email: e.target.value })
                    }
                  />
                </div>
                {!editingTeacher && (
                  <div className="form-group">
                    <label className="form-label">Initial Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showTeacherPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        className="form-control"
                        placeholder="At least 6 characters"
                        value={teacherForm.password}
                        onChange={(e) =>
                          setTeacherForm({ ...teacherForm, password: e.target.value })
                        }
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 0
                        }}
                        title={showTeacherPassword ? 'Hide password' : 'Show password'}
                      >
                        {showTeacherPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Assign Subjects</label>
                  <div
                    style={{
                      maxHeight: '130px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem'
                    }}
                  >
                    {subjects.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        No subjects available. Please add subjects first.
                      </span>
                    ) : (
                      subjects.map((s) => (
                        <label
                          key={s.sub_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.3rem',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={teacherForm.subject_ids.includes(s.sub_id)}
                            onChange={(e) => {
                              const cur = teacherForm.subject_ids;
                              const updated = e.target.checked
                                ? [...cur, s.sub_id]
                                : cur.filter((id) => id !== s.sub_id);
                              setTeacherForm({ ...teacherForm, subject_ids: updated });
                            }}
                          />
                          <span>{s.sub_name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setShowTeacherModal(false); setEditingTeacher(null); }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!staffIdError}
                  className="btn btn-primary"
                  style={{
                    background: staffIdError ? '#94a3b8' : '#2563eb',
                    borderColor: staffIdError ? '#94a3b8' : '#2563eb',
                    cursor: staffIdError ? 'not-allowed' : 'pointer'
                  }}
                >
                  {editingTeacher ? 'Update Teacher' : 'Save Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADD STUDENT
         ========================================================= */}
      {showStudentModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingStudent ? 'Edit Student' : 'Register New Student'}</h3>
              <button
                type="button"
                onClick={() => { setShowStudentModal(false); setEditingStudent(null); }}
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateStudent} autoComplete="off">
              <div className="modal-body">
                {!editingStudent && (
                  <div className="form-group">
                    <label className="form-label">Student Index Number</label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      className="form-control"
                      placeholder="e.g. ST2026002"
                      value={studentForm.std_id}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, std_id: e.target.value })
                      }
                    />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Student Full Name</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    className="form-control"
                    placeholder="e.g. Johnathan Smith"
                    value={studentForm.std_name}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, std_name: e.target.value })
                    }
                  />
                </div>
                {!editingStudent && (
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      required
                      className="form-control"
                      value={studentForm.dep_id}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, dep_id: e.target.value })
                      }
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((d) => (
                        <option key={d.dep_id} value={d.dep_id}>
                          {d.dep_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Email Address (for notifications)</label>
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    className="form-control"
                    placeholder="e.g. student@ucj.ac.lk"
                    value={studentForm.email}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, email: e.target.value })
                    }
                  />
                </div>
                {!editingStudent && (
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="form-control"
                      placeholder="At least 6 characters"
                      value={studentForm.password}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, password: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setShowStudentModal(false); setEditingStudent(null); }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#2563eb', borderColor: '#2563eb' }}>
                  {editingStudent ? 'Update Student' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADD DEPARTMENT
         ========================================================= */}
      {showDeptModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingDepartment ? 'Edit Academic Department' : 'Add Academic Department'}</h3>
              <button
                type="button"
                onClick={() => {
                  setShowDeptModal(false);
                  setEditingDepartment(null);
                }}
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateDept}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Department Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Mechanical Engineering"
                    value={deptForm.dep_name}
                    onChange={(e) => setDeptForm({ ...deptForm, dep_name: e.target.value })}
                  />
                </div>
                {!editingDepartment && (
                  <div className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Subject Names</label>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setDeptForm({
                          ...deptForm,
                          subject_names: [...deptForm.subject_names, '']
                        })}
                      >
                        <Plus size={14} />
                        <span>Add Subject</span>
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.65rem' }}>
                      {deptForm.subject_names.map((subjectName, index) => (
                        <div key={`department-subject-${index}`} style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            required
                            className="form-control"
                            placeholder={`e.g. ${index === 0 ? 'Java Programming' : 'Subject name'}`}
                            value={subjectName}
                            onChange={(e) => {
                              const subjectNames = [...deptForm.subject_names];
                              subjectNames[index] = e.target.value;
                              setDeptForm({ ...deptForm, subject_names: subjectNames });
                            }}
                          />
                          {deptForm.subject_names.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              title="Remove subject field"
                              aria-label="Remove subject field"
                              onClick={() => setDeptForm({
                                ...deptForm,
                                subject_names: deptForm.subject_names.filter((_, itemIndex) => itemIndex !== index)
                              })}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeptModal(false);
                    setEditingDepartment(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#2563eb', borderColor: '#2563eb' }}>
                  {editingDepartment ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADD SUBJECT
         ========================================================= */}
      {showSubjectModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingSubject ? 'Edit Course Subject' : 'Add Course Subject'}</h3>
              <button
                type="button"
                onClick={() => {
                  setShowSubjectModal(false);
                  setEditingSubject(null);
                }}
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Subject Title</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Database Management Systems"
                    value={subjectForm.sub_name}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, sub_name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Link to Department (Optional)</label>
                  <select
                    className="form-control"
                    value={subjectForm.dep_id}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, dep_id: e.target.value })
                    }
                  >
                    <option value="">-- None / Cross-departmental --</option>
                    {departments.map((d) => (
                      <option key={d.dep_id} value={d.dep_id}>
                        {d.dep_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubjectModal(false);
                    setEditingSubject(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#2563eb', borderColor: '#2563eb' }}>
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Fixed Tooltip for Student Department Hover (Enrolled Subjects) */}
      {deptTooltip.visible && (
        <div
          style={{
            position: 'fixed',
            top: deptTooltip.y < 220 ? `${deptTooltip.bottom + 10}px` : `${deptTooltip.y - 10}px`,
            left: `${Math.max(160, Math.min(window.innerWidth - 160, deptTooltip.x))}px`,
            transform: deptTooltip.y < 220 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '0.85rem 1.1rem',
            boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.22), 0 10px 15px -5px rgba(0, 0, 0, 0.1)',
            zIndex: 999999,
            minWidth: '240px',
            maxWidth: '340px',
            pointerEvents: 'none',
            textAlign: 'left'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '0.55rem',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '0.4rem',
              letterSpacing: '0.02em'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={14} color="#2563eb" />
              <span>{deptTooltip.deptName} Department Subjects</span>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                background: '#eff6ff',
                color: '#2563eb',
                padding: '0.15rem 0.45rem',
                borderRadius: '9999px',
                fontWeight: 700
              }}
            >
              {deptTooltip.subjects ? deptTooltip.subjects.split(',').length : 0} Subjects
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {deptTooltip.subjects ? (
              deptTooltip.subjects.split(',').map((sub, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#f0fdf4',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    padding: '0.28rem 0.65rem',
                    borderRadius: '6px',
                    lineHeight: 1.3
                  }}
                >
                  <CheckCircle2 size={12} color="#16a34a" />
                  <span>{sub.trim()}</span>
                </span>
              ))
            ) : (
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>No subjects assigned to this department</span>
            )}
          </div>
          {/* Arrow pointing down or up directly at the badge */}
          <div
            style={{
              position: 'absolute',
              top: deptTooltip.y < 220 ? '-7px' : '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: deptTooltip.y < 220 ? 'none' : '7px solid #ffffff',
              borderBottom: deptTooltip.y < 220 ? '7px solid #ffffff' : 'none'
            }}
          />
        </div>
      )}
    </div>
  );
}
