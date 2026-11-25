import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { campusqApi } from '../api/apiClient';

export default function SuperAdminDashboard() {
  const [colleges, setColleges] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const [collegeForm, setCollegeForm] = useState({
    id: null,
    collegeName: '',
    collegeCode: '',
    address: '',
    active: true,
  });

  const [adminForm, setAdminForm] = useState({
    id: null,
    fullName: '',
    email: '',
    password: '',
    collegeCode: '',
    active: true,
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [colData, admData] = await Promise.all([
        campusqApi.getAllColleges(),
        campusqApi.getAllCollegeAdmins(),
      ]);
      setColleges(colData || []);
      setAdmins(admData || []);
      if (colData?.length > 0 && !adminForm.collegeCode) {
        const firstActive = colData.find((c) => c.active) || colData[0];
        setAdminForm((prev) => ({ ...prev, collegeCode: firstActive.collegeCode }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCollege = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (collegeForm.id) {
        const updated = await campusqApi.updateCollege(collegeForm.id, {
          collegeName: collegeForm.collegeName,
          collegeCode: collegeForm.collegeCode,
          address: collegeForm.address,
          active: collegeForm.active,
        });
        setSuccess(`College "${updated.collegeName}" (${updated.collegeCode}) updated.`);
      } else {
        const created = await campusqApi.createCollege(collegeForm);
        setSuccess(`College "${created.collegeName}" (${created.collegeCode}) created.`);
      }
      setCollegeForm({ id: null, collegeName: '', collegeCode: '', address: '', active: true });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (adminForm.id) {
        const updated = await campusqApi.updateCollegeAdmin(adminForm.id, {
          fullName: adminForm.fullName,
          collegeCode: adminForm.collegeCode,
          newPassword: adminForm.password || null,
          active: adminForm.active,
        });
        setSuccess(`College Admin "${updated.fullName}" updated.`);
      } else {
        const created = await campusqApi.createCollegeAdmin({
          fullName: adminForm.fullName,
          email: adminForm.email,
          password: adminForm.password,
          collegeCode: adminForm.collegeCode,
        });
        setSuccess(
          `College Admin ${created.email} assigned to ${created.collegeName} (${created.collegeCode}).`
        );
      }
      setAdminForm((prev) => ({
        id: null,
        fullName: '',
        email: '',
        password: '',
        collegeCode: prev.collegeCode,
        active: true,
      }));
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivateAdmin = async (adm) => {
    if (!window.confirm(`Deactivate College Admin "${adm.email}"?`)) return;
    setError('');
    setSuccess('');
    try {
      await campusqApi.deactivateCollegeAdmin(adm.id);
      setSuccess(`Admin ${adm.email} deactivated.`);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <main className="page-container">
        <section className="welcome-banner welcome-admin">
          <div>
            <div className="college-pill">🛡️ CampusQ Platform Control</div>
            <h1>Super Admin Console</h1>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Create &amp; edit registered colleges and manage College Admin accounts.
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}
            onClick={loadData}
          >
            ↻ Refresh
          </button>
        </section>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="grid-2" style={{ marginBottom: 22 }}>
          <section className="card">
            <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>
              {collegeForm.id ? 'Edit College' : 'Register New College'}
            </h2>
            <form onSubmit={handleSaveCollege}>
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
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={collegeForm.active}
                    onChange={(e) => setCollegeForm({ ...collegeForm, active: e.target.checked })}
                  />
                  College is Active
                </label>
              </div>
              <div className="row-gap">
                <button type="submit" className="btn btn-primary">
                  {collegeForm.id ? 'Update College' : 'Create College'}
                </button>
                {collegeForm.id && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() =>
                      setCollegeForm({
                        id: null,
                        collegeName: '',
                        collegeCode: '',
                        address: '',
                        active: true,
                      })
                    }
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="card">
            <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>
              {adminForm.id ? 'Edit College Admin' : 'Create College Admin'}
            </h2>
            <form onSubmit={handleSaveAdmin}>
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
                  disabled={Boolean(adminForm.id)}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  required={!adminForm.id}
                />
              </div>
              <div className="form-group">
                <label>
                  {adminForm.id
                    ? 'New Password (leave blank to keep current)'
                    : 'Password (min 8 chars)'}
                </label>
                <input
                  type="password"
                  className="input"
                  minLength={8}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  required={!adminForm.id}
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
                  {colleges.map((c) => (
                    <option key={c.id} value={c.collegeCode}>
                      {c.collegeName} ({c.collegeCode})
                    </option>
                  ))}
                </select>
              </div>
              {adminForm.id && (
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={adminForm.active}
                      onChange={(e) => setAdminForm({ ...adminForm, active: e.target.checked })}
                    />
                    Admin Account Active
                  </label>
                </div>
              )}
              <div className="row-gap">
                <button type="submit" className="btn btn-primary">
                  {adminForm.id ? 'Update Admin' : 'Create College Admin'}
                </button>
                {adminForm.id && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() =>
                      setAdminForm((prev) => ({
                        id: null,
                        fullName: '',
                        email: '',
                        password: '',
                        collegeCode: prev.collegeCode,
                        active: true,
                      }))
                    }
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>

        <section className="card" style={{ marginBottom: 22 }}>
          <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>
            Registered Colleges ({colleges.length})
          </h2>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>College Name</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Action</th>
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
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            setCollegeForm({
                              id: college.id,
                              collegeName: college.collegeName,
                              collegeCode: college.collegeCode,
                              address: college.address,
                              active: college.active,
                            })
                          }
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>
            College Admins ({admins.length})
          </h2>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>College</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((adm) => (
                    <tr key={adm.id}>
                      <td style={{ fontWeight: 600 }}>{adm.fullName}</td>
                      <td>{adm.email}</td>
                      <td>
                        <span className="badge badge-primary">{adm.collegeCode}</span>
                      </td>
                      <td>
                        <span className={`badge ${adm.active ? 'badge-success' : 'badge-danger'}`}>
                          {adm.active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td>
                        <div className="row-gap">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() =>
                              setAdminForm({
                                id: adm.id,
                                fullName: adm.fullName,
                                email: adm.email,
                                password: '',
                                collegeCode: adm.collegeCode,
                                active: adm.active,
                              })
                            }
                          >
                            Edit
                          </button>
                          {adm.active && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeactivateAdmin(adm)}
                            >
                              Disable
                            </button>
                          )}
                        </div>
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
