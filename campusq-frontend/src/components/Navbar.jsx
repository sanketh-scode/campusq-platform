import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getHomePathForRole } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link className="brand" to={user ? getHomePathForRole(user.role) : '/login'}>
          <span className="brand-badge">Q</span>
          <span>CampusQ</span>
        </Link>

        {user ? (
          <div className="nav-user">
            {user.collegeCode && <span className="badge badge-primary">{user.collegeCode}</span>}
            <span className="badge badge-muted">{user.role.replace('_', ' ')}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.fullName}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        ) : (
          <div className="row-gap">
            <Link className="btn btn-outline btn-sm" to="/login">
              Login
            </Link>
            <Link className="btn btn-primary btn-sm" to="/register/student">
              Student Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
