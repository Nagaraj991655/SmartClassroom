import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  BookOpen, Plus, FileText, Download, CheckCircle, 
  Clock, AlertCircle, Award, Eye, UserCheck, UserX, RefreshCw 
} from 'lucide-react';

export default function TeacherDashboard({ user }) {
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

  useEffect(() => {
    loadData();
    // Default dates for create form: start now, end 7 days later
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setCreateForm(prev => ({
      ...prev,
      start_at: now.toISOString().slice(0, 16),
      end_at: nextWeek.toISOString().slice(0, 16)
    }));
  }, []);

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

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Teacher Portal</h1>
          <p className="subtitle">Create course assignments, monitor student submissions, and assign evaluation grades.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Assignment</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert-banner ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Assignments List */}
      <div className="card">
        <div className="card-header">
          <h3>Your Created Assignments ({assignments.length})</h3>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Assignment Title</th>
                <th>Question Doc</th>
                <th>Timeline</th>
                <th>Submissions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No assignments created yet. Click "Create Assignment" to post your first assignment!
                  </td>
                </tr>
              ) : (
                assignments.map((ass) => (
                  <tr key={ass.assignment_id}>
                    <td><span className="badge badge-primary">{ass.sub_name}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ass.ass_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {ass.description ? ass.description.slice(0, 60) + '...' : 'No description'}
                      </div>
                    </td>
                    <td>
                      {ass.doc_url ? (
                        <a
                          href={api.fileUrl(ass.doc_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          <Download size={13} />
                          <span>Question File</span>
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No File</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      <div><strong>Due:</strong> {new Date(ass.end_at).toLocaleString()}</div>
                      <div style={{ color: 'var(--text-muted)' }}>Opened: {new Date(ass.start_at).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <span className="badge badge-success">
                        {ass.total_submissions} / {ass.total_enrolled_students} Submitted
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenSubmissions(ass)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={14} />
                        <span>Track & Grade</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE ASSIGNMENT */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>Create New Assignment</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>
            <form onSubmit={handleCreateAssignment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Subject</label>
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

                <div className="form-group">
                  <label className="form-label">Assignment Title</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Lab Assignment 02 - Recursion & Trees"
                    value={createForm.ass_name}
                    onChange={(e) => setCreateForm({ ...createForm, ass_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description & Instructions</label>
                  <textarea
                    className="form-control"
                    placeholder="Provide assignment guidelines, criteria, and requirements..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Opening Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-control"
                      value={createForm.start_at}
                      onChange={(e) => setCreateForm({ ...createForm, start_at: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Submission Deadline</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-control"
                      value={createForm.end_at}
                      onChange={(e) => setCreateForm({ ...createForm, end_at: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Deadline Reminder Beforehand (Hours: 1 - 8)</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    required
                    className="form-control"
                    value={createForm.deadline_reminder_hr}
                    onChange={(e) => setCreateForm({ ...createForm, deadline_reminder_hr: parseInt(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Upload Question Document (PDF / DOC / DOCX / ZIP)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.doc,.docx,.zip,.rar,.txt"
                    onChange={(e) => setQuestionFile(e.target.files[0])}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    File will be securely saved into the assignment question documents repository.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMISSION TRACKER & GRADING */}
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

      {/* MODAL: GRADE SUBMISSION */}
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
    </div>
  );
}
