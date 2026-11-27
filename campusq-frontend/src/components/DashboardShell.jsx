import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { campusqApi } from '../api/apiClient';

export default function DashboardShell({
  navItems,
  activeKey,
  onSelectNav,
  greeting,
  subtitle,
  roleLabel,
  extraHeaderSlot = null,
  children,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openNotifs, setOpenNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = async () => {
    if (!user) return;
    try {
      const res = await campusqApi.getUnreadNotificationCount();
      setUnreadCount(res?.unreadCount || 0);
    } catch {
      // Ignore polling failures
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
    if (next) loadNotifications();
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

  const initials = (user?.fullName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div>
          <div className="sidebar-brand">
            <div className="sidebar-logo">Q</div>
            <div>
              <div className="sidebar-brand-title">CampusQ</div>
              <div className="sidebar-brand-sub">Campus Services Platform</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sidebar-item ${activeKey === item.key ? 'active' : ''}`}
                onClick={() => {
                  onSelectNav(item.key);
                  setMobileOpen(false);
                }}
              >
                <span className="sidebar-item-left">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                  <span className="sidebar-badge">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          {user?.collegeCode && (
            <div className="sidebar-college-card">
              <div className="sidebar-college-code">🏫 {user.collegeCode}</div>
              <div className="sidebar-college-name">
                {user.collegeName || 'Campus Services'}
              </div>
            </div>
          )}
          <button type="button" className="sidebar-item" onClick={handleLogout}>
            <span className="sidebar-item-left">
              <span>🚪</span>
              <span>Log Out</span>
            </span>
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="top-header">
          <div className="row-gap">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <div className="top-greeting">
              <h1>{greeting}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>

          <div className="top-actions">
            {extraHeaderSlot}

            <span className="role-pill">
              {roleLabel || (user?.role === 'STAFF' ? '★ Staff Priority' : user?.role)}
            </span>

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

            <div className="avatar-pill">
              <span className="avatar-circle">{initials}</span>
              <span>{user?.fullName}</span>
            </div>
          </div>
        </header>

        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}
