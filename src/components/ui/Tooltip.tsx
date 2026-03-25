// Level II — AI-Present on Every Page
// Component: Tooltip
// Smart contextual tooltip — shows AI hint for data points when `aiHint` is provided.
// Wraps any child with hover-triggered tooltip. No library dependency.

import { useState, useRef, useCallback } from "react";

interface TooltipProps {
  content: React.ReactNode;
  aiHint?: string;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
  children: React.ReactNode;
  disabled?: boolean;
}

const css = `
.wn-tooltip-wrapper {
  position: relative;
  display: inline-flex;
}

.wn-tooltip-box {
  position: absolute;
  z-index: 200;
  pointer-events: none;
  animation: tooltip-in 0.15s ease;
  min-width: 160px;
  max-width: 260px;
}

@keyframes tooltip-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.wn-tooltip-inner {
  background: var(--surface3);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  font-family: 'Syne', sans-serif;
  font-size: 11.5px;
  color: var(--text);
  line-height: 1.5;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

.wn-tooltip-ai-hint {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--border);
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--purple);
  line-height: 1.5;
}

.wn-tooltip-ai-label {
  display: block;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--purple);
  margin-bottom: 2px;
  opacity: 0.7;
}

.wn-tooltip-placement-top    { bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); }
.wn-tooltip-placement-bottom { top: calc(100% + 6px);    left: 50%; transform: translateX(-50%); }
.wn-tooltip-placement-left   { right: calc(100% + 6px);  top: 50%;  transform: translateY(-50%); }
.wn-tooltip-placement-right  { left: calc(100% + 6px);   top: 50%;  transform: translateY(-50%); }
`;

export default function Tooltip({
  content,
  aiHint,
  placement = "top",
  delay = 300,
  children,
  disabled = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (disabled) return;
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [disabled, delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <>
      <style>{css}</style>
      <span
        className="wn-tooltip-wrapper"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
        {visible && (
          <span
            className={`wn-tooltip-box wn-tooltip-placement-${placement}`}
            role="tooltip"
          >
            <div className="wn-tooltip-inner">
              <span>{content}</span>
              {aiHint && (
                <div className="wn-tooltip-ai-hint">
                  <span className="wn-tooltip-ai-label">AI Insight</span>
                  {aiHint}
                </div>
              )}
            </div>
          </span>
        )}
      </span>
    </>
  );
}
