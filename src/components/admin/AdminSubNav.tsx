import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuthHeaders } from "../../features/auth/authStore";
import { API_BASE } from "../../lib/api";

type AdminSubNavSnapshot = {
  generatedAt: string;
  badges: {
    tenants: number;
    users: number;
    security: number;
  };
  action: {
    label: string;
    hint: string;
    to: string;
  };
};

type NavItem = {
  id: string;
  label: string;
  to: string;
  aliases?: string[];
  badgeKey?: keyof AdminSubNavSnapshot["badges"];
};

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", to: "/admin/overview", aliases: ["/admin"] },
  { id: "platform", label: "Platform", to: "/admin/platform" },
  { id: "tenants", label: "Tenants", to: "/admin/tenants", badgeKey: "tenants" },
  { id: "users", label: "Users", to: "/admin/users", badgeKey: "users" },
  { id: "revenue", label: "Revenue", to: "/admin/revenue" },
  { id: "forge", label: "FORGE", to: "/admin/forge" },
  { id: "health", label: "Health", to: "/admin/health", aliases: ["/ops"] },
  { id: "broadcast", label: "Broadcast", to: "/admin/broadcast" },
  { id: "security", label: "Security", to: "/admin/security", badgeKey: "security" },
  { id: "settings", label: "Settings", to: "/admin/settings" },
];

const css = `
  .asn-wrap{
    position:sticky;
    top:0;
    z-index:25;
    margin:0 0 14px;
  }
  .asn-shell{
    display:flex;
    align-items:center;
    gap:12px;
    border:1px solid rgba(201,168,76,.22);
    border-radius:var(--card-radius, 12px);
    background:
      linear-gradient(135deg, rgba(20,29,42,.96), rgba(11,19,30,.94));
    backdrop-filter:blur(14px);
    -webkit-backdrop-filter:blur(14px);
    box-shadow:0 12px 34px rgba(0,0,0,.24);
    padding:8px;
  }
  .asn-brand{
    display:inline-flex;
    align-items:center;
    gap:8px;
    padding:10px 12px;
    border-radius:var(--card-radius, 10px);
    border:1px solid rgba(201,168,76,.16);
    background:linear-gradient(180deg, rgba(201,168,76,.12), rgba(201,168,76,.04));
    color:var(--gold);
    font-family:var(--font-mono), "Space Mono", monospace;
    font-size:10px;
    letter-spacing:.12em;
    text-transform:uppercase;
    white-space:nowrap;
    flex-shrink:0;
  }
  .asn-brand-mark{
    width:8px;
    height:8px;
    border-radius:999px;
    background:var(--gold);
    box-shadow:0 0 12px rgba(201,168,76,.72);
    flex-shrink:0;
  }
  .asn-scroll-wrap{
    position:relative;
    flex:1;
    min-width:0;
  }
  .asn-scroll{
    display:flex;
    align-items:center;
    gap:6px;
    min-width:0;
  }
  .asn-item{
    border:1px solid transparent;
    background:transparent;
    color:rgba(232,238,245,.72);
    border-radius:var(--card-radius, 8px);
    padding:9px 12px 9px 18px;
    font-family:var(--font-mono), "Space Mono", monospace;
    font-size:10px;
    letter-spacing:.06em;
    text-transform:uppercase;
    cursor:pointer;
    position:relative;
    display:inline-flex;
    align-items:center;
    gap:8px;
    white-space:nowrap;
    transition:all .16s ease;
  }
  .asn-item:hover{
    color:var(--text);
    border-color:rgba(201,168,76,.18);
    background:rgba(201,168,76,.06);
  }
  .asn-item.active{
    color:var(--text);
    border-color:rgba(201,168,76,.28);
    background:rgba(201,168,76,.1);
  }
  .asn-item.active::before{
    content:"";
    position:absolute;
    left:8px;
    top:50%;
    transform:translateY(-50%);
    width:6px;
    height:6px;
    border-radius:999px;
    background:var(--gold);
    box-shadow:0 0 12px rgba(201,168,76,.82);
  }
  .asn-badge{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-width:18px;
    padding:3px 6px;
    border-radius:var(--card-radius, 999px);
    border:1px solid rgba(201,168,76,.22);
    background:rgba(201,168,76,.12);
    color:var(--gold);
    font-size:9px;
    line-height:1;
  }
  .asn-action{
    min-width:260px;
    max-width:320px;
    border:1px solid rgba(201,168,76,.28);
    border-radius:var(--card-radius, 10px);
    background:linear-gradient(135deg, rgba(201,168,76,.14), rgba(201,168,76,.06));
    color:var(--text);
    padding:10px 12px;
    text-align:left;
    cursor:pointer;
    transition:all .16s ease;
    flex-shrink:0;
  }
  .asn-action:hover{
    border-color:rgba(201,168,76,.46);
    transform:translateY(-1px);
    box-shadow:0 8px 22px rgba(0,0,0,.2);
  }
  .asn-action-top{
    display:flex;
    align-items:center;
    gap:8px;
    font-family:var(--font-mono), "Space Mono", monospace;
    font-size:10px;
    letter-spacing:.1em;
    text-transform:uppercase;
    color:var(--gold);
  }
  .asn-action-dot{
    width:7px;
    height:7px;
    border-radius:999px;
    background:var(--gold);
    box-shadow:0 0 10px rgba(201,168,76,.82);
    flex-shrink:0;
  }
  .asn-action-label{
    margin-top:5px;
    font-size:12px;
    line-height:1.45;
    color:var(--text);
  }
  .asn-action-hint{
    margin-top:4px;
    font-size:11px;
    line-height:1.45;
    color:var(--text-dim);
  }
  .asn-fade{
    display:none;
  }
  .asn-mobile-action{
    display:none;
  }
  @media (max-width:900px){
    .asn-shell{
      gap:8px;
    }
    .asn-brand{
      display:none;
    }
    .asn-scroll{
      overflow-x:auto;
      padding-right:8px;
      scrollbar-width:none;
    }
    .asn-scroll::-webkit-scrollbar{
      display:none;
    }
    .asn-action{
      display:none;
    }
    .asn-fade{
      display:block;
      position:absolute;
      top:0;
      bottom:0;
      width:16px;
      pointer-events:none;
      z-index:1;
    }
    .asn-fade.left{
      left:0;
      background:linear-gradient(90deg, rgba(13,24,38,1), rgba(13,24,38,0));
    }
    .asn-fade.right{
      right:0;
      background:linear-gradient(270deg, rgba(13,24,38,1), rgba(13,24,38,0));
    }
    .asn-mobile-action{
      display:block;
      position:fixed;
      left:12px;
      right:12px;
      bottom:68px;
      z-index:52;
      border-radius:10px;
      border:1px solid rgba(201,168,76,.28);
      background:rgba(13,24,38,.94);
      backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      padding:9px 12px;
      color:var(--text);
      text-align:left;
      cursor:pointer;
      box-shadow:0 10px 24px rgba(0,0,0,.24);
    }
    .asn-mobile-action strong{
      color:var(--gold);
      font-family:"Space Mono", monospace;
      font-size:10px;
      letter-spacing:.08em;
      text-transform:uppercase;
      margin-right:6px;
    }
  }
`;

