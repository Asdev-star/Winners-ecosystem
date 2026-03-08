// src/features/profile/ProfilePage.tsx
// Phase 1 — Core Engine · User Profile
// Also serves as identity hub across all ecosystem layers
// Ecosystem design: CSS variables, card pattern, context bar, no Tailwind

import { useState, useEffect } from "react";
import { getAuthHeaders } from "../auth/authStore";
import { API_BASE } from "../../lib/api";
import TrustScoreBadge from "../../components/ui/TrustScoreBadge";
import ReputationPassport from "../../components/ui/ReputationPassport";
import ProgressRing from "../../components/ui/ProgressRing";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import AssistantPanel from "../../components/ui/AssistantPanel";
import CrossLayerHandoff from "../../components/ui/CrossLayerHandoff";
import { useAssistant } from "../../hooks/useAssistant";

const API = API_BASE;
function authHeaders() {
  return { "Content-Type": "application/json", ...getAuthHeaders() };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  skills?: string[];
  website?: string;
  twitter?: string;
  github?: string;
  avatarUrl?: string;
  joinedAt: string;
  postCount?: number;
  referralCode?: string;
}

const SKILL_SUGGESTIONS = [
  "React", "TypeScript", "Node.js", "Python", "AI/ML",
  "Product Design", "Marketing", "Finance", "Sales", "Strategy",
  "Copywriting", "Video Production", "SEO", "Data Analysis",
];

const SOCIAL_FIELDS: Array<{ key: "website" | "twitter" | "github"; label: string; placeholder: string }> = [
  { key: "website", label: "Website", placeholder: "https://yoursite.com" },
  { key: "twitter", label: "Twitter / X", placeholder: "@handle" },
  { key: "github", label: "GitHub", placeholder: "username" },
];

