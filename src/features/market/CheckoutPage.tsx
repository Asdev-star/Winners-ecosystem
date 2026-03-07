// src/features/market/CheckoutPage.tsx
// Phase 4 — Winners Market: Checkout
// Commerce Hub V1.1 — Order creation and payment

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import "./CheckoutPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl?: string;
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
}

interface ShippingInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const [shipping, setShipping] = useState<ShippingInfo>({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "NG",
    phone: "",
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("card");

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

  function calculateSubtotal() {
    if (!cart?.items.length) return 0;
    return cart.items.reduce((sum, item) => {
      const itemPrice = item.variant?.price || item.product.price;
      return sum + itemPrice * item.quantity;
    }, 0);
  }

  function calculateShipping() {
    // Free shipping over $50, otherwise $5.99
    return calculateSubtotal() >= 5000 ? 0 : 599;
  }

  function calculateTax() {
    // 7.5% VAT
    return Math.round(calculateSubtotal() * 0.075);
  }

  function calculateTotal() {
    return calculateSubtotal() + calculateShipping() + calculateTax();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cart?.id) return;

    setProcessing(true);
    setError("");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          cartId: cart.id,
          vendorId: cart.items[0]?.product.id, // Would need proper vendor handling
          shippingName: shipping.name,
          shippingAddress: shipping.address,
          shippingCity: shipping.city,
          shippingState: shipping.state,
          shippingZip: shipping.zip,
          shippingCountry: shipping.country,
          shippingPhone: shipping.phone,
          paymentMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create order");
      }

      const data = await res.json();
      setOrderSuccess(data.order?.orderNumber || data.orderNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setProcessing(false);
    }
  }

  if (!user) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-login-prompt">
            <div className="prompt-icon">🔐</div>
            <h2>Sign in to checkout</h2>
            <p>Create an account or sign in to complete your purchase</p>
            <Link to="/login" className="prompt-btn">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-loading">
            <div className="checkout-spinner" />
            <p>Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-success">
            <div className="success-icon">✅</div>
            <h2>Order Placed Successfully!</h2>
            <p>Your order number is <strong>{orderSuccess}</strong></p>
            <p className="success-message">
              Thank you for your purchase. You'll receive a confirmation email shortly.
            </p>
            <div className="success-actions">
              <Link to="/market/orders" className="success-btn primary">
                View Order
              </Link>
              <Link to="/market" className="success-btn">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart?.items.length) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-empty">
            <div className="checkout-empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some products to your cart before checking out</p>
            <Link to="/market" className="checkout-browse-btn">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Context Bar */}
        <div className="ctx-bar">
          <span className="ctx-badge live">⬡ Core Engine</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge live">🛒 Winners Market</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge active">💳 Checkout</span>
        </div>

        <h1 className="checkout-title">Checkout</h1>

        {error && (
          <div className="checkout-error">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-grid">
            {/* Left Column - Form */}
            <div className="checkout-form-section">
              {/* Shipping Info */}
              <div className="form-card">
                <h2>Shipping Information</h2>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={shipping.name}
                    onChange={(e) =>
                      setShipping({ ...shipping, name: e.target.value })
                    }
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={shipping.address}
                    onChange={(e) =>
                      setShipping({ ...shipping, address: e.target.value })
                    }
                    required
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={shipping.city}
                      onChange={(e) =>
                        setShipping({ ...shipping, city: e.target.value })
                      }
                      required
                      placeholder="Lagos"
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={shipping.state}
                      onChange={(e) =>
                        setShipping({ ...shipping, state: e.target.value })
                      }
                      required
                      placeholder="Lagos"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      value={shipping.zip}
                      onChange={(e) =>
                        setShipping({ ...shipping, zip: e.target.value })
                      }
                      required
                      placeholder="100001"
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <select
                      value={shipping.country}
                      onChange={(e) =>
                        setShipping({ ...shipping, country: e.target.value })
                      }
                    >
                      <option value="NG">Nigeria</option>
                      <option value="GH">Ghana</option>
                      <option value="KE">Kenya</option>
                      <option value="ZA">South Africa</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={shipping.phone}
                    onChange={(e) =>
                      setShipping({ ...shipping, phone: e.target.value })
                    }
                    required
                    placeholder="+234 800 000 0000"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="form-card">
                <h2>Payment Method</h2>
                <div className="payment-options">
                  <label className={`payment-option ${paymentMethod === "card" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="payment-icon">💳</span>
                    <span className="payment-label">
                      <strong>Card</strong>
                      <small>Pay with Visa, Mastercard, etc.</small>
                    </span>
                  </label>
                  <label className={`payment-option ${paymentMethod === "bank" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === "bank"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="payment-icon">🏦</span>
                    <span className="payment-label">
                      <strong>Bank Transfer</strong>
                      <small>Pay directly from your bank</small>
                    </span>
                  </label>
                  <label className={`payment-option ${paymentMethod === "mobile" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mobile"
                      checked={paymentMethod === "mobile"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="payment-icon">📱</span>
                    <span className="payment-label">
                      <strong>Mobile Money</strong>
                      <small>M-Pesa, MTN MoMo, Airtel Money</small>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="checkout-summary">
              <div className="summary-card">
                <h3>Order Summary</h3>
                <div className="summary-items">
                  {cart.items.map((item) => (
                    <div key={item.id} className="summary-item">
                      <div className="summary-item-info">
                        <span className="summary-item-name">{item.product.name}</span>
                        {item.variant && (
                          <span className="summary-item-variant">
                            {item.variant.name}
                          </span>
                        )}
                        <span className="summary-item-qty">
                          ×{item.quantity}
                        </span>
                      </div>
                      <span className="summary-item-price">
                        $
                        {(
                          ((item.variant?.price || item.product.price) *
                            item.quantity) /
                          100
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="summary-divider" />
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${(calculateSubtotal() / 100).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>
                    {calculateShipping() === 0
                      ? "FREE"
                      : `$${(calculateShipping() / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Tax (VAT 7.5%)</span>
                  <span>${(calculateTax() / 100).toFixed(2)}</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-total">
                  <span>Total</span>
                  <span>${(calculateTotal() / 100).toFixed(2)}</span>
                </div>
                <button
                  type="submit"
                  className="checkout-submit-btn"
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Place Order"}
                </button>
                <Link to="/market/cart" className="back-to-cart">
                  ← Back to Cart
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
