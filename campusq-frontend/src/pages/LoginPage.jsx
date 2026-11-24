import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getHomePathForRole } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div className="brand-badge" style={{ margin: '0 auto 10px', width: 44, height: 44, fontSize: '1.25rem' }}>
            Q
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Sign in to CampusQ</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Skip the queue at your campus canteen, Xerox, and stationery shops
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@college.edu"
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
            style={{ width: '100%', marginTop: 6 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.9rem' }}>
          <p className="muted" style={{ margin: '6px 0' }}>
            New student? <Link to="/register/student">Create Student Account</Link>
          </p>
          <p className="muted" style={{ margin: '6px 0' }}>
            Campus shop owner? <Link to="/register/vendor">Register as Vendor</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
