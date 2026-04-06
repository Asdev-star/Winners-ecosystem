import type { CSSProperties } from "react";

type RetryStateProps = {
  title: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
};

type VendorActionStateProps = RetryStateProps & {
  primaryLabel?: string;
  onPrimary?: () => void;
};

type VendorOnboardingProps = {
  status: "not_started" | "pending" | "complete" | "restricted";
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingUrl?: string | null;
  onContinue: () => void;
  onRefresh: () => void;
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

export function NotAVendorState({
  onRetry,
  onPrimary,
  primaryLabel = "Start vendor onboarding",
}: VendorActionStateProps) {
  return (
    <div style={stateCardStyle}>
      <div style={{ fontSize: "42px", marginBottom: "12px" }}>🛒</div>
      <h2 style={{ margin: "0 0 8px", fontSize: "20px" }}>Vendor setup required</h2>
      <p style={{ margin: "0 0 20px", color: "var(--text-dim)" }}>
        You’re signed in, but this account has not been provisioned as a vendor yet. Start vendor onboarding to unlock products, orders, and payouts. Code: NOT_SETUP
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
        {onPrimary && (
          <button
            onClick={onPrimary}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: "8px",
              background: "var(--green)",
              color: "var(--bg)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {primaryLabel}
          </button>
        )}
        <button
          onClick={onRetry}
          style={{
            padding: "10px 16px",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            background: "transparent",
            color: "var(--text)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    </div>
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

export function VendorOnboardingState({
  status,
  chargesEnabled,
  payoutsEnabled,
  onboardingUrl,
  onContinue,
  onRefresh,
}: VendorOnboardingProps) {
  const complete = status === "complete" && chargesEnabled && payoutsEnabled;
  const title = complete ? "Stripe Connect is ready" : "Complete vendor onboarding";
  const message = complete
    ? "Your vendor account is connected and payouts are enabled."
    : status === "not_started"
      ? "Start Stripe Connect onboarding to activate vendor payouts and approvals."
      : "Finish Stripe Connect setup so charges and payouts can be enabled.";
  const actionLabel = onboardingUrl ? "Continue onboarding" : "Start onboarding";

  return (
    <div style={stateCardStyle}>
      <div style={{ fontSize: "42px", marginBottom: "12px" }}>⚡</div>
      <h2 style={{ margin: "0 0 8px", fontSize: "20px" }}>{title}</h2>
      <p style={{ margin: "0 0 12px", color: "var(--text-dim)" }}>{message}</p>
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", marginBottom: "18px", fontSize: "13px", color: "var(--text-dim)" }}>
        <span>Charges: {chargesEnabled ? "enabled" : "pending"}</span>
        <span>Payouts: {payoutsEnabled ? "enabled" : "pending"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
        {!complete && (
          <button
            onClick={onContinue}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: "8px",
              background: "var(--green)",
              color: "var(--bg)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {actionLabel}
          </button>
        )}
        <button
          onClick={onRefresh}
          style={{
            padding: "10px 16px",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            background: "transparent",
            color: "var(--text)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Refresh status
        </button>
      </div>
    </div>
  );
}
