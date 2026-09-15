import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  GraduationCap, BookOpen, Clock, Download, UploadCloud, 
  CheckCircle, AlertCircle, Award, FileCheck, RefreshCw 
} from 'lucide-react';

export default function StudentDashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('assignments');

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profData, assData, resData] = await Promise.all([
        api.studentGetProfile(),
        api.studentGetAssignments(),
        api.studentGetGrades()
      ]);
      setProfile(profData);
      setAssignments(assData);
      setResults(resData);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenSubmit = (assignment) => {
    setSubmittingAssignment(assignment);
    setSubmissionFile(null);
    setShowSubmitModal(true);
  };

  const handleUploadSubmission = async (e) => {
    e.preventDefault();
    if (!submissionFile) {
      setMessage({ type: 'error', text: 'Please select a file to submit.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.studentSubmitAssignment(
        submittingAssignment.assignment_id,
        submissionFile
      );
      setMessage({ type: 'success', text: res.message });
      setShowSubmitModal(false);
      setSubmissionFile(null);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const isPastDeadline = (endAt) => {
    return new Date() > new Date(endAt);
  };

  return (
    <div className="main-content">
      {/* Student Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Student Dashboard</h1>
          <p className="subtitle">
            Welcome, <strong>{profile ? profile.std_name : user.name}</strong> ({profile ? profile.std_id : user.user_id}) &bull;{' '}
            Department of {profile ? profile.dep_name : 'Computing'}
          </p>
        </div>
        <button onClick={loadData} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className={`alert-banner ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          My Assignments ({assignments.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'grades' ? 'active' : ''}`}
          onClick={() => setActiveTab('grades')}
        >
          Graded Results ({results.length})
        </button>
      </div>

      {/* TAB 1: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="card">
          <div className="card-header">
            <h3>Course Assignments & Submissions</h3>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Assignment Details</th>
                  <th>Question Doc</th>
                  <th>Deadline</th>
                  <th>Submission Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No active assignments found for your enrolled subjects.
                    </td>
                  </tr>
                ) : (
                  assignments.map((ass) => {
                    const past = isPastDeadline(ass.end_at);
                    const isSubmitted = !!ass.submission_id;
                    const isGraded = ass.marks !== null && ass.marks !== undefined;

                    return (
                      <tr key={ass.assignment_id}>
                        <td>
                          <span className="badge badge-primary">{ass.sub_name}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {ass.teach_name}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600 }}>{ass.ass_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {ass.description ? ass.description.slice(0, 60) + '...' : 'No description'}
                          </div>
                        </td>

                        <td>
                          {ass.question_doc_url ? (
                            <a
                              href={api.fileUrl(ass.question_doc_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                            >
                              <Download size={13} />
                              <span>Question</span>
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>

                        <td style={{ fontSize: '0.8rem' }}>
                          <div style={{ color: past ? 'var(--danger)' : 'inherit', fontWeight: past ? 600 : 400 }}>
                            {new Date(ass.end_at).toLocaleString()}
                          </div>
                          {past && !isSubmitted && (
                            <span className="badge badge-danger" style={{ marginTop: '2px' }}>Closed</span>
                          )}
                        </td>

                        <td>
                          {isGraded ? (
                            <div>
                              <span className="badge badge-success">Graded: {ass.marks}/100</span>
                              {ass.feedback && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  "{ass.feedback}"
                                </div>
                              )}
                            </div>
                          ) : isSubmitted ? (
                            <div>
                              <span className="badge badge-primary">Submitted</span>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {new Date(ass.submitted_at).toLocaleDateString()}
                              </div>
                            </div>
                          ) : past ? (
                            <span className="badge badge-danger">Missed</span>
                          ) : (
                            <span className="badge badge-warning">Pending Submission</span>
                          )}
                        </td>

                        <td>
                          {!past ? (
                            <button
                              onClick={() => handleOpenSubmit(ass)}
                              className="btn btn-primary btn-sm"
                            >
                              <UploadCloud size={14} />
                              <span>{isSubmitted ? 'Resubmit' : 'Submit'}</span>
                            </button>
                          ) : isSubmitted ? (
                            <a
                              href={api.fileUrl(ass.submission_doc_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                            >
                              <Download size={13} />
                              <span>My File</span>
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Deadline Passed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GRADES */}
      {activeTab === 'grades' && (
        <div className="card">
          <div className="card-header">
            <h3>Academic Marks & Evaluator Feedback</h3>
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
                  <th>Submitted Doc</th>
                  <th>Graded On</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No evaluation results available yet.
                    </td>
                  </tr>
                ) : (
                  results.map((res) => (
                    <tr key={res.grade_id}>
                      <td><span className="badge badge-primary">{res.sub_name}</span></td>
                      <td style={{ fontWeight: 600 }}>{res.ass_name}</td>
                      <td>{res.teach_name}</td>
                      <td>
                        <span className="badge badge-success" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                          {res.marks} / 100
                        </span>
                      </td>
                      <td style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                        {res.feedback || 'No remarks provided.'}
                      </td>
                      <td>
                        <a
                          href={api.fileUrl(res.submission_doc_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <Download size={13} />
                          <span>View Doc</span>
                        </a>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(res.graded_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT ASSIGNMENT */}
      {showSubmitModal && submittingAssignment && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3>Submit Assignment Work</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {submittingAssignment.ass_name} ({submittingAssignment.sub_name})
                </span>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>
            <form onSubmit={handleUploadSubmission}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#eff6ff', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-border)' }}>
                  <p style={{ fontSize: '0.85rem' }}>
                    <strong>Final Deadline:</strong> {new Date(submittingAssignment.end_at).toLocaleString()}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Upload Answer / Report Document</label>
                  <input
                    type="file"
                    required
                    className="form-control"
                    accept=".pdf,.doc,.docx,.zip,.rar,.txt"
                    onChange={(e) => setSubmissionFile(e.target.files[0])}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Accepted formats: PDF, Word, ZIP, RAR, TXT. File is securely stored in student submissions repository.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="btn btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Uploading...' : 'Submit Assignment File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
