// src/features/referral/ReferralPage.tsx

import { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;
const css = `
  .rr-root { padding: 28px 24px 80px; font-family: 'Syne', sans-serif; color: var(--text); max-width: 900px; }
  .rr-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .rr-title span { color: var(--gold); }
  .rr-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-bottom: 32px; }

  .rr-hero {
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
    padding: 32px; margin-bottom: 24px; position: relative; overflow: hidden;
  }
  .rr-hero::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), transparent); }
  .rr-hero-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .rr-hero-title { font-size: 26px; font-weight: 800; margin-bottom: 8px; }
  .rr-hero-desc { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-bottom: 24px; line-height: 1.6; max-width: 480px; }

  .rr-link-box { display: flex; gap: 8px; max-width: 560px; }
  .rr-link-input { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 3px; padding: 11px 14px; font-family: 'Space Mono', monospace; font-size: 12px; color: var(--text); outline: none; box-sizing: border-box; }
  .rr-copy-btn { background: var(--gold); color: #080B10; border: none; border-radius: 3px; padding: 11px 20px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; flex-shrink: 0; }
  .rr-copy-btn:hover { opacity: 0.88; }
  .rr-copy-btn.copied { background: #2DD4A0; }

  .rr-share { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
  .rr-share-btn { background: var(--surface2); border: 1px solid var(--border); border-radius: 3px; padding: 8px 16px; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); cursor: pointer; transition: all 0.15s; }
  .rr-share-btn:hover { border-color: var(--gold); color: var(--gold); }

  .rr-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .rr-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 20px; }
  .rr-stat-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; }
  .rr-stat-value { font-size: 28px; font-weight: 800; letter-spacing: -1px; color: var(--gold); }
  .rr-stat-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 4px; }

  .rr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .rr-section { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .rr-section-header { padding: 16px 20px; border-bottom: 1px solid var(--border); }
  .rr-section-title { font-size: 13px; font-weight: 700; }

  .rr-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid var(--border); }
  .rr-item:last-child { border-bottom: none; }
  .rr-item-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(245,200,66,0.12); color: var(--gold); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .rr-item-name { font-size: 12px; font-weight: 600; }
  .rr-item-email { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .rr-item-right { margin-left: auto; text-align: right; }
  .rr-badge { font-family: 'Space Mono', monospace; font-size: 9px; padding: 2px 7px; border-radius: 2px; }
  .rr-badge.converted { background: rgba(45,212,160,0.1); color: #2DD4A0; border: 1px solid rgba(45,212,160,0.2); }
  .rr-badge.pending   { background: rgba(245,200,66,0.1); color: var(--gold); border: 1px solid rgba(245,200,66,0.2); }
  .rr-item-date { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-top: 3px; }

  .rr-lb-item { display: flex; align-items: center; gap: 12px; padding: 11px 20px; border-bottom: 1px solid var(--border); }
  .rr-lb-item:last-child { border-bottom: none; }
  .rr-lb-item.me { background: rgba(245,200,66,0.04); }
  .rr-lb-rank { font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; width: 24px; text-align: center; flex-shrink: 0; color: var(--text-dim); }
  .rr-lb-rank.top { color: var(--gold); }
  .rr-lb-name { font-size: 12px; font-weight: 600; flex: 1; }
  .rr-lb-you { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--gold); margin-left: 6px; }
  .rr-lb-count { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--gold); font-weight: 700; }

  .rr-empty { padding: 32px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }
  .rr-loading { padding: 40px 24px; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }
  .rr-error { padding: 20px 24px; font-family: 'Space Mono', monospace; font-size: 11px; color: #FF5975; background: rgba(255,89,117,0.08); border: 1px solid rgba(255,89,117,0.2); border-radius: 4px; margin-bottom: 16px; }

  @media (max-width: 768px) {
    .rr-stats { grid-template-columns: repeat(2, 1fr); }
    .rr-grid  { grid-template-columns: 1fr; }
    .rr-root  { padding: 16px 14px 80px; }
  }
  @media (max-width: 480px) {
    .rr-link-box { flex-direction: column; }
  }
`;

// Inject styles immediately — outside component to avoid timing issues
if (typeof document !== "undefined") {
  if (!document.getElementById("rr-styles")) {
    const tag = document.createElement("style");
    tag.id = "rr-styles"; tag.textContent = css;
    document.head.appendChild(tag);
  }
}

export default function ReferralPage() {
  const token = useAuthStore((s) => s.token);
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API}/referral/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message ?? "Failed to load referral data"))
      .finally(() => setLoading(false));
  }, [token]);

  const copy = () => {
    navigator.clipboard.writeText(data?.referralUrl ?? "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareTwitter  = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Join Winners Ecosystem — the best revenue intelligence platform:")}&url=${encodeURIComponent(data?.referralUrl ?? "")}`, "_blank");
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Join Winners Ecosystem: ${data?.referralUrl}`)}`, "_blank");
  const shareEmail    = () => window.open(`mailto:?subject=${encodeURIComponent("Join me on Winners Ecosystem")}&body=${encodeURIComponent(`Hey,\n\nUse my referral link to sign up: ${data?.referralUrl}`)}`);

  return (
    <div className="rr-root">
      <h1 className="rr-title">Referral <span>Program</span></h1>
      <p className="rr-subtitle">Invite friends and earn $25 credit for every successful referral</p>

      {error && <div className="rr-error">⚠ {error}</div>}

      {loading ? (
        <div className="rr-loading">Loading referral data…</div>
      ) : (
        <>
          {/* Hero */}
          <div className="rr-hero">
            <div className="rr-hero-label">● Your Referral Link</div>
            <div className="rr-hero-title">Earn $25 per referral</div>
            <div className="rr-hero-desc">Share your unique link. When someone signs up and activates their account, you get $25 in account credit — no limits.</div>
            <div className="rr-link-box">
              <input className="rr-link-input" value={data?.referralUrl ?? "Generating link…"} readOnly onClick={(e) => (e.target as HTMLInputElement).select()} />
              <button className={`rr-copy-btn${copied ? " copied" : ""}`} onClick={copy}>
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
            <div className="rr-share">
              <button className="rr-share-btn" onClick={shareTwitter}>🐦 Twitter</button>
              <button className="rr-share-btn" onClick={shareWhatsApp}>💬 WhatsApp</button>
              <button className="rr-share-btn" onClick={shareEmail}>📧 Email</button>
            </div>
          </div>

          {/* Stats */}
          <div className="rr-stats">
            <div className="rr-stat">
              <div className="rr-stat-label">Total Referrals</div>
              <div className="rr-stat-value">{data?.referrals?.length ?? 0}</div>
              <div className="rr-stat-sub">people invited</div>
            </div>
            <div className="rr-stat">
              <div className="rr-stat-label">Converted</div>
              <div className="rr-stat-value">{data?.stats?.converted ?? 0}</div>
              <div className="rr-stat-sub">signed up</div>
            </div>
            <div className="rr-stat">
              <div className="rr-stat-label">Pending</div>
              <div className="rr-stat-value">{data?.stats?.pending ?? 0}</div>
              <div className="rr-stat-sub">awaiting signup</div>
            </div>
            <div className="rr-stat">
              <div className="rr-stat-label">Credits Earned</div>
              <div className="rr-stat-value">${data?.stats?.totalCredit ?? 0}</div>
              <div className="rr-stat-sub">account credit</div>
            </div>
          </div>

          {/* Referrals + Leaderboard */}
          <div className="rr-grid">
            <div className="rr-section">
              <div className="rr-section-header">
                <div className="rr-section-title">👥 Your Referrals</div>
              </div>
              {(!data?.referrals || data.referrals.length === 0) ? (
                <div className="rr-empty">No referrals yet. Share your link to get started!</div>
              ) : (
                data.referrals.map((r: any) => (
                  <div className="rr-item" key={r.id}>
                    <div className="rr-item-avatar">{r.referred?.name?.[0]?.toUpperCase() ?? "?"}</div>
                    <div>
                      <div className="rr-item-name">{r.referred?.name ?? "Pending"}</div>
                      <div className="rr-item-email">{r.referred?.email ?? "—"}</div>
                    </div>
                    <div className="rr-item-right">
                      <div className={`rr-badge ${r.status === "CONVERTED" ? "converted" : "pending"}`}>
                        {r.status === "CONVERTED" ? "Converted" : "Pending"}
                      </div>
                      <div className="rr-item-date">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rr-section">
              <div className="rr-section-header">
                <div className="rr-section-title">🏆 Top Referrers</div>
              </div>
              {(!data?.leaderboard || data.leaderboard.length === 0) ? (
                <div className="rr-empty">No referrals converted yet. Be the first!</div>
              ) : (
                data.leaderboard.map((entry: any) => (
                  <div className={`rr-lb-item${entry.isCurrentUser ? " me" : ""}`} key={entry.rank}>
                    <div className={`rr-lb-rank${entry.rank <= 3 ? " top" : ""}`}>
                      {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                    </div>
                    <div className="rr-lb-name">
                      {entry.name}
                      {entry.isCurrentUser && <span className="rr-lb-you"> YOU</span>}
                    </div>
                    <div className="rr-lb-count">{entry.referrals} ref{entry.referrals !== 1 ? "s" : ""}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}