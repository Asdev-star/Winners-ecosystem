import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSuperAdminAccess } from "../../app/useSuperAdminAccess";
import { useAuthStore, getAuthHeaders } from "../auth/authStore";
import { CrossAppSsoActions } from "../auth/CrossAppSsoActions";
import { useInviteStore } from "../team/inviteStore";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ContextBar from "../../components/ui/ContextBar";
import FourDocumentsBlueprint from "../../components/docs/FourDocumentsBlueprint";
import { useAssistant } from "../../hooks/useAssistant";
import { API_BASE } from "../../lib/api";
import { ACCOUNT_BRANCH } from "./sections/AccountSettings";
import { COMMUNITY_BRANCH } from "./sections/CommunitySettings";
import { ACADEMY_BRANCH } from "./sections/AcademySettings";
import { MARKET_BRANCH } from "./sections/MarketSettings";
import { WORK_BRANCH } from "./sections/WorkSettings";
import { INTELLIGENCE_BRANCH } from "./sections/IntelligenceSettings";

const API = API_BASE;
const TIMEZONES = ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo", "Africa/Nairobi", "Africa/Lagos"];
const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "KES", label: "KES - Kenyan Shilling" },
  { value: "NGN", label: "NGN - Nigerian Naira" },
];
const FISCAL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type SettingOption = string | { value: string; label: string; desc?: string };
type SettingConfig = {
  label: string;
  description?: string;
  desc?: string;
  type?: string;
  options?: SettingOption[];
  current?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  plan?: string;
};

type SettingValue = string | number | boolean;
type BranchValues = Record<string, Record<string, SettingValue>>;
type ProfilePayload = {
  profile: {
    id: string;
    name: string;
    email: string;
    role: string;
    country?: string | null;
    city?: string | null;
    bio?: string | null;
    metadata?: Record<string, unknown>;
  };
};

type BranchSection = {
  id: string;
  label: string;
  title: string;
  keys: string[];
};

type BranchConfig = {
  key: string;
  icon: string;
  navLabel: string;
  path: string;
  title: string;
  kicker: string;
  description: string;
  settings: Record<string, SettingConfig>;
  sections: BranchSection[];
};

