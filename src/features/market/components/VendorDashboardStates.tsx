import type { CSSProperties } from "react";

type RetryStateProps = {
  title: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
};

const stateCardStyle: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  background: "var(--surface)",
  padding: "32px",
  textAlign: "center",
  color: "var(--text)",
};

export function MarketErrorState({ title, message, retryLabel, onRetry }: RetryStateProps) {
  return (
    <div style={stateCardStyle}>
      <div style={{ fontSize: "42px", marginBottom: "12px" }}>⚠</div>
      <h2 style={{ margin: "0 0 8px", fontSize: "20px" }}>{title}</h2>
      <p style={{ margin: "0 0 20px", color: "var(--text-dim)" }}>{message}</p>
      <button
        onClick={onRetry}
        style={{
          padding: "10px 16px",
          border: "none",
          borderRadius: "8px",
          background: "var(--gold)",
          color: "var(--bg)",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {retryLabel}
      </button>
    </div>
  );
}

export function NotAVendorState({ onRetry }: { onRetry: () => void }) {
  return (
    <MarketErrorState
      title="Vendor setup required"
      message="You’re signed in, but this account has not been provisioned as a vendor yet. Start vendor onboarding to unlock products, orders, and payouts. Code: NOT_SETUP"
      retryLabel="Retry"
      onRetry={onRetry}
    />
  );
}

export function NoProductsState({ onRetry }: { onRetry: () => void }) {
  return (
    <MarketErrorState
      title="No products yet"
      message="This vendor is active, but there are no products to show yet. Add your first product to start tracking sales and inventory."
      retryLabel="Refresh products"
      onRetry={onRetry}
    />
  );
}
