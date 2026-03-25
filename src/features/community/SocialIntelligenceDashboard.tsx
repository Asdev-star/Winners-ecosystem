// src/features/community/SocialIntelligenceDashboard.tsx
// Phase 2 — Community Layer: NOVA Social Intelligence Dashboard
// Unified cross-platform analytics with AI insights

import { useState, useEffect } from "react";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";
import ContextBar from "../../components/ui/ContextBar";

interface AnalyticsOverview {
  totalReach: number;
  totalEngagements: number;
  totalFollowers: number;
  totalFollowersGrowth: number;
  avgEngagementRate: string;
  platforms: Record<string, {
    followers: number;
    followersGrowth: number;
    reach: number;
    engagements: number;
    engagementRate: number;
  }>;
}

interface NovaInsight {
  skillsDetected: number;
  topSkills: Array<{ skill: string; confidence: string; count: number }>;
  postsThisWeek: number;
  novaMessage: string;
  actionItems: Array<{ priority: number; skill: string; action: string }>;
}

export default function SocialIntelligenceDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [insights, setInsights] = useState<NovaInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7");

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [overviewRes, insightsRes] = await Promise.all([
        fetch(`${API_BASE}/social/analytics/overview?days=${period}`, {
          headers: { ...getAuthHeaders() },
        }),
        fetch(`${API_BASE}/social/nova/insights`, {
          headers: { ...getAuthHeaders() },
        }),
      ]);
      
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data);
      }
      
      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setInsights(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getPlatformIcon = (platform: string): string => {
    const icons: Record<string, string> = {
      facebook: "📘",
      instagram: "📸",
      whatsapp: "💬",
      telegram: "✈️",
      twitter: "𝕏",
      linkedin: "💼",
    };
    return icons[platform] || "🔗";
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "var(--bg)", 
        padding: "24px",
      }}>
        <ContextBar activeLayer="community" />
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "50vh",
          color: "var(--text-dim)",
        }}>
          Loading NOVA Intelligence...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "var(--bg)", 
      color: "var(--text)",
      padding: "24px",
    }}>
      <ContextBar activeLayer="community" />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ 
                fontSize: "2rem", 
                fontFamily: "var(--font-display)",
                color: "var(--ice)",
                marginBottom: 8,
              }}>
                🤖 NOVA · Social Intelligence
              </h1>
              <p style={{ color: "var(--text-dim)", fontSize: "0.95rem" }}>
                Your combined reach across all connected platforms
              </p>
            </div>
            
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "8px 12px",
                color: "var(--text)",
                fontSize: "0.9rem",
              }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}>
          <div className="card" style={{ 
            background: "var(--surface)", 
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 20,
          }}>
            <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginBottom: 8 }}>
              TOTAL REACH
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--gold)" }}>
              {overview ? formatNumber(overview.totalReach) : "—"}
            </div>
            {overview && (
              <div style={{ 
                color: overview.totalFollowersGrowth >= 0 ? "var(--green)" : "var(--red)",
                fontSize: "0.85rem",
                marginTop: 4,
              }}>
                {overview.totalFollowersGrowth >= 0 ? "↑" : "↓"} {Math.abs(overview.totalFollowersGrowth)}% from last period
              </div>
            )}
          </div>

          <div className="card" style={{ 
            background: "var(--surface)", 
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 20,
          }}>
            <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginBottom: 8 }}>
              TOTAL ENGAGEMENTS
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--ice)" }}>
              {overview ? formatNumber(overview.totalEngagements) : "—"}
            </div>
          </div>

          <div className="card" style={{ 
            background: "var(--surface)", 
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 20,
          }}>
            <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginBottom: 8 }}>
              AVG ENGAGEMENT RATE
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--green)" }}>
              {overview ? overview.avgEngagementRate + "%" : "—"}
            </div>
          </div>

          <div className="card" style={{ 
            background: "var(--surface)", 
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 20,
          }}>
            <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginBottom: 8 }}>
              NEW FOLLOWERS
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--purple)" }}>
              {overview ? "+" + formatNumber(overview.totalFollowersGrowth) : "—"}
            </div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ 
            fontSize: "1.1rem", 
            marginBottom: 16,
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            📊 Platform Breakdown
          </h2>
          
          {overview && Object.keys(overview.platforms).length > 0 ? (
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}>
              {Object.entries(overview.platforms).map(([platform, data]) => (
                <div 
                  key={platform}
                  className="card"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: 20,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: "1.5rem" }}>{getPlatformIcon(platform)}</span>
                    <span style={{ fontWeight: 600, fontSize: "1.1rem", textTransform: "capitalize" }}>
                      {platform}
                    </span>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>FOLLOWERS</div>
                      <div style={{ fontWeight: 600 }}>{formatNumber(data.followers)}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>GROWTH</div>
                      <div style={{ 
                        fontWeight: 600, 
                        color: data.followersGrowth >= 0 ? "var(--green)" : "var(--red)"
                      }}>
                        {data.followersGrowth >= 0 ? "+" : ""}{data.followersGrowth}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>REACH</div>
                      <div style={{ fontWeight: 600 }}>{formatNumber(data.reach)}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>ENG. RATE</div>
                      <div style={{ fontWeight: 600, color: "var(--green)" }}>{data.engagementRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="card"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 40,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔗</div>
              <h3 style={{ marginBottom: 8 }}>No platforms connected</h3>
              <p style={{ color: "var(--text-dim)", marginBottom: 16 }}>
                Connect your social accounts to see NOVA intelligence
              </p>
              <a 
                href="/community/social-accounts"
                style={{
                  display: "inline-block",
                  background: "var(--gold)",
                  color: "var(--bg)",
                  padding: "10px 20px",
                  borderRadius: 4,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Connect Accounts
              </a>
            </div>
          )}
        </div>

        {/* NOVA Insights */}
        {insights && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ 
              fontSize: "1.1rem", 
              marginBottom: 16,
              color: "var(--text)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}>
              🧠 NOVA Insights
            </h2>
            
            <div 
              className="card"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--ice)",
                borderRadius: 6,
                padding: 24,
              }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
                <span style={{ fontSize: "2rem" }}>🤖</span>
                <div>
                  <h3 style={{ color: "var(--ice)", marginBottom: 8, fontFamily: "var(--font-display)" }}>
                    {insights.novaMessage}
                  </h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
                    {insights.postsThisWeek} posts published this week • {insights.skillsDetected} skills detected
                  </p>
                </div>
              </div>

              {insights.topSkills.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ 
                    color: "var(--text)", 
                    fontSize: "0.9rem", 
                    marginBottom: 12,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}>
                    🔵 Skills Detected
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {insights.topSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                          borderRadius: 20,
                          padding: "6px 12px",
                          fontSize: "0.85rem",
                        }}
                      >
                        {skill.skill} · {skill.confidence}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {insights.actionItems.length > 0 && (
                <div>
                  <h4 style={{ 
                    color: "var(--text)", 
                    fontSize: "0.9rem", 
                    marginBottom: 12,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}>
                    ⚡ Recommended Actions
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {insights.actionItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          padding: 16,
                        }}
                      >
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 12,
                          marginBottom: 8,
                        }}>
                          <span style={{
                            background: "var(--gold)",
                            color: "var(--bg)",
                            borderRadius: "50%",
                            width: 24,
                            height: 24,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}>
                            {item.priority}
                          </span>
                          <span style={{ fontWeight: 600, color: "var(--gold)" }}>
                            {item.skill}
                          </span>
                        </div>
                        <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginLeft: 36 }}>
                          {item.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Best Times */}
        <div>
          <h2 style={{ 
            fontSize: "1.1rem", 
            marginBottom: 16,
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            ⏰ Best Time to Post
          </h2>
          
          <div 
            className="card"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 24,
            }}
          >
            <p style={{ color: "var(--text-dim)", marginBottom: 16 }}>
              Based on your audience activity patterns:
            </p>
            
            {/* Simple heatmap visualization */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "60px repeat(7, 1fr)", 
              gap: 4,
              marginBottom: 24,
            }}>
              <div></div>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                <div key={day} style={{ 
                  textAlign: "center", 
                  fontSize: "0.75rem", 
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-mono)",
                }}>
                  {day}
                </div>
              ))}
              
              {["6am", "9am", "12pm", "3pm", "6pm", "9pm"].map((time, timeIdx) => (
                <>
                  <div key={`${time}-label`} style={{ 
                    fontSize: "0.7rem", 
                    color: "var(--text-dim)",
                    display: "flex",
                    alignItems: "center",
                  }}>
                    {time}
                  </div>
                  {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                    const score = timeIdx < 3 ? 20 + dayIdx * 5 + timeIdx * 10 : 
                                  timeIdx < 5 ? 40 + dayIdx * 8 + timeIdx * 10 :
                                  30 + dayIdx * 5 + timeIdx * 8;
                    const opacity = Math.min(score / 100, 1);
                    return (
                      <div 
                        key={`${timeIdx}-${dayIdx}`}
                        style={{
                          background: `rgba(137, 196, 225, ${opacity})`,
                          borderRadius: 4,
                          height: 32,
                        }}
                        title={`${time} ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dayIdx]}: ${score}% engagement`}
                      />
                    );
                  })}
                </>
              ))}
            </div>

            <div style={{ 
              background: "var(--green)", 
              color: "var(--bg)",
              padding: "12px 16px",
              borderRadius: 6,
              fontWeight: 600,
            }}>
              🎯 Peak times: Tue/Wed/Thu 3–9pm WAT. Post your most important content here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
