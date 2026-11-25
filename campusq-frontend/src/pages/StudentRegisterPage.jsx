import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campusqApi } from '../api/apiClient';

export default function StudentRegisterPage() {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    collegeCode: '',
    role: 'STUDENT',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    campusqApi
      .getPublicColleges()
      .then((list) => {
        setColleges(list || []);
        if (list?.length > 0) {
          setForm((prev) => ({ ...prev, collegeCode: list[0].collegeCode }));
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await campusqApi.registerStudentOrStaff(form);
      setSuccess(`${form.role === 'STAFF' ? 'Staff' : 'Student'} account created! Redirecting to login...`);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card-glass" style={{ maxWidth: 470 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.45rem' }}>Student / Staff Registration</h1>
        <p className="muted" style={{ margin: '0 0 18px' }}>
          Select your role and college to start pre-ordering across campus
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="role-selector">
            <button
              type="button"
              className={`role-option ${form.role === 'STUDENT' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, role: 'STUDENT' })}
            >
              <span className="role-option-title">🎓 Student</span>
              <span className="role-option-sub">Standard campus account</span>
            </button>
            <button
              type="button"
              className={`role-option ${form.role === 'STAFF' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, role: 'STAFF' })}
            >
              <span className="role-option-title">🪪 Staff Member</span>
              <span className="role-option-sub">Verified by vendor on 1st order</span>
            </button>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Aarav Sharma"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="aarav@mvit.edu"
              required
            />
          </div>

          <div className="form-group">
            <label>Password (min 8 characters)</label>
            <input
              type="password"
              className="input"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>College</label>
            <select
              className="select"
              value={form.collegeCode}
              onChange={(e) => setForm({ ...form, collegeCode: e.target.value })}
              required
            >
              {colleges.length === 0 && <option value="">Loading colleges...</option>}
              {colleges.map((c) => (
                <option key={c.id} value={c.collegeCode}>
                  {c.collegeName} ({c.collegeCode})
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating Account...' : `Register as ${form.role === 'STAFF' ? 'Staff' : 'Student'}`}
          </button>
        </form>

        <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
