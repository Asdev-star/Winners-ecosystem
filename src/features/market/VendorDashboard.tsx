// Phase 4 Layer: Winners Market
// Vendor Dashboard - Analytics, inventory management, orders
// Commerce Hub (4A) - Vendor storefront management

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import AssistantPanel from '../../components/ui/AssistantPanel';
import OmegaProfileAssignmentCard from '../../components/ui/OmegaProfileAssignmentCard';
import AtlasContextBar from './atlas/AtlasContextBar';
import ATLASPanel from './components/ATLASPanel';

const styles = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    color: 'var(--text-dim)',
    marginTop: '4px',
  },
  btnPrimary: {
    padding: '12px 20px',
    backgroundColor: 'var(--gold)',
    color: 'var(--bg)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: 'var(--surface)',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    padding: '20px',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  statCardTopBorder: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, var(--gold), transparent)',
  },
  statLabel: {
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    marginBottom: '8px',
  },
  statValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--text)',
  },
  statChange: {
    fontSize: '13px',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  positive: {
    color: 'var(--green)',
  },
  negative: {
    color: 'var(--red)',
  },
  section: {
    marginBottom: '32px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  table: {
    width: '100%',
    backgroundColor: 'var(--surface)',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '14px 20px',
    backgroundColor: 'var(--surface2)',
    borderBottom: '1px solid var(--border)',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
    alignItems: 'center',
    fontSize: '14px',
    color: 'var(--text)',
  },
  productInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  productImage: {
    width: '48px',
    height: '48px',
    borderRadius: '4px',
    backgroundColor: 'var(--surface2)',
    objectFit: 'cover' as const,
  },
  productName: {
    fontWeight: 500,
  },
  productMeta: {
    fontSize: '12px',
    color: 'var(--text-dim)',
    marginTop: '2px',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    width: 'fit-content',
  },
  inStock: {
    backgroundColor: 'rgba(45, 212, 160, 0.15)',
    color: 'var(--green)',
  },
  lowStock: {
    backgroundColor: 'var(--gold-glow-sm)',
    color: 'var(--gold)',
  },
  outOfStock: {
    backgroundColor: 'rgba(224, 90, 78, 0.15)',
    color: 'var(--red)',
  },
  actionBtn: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    color: 'var(--text)',
    fontSize: '12px',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '0',
  },
  tab: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-dim)',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '-1px',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    color: 'var(--gold)',
    borderBottomColor: 'var(--gold)',
  },
  chartPlaceholder: {
    height: '240px',
    backgroundColor: 'var(--surface)',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-dim)',
  },
  orderId: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
  },
  customerName: {
    fontWeight: 500,
  },
  orderDate: {
    fontSize: '12px',
    color: 'var(--text-dim)',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px',
    color: 'var(--text-dim)',
  },
};

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  sales: number;
  status: 'active' | 'draft' | 'archived';
}

interface Order {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
}

interface PayoutSummary {
  total: number;
  paid: number;
  pending: number;
}

