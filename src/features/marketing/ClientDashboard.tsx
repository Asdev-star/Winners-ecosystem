import React, { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";
import { Link } from "react-router-dom";
import styles from "./ClientDashboard.module.css";

interface MarketingOrder {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  brief: string;
  amount: number;
  createdAt: string;
  service: {
    id: string;
    title: string;
    vendor: {
      id: string;
      name: string;
      logoUrl?: string;
    };
  };
}

const ClientDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<MarketingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "all">(
    "active",
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/v1/marketing/orders", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "#ffa500";
      case "IN_PROGRESS":
        return "#007bff";
      case "COMPLETED":
        return "#28a745";
      case "CANCELLED":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getStatusText = (status: string) => {
    return status
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const filteredOrders = orders.filter((order) => {
    switch (activeTab) {
      case "active":
        return ["PENDING", "IN_PROGRESS"].includes(order.status);
      case "completed":
        return order.status === "COMPLETED";
      default:
        return true;
    }
  });

  const stats = {
    total: orders.length,
    active: orders.filter((o) => ["PENDING", "IN_PROGRESS"].includes(o.status))
      .length,
    completed: orders.filter((o) => o.status === "COMPLETED").length,
    totalSpent: orders
      .filter((o) => o.status === "COMPLETED")
      .reduce((sum, o) => sum + o.amount, 0),
  };

  if (loading) {
    return (
      <div className={styles.clientDashboard}>
        <div className={styles.loading}>Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className={styles.clientDashboard}>
      <div className={styles.dashboardHeader}>
        <h1>📊 Client Dashboard</h1>
        <p>Track your marketing projects and manage orders</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.total}</div>
          <div className={styles.statLabel}>Total Orders</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.active}</div>
          <div className={styles.statLabel}>Active Projects</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.completed}</div>
          <div className={styles.statLabel}>Completed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>${stats.totalSpent}</div>
          <div className={styles.statLabel}>Total Spent</div>
        </div>
      </div>

      <div className={styles.dashboardContent}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "active" ? styles.active : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active Orders ({stats.active})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "completed" ? styles.active : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            Completed ({stats.completed})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Orders ({stats.total})
          </button>
        </div>

        <div className={styles.ordersSection}>
          {filteredOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No orders found</h3>
              <p>
                {activeTab === "active"
                  ? "You don't have any active orders. Start by browsing marketing services."
                  : activeTab === "completed"
                    ? "You haven't completed any orders yet."
                    : "You haven't placed any orders yet."}
              </p>
              <Link to="/marketing" className={styles.btnPrimary}>
                Browse Services
              </Link>
            </div>
          ) : (
            <div className={styles.ordersGrid}>
              {filteredOrders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.serviceInfo}>
                      <h4>{order.service.title}</h4>
                      <div className={styles.vendorInfo}>
                        <img
                          src={
                            order.service.vendor.logoUrl ||
                            "/default-avatar.png"
                          }
                          alt={order.service.vendor.name}
                          className={styles.vendorAvatar}
                        />
                        <span>{order.service.vendor.name}</span>
                      </div>
                    </div>
                    <div className={styles.orderStatus}>
                      <span
                        className={styles.statusBadge}
                        style={{
                          backgroundColor: getStatusColor(order.status),
                        }}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.orderDetails}>
                    <div className={styles.detailRow}>
                      <span className="label">Order Date:</span>
                      <span className="value">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Amount:</span>
                      <span className="value">${order.amount}</span>
                    </div>
                  </div>

                  <div className="order-brief">
                    <h5>Project Brief:</h5>
                    <p>{order.brief}</p>
                  </div>

                  <div className="order-actions">
                    <Link
                      to={`/marketing/orders/${order.id}`}
                      className="btn-outline"
                    >
                      View Details
                    </Link>
                    {order.status === "PENDING" && (
                      <button className="btn-danger">Cancel Order</button>
                    )}
                    {order.status === "COMPLETED" && (
                      <button className="btn-primary">Leave Review</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ClientDashboard;
