// src/features/billing/BillingPage.tsx
// Phase 1 — Core Engine · Billing & Subscription Management
// Ecosystem design: CSS variables, card pattern, context bar, no Tailwind

import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL ?? "";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const PLANS = [
  {
    id:       "free",
    name:     "Starter",
    price:    0,
    period:   "forever",
    color:    "var(--text-dim)",
    features: [
      "1 workspace",
      "3 team members",
      "Community access",
      "Basic analytics",
      "1,000 API calls/mo",
    ],
  },
  {
    id:       "pro",
    name:     "Pro",
    price:    49,
    period:   "per month",
    color:    "var(--gold)",
    popular:  true,
    features: [
      "5 workspaces",
      "25 team members",
      "All platform layers",
      "Advanced analytics + AI",
      "50,000 API calls/mo",
      "Priority support",
      "Academy access",
      "Market vendor access",
    ],
  },
  {
    id:       "enterprise",
    name:     "Enterprise",
    price:    199,
    period:   "per month",
    color:    "var(--purple)",
    features: [
      "Unlimited workspaces",
      "Unlimited members",
      "All platform layers",
      "Custom AI agents",
      "Unlimited API calls",
      "Dedicated support",
      "SLA guarantee",
      "White-label option",
      "SSO + SAML",
    ],
  },
];

