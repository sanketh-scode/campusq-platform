import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { campusqApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { fileToBase64DataUrl } from '../data/sampleCatalog';

const CATEGORIES = ['ALL', 'CANTEEN', 'XEROX', 'STATIONERY', 'OTHER'];
const ORDER_STEPS = ['PENDING', 'AWAITING_PAYMENT', 'PREPARING', 'READY', 'COMPLETED'];

const CATEGORY_COVERS = {
  CANTEEN: '/cat-canteen.jpg',
  XEROX: '/cat-xerox.jpg',
  STATIONERY: '/cat-stationery.jpg',
};

function getVendorCoverImage(vendor) {
  if (vendor.shopImage) return vendor.shopImage;
  const cats = vendor.categories || [];
  for (const c of ['CANTEEN', 'XEROX', 'STATIONERY']) {
    if (cats.includes(c)) return CATEGORY_COVERS[c];
  }
  return null;
}


export default function StudentDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('BROWSE');
  const [category, setCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);

  // Top Cart Modal & Checkout State
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState({ vendorId: null, vendorName: '', vendorCategories: [], items: [] });
  const [specialNote, setSpecialNote] = useState('');
  const [xerox, setXerox] = useState({
    fileName: '',
    fileType: '',
    fileData: '',
    copies: 1,
    colorMode: 'Black & White',
    sides: 'Single-Sided',
    paperSize: 'A4',
    binding: 'None',
  });

  // Payment Modal State (when vendor accepts order -> AWAITING_PAYMENT)
  const [payModalOrder, setPayModalOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE_UPI');
  const [paymentReference, setPaymentReference] = useState('');

  // Complaint Modal State
  const [complaintVendor, setComplaintVendor] = useState(null);
  const [complaintOrderId, setComplaintOrderId] = useState('');
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintMessage, setComplaintMessage] = useState('');

  const [latestOrder, setLatestOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadVendorsAndSearch = async (activeCat = category, query = searchQuery) => {
    setLoading(true);
    setError('');
    try {
      const catParam = activeCat === 'ALL' ? null : activeCat;
      const vendData = await campusqApi.browseVendors(catParam, query);
      setVendors(vendData || []);

      if (query.trim() && !selectedVendor) {
        const prodData = await campusqApi.getAllCollegeProducts(query.trim());
        setProducts(prodData || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await campusqApi.getMyOrders();
      setOrders(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadComplaints = async () => {
    try {
      const data = await campusqApi.getMyComplaints();
      setComplaints(data || []);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadVendorsAndSearch(category, searchQuery);
  }, [category]);

  useEffect(() => {
    loadOrders();
    loadComplaints();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSelectedVendor(null);
    loadVendorsAndSearch(category, searchQuery);
  };

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
    const vendorCats =
      selectedVendor?.vendorId === product.vendorId
        ? selectedVendor.categories || []
        : vendors.find((v) => v.vendorId === product.vendorId)?.categories || [];

    setCart((prev) => {
      if (prev.vendorId && prev.vendorId !== product.vendorId && prev.items.length > 0) {
        const confirmSwitch = window.confirm(
          `Your cart has items from ${prev.vendorName}. Clear cart and start an order from ${product.vendorName}?`
        );
        if (!confirmSwitch) return prev;
        return {
          vendorId: product.vendorId,
          vendorName: product.vendorName,
          vendorCategories: vendorCats,
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
        vendorCategories: nextItems.length > 0 ? vendorCats : [],
        items: nextItems,
      };
    });
  };

  const getCartQty = (productId) =>
    cart.items.find((i) => i.product.id === productId)?.quantity || 0;

  const cartItemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const handleXeroxFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const dataUrl = await fileToBase64DataUrl(file);
      setXerox((prev) => ({
        ...prev,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileData: dataUrl,
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cart.vendorId || cart.items.length === 0) return;
    setError('');
    setSuccess('');

    const isXeroxOrder =
      cart.vendorCategories.includes('XEROX') || Boolean(xerox.fileData);
    const xeroxSummary = isXeroxOrder
      ? `Copies: ${xerox.copies} | ${xerox.colorMode} | ${xerox.sides} | ${xerox.paperSize} | Binding: ${xerox.binding}`
      : null;

    try {
      const created = await campusqApi.placeOrder({
        vendorId: cart.vendorId,
        items: cart.items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        specialNote: specialNote.trim() || null,
        xeroxFileName: xerox.fileName || null,
        xeroxFileType: xerox.fileType || null,
        xeroxFileData: xerox.fileData || null,
        xeroxConfig: xeroxSummary,
      });
      setLatestOrder(created);
      setSuccess(
        `Order placed! Token #${created.tokenNumber} generated. Once ${created.vendorName} accepts your order, you can scan & pay.`
      );
      setCart({ vendorId: null, vendorName: '', vendorCategories: [], items: [] });
      setSpecialNote('');
      setXerox({
        fileName: '',
        fileType: '',
        fileData: '',
        copies: 1,
        colorMode: 'Black & White',
        sides: 'Single-Sided',
        paperSize: 'A4',
        binding: 'None',
      });
      setCartOpen(false);
      await loadOrders();
      if (selectedVendor) {
        handleSelectVendor(selectedVendor);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payModalOrder) return;
    setError('');
    setSuccess('');
    try {
      const updated = await campusqApi.submitOrderPayment(payModalOrder.orderId, {
        paymentMethod,
        paymentReference: paymentMethod === 'ONLINE_UPI' ? paymentReference : null,
      });
      setSuccess(
        `Payment details sent for Token #${updated.tokenNumber}. Vendor will confirm and start preparing!`
      );
      setPayModalOrder(null);
      setPaymentReference('');
      loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    setError('');
    setSuccess('');
    try {
      const done = await campusqApi.completeOrderByStudent(orderId);
      setSuccess(`Order #${done.orderId} (Token #${done.tokenNumber}) marked as COMPLETED!`);
      loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order and restore stock?')) return;
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

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintVendor) return;
    setError('');
    setSuccess('');
    try {
      await campusqApi.submitComplaint({
        vendorId: complaintVendor.vendorId,
        orderId: complaintOrderId ? Number(complaintOrderId) : null,
        subject: complaintSubject,
        message: complaintMessage,
      });
      setSuccess(`Complaint sent to your College Admin regarding ${complaintVendor.shopName}.`);
      setComplaintVendor(null);
      setComplaintOrderId('');
      setComplaintSubject('');
      setComplaintMessage('');
      loadComplaints();
    } catch (err) {
      setError(err.message);
    }
  };

  const topCartButton = (
    <button
      type="button"
      className="btn btn-primary btn-sm"
      onClick={() => setCartOpen(true)}
    >
      🛒 Cart ({cartItemCount}) {cartItemCount > 0 ? `• ₹${cartTotal.toFixed(0)}` : ''}
    </button>
  );

  return (
    <>
      <Navbar rightSlot={topCartButton} />
      <main className="page-container">
        <section className="welcome-banner welcome-student">
          <div>
            <div className="college-pill">
              🏫 {user?.collegeName || user?.collegeCode} ({user?.collegeCode})
            </div>
            <h1>Welcome to CampusQ, {user?.fullName}!</h1>
            <p style={{ margin: 0, opacity: 0.9 }}>
              {user?.role === 'STAFF'
                ? 'Your orders carry a ★ STAFF priority badge for faster campus counter service.'
                : 'Browse campus shops, check live stock, order ahead, and collect with your daily token.'}
            </p>
          </div>
          <div className="row-gap">
            <button
              className="btn btn-outline btn-sm"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}
              onClick={() => {
                loadVendorsAndSearch(category, searchQuery);
                loadOrders();
                loadComplaints();
              }}
            >
              ↻ Refresh
            </button>
          </div>
        </section>

        {user?.staffStatusNotice && (
          <div className="alert alert-warning">{user.staffStatusNotice}</div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {latestOrder && (
          <div className="card" style={{ marginBottom: 18, borderColor: '#99f6e4', background: '#f0fdfa' }}>
            <div className="row-between">
              <div className="row-gap">
                <div className="token-box">
                  <span className="token-label">Token</span>
                  <span className="token-num">#{latestOrder.tokenNumber}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    {latestOrder.vendorName} • Total ₹{Number(latestOrder.totalAmount).toFixed(2)}
                  </div>
                  <div className="muted">
                    Status: <strong>{latestOrder.status.replace('_', ' ')}</strong> — Pay once vendor accepts.
                  </div>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setTab('ORDERS')}>
                Track &amp; Pay
              </button>
            </div>
          </div>
        )}

        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'BROWSE' ? 'active' : ''}`}
            onClick={() => setTab('BROWSE')}
          >
            🛍️ Browse Shops &amp; Menu
          </button>
          <button
            className={`tab-btn ${tab === 'ORDERS' ? 'active' : ''}`}
            onClick={() => {
              setTab('ORDERS');
              loadOrders();
            }}
          >
            🎫 My Orders &amp; Tokens ({orders.length})
          </button>
          <button
            className={`tab-btn ${tab === 'COMPLAINTS' ? 'active' : ''}`}
            onClick={() => {
              setTab('COMPLAINTS');
              loadComplaints();
            }}
          >
            📣 My Complaints ({complaints.length})
          </button>
        </div>

        {tab === 'BROWSE' && (
          <>
            <form className="shop-toolbar" onSubmit={handleSearchSubmit}>
              <input
                className="search-input"
                placeholder="Search shops or items (e.g. Masala Dosa, Xerox, Canteen)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedVendor(null);
                    setProducts([]);
                    loadVendorsAndSearch(category, '');
                  }}
                >
                  Clear
                </button>
              )}
            </form>

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
              <p className="muted">Loading campus shops...</p>
            ) : vendors.length === 0 && products.length === 0 ? (
              <div className="empty-state">No open vendors or matching items found in your college.</div>
            ) : (
              <>
                {vendors.length > 0 && (
                  <div className="grid-3" style={{ marginBottom: 24 }}>
                    {vendors.map((v) => {
                      const active = selectedVendor?.vendorId === v.vendorId;
                      const cover = getVendorCoverImage(v);
                      return (
                        <div
                          key={v.vendorId}
                          className={`vendor-card ${active ? 'selected' : ''}`}
                          onClick={() => handleSelectVendor(v)}
                        >
                          <div className="vendor-cover-wrap">
                            {cover ? (
                              <img src={cover} alt={v.shopName} className="vendor-cover-img" />
                            ) : (
                              <div
                                style={{
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '2.5rem',
                                  color: '#fff',
                                }}
                              >
                                🏪
                              </div>
                            )}
                            <div className="vendor-cover-overlay">
                              <span className="badge badge-success" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                ● OPEN
                              </span>
                            </div>
                          </div>

                          <div className="vendor-card-body">
                            <div>
                              <h3 style={{ margin: '0 0 5px', fontSize: '1.08rem' }}>{v.shopName}</h3>
                              <p className="vendor-desc-clamp">
                                {v.description || 'Campus shop'}
                              </p>
                            </div>

                            <div>
                              <div className="muted" style={{ fontSize: '0.82rem', marginBottom: 10 }}>
                                📍 {v.location}
                              </div>
                              <div className="row-between">
                                <div className="row-gap">
                                  {(v.categories || []).map((c) => (
                                    <span key={c} className="badge badge-primary">
                                      {c === 'OTHER' && v.customCategory ? v.customCategory : c}
                                    </span>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  className="admin-subtle-link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setComplaintVendor(v);
                                  }}
                                >
                                  Report issue
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {(selectedVendor || products.length > 0) && (
                  <section>
                    <h2 style={{ margin: '0 0 14px', fontSize: '1.2rem' }}>
                      {selectedVendor ? `${selectedVendor.shopName} — Menu & Stock` : 'Matching Products'}
                    </h2>
                    {products.length === 0 ? (
                      <div className="empty-state">No available items listed by this vendor yet.</div>
                    ) : (
                      <div className="grid-3">
                        {products.map((p) => {
                          const qty = getCartQty(p.id);
                          const outOfStock = p.stockQuantity !== null && p.stockQuantity <= 0;
                          return (
                            <div key={p.id} className="product-card">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="product-img" />
                              ) : (
                                <div
                                  className="product-img"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.2rem',
                                  }}
                                >
                                  🛒
                                </div>
                              )}
                              <div className="product-body">
                                <div>
                                  <div className="row-between">
                                    <strong style={{ fontSize: '1rem' }}>{p.name}</strong>
                                    <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>
                                      ₹{Number(p.price).toFixed(2)}
                                    </strong>
                                  </div>
                                  {!selectedVendor && (
                                    <div className="muted" style={{ fontSize: '0.8rem' }}>
                                      Sold by {p.vendorName}
                                    </div>
                                  )}
                                  {p.description && (
                                    <p className="muted" style={{ margin: '6px 0 0', fontSize: '0.84rem' }}>
                                      {p.description}
                                    </p>
                                  )}
                                </div>

                                <div className="row-between" style={{ paddingTop: 6 }}>
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
                                      ? 'Service'
                                      : outOfStock
                                      ? 'Out of stock'
                                      : `${p.stockQuantity} left`}
                                  </span>

                                  {qty === 0 ? (
                                    <button
                                      className="btn btn-primary btn-sm"
                                      disabled={outOfStock}
                                      onClick={() => updateCartQty(p, 1)}
                                    >
                                      + Add
                                    </button>
                                  ) : (
                                    <div className="row-gap">
                                      <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => updateCartQty(p, -1)}
                                      >
                                        −
                                      </button>
                                      <strong>{qty}</strong>
                                      <button
                                        className="btn btn-outline btn-sm"
                                        disabled={p.stockQuantity !== null && qty >= p.stockQuantity}
                                        onClick={() => updateCartQty(p, 1)}
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </>
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
                          <div className="muted" style={{ fontSize: '0.82rem' }}>
                            Order #{order.orderId} • {order.tokenDate}
                          </div>
                          {order.staffOrder && (
                            <span className="badge badge-staff" style={{ marginTop: 4 }}>
                              ★ STAFF PRIORITY
                            </span>
                          )}
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
                            {step.replace('_', ' ')}
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
                      {order.specialNote && (
                        <div className="muted" style={{ fontSize: '0.84rem', marginTop: 6 }}>
                          <strong>Note:</strong> {order.specialNote}
                        </div>
                      )}
                      {order.xeroxConfig && (
                        <div className="muted" style={{ fontSize: '0.84rem', marginTop: 4 }}>
                          <strong>Print Format:</strong> {order.xeroxConfig}{' '}
                          {order.xeroxFileName ? `(${order.xeroxFileName})` : ''}
                        </div>
                      )}
                      <div className="row-between" style={{ fontWeight: 800, marginTop: 8 }}>
                        <span>Total • Payment: {order.paymentStatus}</span>
                        <span>₹{Number(order.totalAmount).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="row-gap" style={{ marginTop: 12 }}>
                      {order.status === 'AWAITING_PAYMENT' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setPayModalOrder(order);
                            setPaymentMethod(order.vendorQrCodeImage ? 'ONLINE_UPI' : 'COD');
                          }}
                        >
                          💳 Pay Now (QR / COD)
                        </button>
                      )}
                      {order.status === 'READY' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleCompleteOrder(order.orderId)}
                        >
                          ✓ Confirm Collected / Complete
                        </button>
                      )}
                      {(order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT') && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelOrder(order.orderId)}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === 'COMPLAINTS' && (
          <div>
            <div className="row-between" style={{ marginBottom: 14 }}>
              <p className="muted" style={{ margin: 0 }}>
                Report vendor issues directly to your College Admin.
              </p>
              {vendors.length > 0 && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setComplaintVendor(vendors[0])}
                >
                  + New Complaint
                </button>
              )}
            </div>
            {complaints.length === 0 ? (
              <div className="empty-state">No complaints filed.</div>
            ) : (
              <div className="grid-2">
                {complaints.map((c) => (
                  <div key={c.id} className="card">
                    <div className="row-between" style={{ marginBottom: 6 }}>
                      <strong>{c.subject}</strong>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="muted" style={{ fontSize: '0.84rem', marginBottom: 6 }}>
                      Vendor: <strong>{c.vendorShopName}</strong>
                      {c.orderId ? ` • Order #${c.orderId}` : ''}
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '0.9rem' }}>{c.message}</p>
                    {c.adminReply && (
                      <div className="alert alert-success" style={{ marginBottom: 0 }}>
                        <strong>Admin Reply:</strong> {c.adminReply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Top Cart Drawer Modal */}
      {cartOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="row-between" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Your Cart</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setCartOpen(false)}>
                ✕
              </button>
            </div>

            {cart.items.length === 0 ? (
              <p className="muted">Your cart is empty. Add items from a campus shop first.</p>
            ) : (
              <form onSubmit={handlePlaceOrder}>
                <p className="muted" style={{ marginTop: 0 }}>
                  Ordering from <strong>{cart.vendorName}</strong>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {cart.items.map(({ product, quantity }) => (
                    <div key={product.id} className="row-between">
                      <span>
                        {product.name} × {quantity}
                      </span>
                      <strong>₹{(Number(product.price) * quantity).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>

                {(cart.vendorCategories.includes('XEROX') || xerox.fileData) && (
                  <div
                    style={{
                      background: 'var(--surface-muted)',
                      padding: 12,
                      borderRadius: 10,
                      marginBottom: 14,
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: 8 }}>
                      🖨️ Xerox Print File &amp; Format
                    </strong>
                    <div className="form-group">
                      <label>Upload PDF or Image (max 2 MB)</label>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="input"
                        onChange={handleXeroxFile}
                      />
                      {xerox.fileName && (
                        <small className="muted">Attached: {xerox.fileName}</small>
                      )}
                    </div>
                    <div className="grid-2" style={{ gap: 8 }}>
                      <div className="form-group">
                        <label>Copies</label>
                        <input
                          type="number"
                          min="1"
                          className="input"
                          value={xerox.copies}
                          onChange={(e) =>
                            setXerox({ ...xerox, copies: Number(e.target.value) || 1 })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Color</label>
                        <select
                          className="select"
                          value={xerox.colorMode}
                          onChange={(e) => setXerox({ ...xerox, colorMode: e.target.value })}
                        >
                          <option>Black &amp; White</option>
                          <option>Color</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Sides</label>
                        <select
                          className="select"
                          value={xerox.sides}
                          onChange={(e) => setXerox({ ...xerox, sides: e.target.value })}
                        >
                          <option>Single-Sided</option>
                          <option>Double-Sided</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Paper Size</label>
                        <select
                          className="select"
                          value={xerox.paperSize}
                          onChange={(e) => setXerox({ ...xerox, paperSize: e.target.value })}
                        >
                          <option>A4</option>
                          <option>A3</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Binding</label>
                      <select
                        className="select"
                        value={xerox.binding}
                        onChange={(e) => setXerox({ ...xerox, binding: e.target.value })}
                      >
                        <option>None</option>
                        <option>Spiral Binding</option>
                        <option>Soft Binding</option>
                        <option>Lamination</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Special Instructions / Quick Note to Vendor (Optional)</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    placeholder="e.g. Less spicy, pack separately, need urgently before 1 PM..."
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                  />
                </div>

                <div
                  className="row-between"
                  style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: 12,
                    marginBottom: 14,
                    fontSize: '1.1rem',
                    fontWeight: 800,
                  }}
                >
                  <span>Total</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Place Order &amp; Request Vendor Acceptance
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* QR / COD Payment Modal */}
      {payModalOrder && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 style={{ marginTop: 0 }}>
              Complete Payment — Token #{payModalOrder.tokenNumber}
            </h2>
            <p className="muted">
              {payModalOrder.vendorName} accepted your order! Total:{' '}
              <strong>₹{Number(payModalOrder.totalAmount).toFixed(2)}</strong>
            </p>

            <form onSubmit={handleSubmitPayment}>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-option ${paymentMethod === 'ONLINE_UPI' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('ONLINE_UPI')}
                >
                  <span className="role-option-title">📱 Scan Shop QR (UPI)</span>
                  <span className="role-option-sub">Faster counter pickup</span>
                </button>
                <button
                  type="button"
                  className={`role-option ${paymentMethod === 'COD' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <span className="role-option-title">💵 Cash on Delivery</span>
                  <span className="role-option-sub">Pay at pickup counter</span>
                </button>
              </div>

              {paymentMethod === 'ONLINE_UPI' && (
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  {payModalOrder.vendorQrCodeImage ? (
                    <img
                      src={payModalOrder.vendorQrCodeImage}
                      alt="Vendor UPI QR"
                      style={{
                        width: 210,
                        height: 210,
                        objectFit: 'contain',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: 6,
                      }}
                    />
                  ) : (
                    <div className="alert alert-warning">
                      This vendor hasn&apos;t uploaded a QR scanner image yet. You can still pay via
                      Cash on Delivery or enter a UPI reference if paid at counter.
                    </div>
                  )}
                  <div className="form-group" style={{ textAlign: 'left', marginTop: 10 }}>
                    <label>UPI Transaction / UTR Reference (Optional)</label>
                    <input
                      className="input"
                      placeholder="e.g. 432910582910"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="row-gap">
                <button type="submit" className="btn btn-primary">
                  {paymentMethod === 'ONLINE_UPI' ? 'I Have Paid Online' : 'Confirm Cash on Delivery'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setPayModalOrder(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Complaint Modal */}
      {complaintVendor && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2 style={{ marginTop: 0 }}>Report Issue to College Admin</h2>
            <p className="muted">
              Vendor: <strong>{complaintVendor.shopName}</strong>
            </p>
            <form onSubmit={handleSubmitComplaint}>
              <div className="form-group">
                <label>Vendor</label>
                <select
                  className="select"
                  value={complaintVendor.vendorId}
                  onChange={(e) => {
                    const found = vendors.find((v) => v.vendorId === Number(e.target.value));
                    if (found) setComplaintVendor(found);
                  }}
                >
                  {vendors.map((v) => (
                    <option key={v.vendorId} value={v.vendorId}>
                      {v.shopName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Order ID (Optional)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 12"
                  value={complaintOrderId}
                  onChange={(e) => setComplaintOrderId(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  className="input"
                  placeholder="e.g. Wrong item or overcharged"
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Details</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={complaintMessage}
                  onChange={(e) => setComplaintMessage(e.target.value)}
                  required
                />
              </div>
              <div className="row-gap">
                <button type="submit" className="btn btn-danger">
                  Submit Complaint
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setComplaintVendor(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
