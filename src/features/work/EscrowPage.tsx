// Phase 6 — Winners Work — EscrowPage.tsx
// Escrow payment management: fund, release, dispute, refund

import { useState, useEffect } from "react";
import { useAuthStore } from "../../features/auth/authStore";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface EscrowPayment {
  id: string;
  contractId: string;
  clientId: string;
  freelancerId: string;
  amount: number;
  currency: string;
  status: "HELD" | "RELEASED" | "DISPUTED" | "REFUNDED";
  stripePaymentId: string | null;
  releasedAt: string | null;
  createdAt: string;
  contract: {
    title: string;
    clientId: string;
    amount: number;
    milestones: { id: string; title: string; amount: number; status: string }[];
  };
}

const STATUS_COLORS: Record<string, string> = {
  HELD: "var(--gold)",
  RELEASED: "var(--green)",
  DISPUTED: "var(--red)",
  REFUNDED: "var(--text-dim)",
};

const STATUS_ICONS: Record<string, string> = {
  HELD: "🔒",
  RELEASED: "✅",
  DISPUTED: "⚠️",
  REFUNDED: "↩️",
};

export default function EscrowPage() {
  const { token, user } = useAuthStore();
  const [escrows, setEscrows] = useState<EscrowPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EscrowPayment | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [releaseAmount, setReleaseAmount] = useState("");
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  function toast(text: string, type: "success" | "error" = "success") {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  }

  async function fetchEscrows() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/escrow`, { headers });
      if (r.ok) setEscrows(await r.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchEscrows(); }, []);

  async function handleRelease(escrowId: string, milestoneId?: string) {
    setActionLoading("release");
    try {
      const body: Record<string, string> = {};
      if (milestoneId) body.milestoneId = milestoneId;
      if (releaseAmount) body.amount = releaseAmount;
      const r = await fetch(`${API_BASE}/escrow/release/${escrowId}`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) { toast(data.error || "Failed to release", "error"); return; }
      toast(`$${data.payout.toFixed(2)} released to freelancer`);
      fetchEscrows();
      setSelected(null);
    } finally { setActionLoading(null); }
  }

  async function handleDispute(escrowId: string) {
    if (!disputeReason.trim()) { toast("Please enter a reason", "error"); return; }
    setActionLoading("dispute");
    try {
      const r = await fetch(`${API_BASE}/escrow/dispute/${escrowId}`, {
        method: "POST", headers,
        body: JSON.stringify({ reason: disputeReason }),
      });
      const data = await r.json();
      if (!r.ok) { toast(data.error || "Failed to open dispute", "error"); return; }
      toast("Dispute opened — our team will review within 48 hours");
      setShowDispute(false);
      setDisputeReason("");
      fetchEscrows();
      setSelected(null);
    } finally { setActionLoading(null); }
  }

  async function handleRefund(escrowId: string) {
    if (!confirm("Refund the escrow to client? This cannot be undone.")) return;
    setActionLoading("refund");
    try {
      const r = await fetch(`${API_BASE}/escrow/refund/${escrowId}`, { method: "POST", headers, body: JSON.stringify({}) });
      const data = await r.json();
      if (!r.ok) { toast(data.error || "Failed to refund", "error"); return; }
      toast("Escrow refunded successfully");
      fetchEscrows();
      setSelected(null);
    } finally { setActionLoading(null); }
  }

  const totalHeld = escrows.filter(e => e.status === "HELD").reduce((sum, e) => sum + e.amount, 0);
  const totalReleased = escrows.filter(e => e.status === "RELEASED").reduce((sum, e) => sum + e.amount, 0);
  const disputed = escrows.filter(e => e.status === "DISPUTED").length;

  return (
    <>
      <style>{`
        .escrow-page { max-width: 1100px; margin: 0 auto; padding: 28px 20px; }
        .escrow-heading { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 600; color: var(--text); margin: 0 0 4px; }
        .escrow-sub { color: var(--text-dim); font-size: 14px; margin: 0 0 28px; }
        .escrow-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .escrow-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 18px 20px; position: relative; overflow: hidden; }
        .escrow-stat::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), transparent); }
        .escrow-stat-label { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: .12em; color: var(--text-dim); margin-bottom: 8px; }
        .escrow-stat-value { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: var(--text); }
        .escrow-stat-value.gold { color: var(--gold); }
        .escrow-stat-value.green { color: var(--green); }
        .escrow-stat-value.red { color: var(--red); }
        .escrow-table { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
        .escrow-table-header { display: grid; grid-template-columns: 1fr 120px 100px 100px 120px; gap: 8px; padding: 12px 16px; background: var(--surface2); border-bottom: 1px solid var(--border); }
        .escrow-table-header span { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: var(--text-dim); }
        .escrow-row { display: grid; grid-template-columns: 1fr 120px 100px 100px 120px; gap: 8px; padding: 14px 16px; border-bottom: 1px solid rgba(30,50,72,0.5); cursor: pointer; transition: background 200ms; align-items: center; }
        .escrow-row:hover { background: var(--surface2); }
        .escrow-row:last-child { border-bottom: none; }
        .escrow-title { font-size: 14px; font-weight: 600; color: var(--text); }
        .escrow-meta { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
        .escrow-amount { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; color: var(--gold); }
        .escrow-status-badge { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: .1em; padding: 4px 10px; border-radius: 3px; display: inline-flex; align-items: center; gap: 4px; border: 1px solid; }
        .escrow-action-btn { padding: 6px 14px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; transition: opacity 200ms; }
        .escrow-action-btn:disabled { opacity: .5; cursor: not-allowed; }
        .btn-release { background: var(--green); color: var(--bg); }
        .btn-dispute { background: transparent; border: 1px solid var(--red) !important; color: var(--red); }
        .btn-refund { background: transparent; border: 1px solid var(--text-dim) !important; color: var(--text-dim); }
        .escrow-detail { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 24px; margin-top: 24px; position: relative; }
        .escrow-detail::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), transparent); }
        .escrow-detail-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .escrow-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .escrow-detail-field label { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: var(--text-dim); display: block; margin-bottom: 4px; }
        .escrow-detail-field span { color: var(--text); font-size: 14px; }
        .milestone-list { margin-bottom: 20px; }
        .milestone-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--surface2); border-radius: 4px; margin-bottom: 8px; border: 1px solid var(--border); }
        .milestone-title { font-size: 13px; color: var(--text); }
        .milestone-amount { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--gold); }
        .milestone-release-btn { padding: 4px 12px; font-size: 11px; background: var(--green); color: var(--bg); border: none; border-radius: 3px; cursor: pointer; }
        .escrow-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .amount-input { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; color: var(--text); font-size: 13px; padding: 8px 12px; width: 140px; }
        .amount-input:focus { outline: none; border-color: var(--gold); }
        .dispute-form { margin-top: 16px; padding: 16px; background: var(--surface2); border-radius: 6px; border: 1px solid rgba(224,90,78,.2); }
        .dispute-form textarea { width: 100%; background: var(--surface); border: 1px solid var(--border); color: var(--text); font-size: 13px; padding: 10px; border-radius: 4px; resize: vertical; min-height: 80px; font-family: 'Syne', sans-serif; box-sizing: border-box; }
        .dispute-form textarea:focus { outline: none; border-color: var(--red); }
        .dispute-actions { display: flex; gap: 10px; margin-top: 12px; }
        .empty-state { text-align: center; padding: 64px 20px; color: var(--text-dim); }
        .empty-icon { font-size: 40px; margin-bottom: 16px; }
        .skeleton { background: var(--surface2); border-radius: 4px; animation: shimmer 1.4s ease infinite; }
        @keyframes shimmer { 0% { opacity: .6 } 50% { opacity: 1 } 100% { opacity: .6 } }
        .escrow-toast { position: fixed; bottom: 28px; right: 28px; padding: 14px 20px; border-radius: 6px; font-size: 13px; font-family: 'Syne', sans-serif; font-weight: 600; z-index: 9999; animation: slideUp 200ms ease; box-shadow: 0 8px 32px rgba(0,0,0,.4); }
        .escrow-toast.success { background: var(--green); color: var(--bg); }
        .escrow-toast.error { background: var(--red); color: #fff; }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @media (max-width: 768px) {
          .escrow-table-header, .escrow-row { grid-template-columns: 1fr 90px 80px; }
          .escrow-table-header span:nth-child(4), .escrow-row > *:nth-child(4),
          .escrow-table-header span:nth-child(5), .escrow-row > *:nth-child(5) { display: none; }
          .escrow-detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {toastMsg && (
        <div className={`escrow-toast ${toastMsg.type}`}>{toastMsg.text}</div>
      )}

      <div className="escrow-page">
        <h1 className="escrow-heading">Escrow Payments</h1>
        <p className="escrow-sub">Secure payment holding for Work contracts — release funds when milestones are complete</p>

        <div className="escrow-stats">
          <div className="escrow-stat">
            <div className="escrow-stat-label">Total Held</div>
            <div className="escrow-stat-value gold">${totalHeld.toLocaleString()}</div>
          </div>
          <div className="escrow-stat">
            <div className="escrow-stat-label">Total Released</div>
            <div className="escrow-stat-value green">${totalReleased.toLocaleString()}</div>
          </div>
          <div className="escrow-stat">
            <div className="escrow-stat-label">Active Escrows</div>
            <div className="escrow-stat-value">{escrows.filter(e => e.status === "HELD").length}</div>
          </div>
          <div className="escrow-stat">
            <div className="escrow-stat-label">Disputed</div>
            <div className={`escrow-stat-value ${disputed > 0 ? "red" : ""}`}>{disputed}</div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 64, borderRadius: 6 }} />
            ))}
          </div>
        ) : escrows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔒</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>No escrow payments yet</div>
            <div style={{ fontSize: 13 }}>When clients fund contracts, they will appear here</div>
          </div>
        ) : (
          <div className="escrow-table">
            <div className="escrow-table-header">
              <span>Contract</span>
              <span>Amount</span>
              <span>Currency</span>
              <span>Status</span>
              <span>Date</span>
            </div>
            {escrows.map((e) => (
              <div key={e.id} className="escrow-row" onClick={() => setSelected(e)}>
                <div>
                  <div className="escrow-title">{e.contract?.title ?? "Contract"}</div>
                  <div className="escrow-meta">
                    {user?.id === e.clientId ? "You are the client" : "You are the freelancer"}
                  </div>
                </div>
                <div className="escrow-amount">${e.amount.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{e.currency}</div>
                <div>
                  <span
                    className="escrow-status-badge"
                    style={{ color: STATUS_COLORS[e.status], borderColor: `${STATUS_COLORS[e.status]}40`, background: `${STATUS_COLORS[e.status]}10` }}
                  >
                    {STATUS_ICONS[e.status]} {e.status}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                  {new Date(e.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="escrow-detail">
            <div className="escrow-detail-title">
              🔒 {selected.contract?.title ?? "Contract"}
              <button
                onClick={() => { setSelected(null); setShowDispute(false); }}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 18 }}
              >✕</button>
            </div>

            <div className="escrow-detail-grid">
              <div className="escrow-detail-field">
                <label>Status</label>
                <span style={{ color: STATUS_COLORS[selected.status] }}>{STATUS_ICONS[selected.status]} {selected.status}</span>
              </div>
              <div className="escrow-detail-field">
                <label>Amount</label>
                <span style={{ color: "var(--gold)", fontFamily: "'Space Mono',monospace" }}>${selected.amount.toLocaleString()} {selected.currency}</span>
              </div>
              <div className="escrow-detail-field">
                <label>Escrow ID</label>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11 }}>{selected.id}</span>
              </div>
              <div className="escrow-detail-field">
                <label>Created</label>
                <span>{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              {selected.releasedAt && (
                <div className="escrow-detail-field">
                  <label>Released</label>
                  <span style={{ color: "var(--green)" }}>{new Date(selected.releasedAt).toLocaleString()}</span>
                </div>
              )}
            </div>

            {selected.contract?.milestones?.length > 0 && (
              <div className="milestone-list">
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-dim)", marginBottom: 10 }}>
                  Milestones
                </div>
                {selected.contract.milestones.map((m) => (
                  <div key={m.id} className="milestone-item">
                    <div>
                      <div className="milestone-title">{m.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{m.status}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="milestone-amount">${m.amount}</span>
                      {user?.id === selected.clientId && selected.status === "HELD" && m.status !== "PAID" && (
                        <button
                          className="milestone-release-btn"
                          onClick={(ev) => { ev.stopPropagation(); handleRelease(selected.id, m.id); }}
                          disabled={actionLoading === "release"}
                        >
                          {actionLoading === "release" ? "…" : "Release"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selected.status === "HELD" && user?.id === selected.clientId && (
              <div className="escrow-actions">
                <input
                  className="amount-input"
                  type="number"
                  placeholder="Amount (optional)"
                  value={releaseAmount}
                  onChange={(ev) => setReleaseAmount(ev.target.value)}
                />
                <button
                  className="escrow-action-btn btn-release"
                  onClick={() => handleRelease(selected.id)}
                  disabled={actionLoading === "release"}
                >
                  {actionLoading === "release" ? "Releasing…" : "✅ Release Full Amount"}
                </button>
                <button
                  className="escrow-action-btn btn-dispute"
                  style={{ border: "1px solid var(--red)" }}
                  onClick={() => setShowDispute(!showDispute)}
                >
                  ⚠️ Open Dispute
                </button>
                <button
                  className="escrow-action-btn btn-refund"
                  style={{ border: "1px solid var(--text-dim)" }}
                  onClick={() => handleRefund(selected.id)}
                  disabled={actionLoading === "refund"}
                >
                  {actionLoading === "refund" ? "Refunding…" : "↩ Refund"}
                </button>
              </div>
            )}

            {showDispute && (
              <div className="dispute-form">
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--red)", marginBottom: 10 }}>
                  ⚠️ Open Dispute
                </div>
                <textarea
                  placeholder="Describe the issue in detail — be specific about what wasn't delivered..."
                  value={disputeReason}
                  onChange={(ev) => setDisputeReason(ev.target.value)}
                />
                <div className="dispute-actions">
                  <button
                    className="escrow-action-btn btn-dispute"
                    style={{ border: "1px solid var(--red)" }}
                    onClick={() => handleDispute(selected.id)}
                    disabled={actionLoading === "dispute"}
                  >
                    {actionLoading === "dispute" ? "Submitting…" : "Submit Dispute"}
                  </button>
                  <button
                    className="escrow-action-btn"
                    style={{ background: "var(--surface2)", color: "var(--text-dim)", border: "1px solid var(--border)" }}
                    onClick={() => setShowDispute(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