export default function BillingPage() {
  const [currentPlan, setCurrentPlan]   = useState("free");
  const [usage, setUsage]               = useState<any>(null);
  const [invoices, setInvoices]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [upgrading, setUpgrading]       = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API}/billing/status`, { headers: authHeaders() });
        const data = await res.json();
        setCurrentPlan(data.plan ?? "free");
        setUsage(data.usage ?? null);
        setInvoices(data.invoices ?? []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;
    setUpgrading(planId);
    try {
      const res  = await fetch(`${API}/billing/checkout`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Failed to start checkout. Please try again.");
    }
    setUpgrading(null);
  };

  const openPortal = async () => {
    try {
      const res  = await fetch(`${API}/billing/portal`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {}
  };

  const platformLayers = [
    { name: "Core", status: "live" },
    { name: "Community", status: "live" },
    { name: "Academy", status: "soon" },
    { name: "Market", status: "soon" },
    { name: "Intelligence", status: "planned" },
    { name: "Work", status: "planned" },
  ];

  return (
    <div style={s.page}>
      {/* Ecosystem context bar */}
      <div style={s.contextBar}>
        {platformLayers.map((p) => (
          <div key={p.name} style={s.contextItem}>
            <div style={{
              ...s.contextDot,
              background: p.status === "live" ? "var(--green)" : p.status === "soon" ? "var(--gold)" : "var(--border)",
            }} />
            <span style={{ color: p.name === "Core" ? "var(--gold)" : "var(--text-dim)" }}>{p.name}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ ...s.contextDot, background: "var(--green)", animation: "pulse 2s infinite" }} />
          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", color: "var(--green)", letterSpacing: "1px" }}>
            CORE ENGINE LIVE
          </span>
        </div>
      </div>

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.pageLabel}>Core Engine · Billing</div>
          <h1 style={s.pageTitle}>Subscription & Billing</h1>
          <p style={s.pageDesc}>Manage your plan, usage, and payment history.</p>
        </div>
        {currentPlan !== "free" && (
          <button style={s.portalBtn} onClick={openPortal}>Manage Billing →</button>
        )}
      </div>

      {/* Current plan banner */}
      <div style={s.currentBanner}>
        <div style={{ ...s.bannerBorder, background: "linear-gradient(90deg, var(--gold), var(--ice))" }} />
        <div style={s.bannerInner}>
          <div>
            <div style={s.bannerLabel}>Current Plan</div>
            <div style={s.bannerPlan}>
              {PLANS.find(p => p.id === currentPlan)?.name ?? "Starter"}
            </div>
          </div>
          <div style={s.bannerStats}>
            <div style={s.statBox}>
              <div style={{ ...s.statVal, color: "var(--green)" }}>{usage?.apiCalls?.toLocaleString() ?? "—"}</div>
              <div style={s.statLabel}>API Calls This Month</div>
            </div>
            <div style={s.statBox}>
              <div style={{ ...s.statVal, color: "var(--ice)" }}>{usage?.members ?? "—"}</div>
              <div style={s.statLabel}>Team Members</div>
            </div>
            <div style={s.statBox}>
              <div style={{ ...s.statVal, color: "var(--gold)" }}>{usage?.workspaces ?? "—"}</div>
              <div style={s.statLabel}>Workspaces</div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div style={s.sectionHeader}>
        <div style={s.sectionLabel}>Available Plans</div>
        <div style={s.sectionLine} />
      </div>

      <div style={s.plansGrid}>
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div key={plan.id} style={{
              ...s.planCard,
              ...(plan.popular ? s.planCardPopular : {}),
              ...(isCurrent ? s.planCardCurrent : {}),
            }}>
              <div style={{ ...s.planBorder, background: isCurrent
                ? "linear-gradient(90deg, var(--green), var(--ice))"
                : plan.popular
                ? "linear-gradient(90deg, var(--gold), var(--ice))"
                : "var(--border)" }} />

              {plan.popular && !isCurrent && (
                <div style={s.popularBadge}>MOST POPULAR</div>
              )}
              {isCurrent && (
                <div style={{ ...s.popularBadge, background: "rgba(45,212,160,0.15)", borderColor: "rgba(45,212,160,0.3)", color: "var(--green)" }}>
                  CURRENT PLAN
                </div>
              )}

              <div style={s.planHead}>
                <div style={{ ...s.planName, color: plan.color }}>{plan.name}</div>
                <div style={s.planPrice}>
                  <span style={s.planPriceNum}>${plan.price}</span>
                  <span style={s.planPeriod}>/{plan.period}</span>
                </div>
              </div>

              <div style={s.planFeatures}>
                {plan.features.map((f) => (
                  <div key={f} style={s.featureRow}>
                    <span style={{ color: "var(--green)" }}>✓</span>
                    <span style={s.featureText}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                style={{
                  ...s.planBtn,
                  ...(isCurrent ? s.planBtnCurrent : plan.popular ? s.planBtnPrimary : {}),
                }}
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || upgrading !== null}
              >
                {upgrading === plan.id ? "Redirecting..." :
                 isCurrent       ? "Current Plan" :
                 plan.price === 0 ? "Downgrade" :
                 currentPlan === "free" ? "Upgrade" : "Switch Plan"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice history */}
      <div style={s.sectionHeader}>
        <div style={s.sectionLabel}>Invoice History</div>
        <div style={s.sectionLine} />
      </div>

      <div style={s.invoiceCard}>
        <div style={s.invoiceBorder} />
        {loading ? (
          <div style={s.loadWrap}>
            <div style={s.spinner} />
          </div>
        ) : invoices.length === 0 ? (
          <div style={s.emptyInvoice}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>🧾</div>
            <div style={{ color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: "11px" }}>
              No invoices yet
            </div>
          </div>
        ) : (
          <table style={s.invoiceTable}>
            <thead>
              <tr>
                {["Date", "Description", "Amount", "Status", ""].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any, i: number) => (
                <tr key={i} style={i % 2 === 0 ? {} : { background: "var(--surface2)" }}>
                  <td style={s.td}>
                    {new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td style={s.td}>{inv.description}</td>
                  <td style={{ ...s.td, color: "var(--gold)", fontWeight: 600 }}>
                    ${(inv.amount / 100).toFixed(2)}
                  </td>
                  <td style={s.td}>
                    <span style={{
                      ...s.statusBadge,
                      background: inv.status === "paid" ? "rgba(45,212,160,0.1)" : "rgba(224,90,78,0.1)",
                      borderColor: inv.status === "paid" ? "rgba(45,212,160,0.25)" : "rgba(224,90,78,0.25)",
                      color: inv.status === "paid" ? "var(--green)" : "var(--red)",
                    }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={s.td}>
                    {inv.pdf && (
                      <a href={inv.pdf} target="_blank" rel="noopener noreferrer" style={s.downloadLink}>
                        PDF ↗
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Security note */}
      <div style={s.securityNote}>
        <span style={{ color: "var(--gold)", marginRight: "6px" }}>🔒</span>
        Payments are processed securely by Stripe. Your card details are never stored on our servers.
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth:  "1000px",
    margin:    "0 auto",
    padding:   "24px 20px 60px",
    fontFamily: "Syne, sans-serif",
  },
  contextBar: {
    display:      "flex",
    alignItems:   "center",
    gap:          "16px",
    padding:      "8px 14px",
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "6px",
    marginBottom: "24px",
    overflowX:    "auto",
  },
  contextItem: {
    display:    "flex",
    alignItems: "center",
    gap:        "5px",
    fontFamily: "Space Mono, monospace",
    fontSize:   "9px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  contextDot: {
    width:        "5px",
    height:       "5px",
    borderRadius: "50%",
  },
  header: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    marginBottom:   "24px",
  },
  pageLabel: {
    fontFamily:    "Space Mono, monospace",
    fontSize:      "10px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color:         "var(--gold)",
    marginBottom:  "6px",
  },
  pageTitle: {
    fontSize:     "26px",
    fontWeight:   800,
    letterSpacing: "-0.5px",
    marginBottom: "6px",
    margin:       0,
  },
  pageDesc: {
    fontSize: "13px",
    color:    "var(--text-dim)",
    margin:   "6px 0 0",
  },
  portalBtn: {
    padding:      "9px 18px",
    background:   "transparent",
    border:       "1px solid var(--border)",
    borderRadius: "6px",
    color:        "var(--ice)",
    fontFamily:   "Space Mono, monospace",
    fontSize:     "10px",
    letterSpacing: "0.5px",
    cursor:       "pointer",
    whiteSpace:   "nowrap",
  },
  currentBanner: {
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "10px",
    overflow:     "hidden",
    position:     "relative",
    marginBottom: "28px",
  },
  bannerBorder: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: "2px",
  },
  bannerInner: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    padding:        "20px 24px",
    flexWrap:       "wrap",
    gap:            "16px",
  },
  bannerLabel: {
    fontFamily:    "Space Mono, monospace",
    fontSize:      "9px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color:         "var(--text-dim)",
    marginBottom:  "4px",
  },
  bannerPlan: {
    fontSize:   "22px",
    fontWeight: 800,
    color:      "var(--gold)",
    letterSpacing: "-0.5px",
  },
  bannerStats: {
    display: "flex",
    gap:     "20px",
    flexWrap: "wrap",
  },
  statBox: {
    textAlign: "center",
  },
  statVal: {
    fontSize:   "22px",
    fontWeight: 800,
    lineHeight: 1,
  },
  statLabel: {
    fontFamily:    "Space Mono, monospace",
    fontSize:      "9px",
    color:         "var(--text-dim)",
    letterSpacing: "0.5px",
    marginTop:     "3px",
  },
  sectionHeader: {
    display:      "flex",
    alignItems:   "center",
    gap:          "12px",
    marginBottom: "16px",
    marginTop:    "8px",
  },
  sectionLabel: {
    fontFamily:    "Space Mono, monospace",
    fontSize:      "10px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    color:         "var(--gold)",
    whiteSpace:    "nowrap",
  },
  sectionLine: {
    flex:       1,
    height:     "1px",
    background: "var(--border)",
  },
  plansGrid: {
    display:             "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap:                 "14px",
    marginBottom:        "32px",
  },
  planCard: {
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "10px",
    overflow:     "hidden",
    position:     "relative",
    padding:      "20px",
    display:      "flex",
    flexDirection: "column",
    gap:          "0",
  },
  planCardPopular: {
    borderColor: "rgba(201,168,76,0.3)",
    background:  "var(--surface2)",
  },
  planCardCurrent: {
    borderColor: "rgba(45,212,160,0.3)",
  },
  planBorder: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: "2px",
  },
  popularBadge: {
    position:      "absolute",
    top:           "14px",
    right:         "14px",
    fontFamily:    "Space Mono, monospace",
    fontSize:      "8px",
    letterSpacing: "1.5px",
    padding:       "3px 8px",
    background:    "rgba(201,168,76,0.12)",
    border:        "1px solid rgba(201,168,76,0.3)",
    borderRadius:  "3px",
    color:         "var(--gold)",
  },
  planHead: {
    marginBottom: "16px",
    paddingTop:   "8px",
  },
  planName: {
    fontFamily:    "Space Mono, monospace",
    fontSize:      "11px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom:  "6px",
  },
  planPrice: {
    display:    "flex",
    alignItems: "baseline",
    gap:        "4px",
  },
  planPriceNum: {
    fontSize:   "32px",
    fontWeight: 800,
    letterSpacing: "-1px",
    color:      "var(--text)",
  },
  planPeriod: {
    fontFamily: "Space Mono, monospace",
    fontSize:   "10px",
    color:      "var(--text-dim)",
    letterSpacing: "0.3px",
  },
  planFeatures: {
    flex:         1,
    display:      "flex",
    flexDirection: "column",
    gap:          "7px",
    marginBottom: "20px",
  },
  featureRow: {
    display:    "flex",
    alignItems: "flex-start",
    gap:        "8px",
    fontFamily: "Space Mono, monospace",
    fontSize:   "10px",
    lineHeight: "1.4",
  },
  featureText: {
    color: "var(--text-dim)",
  },
  planBtn: {
    padding:      "10px",
    border:       "1px solid var(--border)",
    borderRadius: "6px",
    background:   "transparent",
    color:        "var(--text-dim)",
    fontFamily:   "Syne, sans-serif",
    fontWeight:   600,
    fontSize:     "13px",
    cursor:       "pointer",
    width:        "100%",
  },
  planBtnPrimary: {
    background:  "var(--gold)",
    borderColor: "var(--gold)",
    color:       "#0D1520",
    cursor:      "pointer",
  },
  planBtnCurrent: {
    background:  "rgba(45,212,160,0.08)",
    borderColor: "rgba(45,212,160,0.2)",
    color:       "var(--green)",
    cursor:      "default",
  },
  invoiceCard: {
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "10px",
    overflow:     "hidden",
    position:     "relative",
    marginBottom: "20px",
  },
  invoiceBorder: {
    position:   "absolute",
    top: 0, left: 0, right: 0,
    height:     "2px",
    background: "linear-gradient(90deg, var(--gold), var(--ice))",
  },
  invoiceTable: {
    width:          "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding:       "12px 16px",
    fontFamily:    "Space Mono, monospace",
    fontSize:      "9px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    color:         "var(--text-dim)",
    textAlign:     "left",
    borderBottom:  "1px solid var(--border)",
    fontWeight:    400,
  },
  td: {
    padding:    "12px 16px",
    fontFamily: "Space Mono, monospace",
    fontSize:   "11px",
    color:      "var(--text-dim)",
  },
  statusBadge: {
    padding:       "2px 8px",
    borderRadius:  "3px",
    border:        "1px solid",
    fontSize:      "9px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  downloadLink: {
    color:          "var(--ice)",
    textDecoration: "none",
    fontFamily:     "Space Mono, monospace",
    fontSize:       "10px",
    letterSpacing:  "0.5px",
  },
  loadWrap: {
    display:        "flex",
    justifyContent: "center",
    padding:        "40px",
  },
  spinner: {
    width:        "28px",
    height:       "28px",
    border:       "2px solid var(--border)",
    borderTop:    "2px solid var(--gold)",
    borderRadius: "50%",
    animation:    "spin 0.8s linear infinite",
  },
  emptyInvoice: {
    textAlign: "center",
    padding:   "40px",
    color:     "var(--text-dim)",
  },
  securityNote: {
    fontFamily: "Space Mono, monospace",
    fontSize:   "10px",
    color:      "var(--text-dim)",
    lineHeight: "1.6",
    letterSpacing: "0.3px",
  },
};