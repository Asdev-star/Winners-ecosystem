import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAuthHeaders } from "../../features/auth/authStore";
import { API_BASE } from "../../lib/api";
import StreamingText from "../ai/StreamingText";

type ForgeInsightResponse = {
  generatedAt: string;
  path: string;
  insight: string;
  context: string;
};

const SESSION_HISTORY_KEY = "forge-insight-history-v1";

const css = `
  .fib-root{
    padding:18px 22px 0;
  }
  .fib-shell{
    position:relative;
    overflow:hidden;
    border:1px solid rgba(201,168,76,.18);
    border-radius:22px;
    background:
      radial-gradient(circle at top right, rgba(201,168,76,.18), transparent 30%),
      radial-gradient(circle at left center, rgba(137,196,225,.14), transparent 24%),
      linear-gradient(135deg, rgba(12,20,31,.96), rgba(18,29,45,.94));
    box-shadow:0 20px 60px rgba(0,0,0,.18);
  }
  .fib-shell::before{
    content:"";
    position:absolute;
    inset:0 auto 0 0;
    width:4px;
    background:linear-gradient(180deg, rgba(201,168,76,.96), rgba(137,196,225,.92));
  }
  .fib-inner{
    display:flex;
    align-items:flex-start;
    gap:14px;
    padding:16px 18px 16px 20px;
  }
  .fib-mark{
    width:42px;
    height:42px;
    border-radius:14px;
    display:grid;
    place-items:center;
    flex-shrink:0;
    border:1px solid rgba(201,168,76,.24);
    background:linear-gradient(180deg, rgba(201,168,76,.16), rgba(137,196,225,.08));
    color:var(--gold);
    font-size:18px;
    font-weight:800;
  }
  .fib-copy{
    min-width:0;
    flex:1;
  }
  .fib-top{
    display:flex;
    justify-content:space-between;
    gap:12px;
    align-items:center;
    flex-wrap:wrap;
    margin-bottom:8px;
  }
  .fib-kicker{
    font-family:'Space Mono', monospace;
    font-size:10px;
    letter-spacing:.16em;
    text-transform:uppercase;
    color:var(--gold);
  }
  .fib-context{
    display:inline-flex;
    align-items:center;
    padding:5px 9px;
    border-radius:999px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.04);
    color:var(--text-dim);
    font-family:'Space Mono', monospace;
    font-size:9px;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .fib-line{
    color:#f3efe2;
  }
  .fib-line .streaming-text{
    font-size:15px;
    line-height:1.72;
    color:#f3efe2;
  }
  @media (max-width:760px){
    .fib-root{
      padding:14px 14px 0;
    }
    .fib-inner{
      padding:14px 14px 14px 16px;
      gap:12px;
    }
    .fib-mark{
      width:38px;
      height:38px;
      font-size:17px;
    }
  }
`;

function readHistory() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(SESSION_HISTORY_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function persistHistory(nextSentence: string) {
  if (typeof window === "undefined") return;
  const current = readHistory();
  const merged = [...current.filter((entry) => entry !== nextSentence), nextSentence].slice(-40);
  window.sessionStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(merged));
}

function pageLabel(pathname: string) {
  if (pathname.startsWith("/ops") || pathname.startsWith("/admin/health")) return "System Health";
  if (pathname.startsWith("/admin/platform")) return "Platform";
  if (pathname.startsWith("/admin/tenants")) return "Tenants";
  if (pathname.startsWith("/admin/users")) return "Users";
  if (pathname.startsWith("/admin/revenue")) return "Revenue";
  if (pathname.startsWith("/admin/broadcast")) return "Broadcast";
  if (pathname.startsWith("/admin/security")) return "Security";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  return "Controller";
}

function fallbackInsight(pathname: string) {
  if (pathname.startsWith("/admin/platform")) {
    return "FORGE is recalibrating the platform launch queue and will return with a fresh controller sentence in a moment.";
  }
  if (pathname.startsWith("/admin/tenants")) {
    return "FORGE is reloading tenant signals so this surface opens with the most relevant controller insight.";
  }
  if (pathname.startsWith("/admin/users")) {
    return "FORGE is rebuilding the live user signal map for this controller page.";
  }
  if (pathname.startsWith("/admin/revenue")) {
    return "FORGE is refreshing the revenue projection and recurring income signal for this controller view.";
  }
  if (pathname.startsWith("/admin/broadcast")) {
    return "FORGE is scanning broadcast reach and open-rate performance for the latest controller sentence.";
  }
  if (pathname.startsWith("/admin/security")) {
    return "FORGE is checking the security console for the next controller-priority gap.";
  }
  if (pathname.startsWith("/ops") || pathname.startsWith("/admin/health")) {
    return "FORGE is reviewing health telemetry to surface the single most important controller status line.";
  }
  return "FORGE is assembling a fresh controller insight for this admin surface.";
}

export default function ForgeInsightBar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [sentence, setSentence] = useState("");
  const [streaming, setStreaming] = useState(false);

  const isAdminPage = pathname.startsWith("/admin") || pathname.startsWith("/ops");
  const isForgePage = pathname.startsWith("/admin/forge");
  const label = useMemo(() => pageLabel(pathname), [pathname]);

  useEffect(() => {
    if (!isAdminPage || isForgePage) return undefined;

    const controller = new AbortController();
    const history = readHistory().slice(-24);
    const seed =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setSentence("");
    setStreaming(true);

    async function loadInsight() {
      try {
        const params = new URLSearchParams({
          path: pathname,
          seed,
        });
        history.forEach((entry) => params.append("exclude", entry));

        const res = await fetch(`${API_BASE}/admin/forge/insight?${params.toString()}`, {
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            (body as { message?: string; error?: string }).message ??
              (body as { error?: string }).error ??
              `Request failed (${res.status})`,
          );
        }

        const nextSentence = (body as ForgeInsightResponse).insight?.trim();
        if (!nextSentence) {
          throw new Error("Insight payload was empty");
        }

        setSentence(nextSentence);
        persistHistory(nextSentence);
      } catch {
        const nextSentence = fallbackInsight(pathname);
        setSentence(nextSentence);
        persistHistory(nextSentence);
      }
    }

    void loadInsight();

    return () => {
      controller.abort();
    };
  }, [isAdminPage, isForgePage, location.key, pathname]);

  if (!isAdminPage || isForgePage) {
    return null;
  }

  return (
    <div className="fib-root">
      <style>{css}</style>
      <section className="fib-shell admin-card" aria-live="polite">
        <div className="fib-inner">
          <div className="fib-mark">F</div>
          <div className="fib-copy">
            <div className="fib-top">
              <div className="fib-kicker">Ecosystem Controller Insight</div>
              <div className="fib-context admin-badge">{label}</div>
            </div>
            <div className="fib-line">
              <StreamingText
                key={`${location.key}:${pathname}`}
                content={sentence}
                isStreaming={streaming}
                onComplete={() => setStreaming(false)}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
