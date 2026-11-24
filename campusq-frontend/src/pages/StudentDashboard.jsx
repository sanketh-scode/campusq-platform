import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { campusqApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['ALL', 'CANTEEN', 'XEROX', 'STATIONERY'];
const ORDER_STEPS = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('BROWSE');
  const [category, setCategory] = useState('ALL');
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Single-vendor cart: { vendorId, vendorName, items: [{ product, quantity }] }
  const [cart, setCart] = useState({ vendorId: null, vendorName: '', items: [] });
  const [latestOrder, setLatestOrder] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadVendors = async (selectedCat = category) => {
    setLoading(true);
    setError('');
    try {
      const data = await campusqApi.browseVendors(selectedCat === 'ALL' ? null : selectedCat);
      setVendors(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setError('');
    try {
      const data = await campusqApi.getMyOrders();
      setOrders(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadVendors(category);
  }, [category]);

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSelectVendor = async (vendor) => {
    setSelectedVendor(vendor);
    setError('');
    try {
      const data = await campusqApi.getVendorProductsForStudent(vendor.vendorId);
      setProducts(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateCartQty = (product, delta) => {
    setError('');
    setCart((prev) => {
      // Enforce single-vendor cart rule
      if (prev.vendorId && prev.vendorId !== product.vendorId && prev.items.length > 0) {
        const confirmSwitch = window.confirm(
          `Your cart has items from ${prev.vendorName}. Clear cart and start an order from ${product.vendorName}?`
        );
        if (!confirmSwitch) return prev;
        return {
          vendorId: product.vendorId,
          vendorName: product.vendorName,
          items: delta > 0 ? [{ product, quantity: delta }] : [],
        };
      }

      const existing = prev.items.find((i) => i.product.id === product.id);
      let nextItems;
      if (existing) {
        const nextQty = existing.quantity + delta;
        if (product.stockQuantity !== null && nextQty > product.stockQuantity) {
          setError(`Only ${product.stockQuantity} left in stock for ${product.name}.`);
          return prev;
        }
        nextItems =
          nextQty <= 0
            ? prev.items.filter((i) => i.product.id !== product.id)
            : prev.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: nextQty } : i
              );
      } else if (delta > 0) {
        if (product.stockQuantity !== null && product.stockQuantity < delta) {
          setError(`${product.name} is out of stock.`);
          return prev;
        }
        nextItems = [...prev.items, { product, quantity: delta }];
      } else {
        nextItems = prev.items;
      }

      return {
        vendorId: nextItems.length > 0 ? product.vendorId : null,
        vendorName: nextItems.length > 0 ? product.vendorName : '',
        items: nextItems,
      };
    });
  };

  const getCartQty = (productId) =>
    cart.items.find((i) => i.product.id === productId)?.quantity || 0;

  const cartTotal = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (!cart.vendorId || cart.items.length === 0) return;
    setError('');
    setSuccess('');
    try {
      const created = await campusqApi.placeOrder({
        vendorId: cart.vendorId,
        items: cart.items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
      setLatestOrder(created);
      setSuccess(
        `Order placed! Your Token Number is #${created.tokenNumber} at ${created.vendorName}.`
      );
      setCart({ vendorId: null, vendorName: '', items: [] });
      await loadOrders();
      if (selectedVendor) {
        handleSelectVendor(selectedVendor);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this pending order?')) return;
    setError('');
    setSuccess('');
    try {
      const cancelled = await campusqApi.cancelOrder(orderId);
      setSuccess(`Order #${cancelled.orderId} cancelled and stock restored.`);
      loadOrders();
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
            <h1>CampusQ Student Hub</h1>
            <p className="page-subtitle">
              Pre-order from approved shops at <strong>{user?.collegeCode}</strong> and track your live token
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              loadVendors(category);
              loadOrders();
            }}
          >
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {latestOrder && (
          <div className="card" style={{ marginBottom: 20, borderColor: '#c7d2fe', background: '#f8faff' }}>
            <div className="row-between">
              <div className="row-gap">
                <div className="token-box">
                  <span className="token-label">Your Token</span>
                  <span className="token-num">#{latestOrder.tokenNumber}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    Order confirmed at {latestOrder.vendorName}
                  </div>
                  <div className="muted">
                    Total: ₹{Number(latestOrder.totalAmount).toFixed(2)} • Status: {latestOrder.status}
                  </div>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setTab('ORDERS')}>
                Track Order
              </button>
            </div>
          </div>
        )}

        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'BROWSE' ? 'active' : ''}`}
            onClick={() => setTab('BROWSE')}
          >
            Browse Campus Shops
          </button>
          <button
            className={`tab-btn ${tab === 'ORDERS' ? 'active' : ''}`}
            onClick={() => {
              setTab('ORDERS');
              loadOrders();
            }}
          >
            My Orders & Tokens ({orders.length})
          </button>
        </div>

        {tab === 'BROWSE' && (
          <div className="student-layout">
            <div>
              <div className="pill-group">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`pill-btn ${category === cat ? 'active' : ''}`}
                    onClick={() => {
                      setCategory(cat);
                      setSelectedVendor(null);
                      setProducts([]);
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {loading ? (
                <p className="muted">Loading campus vendors...</p>
              ) : vendors.length === 0 ? (
                <div className="empty-state">No open vendors available in your college right now.</div>
              ) : (
                <div className="grid-2" style={{ marginBottom: 24 }}>
                  {vendors.map((v) => {
                    const active = selectedVendor?.vendorId === v.vendorId;
                    return (
                      <div
                        key={v.vendorId}
                        className="card"
                        style={{
                          cursor: 'pointer',
                          borderColor: active ? 'var(--primary)' : 'var(--border)',
                          boxShadow: active ? '0 0 0 2px rgba(79, 70, 229, 0.18)' : undefined,
                        }}
                        onClick={() => handleSelectVendor(v)}
                      >
                        <div className="row-between" style={{ marginBottom: 6 }}>
                          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{v.shopName}</h3>
                          <span className="badge badge-success">OPEN</span>
                        </div>
                        <p className="muted" style={{ margin: '0 0 8px' }}>
                          {v.description || 'Campus vendor'}
                        </p>
                        <div className="muted" style={{ fontSize: '0.84rem', marginBottom: 10 }}>
                          Location: {v.location}
                        </div>
                        <div className="row-gap">
                          {(v.categories || []).map((c) => (
                            <span key={c} className="badge badge-primary">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedVendor && (
                <section className="card">
                  <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>
                    {selectedVendor.shopName} — Menu & Services
                  </h2>
                  {products.length === 0 ? (
                    <p className="muted">No available items listed by this shop.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {products.map((p) => {
                        const qty = getCartQty(p.id);
                        const outOfStock = p.stockQuantity !== null && p.stockQuantity <= 0;
                        return (
                          <div
                            key={p.id}
                            className="row-between"
                            style={{
                              border: '1px solid var(--border)',
                              borderRadius: 10,
                              padding: 12,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700 }}>{p.name}</div>
                              {p.description && <div className="muted">{p.description}</div>}
                              <div className="row-gap" style={{ marginTop: 6 }}>
                                <strong style={{ color: 'var(--primary)' }}>
                                  ₹{Number(p.price).toFixed(2)}
                                </strong>
                                <span
                                  className={`badge ${
                                    outOfStock
                                      ? 'badge-danger'
                                      : p.stockQuantity === null
                                      ? 'badge-info'
                                      : 'badge-muted'
                                  }`}
                                >
                                  {p.stockQuantity === null
                                    ? 'Service Item'
                                    : outOfStock
                                    ? 'Out of stock'
                                    : `${p.stockQuantity} in stock`}
                                </span>
                              </div>
                            </div>

                            <div className="row-gap">
                              {qty === 0 ? (
                                <button
                                  className="btn btn-primary btn-sm"
                                  disabled={outOfStock}
                                  onClick={() => updateCartQty(p, 1)}
                                >
                                  Add
                                </button>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => updateCartQty(p, -1)}
                                  >
                                    −
                                  </button>
                                  <strong style={{ minWidth: 20, textAlign: 'center' }}>{qty}</strong>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    disabled={p.stockQuantity !== null && qty >= p.stockQuantity}
                                    onClick={() => updateCartQty(p, 1)}
                                  >
                                    +
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </div>

            <aside className="card" style={{ position: 'sticky', top: 82 }}>
              <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Your Cart</h2>
              {cart.items.length === 0 ? (
                <p className="muted">Select a shop and add items to pre-order.</p>
              ) : (
                <>
                  <div className="muted" style={{ marginBottom: 12 }}>
                    Ordering from <strong>{cart.vendorName}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {cart.items.map(({ product, quantity }) => (
                      <div key={product.id} className="row-between" style={{ fontSize: '0.9rem' }}>
                        <span>
                          {product.name} × {quantity}
                        </span>
                        <strong>₹{(Number(product.price) * quantity).toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                  <div
                    className="row-between"
                    style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: 10,
                      marginBottom: 14,
                      fontSize: '1.05rem',
                      fontWeight: 800,
                    }}
                  >
                    <span>Total</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={handlePlaceOrder}
                  >
                    Place Order & Get Token
                  </button>
                </>
              )}
            </aside>
          </div>
        )}

        {tab === 'ORDERS' && (
          orders.length === 0 ? (
            <div className="empty-state">You have not placed any orders yet.</div>
          ) : (
            <div className="grid-2">
              {orders.map((order) => {
                const currentIdx = ORDER_STEPS.indexOf(order.status);
                return (
                  <div key={order.orderId} className="card">
                    <div className="row-between" style={{ marginBottom: 10 }}>
                      <div className="row-gap">
                        <div className="token-box">
                          <span className="token-label">Token</span>
                          <span className="token-num">#{order.tokenNumber}</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{order.vendorName}</div>
                          <div className="muted" style={{ fontSize: '0.84rem' }}>
                            Order #{order.orderId} • {order.tokenDate}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    {order.status !== 'CANCELLED' && (
                      <div className="stepper">
                        {ORDER_STEPS.map((step, idx) => (
                          <span
                            key={step}
                            className={`step-item ${
                              idx < currentIdx ? 'done' : idx === currentIdx ? 'current' : ''
                            }`}
                          >
                            {step}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 8 }}>
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="row-between" style={{ fontSize: '0.9rem', marginBottom: 4 }}>
                          <span>
                            {item.productName} × {item.quantity}
                          </span>
                          <span>₹{Number(item.subtotal).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="row-between" style={{ fontWeight: 700, marginTop: 8 }}>
                        <span>Total</span>
                        <span>₹{Number(order.totalAmount).toFixed(2)}</span>
                      </div>
                    </div>

                    {order.status === 'PENDING' && (
                      <div style={{ marginTop: 12 }}>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelOrder(order.orderId)}
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>
    </>
  );
}
