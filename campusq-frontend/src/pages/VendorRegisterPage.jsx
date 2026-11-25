import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campusqApi } from '../api/apiClient';
import { fileToBase64DataUrl } from '../data/sampleCatalog';

const ALL_CATEGORIES = ['CANTEEN', 'XEROX', 'STATIONERY', 'OTHER'];

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
    customCategory: '',
    qrCodeImage: '',
    shopImage: '',
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

  const handleShopImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const dataUrl = await fileToBase64DataUrl(file);
      setForm((prev) => ({ ...prev, shopImage: dataUrl }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const dataUrl = await fileToBase64DataUrl(file);
      setForm((prev) => ({ ...prev, qrCodeImage: dataUrl }));
    } catch (err) {
      setError(err.message);
    }
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
    <div className="auth-bg">
      <div className="auth-card-glass" style={{ maxWidth: 560 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.45rem' }}>Vendor Registration</h1>
        <p className="muted" style={{ margin: '0 0 18px' }}>
          Register your campus shop &amp; upload your UPI QR scanner so students can pay online.
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

          {form.categories.includes('OTHER') && (
            <div className="form-group">
              <label>Specify Other Shop Type (e.g. Coffee Shop, Juice Bar, Book Store)</label>
              <input
                className="input"
                placeholder="Coffee Shop"
                value={form.customCategory}
                onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label>
              Shop Cover Image {form.categories.includes('OTHER') ? '(Recommended for Other Category, max 2 MB)' : '(Optional — defaults to category photo, max 2 MB)'}
            </label>
            <input type="file" accept="image/*" className="input" onChange={handleShopImageUpload} />
            {form.shopImage && (
              <img
                src={form.shopImage}
                alt="Shop Cover Preview"
                style={{ width: '100%', maxHeight: 130, objectFit: 'cover', borderRadius: 10, marginTop: 8 }}
              />
            )}
          </div>

          <div className="form-group">
            <label>UPI Payment QR Scanner Image (Optional, max 2 MB)</label>
            <input type="file" accept="image/*" className="input" onChange={handleQrUpload} />
            {form.qrCodeImage && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={form.qrCodeImage}
                  alt="UPI QR Preview"
                  style={{ width: 110, height: 110, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8 }}
                />
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Vendor Registration'}
          </button>
        </form>

        <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
