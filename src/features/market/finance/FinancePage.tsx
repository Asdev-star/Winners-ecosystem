// Phase 4B: Winners Finance - Internal Settlement Rail
import { useState, useEffect } from "react";
import { useAuthStore } from "../../auth/authStore";
import ContextBar from "../../../components/ui/ContextBar";

interface WalletStats { balance: number; available: number; pending: number; totalEarned: number; totalSpent: number; currency: string; }
interface Transaction { id: string; type: string; amount: number; fee: number; netAmount: number; status: string; description: string; createdAt: string; }

export default function FinancePage() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"wallet" | "send" | "withdraw" | "history">("wallet");
  const [sendAmount, setSendAmount] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("stripe");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch("/api/v1/finance/stats", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/v1/finance/transactions?limit=10", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
    ]).then(([statsData, txData]) => {
      setStats(statsData);
      setTransactions(txData.transactions || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const handleSend = async () => {
    if (!sendAmount || !recipientId || !token) return;
    setSending(true);
    try {
      const res = await fetch("/api/v1/finance/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientUserId: recipientId, amount: parseFloat(sendAmount) })
      });
      const data = await res.json();
      if (data.success) { setSendAmount(""); setRecipientId(""); window.location.reload(); }
      else alert(data.error || "Transfer failed");
    } catch { alert("Transfer failed"); }
    setSending(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !token) return;
    setSending(true);
    try {
      const res = await fetch("/api/v1/finance/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount), method: withdrawMethod })
      });
      const data = await res.json();
      if (data.success) { setWithdrawAmount(""); window.location.reload(); }
      else alert(data.error || "Withdrawal failed");
    } catch { alert("Withdrawal failed"); }
    setSending(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>Loading wallet...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 40px" }}>
      <ContextBar platform="market" />
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "var(--gold)", marginBottom: 8 }}>Winners Finance</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 24 }}>Your internal wallet — send, receive, and withdraw</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Balance", val: stats?.balance || 0, color: "var(--gold)" },
          { label: "Available", val: stats?.available || 0, color: "var(--green)" },
          { label: "Pending", val: stats?.pending || 0, color: "var(--text-dim)" },
          { label: "Total Earned", val: stats?.totalEarned || 0, color: "var(--ice)" },
        ].map((c) => (
          <div key={c.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${c.color}, transparent)` }} />
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: c.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{c.label}</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: "var(--text)", marginTop: 8 }}>${c.val.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
        {[
          { id: "wallet", label: "Wallet", icon: "💳" },
          { id: "send", label: "Send Money", icon: "📤" },
          { id: "withdraw", label: "Withdraw", icon: "🏧" },
          { id: "history", label: "History", icon: "📋" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{
            background: tab === t.id ? "var(--surface2)" : "transparent",
            border: "1px solid", borderColor: tab === t.id ? "var(--gold)" : "var(--border)",
            borderRadius: 6, padding: "10px 16px", color: tab === t.id ? "var(--gold)" : "var(--text-dim)",
            cursor: "pointer", fontFamily: "'Syne', sans-serif", fontSize: 13, display: "flex", alignItems: "center", gap: 8
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {tab === "wallet" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: 24 }}>
          <h3 style={{ color: "var(--text)", marginBottom: 16 }}>Wallet Settings</h3>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ padding: 16, background: "var(--surface2)", borderRadius: 6 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", marginBottom: 4 }}>CURRENCY</div>
              <div style={{ color: "var(--text)" }}>{stats?.currency || "USD"}</div>
            </div>
          </div>
        </div>
      )}

      {tab === "send" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: 24 }}>
          <h3 style={{ color: "var(--text)", marginBottom: 16 }}>Send Money</h3>
          <div style={{ display: "grid", gap: 16, maxWidth: 400 }}>
            <div>
              <label style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", marginBottom: 6 }}>RECIPIENT USER ID</label>
              <input value={recipientId} onChange={(e) => setRecipientId(e.target.value)} placeholder="cu-xxxxx..." style={{ width: "100%", padding: "12px 16px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontFamily: "'Syne', sans-serif", fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", marginBottom: 6 }}>AMOUNT (USD)</label>
              <input type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "12px 16px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontFamily: "'Syne', sans-serif", fontSize: 14 }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>2% transfer fee applies</div>
            <button onClick={handleSend} disabled={sending || !sendAmount || !recipientId} style={{ background: sending ? "var(--border)" : "var(--gold)", color: sending ? "var(--text-dim)" : "var(--bg)", border: "none", borderRadius: 6, padding: "14px 24px", fontWeight: 600, cursor: sending ? "not-allowed" : "pointer" }}>
              {sending ? "Sending..." : `Send ${sendAmount || "0"}`}
            </button>
          </div>
        </div>
      )}

      {tab === "withdraw" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: 24 }}>
          <h3 style={{ color: "var(--text)", marginBottom: 16 }}>Withdraw Funds</h3>
          <div style={{ display: "grid", gap: 16, maxWidth: 400 }}>
            <div>
              <label style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", marginBottom: 6 }}>AMOUNT (USD)</label>
              <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "12px 16px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontFamily: "'Syne', sans-serif", fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", marginBottom: 6 }}>METHOD</label>
              <select value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)} style={{ width: "100%", padding: "12px 16px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontFamily: "'Syne', sans-serif", fontSize: 14 }}>
                <option value="stripe">Stripe (Bank Transfer)</option>
                <option value="mpesa">M-Pesa (Kenya)</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Fee: $1.50 (M-Pesa) or $2.00 (Stripe/Bank)</div>
            <button onClick={handleWithdraw} disabled={sending || !withdrawAmount} style={{ background: sending ? "var(--border)" : "var(--green)", color: sending ? "var(--text-dim)" : "var(--bg)", border: "none", borderRadius: 6, padding: "14px 24px", fontWeight: 600, cursor: sending ? "not-allowed" : "pointer" }}>
              {sending ? "Processing..." : `Withdraw ${withdrawAmount || "0"}`}
            </button>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: 24 }}>
          <h3 style={{ color: "var(--text)", marginBottom: 16 }}>Transaction History</h3>
          {transactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}>No transactions yet</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {transactions.map((tx) => (
                <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "var(--surface2)", borderRadius: 6 }}>
                  <div>
                    <div style={{ color: "var(--text)", fontSize: 13 }}>{tx.description || tx.type}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)" }}>{new Date(tx.createdAt).toLocaleDateString()} · {tx.status}</div>
                  </div>
                  <div style={{ color: tx.netAmount >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{tx.netAmount >= 0 ? "+" : ""}${tx.netAmount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
