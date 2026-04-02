import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../features/auth/authStore";

interface AIInsightBannerProps {
  page: "dashboard" | "community" | "academy" | "market" | "work" | "intelligence" | "settings";
  assistant?: "aria" | "nova" | "sage" | "atlas" | "circuit" | "forge" | "omega";
  userId?: string;
}

const ASSISTANT_CONFIG = {
  aria: { name: "ARIA", icon: "A" },
  nova: { name: "NOVA", icon: "N" },
  sage: { name: "SAGE", icon: "S" },
  atlas: { name: "ATLAS", icon: "AT" },
  circuit: { name: "CIRCUIT", icon: "C" },
  forge: { name: "FORGE", icon: "F" },
  omega: { name: "OMEGA", icon: "O" },
} as const;

const CACHE_WINDOW_MS = 4 * 60 * 60 * 1000;
const SKELETON_TIMEOUT_MS = 2000;

export default function AIInsightBanner({
  page,
  assistant = "aria",
  userId,
}: AIInsightBannerProps) {
  const token = useAuthStore((state) => state.token);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);
  const [hiddenForSlowResponse, setHiddenForSlowResponse] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const config = ASSISTANT_CONFIG[assistant];
  const cacheKey = useMemo(
    () => `ai_insight_${page}_${assistant}_${userId ?? "anonymous"}`,
    [assistant, page, userId]
  );
  const dismissKey = useMemo(
    () => `ai_insight_dismissed_${page}_${assistant}_${userId ?? "anonymous"}`,
    [assistant, page, userId]
  );

  useEffect(() => {
    setDismissed(localStorage.getItem(dismissKey) === "1");
  }, [dismissKey]);

  useEffect(() => {
    if (isRestoring) return;

    if (!token) {
      setLoading(false);
      return;
    }

    if (dismissed || hiddenForSlowResponse) {
      setLoading(false);
      return;
    }

    const slowTimer = window.setTimeout(() => {
      setHiddenForSlowResponse(true);
      setLoading(false);
    }, SKELETON_TIMEOUT_MS);

    const abortController = new AbortController();

    const readCachedInsight = (): string | null => {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return null;
      try {
        const parsed = JSON.parse(cached) as { content: string; ts: number };
        if (Date.now() - parsed.ts <= CACHE_WINDOW_MS && parsed.content) {
          return parsed.content;
        }
      } catch {
        // ignore malformed cache
      }
      return null;
    };

    const cacheInsight = (content: string) => {
      sessionStorage.setItem(cacheKey, JSON.stringify({ content, ts: Date.now() }));
    };

    const streamInsight = async (): Promise<string> => {
      const response = await fetch("/api/v1/ai/page-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ page, assistant, userId }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Insight request failed");
      }

      if (!response.body) {
        const data = (await response.json()) as { insight?: string; content?: string };
        return data.insight ?? data.content ?? "";
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/event-stream")) {
        const data = (await response.json()) as { insight?: string; content?: string };
        return data.insight ?? data.content ?? "";
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const line = event
            .split("\n")
            .find((entry) => entry.startsWith("data:"));
          if (!line) continue;
          const payload = line.replace(/^data:\s*/, "").trim();
          if (!payload || payload === "[DONE]") continue;
          assembled += payload;
          setInsight(assembled);
        }
      }

      return assembled;
    };

    const loadInsight = async () => {
      const cachedInsight = readCachedInsight();
      if (cachedInsight) {
        clearTimeout(slowTimer);
        setInsight(cachedInsight);
        setLoading(false);
        return;
      }

      try {
        const content = await streamInsight();
        if (!content || hiddenForSlowResponse) return;
        clearTimeout(slowTimer);
        cacheInsight(content);
        setInsight(content);
        setLoading(false);
      } catch {
        clearTimeout(slowTimer);
        setLoading(false);
      }
    };

    loadInsight();

    return () => {
      clearTimeout(slowTimer);
      abortController.abort();
    };
  }, [assistant, cacheKey, dismissed, hiddenForSlowResponse, isRestoring, page, token, userId]);

  if (dismissed || hiddenForSlowResponse || (!loading && !insight)) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(dismissKey, "1");
  };

  return (
    <div className="ai-insight-banner">
      <style>{`
        .ai-insight-banner {
          background: color-mix(in srgb, var(--purple) 6%, transparent);
          border: 1px solid color-mix(in srgb, var(--purple) 15%, transparent);
          border-left: 3px solid var(--purple);
          border-radius: 0 6px 6px 0;
          padding: 14px 18px;
          margin-bottom: 24px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          animation: ai-insight-enter 200ms ease;
        }

        .ai-insight-label {
          font-family: "Space Mono", monospace;
          font-size: 8px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--purple);
          white-space: nowrap;
          padding-top: 2px;
        }

        .ai-insight-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1px solid color-mix(in srgb, var(--purple) 30%, transparent);
          color: var(--purple);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: "Space Mono", monospace;
          font-size: 9px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .ai-insight-text {
          font-size: 13.5px;
          color: var(--text-mid);
          line-height: 1.6;
          font-family: "Syne", sans-serif;
          flex: 1;
        }

        .ai-insight-dismiss {
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0;
        }

        .ai-insight-skeleton {
          width: min(640px, 100%);
          height: 16px;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--surface2), var(--surface3), var(--surface2));
          background-size: 200% 100%;
          animation: ai-insight-shimmer 1200ms ease infinite;
        }

        @keyframes ai-insight-enter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes ai-insight-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <span className="ai-insight-label">{config.name} INSIGHT</span>
      <span className="ai-insight-icon" aria-hidden="true">
        {config.icon}
      </span>
      {loading ? (
        <div className="ai-insight-skeleton" aria-hidden="true" />
      ) : (
        <div className="ai-insight-text">{insight}</div>
      )}
      <button className="ai-insight-dismiss" onClick={handleDismiss} aria-label="Dismiss insight">
        x
      </button>
    </div>
  );
}
