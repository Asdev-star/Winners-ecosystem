// src/features/market/OrdersPage.tsx
// Phase 4 — Winners Market: Order History
// Commerce Hub V1.1 — Order Management UI

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import "./OrdersPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface OrderItem {
  id: string;
  productName: string;
  productSlug: string;
  quantity: number;
  price: number;
  variant?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  total: number;
  items: OrderItem[];
  createdAt: string;
  shippingAddress?: string;
  trackingNumber?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "var(--gold)", bg: "rgba(201, 168, 76, 0.1)" },
  PROCESSING: { label: "Processing", color: "var(--ice)", bg: "rgba(137, 196, 225, 0.1)" },
  SHIPPED: { label: "Shipped", color: "var(--purple)", bg: "rgba(155, 111, 255, 0.1)" },
  DELIVERED: { label: "Delivered", color: "var(--green)", bg: "rgba(45, 212, 160, 0.1)" },
  CANCELLED: { label: "Cancelled", color: "var(--red)", bg: "rgba(224, 90, 78, 0.1)" },
};

export default function OrdersPage() {
  const { user, token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  async function fetchOrders() {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data.orders || data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function cancelOrder(orderId: string) {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to cancel order");
      fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (!user) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className="ctx-bar">
            <span className="ctx-badge live">⬡ Core Engine</span>
            <span className="ctx-sep">›</span>
            <span className="ctx-badge live">🛒 Winners Market</span>
            <span className="ctx-sep">›</span>
            <span className="ctx-badge active">📦 Orders</span>
          </div>
          <div className="orders-login-prompt">
            <div className="prompt-icon">🔐</div>
            <h2>Sign in to view your orders</h2>
            <p>Track your orders, view history, and manage returns</p>
            <Link to="/login" className="prompt-btn">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        {/* Context Bar */}
        <div className="ctx-bar">
          <span className="ctx-badge live">⬡ Core Engine</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge live">🛒 Winners Market</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge active">📦 Orders</span>
        </div>

        <div className="orders-header">
          <h1>Your Orders</h1>
          <Link to="/market" className="orders-back-btn">
            Continue Shopping
          </Link>
        </div>

        {error && (
          <div className="orders-error">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {loading ? (
          <div className="orders-loading">
            <div className="orders-spinner" />
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty-icon">📦</div>
            <h2>No orders yet</h2>
            <p>When you make a purchase, your orders will appear here</p>
            <Link to="/market" className="orders-browse-btn">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <span className="order-number">{order.orderNumber}</span>
                      <span className="order-date">{formatDate(order.createdAt)}</span>
                    </div>
                    <span
                      className="order-status"
                      style={{ color: status.color, background: status.bg }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="order-items-preview">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="order-item-name">
                        {item.quantity}× {item.productName}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="order-more-items">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="order-footer">
                    <span className="order-total">
                      ${(order.total / 100).toFixed(2)}
                    </span>
                    <div className="order-actions">
                      <button
                        className="order-view-btn"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View Details
                      </button>
                      {order.status === "PENDING" && (
                        <button
                          className="order-cancel-btn"
                          onClick={() => cancelOrder(order.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="order-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
              <div className="modal-header">
                <h2>Order {selectedOrder.orderNumber}</h2>
                <span
                  className="order-status"
                  style={{
                    color: STATUS_CONFIG[selectedOrder.status]?.color,
                    background: STATUS_CONFIG[selectedOrder.status]?.bg,
                  }}
                >
                  {STATUS_CONFIG[selectedOrder.status]?.label}
                </span>
              </div>
              <div className="modal-date">
                Placed on {formatDate(selectedOrder.createdAt)}
              </div>

              <div className="modal-section">
                <h3>Items</h3>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="modal-item">
                    <Link
                      to={`/market/products/${item.productSlug}`}
                      className="modal-item-name"
                    >
                      {item.productName}
                    </Link>
                    {item.variant && (
                      <span className="modal-item-variant">{item.variant}</span>
                    )}
                    <span className="modal-item-qty">Qty: {item.quantity}</span>
                    <span className="modal-item-price">
                      ${((item.price * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {selectedOrder.shippingAddress && (
                <div className="modal-section">
                  <h3>Shipping Address</h3>
                  <p className="modal-address">{selectedOrder.shippingAddress}</p>
                </div>
              )}

              {selectedOrder.trackingNumber && (
                <div className="modal-section">
                  <h3>Tracking</h3>
                  <p className="modal-tracking">{selectedOrder.trackingNumber}</p>
                </div>
              )}

              <div className="modal-total">
                <span>Total</span>
                <span>${(selectedOrder.total / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
