// src/features/market/CartPage.tsx
// Phase 4 — Winners Market: Shopping Cart
// Commerce Hub V1.1 — Cart Management UI

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import "./CartPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stockQuantity: number;
    isDigital: boolean;
  };
  variant?: {
    id: string;
    name: string;
    price: number;
  };
}

interface Cart {
  id: string;
  items: CartItem[];
  total: number;
}

export default function CartPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCart();
  }, [token]);

  async function fetchCart() {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/cart`, { headers });
      if (!res.ok) throw new Error("Failed to load cart");
      const data = await res.json();
      setCart(data.cart || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return;
    setUpdating(itemId);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      const data = await res.json();
      setCart(data.cart || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(itemId: string) {
    setUpdating(itemId);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to remove item");
      const data = await res.json();
      setCart(data.cart || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setUpdating(null);
    }
  }

  async function clearCart() {
    if (!confirm("Are you sure you want to clear your cart?")) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/cart`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to clear cart");
      setCart({ id: "", items: [], total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear");
    } finally {
      setLoading(false);
    }
  }

  function calculateTotal() {
    if (!cart?.items.length) return 0;
    return cart.items.reduce((sum, item) => {
      const itemPrice = item.variant?.price || item.product.price;
      return sum + itemPrice * item.quantity;
    }, 0);
  }

  function handleCheckout() {
    navigate("/market/checkout");
  }

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-loading">
            <div className="cart-spinner" />
            <p>Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Context Bar */}
        <div className="ctx-bar">
          <span className="ctx-badge live">⬡ Core Engine</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge live">🛒 Winners Market</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge active">🛍️ Cart</span>
        </div>

        <div className="cart-header">
          <h1>Shopping Cart</h1>
          {cart?.items.length ? (
            <button className="cart-clear-btn" onClick={clearCart}>
              Clear Cart
            </button>
          ) : null}
        </div>

        {error && (
          <div className="cart-error">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {!cart?.items.length ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Discover amazing products from African creators and businesses</p>
            <Link to="/market" className="cart-browse-btn">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    <div className="cart-item-placeholder">📦</div>
                  </div>
                  <div className="cart-item-details">
                    <Link
                      to={`/market/products/${item.product.slug}`}
                      className="cart-item-name"
                    >
                      {item.product.name}
                    </Link>
                    {item.variant && (
                      <span className="cart-item-variant">
                        {item.variant.name}
                      </span>
                    )}
                    <span className="cart-item-price">
                      ${((item.variant?.price || item.product.price) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="cart-item-quantity">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={updating === item.id || item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={
                        updating === item.id ||
                        item.quantity >= item.product.stockQuantity
                      }
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-item-total">
                    $
                    {(
                      ((item.variant?.price || item.product.price) *
                        item.quantity) /
                      100
                    ).toFixed(2)}
                  </div>
                  <button
                    className="cart-item-remove"
                    onClick={() => removeItem(item.id)}
                    disabled={updating === item.id}
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal ({cart.items.length} items)</span>
                <span>${(calculateTotal() / 100).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="summary-calculated">Calculated at checkout</span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span className="summary-calculated">Calculated at checkout</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-total">
                <span>Total</span>
                <span>${(calculateTotal() / 100).toFixed(2)}</span>
              </div>
              <button
                className="cart-checkout-btn"
                onClick={handleCheckout}
                disabled={!user}
              >
                {user ? "Proceed to Checkout" : "Sign in to Checkout"}
              </button>
              {!user && (
                <p className="cart-login-hint">
                  <Link to="/login">Sign in</Link> to save your cart
                </p>
              )}
              <Link to="/market" className="cart-continue-btn">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
