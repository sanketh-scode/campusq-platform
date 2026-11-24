import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { campusqApi } from '../api/apiClient';

const ALL_CATEGORIES = ['CANTEEN', 'XEROX', 'STATIONERY'];

const EMPTY_PRODUCT = {
  id: null,
  name: '',
  description: '',
  price: '',
  stockQuantity: '',
  isServiceItem: false,
};

export default function VendorDashboard() {
  const [tab, setTab] = useState('ORDERS');
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [profileForm, setProfileForm] = useState({
    shopName: '',
    description: '',
    location: '',
    available: true,
    categories: [],
  });

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const prof = await campusqApi.getVendorProfile();
      setProfile(prof);
      setProfileForm({
        shopName: prof.shopName || '',
        description: prof.description || '',
        location: prof.location || '',
        available: !!prof.available,
        categories: prof.categories || [],
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
      setSuccess(`Order #${updated.orderId} (Token #${updated.tokenNumber}) updated to ${updated.status}.`);
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
    });
    setTab('PRODUCTS');
  };

  const handleToggleProduct = async (p) => {
    setError('');
    setSuccess('');
    try {
      await campusqApi.toggleProductAvailability(p.id, !p.available);
      setSuccess(`"${p.name}" is now ${!p.available ? 'available' : 'unavailable'}.`);
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
      setSuccess(`"${p.name}" removed (soft-deleted).`);
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
      setSuccess('Shop profile updated successfully.');
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
        <div className="page-header">
          <div>
            <h1>{profile?.shopName || 'Vendor Dashboard'}</h1>
            <p className="page-subtitle">
              {profile?.location ? `${profile.location} • ` : ''}
              Manage incoming token queue, products, and shop availability
            </p>
          </div>
          <div className="row-gap">
            {profile && <StatusBadge status={profile.approvalStatus} />}
            <button className="btn btn-outline btn-sm" onClick={loadAll}>
              Refresh
            </button>
          </div>
        </div>

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
                Incoming Orders ({orders.length})
              </button>
              <button
                className={`tab-btn ${tab === 'PRODUCTS' ? 'active' : ''}`}
                onClick={() => setTab('PRODUCTS')}
              >
                Products ({products.length})
              </button>
              <button
                className={`tab-btn ${tab === 'PROFILE' ? 'active' : ''}`}
                onClick={() => setTab('PROFILE')}
              >
                Shop Settings
              </button>
            </div>

            {tab === 'ORDERS' && (
              orders.length === 0 ? (
                <div className="empty-state">No incoming orders yet.</div>
              ) : (
                <div className="grid-2">
                  {orders.map((order) => (
                    <div key={order.orderId} className="card">
                      <div className="row-between" style={{ marginBottom: 12 }}>
                        <div className="row-gap">
                          <div className="token-box">
                            <span className="token-label">Token</span>
                            <span className="token-num">#{order.tokenNumber}</span>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>Order #{order.orderId}</div>
                            <div className="muted">{order.studentName}</div>
                            <div className="muted" style={{ fontSize: '0.8rem' }}>
                              {order.tokenDate}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 12 }}>
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="row-between" style={{ fontSize: '0.9rem', marginBottom: 4 }}>
                            <span>
                              {item.productName} × {item.quantity}
                            </span>
                            <strong>₹{Number(item.subtotal).toFixed(2)}</strong>
                          </div>
                        ))}
                        <div
                          className="row-between"
                          style={{
                            borderTop: '1px dashed var(--border)',
                            paddingTop: 8,
                            marginTop: 8,
                            fontWeight: 700,
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
                              onClick={() => handleOrderStatus(order.orderId, 'PREPARING')}
                            >
                              Start Preparing
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleOrderStatus(order.orderId, 'CANCELLED')}
                            >
                              Cancel & Restore Stock
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
                              Cancel & Restore Stock
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
              <div className="grid-2" style={{ alignItems: 'start' }}>
                <section className="card">
                  <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>
                    {productForm.id ? 'Edit Product' : 'Add New Product'}
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
                  <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>My Catalog</h2>
                  {products.length === 0 ? (
                    <p className="muted">No products added yet.</p>
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
                            <div>
                              <strong>{p.name}</strong>
                              <span style={{ marginLeft: 8, fontWeight: 700, color: 'var(--primary)' }}>
                                ₹{Number(p.price).toFixed(2)}
                              </span>
                            </div>
                            <span className={`badge ${p.available ? 'badge-success' : 'badge-muted'}`}>
                              {p.available ? 'Available' : 'Hidden'}
                            </span>
                          </div>
                          {p.description && <p className="muted" style={{ margin: '4px 0' }}>{p.description}</p>}
                          <div className="muted" style={{ fontSize: '0.84rem', marginBottom: 10 }}>
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
                              {p.available ? 'Mark Unavailable' : 'Mark Available'}
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
            )}

            {tab === 'PROFILE' && (
              <section className="card" style={{ maxWidth: 620 }}>
                <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>Shop Information & Availability</h2>
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
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={profileForm.available}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, available: e.target.checked })
                        }
                      />
                      Shop is currently OPEN and accepting student orders
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
    </>
  );
}
