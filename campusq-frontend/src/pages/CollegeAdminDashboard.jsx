import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { campusqApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

export default function CollegeAdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('PENDING');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadVendors = async (activeTab = tab) => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (activeTab === 'PENDING') {
        data = await campusqApi.getAdminPendingVendors();
      } else if (activeTab === 'APPROVED') {
        data = await campusqApi.getAdminApprovedVendors();
      } else {
        data = await campusqApi.getAdminAllVendors();
      }
      setVendors(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors(tab);
  }, [tab]);

  const handleAction = async (vendorId, action) => {
    setError('');
    setSuccess('');
    try {
      const updated =
        action === 'approve'
          ? await campusqApi.approveVendor(vendorId)
          : await campusqApi.rejectVendor(vendorId);
      setSuccess(`Vendor "${updated.shopName}" marked as ${updated.approvalStatus}.`);
      loadVendors(tab);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <main className="page-container">
        <div className="page-header">
          <div>
            <h1>College Admin Portal</h1>
            <p className="page-subtitle">
              Manage vendor approvals for <strong>{user?.collegeCode}</strong>
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => loadVendors(tab)}>
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setTab('PENDING')}
          >
            Pending Requests
          </button>
          <button
            className={`tab-btn ${tab === 'APPROVED' ? 'active' : ''}`}
            onClick={() => setTab('APPROVED')}
          >
            Approved Vendors
          </button>
          <button
            className={`tab-btn ${tab === 'ALL' ? 'active' : ''}`}
            onClick={() => setTab('ALL')}
          >
            All College Vendors
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading vendors...</p>
        ) : vendors.length === 0 ? (
          <div className="empty-state">No vendors found in this category.</div>
        ) : (
          <div className="grid-3">
            {vendors.map((v) => (
              <div key={v.vendorId} className="card">
                <div className="row-between" style={{ marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: '1.08rem' }}>{v.shopName}</h3>
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
                    <strong>Shop Open:</strong> {v.available ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="row-gap" style={{ marginBottom: 14 }}>
                  {(v.categories || []).map((cat) => (
                    <span key={cat} className="badge badge-primary">
                      {cat}
                    </span>
                  ))}
                </div>

                {v.approvalStatus === 'PENDING' && (
                  <div className="row-gap">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleAction(v.vendorId, 'approve')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleAction(v.vendorId, 'reject')}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
