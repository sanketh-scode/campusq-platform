import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { campusqApi } from '../api/apiClient';

export default function SuperAdminDashboard() {
  const [colleges, setColleges] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const [collegeForm, setCollegeForm] = useState({
    collegeName: '',
    collegeCode: '',
    address: '',
    active: true,
  });

  const [adminForm, setAdminForm] = useState({
    fullName: '',
    email: '',
    password: '',
    collegeCode: '',
  });

  const loadColleges = async () => {
    setLoading(true);
    try {
      const data = await campusqApi.getAllColleges();
      setColleges(data || []);
      if (data?.length > 0 && !adminForm.collegeCode) {
        const firstActive = data.find((c) => c.active) || data[0];
        setAdminForm((prev) => ({ ...prev, collegeCode: firstActive.collegeCode }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColleges();
  }, []);

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const created = await campusqApi.createCollege(collegeForm);
      setSuccess(`College "${created.collegeName}" (${created.collegeCode}) created successfully.`);
      setCollegeForm({ collegeName: '', collegeCode: '', address: '', active: true });
      loadColleges();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const created = await campusqApi.createCollegeAdmin(adminForm);
      setSuccess(
        `College Admin ${created.email} assigned to ${created.collegeName} (${created.collegeCode}).`
      );
      setAdminForm((prev) => ({ ...prev, fullName: '', email: '', password: '' }));
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
            <h1>Super Admin Console</h1>
            <p className="page-subtitle">Manage registered colleges and provision College Admin accounts</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadColleges}>
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="grid-2" style={{ marginBottom: 24 }}>
          <section className="card">
            <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>Register New College</h2>
            <form onSubmit={handleCreateCollege}>
              <div className="form-group">
                <label>College Name</label>
                <input
                  className="input"
                  placeholder="BMS Institute of Technology"
                  value={collegeForm.collegeName}
                  onChange={(e) => setCollegeForm({ ...collegeForm, collegeName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Unique College Code</label>
                <input
                  className="input"
                  placeholder="BMSIT"
                  value={collegeForm.collegeCode}
                  onChange={(e) =>
                    setCollegeForm({ ...collegeForm, collegeCode: e.target.value.toUpperCase() })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Address / Location</label>
                <input
                  className="input"
                  placeholder="Yelahanka, Bengaluru, Karnataka"
                  value={collegeForm.address}
                  onChange={(e) => setCollegeForm({ ...collegeForm, address: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Create College
              </button>
            </form>
          </section>

          <section className="card">
            <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>Create College Admin</h2>
            <form onSubmit={handleCreateAdmin}>
              <div className="form-group">
                <label>Admin Full Name</label>
                <input
                  className="input"
                  placeholder="Dr. Rajesh Verma"
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Admin Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="admin@mvit.edu"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Temporary Password (min 8 chars)</label>
                <input
                  type="password"
                  className="input"
                  minLength={8}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Assign to College</label>
                <select
                  className="select"
                  value={adminForm.collegeCode}
                  onChange={(e) => setAdminForm({ ...adminForm, collegeCode: e.target.value })}
                  required
                >
                  {colleges
                    .filter((c) => c.active)
                    .map((c) => (
                      <option key={c.id} value={c.collegeCode}>
                        {c.collegeName} ({c.collegeCode})
                      </option>
                    ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                Create College Admin
              </button>
            </form>
          </section>
        </div>

        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>
            Registered Colleges ({colleges.length})
          </h2>
          {loading ? (
            <p className="muted">Loading colleges...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>College Name</th>
                    <th>Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {colleges.map((college) => (
                    <tr key={college.id}>
                      <td>
                        <span className="badge badge-primary">{college.collegeCode}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{college.collegeName}</td>
                      <td>{college.address}</td>
                      <td>
                        <span className={`badge ${college.active ? 'badge-success' : 'badge-muted'}`}>
                          {college.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
