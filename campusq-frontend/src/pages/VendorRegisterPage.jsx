import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campusqApi } from '../api/apiClient';

const ALL_CATEGORIES = ['CANTEEN', 'XEROX', 'STATIONERY'];

export default function VendorRegisterPage() {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    shopName: '',
    description: '',
    location: '',
    collegeCode: '',
    categories: ['CANTEEN'],
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

  const toggleCategory = (cat) => {
    setForm((prev) => {
      const exists = prev.categories.includes(cat);
      const next = exists
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.categories.length === 0) {
      setError('Select at least one shop category.');
      return;
    }
    setLoading(true);
    try {
      await campusqApi.registerVendor(form);
      setSuccess(
        'Vendor registered! Your shop is PENDING approval by your College Admin. Redirecting to login...'
      );
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message || 'Vendor registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.45rem' }}>Vendor Registration</h1>
        <p className="muted" style={{ margin: '0 0 20px' }}>
          Register your campus shop. Your College Admin will review and approve your request.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Owner Full Name</label>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Password (min 8 chars)</label>
              <input
                type="password"
                className="input"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
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

          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label>Shop Name</label>
              <input
                className="input"
                placeholder="MVIT Central Canteen"
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Campus Location</label>
              <input
                className="input"
                placeholder="Block A Ground Floor"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="Snacks, meals, printing, or stationery details..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Shop Categories</label>
            <div className="checkbox-row">
              {ALL_CATEGORIES.map((cat) => {
                const checked = form.categories.includes(cat);
                return (
                  <label key={cat} className={`checkbox-chip ${checked ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(cat)}
                    />
                    {cat}
                  </label>
                );
              })}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Vendor Registration'}
          </button>
        </form>

        <p className="muted" style={{ textAlign: 'center', marginTop: 18 }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
