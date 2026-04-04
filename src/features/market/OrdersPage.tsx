// src/features/market/OrdersPage.tsx
// Phase 4 — Winners Market: Order History
// Commerce Hub V1.1 — Order Management UI

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import EmptyState from "../../components/ui/EmptyState";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import ContextBar from "../../components/ui/ContextBar";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import AssistantPanel from "../../components/ui/AssistantPanel";
import "./OrdersPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string;
  quantity: number;
  price: number;
  variant?: string;
  canReview?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
  total: number;
  items: OrderItem[];
  createdAt: string;
  shippingAddress?: string;
  trackingNumber?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING: {
    label: "Pending",
    color: "var(--gold)",
    bg: "color-mix(in srgb, var(--gold) 12%, transparent)",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "var(--green)",
    bg: "color-mix(in srgb, var(--green) 12%, transparent)",
  },
  PROCESSING: {
    label: "Processing",
    color: "var(--ice)",
    bg: "color-mix(in srgb, var(--ice) 12%, transparent)",
  },
  SHIPPED: {
    label: "Shipped",
    color: "var(--purple)",
    bg: "color-mix(in srgb, var(--purple) 12%, transparent)",
  },
  DELIVERED: {
    label: "Delivered",
    color: "var(--green)",
    bg: "color-mix(in srgb, var(--green) 12%, transparent)",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "var(--red)",
    bg: "color-mix(in srgb, var(--red) 12%, transparent)",
  },
};

function normalizeOrder(raw: any): Order {
  const items = Array.isArray(raw?.items)
    ? raw.items.map((item: any) => ({
        id: String(item.id),
        productId: String(item.productId ?? item.product?.id ?? ""),
        productName: String(
          item.name ?? item.productName ?? item.product?.name ?? "Product",
        ),
        productSlug:
          typeof item.productSlug === "string"
            ? item.productSlug
            : typeof item.product?.slug === "string"
              ? item.product.slug
              : undefined,
        quantity: Number(item.quantity ?? 0),
        price: Number(item.price ?? 0),
        variant:
          typeof item.variant?.name === "string"
            ? item.variant.name
            : undefined,
        canReview: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(
          String(raw?.status ?? "").toUpperCase(),
        ),
      }))
    : [];

  const trackingNumber =
    typeof raw?.trackingNumber === "string"
      ? raw.trackingNumber
      : typeof raw?.tracking?.trackingNumber === "string"
        ? raw.tracking.trackingNumber
        : undefined;

  const shippingParts = [
    raw?.shippingAddress,
    raw?.shippingCity,
    raw?.shippingState,
    raw?.shippingZip,
    raw?.shippingCountry,
  ].filter(Boolean);

  return {
    id: String(raw?.id),
    orderNumber: String(raw?.orderNumber ?? raw?.id),
    status: String(raw?.status ?? "PENDING").toUpperCase() as Order["status"],
    total: Number(raw?.total ?? 0),
    items,
    createdAt: String(raw?.createdAt ?? new Date().toISOString()),
    shippingAddress:
      shippingParts.length > 0 ? shippingParts.join(", ") : undefined,
    trackingNumber,
  };
}

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
      const rawOrders = Array.isArray(data?.orders)
        ? data.orders
        : Array.isArray(data)
          ? data
          : [];
      setOrders(rawOrders.map(normalizeOrder));
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
          <ContextBar
            activeLayer="market"
            statusOverrides={{ market: "active", work: "live" }}
          />
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
        <ContextBar
          activeLayer="market"
          statusOverrides={{ market: "active", work: "live" }}
        />
        <div className="orders-header">
          <h1>Your Orders</h1>
          <AIInsightBanner page="market" assistant="atlas" />
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
            <SkeletonLoader variant="card" count={3} height="120px" />
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            message="When you make a purchase, your orders will appear here"
            assistant="atlas"
            ctaPath="/market"
            ctaLabel="Browse Marketplace"
            illustration="market"
          />
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const status =
                STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <span className="order-number">{order.orderNumber}</span>
                      <span className="order-date">
                        {formatDate(order.createdAt)}
                      </span>
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
                      ${order.total.toFixed(2)}
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
          <div
            className="order-modal-overlay"
            onClick={() => setSelectedOrder(null)}
          >
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
                      to={
                        item.productSlug
                          ? `/market/products/${item.productSlug}`
                          : `/market/products/${item.productId}`
                      }
                      className="modal-item-name"
                    >
                      {item.productName}
                    </Link>
                    {item.variant && (
                      <span className="modal-item-variant">{item.variant}</span>
                    )}
                    <span className="modal-item-qty">Qty: {item.quantity}</span>
                    <span className="modal-item-price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    {item.canReview && (item.productSlug || item.productId) && (
                      <Link
                        to={
                          item.productSlug
                            ? `/market/products/${item.productSlug}`
                            : `/market/products/${item.productId}`
                        }
                        className="order-view-btn"
                      >
                        Review Item
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {selectedOrder.shippingAddress && (
                <div className="modal-section">
                  <h3>Shipping Address</h3>
                  <p className="modal-address">
                    {selectedOrder.shippingAddress}
                  </p>
                </div>
              )}

              {selectedOrder.trackingNumber && (
                <div className="modal-section">
                  <h3>Tracking</h3>
                  <p className="modal-tracking">
                    {selectedOrder.trackingNumber}
                  </p>
                </div>
              )}

              <div className="modal-total">
                <span>Total</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <AssistantPanel assistant="atlas" page="orders" userId={user?.id} />
    </div>
  );
}
