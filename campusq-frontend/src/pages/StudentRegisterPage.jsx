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
      await campusqApi.registerStudent(form);
      setSuccess('Student account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 style={{ margin: '0 0 4px', fontSize: '1.45rem' }}>Student Registration</h1>
        <p className="muted" style={{ margin: '0 0 20px' }}>
          Select your college to start pre-ordering from campus shops
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
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
            {loading ? 'Creating Account...' : 'Register as Student'}
          </button>
        </form>

        <p className="muted" style={{ textAlign: 'center', marginTop: 18 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
