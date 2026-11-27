import React, { useEffect, useMemo, useState } from 'react';
import DashboardShell from '../components/DashboardShell';
import StatusBadge from '../components/StatusBadge';
import { campusqApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_TEMPLATES, fileToBase64DataUrl } from '../data/sampleCatalog';

const CATEGORY_TABS = [
  { key: 'CANTEEN', label: 'Canteen', icon: '🍽️', cover: '/cat-canteen.jpg' },
  { key: 'STATIONERY', label: 'Stationery', icon: '✏️', cover: '/cat-stationery.jpg' },
  { key: 'XEROX', label: 'Xerox', icon: '🖨️', cover: '/cat-xerox.jpg' },
  { key: 'OTHER', label: 'Other', icon: '✨', cover: '/cat-stationery.jpg' },
  { key: 'ALL', label: 'All Shops', icon: '🏪', cover: '/cat-canteen.jpg' },
];

const ORDER_STEPS = ['PENDING', 'AWAITING_PAYMENT', 'PREPARING', 'READY', 'COMPLETED'];
const ALL_SAMPLE_ITEMS = Object.values(SAMPLE_TEMPLATES).flat();

function getProductImage(product) {
  if (product.imageUrl) return product.imageUrl;
  const match = ALL_SAMPLE_ITEMS.find(
    (item) => item.name.toLowerCase() === (product.name || '').toLowerCase()
  );
  return match ? match.imageUrl : null;
}

