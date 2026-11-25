import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { campusqApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_TEMPLATES, fileToBase64DataUrl } from '../data/sampleCatalog';

const ALL_CATEGORIES = ['CANTEEN', 'XEROX', 'STATIONERY', 'OTHER'];

const EMPTY_PRODUCT = {
  id: null,
  name: '',
  description: '',
  price: '',
  stockQuantity: '',
  isServiceItem: false,
  imageUrl: '',
};

export default function VendorDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('ORDERS');
  const [templateCat, setTemplateCat] = useState('CANTEEN');
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 2-step double confirmation modal for demoting a non-staff user
  const [demoteModal, setDemoteModal] = useState(null); // { studentId, studentName, step: 1 | 2 }

  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [profileForm, setProfileForm] = useState({
    shopName: '',
    description: '',
    location: '',
    available: true,
    categories: [],
    customCategory: '',
    qrCodeImage: '',
    shopImage: '',
  });

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const prof = await campusqApi.getVendorProfile();
      setProfile(prof);
      if (prof?.categories?.[0]) {
        setTemplateCat(prof.categories[0]);
      }
      setProfileForm({
        shopName: prof.shopName || '',
        description: prof.description || '',
        location: prof.location || '',
        available: !!prof.available,
        categories: prof.categories || [],
        customCategory: prof.customCategory || '',
        qrCodeImage: prof.qrCodeImage || '',
        shopImage: prof.shopImage || '',
      });

      if (prof.approvalStatus === 'APPROVED') {
        const [ordList, prodList] = await Promise.all([
          campusqApi.getVendorOrders(),
          campusqApi.getVendorProducts(),
        ]);
        setOrders(ordList || []);
        setProducts(prodList || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOrderStatus = async (orderId, nextStatus) => {
    setError('');
    setSuccess('');
    try {
      const updated = await campusqApi.updateOrderStatus(orderId, nextStatus);
      setSuccess(
        `Order #${updated.orderId} (Token #${updated.tokenNumber}) moved to ${updated.status.replace('_', ' ')}.`
      );
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmStaff = async (studentId) => {
    setError('');
    setSuccess('');
    try {
      const res = await campusqApi.verifyStaffMember(studentId, true);
      setSuccess(res.message);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDemoteStaff = async () => {
    if (!demoteModal) return;
    setError('');
    setSuccess('');
    try {
      const res = await campusqApi.verifyStaffMember(demoteModal.studentId, false);
      setSuccess(res.message);
      setDemoteModal(null);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProductImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const dataUrl = await fileToBase64DataUrl(file);
      setProductForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShopImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const dataUrl = await fileToBase64DataUrl(file);
      setProfileForm((prev) => ({ ...prev, shopImage: dataUrl }));
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
      setProfileForm((prev) => ({ ...prev, qrCodeImage: dataUrl }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickAddTemplate = async (tpl) => {
    setError('');
    setSuccess('');
    try {
      await campusqApi.addProduct({
        name: tpl.name,
        description: tpl.description,
        price: tpl.price,
        stockQuantity: tpl.stockQuantity,
        imageUrl: tpl.imageUrl,
      });
      setSuccess(`Added "${tpl.name}" to your catalog!`);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price),
      stockQuantity: productForm.isServiceItem
        ? null
        : productForm.stockQuantity === ''
        ? 0
        : Number(productForm.stockQuantity),
      imageUrl: productForm.imageUrl || null,
    };

    try {
      if (productForm.id) {
        await campusqApi.updateProduct(productForm.id, payload);
        setSuccess(`Product "${payload.name}" updated.`);
      } else {
        await campusqApi.addProduct(payload);
        setSuccess(`Product "${payload.name}" added.`);
      }
      setProductForm(EMPTY_PRODUCT);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditProduct = (p) => {
    setProductForm({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      stockQuantity: p.stockQuantity === null ? '' : String(p.stockQuantity),
      isServiceItem: p.stockQuantity === null,
      imageUrl: p.imageUrl || '',
    });
    setTab('PRODUCTS');
  };

  const handleToggleProduct = async (p) => {
    setError('');
    setSuccess('');
    try {
      await campusqApi.toggleProductAvailability(p.id, !p.available);
      setSuccess(`"${p.name}" is now ${!p.available ? 'available' : 'hidden'}.`);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (p) => {
    if (!window.confirm(`Remove "${p.name}" from your catalog?`)) return;
    setError('');
    setSuccess('');
    try {
      await campusqApi.deleteProduct(p.id);
      setSuccess(`"${p.name}" removed.`);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await campusqApi.updateVendorProfile(profileForm);
      setSuccess('Shop settings & QR scanner updated.');
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleProfileCategory = (cat) => {
    setProfileForm((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
  };

  const isApproved = profile?.approvalStatus === 'APPROVED';

  return (
    <>
      <Navbar />
      <main className="page-container">
        <section className="welcome-banner welcome-vendor">
          <div>
            <div className="college-pill">
              🏪 {user?.collegeCode} • {profile?.location || 'Campus Shop'}
            </div>
            <h1>Welcome, {profile?.shopName || user?.fullName}!</h1>
            <p style={{ margin: 0, opacity: 0.92 }}>
              Accept orders before payment, verify Staff priority orders, and manage your daily token queue.
            </p>
          </div>
          <div className="row-gap">
            {profile && <StatusBadge status={profile.approvalStatus} />}
            <button
              className="btn btn-outline btn-sm"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}
              onClick={loadAll}
            >
              ↻ Refresh
            </button>
          </div>
        </section>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!loading && profile && !isApproved && (
          <div className="alert alert-warning">
            Your shop registration is currently <strong>{profile.approvalStatus}</strong>. You can
            manage products and accept orders once your College Admin approves your shop.
          </div>
        )}

        {isApproved && (
          <>
            <div className="tabs">
              <button
                className={`tab-btn ${tab === 'ORDERS' ? 'active' : ''}`}
                onClick={() => setTab('ORDERS')}
              >
                🎫 Incoming Orders &amp; Payments ({orders.length})
              </button>
              <button
                className={`tab-btn ${tab === 'PRODUCTS' ? 'active' : ''}`}
                onClick={() => setTab('PRODUCTS')}
              >
                📦 Catalog &amp; Quick-Add Templates ({products.length})
              </button>
              <button
                className={`tab-btn ${tab === 'PROFILE' ? 'active' : ''}`}
                onClick={() => setTab('PROFILE')}
              >
                ⚙️ Shop Settings &amp; QR Scanner
              </button>
            </div>

            {tab === 'ORDERS' && (
              orders.length === 0 ? (
                <div className="empty-state">No incoming orders yet.</div>
              ) : (
                <div className="grid-2">
                  {orders.map((order) => (
                    <div key={order.orderId} className="card">
                      <div className="row-between" style={{ marginBottom: 10 }}>
                        <div className="row-gap">
                          <div className="token-box">
                            <span className="token-label">Token</span>
                            <span className="token-num">#{order.tokenNumber}</span>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>Order #{order.orderId}</div>
                            <div className="muted">{order.studentName}</div>
                            <div className="row-gap" style={{ marginTop: 4 }}>
                              {order.staffOrder && (
                                <span className="badge badge-staff">★ STAFF ORDER</span>
                              )}
                              <span
                                className={`badge ${
                                  order.paymentStatus === 'PAID'
                                    ? 'badge-success'
                                    : order.paymentStatus === 'VERIFICATION_PENDING'
                                    ? 'badge-info'
                                    : 'badge-muted'
                                }`}
                              >
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      {order.staffOrder && !order.studentStaffVerified && (
                        <div
                          className="alert alert-warning"
                          style={{ padding: '8px 12px', marginBottom: 10 }}
                        >
                          <div style={{ fontSize: '0.84rem', marginBottom: 6 }}>
                            <strong>First-time Staff Verification:</strong> Is {order.studentName} a
                            genuine college staff member?
                          </div>
                          <div className="row-gap">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleConfirmStaff(order.studentId)}
                            >
                              ✓ Verify Staff
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                setDemoteModal({
                                  studentId: order.studentId,
                                  studentName: order.studentName,
                                  step: 1,
                                })
                              }
                            >
                              ✕ Not Staff
                            </button>
                          </div>
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 12 }}>
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="row-between" style={{ fontSize: '0.9rem', marginBottom: 4 }}>
                            <span>
                              {item.productName} × {item.quantity}
                            </span>
                            <strong>₹{Number(item.subtotal).toFixed(2)}</strong>
                          </div>
                        ))}
                        {order.specialNote && (
                          <div className="muted" style={{ fontSize: '0.84rem', marginTop: 6 }}>
                            <strong>Customer Note:</strong> {order.specialNote}
                          </div>
                        )}
                        {order.xeroxConfig && (
                          <div className="muted" style={{ fontSize: '0.84rem', marginTop: 4 }}>
                            <strong>Xerox:</strong> {order.xeroxConfig}
                          </div>
                        )}
                        {order.xeroxFileData && (
                          <div style={{ marginTop: 6 }}>
                            <a
                              href={order.xeroxFileData}
                              download={order.xeroxFileName || 'xerox-file'}
                              className="btn btn-outline btn-sm"
                            >
                              ⬇ Download {order.xeroxFileName || 'Xerox File'}
                            </a>
                          </div>
                        )}
                        {order.paymentReference && (
                          <div className="muted" style={{ fontSize: '0.82rem', marginTop: 6 }}>
                            <strong>Payment Ref:</strong> {order.paymentMethod} ({order.paymentReference})
                          </div>
                        )}
                        <div
                          className="row-between"
                          style={{
                            borderTop: '1px dashed var(--border)',
                            paddingTop: 8,
                            marginTop: 8,
                            fontWeight: 800,
                          }}
                        >
                          <span>Total</span>
                          <span>₹{Number(order.totalAmount).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="row-gap">
                        {order.status === 'PENDING' && (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleOrderStatus(order.orderId, 'AWAITING_PAYMENT')}
                            >
                              ✓ Accept &amp; Request Payment
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleOrderStatus(order.orderId, 'CANCELLED')}
                            >
                              Reject &amp; Restore Stock
                            </button>
                          </>
                        )}
                        {order.status === 'AWAITING_PAYMENT' && (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleOrderStatus(order.orderId, 'PREPARING')}
                            >
                              ✓ Confirm Payment &amp; Prepare
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleOrderStatus(order.orderId, 'CANCELLED')}
                            >
                              Cancel &amp; Restore Stock
                            </button>
                          </>
                        )}
                        {order.status === 'PREPARING' && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleOrderStatus(order.orderId, 'READY')}
                            >
                              Mark Ready
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleOrderStatus(order.orderId, 'CANCELLED')}
                            >
                              Cancel &amp; Restore Stock
                            </button>
                          </>
                        )}
                        {order.status === 'READY' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleOrderStatus(order.orderId, 'COMPLETED')}
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'PRODUCTS' && (
              <>
                <section className="card" style={{ marginBottom: 20 }}>
                  <div className="row-between" style={{ marginBottom: 10 }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
                        ⚡ Quick-Add Sample Items (with Images)
                      </h2>
                      <p className="muted" style={{ margin: 0 }}>
                        Pick a category and click &ldquo;+ Add This&rdquo; to instantly stock your shop.
                      </p>
                    </div>
                  </div>
                  <div className="pill-group">
                    {ALL_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`pill-btn ${templateCat === cat ? 'active' : ''}`}
                        onClick={() => setTemplateCat(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="grid-3">
                    {(SAMPLE_TEMPLATES[templateCat] || []).map((tpl, idx) => (
                      <div key={idx} className="product-card">
                        <img src={tpl.imageUrl} alt={tpl.name} className="product-img" />
                        <div className="product-body">
                          <div>
                            <div className="row-between">
                              <strong>{tpl.name}</strong>
                              <strong style={{ color: 'var(--primary)' }}>₹{tpl.price}</strong>
                            </div>
                            <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
                              {tpl.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleQuickAddTemplate(tpl)}
                          >
                            + Add This Item
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid-2" style={{ alignItems: 'start' }}>
                  <section className="card">
                    <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>
                      {productForm.id ? 'Edit Product' : 'Add Custom Product / Service'}
                    </h2>
                    <form onSubmit={handleSaveProduct}>
                      <div className="form-group">
                        <label>Product / Service Name</label>
                        <input
                          className="input"
                          placeholder="Masala Dosa or A4 B&W Xerox"
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          className="textarea"
                          rows={2}
                          value={productForm.description}
                          onChange={(e) =>
                            setProductForm({ ...productForm, description: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="input"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Custom Image (Optional, max 2 MB)</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="input"
                          onChange={handleProductImageUpload}
                        />
                        {productForm.imageUrl && (
                          <img
                            src={productForm.imageUrl}
                            alt="Preview"
                            style={{
                              width: 110,
                              height: 70,
                              objectFit: 'cover',
                              borderRadius: 8,
                              marginTop: 8,
                            }}
                          />
                        )}
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={productForm.isServiceItem}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                isServiceItem: e.target.checked,
                                stockQuantity: e.target.checked ? '' : productForm.stockQuantity,
                              })
                            }
                          />
                          Service item (no fixed inventory, e.g. Xerox / Printing)
                        </label>
                      </div>
                      {!productForm.isServiceItem && (
                        <div className="form-group">
                          <label>Stock Quantity</label>
                          <input
                            type="number"
                            min="0"
                            className="input"
                            value={productForm.stockQuantity}
                            onChange={(e) =>
                              setProductForm({ ...productForm, stockQuantity: e.target.value })
                            }
                            required
                          />
                        </div>
                      )}
                      <div className="row-gap">
                        <button type="submit" className="btn btn-primary">
                          {productForm.id ? 'Update Product' : 'Add Product'}
                        </button>
                        {productForm.id && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => setProductForm(EMPTY_PRODUCT)}
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>
                    </form>
                  </section>

                  <section className="card">
                    <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>My Catalog ({products.length})</h2>
                    {products.length === 0 ? (
                      <p className="muted">No products added yet. Use Quick-Add above or add one manually.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {products.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              border: '1px solid var(--border)',
                              borderRadius: 10,
                              padding: 12,
                            }}
                          >
                            <div className="row-between">
                              <div className="row-gap">
                                {p.imageUrl && (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 8 }}
                                  />
                                )}
                                <div>
                                  <strong>{p.name}</strong>
                                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                    ₹{Number(p.price).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <span className={`badge ${p.available ? 'badge-success' : 'badge-muted'}`}>
                                {p.available ? 'Available' : 'Hidden'}
                              </span>
                            </div>
                            <div className="muted" style={{ fontSize: '0.84rem', margin: '6px 0 10px' }}>
                              Stock:{' '}
                              <strong>
                                {p.stockQuantity === null ? 'Service (Unlimited)' : p.stockQuantity}
                              </strong>
                            </div>
                            <div className="row-gap">
                              <button className="btn btn-outline btn-sm" onClick={() => handleEditProduct(p)}>
                                Edit
                              </button>
                              <button className="btn btn-outline btn-sm" onClick={() => handleToggleProduct(p)}>
                                {p.available ? 'Hide' : 'Show'}
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(p)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}

            {tab === 'PROFILE' && (
              <section className="card" style={{ maxWidth: 640 }}>
                <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>
                  Shop Information &amp; UPI QR Scanner
                </h2>
                <form onSubmit={handleSaveProfile}>
                  <div className="form-group">
                    <label>Shop Name</label>
                    <input
                      className="input"
                      value={profileForm.shopName}
                      onChange={(e) => setProfileForm({ ...profileForm, shopName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      className="input"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      className="textarea"
                      rows={3}
                      value={profileForm.description}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Categories</label>
                    <div className="checkbox-row">
                      {ALL_CATEGORIES.map((cat) => {
                        const checked = profileForm.categories.includes(cat);
                        return (
                          <label key={cat} className={`checkbox-chip ${checked ? 'checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProfileCategory(cat)}
                            />
                            {cat}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  {profileForm.categories.includes('OTHER') && (
                    <div className="form-group">
                      <label>Custom Shop Type (e.g. Coffee Shop)</label>
                      <input
                        className="input"
                        value={profileForm.customCategory}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, customCategory: e.target.value })
                        }
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>
                      Shop Cover Image {profileForm.categories.includes('OTHER') ? '(Recommended for Other Category, max 2 MB)' : '(Optional, max 2 MB)'}
                    </label>
                    <input type="file" accept="image/*" className="input" onChange={handleShopImageUpload} />
                    {profileForm.shopImage && (
                      <div style={{ marginTop: 8 }}>
                        <img
                          src={profileForm.shopImage}
                          alt="Shop Cover"
                          style={{
                            width: '100%',
                            maxHeight: 140,
                            objectFit: 'cover',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Shop UPI Payment QR Scanner (max 2 MB)</label>
                    <input type="file" accept="image/*" className="input" onChange={handleQrUpload} />
                    {profileForm.qrCodeImage && (
                      <div style={{ marginTop: 8 }}>
                        <img
                          src={profileForm.qrCodeImage}
                          alt="Shop UPI QR"
                          style={{
                            width: 140,
                            height: 140,
                            objectFit: 'contain',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={profileForm.available}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, available: e.target.checked })
                        }
                      />
                      Shop is currently OPEN and accepting orders
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Save Shop Settings
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </main>

      {/* 2-Step Double Confirmation Modal for Demoting Non-Staff */}
      {demoteModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            {demoteModal.step === 1 ? (
              <>
                <h2 style={{ marginTop: 0 }}>Confirm Non-Staff Decision (Step 1 of 2)</h2>
                <p>
                  Are you sure <strong>{demoteModal.studentName}</strong> is <strong>NOT</strong> a
                  college staff member?
                </p>
                <div className="row-gap">
                  <button
                    className="btn btn-warning"
                    onClick={() => setDemoteModal({ ...demoteModal, step: 2 })}
                  >
                    Yes, Continue
                  </button>
                  <button className="btn btn-outline" onClick={() => setDemoteModal(null)}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ marginTop: 0, color: 'var(--danger)' }}>
                  Final Confirmation (Step 2 of 2)
                </h2>
                <p>
                  This will immediately convert <strong>{demoteModal.studentName}</strong> from{' '}
                  <strong>STAFF</strong> to a regular <strong>STUDENT</strong> account and notify
                  them. Proceed?
                </p>
                <div className="row-gap">
                  <button className="btn btn-danger" onClick={handleDemoteStaff}>
                    Confirm: Convert to Student
                  </button>
                  <button className="btn btn-outline" onClick={() => setDemoteModal(null)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
