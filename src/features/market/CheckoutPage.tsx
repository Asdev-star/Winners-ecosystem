import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";
import "./CheckoutPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";
const MARKET_SESSION_KEY = "winners_market_session_id";
const STRIPE_JS_URL = "https://js.stripe.com/v3/";
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => any;
  }
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    vendorId?: string;
    vendor?: {
      id: string;
      storeName?: string;
      name?: string;
    };
  };
  variant?: {
    id: string;
    name: string;
    price?: number;
  };
}

interface Cart {
  id: string;
  items: CartItem[];
}

interface ShippingInfo {
  fullName: string;
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface CheckoutVendorGroup {
  vendorId: string;
  vendorName: string;
  items: Array<{
    cartItemId: string;
    productId: string;
    title: string;
    price: number;
    quantity: number;
    variantId?: string;
  }>;
  subtotal: number;
}

interface PaymentIntentSetup {
  vendorId: string;
  vendorName: string;
  clientSecret: string;
  amount: number;
}

interface PaymentIntentResponse {
  paymentIntents: PaymentIntentSetup[];
  total: number;
  platformFeePct: number;
}

interface ConfirmCheckoutResponse {
  success: boolean;
  orders: Array<{ id: string; orderNumber: string }>;
}

const DEFAULT_SHIPPING: ShippingInfo = {
  fullName: "",
  addressLine: "",
  city: "",
  region: "",
  postalCode: "",
  country: "KE",
  phone: "",
};

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function ensureMarketSessionId() {
  const existing = window.localStorage.getItem(MARKET_SESSION_KEY);
  if (existing) return existing;
  const created =
    window.crypto?.randomUUID?.() ??
    `market-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(MARKET_SESSION_KEY, created);
  return created;
}

function buildVendorGroups(cart: Cart | null): CheckoutVendorGroup[] {
  if (!cart?.items.length) return [];

  const groups = new Map<string, CheckoutVendorGroup>();

  for (const item of cart.items) {
    const vendorId = item.product.vendorId ?? item.product.vendor?.id;
    if (!vendorId) continue;

    const vendorName =
      item.product.vendor?.storeName ?? item.product.vendor?.name ?? "Direct Sale";
    const unitPrice = item.variant?.price ?? item.price ?? 0;
    const current = groups.get(vendorId) ?? {
      vendorId,
      vendorName,
      items: [],
      subtotal: 0,
    };

    current.items.push({
      cartItemId: item.id,
      productId: item.productId,
      title: item.product.name,
      price: unitPrice,
      quantity: item.quantity,
      variantId: item.variant?.id,
    });
    current.subtotal += unitPrice * item.quantity;

    groups.set(vendorId, current);
  }

  return Array.from(groups.values());
}

async function loadStripeJs() {
  if (window.Stripe) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${STRIPE_JS_URL}"]`,
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Stripe.js")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = STRIPE_JS_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Stripe.js"));
    document.head.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { user, token } = useAuthStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Prepare vendor payment intents to begin the Phase 4A checkout flow.",
  );
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);
  const [shipping, setShipping] = useState<ShippingInfo>(DEFAULT_SHIPPING);
  const [paymentSetups, setPaymentSetups] = useState<PaymentIntentSetup[]>([]);
  const [confirmedPaymentIntentIds, setConfirmedPaymentIntentIds] = useState<string[]>([]);
  const [activePaymentIndex, setActivePaymentIndex] = useState<number | null>(null);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [platformFeePct, setPlatformFeePct] = useState<number | null>(null);

  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const paymentElementRef = useRef<any>(null);

  const vendorGroups = useMemo(() => buildVendorGroups(cart), [cart]);
  const subtotal = useMemo(
    () => vendorGroups.reduce((sum, group) => sum + group.subtotal, 0),
    [vendorGroups],
  );
  const itemCount = useMemo(
    () =>
      vendorGroups.reduce(
        (sum, group) => sum + group.items.reduce((count, item) => count + item.quantity, 0),
        0,
      ),
    [vendorGroups],
  );
  const currentPayment = activePaymentIndex === null ? null : paymentSetups[activePaymentIndex] ?? null;
  const shippingComplete = useMemo(
    () => Object.values(shipping).every((value) => value.trim().length > 0),
    [shipping],
  );

  function buildMarketHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-session-id": ensureMarketSessionId(),
    };

    if (user?.tenantId) headers["x-tenant-id"] = user.tenantId;
    if (token) headers.Authorization = `Bearer ${token}`;

    return headers;
  }

  function clearMountedPaymentElement() {
    if (paymentElementRef.current?.destroy) {
      paymentElementRef.current.destroy();
    } else if (paymentElementRef.current?.unmount) {
      paymentElementRef.current.unmount();
    }

    paymentElementRef.current = null;
    elementsRef.current = null;
    setPaymentElementReady(false);
  }

  useEffect(() => {
    void fetchCart();
  }, [token]);

  useEffect(() => {
    if (!currentPayment?.clientSecret) {
      clearMountedPaymentElement();
      return;
    }

    let cancelled = false;

    async function mountPaymentElement() {
      try {
        if (!STRIPE_PUBLISHABLE_KEY) {
          throw new Error("VITE_STRIPE_PUBLISHABLE_KEY is not configured.");
        }

        setPaymentElementReady(false);
        await loadStripeJs();
        if (cancelled) return;

        const stripe = window.Stripe?.(STRIPE_PUBLISHABLE_KEY);
        if (!stripe) {
          throw new Error("Stripe.js is unavailable.");
        }

        stripeRef.current = stripe;
        clearMountedPaymentElement();

        const elements = stripe.elements({
          clientSecret: currentPayment.clientSecret,
          appearance: {
            theme: "night",
            variables: {
              colorPrimary: "#C9A84C",
              colorBackground: "#111D2E",
              colorText: "#E8EEF5",
              colorDanger: "#E05A4E",
              borderRadius: "6px",
            },
          },
        });

        const paymentElement = elements.create("payment", {
          layout: { type: "tabs" },
        });

        paymentElement.mount("#market-payment-element");
        paymentElement.on("ready", () => {
          if (!cancelled) {
            setPaymentElementReady(true);
          }
        });
        paymentElement.on("change", (event: { error?: { message?: string } }) => {
          if (!cancelled && event.error?.message) {
            setError(event.error.message);
          }
        });

        elementsRef.current = elements;
        paymentElementRef.current = paymentElement;
      } catch (mountError) {
        if (!cancelled) {
          setError(
            mountError instanceof Error
              ? mountError.message
              : "Failed to prepare secure card entry.",
          );
        }
      }
    }

    void mountPaymentElement();

    return () => {
      cancelled = true;
      clearMountedPaymentElement();
    };
  }, [currentPayment?.clientSecret]);

  async function fetchCart() {
    try {
      const res = await fetch(`${API_BASE}/cart`, {
        headers: buildMarketHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load cart");
      const data = await res.json();
      setCart(data.cart || data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  async function preparePayments() {
    if (!cart?.items.length || !vendorGroups.length) {
      setError("Your cart is empty or missing vendor routing.");
      return;
    }

    if (!shippingComplete) {
      setError("Complete the delivery address before preparing payment intents.");
      return;
    }

    setProcessing(true);
    setError("");
    setStatusMessage(`Preparing ${vendorGroups.length} vendor payment intent(s)...`);

    try {
      const res = await fetch(`${API_BASE}/checkout/create-payment-intents`, {
        method: "POST",
        headers: buildMarketHeaders(),
        body: JSON.stringify({
          items: vendorGroups.flatMap((group) =>
            group.items.map((item) => ({
              productId: item.productId,
              vendorId: group.vendorId,
              vendorName: group.vendorName,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              variantId: item.variantId,
              type: "physical",
            })),
          ),
          shippingAddress: shipping,
        }),
      });

      const data = (await res.json()) as PaymentIntentResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to prepare payment intents.");
      }

      setPaymentSetups(data.paymentIntents);
      setConfirmedPaymentIntentIds([]);
      setActivePaymentIndex(0);
      setPlatformFeePct(data.platformFeePct);
      setStatusMessage(
        `Vendor 1 of ${data.paymentIntents.length} is ready. Enter payment details for ${data.paymentIntents[0]?.vendorName}.`,
      );
    } catch (prepareError) {
      setError(
        prepareError instanceof Error
          ? prepareError.message
          : "Failed to prepare vendor payments.",
      );
    } finally {
      setProcessing(false);
    }
  }

  async function confirmCurrentPayment() {
    if (!currentPayment || !stripeRef.current || !elementsRef.current) {
      setError("Payment entry is not ready yet.");
      return;
    }

    setProcessing(true);
    setError("");
    setStatusMessage(
      `Confirming ${currentPayment.vendorName} payment ${activePaymentIndex! + 1} of ${paymentSetups.length}...`,
    );

    try {
      const result = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/market/orders`,
        },
      });

      if (result.error) {
        throw new Error(result.error.message || "Payment confirmation failed.");
      }

      const paymentIntentId = result.paymentIntent?.id ?? currentPayment.clientSecret.split("_secret_")[0];
      const nextConfirmed = [...confirmedPaymentIntentIds, paymentIntentId];
      setConfirmedPaymentIntentIds(nextConfirmed);

      if (nextConfirmed.length < paymentSetups.length) {
        const nextIndex = nextConfirmed.length;
        setActivePaymentIndex(nextIndex);
        setStatusMessage(
          `Payment confirmed for ${currentPayment.vendorName}. Continue with vendor ${nextIndex + 1} of ${paymentSetups.length}.`,
        );
        return;
      }

      const confirmRes = await fetch(`${API_BASE}/checkout/confirm`, {
        method: "POST",
        headers: buildMarketHeaders(),
        body: JSON.stringify({
          paymentIntentIds: nextConfirmed,
          shippingAddress: shipping,
          vendorGroups: vendorGroups.map((group) => ({
            vendorId: group.vendorId,
            items: group.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              title: item.title,
            })),
          })),
        }),
      });

      const confirmation = (await confirmRes.json()) as ConfirmCheckoutResponse & { error?: string };
      if (!confirmRes.ok || !confirmation.success) {
        throw new Error(confirmation.error || "Failed to confirm the completed checkout.");
      }

      clearMountedPaymentElement();
      setOrderNumbers(confirmation.orders.map((order) => order.orderNumber));
      setPaymentSetups([]);
      setConfirmedPaymentIntentIds([]);
      setActivePaymentIndex(null);
      setStatusMessage("All vendor payments succeeded and the orders were confirmed.");
      setCart({ id: cart?.id ?? "", items: [] });
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Failed to confirm the current vendor payment.",
      );
    } finally {
      setProcessing(false);
    }
  }

  function resetPaymentFlow() {
    clearMountedPaymentElement();
    setPaymentSetups([]);
    setConfirmedPaymentIntentIds([]);
    setActivePaymentIndex(null);
    setPlatformFeePct(null);
    setStatusMessage("Payment setup cleared. You can prepare the vendor intents again.");
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

  if (orderNumbers.length > 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-success">
            <div className="success-icon">✅</div>
            <h2>Orders Confirmed</h2>
            <p>
              Vendor order numbers: <strong>{orderNumbers.join(", ")}</strong>
            </p>
            <p className="success-message">
              Every vendor payment intent succeeded and the multi-vendor order split is complete.
            </p>
            <div className="success-actions">
              <Link to="/market/orders" className="success-btn primary">
                View Orders
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
        <div className="ctx-bar">
          <span className="ctx-badge live">□ Core Engine</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge building">🛒 Winners Market</span>
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

        <div className="checkout-status-card">
          <div>
            <div className="checkout-status-label">Phase 4A Flow</div>
            <p className="checkout-status-copy">{statusMessage}</p>
          </div>
          {platformFeePct !== null ? (
            <div className="checkout-status-metric">
              Platform fee routing: {(platformFeePct * 100).toFixed(0)}%
            </div>
          ) : null}
        </div>

        <div className="checkout-grid">
          <div className="checkout-form-section">
            <div className="form-card">
              <h2>Delivery Information</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={shipping.fullName}
                  onChange={(e) => setShipping((current) => ({ ...current, fullName: e.target.value }))}
                  required
                  placeholder="Amina Njeri"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={shipping.addressLine}
                  onChange={(e) => setShipping((current) => ({ ...current, addressLine: e.target.value }))}
                  required
                  placeholder="Westlands, Waiyaki Way"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={shipping.city}
                    onChange={(e) => setShipping((current) => ({ ...current, city: e.target.value }))}
                    required
                    placeholder="Nairobi"
                  />
                </div>
                <div className="form-group">
                  <label>Region</label>
                  <input
                    type="text"
                    value={shipping.region}
                    onChange={(e) => setShipping((current) => ({ ...current, region: e.target.value }))}
                    required
                    placeholder="Nairobi County"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    value={shipping.postalCode}
                    onChange={(e) => setShipping((current) => ({ ...current, postalCode: e.target.value }))}
                    required
                    placeholder="00100"
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <select
                    value={shipping.country}
                    onChange={(e) => setShipping((current) => ({ ...current, country: e.target.value }))}
                  >
                    <option value="KE">Kenya</option>
                    <option value="NG">Nigeria</option>
                    <option value="GH">Ghana</option>
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
                  onChange={(e) => setShipping((current) => ({ ...current, phone: e.target.value }))}
                  required
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

            <div className="form-card">
              <h2>Vendor Split</h2>
              <div className="vendor-split-note">
                {itemCount} item(s) across {vendorGroups.length} vendor{vendorGroups.length === 1 ? "" : "s"}.
                Each vendor is confirmed independently through Stripe.
              </div>
              <div className="vendor-split-list">
                {vendorGroups.map((group) => (
                  <div key={group.vendorId} className="vendor-split-row">
                    <div>
                      <div className="vendor-split-title">{group.vendorName}</div>
                      <div className="vendor-split-meta">
                        {group.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                      </div>
                    </div>
                    <div className="vendor-split-amount">{formatMoney(group.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-card">
              <h2>Secure Payment</h2>
              {currentPayment ? (
                <>
                  <div className="payment-flow-pill">
                    Vendor {activePaymentIndex! + 1} of {paymentSetups.length}: {currentPayment.vendorName}
                  </div>
                  <div id="market-payment-element" className="stripe-payment-element" />
                  <p className="payment-help-text">
                    Confirm each vendor one by one. The order is finalized only after every payment intent succeeds.
                  </p>
                </>
              ) : (
                <p className="payment-help-text">
                  Prepare the vendor payment intents first, then enter secure card details for each vendor in sequence.
                </p>
              )}
            </div>
          </div>

          <div className="checkout-summary">
            <div className="summary-card">
              <h3>Order Summary</h3>
              <div className="summary-items">
                {vendorGroups.flatMap((group) =>
                  group.items.map((item) => (
                    <div key={item.cartItemId} className="summary-item">
                      <div className="summary-item-info">
                        <span className="summary-item-name">{item.title}</span>
                        <span className="summary-item-variant">{group.vendorName}</span>
                        <span className="summary-item-qty">×{item.quantity}</span>
                      </div>
                      <span className="summary-item-price">
                        {formatMoney(item.price * item.quantity)}
                      </span>
                    </div>
                  )),
                )}
              </div>

              <div className="summary-divider" />

              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Buyer total charged</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Confirmed vendors</span>
                <span>
                  {confirmedPaymentIntentIds.length} / {paymentSetups.length || vendorGroups.length}
                </span>
              </div>

              <div className="summary-divider" />

              <div className="summary-total">
                <span>Total</span>
                <span>{formatMoney(subtotal)}</span>
              </div>

              {currentPayment ? (
                <button
                  type="button"
                  className="checkout-submit-btn"
                  disabled={processing || !paymentElementReady}
                  onClick={() => void confirmCurrentPayment()}
                >
                  {processing
                    ? "Confirming..."
                    : `Pay ${currentPayment.vendorName} (${activePaymentIndex! + 1}/${paymentSetups.length})`}
                </button>
              ) : (
                <button
                  type="button"
                  className="checkout-submit-btn"
                  disabled={processing}
                  onClick={() => void preparePayments()}
                >
                  {processing ? "Preparing..." : "Prepare Vendor Payments"}
                </button>
              )}

              {paymentSetups.length > 0 ? (
                <button
                  type="button"
                  className="checkout-secondary-btn"
                  disabled={processing}
                  onClick={resetPaymentFlow}
                >
                  Reset Payment Flow
                </button>
              ) : null}

              <Link to="/market/cart" className="back-to-cart">
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AssistantPanel assistant="atlas" page="checkout" userId={user.id} />
    </div>
  );
}