function getHeroMeta(catKey) {
  if (catKey === 'STATIONERY') {
    return {
      titleStart: 'Stationery',
      titleAccent: 'Essentials',
      sub: 'Notebooks, pens, files, markers, and more at your campus store.',
      cover: '/cat-stationery.jpg',
    };
  }
  if (catKey === 'XEROX') {
    return {
      titleStart: 'Xerox & Printing',
      titleAccent: 'Service',
      sub: 'Upload your PDF or image, customize print options, and pick up with your token.',
      cover: '/cat-xerox.jpg',
    };
  }
  if (catKey === 'OTHER') {
    return {
      titleStart: 'Campus',
      titleAccent: 'Services',
      sub: 'Explore additional campus shops and student services.',
      cover: '/cat-stationery.jpg',
    };
  }
  return {
    titleStart: 'Campus',
    titleAccent: 'Canteen',
    sub: 'Pre-order your favorite meals and skip the queue.',
    cover: '/cat-canteen.jpg',
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [navTab, setNavTab] = useState('HOME');
  const [category, setCategory] = useState('CANTEEN');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');

  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Cart State
  const [cart, setCart] = useState({ vendorId: null, vendorName: '', vendorCategories: [], items: [] });
  const [specialNote, setSpecialNote] = useState('');

  // Xerox Studio State
  const [xerox, setXerox] = useState({
    productId: '',
    fileName: '',
    fileType: '',
    fileData: '',
    fileSizeLabel: '',
    pageMode: 'ALL',
    pageStart: 1,
    pageEnd: 10,
    copies: 1,
    colorMode: 'Normal Xerox (Black & White)',
    paperSize: 'A4 (210 × 297 mm)',
    paperType: 'Normal (70 GSM)',
    sides: 'Single-Sided',
    binding: 'No Binding',
    finishing: [],
  });

  // Payment Modal State
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

  const loadVendorProducts = async (vendor) => {
    if (!vendor) {
      setProducts([]);
      return;
    }
    try {
      const data = await campusqApi.getVendorProductsForStudent(vendor.vendorId);
      const list = data || [];
      setProducts(list);
      if (list.length > 0) {
        setXerox((prev) => ({
          ...prev,
          productId: prev.productId && list.some((p) => String(p.id) === String(prev.productId))
            ? prev.productId
            : String(list[0].id),
        }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadVendorsForCategory = async (activeCat = category, query = '') => {
    setLoading(true);
    setError('');
    try {
      const catParam = activeCat === 'ALL' ? null : activeCat;
      const vendData = await campusqApi.browseVendors(catParam, query);
      const list = vendData || [];
      setVendors(list);

      if (list.length > 0) {
        const nextVendor = list[0];
        setSelectedVendor(nextVendor);
        await loadVendorProducts(nextVendor);
      } else {
        setSelectedVendor(null);
        if (query.trim()) {
          const prodData = await campusqApi.getAllCollegeProducts(query.trim());
          setProducts(prodData || []);
        } else {
          setProducts([]);
        }
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

  const loadNotifications = async () => {
    try {
      const data = await campusqApi.getNotifications();
      setNotifications(data || []);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadVendorsForCategory(category, '');
  }, [category]);

  useEffect(() => {
    loadOrders();
    loadComplaints();
    loadNotifications();
  }, []);

  const handleSelectVendor = async (vendor) => {
    setSelectedVendor(vendor);
    setError('');
    await loadVendorProducts(vendor);
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
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
      setXerox((prev) => ({
        ...prev,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileData: dataUrl,
        fileSizeLabel: sizeLabel,
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleXeroxFinishing = (label) => {
    setXerox((prev) => {
      const exists = prev.finishing.includes(label);
      return {
        ...prev,
        finishing: exists
          ? prev.finishing.filter((f) => f !== label)
          : [...prev.finishing, label],
      };
    });
  };

  const handlePlaceCartOrder = async (e) => {
    e.preventDefault();
    if (!cart.vendorId || cart.items.length === 0) return;
    setError('');
    setSuccess('');

    try {
      const created = await campusqApi.placeOrder({
        vendorId: cart.vendorId,
        items: cart.items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        specialNote: specialNote.trim() || null,
      });
      setLatestOrder(created);
      setSuccess(
        `Order placed! Token #${created.tokenNumber} generated. Once ${created.vendorName} accepts, you can scan & pay.`
      );
      setCart({ vendorId: null, vendorName: '', vendorCategories: [], items: [] });
      setSpecialNote('');
      await loadOrders();
      if (selectedVendor) await loadVendorProducts(selectedVendor);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePlaceXeroxOrder = async (e) => {
    e.preventDefault();
    if (!selectedVendor) {
      setError('No open Xerox shop selected.');
      return;
    }
    const chosenProduct =
      products.find((p) => String(p.id) === String(xerox.productId)) || products[0];
    if (!chosenProduct) {
      setError('This Xerox shop has no printing service item listed yet.');
      return;
    }
    setError('');
    setSuccess('');

    const rangeLabel =
      xerox.pageMode === 'ALL' ? 'All Pages' : `Pages ${xerox.pageStart}–${xerox.pageEnd}`;
    const finishLabel = xerox.finishing.length > 0 ? xerox.finishing.join(', ') : 'None';
    const xeroxSummary = `${rangeLabel} | Copies: ${xerox.copies} | ${xerox.colorMode} | ${xerox.paperSize} | ${xerox.paperType} | ${xerox.sides} | Binding: ${xerox.binding} | Finishing: ${finishLabel}`;

    try {
      const created = await campusqApi.placeOrder({
        vendorId: selectedVendor.vendorId,
        items: [{ productId: chosenProduct.id, quantity: Math.max(1, Number(xerox.copies) || 1) }],
        specialNote: specialNote.trim() || null,
        xeroxFileName: xerox.fileName || null,
        xeroxFileType: xerox.fileType || null,
        xeroxFileData: xerox.fileData || null,
        xeroxConfig: xeroxSummary,
      });
      setLatestOrder(created);
      setSuccess(
        `Xerox order placed! Token #${created.tokenNumber} sent to ${created.vendorName}.`
      );
      setSpecialNote('');
      setXerox((prev) => ({
        ...prev,
        fileName: '',
        fileType: '',
        fileData: '',
        fileSizeLabel: '',
        copies: 1,
      }));
      await loadOrders();
      setNavTab('ORDERS');
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

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }
    if (stockFilter === 'IN_STOCK') {
      list = list.filter((p) => p.stockQuantity === null || p.stockQuantity > 0);
    }
    if (sortBy === 'PRICE_ASC') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'PRICE_DESC') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    }
    return list;
  }, [products, searchQuery, stockFilter, sortBy]);

  const activeOrdersCount = orders.filter(
    (o) => !['COMPLETED', 'CANCELLED'].includes(o.status)
  ).length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { key: 'HOME', icon: '🏠', label: 'Home' },
    { key: 'ORDERS', icon: '🛍️', label: 'My Orders', badge: activeOrdersCount },
    { key: 'CART', icon: '🛒', label: 'Cart', badge: cartItemCount },
    { key: 'NOTIFICATIONS', icon: '🔔', label: 'Notifications', badge: unreadNotifsCount },
    { key: 'COMPLAINTS', icon: '💬', label: 'Help & Support', badge: complaints.length },
    { key: 'PROFILE', icon: '👤', label: 'Profile' },
  ];

  const heroMeta = getHeroMeta(category);
  const heroBg = selectedVendor?.shopImage || heroMeta.cover;
  const firstName = (user?.fullName || 'Student').split(' ')[0];
  const selectedXeroxProduct =
    products.find((p) => String(p.id) === String(xerox.productId)) || products[0];
  const estimatedXeroxTotal = selectedXeroxProduct
    ? Number(selectedXeroxProduct.price) * Math.max(1, Number(xerox.copies) || 1)
    : 0;

  return (
    <DashboardShell
      navItems={navItems}
      activeKey={navTab}
      onSelectNav={(k) => {
        if (k === 'CART') {
          setNavTab('HOME');
          setTimeout(() => {
            document.getElementById('student-cart-panel')?.scrollIntoView({ behavior: 'smooth' });
          }, 80);
          return;
        }
        setNavTab(k);
        if (k === 'ORDERS') loadOrders();
        if (k === 'NOTIFICATIONS') loadNotifications();
        if (k === 'COMPLAINTS') loadComplaints();
      }}
      greeting={`Welcome back, ${firstName} 👋`}
      subtitle="Order from campus canteen, stationery, or xerox services."
      roleLabel={user?.role === 'STAFF' ? '★ Role: Staff Priority' : 'Role: Student / Staff'}
      extraHeaderSlot={
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => {
            loadVendorsForCategory(category, '');
            loadOrders();
          }}
        >
          ↻ Refresh
        </button>
      }
    >
      {user?.staffStatusNotice && (
        <div className="alert alert-warning">{user.staffStatusNotice}</div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {latestOrder && navTab === 'HOME' && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            borderColor: '#99f6e4',
            background: '#e6f4f1',
          }}
        >
          <div className="row-between">
            <div className="row-gap">
              <div className="token-box">
                <span className="token-label">Token</span>
                <span className="token-num">#{latestOrder.tokenNumber}</span>
              </div>
              <div>
                <div style={{ fontWeight: 800 }}>
                  {latestOrder.vendorName} • ₹{Number(latestOrder.totalAmount).toFixed(2)}
                </div>
                <div className="muted">
                  Status: <strong>{latestOrder.status.replace('_', ' ')}</strong> — Pay once
                  vendor accepts.
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setNavTab('ORDERS')}>
              Track &amp; Pay →
            </button>
          </div>
        </div>
      )}

      {navTab === 'HOME' && (
        <>
          <div className="cat-pills-row">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`cat-pill-btn ${category === cat.key ? 'active' : ''}`}
                onClick={() => {
                  setCategory(cat.key);
                  setSearchQuery('');
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <section className="hero-banner-v3">
            <img src={heroBg} alt={heroMeta.titleStart} className="hero-banner-bg" />
            <div className="hero-banner-overlay" />
            <div className="hero-banner-body">
              <h2>
                {heroMeta.titleStart} <span>{heroMeta.titleAccent}</span>
              </h2>
              <p>{heroMeta.sub}</p>

              <div className="row-gap">
                {vendors.length > 0 ? (
                  <select
                    className="hero-shop-select"
                    value={selectedVendor?.vendorId || ''}
                    onChange={(e) => {
                      const found = vendors.find(
                        (v) => String(v.vendorId) === e.target.value
                      );
                      if (found) handleSelectVendor(found);
                    }}
                  >
                    {vendors.map((v) => (
                      <option key={v.vendorId} value={v.vendorId}>
                        📍 {v.shopName} ({v.location})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="hero-shop-select">No open shops in this category</span>
                )}

                {selectedVendor && (
                  <button
                    type="button"
                    className="hero-shop-select"
                    onClick={() => setComplaintVendor(selectedVendor)}
                  >
                    ⚠ Report Issue
                  </button>
                )}
              </div>
            </div>
          </section>

          {vendors.length > 1 && (
            <div className="shop-chip-strip">
              {vendors.map((v) => (
                <button
                  key={v.vendorId}
                  type="button"
                  className={`shop-chip ${selectedVendor?.vendorId === v.vendorId ? 'active' : ''}`}
                  onClick={() => handleSelectVendor(v)}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>🏪 {v.shopName}</div>
                  <div className="muted" style={{ fontSize: '0.74rem' }}>📍 {v.location}</div>
                </button>
              ))}
            </div>
          )}

          {category === 'XEROX' ? (
            loading ? (
              <p className="muted">Loading Xerox shops...</p>
            ) : !selectedVendor ? (
              <div className="empty-state">
                No open Xerox &amp; Printing vendor found in your college yet.
              </div>
            ) : (
              <form className="xerox-studio-grid" onSubmit={handlePlaceXeroxOrder}>
                <div className="card">
                  <h3 style={{ marginTop: 0 }}>Upload Your Document</h3>
                  <label className="dropzone-box">
                    <span style={{ fontSize: '2rem' }}>☁️</span>
                    <strong>Click to upload PDF or Image</strong>
                    <span className="muted">PDF, PNG, JPG allowed (max 2 MB)</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      onChange={handleXeroxFile}
                    />
                  </label>

                  {xerox.fileName && (
                    <div
                      className="row-between"
                      style={{
                        marginTop: 12,
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'var(--surface-muted)',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>📄 {xerox.fileName}</strong>
                        <div className="muted" style={{ fontSize: '0.78rem' }}>
                          {xerox.fileSizeLabel}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          setXerox((prev) => ({
                            ...prev,
                            fileName: '',
                            fileType: '',
                            fileData: '',
                            fileSizeLabel: '',
                          }))
                        }
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="form-group" style={{ marginTop: 14, marginBottom: 0 }}>
                    <label>Document Description / Instructions</label>
                    <textarea
                      className="textarea"
                      rows={3}
                      placeholder="e.g. DBMS Unit 3 notes — staple top-left, urgent before 1 PM..."
                      value={specialNote}
                      onChange={(e) => setSpecialNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ marginTop: 0 }}>Customize Your Xerox / Print</h3>

                  <div className="form-group">
                    <label>Print Service Item ({selectedVendor.shopName})</label>
                    {products.length === 0 ? (
                      <div className="alert alert-warning">
                        This vendor hasn&apos;t added Xerox service items yet.
                      </div>
                    ) : (
                      <select
                        className="select"
                        value={xerox.productId}
                        onChange={(e) => setXerox({ ...xerox, productId: e.target.value })}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ₹{Number(p.price).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Page Range</label>
                      <div className="row-gap">
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            xerox.pageMode === 'ALL' ? 'btn-primary' : 'btn-outline'
                          }`}
                          onClick={() => setXerox({ ...xerox, pageMode: 'ALL' })}
                        >
                          All Pages
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            xerox.pageMode === 'CUSTOM' ? 'btn-primary' : 'btn-outline'
                          }`}
                          onClick={() => setXerox({ ...xerox, pageMode: 'CUSTOM' })}
                        >
                          Custom Range
                        </button>
                      </div>
                      {xerox.pageMode === 'CUSTOM' && (
                        <div className="row-gap" style={{ marginTop: 8 }}>
                          <input
                            type="number"
                            min="1"
                            className="input"
                            style={{ width: 80 }}
                            value={xerox.pageStart}
                            onChange={(e) =>
                              setXerox({ ...xerox, pageStart: Number(e.target.value) || 1 })
                            }
                          />
                          <span>to</span>
                          <input
                            type="number"
                            min="1"
                            className="input"
                            style={{ width: 80 }}
                            value={xerox.pageEnd}
                            onChange={(e) =>
                              setXerox({ ...xerox, pageEnd: Number(e.target.value) || 1 })
                            }
                          />
                        </div>
                      )}
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Copy Quantity</label>
                      <div className="qty-stepper">
                        <button
                          type="button"
                          onClick={() =>
                            setXerox((p) => ({ ...p, copies: Math.max(1, p.copies - 1) }))
                          }
                        >
                          −
                        </button>
                        <strong>{xerox.copies}</strong>
                        <button
                          type="button"
                          onClick={() => setXerox((p) => ({ ...p, copies: p.copies + 1 }))}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Print Type</label>
                    <div className="option-card-grid">
                      {['Normal Xerox (Black & White)', 'Color Xerox'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={`option-pill ${xerox.colorMode === mode ? 'active' : ''}`}
                          onClick={() => setXerox({ ...xerox, colorMode: mode })}
                        >
                          <strong>{mode}</strong>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Paper Size</label>
                      <select
                        className="select"
                        value={xerox.paperSize}
                        onChange={(e) => setXerox({ ...xerox, paperSize: e.target.value })}
                      >
                        <option>A4 (210 × 297 mm)</option>
                        <option>A3 (297 × 420 mm)</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Paper Type</label>
                      <select
                        className="select"
                        value={xerox.paperType}
                        onChange={(e) => setXerox({ ...xerox, paperType: e.target.value })}
                      >
                        <option>Normal (70 GSM)</option>
                        <option>Bond Paper (100 GSM)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Print Side</label>
                      <div className="option-card-grid">
                        {['Single-Sided', 'Double-Sided'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`option-pill ${xerox.sides === s ? 'active' : ''}`}
                            onClick={() => setXerox({ ...xerox, sides: s })}
                          >
                            <strong>{s}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Binding</label>
                      <select
                        className="select"
                        value={xerox.binding}
                        onChange={(e) => setXerox({ ...xerox, binding: e.target.value })}
                      >
                        <option>No Binding</option>
                        <option>Staple (Top Left)</option>
                        <option>Spiral Binding</option>
                        <option>Hard Binding</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Finishing (Optional)</label>
                    <div className="row-gap">
                      {['Lamination', 'Hole Punch', 'Cut to Size'].map((fin) => (
                        <label
                          key={fin}
                          className="row-gap"
                          style={{
                            fontWeight: 600,
                            fontSize: '0.84rem',
                            border: '1px solid var(--border)',
                            padding: '6px 10px',
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={xerox.finishing.includes(fin)}
                            onChange={() => toggleXeroxFinishing(fin)}
                          />
                          {fin}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div
                    className="row-between"
                    style={{
                      background: 'var(--primary-soft)',
                      border: '1px solid #99f6e4',
                      borderRadius: 12,
                      padding: '12px 14px',
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <strong style={{ color: '#0f766e' }}>Estimated Price</strong>
                      <div className="muted" style={{ fontSize: '0.78rem' }}>
                        {xerox.copies} × ₹
                        {selectedXeroxProduct ? Number(selectedXeroxProduct.price).toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <strong style={{ fontSize: '1.35rem', color: '#059669' }}>
                      ₹{estimatedXeroxTotal.toFixed(2)}
                    </strong>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px 16px' }}
                    disabled={products.length === 0}
                  >
                    🛒 Place Xerox Order →
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="workspace-split">
              <div>
                <div className="shop-toolbar">
                  <input
                    className="search-input"
                    placeholder={`Search ${category.toLowerCase()} items...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="select"
                    style={{ width: 'auto' }}
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                  >
                    <option value="ALL">Availability: All</option>
                    <option value="IN_STOCK">In Stock Only</option>
                  </select>
                  <select
                    className="select"
                    style={{ width: 'auto' }}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="DEFAULT">Sort: Popular</option>
                    <option value="PRICE_ASC">Price: Low to High</option>
                    <option value="PRICE_DESC">Price: High to Low</option>
                  </select>
                </div>

                {loading ? (
                  <p className="muted">Loading campus menu...</p>
                ) : filteredProducts.length === 0 ? (
                  <div className="empty-state">
                    No matching products available in this shop right now.
                  </div>
                ) : (
                  <div className="grid-products-v3">
                    {filteredProducts.map((p) => {
                      const qty = getCartQty(p.id);
                      const outOfStock = p.stockQuantity !== null && p.stockQuantity <= 0;
                      const lowStock =
                        p.stockQuantity !== null && p.stockQuantity > 0 && p.stockQuantity <= 8;
                      return (
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
                              🛒
                            </div>
                          )}

                          <div className="product-body-v3">
                            <div>
                              <strong style={{ fontSize: '0.96rem', display: 'block' }}>
                                {p.name}
                              </strong>
                              {p.description && (
                                <p
                                  className="muted"
                                  style={{ margin: '3px 0 6px', fontSize: '0.78rem' }}
                                >
                                  {p.description}
                                </p>
                              )}
                              <span
                                className={`badge ${
                                  outOfStock
                                    ? 'badge-danger'
                                    : lowStock
                                    ? 'badge-warning'
                                    : p.stockQuantity === null
                                    ? 'badge-info'
                                    : 'badge-success'
                                }`}
                              >
                                {p.stockQuantity === null
                                  ? 'Service'
                                  : outOfStock
                                  ? 'Out of Stock'
                                  : lowStock
                                  ? `Low Stock (${p.stockQuantity})`
                                  : `In Stock (${p.stockQuantity})`}
                              </span>
                            </div>

                            <div className="row-between" style={{ paddingTop: 4 }}>
                              <strong style={{ fontSize: '1.05rem', color: 'var(--text)' }}>
                                ₹{Number(p.price).toFixed(0)}
                              </strong>

                              {qty === 0 ? (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  disabled={outOfStock}
                                  onClick={() => updateCartQty(p, 1)}
                                >
                                  + Add
                                </button>
                              ) : (
                                <div className="qty-stepper">
                                  <button type="button" onClick={() => updateCartQty(p, -1)}>
                                    −
                                  </button>
                                  <strong>{qty}</strong>
                                  <button
                                    type="button"
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
              </div>

              {/* Sticky Right Cart Panel */}
              <aside id="student-cart-panel" className="sticky-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card">
                  <div className="row-between" style={{ marginBottom: 12 }}>
                    <h3 style={{ margin: 0 }}>🛒 Your Cart ({cartItemCount})</h3>
                    {cartItemCount > 0 && (
                      <button
                        type="button"
                        className="admin-subtle-link"
                        style={{ color: 'var(--primary-hover)' }}
                        onClick={() =>
                          setCart({ vendorId: null, vendorName: '', vendorCategories: [], items: [] })
                        }
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {cart.items.length === 0 ? (
                    <p className="muted" style={{ margin: '10px 0' }}>
                      Add items from the menu to build your campus order.
                    </p>
                  ) : (
                    <form onSubmit={handlePlaceCartOrder}>
                      <div className="muted" style={{ fontSize: '0.8rem', marginBottom: 10 }}>
                        Shop: <strong>{cart.vendorName}</strong>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                        {cart.items.map(({ product, quantity }) => (
                          <div
                            key={product.id}
                            className="row-between"
                            style={{
                              paddingBottom: 8,
                              borderBottom: '1px solid var(--border)',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                                {product.name}
                              </div>
                              <div className="muted" style={{ fontSize: '0.78rem' }}>
                                ₹{Number(product.price).toFixed(0)} × {quantity}
                              </div>
                            </div>
                            <div className="row-gap" style={{ gap: 6 }}>
                              <div className="qty-stepper">
                                <button type="button" onClick={() => updateCartQty(product, -1)}>
                                  −
                                </button>
                                <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                                  {quantity}
                                </span>
                                <button
                                  type="button"
                                  disabled={
                                    product.stockQuantity !== null &&
                                    quantity >= product.stockQuantity
                                  }
                                  onClick={() => updateCartQty(product, 1)}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="form-group">
                        <label>Special Instructions (Optional)</label>
                        <input
                          className="input"
                          placeholder="e.g. Less spicy, pack separately..."
                          value={specialNote}
                          onChange={(e) => setSpecialNote(e.target.value)}
                        />
                      </div>

                      <div
                        className="row-between"
                        style={{
                          background: 'var(--primary-soft)',
                          borderRadius: 10,
                          padding: '10px 12px',
                          marginBottom: 12,
                          fontWeight: 800,
                        }}
                      >
                        <span>Total</span>
                        <span style={{ fontSize: '1.15rem', color: '#059669' }}>
                          ₹{cartTotal.toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '11px 16px' }}
                      >
                        Place Order →
                      </button>
                    </form>
                  )}
                </div>

                {selectedVendor && (
                  <div
                    className="card"
                    style={{
                      background: 'var(--primary-soft)',
                      borderColor: '#99f6e4',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Pickup Counter
                    </div>
                    <div style={{ fontWeight: 800, marginTop: 2 }}>{selectedVendor.shopName}</div>
                    <div style={{ fontSize: '0.84rem', color: '#0f766e', fontWeight: 700, marginTop: 6 }}>
                      ⏱ Estimated Ready Time: 10 – 15 mins
                    </div>
                  </div>
                )}
              </aside>
            </div>
          )}
        </>
      )}

      {navTab === 'ORDERS' && (
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

      {navTab === 'NOTIFICATIONS' && (
        <div className="card">
          <div className="row-between" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>🔔 All Notifications</h3>
            {unreadNotifsCount > 0 && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={async () => {
                  await campusqApi.markAllNotificationsRead();
                  loadNotifications();
                }}
              >
                Mark all as read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="muted">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${!n.read ? 'unread' : ''}`}
                onClick={async () => {
                  if (!n.read) {
                    await campusqApi.markNotificationRead(n.id);
                    loadNotifications();
                  }
                }}
              >
                <div style={{ fontWeight: 700 }}>{n.title}</div>
                <div className="muted" style={{ marginTop: 2 }}>{n.message}</div>
              </div>
            ))
          )}
        </div>
      )}

      {navTab === 'COMPLAINTS' && (
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

      {navTab === 'PROFILE' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <h3 style={{ marginTop: 0 }}>👤 My Campus Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="row-between">
              <span className="muted">Full Name</span>
              <strong>{user?.fullName}</strong>
            </div>
            <div className="row-between">
              <span className="muted">Email</span>
              <strong>{user?.email}</strong>
            </div>
            <div className="row-between">
              <span className="muted">Role</span>
              <span className={`badge ${user?.role === 'STAFF' ? 'badge-staff' : 'badge-primary'}`}>
                {user?.role === 'STAFF' ? '★ STAFF PRIORITY' : user?.role}
              </span>
            </div>
            <div className="row-between">
              <span className="muted">College</span>
              <strong>
                {user?.collegeName} ({user?.collegeCode})
              </strong>
            </div>
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
    </DashboardShell>
  );
}
