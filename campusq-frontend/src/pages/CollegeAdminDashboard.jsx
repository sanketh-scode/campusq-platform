import React, { useEffect, useState } from 'react';
import DashboardShell from '../components/DashboardShell';
import StatusBadge from '../components/StatusBadge';
import { campusqApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

export default function CollegeAdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('PENDING');
  const [vendors, setVendors] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyForm, setReplyForm] = useState({ status: 'RESOLVED', adminReply: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async (activeTab = tab) => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'COMPLAINTS') {
        const compData = await campusqApi.getAdminComplaints();
        setComplaints(compData || []);
      } else {
        let data;
        if (activeTab === 'PENDING') {
          data = await campusqApi.getAdminPendingVendors();
        } else if (activeTab === 'APPROVED') {
          data = await campusqApi.getAdminApprovedVendors();
        } else {
          data = await campusqApi.getAdminAllVendors();
        }
        setVendors(data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(tab);
  }, [tab]);

  const handleVendorAction = async (vendorId, action, shopName) => {
    setError('');
    setSuccess('');
    try {
      if (action === 'delete') {
        if (!window.confirm(`Reject and deactivate "${shopName}"? Their login will be disabled.`)) {
          return;
        }
        await campusqApi.deactivateVendor(vendorId);
        setSuccess(`Vendor "${shopName}" has been rejected and deactivated.`);
      } else {
        const updated =
          action === 'approve'
            ? await campusqApi.approveVendor(vendorId)
            : await campusqApi.rejectVendor(vendorId);
        setSuccess(`Vendor "${updated.shopName}" marked as ${updated.approvalStatus}.`);
      }
      loadData(tab);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveComplaintReply = async (e) => {
    e.preventDefault();
    if (!replyTarget) return;
    setError('');
    setSuccess('');
    try {
      await campusqApi.updateComplaint(replyTarget.id, replyForm);
      setSuccess(`Complaint #${replyTarget.id} updated to ${replyForm.status}.`);
      setReplyTarget(null);
      loadData('COMPLAINTS');
    } catch (err) {
      setError(err.message);
    }
  };

  const navItems = [
    { key: 'PENDING', icon: '⏳', label: 'Pending Requests' },
    { key: 'APPROVED', icon: '✅', label: 'Approved Vendors' },
    { key: 'ALL', icon: '🏪', label: 'All Vendors' },
    { key: 'COMPLAINTS', icon: '📣', label: 'Student Complaints' },
  ];

  return (
    <DashboardShell
      navItems={navItems}
      activeKey={tab}
      onSelectNav={setTab}
      greeting="College Admin Portal"
      subtitle={`Manage vendors and student complaints for ${user?.collegeName || user?.collegeCode}.`}
      roleLabel="Role: College Admin"
      extraHeaderSlot={
        <button type="button" className="btn btn-outline btn-sm" onClick={() => loadData(tab)}>
          ↻ Refresh
        </button>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : tab === 'COMPLAINTS' ? (
        complaints.length === 0 ? (
          <div className="empty-state">No complaints submitted in your college yet.</div>
        ) : (
          <div className="grid-2">
            {complaints.map((c) => (
              <div key={c.id} className="card">
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <strong>{c.subject}</strong>
                  <StatusBadge status={c.status} />
                </div>
                <div className="muted" style={{ fontSize: '0.84rem', marginBottom: 6 }}>
                  From: <strong>{c.studentName}</strong> ({c.studentEmail}) • Against:{' '}
                  <strong>{c.vendorShopName}</strong>
                  {c.orderId ? ` • Order #${c.orderId}` : ''}
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.92rem' }}>{c.message}</p>
                {c.adminReply && (
                  <div className="alert alert-success" style={{ padding: '8px 12px', marginBottom: 10 }}>
                    <strong>Your Reply:</strong> {c.adminReply}
                  </div>
                )}
                <div className="row-gap">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setReplyTarget(c);
                      setReplyForm({ status: 'RESOLVED', adminReply: c.adminReply || '' });
                    }}
                  >
                    Reply / Update Status
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleVendorAction(c.vendorId, 'delete', c.vendorShopName)}
                  >
                    Reject &amp; Disable Vendor
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : vendors.length === 0 ? (
        <div className="empty-state">No vendors found in this tab.</div>
      ) : (
        <div className="grid-3">
          {vendors.map((v) => (
            <div key={v.vendorId} className="card">
              <div className="row-between" style={{ marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.06rem' }}>{v.shopName}</h3>
                <StatusBadge status={v.approvalStatus} />
              </div>
              <p className="muted" style={{ margin: '0 0 8px' }}>
                {v.description || 'No description provided'}
              </p>
              <div style={{ fontSize: '0.86rem', marginBottom: 10 }}>
                <div>
                  <strong>Owner:</strong> {v.ownerName} ({v.email})
                </div>
                <div>
                  <strong>Location:</strong> {v.location}
                </div>
                <div>
                  <strong>Account:</strong> {v.active ? 'Active' : 'Deactivated'}
                </div>
              </div>
              <div className="row-gap" style={{ marginBottom: 14 }}>
                {(v.categories || []).map((cat) => (
                  <span key={cat} className="badge badge-primary">
                    {cat === 'OTHER' && v.customCategory ? v.customCategory : cat}
                  </span>
                ))}
              </div>

              <div className="row-gap">
                {v.approvalStatus === 'PENDING' && (
                  <>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleVendorAction(v.vendorId, 'approve', v.shopName)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleVendorAction(v.vendorId, 'reject', v.shopName)}
                    >
                      Reject
                    </button>
                  </>
                )}
                {v.active && (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ color: 'var(--danger)', borderColor: '#fecaca' }}
                    onClick={() => handleVendorAction(v.vendorId, 'delete', v.shopName)}
                  >
                    Remove / Disable
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {replyTarget && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 style={{ marginTop: 0 }}>Resolve Complaint #{replyTarget.id}</h2>
            <p className="muted">
              Against <strong>{replyTarget.vendorShopName}</strong>
            </p>
            <form onSubmit={handleSaveComplaintReply}>
              <div className="form-group">
                <label>Status</label>
                <select
                  className="select"
                  value={replyForm.status}
                  onChange={(e) => setReplyForm({ ...replyForm, status: e.target.value })}
                >
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="DISMISSED">DISMISSED</option>
                  <option value="OPEN">OPEN</option>
                </select>
              </div>
              <div className="form-group">
                <label>Resolution Message to Student</label>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="Describe the action taken..."
                  value={replyForm.adminReply}
                  onChange={(e) => setReplyForm({ ...replyForm, adminReply: e.target.value })}
                  required
                />
              </div>
              <div className="row-gap">
                <button type="submit" className="btn btn-primary">
                  Save &amp; Notify Student
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setReplyTarget(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
