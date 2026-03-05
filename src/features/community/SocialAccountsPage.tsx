// src/features/community/SocialAccountsPage.tsx
// Phase 2 — Community Layer: Social Media Integrations
// Connect and manage Facebook, Instagram, WhatsApp, Telegram, X, LinkedIn

import { useState, useEffect } from "react";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";
import ContextBar from "../../components/ui/ContextBar";

interface SocialAccount {
  id: string;
  platform: string;
  platformId: string;
  username: string | null;
  displayName: string | null;
  profileImage: string | null;
  pageId: string | null;
  pageName: string | null;
  lastSynced: string | null;
  createdAt: string;
}

const PLATFORM_CONFIG: Record<string, { name: string; icon: string; color: string; description: string }> = {
  facebook: { name: "Facebook", icon: "📘", color: "#1877F2", description: "Page insights, cross-posting, analytics" },
  instagram: { name: "Instagram", icon: "📸", color: "#E4405F", description: "Reels, stories, audience insights" },
  whatsapp: { name: "WhatsApp", icon: "💬", color: "#25D366", description: "Broadcast lists, notifications" },
  telegram: { name: "Telegram", icon: "✈️", color: "#0088CC", description: "Channel posts, bot commands" },
  twitter: { name: "X (Twitter)", icon: "𝕏", color: "#000000", description: "Threads, analytics, engagement" },
  messenger: { name: "Messenger", icon: "💭", color: "#0064FF", description: "Notifications, broadcasts" },
  linkedin: { name: "LinkedIn", icon: "💼", color: "#0A66C2", description: "Professional posts, certificate sharing" },
  tiktok: { name: "TikTok", icon: "🎵", color: "#000000", description: "Video cross-posting, analytics" },
  youtube: { name: "YouTube", icon: "▶️", color: "#FF0000", description: "Video embedding, channel analytics" },
  threads: { name: "Threads", icon: "🧵", color: "#000000", description: "Cross-posting from Meta" },
};

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/social/accounts`, {
        headers: { ...getAuthHeaders() },
      });
      if (!response.ok) throw new Error("Failed to fetch accounts");
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      setConnecting(platform);
      const response = await fetch(`${API_BASE}/social/accounts/connect/demo`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeaders() 
        },
        body: JSON.stringify({ 
          platform, 
          username: `demo_${platform}_${Date.now()}` 
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to connect");
      }
      
      const newAccount = await response.json();
      setAccounts([...accounts, newAccount]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;
    
    try {
      const response = await fetch(`${API_BASE}/social/accounts/${accountId}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });
      
      if (!response.ok) throw new Error("Failed to disconnect");
      
      setAccounts(accounts.filter((a) => a.id !== accountId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  const handleSync = async (accountId: string) => {
    try {
      const response = await fetch(`${API_BASE}/social/accounts/${accountId}/sync`, {
        method: "POST",
        headers: { ...getAuthHeaders() },
      });
      
      if (!response.ok) throw new Error("Failed to sync");
      
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync");
    }
  };

  const connectedPlatforms = accounts.map((a) => a.platform);

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "var(--bg)", 
      color: "var(--text)",
      padding: "24px",
    }}>
      <ContextBar activeLayer="community" />

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ 
            fontSize: "2rem", 
            fontFamily: "var(--font-display)",
            color: "var(--gold)",
            marginBottom: 8,
          }}>
            🔗 Connect Your Social Accounts
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: "0.95rem" }}>
            Link your social platforms to enable NOVA cross-platform intelligence, 
            cross-posting, and unified analytics.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(224, 90, 78, 0.1)",
            border: "1px solid var(--red)",
            borderRadius: 6,
            padding: "12px 16px",
            marginBottom: 24,
            color: "var(--red)",
          }}>
            {error}
            <button 
              onClick={() => setError(null)}
              style={{ 
                marginLeft: 16, 
                background: "none", 
                border: "none", 
                color: "var(--red)", 
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Connected Accounts */}
        {accounts.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ 
              fontSize: "1.1rem", 
              marginBottom: 16,
              color: "var(--text)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}>
              ⚡ Connected Accounts
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {accounts.map((account) => {
                const config = PLATFORM_CONFIG[account.platform] || {
                  name: account.platform,
                  icon: "🔗",
                  color: "var(--gold)",
                  description: "",
                };
                
                return (
                  <div
                    key={account.id}
                    className="card"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: config.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                    }}>
                      {config.icon}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: 600, 
                        fontSize: "1rem",
                        color: "var(--text)",
                      }}>
                        {config.name}
                      </div>
                      <div style={{ 
                        color: "var(--text-dim)", 
                        fontSize: "0.85rem",
                      }}>
                        @{account.username} • Last synced: {account.lastSynced 
                          ? new Date(account.lastSynced).toLocaleString() 
                          : "Never"}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleSync(account.id)}
                        style={{
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                          borderRadius: 4,
                          padding: "8px 12px",
                          color: "var(--text)",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        🔄 Sync
                      </button>
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        style={{
                          background: "transparent",
                          border: "1px solid var(--red)",
                          borderRadius: 4,
                          padding: "8px 12px",
                          color: "var(--red)",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Platforms */}
        <div>
          <h2 style={{ 
            fontSize: "1.1rem", 
            marginBottom: 16,
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            🌍 Available Platforms
          </h2>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
              const isConnected = connectedPlatforms.includes(key);
              const isConnecting = connecting === key;
              
              return (
                <div
                  key={key}
                  className="card"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: 20,
                    opacity: isConnected ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: "1.75rem" }}>{config.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text)" }}>
                      {config.name}
                    </span>
                  </div>
                  
                  <p style={{ 
                    color: "var(--text-dim)", 
                    fontSize: "0.85rem", 
                    marginBottom: 16,
                    lineHeight: 1.5,
                  }}>
                    {config.description}
                  </p>
                  
                  {isConnected ? (
                    <div style={{
                      background: "var(--green)",
                      color: "var(--bg)",
                      padding: "8px 12px",
                      borderRadius: 4,
                      textAlign: "center",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                    }}>
                      ✓ Connected
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(key)}
                      disabled={isConnecting}
                      style={{
                        width: "100%",
                        background: isConnecting ? "var(--surface2)" : "var(--gold)",
                        color: isConnecting ? "var(--text)" : "var(--bg)",
                        border: "none",
                        borderRadius: 4,
                        padding: "10px 16px",
                        fontWeight: 600,
                        cursor: isConnecting ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        transition: "opacity 0.2s ease",
                      }}
                    >
                      {isConnecting ? "Connecting..." : "Connect"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* NOVA Info */}
        <div
          className="card"
          style={{
            marginTop: 32,
            background: "var(--surface)",
            border: "1px solid var(--ice)",
            borderRadius: 6,
            padding: 24,
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <span style={{ fontSize: "2rem" }}>🤖</span>
            <div>
              <h3 style={{ 
                color: "var(--ice)", 
                fontSize: "1.1rem", 
                marginBottom: 8,
                fontFamily: "var(--font-display)",
              }}>
                NOVA Social Intelligence
              </h3>
              <p style={{ 
                color: "var(--text-dim)", 
                fontSize: "0.9rem", 
                lineHeight: 1.6,
                marginBottom: 12,
              }}>
                Once connected, NOVA will automatically analyze your social activity 
                to detect skills, track performance across platforms, and recommend 
                the best times to post.
              </p>
              <p style={{ 
                color: "var(--text-dim)", 
                fontSize: "0.85rem",
                fontStyle: "italic",
              }}>
                🔒 Tokens are encrypted. We never post to your accounts without your permission.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