function pathMatches(pathname: string, target: string) {
  return pathname === target || pathname.startsWith(`${target}/`);
}

function isActive(pathname: string, item: NavItem) {
  const targets = [item.to, ...(item.aliases ?? [])];
  return targets.some((target) => pathMatches(pathname, target));
}

function emptySnapshot(): AdminSubNavSnapshot {
  return {
    generatedAt: "",
    badges: {
      tenants: 0,
      users: 0,
      security: 0,
    },
    action: {
      label: "Review the current sovereign directive ->",
      hint: "FORGE is preparing the latest operator brief.",
      to: "/admin/forge",
    },
  };
}

export default function AdminSubNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname === "/ops" ? "/admin/health" : location.pathname;
  const [snapshot, setSnapshot] = useState<AdminSubNavSnapshot>(emptySnapshot);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/admin/subnav`, {
          headers: getAuthHeaders(),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            (body as { message?: string; error?: string }).message ??
              (body as { error?: string }).error ??
              `Request failed (${res.status})`,
          );
        }
        if (!active) return;
        setSnapshot(body as AdminSubNavSnapshot);
      } catch {
        if (!active) return;
        setSnapshot((current) => current);
      }
    }

    void load();
    const id = window.setInterval(() => {
      void load();
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const items = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        badgeValue: item.badgeKey ? snapshot.badges[item.badgeKey] : 0,
      })),
    [snapshot.badges],
  );

  return (
    <div className="asn-wrap">
      <style>{css}</style>
      <div className="asn-shell admin-card">
        <div className="asn-brand">
          <span className="asn-brand-mark" />
          <span>Ecosystem Controller</span>
        </div>

        <div className="asn-scroll-wrap">
          <div className="asn-fade left" />
          <div className="asn-scroll">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`asn-item admin-nav-item${isActive(pathname, item) ? " active" : ""}`}
                onClick={() => navigate(item.to)}
                aria-current={isActive(pathname, item) ? "page" : undefined}
              >
                <span>{item.label}</span>
                {item.badgeValue > 0 ? <span className="asn-badge admin-badge">{item.badgeValue}</span> : null}
              </button>
            ))}
          </div>
          <div className="asn-fade right" />
        </div>

        <button
          type="button"
          className="asn-action"
          onClick={() => navigate(snapshot.action.to)}
        >
          <div className="asn-action-top">
            <span className="asn-action-dot" />
            <span>FORGE 🔥 current brief</span>
          </div>
          <div className="asn-action-label">{snapshot.action.label}</div>
          <div className="asn-action-hint">{snapshot.action.hint}</div>
        </button>
      </div>

      <button
        type="button"
        className="asn-mobile-action"
        onClick={() => navigate(snapshot.action.to)}
      >
        <strong>FORGE 🔥</strong>
        {snapshot.action.label}
      </button>
    </div>
  );
}
