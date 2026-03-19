import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";

type AdminRealtimeEvent = {
  type:
    | "user_signup"
    | "layer_health_change"
    | "loop_completed"
    | "revenue_spike"
    | "user_flagged"
    | "plan_upgraded"
    | "escrow_dispute"
    | "ai_credit_exhausted"
    | "forge_alert";
  urgency: "info" | "warning" | "critical";
  message: string;
  link?: string;
  timestamp: string;
};

type ToastEvent = AdminRealtimeEvent & {
  id: string;
};

const css = `
  .aet-wrap{
    position:fixed;
    right:24px;
    bottom:24px;
    z-index:2200;
    display:flex;
    flex-direction:column;
    gap:12px;
    pointer-events:none;
  }
  .aet-toast{
    width:min(360px, calc(100vw - 28px));
    border:1px solid rgba(201,168,76,.42);
    border-radius:14px;
    background:
      linear-gradient(135deg, rgba(13,24,38,.98), rgba(17,28,43,.96));
    box-shadow:0 18px 40px rgba(0,0,0,.32);
    overflow:hidden;
    pointer-events:auto;
    cursor:pointer;
    position:relative;
    animation:aet-enter .24s ease;
  }
  .aet-toast::before{
    content:"";
    position:absolute;
    left:0;
    top:0;
    bottom:0;
    width:4px;
    background:var(--gold);
  }
  .aet-inner{
    padding:14px 16px 14px 18px;
  }
  .aet-top{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
  }
  .aet-label{
    display:inline-flex;
    align-items:center;
    gap:8px;
    font-family:"Space Mono", monospace;
    font-size:10px;
    letter-spacing:.1em;
    text-transform:uppercase;
    color:var(--gold);
  }
  .aet-dot{
    width:8px;
    height:8px;
    border-radius:999px;
    background:var(--gold);
    box-shadow:0 0 10px rgba(201,168,76,.82);
    flex-shrink:0;
  }
  .aet-dot.warning{ background:#f7c86b; }
  .aet-dot.critical{ background:#ff8a7a; box-shadow:0 0 10px rgba(255,138,122,.7); }
  .aet-time{
    color:var(--text-dim);
    font-family:"Space Mono", monospace;
    font-size:10px;
    white-space:nowrap;
  }
  .aet-message{
    margin-top:8px;
    color:var(--text);
    font-size:13px;
    line-height:1.6;
  }
  .aet-link{
    margin-top:8px;
    color:var(--gold);
    font-family:"Space Mono", monospace;
    font-size:10px;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .aet-progress{
    height:3px;
    background:linear-gradient(90deg, var(--gold), rgba(201,168,76,.2));
    transform-origin:left center;
    animation:aet-progress 6s linear forwards;
  }
  @keyframes aet-enter{
    from{opacity:0; transform:translateX(20px);}
    to{opacity:1; transform:translateX(0);}
  }
  @keyframes aet-progress{
    from{transform:scaleX(1);}
    to{transform:scaleX(0);}
  }
  @media (max-width:760px){
    .aet-wrap{
      left:12px;
      right:12px;
      bottom:76px;
    }
    .aet-toast{
      width:100%;
    }
  }
`;

function eventLabel(type: AdminRealtimeEvent["type"]) {
  if (type === "user_signup") return "User Signup";
  if (type === "layer_health_change") return "Layer Health";
  if (type === "loop_completed") return "Loop Completed";
  if (type === "revenue_spike") return "Revenue Spike";
  if (type === "user_flagged") return "User Flagged";
  if (type === "plan_upgraded") return "Plan Upgraded";
  if (type === "escrow_dispute") return "Escrow Dispute";
  if (type === "ai_credit_exhausted") return "AI Credit";
  return "FORGE Alert";
}

function relativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const seconds = Math.max(0, Math.round(diffMs / 1000));
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminEventToasts() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const [events, setEvents] = useState<ToastEvent[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());
  const seenRef = useRef<Set<string>>(new Set());

  const isAdminPage = location.pathname.startsWith("/admin") || location.pathname.startsWith("/ops");

  useEffect(() => {
    if (!token || !isAdminPage) return undefined;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws?token=${token}`);

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as {
          event?: string;
          room?: string;
          adminEvent?: AdminRealtimeEvent;
        };

        if (parsed.event !== "admin:event" || parsed.room !== "admin:events" || !parsed.adminEvent) {
          return;
        }

        const id = `${parsed.adminEvent.type}:${parsed.adminEvent.timestamp}:${parsed.adminEvent.message}`;
        if (seenRef.current.has(id)) return;
        seenRef.current.add(id);

        const nextEvent: ToastEvent = { ...parsed.adminEvent, id };
        setEvents((current) => [nextEvent, ...current].slice(0, 4));

        const timeoutId = window.setTimeout(() => {
          setEvents((current) => current.filter((item) => item.id !== id));
          timersRef.current.delete(id);
        }, 6000);
        timersRef.current.set(id, timeoutId);
      } catch {}
    };

    return () => {
      socket.close();
    };
  }, [isAdminPage, token]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  if (!isAdminPage || events.length === 0) {
    return null;
  }

  return (
    <div className="aet-wrap">
      <style>{css}</style>
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          className="aet-toast"
          onClick={() => {
            const timer = timersRef.current.get(event.id);
            if (timer) {
              window.clearTimeout(timer);
              timersRef.current.delete(event.id);
            }
            setEvents((current) => current.filter((item) => item.id !== event.id));
            if (event.link) navigate(event.link);
          }}
        >
          <div className="aet-inner">
            <div className="aet-top">
              <div className="aet-label">
                <span className={`aet-dot ${event.urgency}`} />
                <span>{eventLabel(event.type)}</span>
              </div>
              <div className="aet-time">{relativeTime(event.timestamp)}</div>
            </div>
            <div className="aet-message">{event.message}</div>
            {event.link ? <div className="aet-link">Open admin route {"->"}</div> : null}
          </div>
          <div className="aet-progress" />
        </button>
      ))}
    </div>
  );
}