function initials(name: string, email: string) {
  const src = (name || email || "").trim();
  if (!src) return "??";
  return src.split(/\s|@/)[0].slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [form, setForm]           = useState<Partial<UserProfile>>({});
  const [skillInput, setSkillInput] = useState("");
  const [tab, setTab]             = useState<"profile" | "ecosystem" | "referral">("profile");

  // Level 4 AI Assistant hook
  const { sendMessage, messages, isLoading } = useAssistant({
    supervisor: "ARIA",
    autoGreeting: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API}/users/me`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        const data = await res.json();
        setProfile(data);
        setForm(data);
      } catch {
        // fallback to localStorage
        const raw = localStorage.getItem("we_user");
        const user = raw ? JSON.parse(raw) : null;
        if (user && (user.name || user.email)) {
          const fallback: UserProfile = {
            id: user.id ?? "",
            name: user.name ?? "",
            email: user.email ?? "",
            role: user.role ?? "viewer",
            joinedAt: user.joinedAt ?? new Date().toISOString(),
          };
          setProfile(fallback);
          setForm(fallback);
        } else {
          setProfile(null);
          setForm({});
        }
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${API}/users/me`, {
        method:  "PATCH",
        headers: authHeaders(),
        body:    JSON.stringify({ name: form.name, bio: form.bio, skills: form.skills, website: form.website, twitter: form.twitter, github: form.github }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill: string) => {
    const current = form.skills ?? [];
    if (current.includes(skill) || current.length >= 12) return;
    setForm((f) => ({ ...f, skills: [...current, skill] }));
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setForm((f) => ({ ...f, skills: (f.skills ?? []).filter((s) => s !== skill) }));
  };

  const ROLE_COLORS: Record<string, string> = {
    owner:  "var(--gold)",
    admin:  "var(--purple)",
    member: "var(--green)",
    viewer: "var(--ice)",
  };

  const platformAccess = [
    { name: "Core Engine",          icon: "⬡", status: "live",    desc: "Dashboard, Analytics, Billing, Team" },
    { name: "Winners Community",    icon: "🧑‍🤝‍🧑", status: "live",    desc: "Feed, Posts, Groups, Chat" },
    { name: "Winners Academy",      icon: "🎓", status: "soon",    desc: "Courses, Certificates, AI Tutor" },
    { name: "Winners Market",       icon: "🛒", status: "soon",    desc: "Products, Vendors, Commerce" },
    { name: "Winners Intelligence", icon: "🤖", status: "planned", desc: "AI Agents, Smart Automation" },
    { name: "Winners Work",         icon: "💼", status: "planned", desc: "Jobs, Freelance, Escrow" },
  ];

  const platformLayers = [
    { name: "Core", status: "live" },
    { name: "Community", status: "live" },
    { name: "Academy", status: "soon" },
    { name: "Market", status: "soon" },
    { name: "Intelligence", status: "planned" },
    { name: "Work", status: "planned" },
  ];

  if (!profile) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
        <div style={{ width: "28px", height: "28px", border: "2px solid var(--border)", borderTop: "2px solid var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Context bar */}
      <div style={s.contextBar}>
        {platformLayers.map((p) => (
          <div key={p.name} style={s.contextItem}>
            <div style={{ ...s.contextDot, background: p.status === "live" ? "var(--green)" : p.status === "soon" ? "var(--gold)" : "var(--border)" }} />
            <span style={{ color: p.name === "Core" ? "var(--gold)" : "var(--text-dim)" }}>{p.name}</span>
          </div>
        ))}
      </div>

      {/* Trust & Reputation */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <TrustScoreBadge score={75} />
        <ReputationPassport />
        <ProgressRing progress={60} size={60} />
      </div>

      {/* AI Components - Level 3-5 */}
      <AIInsightBanner page="dashboard" assistant="aria" />
      <AssistantPanel page="profile" assistant="aria" />
      <CrossLayerHandoff
        type="academy"
        title="Boost your profile"
        subtitle="Get certified to increase trust score"
        details={<p>Earn certificates from Winners Academy to enhance your reputation and unlock more opportunities.</p>}
        actionLabel="View Courses"
        loopStage={2}
      />

      {/* Profile hero card */}
      <div style={s.heroCard}>
        <div style={s.heroBorder} />
        <div style={s.heroInner}>
          {/* Avatar */}
          <div style={s.avatar}>
            {initials(profile.name, profile.email)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.heroName}>{profile.name || "Your Name"}</div>
            <div style={s.heroEmail}>{profile.email}</div>
            {profile.bio && <div style={s.heroBio}>{profile.bio}</div>}
            <div style={s.heroBadges}>
              <span style={{ ...s.roleBadge, color: ROLE_COLORS[profile.role] ?? "var(--text-dim)", background: "rgba(201,168,76,0.1)", borderColor: "rgba(201,168,76,0.25)" }}>
                {profile.role}
              </span>
              <span style={s.metaBadge}>
                Joined {new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
              {profile.postCount !== undefined && (
                <span style={s.metaBadge}>{profile.postCount} posts</span>
              )}
            </div>
            {/* Social links */}
            <div style={s.socialRow}>
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" style={s.socialLink}>🌐 Website</a>}
              {profile.twitter && <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" style={s.socialLink}>𝕏 {profile.twitter}</a>}
              {profile.github  && <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" style={s.socialLink}>⌥ {profile.github}</a>}
            </div>
          </div>
          <div>
            <button
              style={editing ? s.saveBtn : s.editBtn}
              onClick={() => editing ? save() : setEditing(true)}
              disabled={saving}
            >
              {saving ? "Saving..." : editing ? "Save Changes" : "Edit Profile"}
            </button>
            {editing && (
              <button style={s.cancelBtn} onClick={() => { setEditing(false); setForm(profile); }}>
                Cancel
              </button>
            )}
          </div>
        </div>
        {saved && (
          <div style={s.savedToast}>✓ Profile saved</div>
        )}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {(["profile", "ecosystem", "referral"] as const).map((t) => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === "profile" ? "👤 Profile" : t === "ecosystem" ? "⬡ Ecosystem Access" : "🎁 Referral"}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div style={s.twoCol}>
          {/* Edit form */}
          <div style={s.card}>
            <div style={s.cardBorder} />
            <div style={{ padding: "20px" }}>
              <div style={s.cardTitle}>{editing ? "Edit Profile" : "Profile Info"}</div>

              <div style={s.field}>
                <label style={s.label}>Full Name</label>
                {editing ? (
                  <input style={s.input} value={form.name ?? ""} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                ) : (
                  <div style={s.fieldValue}>{profile.name || <span style={{ color: "var(--text-dim)" }}>Not set</span>}</div>
                )}
              </div>

              <div style={s.field}>
                <label style={s.label}>Email</label>
                <div style={{ ...s.fieldValue, color: "var(--text-dim)" }}>{profile.email}</div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Bio</label>
                {editing ? (
                  <textarea
                    style={{ ...s.input, height: "80px", resize: "none" }}
                    value={form.bio ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell the community about yourself..."
                    maxLength={280}
                  />
                ) : (
                  <div style={s.fieldValue}>{profile.bio || <span style={{ color: "var(--text-dim)" }}>No bio yet</span>}</div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                  <div key={key} style={s.field}>
                    <label style={s.label}>{label}</label>
                    {editing ? (
                      <input
                        style={s.input}
                        value={form[key] ?? ""}
                        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                      />
                    ) : (
                      <div style={s.fieldValue}>
                        {profile[key] || <span style={{ color: "var(--text-dim)" }}>—</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skills card */}
          <div style={s.card}>
            <div style={s.cardBorder} />
            <div style={{ padding: "20px" }}>
              <div style={s.cardTitle}>Skills</div>
              <div style={s.skillsWrap}>
                {(editing ? form.skills : profile.skills ?? [])?.map((skill) => (
                  <div key={skill} style={s.skillTag}>
                    {skill}
                    {editing && (
                      <button style={s.skillRemove} onClick={() => removeSkill(skill)}>✕</button>
                    )}
                  </div>
                ))}
                {(!profile.skills || profile.skills.length === 0) && !editing && (
                  <div style={{ color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: "11px" }}>
                    No skills added yet
                  </div>
                )}
              </div>

              {editing && (
                <>
                  <div style={s.skillInputRow}>
                    <input
                      style={{ ...s.input, flex: 1 }}
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Type a skill and press Enter"
                      onKeyDown={(e) => { if (e.key === "Enter" && skillInput.trim()) addSkill(skillInput.trim()); }}
                    />
                    <button style={s.addSkillBtn} onClick={() => skillInput.trim() && addSkill(skillInput.trim())}>
                      Add
                    </button>
                  </div>
                  <div style={s.skillSuggestions}>
                    {SKILL_SUGGESTIONS.filter(s => !(form.skills ?? []).includes(s)).slice(0, 8).map((sug) => (
                      <button key={sug} style={s.suggestionTag} onClick={() => addSkill(sug)}>{sug}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ecosystem access tab */}
      {tab === "ecosystem" && (
        <div style={s.card}>
          <div style={s.cardBorder} />
          <div style={{ padding: "20px" }}>
            <div style={s.cardTitle}>Your Ecosystem Access</div>
            <p style={{ color: "var(--text-dim)", fontSize: "13px", marginBottom: "20px", lineHeight: "1.6" }}>
              One account. One identity. Access to all 6 platform layers as they go live.
            </p>
            <div style={s.platformList}>
              {platformAccess.map((p) => (
                <div key={p.name} style={s.platformRow}>
                  <div style={s.platformIcon}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={s.platformName}>{p.name}</div>
                    <div style={s.platformDesc}>{p.desc}</div>
                  </div>
                  <span style={{
                    ...s.statusBadge,
                    background: p.status === "live"    ? "rgba(45,212,160,0.1)" : p.status === "soon" ? "rgba(201,168,76,0.1)" : "rgba(90,122,150,0.1)",
                    borderColor: p.status === "live"   ? "rgba(45,212,160,0.25)" : p.status === "soon" ? "rgba(201,168,76,0.25)" : "var(--border)",
                    color: p.status === "live" ? "var(--green)" : p.status === "soon" ? "var(--gold)" : "var(--text-dim)",
                  }}>
                    {p.status === "live" ? "✓ Live" : p.status === "soon" ? "Coming Soon" : "Planned"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Referral tab */}
      {tab === "referral" && (
        <div style={s.card}>
          <div style={s.cardBorder} />
          <div style={{ padding: "20px" }}>
            <div style={s.cardTitle}>Referral Program</div>
            <p style={{ color: "var(--text-dim)", fontSize: "13px", marginBottom: "20px", lineHeight: "1.6" }}>
              Refer friends and earn $25 credit per paid conversion. No limit.
            </p>
            {profile.referralCode ? (
              <>
                <div style={s.referralBox}>
                  <div style={s.referralLabel}>Your referral link</div>
                  <div style={s.referralLink}>
                    {`${window.location.origin}/join/${profile.referralCode}`}
                  </div>
                  <button style={s.copyBtn} onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/join/${profile.referralCode}`);
                  }}>
                    Copy Link
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "16px" }}>
                  {[
                    { label: "Per Referral", val: "$25", color: "var(--gold)" },
                    { label: "Paid Out",     val: "$0",  color: "var(--green)" },
                    { label: "Referred",     val: "0",   color: "var(--ice)" },
                  ].map((stat) => (
                    <div key={stat.label} style={s.referralStat}>
                      <div style={{ fontSize: "24px", fontWeight: 800, color: stat.color }}>{stat.val}</div>
                      <div style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", color: "var(--text-dim)", marginTop: "3px" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: "11px" }}>
                Referral code not set up yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: "960px", margin: "0 auto", padding: "24px 20px 60px", fontFamily: "Syne, sans-serif" },
  contextBar: { display: "flex", alignItems: "center", gap: "16px", padding: "8px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", marginBottom: "24px", overflowX: "auto" },
  contextItem: { display: "flex", alignItems: "center", gap: "5px", fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" },
  contextDot: { width: "5px", height: "5px", borderRadius: "50%" },
  heroCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", position: "relative", marginBottom: "20px" },
  heroBorder: { position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, var(--gold), var(--ice), var(--purple))" },
  heroInner: { display: "flex", alignItems: "flex-start", gap: "20px", padding: "24px", flexWrap: "wrap" },
  avatar: { width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold), var(--blue))", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace", fontSize: "22px", fontWeight: 700, color: "var(--text)", flexShrink: 0 },
  heroName: { fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px" },
  heroEmail: { fontFamily: "Space Mono, monospace", fontSize: "10px", color: "var(--text-dim)", marginTop: "3px", letterSpacing: "0.3px" },
  heroBio: { fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.5", marginTop: "8px", maxWidth: "480px" },
  heroBadges: { display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", flexWrap: "wrap" },
  roleBadge: { fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase", padding: "2px 8px", borderRadius: "3px", border: "1px solid" },
  metaBadge: { fontFamily: "Space Mono, monospace", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.5px" },
  socialRow: { display: "flex", gap: "12px", marginTop: "10px", flexWrap: "wrap" },
  socialLink: { fontFamily: "Space Mono, monospace", fontSize: "10px", color: "var(--ice)", textDecoration: "none", letterSpacing: "0.3px" },
  editBtn: { padding: "9px 18px", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-dim)", fontFamily: "Syne, sans-serif", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" },
  saveBtn: { padding: "9px 18px", background: "var(--gold)", border: "none", borderRadius: "6px", color: "var(--bg)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap", display: "block", marginBottom: "6px" },
  cancelBtn: { padding: "7px 14px", background: "transparent", border: "none", color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: "10px", cursor: "pointer", width: "100%", marginTop: "4px" },
  savedToast: { background: "rgba(45,212,160,0.1)", borderTop: "1px solid rgba(45,212,160,0.2)", color: "var(--green)", fontFamily: "Space Mono, monospace", fontSize: "10px", padding: "8px 24px", letterSpacing: "0.5px" },
  tabs: { display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" },
  tab: { padding: "9px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: "10px", letterSpacing: "0.5px", cursor: "pointer" },
  tabActive: { background: "rgba(201,168,76,0.1)", borderColor: "var(--gold)", color: "var(--gold)" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", position: "relative", marginBottom: "14px" },
  cardBorder: { position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, var(--gold), var(--ice))" },
  cardTitle: { fontFamily: "Space Mono, monospace", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--gold)", marginBottom: "16px" },
  field: { marginBottom: "14px" },
  label: { fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-dim)", display: "block", marginBottom: "5px" },
  input: { width: "100%", padding: "9px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text)", fontFamily: "Syne, sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" },
  fieldValue: { fontSize: "13px", color: "var(--text)", lineHeight: "1.4" },
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px", minHeight: "32px" },
  skillTag: { display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", background: "rgba(43,95,142,0.15)", border: "1px solid rgba(43,95,142,0.3)", borderRadius: "4px", fontFamily: "Space Mono, monospace", fontSize: "10px", color: "var(--ice)", letterSpacing: "0.3px" },
  skillRemove: { background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "9px", padding: "0", lineHeight: 1 },
  skillInputRow: { display: "flex", gap: "6px", marginBottom: "10px" },
  addSkillBtn: { padding: "9px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: "10px", cursor: "pointer", whiteSpace: "nowrap" },
  skillSuggestions: { display: "flex", flexWrap: "wrap", gap: "5px" },
  suggestionTag: { padding: "3px 8px", background: "transparent", border: "1px solid var(--border)", borderRadius: "3px", color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: "9px", cursor: "pointer", letterSpacing: "0.3px" },
  platformList: { display: "flex", flexDirection: "column", gap: "2px" },
  platformRow: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid var(--border)" },
  platformIcon: { fontSize: "18px", flexShrink: 0, width: "32px", textAlign: "center" },
  platformName: { fontWeight: 600, fontSize: "13px", letterSpacing: "-0.2px" },
  platformDesc: { fontFamily: "Space Mono, monospace", fontSize: "9px", color: "var(--text-dim)", marginTop: "2px", letterSpacing: "0.3px" },
  statusBadge: { fontFamily: "Space Mono, monospace", fontSize: "9px", padding: "3px 8px", borderRadius: "3px", border: "1px solid", letterSpacing: "0.5px", whiteSpace: "nowrap" },
  referralBox: { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px" },
  referralLabel: { fontFamily: "Space Mono, monospace", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" },
  referralLink: { fontFamily: "Space Mono, monospace", fontSize: "11px", color: "var(--ice)", wordBreak: "break-all", marginBottom: "10px", lineHeight: "1.4" },
  copyBtn: { padding: "7px 16px", background: "var(--gold)", border: "none", borderRadius: "5px", color: "var(--bg)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "12px", cursor: "pointer" },
  referralStat: { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "14px", textAlign: "center" },
};
