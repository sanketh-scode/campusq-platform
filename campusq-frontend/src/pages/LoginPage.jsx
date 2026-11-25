import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getHomePathForRole } from '../context/AuthContext';
import { campusqApi } from '../api/apiClient';

const ROLE_META = {
  STUDENT_STAFF: {
    heading: 'Login as Student / Staff',
    subtitle: 'Pre-order from campus shops & track your live token',
    placeholder: 'student@college.edu',
  },
  VENDOR: {
    heading: 'Login as Vendor',
    subtitle: 'Manage incoming orders, QR payments & daily catalog',
    placeholder: 'vendor@college.edu',
  },
  ADMIN: {
    heading: 'Login as College Admin',
    subtitle: 'Approve campus vendors & resolve student complaints',
    placeholder: 'admin@college.edu',
  },
};

const ALL_CATEGORIES = ['CANTEEN', 'XEROX', 'STATIONERY', 'OTHER'];

export default function LoginPage() {
  const { login, loginWithGoogle, completeGoogleRegistration } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  const [selectedPortal, setSelectedPortal] = useState('STUDENT_STAFF');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Sign-In completion modal for new Google users
  const [googlePending, setGooglePending] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [googleForm, setGoogleForm] = useState({
    role: 'STUDENT',
    collegeCode: '',
    shopName: '',
    location: '',
    description: '',
    categories: ['CANTEEN'],
    customCategory: '',
  });

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const meta = ROLE_META[selectedPortal];

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          setError('');
          setLoading(true);
          try {
            const res = await loginWithGoogle(response.credential);
            if (res.needsRegistration) {
              const colList = await campusqApi.getPublicColleges().catch(() => []);
              setColleges(colList || []);
              setGoogleForm((prev) => ({
                ...prev,
                collegeCode: colList?.[0]?.collegeCode || '',
              }));
              setGooglePending({
                idToken: response.credential,
                email: res.email,
                fullName: res.fullName,
              });
            } else {
              navigate(getHomePathForRole(res.role), { replace: true });
            }
          } catch (err) {
            setError(err.message || 'Google Sign-In failed');
          } finally {
            setLoading(false);
          }
        },
      });
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
      });
    };

    const timer = setTimeout(initGoogle, 250);
    return () => clearTimeout(timer);
  }, [googleClientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const sessionUser = await login(email, password);
      navigate(getHomePathForRole(sessionUser.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleComplete = async (e) => {
    e.preventDefault();
    if (!googlePending) return;
    setError('');
    setLoading(true);
    try {
      const sessionUser = await completeGoogleRegistration({
        idToken: googlePending.idToken,
        collegeCode: googleForm.collegeCode,
        role: googleForm.role,
        shopName: googleForm.shopName,
        location: googleForm.location,
        description: googleForm.description,
        categories: googleForm.categories,
        customCategory: googleForm.customCategory,
      });
      setGooglePending(null);
      navigate(getHomePathForRole(sessionUser.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to complete Google registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-split">
        <div className="auth-hero">
          <div className="auth-hero-pill">
            <span className="brand-badge" style={{ width: 22, height: 22, fontSize: '0.75rem', borderRadius: 6 }}>
              Q
            </span>
            CampusQ Platform
          </div>
          <h1>Skip Campus Queues. Pick Up on Your Turn.</h1>
          <p>
            Pre-order from your college canteen, Xerox center, and stationery shops, pay via shop
            QR after confirmation, and track live tokens.
          </p>
          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span>🍽️</span>
              <span>Canteen, Xerox PDF printing, Stationery &amp; more</span>
            </div>
            <div className="auth-feature-item">
              <span>🎫</span>
              <span>Live token updates + Staff priority queue</span>
            </div>
            <div className="auth-feature-item">
              <span>🔒</span>
              <span>College-isolated accounts &amp; verified shop payments</span>
            </div>
          </div>
        </div>

        <div className="auth-card-glass">
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: '1.38rem' }}>{meta.heading}</h2>
            <p className="muted" style={{ margin: '3px 0 0', fontSize: '0.86rem' }}>
              {meta.subtitle}
            </p>
          </div>

          <div className="role-selector" role="tablist" aria-label="Choose login portal">
            <button
              type="button"
              className={`role-option ${selectedPortal === 'STUDENT_STAFF' ? 'active' : ''}`}
              onClick={() => setSelectedPortal('STUDENT_STAFF')}
            >
              <span className="role-option-title">🎓 Student / Staff</span>
              <span className="role-option-sub">Order &amp; track tokens</span>
            </button>

            <button
              type="button"
              className={`role-option ${selectedPortal === 'VENDOR' ? 'active' : ''}`}
              onClick={() => setSelectedPortal('VENDOR')}
            >
              <span className="role-option-title">🏪 Vendor</span>
              <span className="role-option-sub">Manage shop &amp; queue</span>
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder={meta.placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 4, padding: '11px 16px' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {googleClientId && selectedPortal !== 'ADMIN' && (
            <div style={{ marginTop: 14 }}>
              <div className="muted" style={{ textAlign: 'center', fontSize: '0.8rem', marginBottom: 8 }}>
                or continue with Google
              </div>
              <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center' }} />
            </div>
          )}

          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
              fontSize: '0.88rem',
            }}
          >
            {selectedPortal === 'VENDOR' ? (
              <p className="muted" style={{ margin: '0 0 10px' }}>
                New campus shop? <Link to="/register/vendor">Register as Vendor</Link>
              </p>
            ) : (
              <p className="muted" style={{ margin: '0 0 10px' }}>
                New Student or Staff? <Link to="/register/student">Create Account</Link>
              </p>
            )}

            <div>
              {selectedPortal === 'ADMIN' ? (
                <button
                  type="button"
                  className="admin-subtle-link"
                  onClick={() => setSelectedPortal('STUDENT_STAFF')}
                >
                  Back to Student / Staff / Vendor login
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-subtle-link"
                  onClick={() => setSelectedPortal('ADMIN')}
                >
                  College Admin? Sign in here
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {googlePending && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 style={{ marginTop: 0 }}>Complete Your CampusQ Account</h2>
            <p className="muted">
              Signed in as <strong>{googlePending.fullName}</strong> ({googlePending.email}). Select
              your college and role to finish:
            </p>
            <form onSubmit={handleGoogleComplete}>
              <div className="form-group">
                <label>College</label>
                <select
                  className="select"
                  value={googleForm.collegeCode}
                  onChange={(e) => setGoogleForm({ ...googleForm, collegeCode: e.target.value })}
                  required
                >
                  {colleges.map((c) => (
                    <option key={c.id} value={c.collegeCode}>
                      {c.collegeName} ({c.collegeCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  className="select"
                  value={googleForm.role}
                  onChange={(e) => setGoogleForm({ ...googleForm, role: e.target.value })}
                >
                  <option value="STUDENT">Student</option>
                  <option value="STAFF">Staff Member</option>
                  <option value="VENDOR">Campus Vendor</option>
                </select>
              </div>

              {googleForm.role === 'VENDOR' && (
                <>
                  <div className="form-group">
                    <label>Shop Name</label>
                    <input
                      className="input"
                      value={googleForm.shopName}
                      onChange={(e) => setGoogleForm({ ...googleForm, shopName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Campus Location</label>
                    <input
                      className="input"
                      value={googleForm.location}
                      onChange={(e) => setGoogleForm({ ...googleForm, location: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Categories</label>
                    <div className="checkbox-row">
                      {ALL_CATEGORIES.map((cat) => {
                        const checked = googleForm.categories.includes(cat);
                        return (
                          <label key={cat} className={`checkbox-chip ${checked ? 'checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setGoogleForm((prev) => ({
                                  ...prev,
                                  categories: checked
                                    ? prev.categories.filter((x) => x !== cat)
                                    : [...prev.categories, cat],
                                }))
                              }
                            />
                            {cat}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="row-gap" style={{ marginTop: 14 }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Finish Setup'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setGooglePending(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
