import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useAuthStore } from "../auth/authStore";
import ThemeToggle from "../theme/ThemeToggle";
import NotificationBell from "../notifications/NotificationBell";
import AdminSubNav from "./AdminSubNav";
import ForgeInsightBar from "./ForgeInsightBar";
import AdminEventToast from "./components/AdminEventToast";
import ImpersonationBanner from "./components/ImpersonationBanner";

const css = `
  .adl-root{
    min-height:100vh;
    background:
      radial-gradient(circle at top right, rgba(201,168,76,.12), transparent 28%),
      radial-gradient(circle at left top, rgba(137,196,225,.08), transparent 24%),
      linear-gradient(180deg, rgba(7,13,22,.99), rgba(10,17,28,.98));
    color:var(--text);
    font-family:"Syne", sans-serif;
  }
  .adl-header{
    position:sticky;
    top:0;
    z-index:40;
    display:flex;
    justify-content:space-between;
    gap:18px;
    align-items:flex-start;
    padding:18px 24px;
    border-bottom:1px solid rgba(201,168,76,.16);
    background:
      radial-gradient(circle at top right, rgba(201,168,76,.16), transparent 32%),
      linear-gradient(135deg, rgba(12,20,31,.96), rgba(10,17,27,.98));
    backdrop-filter:blur(18px);
    -webkit-backdrop-filter:blur(18px);
  }
  .adl-brand{
    display:flex;
    gap:14px;
    align-items:flex-start;
    min-width:0;
  }
  .adl-mark{
    width:44px;
    height:44px;
    border-radius:14px;
    display:grid;
    place-items:center;
    flex-shrink:0;
    border:1px solid rgba(201,168,76,.26);
    background:linear-gradient(180deg, rgba(201,168,76,.16), rgba(201,168,76,.04));
    color:var(--gold);
    font-size:20px;
    font-weight:800;
    box-shadow:0 14px 34px rgba(0,0,0,.24);
  }
  .adl-kicker{
    font-family:"Space Mono", monospace;
    font-size:10px;
    letter-spacing:.16em;
    text-transform:uppercase;
    color:var(--gold);
  }
  .adl-title{
    margin:8px 0 0;
    font-size:30px;
    font-weight:800;
    letter-spacing:-.05em;
  }
  .adl-copy{
    margin:10px 0 0;
    max-width:760px;
    color:var(--text-dim);
    font-size:14px;
    line-height:1.65;
  }
  .adl-meta{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    margin-top:12px;
  }
  .adl-meta-pill{
    display:inline-flex;
    align-items:center;
    gap:8px;
    min-height:30px;
    padding:0 11px;
    border-radius:999px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);
    font-family:"Space Mono", monospace;
    font-size:10px;
    letter-spacing:.08em;
    text-transform:uppercase;
    color:var(--text-dim);
  }
  .adl-meta-pill strong{
    color:var(--gold);
    font-weight:700;
  }
  .adl-actions{
    display:flex;
    align-items:center;
    gap:10px;
    flex-wrap:wrap;
    justify-content:flex-end;
    flex-shrink:0;
  }
  .adl-button{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-height:40px;
    padding:0 14px;
    border-radius:999px;
    border:1px solid rgba(201,168,76,.22);
    background:rgba(201,168,76,.08);
    color:var(--gold);
    font-family:"Space Mono", monospace;
    font-size:11px;
    letter-spacing:.08em;
    text-transform:uppercase;
    cursor:pointer;
  }
  .adl-button.ghost{
    border-color:rgba(255,255,255,.1);
    background:rgba(255,255,255,.03);
    color:var(--text-dim);
  }
  .adl-button.danger{
    border-color:rgba(224,90,78,.26);
    background:rgba(224,90,78,.08);
    color:#ffc8c1;
  }
  .adl-content{
    padding:0 0 44px;
  }
  .adl-page{
    min-height:calc(100vh - 180px);
  }
  @media (max-width:900px){
    .adl-header{
      padding:16px;
      flex-direction:column;
    }
    .adl-actions{
      width:100%;
      justify-content:flex-start;
    }
  }
`;

function pageTitle(pathname: string) {
  if (pathname.startsWith("/admin/platform")) return "Platform Launch Control";
  if (pathname.startsWith("/admin/tenants")) return "Tenant Command";
  if (pathname.startsWith("/admin/users")) return "User Command";
  if (pathname.startsWith("/admin/revenue")) return "Revenue Command";
  if (pathname.startsWith("/admin/forge")) return "FORGE Intelligence";
  if (pathname.startsWith("/admin/health") || pathname.startsWith("/ops")) return "System Health";
  if (pathname.startsWith("/admin/broadcast")) return "OMEGA Broadcast";
  if (pathname.startsWith("/admin/security")) return "Security and Compliance";
  if (pathname.startsWith("/admin/settings")) return "Admin Settings";
  return "Admin Overview";
}

function pageCopy(pathname: string) {
  if (pathname.startsWith("/admin/platform")) return "Launch control for the ecosystem layers, release blockers, and operator approval flow.";
  if (pathname.startsWith("/admin/tenants")) return "Cross-tenant workspace control, impersonation, billing posture, and lifecycle management.";
  if (pathname.startsWith("/admin/users")) return "Identity, trust, moderation, and intervention tooling across every ecosystem user.";
  if (pathname.startsWith("/admin/revenue")) return "Live financial command with recurring revenue, layer contribution, and export posture.";
  if (pathname.startsWith("/admin/forge")) return "Supervisor access for the sovereign AI layer, routing posture, and operator collaboration.";
  if (pathname.startsWith("/admin/health") || pathname.startsWith("/ops")) return "Operational telemetry for services, error surfaces, rate limiting, and database posture.";
  if (pathname.startsWith("/admin/broadcast")) return "High-priority ecosystem messaging routed through OMEGA and the admin command surface.";
  if (pathname.startsWith("/admin/security")) return "Security governance around boundary enforcement, compliance posture, and protected control paths.";
  if (pathname.startsWith("/admin/settings")) return "Operator-facing platform settings and adjacent control surfaces.";
  return "Core ecosystem command view spanning launch status, agentic loops, and cross-layer signals.";
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const title = useMemo(() => pageTitle(location.pathname), [location.pathname]);
  const copy = useMemo(() => pageCopy(location.pathname), [location.pathname]);

  return (
    <div className="adl-root">
      <style>{css}</style>

      <header className="adl-header">
        <div className="adl-brand">
          <div className="adl-mark">+</div>
          <div>
            <div className="adl-kicker">Core Engine / Hidden Admin Realm</div>
            <h1 className="adl-title">{title}</h1>
            <p className="adl-copy">{copy}</p>
            <div className="adl-meta">
              <span className="adl-meta-pill">
                Operator
                <strong>{user?.email ?? "Unknown"}</strong>
              </span>
              <span className="adl-meta-pill">
                Status
                <strong>All Systems Live</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="adl-actions">
          <button className="adl-button ghost" onClick={() => navigate("/dashboard")}>
            Exit Admin
          </button>
          <button className="adl-button" onClick={() => navigate("/admin/forge")}>
            Open FORGE
          </button>
          <ThemeToggle />
          <NotificationBell />
          <button
            className="adl-button danger"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <ImpersonationBanner />

      <div className="adl-content">
        <AdminSubNav />
        <ForgeInsightBar />
        <div className="adl-page">
          <Outlet />
        </div>
      </div>

      <AdminEventToast />
    </div>
  );
}