export default function VendorDashboard() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary>({ total: 0, paid: 0, pending: 0 });
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch vendor info
      const vendorRes = await fetch('/api/v1/vendors/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      // Fetch products
      const productsRes = await fetch('/api/v1/products?vendor=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      // Fetch orders
      const ordersRes = await fetch('/api/v1/orders/vendor/all', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const payoutsRes = await fetch('/api/v1/vendors/me/payouts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Process responses - use real data from API
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || productsData || []);
      }
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const normalizedOrders = Array.isArray(ordersData.orders)
          ? ordersData.orders.map((order: any) => ({
              id: order.orderNumber || order.id,
              customer: order.user?.name || order.user?.email || 'Customer',
              product: order.items?.[0]?.product?.name || order.items?.[0]?.name || 'Order',
              amount: Number(order.total || 0),
              status: String(order.status || 'pending').toLowerCase(),
              date: order.createdAt || new Date().toISOString(),
            }))
          : [];
        setOrders(normalizedOrders);
      }

      if (payoutsRes.ok) {
        const payoutData = await payoutsRes.json();
        setPayoutSummary({
          total: Number(payoutData.summary?.total || 0),
          paid: Number(payoutData.summary?.paid || 0),
          pending: Number(payoutData.summary?.pending || 0),
        });
        setAvailableBalance(Number(payoutData.balance || 0));
      }
      
      if (!vendorRes.ok) {
        const vendorData = await vendorRes.json();
        if (vendorData.code === 'NOT_SETUP') {
          setError('VENDOR_NOT_SETUP');
        } else {
          throw new Error(vendorData.error || 'Failed to load vendor data');
        }
      }
    } catch (err: unknown) {
      // Error state - no fallback data, show error UI
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setProducts([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', style: styles.outOfStock };
    if (stock < 5) return { label: 'Low Stock', style: styles.lowStock };
    return { label: 'In Stock', style: styles.inStock };
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'var(--gold)';
      case 'processing': return 'var(--blue)';
      case 'shipped': return 'var(--purple)';
      case 'delivered': return 'var(--green)';
      case 'cancelled': return 'var(--red)';
      default: return 'var(--text-dim)';
    }
  };

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.amount, 0);

  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 5).length;

  return (
    <div style={styles.container}>
      <style>{`
        .ctx-badge { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.08em; padding:4px 10px; border-radius:3px; border:1px solid var(--border); background:var(--surface); color:var(--text-dim); text-transform:uppercase; }
        .ctx-badge.live { background:rgba(45,212,160,0.08); border-color:rgba(45,212,160,0.3); color:var(--green); }
        .ctx-badge.active { background:rgba(201,168,76,0.15); border-color:var(--gold); color:var(--gold); font-weight:700; }
        .ctx-badge.building { background:rgba(201,168,76,0.08); border-color:rgba(201,168,76,0.25); color:var(--gold); }
        .ctx-sep { color:var(--border); font-size:11px; }
      `}</style>
      {/* Context Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <span className="ctx-badge live">⬡ Core Engine</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge live">🧑‍🤝‍🧑 Community</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge live">🎓 Academy</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">🛒 Market</span>
      </div>

      {/* ATLAS Market Insight Bar */}
      <AtlasContextBar view="vendor-dashboard" />

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Vendor Dashboard</h1>
          <p style={styles.subtitle}>Manage your products, orders, and analytics</p>
        </div>
        <button style={styles.btnPrimary} onClick={() => navigate('/market/vendor/products/new')}>
          + Add Product
        </button>
      </div>

      <OmegaProfileAssignmentCard layer="market" />

      <ATLASPanel
        platformContext={{
          activeProducts: totalProducts,
          lowStockProducts: lowStockCount,
          pendingOrders: orders.filter((order) => order.status === 'pending').length,
          totalRevenue,
          totalSales,
          pendingPayouts: payoutSummary.pending,
          currentTab: activeTab,
        }}
      />

      {/* ATLAS AI Assistant */}
      <div style={{ marginBottom: '24px' }}>
        <AssistantPanel 
          assistant="atlas" 
          page="vendor-dashboard" 
          initialMessage="I'm ATLAS, your Market AI assistant. I can help you with product pricing, inventory optimization, and sales strategies."
        />
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statCardTopBorder}></div>
          <div style={styles.statLabel}>Total Revenue</div>
          <div style={styles.statValue}>${totalRevenue.toFixed(2)}</div>
          <div style={{ ...styles.statChange, ...styles.positive }}>
            ↑ 12.5% from last month
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardTopBorder}></div>
          <div style={styles.statLabel}>Total Sales</div>
          <div style={styles.statValue}>{totalSales}</div>
          <div style={{ ...styles.statChange, ...styles.positive }}>
            ↑ 8.2% from last month
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardTopBorder}></div>
          <div style={styles.statLabel}>Active Products</div>
          <div style={styles.statValue}>{totalProducts}</div>
          <div style={{ ...styles.statChange, ...(lowStockCount > 0 ? styles.negative : styles.positive) }}>
            {lowStockCount > 0 ? `⚠ ${lowStockCount} low stock` : 'All products in stock'}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardTopBorder}></div>
          <div style={styles.statLabel}>Pending Orders</div>
          <div style={styles.statValue}>{orders.filter(o => o.status === 'pending').length}</div>
          <div style={{ ...styles.statChange, ...styles.positive }}>
            Requires attention
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardTopBorder}></div>
          <div style={styles.statLabel}>Pending Payouts</div>
          <div style={styles.statValue}>${payoutSummary.pending.toFixed(2)}</div>
          <div style={{ ...styles.statChange, ...(payoutSummary.pending > 0 ? styles.positive : styles.negative) }}>
            ${payoutSummary.paid.toFixed(2)} paid out
          </div>
        </div>
        <div style={{ ...styles.statCard, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ ...styles.statCardTopBorder, background: 'var(--green)' }}></div>
          <div style={styles.statLabel}>Available Balance</div>
          <div style={{ ...styles.statValue, color: 'var(--green)' }}>${availableBalance.toFixed(2)}</div>
          <button
            style={{ ...styles.btnPrimary, marginTop: '12px', background: 'var(--green)', width: '100%' }}
            onClick={() => setPayoutModalOpen(true)}
            disabled={availableBalance < 50}
          >
            Request Payout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'overview' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'products' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'orders' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Revenue Overview</h2>
          </div>
          <div style={styles.chartPlaceholder}>
            📊 Revenue chart will appear here (connect to analytics API)
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div style={styles.section}>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Product</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Sales</span>
              <span>Actions</span>
            </div>
            {products.map((product) => {
              const stockStatus = getStockStatus(product.stock);
              return (
                <div key={product.id} style={styles.tableRow}>
                  <div style={styles.productInfo}>
                    <div style={styles.productImage}></div>
                    <div>
                      <div style={styles.productName}>{product.name}</div>
                      <div style={styles.productMeta}>ID: {product.id}</div>
                    </div>
                  </div>
                  <span>${product.price.toFixed(2)}</span>
                  <span>
                    <span style={{ ...styles.statusBadge, ...stockStatus.style }}>
                      {stockStatus.label} ({product.stock})
                    </span>
                  </span>
                  <span>{product.sales}</span>
                  <span>
                    <button style={styles.actionBtn}>Edit</button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div style={styles.section}>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Order ID</span>
              <span>Customer</span>
              <span>Product</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {orders.map((order) => (
              <div key={order.id} style={styles.tableRow}>
                <span style={styles.orderId}>{order.id}</span>
                <span style={styles.customerName}>{order.customer}</span>
                <span>{order.product}</span>
                <span>${order.amount.toFixed(2)}</span>
                <span>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: `${getOrderStatusColor(order.status)}20`,
                    color: getOrderStatusColor(order.status),
                  }}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {payoutModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            border: '1px solid var(--border)',
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: 'var(--text)' }}>Request Payout</h2>
            
            {payoutSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <p style={{ color: 'var(--green)', fontWeight: 600 }}>Payout requested successfully!</p>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                  Your payout will be processed to your connected Stripe account.
                </p>
                <button
                  style={{ ...styles.btnPrimary, marginTop: '20px', width: '100%' }}
                  onClick={() => {
                    setPayoutModalOpen(false);
                    setPayoutSuccess(false);
                    setPayoutAmount('');
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '14px' }}>
                    Available Balance
                  </label>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--green)' }}>
                    ${availableBalance.toFixed(2)}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '14px' }}>
                    Payout Amount (min $50)
                  </label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Enter amount"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '16px',
                    }}
                  />
                </div>

                {payoutError && (
                  <div style={{ 
                    padding: '12px', 
                    borderRadius: '6px', 
                    background: 'rgba(255,100,100,0.1)', 
                    color: 'var(--red)',
                    marginBottom: '16px',
                    fontSize: '14px',
                  }}>
                    {payoutError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setPayoutModalOpen(false);
                      setPayoutError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'var(--green)',
                      color: '#000',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: payoutLoading ? 'not-allowed' : 'pointer',
                      opacity: payoutLoading ? 0.7 : 1,
                    }}
                    onClick={async () => {
                      const amount = Number(payoutAmount);
                      if (amount < 50) {
                        setPayoutError('Minimum payout amount is $50');
                        return;
                      }
                      if (amount > availableBalance) {
                        setPayoutError('Amount exceeds available balance');
                        return;
                      }
                      setPayoutLoading(true);
                      setPayoutError(null);
                      try {
                        const res = await fetch('/api/v1/vendors/me/payout/request', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({ amount, payoutMethod: 'stripe_connect' }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          throw new Error(data.error || 'Failed to process payout');
                        }
                        setPayoutSuccess(true);
                        fetchVendorData();
                      } catch (err: any) {
                        setPayoutError(err.message || 'Failed to process payout');
                      } finally {
                        setPayoutLoading(false);
                      }
                    }}
                    disabled={payoutLoading || !payoutAmount}
                  >
                    {payoutLoading ? 'Processing...' : 'Request Payout'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
