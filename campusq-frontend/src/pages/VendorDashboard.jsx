import React, { useEffect, useMemo, useState } from 'react';
import DashboardShell from '../components/DashboardShell';
import StatusBadge from '../components/StatusBadge';
import { campusqApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_TEMPLATES, fileToBase64DataUrl } from '../data/sampleCatalog';

const ALL_CATEGORIES = ['CANTEEN', 'XEROX', 'STATIONERY', 'OTHER'];
const ALL_SAMPLE_ITEMS = Object.values(SAMPLE_TEMPLATES).flat();

const EMPTY_PRODUCT = {
  id: null,
  name: '',
  description: '',
  price: '',
  stockQuantity: '',
  isServiceItem: false,
  imageUrl: '',
};

function getProductImage(product) {
  if (product.imageUrl) return product.imageUrl;
  const match = ALL_SAMPLE_ITEMS.find(
    (item) => item.name.toLowerCase() === (product.name || '').toLowerCase()
  );
  return match ? match.imageUrl : null;
}

export default function VendorDashboard() {
  const { user } = useAuth();
  const [navTab, setNavTab] = useState('DASHBOARD');
  const [templateCat, setTemplateCat] = useState('CANTEEN');
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilter, setMenuFilter] = useState('ALL');

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 2-step double confirmation modal for demoting a non-staff user
  const [demoteModal, setDemoteModal] = useState(null);

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
    setNavTab('DASHBOARD');
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
  const pendingCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'AWAITING_PAYMENT'
  ).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysOrders = orders.filter((o) => o.tokenDate === todayStr);
  const todaysSales = todaysOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const filteredMenu = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery =
        !menuSearch.trim() ||
        (p.name || '').toLowerCase().includes(menuSearch.trim().toLowerCase());
      const matchesFilter =
        menuFilter === 'ALL' ||
        (menuFilter === 'AVAILABLE' && p.available) ||
        (menuFilter === 'HIDDEN' && !p.available);
      return matchesQuery && matchesFilter;
    });
  }, [products, menuSearch, menuFilter]);

  const navItems = [
    { key: 'DASHBOARD', icon: '🏠', label: 'Dashboard' },
    { key: 'ORDERS', icon: '🛍️', label: 'Orders', badge: pendingCount },
    { key: 'TEMPLATES', icon: '📚', label: 'Quick Add Templates' },
    { key: 'SETTINGS', icon: '⚙️', label: 'Shop Settings' },
    { key: 'QR', icon: '📱', label: 'QR Scanner' },
    { key: 'ANALYTICS', icon: '📊', label: 'Analytics' },
  ];

  const primaryCat = profile?.categories?.[0] || 'CANTEEN';
  const defaultBanner =
    primaryCat === 'XEROX'
      ? '/cat-xerox.jpg'
      : primaryCat === 'STATIONERY'
      ? '/cat-stationery.jpg'
      : '/cat-canteen.jpg';

  return (
    <DashboardShell
      navItems={navItems}
      activeKey={navTab}
      onSelectNav={setNavTab}
      greeting="Vendor Dashboard"
      subtitle="Manage orders, products, and your campus shop."
      roleLabel={`Role: Vendor (${primaryCat})`}
      extraHeaderSlot={
        <button type="button" className="btn btn-outline btn-sm" onClick={loadAll}>
          ↻ Refresh
        </button>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <p className="muted">Loading vendor workspace...</p>
      ) : !isApproved ? (
        <div className="card">
          <div className="row-between">
            <div>
              <h2 style={{ margin: '0 0 6px' }}>{profile?.shopName}</h2>
              <p className="muted" style={{ margin: 0 }}>
                Your shop is currently awaiting approval from your College Admin.
              </p>
            </div>
            <StatusBadge status={profile?.approvalStatus} />
          </div>
        </div>
      ) : (
        <>
          {navTab === 'DASHBOARD' && (
            <>
              <div className="vendor-hero-row">
                <div className="hero-banner-v3" style={{ marginBottom: 0 }}>
                  <img
                    src={profile?.shopImage || defaultBanner}
                    alt={profile?.shopName}
                    className="hero-banner-bg"
                  />
                  <div className="hero-banner-overlay" />
                  <div className="hero-banner-body">
                    <h2>
                      Welcome, <span>{profile?.shopName}!</span> 👋
                    </h2>
                    <p>Accept orders, manage your menu, and serve the campus faster.</p>
                    <div className="row-gap">
                      <span className="hero-shop-select">📍 {profile?.location}</span>
                      <span className="hero-shop-select">
                        {profile?.available ? '● OPEN' : '● CLOSED'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="kpi-grid-4">
                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: '#e6f4f1', color: '#059669' }}>
                      🛒
                    </div>
                    <div>
                      <div className="kpi-label">Today&apos;s Orders</div>
                      <div className="kpi-value">{todaysOrders.length}</div>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                      ₹
                    </div>
                    <div>
                      <div className="kpi-label">Today&apos;s Sales</div>
                      <div className="kpi-value">₹{todaysSales.toFixed(0)}</div>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                      📦
                    </div>
                    <div>
                      <div className="kpi-label">Total Products</div>
                      <div className="kpi-value">{products.length}</div>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                      ⏳
                    </div>
                    <div>
                      <div className="kpi-label">Pending Orders</div>
                      <div className="kpi-value">{pendingCount}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="workspace-split">
                <div>
                  <div className="row-between" style={{ marginBottom: 12 }}>
                    <h3 style={{ margin: 0 }}>Your Menu ({filteredMenu.length} Products)</h3>
                    <div className="row-gap">
                      <input
                        className="search-input"
                        style={{ minWidth: 190 }}
                        placeholder="Search products..."
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                      />
                      <select
                        className="select"
                        style={{ width: 'auto' }}
                        value={menuFilter}
                        onChange={(e) => setMenuFilter(e.target.value)}
                      >
                        <option value="ALL">All Items</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="HIDDEN">Hidden</option>
                      </select>
                    </div>
                  </div>

                  {filteredMenu.length === 0 ? (
                    <div className="empty-state">
                      No products yet. Add one on the right or use Quick Add Templates!
                    </div>
                  ) : (
                    <div className="grid-products-v3">
                      {filteredMenu.map((p) => (
                        <div key={p.id} className="product-card-v3">
                          {getProductImage(p) ? (
                            <img
                              src={getProductImage(p)}
                              alt={p.name}
                              className="product-img-v3"
                            />
                          ) : (
                            <div
                              className="product-img-v3"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                              }}
                            >
                              🛍️
                            </div>
                          )}
                          <div className="product-body-v3">
                            <div>
                              <div className="row-between">
                                <strong style={{ fontSize: '0.94rem' }}>{p.name}</strong>
                                <span
                                  className={`badge ${p.available ? 'badge-success' : 'badge-muted'}`}
                                >
                                  {p.available ? 'Active' : 'Hidden'}
                                </span>
                              </div>
                              <strong style={{ color: '#059669', fontSize: '1.05rem' }}>
                                ₹{Number(p.price).toFixed(0)}
                              </strong>
                            </div>

                            <div className="row-between">
                              <span className="badge badge-success">
                                {p.stockQuantity === null ? 'Service' : `Stock: ${p.stockQuantity}`}
                              </span>
                              <div className="row-gap" style={{ gap: 6 }}>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  title="Edit"
                                  onClick={() => handleEditProduct(p)}
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  title={p.available ? 'Hide' : 'Show'}
                                  onClick={() => handleToggleProduct(p)}
                                >
                                  {p.available ? '👁' : '🚫'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  title="Delete"
                                  onClick={() => handleDeleteProduct(p)}
                                >
                                  🗑
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sticky Right Add/Edit Product Form */}
                <aside className="sticky-panel">
                  <div className="card">
                    <h3 style={{ marginTop: 0 }}>
                      {productForm.id ? '✏️ Edit Product' : '⊕ Add New Product'}
                    </h3>
                    <form onSubmit={handleSaveProduct}>
                      <div className="form-group">
                        <label>Product Name *</label>
                        <input
                          className="input"
                          placeholder="e.g. Masala Dosa"
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="grid-2" style={{ gap: 10 }}>
                        <div className="form-group">
                          <label>Price (₹) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            className="input"
                            placeholder="45"
                            value={productForm.price}
                            onChange={(e) =>
                              setProductForm({ ...productForm, price: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Stock</label>
                          <input
                            type="number"
                            min="0"
                            className="input"
                            placeholder="50"
                            disabled={productForm.isServiceItem}
                            value={productForm.stockQuantity}
                            onChange={(e) =>
                              setProductForm({ ...productForm, stockQuantity: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <label
                        className="row-gap"
                        style={{ marginBottom: 12, fontSize: '0.84rem', fontWeight: 600 }}
                      >
                        <input
                          type="checkbox"
                          checked={productForm.isServiceItem}
                          onChange={(e) =>
                            setProductForm({ ...productForm, isServiceItem: e.target.checked })
                          }
                        />
                        Service item (unlimited stock, e.g. Xerox)
                      </label>

                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          className="textarea"
                          rows={2}
                          placeholder="Short description about the item..."
                          value={productForm.description}
                          onChange={(e) =>
                            setProductForm({ ...productForm, description: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Product Image</label>
                        <label className="dropzone-box" style={{ padding: 14 }}>
                          <span style={{ fontSize: '1.35rem' }}>🖼️</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            Click to upload PNG, JPG (Max 2 MB)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleProductImageUpload}
                          />
                        </label>
                        {productForm.imageUrl && (
                          <img
                            src={productForm.imageUrl}
                            alt="Preview"
                            style={{
                              marginTop: 8,
                              width: '100%',
                              height: 110,
                              objectFit: 'cover',
                              borderRadius: 10,
                            }}
                          />
                        )}
                      </div>

                      <div className="row-gap">
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                          {productForm.id ? 'Save Changes' : '+ Add Product'}
                        </button>
                        {productForm.id && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => setProductForm(EMPTY_PRODUCT)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </aside>
              </div>
            </>
          )}

          {navTab === 'ORDERS' && (
            orders.length === 0 ? (
              <div className="empty-state">No orders received yet.</div>
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
                          <div style={{ fontWeight: 700 }}>
                            {order.studentName}{' '}
                            {order.staffOrder && (
                              <span className="badge badge-staff">★ STAFF</span>
                            )}
                          </div>
                          <div className="muted" style={{ fontSize: '0.82rem' }}>
                            Order #{order.orderId} • {order.tokenDate}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    {order.staffOrder && !order.staffVerified && (
                      <div
                        className="alert alert-warning"
                        style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                      >
                        <strong>Staff Verification:</strong> Confirm ID at counter or demote if not
                        staff.
                        <div className="row-gap" style={{ marginTop: 6 }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleConfirmStaff(order.studentId)}
                          >
                            ✓ Confirm Staff
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
                            Demote to Student
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="row-between" style={{ fontSize: '0.9rem' }}>
                          <span>
                            {item.productName} × {item.quantity}
                          </span>
                          <span>₹{Number(item.subtotal).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.specialNote && (
                        <div className="muted" style={{ marginTop: 6, fontSize: '0.84rem' }}>
                          <strong>Student Note:</strong> {order.specialNote}
                        </div>
                      )}
                      {order.xeroxConfig && (
                        <div className="muted" style={{ marginTop: 4, fontSize: '0.84rem' }}>
                          <strong>Xerox Config:</strong> {order.xeroxConfig}
                        </div>
                      )}
                      {order.xeroxFileData && (
                        <div style={{ marginTop: 8 }}>
                          <a
                            href={order.xeroxFileData}
                            download={order.xeroxFileName || 'xerox-file'}
                            className="btn btn-outline btn-sm"
                          >
                            ⬇ Download {order.xeroxFileName || 'Xerox File'}
                          </a>
                        </div>
                      )}
                      <div className="row-between" style={{ fontWeight: 800, marginTop: 10 }}>
                        <span>
                          {order.paymentMethod ? `${order.paymentMethod} • ` : ''}
                          {order.paymentStatus}
                          {order.paymentReference ? ` (Ref: ${order.paymentReference})` : ''}
                        </span>
                        <span>₹{Number(order.totalAmount).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="row-gap" style={{ marginTop: 12 }}>
                      {order.status === 'PENDING' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOrderStatus(order.orderId, 'AWAITING_PAYMENT')}
                        >
                          Accept &amp; Request Payment
                        </button>
                      )}
                      {order.status === 'AWAITING_PAYMENT' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleOrderStatus(order.orderId, 'PREPARING')}
                        >
                          Confirm Payment &amp; Prepare
                        </button>
                      )}
                      {order.status === 'PREPARING' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOrderStatus(order.orderId, 'READY')}
                        >
                          Mark Ready for Pickup
                        </button>
                      )}
                      {order.status === 'READY' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleOrderStatus(order.orderId, 'COMPLETED')}
                        >
                          ✓ Complete Order
                        </button>
                      )}
                      {['PENDING', 'AWAITING_PAYMENT', 'PREPARING'].includes(order.status) && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOrderStatus(order.orderId, 'CANCELLED')}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {navTab === 'TEMPLATES' && (
            <div className="card">
              <div className="row-between" style={{ marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0 }}>📚 Quick-Add Sample Templates</h3>
                  <p className="muted" style={{ margin: '2px 0 0' }}>
                    One-click add ready-made items with crisp icons into your menu.
                  </p>
                </div>
                <div className="row-gap">
                  {ALL_CATEGORIES.filter((c) => SAMPLE_TEMPLATES[c]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`btn btn-sm ${templateCat === cat ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setTemplateCat(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-products-v3">
                {(SAMPLE_TEMPLATES[templateCat] || []).map((tpl) => (
                  <div key={tpl.name} className="product-card-v3">
                    <img src={tpl.imageUrl} alt={tpl.name} className="product-img-v3" />
                    <div className="product-body-v3">
                      <div>
                        <strong>{tpl.name}</strong>
                        <p className="muted" style={{ fontSize: '0.8rem', margin: '4px 0' }}>
                          {tpl.description}
                        </p>
                      </div>
                      <div className="row-between">
                        <strong>₹{tpl.price}</strong>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleQuickAddTemplate(tpl)}
                        >
                          + Quick Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {navTab === 'SETTINGS' && (
            <div className="card" style={{ maxWidth: 680 }}>
              <h3 style={{ marginTop: 0 }}>⚙️ Shop Settings &amp; Banner</h3>
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
                    rows={2}
                    value={profileForm.description}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, description: e.target.value })
                    }
                  />
                </div>

                <label
                  className="row-gap"
                  style={{ marginBottom: 14, fontWeight: 700, fontSize: '0.9rem' }}
                >
                  <input
                    type="checkbox"
                    checked={profileForm.available}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, available: e.target.checked })
                    }
                  />
                  Shop is currently OPEN for student orders
                </label>

                <div className="form-group">
                  <label>Shop Categories</label>
                  <div className="row-gap">
                    {ALL_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`btn btn-sm ${
                          profileForm.categories.includes(cat) ? 'btn-primary' : 'btn-outline'
                        }`}
                        onClick={() => toggleProfileCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {profileForm.categories.includes('OTHER') && (
                  <div className="form-group">
                    <label>Custom Category Label</label>
                    <input
                      className="input"
                      placeholder="e.g. Juice Center, Bakery"
                      value={profileForm.customCategory}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, customCategory: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Custom Shop Cover Banner (Max 2 MB)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={handleShopImageUpload}
                  />
                  {profileForm.shopImage && (
                    <img
                      src={profileForm.shopImage}
                      alt="Shop cover"
                      style={{
                        marginTop: 8,
                        width: '100%',
                        height: 140,
                        objectFit: 'cover',
                        borderRadius: 12,
                      }}
                    />
                  )}
                </div>

                <button type="submit" className="btn btn-primary">
                  Save Shop Settings
                </button>
              </form>
            </div>
          )}

          {navTab === 'QR' && (
            <div className="card" style={{ maxWidth: 520 }}>
              <h3 style={{ marginTop: 0 }}>📱 UPI QR Scanner for Student Payments</h3>
              <p className="muted">
                Upload your PhonePe / GPay / Paytm QR code so students can scan and pay once you
                accept their order.
              </p>
              <form onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label>Upload UPI QR Image (Max 2 MB)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={handleQrUpload}
                  />
                </div>
                {profileForm.qrCodeImage && (
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <img
                      src={profileForm.qrCodeImage}
                      alt="Shop UPI QR"
                      style={{
                        width: 220,
                        height: 220,
                        objectFit: 'contain',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: 8,
                      }}
                    />
                  </div>
                )}
                <button type="submit" className="btn btn-primary">
                  Save QR Code
                </button>
              </form>
            </div>
          )}

          {navTab === 'ANALYTICS' && (
            <div className="grid-2">
              <div className="card">
                <h3 style={{ marginTop: 0 }}>📊 Order Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="row-between">
                    <span className="muted">Total Orders Received</span>
                    <strong>{orders.length}</strong>
                  </div>
                  <div className="row-between">
                    <span className="muted">Completed Orders</span>
                    <strong>{orders.filter((o) => o.status === 'COMPLETED').length}</strong>
                  </div>
                  <div className="row-between">
                    <span className="muted">Cancelled Orders</span>
                    <strong>{orders.filter((o) => o.status === 'CANCELLED').length}</strong>
                  </div>
                  <div className="row-between">
                    <span className="muted">Total Revenue (Non-Cancelled)</span>
                    <strong style={{ color: '#059669' }}>
                      ₹
                      {orders
                        .filter((o) => o.status !== 'CANCELLED')
                        .reduce((s, o) => s + Number(o.totalAmount || 0), 0)
                        .toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
              <div className="card">
                <h3 style={{ marginTop: 0 }}>📦 Catalog Health</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="row-between">
                    <span className="muted">Active Menu Items</span>
                    <strong>{products.filter((p) => p.available).length}</strong>
                  </div>
                  <div className="row-between">
                    <span className="muted">Hidden Items</span>
                    <strong>{products.filter((p) => !p.available).length}</strong>
                  </div>
                  <div className="row-between">
                    <span className="muted">Out of Stock Items</span>
                    <strong>
                      {products.filter((p) => p.stockQuantity !== null && p.stockQuantity <= 0).length}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 2-Step Staff Demotion Confirmation Modal */}
      {demoteModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 style={{ marginTop: 0 }}>
              {demoteModal.step === 1
                ? 'Confirm Not a Staff Member (Step 1 of 2)'
                : 'Final Confirmation (Step 2 of 2)'}
            </h2>
            <p className="muted">
              {demoteModal.step === 1
                ? `Are you sure "${demoteModal.studentName}" is NOT a college staff member?`
                : `This will immediately convert "${demoteModal.studentName}" to a Student account and notify them.`}
            </p>
            <div className="row-gap">
              {demoteModal.step === 1 ? (
                <button
                  className="btn btn-warning"
                  onClick={() => setDemoteModal({ ...demoteModal, step: 2 })}
                >
                  Continue to Final Step
                </button>
              ) : (
                <button className="btn btn-danger" onClick={handleDemoteStaff}>
                  Yes, Demote to Student
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setDemoteModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
