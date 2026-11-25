import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getHomePathForRole } from '../context/AuthContext';
import { campusqApi } from '../api/apiClient';

export default function Navbar({ rightSlot = null }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [openNotifs, setOpenNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = async () => {
    if (!user) return;
    try {
      const res = await campusqApi.getUnreadNotificationCount();
      setUnreadCount(res?.unreadCount || 0);
    } catch {
      // Ignore background poll failures
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const list = await campusqApi.getNotifications();
      setNotifications(list || []);
      setUnreadCount((list || []).filter((n) => !n.read).length);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (!user) return;
    loadUnread();
    const timer = setInterval(loadUnread, 20000);
    return () => clearInterval(timer);
  }, [user]);

  const handleToggleNotifs = () => {
    const next = !openNotifs;
    setOpenNotifs(next);
    if (next) {
      loadNotifications();
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await campusqApi.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await campusqApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

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
            {rightSlot}

            <div className="notif-wrap">
              <button
                type="button"
                className="notif-btn"
                onClick={handleToggleNotifs}
                aria-label="Notifications"
              >
                <span>🔔</span>
                {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
              </button>

              {openNotifs && (
                <div className="notif-dropdown">
                  <div className="row-between" style={{ marginBottom: 10 }}>
                    <strong>Notifications</strong>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="admin-subtle-link"
                        onClick={handleMarkAllRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="muted" style={{ margin: '10px 0' }}>
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item ${!n.read ? 'unread' : ''}`}
                        onClick={() => !n.read && handleMarkRead(n.id)}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{n.title}</div>
                        <div className="muted" style={{ fontSize: '0.82rem', marginTop: 2 }}>
                          {n.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {user.collegeCode && <span className="badge badge-primary">{user.collegeCode}</span>}
            <span className={`badge ${user.role === 'STAFF' ? 'badge-staff' : 'badge-muted'}`}>
              {user.role === 'STAFF' ? '★ STAFF' : user.role.replace('_', ' ')}
            </span>
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
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
