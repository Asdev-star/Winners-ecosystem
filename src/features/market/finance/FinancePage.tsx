// Phase 4B: Winners Finance - Internal Settlement Rail
import { useState, useEffect } from "react";
import { useAuthStore } from "../../auth/authStore";
import ContextBar from "../../../components/ui/ContextBar";

interface WalletStats {
  walletNumber: string;
  type: string;
  status: string;
  kycLevel: number;
  balances: Record<
    string,
    { available: number; pending: number; reserved: number }
  >;
  hasPin: boolean;
}
interface Transaction {
  id: string;
  type: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  description: string;
  createdAt: string;
}

export default function FinancePage() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<
    "wallet" | "send" | "deposit" | "withdraw" | "history"
  >("wallet");
  const [sendAmount, setSendAmount] = useState("");
  const [recipientWallet, setRecipientWallet] = useState("");
  const [pin, setPin] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("stripe");
  const [depositPhone, setDepositPhone] = useState("");
  const [depositBankName, setDepositBankName] = useState("");
  const [depositMessage, setDepositMessage] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("stripe");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch("/api/v1/finance/winners/stats", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch("/api/v1/finance/winners/transactions?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([statsData, txData]) => {
        setStats(statsData);
        setTransactions(txData.transactions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleSend = async () => {
    if (!sendAmount || !recipientWallet || !pin || !token) return;
    setSending(true);
    try {
      const res = await fetch("/api/v1/finance/winners/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientWalletNumber: recipientWallet,
          amount: parseFloat(sendAmount),
          pin,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSendAmount("");
        setRecipientWallet("");
        setPin("");
        window.location.reload();
      } else alert(data.error || "Transfer failed");
    } catch {
      alert("Transfer failed");
    }
    setSending(false);
  };

  const handleDeposit = async () => {
    if (!depositAmount || !depositMethod || !token) return;
    setSending(true);
    setDepositMessage("");
    try {
      let endpoint = "/api/v1/finance/winners/deposit/stripe";
      const body: any = { amount: parseFloat(depositAmount) };

      if (depositMethod === "mpesa") {
        endpoint = "/api/v1/finance/winners/deposit/mpesa";
        body.phoneNumber = depositPhone;
      } else if (depositMethod === "bank") {
        endpoint = "/api/v1/finance/winners/deposit/bank";
        body.bankName = depositBankName || "Winners Bank";
      } else if (depositMethod === "flutterwave_card") {
        endpoint = "/api/v1/finance/winners/deposit/flutterwave";
        body.paymentType = "card";
      } else {
        endpoint = "/api/v1/finance/winners/deposit/stripe";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setDepositAmount("");
        setDepositPhone("");
        setDepositBankName("");
        const message = data.link
          ? `Deposit created. Open this payment link: ${data.link}`
          : data.clientSecret
            ? `Stripe deposit created. Client secret: ${data.clientSecret}`
            : `Deposit request created. Reference: ${data.reference || data.txRef || "n/a"}`;
        setDepositMessage(message);
      } else {
        setDepositMessage(data.error || "Deposit failed");
      }
    } catch (error) {
      setDepositMessage("Deposit failed");
    }
    setSending(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !token) return;
    setSending(true);
    try {
      const res = await fetch("/api/v1/finance/winners/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          method: withdrawMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawAmount("");
        window.location.reload();
      } else alert(data.error || "Withdrawal failed");
    } catch {
      alert("Withdrawal failed");
    }
    setSending(false);
  };

  if (loading)
    return (
      <div
        style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}
      >
        Loading wallet...
      </div>
    );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 40px" }}>
      <ContextBar platform="market" />
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
          fontWeight: 300,
          color: "var(--gold)",
          marginBottom: 8,
        }}
      >
        Winners Finance
      </h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 24 }}>
        Your internal wallet — send, receive, and withdraw
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {Object.entries(stats?.balances || {}).map(([currency, bal]) => (
          <div
            key={currency}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, var(--gold), transparent)`,
              }}
            />
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                color: "var(--gold)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {currency} Balance
            </div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                fontWeight: 600,
                color: "var(--text)",
                marginTop: 8,
              }}
            >
              ${bal.available.toFixed(2)}
            </div>
            <div
              style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}
            >
              Pending: ${bal.pending.toFixed(2)}
            </div>
          </div>
        ))}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 20,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, var(--ice), transparent)`,
            }}
          />
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: "var(--ice)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Wallet Number
          </div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text)",
              marginTop: 8,
            }}
          >
            {stats?.walletNumber}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 12,
        }}
      >
        {[
          { id: "wallet", label: "Wallet", icon: "💳" },
          { id: "send", label: "Send Money", icon: "📤" },
          { id: "withdraw", label: "Withdraw", icon: "🏧" },
          { id: "history", label: "History", icon: "📋" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            style={{
              background: tab === t.id ? "var(--surface2)" : "transparent",
              border: "1px solid",
              borderColor: tab === t.id ? "var(--gold)" : "var(--border)",
              borderRadius: 6,
              padding: "10px 16px",
              color: tab === t.id ? "var(--gold)" : "var(--text-dim)",
              cursor: "pointer",
              fontFamily: "'Syne', sans-serif",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {tab === "wallet" && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 24,
          }}
        >
          <h3 style={{ color: "var(--text)", marginBottom: 16 }}>
            Wallet Settings
          </h3>
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                padding: 16,
                background: "var(--surface2)",
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: "var(--text-dim)",
                  marginBottom: 4,
                }}
              >
                PRIMARY CURRENCY
              </div>
              <div style={{ color: "var(--text)" }}>
                {Object.keys(stats?.balances || {})[0] || "USD"}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "send" && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 24,
          }}
        >
          <h3 style={{ color: "var(--text)", marginBottom: 16 }}>Send Money</h3>
          <div style={{ display: "grid", gap: 16, maxWidth: 400 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: "var(--text-dim)",
                  marginBottom: 6,
                }}
              >
                RECIPIENT WALLET NUMBER
              </label>
              <input
                value={recipientWallet}
                onChange={(e) => setRecipientWallet(e.target.value)}
                placeholder="WW12345678"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text)",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: "var(--text-dim)",
                  marginBottom: 6,
                }}
              >
                AMOUNT (USD)
              </label>
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text)",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: "var(--text-dim)",
                  marginBottom: 6,
                }}
              >
                PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="****"
                maxLength={4}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text)",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
              2% transfer fee applies
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !sendAmount || !recipientWallet || !pin}
              style={{
                background: sending ? "var(--border)" : "var(--gold)",
                color: sending ? "var(--text-dim)" : "var(--bg)",
                border: "none",
                borderRadius: 6,
                padding: "14px 24px",
                fontWeight: 600,
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              {sending ? "Sending..." : `Send ${sendAmount || "0"}`}
            </button>
          </div>
        </div>
      )}

      {tab === "deposit" && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 24,
          }}
        >
          <h3 style={{ color: "var(--text)", marginBottom: 16 }}>
            Deposit Funds
          </h3>
          <div style={{ display: "grid", gap: 16, maxWidth: 500 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: "var(--text-dim)",
                  marginBottom: 6,
                }}
              >
                AMOUNT (USD)
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text)",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: "var(--text-dim)",
                  marginBottom: 6,
                }}
              >
                METHOD
              </label>
              <select
                value={depositMethod}
                onChange={(e) => setDepositMethod(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text)",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14,
                }}
              >
                <option value="stripe">Credit/Debit Card (Stripe)</option>
                <option value="flutterwave_card">Card (Flutterwave)</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            {depositMethod === "mpesa" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    color: "var(--text-dim)",
                    marginBottom: 6,
                  }}
                >
                  PHONE NUMBER
                </label>
                <input
                  value={depositPhone}
                  onChange={(e) => setDepositPhone(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    color: "var(--text)",
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 14,
                  }}
                />
              </div>
            )}
            {depositMethod === "bank" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    color: "var(--text-dim)",
                    marginBottom: 6,
                  }}
                >
                  BANK NAME
                </label>
                <input
                  value={depositBankName}
                  onChange={(e) => setDepositBankName(e.target.value)}
                  placeholder="Bank name"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    color: "var(--text)",
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 14,
                  }}
                />
              </div>
            )}
            <button
              onClick={handleDeposit}
              disabled={
                sending ||
                !depositAmount ||
                (depositMethod === "mpesa" && !depositPhone) ||
                (depositMethod === "bank" && !depositBankName)
              }
              style={{
                background: sending ? "var(--border)" : "var(--blue)",
                color: sending ? "var(--text-dim)" : "var(--bg)",
                border: "none",
                borderRadius: 6,
                padding: "14px 24px",
                fontWeight: 600,
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              {sending
                ? "Creating deposit..."
                : `Deposit ${depositAmount || "0"}`}
            </button>
            {depositMessage ? (
              <div
                style={{
                  marginTop: 12,
                  color: "var(--text)",
                  fontSize: 13,
                  wordBreak: "break-word",
                }}
              >
                {depositMessage}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {tab === "withdraw" && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 24,
          }}
        >
          <h3 style={{ color: "var(--text)", marginBottom: 16 }}>
            Withdraw Funds
          </h3>
          <div style={{ display: "grid", gap: 16, maxWidth: 400 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: "var(--text-dim)",
                  marginBottom: 6,
                }}
              >
                AMOUNT (USD)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text)",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: "var(--text-dim)",
                  marginBottom: 6,
                }}
              >
                METHOD
              </label>
              <select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text)",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14,
                }}
              >
                <option value="stripe">Stripe (Bank Transfer)</option>
                <option value="mpesa">M-Pesa (Kenya)</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
              Fee: $1.50 (M-Pesa) or $2.00 (Stripe/Bank)
            </div>
            <button
              onClick={handleWithdraw}
              disabled={sending || !withdrawAmount}
              style={{
                background: sending ? "var(--border)" : "var(--green)",
                color: sending ? "var(--text-dim)" : "var(--bg)",
                border: "none",
                borderRadius: 6,
                padding: "14px 24px",
                fontWeight: 600,
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              {sending ? "Processing..." : `Withdraw ${withdrawAmount || "0"}`}
            </button>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 24,
          }}
        >
          <h3 style={{ color: "var(--text)", marginBottom: 16 }}>
            Transaction History
          </h3>
          {transactions.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "var(--text-dim)",
              }}
            >
              No transactions yet
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 12,
                    background: "var(--surface2)",
                    borderRadius: 6,
                  }}
                >
                  <div>
                    <div style={{ color: "var(--text)", fontSize: 13 }}>
                      {tx.description || tx.type}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 10,
                        color: "var(--text-dim)",
                      }}
                    >
                      {new Date(tx.createdAt).toLocaleDateString()} ·{" "}
                      {tx.status}
                    </div>
                  </div>
                  <div
                    style={{
                      color: tx.netAmount >= 0 ? "var(--green)" : "var(--red)",
                      fontWeight: 600,
                    }}
                  >
                    {tx.netAmount >= 0 ? "+" : ""}${tx.netAmount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
