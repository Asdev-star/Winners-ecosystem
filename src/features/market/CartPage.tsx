// src/features/market/CartPage.tsx
// Phase 4 — Winners Market: Shopping Cart
// Commerce Hub V1.1 — Cart Management UI

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import { useCartStore } from "./cartStore";
import EmptyState from "../../components/ui/EmptyState";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import AssistantPanel from "../../components/ui/AssistantPanel";
import "./CartPage.css";

export default function CartPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { 
    cart, 
    isLoading: loading, 
    error, 
    fetchCart, 
    updateQuantity, 
    removeItem, 
    clearCart,
    pendingActions,
    syncPendingActions
  } = useCartStore();
  
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, [token, fetchCart]);

  useEffect(() => {
    if (navigator.onLine && pendingActions.length > 0) {
      syncPendingActions();
    }
  }, [pendingActions.length, syncPendingActions]);

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

  const isUpdating = (itemId: string) => updating === itemId;

  async function onUpdateQuantity(itemId: string, quantity: number) {
    setUpdating(itemId);
    await updateQuantity(itemId, quantity);
    setUpdating(null);
  }

  async function onRemoveItem(itemId: string) {
    setUpdating(itemId);
    await removeItem(itemId);
    setUpdating(null);
  }

  if (loading && !cart) {
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
          <span className="ctx-badge building">🛒 Winners Market</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge active">🛍️ Cart</span>
        </div>

        <div className="cart-header">
          <h1>Shopping Cart</h1>
          <AIInsightBanner page="market" assistant="atlas" />
          {cart?.items.length ? (
            <button className="cart-clear-btn" onClick={clearCart}>
              Clear Cart
            </button>
          ) : null}
        </div>

        {error && (
          <div className="cart-error">
            {error}
            <button onClick={() => useCartStore.setState({ error: null })}>×</button>
          </div>
        )}

        {pendingActions.length > 0 && (
          <div className="cart-sync-notice">
            Offline: {pendingActions.length} changes queued for sync.
          </div>
        )}

        {!cart?.items.length ? (
          <EmptyState
            title="Your cart is empty"
            message="Discover amazing products from African creators and businesses"
            assistant="atlas"
            ctaPath="/market"
            ctaLabel="Browse Marketplace"
            illustration="market"
          />
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
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={isUpdating(item.id) || item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={
                        isUpdating(item.id) ||
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
                    onClick={() => onRemoveItem(item.id)}
                    disabled={isUpdating(item.id)}
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
      <AssistantPanel assistant="atlas" page="cart" userId={user?.id} />
    </div>
  );
}