const BRANCHES: BranchConfig[] = [ACCOUNT_BRANCH, COMMUNITY_BRANCH, ACADEMY_BRANCH, MARKET_BRANCH, WORK_BRANCH, INTELLIGENCE_BRANCH];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:wght@500;600;700&display=swap');
.st-root{min-height:100vh;padding:24px 24px 80px;color:var(--text);font-family:'Syne',sans-serif}
.st-shell{max-width:1320px;margin:0 auto;border:1px solid rgba(201,168,76,.16);border-radius:28px;overflow:hidden;background:radial-gradient(circle at top right,rgba(201,168,76,.12),transparent 34%),linear-gradient(180deg,rgba(8,14,23,.99),rgba(12,20,31,.97));box-shadow:0 28px 90px rgba(0,0,0,.34)}
.st-top,.st-body{padding:24px}.st-top{border-bottom:1px solid rgba(255,255,255,.06);background:rgba(6,12,20,.78)}.st-body{display:grid;gap:18px}
.st-kicker,.st-meta,.st-chip,.st-link,.st-label,.st-feedback{font-family:'Space Mono',monospace}
.st-kicker,.st-meta{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
.st-title{margin:10px 0 0;font-family:'Cormorant Garamond',serif;font-size:clamp(34px,5vw,54px);line-height:.95;color:#f6efdc}
.st-copy,.st-sub{margin:10px 0 0;color:var(--text-dim);font-size:14px;line-height:1.75}.st-sub{max-width:820px}
.st-actions,.st-btn-row,.st-chip-row{display:flex;gap:10px;flex-wrap:wrap}
.st-hero,.st-section,.st-card,.st-form-card,.st-stat,.st-nav,.st-content{border:1px solid rgba(255,255,255,.08);border-radius:22px;background:rgba(255,255,255,.03)}
.st-hero,.st-section,.st-form-card,.st-nav,.st-content{padding:20px}.st-card,.st-stat{padding:16px}
.st-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:999px;text-decoration:none;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text-dim);font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.st-link.primary,.st-link.active{border-color:rgba(201,168,76,.32);background:rgba(201,168,76,.1);color:var(--gold)}
.st-chip{display:inline-flex;align-items:center;min-height:26px;padding:0 10px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:var(--text-dim);font-size:10px;letter-spacing:.08em;text-transform:uppercase}
.st-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.st-stat-value{margin-top:8px;font-size:28px;font-weight:800;color:var(--gold)}
.st-layout{display:grid;grid-template-columns:200px minmax(0,1fr);gap:18px;align-items:start}
.st-nav{position:sticky;top:20px}
.st-nav-group{display:grid;gap:8px}
.st-nav-divider{height:1px;background:rgba(255,255,255,.08);margin:14px 0}
.st-nav-link,.st-nav-sub{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;text-decoration:none;border:1px solid rgba(255,255,255,.04);color:var(--text-dim);background:transparent}
.st-nav-link.active,.st-nav-sub.active{border-color:rgba(201,168,76,.24);background:rgba(201,168,76,.1);color:#f6efdc}
.st-nav-icon{width:18px;text-align:center}
.st-nav-label{font-size:13px;font-weight:700}
.st-nav-sub{padding:8px 12px;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.04em}
.st-content{display:grid;gap:14px}
.st-card-grid,.st-form-grid,.st-section-grid{display:grid;gap:14px}
.st-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.st-form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.st-section-grid.compact{grid-template-columns:repeat(2,minmax(0,1fr))}
.st-section-grid.full{grid-template-columns:1fr}
.st-card-title,.st-form-title,.st-section-title{font-weight:700}.st-section-title{font-size:24px}.st-form-title,.st-card-title{font-size:15px}
.st-field{margin-top:16px}.st-label{display:block;margin-bottom:6px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim)}
.st-input,.st-select,.st-textarea{width:100%;box-sizing:border-box;padding:11px 14px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,.04);color:var(--text);outline:none;font-family:'Space Mono',monospace;font-size:12px}
.st-textarea{min-height:108px;resize:vertical}
.st-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.st-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 16px;border-radius:999px;border:1px solid rgba(201,168,76,.24);background:rgba(201,168,76,.12);color:var(--gold);cursor:pointer;font-size:13px;font-weight:700}
.st-btn.ghost{border-color:var(--border);background:transparent;color:var(--text-dim)}.st-btn.danger{border-color:rgba(224,90,78,.36);background:rgba(224,90,78,.08);color:var(--red)}
.st-range{width:100%;accent-color:var(--gold)}
.st-setting-value{margin-top:10px;padding:10px 12px;border-radius:12px;border:1px solid rgba(201,168,76,.16);background:rgba(201,168,76,.06);color:#f6efdc;font-family:'Space Mono',monospace;font-size:12px}
.st-option-list{display:grid;gap:8px;margin-top:12px}
.st-option{padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03)}
.st-option.active{border-color:rgba(201,168,76,.24);background:rgba(201,168,76,.08)}
.st-option-label{font-size:12px;font-weight:700;color:var(--text)}
.st-option-desc{margin-top:4px;font-size:11px;line-height:1.55;color:var(--text-dim)}
.st-section-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
.st-section-copy{max-width:760px}
.st-save-row{display:flex;justify-content:flex-end}
.st-feedback{margin-top:12px;font-size:11px}.st-feedback.success{color:var(--green)}.st-feedback.error{color:var(--red)}
@media (max-width:1100px){.st-layout{grid-template-columns:1fr}.st-nav{position:static}.st-stats,.st-card-grid,.st-form-grid,.st-section-grid.compact{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:760px){.st-root{padding:16px 14px 84px}.st-top,.st-body{padding:16px}.st-stats,.st-card-grid,.st-form-grid,.st-section-grid.compact,.st-row{grid-template-columns:1fr}.st-title{font-size:38px}}
`;

function getOptionValue(option: SettingOption) {
  return typeof option === "string" ? option : option.value;
}

function getOptionLabel(option: SettingOption) {
  return typeof option === "string" ? option : option.label;
}

function getOptionDescription(option: SettingOption) {
  return typeof option === "string" ? undefined : option.desc;
}

function getSliderValue(setting: SettingConfig) {
  if (setting.options?.length) {
    const index = setting.options.findIndex((option) => getOptionValue(option) === setting.current);
    return index >= 0 ? index : 0;
  }
  return typeof setting.current === "number" ? setting.current : setting.min ?? 0;
}

function getDefaultBranchValues(settings: Record<string, SettingConfig>, planName: string) {
  return Object.entries(settings).reduce<Record<string, SettingValue>>((acc, [key, setting]) => {
    if (setting.type === "display" && setting.label === "Current Plan") {
      acc[key] = planName;
      return acc;
    }
    if (setting.current !== undefined) {
      acc[key] = setting.current;
    }
    return acc;
  }, {});
}

function metadataObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, unknown>;
  return value as Record<string, unknown>;
}

function settingMetadataObject(value: unknown): Record<string, SettingValue> {
  const metadata = metadataObject(value);
  return Object.fromEntries(
    Object.entries(metadata).filter(([, entry]) =>
      typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean",
    ),
  ) as Record<string, SettingValue>;
}

function getProfileLocation(profile?: ProfilePayload["profile"] | null) {
  const metadata = metadataObject(profile?.metadata);
  const profileMeta = metadataObject(metadata.profile);
  const explicit = typeof profileMeta.location === "string" ? profileMeta.location : "";
  if (explicit) return explicit;
  return [profile?.city, profile?.country].filter(Boolean).join(", ");
}

function getProfileWebsite(profile?: ProfilePayload["profile"] | null) {
  const metadata = metadataObject(profile?.metadata);
  const profileMeta = metadataObject(metadata.profile);
  return typeof profileMeta.website === "string" ? profileMeta.website : "";
}

function buildInitialBranchValues(planName: string, tenant: { settings?: { timezone?: string; currency?: string } } | null, userName?: string | null, userBio?: string | null, profile?: ProfilePayload["profile"] | null) {
  const metadata = metadataObject(profile?.metadata);
  const preferences = metadataObject(metadata.preferences);

  const branchValues = BRANCHES.reduce<BranchValues>((acc, branch) => {
    acc[branch.key] = {
      ...getDefaultBranchValues(branch.settings, planName),
      ...settingMetadataObject(preferences[branch.key]),
    };
    return acc;
  }, {} as BranchValues);

  branchValues.account = {
    ...branchValues.account,
    displayName: userName ?? "",
    bio: userBio ?? "",
    location: getProfileLocation(profile),
    website: getProfileWebsite(profile),
    timezone: typeof branchValues.account.timezone === "string" ? branchValues.account.timezone : (tenant?.settings?.timezone ?? "UTC"),
    currency: typeof branchValues.account.currency === "string" ? branchValues.account.currency : (tenant?.settings?.currency ?? "USD"),
    currentPlan: planName,
  };

  return branchValues;
}

function renderSettingControl(
  settingKey: string,
  setting: SettingConfig,
  value: SettingValue | undefined,
  disabled: boolean,
  planName: string,
  onChange: (value: SettingValue) => void,
  onAction: (settingKey: string, setting: SettingConfig) => void,
) {
  if (setting.type === "toggle") {
    return (
      <button
        className={`st-btn ${value ? "" : "ghost"}`}
        style={{ width: "100%", justifyContent: "space-between" }}
        disabled={disabled}
        type="button"
        onClick={() => onChange(!value)}
      >
        <span>{setting.label}</span>
        <span>{value ? "ON" : "OFF"}</span>
      </button>
    );
  }

  if (setting.type === "action" || setting.type === "danger") {
    return (
      <button
        className={`st-btn ${setting.type === "danger" ? "danger" : "ghost"}`}
        style={{ width: "100%" }}
        disabled={disabled}
        type="button"
        onClick={() => onAction(settingKey, setting)}
      >
        {setting.label}
      </button>
    );
  }

  if (setting.type === "display") {
    return <div className="st-setting-value">{setting.label === "Current Plan" ? planName : String(value ?? setting.current ?? "Not set")}</div>;
  }

  if (setting.type === "textarea") {
    return <textarea className="st-textarea" value={String(value ?? "")} disabled={disabled} maxLength={setting.maxLength} onChange={(event) => onChange(event.target.value)} />;
  }

  if (setting.type === "slider") {
    const sliderValue = setting.options?.length
      ? setting.options.findIndex((option) => getOptionValue(option) === value)
      : typeof value === "number"
        ? value
        : getSliderValue(setting);
    const min = setting.options?.length ? 0 : setting.min ?? 0;
    const max = setting.options?.length ? setting.options.length - 1 : setting.max ?? 100;
    const step = setting.options?.length ? 1 : setting.step ?? 1;
    const displayValue = setting.options?.length
      ? getOptionLabel(setting.options[Math.min(Number(sliderValue), setting.options.length - 1)])
      : String(value ?? setting.current ?? sliderValue);

    return (
      <>
        <input
          className="st-range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={Number(sliderValue) < 0 ? 0 : Number(sliderValue)}
          disabled={disabled}
          onChange={(event) => onChange(setting.options?.length ? getOptionValue(setting.options[Number(event.target.value)]) : Number(event.target.value))}
        />
        <div className="st-setting-value">{displayValue}</div>
      </>
    );
  }

  if (setting.type === "number") {
    return (
      <input
        className="st-input"
        type="number"
        min={setting.min}
        max={setting.max}
        step={setting.step}
        value={typeof value === "number" ? value : ""}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    );
  }

  if (setting.options) {
    return (
      <>
        <select className="st-select" value={String(value ?? "")} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
          {setting.options.map((option) => (
            <option key={getOptionValue(option)} value={getOptionValue(option)}>
              {getOptionLabel(option)}
            </option>
          ))}
        </select>
        {setting.options.some((option) => Boolean(getOptionDescription(option))) ? (
          <div className="st-option-list">
            {setting.options.map((option) => {
              const optionValue = getOptionValue(option);
              const description = getOptionDescription(option);
              return (
                <div key={optionValue} className={`st-option${optionValue === value ? " active" : ""}`}>
                  <div className="st-option-label">{getOptionLabel(option)}</div>
                  {description ? <div className="st-option-desc">{description}</div> : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <input
      className="st-input"
      type={setting.type || "text"}
      value={typeof value === "boolean" ? String(value) : String(value ?? "")}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const { hasAccess: hasSuperAdminAccess } = useSuperAdminAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant, fetchTenant, updateTenant } = useInviteStore();

  const [profile, setProfile] = useState<ProfilePayload["profile"] | null>(null);
  const [branchValues, setBranchValues] = useState<BranchValues>({});
  const [wsName, setWsName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");
  const [fiscal, setFiscal] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [branchSaving, setBranchSaving] = useState(false);
  const [branchMsg, setBranchMsg] = useState("");
  const [activeSectionId, setActiveSectionId] = useState("");

  const { messages, isLoading } = useAssistant({ supervisor: "ARIA", autoGreeting: true });

  useEffect(() => {
    const id = "st-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => document.getElementById(id)?.remove();
  }, []);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`${API}/profile`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to load profile.");
        const data = await res.json() as ProfilePayload;
        setProfile(data.profile);
      } catch {
        setProfile(null);
      }
    };

    void loadProfile();
  }, []);

  useEffect(() => {
    if (!tenant) return;
    setWsName(tenant.name);
    setCurrency(tenant.settings?.currency ?? "USD");
    setTimezone(tenant.settings?.timezone ?? "UTC");
    setFiscal(tenant.settings?.fiscalMonth ?? 1);
  }, [tenant]);

  const activeBranch = useMemo(() => {
    return BRANCHES.find((branch) => branch.path === location.pathname) ?? BRANCHES[0];
  }, [location.pathname]);

  const canManage = user?.role === "owner" || user?.role === "admin";
  const planName = (tenant?.plan ?? "FREE").toUpperCase();
  const planPrice = planName === "PRO" ? "$99/mo" : planName === "ENTERPRISE" ? "Custom" : "Free";
  const assistantSummary = isLoading ? "ARIA is refreshing guidance for your settings graph." : (messages[0]?.content ?? "ARIA can help tune settings across every layer.");

  useEffect(() => {
    const firstSection = activeBranch.sections[0]?.id ?? "";
    setActiveSectionId(firstSection);
  }, [activeBranch]);

  useEffect(() => {
    if (!tenant) return;
    setBranchValues(buildInitialBranchValues(planName, tenant, user?.name, user?.bio ?? profile?.bio ?? null, profile));
  }, [planName, profile, tenant, user?.bio, user?.name]);

  useEffect(() => {
    const sectionIds = activeBranch.sections.map((section) => section.id);
    if (!sectionIds.length) return;

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);

        if (visible[0]?.target?.id) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0.2, 0.5, 0.8] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [activeBranch]);

  const handleBranchValueChange = (branchKey: string, settingKey: string, value: SettingValue) => {
    setBranchValues((current) => ({
      ...current,
      [branchKey]: {
        ...(current[branchKey] ?? {}),
        [settingKey]: value,
      },
    }));
  };

  const handleSettingAction = (settingKey: string, setting: SettingConfig) => {
    if (setting.type === "danger" && settingKey === "deleteAccount") {
      void (async () => {
        const confirmed = confirm("This will delete your account. Continue?");
        if (!confirmed) return;
        try {
          const res = await fetch(`${API}/profile`, { method: "DELETE", headers: getAuthHeaders() });
          if (!res.ok) throw new Error();
          logout();
          navigate("/login");
        } catch {
          setBranchMsg("Failed to delete account.");
        }
      })();
      return;
    }

    if (settingKey === "changePassword") {
      navigate("/forgot-password");
      return;
    }

    if (settingKey === "enable2FA") {
      navigate("/2fa");
      return;
    }

    if (settingKey === "manageBilling" || settingKey === "viewInvoices" || settingKey === "cancelSubscription") {
      navigate("/billing");
      return;
    }

    if (settingKey === "exportData") {
      navigate("/export");
      return;
    }

    setBranchMsg(`${setting.label} is not wired to a dedicated flow yet.`);
    setTimeout(() => setBranchMsg(""), 3000);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      await updateTenant({ name: wsName, settings: { timezone, currency, fiscalMonth: fiscal } });
      setSaveMsg("Workspace settings saved.");
    } catch {
      setSaveMsg("Failed to save settings.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3500);
    }
  };

  const handleSaveBranch = async () => {
    setBranchSaving(true);
    setBranchMsg("");

    try {
      if (activeBranch.key === "account") {
        const accountValues = branchValues.account ?? {};
        const accountPreferences = Object.entries(accountValues).reduce<Record<string, SettingValue>>((acc, [key, value]) => {
          if (["displayName", "bio", "location", "website", "currentPlan"].includes(key)) return acc;
          acc[key] = value;
          return acc;
        }, {});

        const res = await fetch(`${API}/profile`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            name: String(accountValues.displayName ?? ""),
            bio: String(accountValues.bio ?? ""),
            location: String(accountValues.location ?? ""),
            website: String(accountValues.website ?? ""),
            preferences: { account: accountPreferences },
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message ?? "Failed to save account settings.");

        setProfile(data.user ? { ...(profile ?? {}), ...data.user } as ProfilePayload["profile"] : profile);
        updateUser({
          name: String(accountValues.displayName ?? user?.name ?? ""),
          bio: String(accountValues.bio ?? user?.bio ?? ""),
        });
      } else {
        const res = await fetch(`${API}/profile`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            preferences: {
              [activeBranch.key]: branchValues[activeBranch.key] ?? {},
            },
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message ?? `Failed to save ${activeBranch.title}.`);
        setProfile(data.user ? { ...(profile ?? {}), ...data.user } as ProfilePayload["profile"] : profile);
      }

      setBranchMsg(`${activeBranch.title} saved.`);
    } catch (error) {
      setBranchMsg(error instanceof Error ? error.message : `Failed to save ${activeBranch.title}.`);
    } finally {
      setBranchSaving(false);
      setTimeout(() => setBranchMsg(""), 3500);
    }
  };

  const handleDeleteWorkspace = async () => {
    const confirmDelete = confirm("This will permanently delete your workspace and all data. Are you sure?");
    if (!confirmDelete) return;
    const typedName = prompt(`Type your workspace name "${wsName}" to confirm:`);
    if (typedName !== wsName) {
      alert("Name did not match. Deletion cancelled.");
      return;
    }
    try {
      await fetch(`${API}/tenants/me`, { method: "DELETE", headers: getAuthHeaders() });
      logout();
      navigate("/login");
    } catch {
      alert("Deletion failed. Please try again.");
    }
  };

  return (
    <div className="st-root">
      <style>{css}</style>
      <ContextBar activeLayer="core" statusOverrides={{ core: "live", community: "live", academy: "active", market: "active", work: "active", intelligence: "active" }} showLabels={true} />
      <div className="st-shell" id="top">
        <div className="st-top">
          <div className="st-kicker">Settings / Hierarchical Architecture</div>
          <h1 className="st-title">Ecosystem Settings</h1>
          <AIInsightBanner page="settings" assistant="aria" />
          <AssistantPanel page="settings" assistant="aria" />
          <p className="st-sub">
            User settings now live as dedicated branches under the shared settings hub, while Core Engine remains an admin-only route at <code>/settings/core</code>.
          </p>
          <div className="st-actions">
            <Link className="st-link" to="/settings/account">Open Account</Link>
            <Link className="st-link" to="/settings/intelligence">Open Intelligence</Link>
            {hasSuperAdminAccess ? <Link className="st-link primary" to="/settings/core">Open Core Engine</Link> : null}
          </div>
        </div>

        <div className="st-body">
          <section className="st-hero">
            <div className="st-kicker">{activeBranch.kicker}</div>
            <h2 className="st-section-title" style={{ marginTop: 8 }}>{activeBranch.title}</h2>
            <p className="st-copy">{activeBranch.description}</p>
            <div className="st-chip-row">
              <span className="st-chip">Route: {location.pathname}</span>
              <span className="st-chip">Plan: {planName}</span>
              <span className="st-chip">Price: {planPrice}</span>
              <span className="st-chip">Workspace: {tenant?.name ?? "Loading"}</span>
            </div>
            <div className="st-copy" style={{ marginTop: 14 }}>{assistantSummary}</div>
            {activeBranch.key === "account" ? <CrossAppSsoActions variant="settings" /> : null}
          </section>

          <section className="st-stats">
            <div className="st-stat"><div className="st-meta">User Branches</div><div className="st-stat-value">6</div></div>
            <div className="st-stat"><div className="st-meta">Core Engine</div><div className="st-stat-value">Live</div></div>
            <div className="st-stat"><div className="st-meta">Active Branch</div><div className="st-stat-value">{activeBranch.navLabel}</div></div>
            <div className="st-stat"><div className="st-meta">Hierarchy</div><div className="st-stat-value">Mapped</div></div>
          </section>

          <div className="st-layout">
            <aside className="st-nav">
              <div className="st-nav-group">
                {BRANCHES.map((branch) => (
                  <Link key={branch.key} className={`st-nav-link${activeBranch.key === branch.key ? " active" : ""}`} to={branch.path}>
                    <span className="st-nav-icon">{branch.icon}</span>
                    <span className="st-nav-label">{branch.navLabel}</span>
                  </Link>
                ))}
              </div>

              <div className="st-nav-divider" />

              <div className="st-nav-group">
                {activeBranch.sections.map((section) => (
                  <a key={section.id} className={`st-nav-sub${activeSectionId === section.id ? " active" : ""}`} href={`#${section.id}`}>
                    {section.label}
                  </a>
                ))}
              </div>

              {hasSuperAdminAccess ? (
                <>
                  <div className="st-nav-divider" />
                  <div className="st-nav-group">
                    <Link className="st-nav-link" to="/settings/core">
                      <span className="st-nav-icon">🧠</span>
                      <span className="st-nav-label">Core</span>
                    </Link>
                  </div>
                </>
              ) : null}
            </aside>

            <div className="st-content">
              <section className="st-section">
                <div className="st-kicker">{activeBranch.title}</div>
                <h2 className="st-section-title" style={{ marginTop: 8 }}>Settings Content</h2>
                <p className="st-copy">Each section below is grouped to match the universal settings layout for this branch.</p>
              </section>

              {activeBranch.sections.map((section) => (
                <section key={section.id} id={section.id} className="st-section">
                  <div className="st-section-head">
                    <div>
                      <div className="st-kicker">{activeBranch.navLabel}</div>
                      <h3 className="st-card-title" style={{ fontSize: 20, marginTop: 8 }}>{section.title}</h3>
                    </div>
                    <a className="st-nav-sub active" href="#top">Top</a>
                  </div>
                  <div className={`st-section-grid${section.keys.length === 1 ? " full" : " compact"}`} style={{ marginTop: 18 }}>
                    {section.keys.map((key) => {
                      const setting = activeBranch.settings[key];
                      if (!setting) return null;
                      const isPro = setting.plan === "PRO";
                      const hasPro = planName === "PRO" || planName === "ENTERPRISE";
                      const disabled = isPro && !hasPro;
                      const currentValue = branchValues[activeBranch.key]?.[key] ?? setting.current;

                      return (
                        <article key={key} className="st-card" style={{ opacity: disabled ? 0.6 : 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                            <div className="st-card-title">{setting.label}</div>
                            {isPro ? <span className="st-chip" style={{ color: "var(--gold)", borderColor: "rgba(201,168,76,.3)" }}>PRO</span> : null}
                          </div>
                          {(setting.description || setting.desc) ? <div className="st-copy" style={{ fontSize: "12px" }}>{setting.description || setting.desc}</div> : null}
                          <div className="st-field">
                            {renderSettingControl(
                              key,
                              setting,
                              currentValue,
                              disabled,
                              planName,
                              (value) => handleBranchValueChange(activeBranch.key, key, value),
                              handleSettingAction,
                            )}
                          </div>
                          {disabled ? <div className="st-meta" style={{ marginTop: 8, color: "var(--gold)" }}>Upgrade to PRO to unlock</div> : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}

              <section className="st-form-grid">
                <div className="st-form-card">
              <div className="st-form-title">Workspace Configuration</div>
              <div className="st-copy">Shared workspace defaults stay here so all settings branches inherit sane platform behavior.</div>
              <form onSubmit={handleSave}>
                <div className="st-field">
                  <label className="st-label">Workspace Name</label>
                  <input className="st-input" value={wsName} onChange={(event) => setWsName(event.target.value)} placeholder="My Workspace" disabled={!canManage} />
                </div>
                <div className="st-row">
                  <div className="st-field">
                    <label className="st-label">Timezone</label>
                    <select className="st-select" value={timezone} onChange={(event) => setTimezone(event.target.value)} disabled={!canManage}>
                      {TIMEZONES.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </div>
                  <div className="st-field">
                    <label className="st-label">Currency</label>
                    <select className="st-select" value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={!canManage}>
                      {CURRENCIES.map((value) => <option key={value.value} value={value.value}>{value.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="st-field">
                  <label className="st-label">Fiscal Year Start</label>
                  <select className="st-select" value={fiscal} onChange={(event) => setFiscal(Number(event.target.value))} disabled={!canManage}>
                    {FISCAL_MONTHS.map((value, index) => <option key={value} value={index + 1}>{value}</option>)}
                  </select>
                </div>
                {saveMsg ? <div className={`st-feedback ${saveMsg.startsWith("Failed") ? "error" : "success"}`}>{saveMsg}</div> : null}
                {canManage ? <div className="st-btn-row"><button className="st-btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Workspace"}</button></div> : null}
              </form>
            </div>

                <div className="st-form-card">
              <div className="st-form-title">Connected Surfaces</div>
              <div className="st-copy">Integrations remain visible from the hub because they affect billing, alerts, and trust across multiple layers.</div>
              <div className="st-card-grid" style={{ gridTemplateColumns: "1fr", marginTop: 18 }}>
                {[
                  { name: "Stripe", desc: "Revenue syncing and subscription management", path: "/stripe", status: "Connected" },
                  { name: "Slack", desc: "Team notifications and alert channels", path: "/slack", status: "Configure" },
                  { name: "Email Reports", desc: "Automated weekly and monthly reports", path: "/email", status: "Configure" },
                ].map((integration) => (
                  <article key={integration.name} className="st-card">
                    <div className="st-card-title">{integration.name}</div>
                    <div className="st-copy">{integration.desc}</div>
                    <div className="st-btn-row">
                      <button className="st-btn ghost" type="button" onClick={() => navigate(integration.path)}>{integration.status}</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
              </section>

              <section className="st-section">
                <div className="st-save-row">
                  <button className="st-btn" type="button" onClick={() => void handleSaveBranch()} disabled={branchSaving}>
                    {branchSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
                {branchMsg ? <div className={`st-feedback ${branchMsg.startsWith("Failed") ? "error" : "success"}`}>{branchMsg}</div> : null}
              </section>

              <FourDocumentsBlueprint current="settings" />

              {canManage ? (
                <section className="st-section">
                  <div className="st-kicker">Danger Zone</div>
                  <h2 className="st-section-title" style={{ marginTop: 8 }}>Irreversible actions</h2>
                  <p className="st-copy">Deleting the workspace removes members, analytics data, and billing history.</p>
                  <div className="st-btn-row">
                    <button className="st-btn danger" type="button" onClick={handleDeleteWorkspace}>Delete Workspace</button>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
