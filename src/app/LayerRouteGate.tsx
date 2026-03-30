import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";
import { useSuperAdminAccess } from "./useSuperAdminAccess";
import { useAuthStore } from "../features/auth/authStore";

type LayerAccessResponse = {
  layerId: string;
  layerName: string;
  status: string;
  allowed: boolean;
  visible: boolean;
  bypass: boolean;
  code: "layer_live" | "layer_not_live" | "cloud_upgrade_required" | "superadmin_preview";
  message: string;
  upgradePlan?: "PRO" | "ENTERPRISE";
  tenantPlan?: "FREE" | "PRO" | "ENTERPRISE";
};

type LayerRouteGateProps = {
  layerId: string;
  children: ReactNode;
};

export default function LayerRouteGate({ layerId, children }: LayerRouteGateProps) {
  const token = useAuthStore((state) => state.token);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const { hasAccess: hasSuperAdminAccess, isChecking } = useSuperAdminAccess();
  const [access, setAccess] = useState<LayerAccessResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      if (!token) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/registry/${layerId}/access`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = (await response.json().catch(() => null)) as LayerAccessResponse | null;
        if (!cancelled) {
          setAccess(payload);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!isRestoring) {
      void loadAccess();
    }

    return () => {
      cancelled = true;
    };
  }, [isRestoring, layerId, token]);

  if (isRestoring || isChecking || loading) {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{
          border: "1px solid rgba(201, 168, 76, 0.24)",
          background: "linear-gradient(180deg, rgba(201, 168, 76, 0.08), rgba(10, 15, 22, 0.92))",
          borderRadius: 20,
          padding: "28px 24px",
          color: "var(--text)",
        }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--gold)" }}>
            Sovereign Launch Gate
          </div>
          <div style={{ marginTop: 10, fontFamily: "'Syne', sans-serif", fontSize: 28 }}>Checking layer access…</div>
        </div>
      </div>
    );
  }

  if (access?.allowed) {
    return <>{children}</>;
  }

  const isPreviewMode = Boolean(hasSuperAdminAccess && access?.bypass);

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: "40px 24px 72px" }}>
      <div style={{
        border: "1px solid rgba(201, 168, 76, 0.28)",
        borderRadius: 24,
        padding: "32px 28px",
        background: "radial-gradient(circle at top left, rgba(201, 168, 76, 0.18), transparent 42%), linear-gradient(180deg, rgba(17, 24, 33, 0.96), rgba(8, 12, 18, 0.98))",
        boxShadow: "0 28px 80px rgba(0, 0, 0, 0.34)",
      }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--gold)" }}>
          {access?.layerName ?? layerId} Locked
        </div>
        <h1 style={{ margin: "10px 0 12px", fontFamily: "'Syne', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
          {access?.code === "cloud_upgrade_required" ? "Cloud is visible, but this workspace is not entitled yet." : "This layer has not been launched for users yet."}
        </h1>
        <p style={{ margin: 0, maxWidth: 720, color: "var(--text-dim)", fontSize: 16, lineHeight: 1.65 }}>
          {access?.message ?? "Only the admin panel can authorize this launch."}
        </p>

        {isPreviewMode ? (
          <div style={{
            marginTop: 18,
            display: "inline-flex",
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(201, 168, 76, 0.35)",
            background: "rgba(201, 168, 76, 0.12)",
            color: "var(--gold)",
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            Superadmin preview bypass active
          </div>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
          <Link
            to={access?.code === "cloud_upgrade_required" ? "/billing" : "/home"}
            style={{
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: 12,
              background: "var(--gold)",
              color: "#0b1118",
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            {access?.code === "cloud_upgrade_required" ? `Upgrade to ${access.upgradePlan ?? "PRO"}` : "Back to Home"}
          </Link>
          <Link
            to="/admin/platform"
            style={{
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: 12,
              border: "1px solid rgba(201, 168, 76, 0.28)",
              color: "var(--text)",
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            View Platform Launch Control
          </Link>
        </div>
      </div>
    </div>
  );
}
