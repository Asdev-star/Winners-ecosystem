// Level II (V3.0) - Command Palette
// Component: CommandPalette
// Universal navigator via ⌘K with AI-powered suggestions
// Design: CSS variables only · Syne + Space Mono fonts

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface CommandResult {
  id: string;
  type: "navigation" | "search" | "action" | "omega";
  label: string;
  description?: string;
  href?: string;
  icon: string;
  layer?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAVIGATION_COMMANDS: CommandResult[] = [
  { id: "nav-feed", type: "navigation", label: "Community Feed", href: "/community", icon: "🧑‍🤝‍🧑", layer: "community" },
  { id: "nav-groups", type: "navigation", label: "Groups", href: "/community/groups", icon: "👥", layer: "community" },
  { id: "nav-messages", type: "navigation", label: "Messages", href: "/messages", icon: "💬", layer: "community" },
  { id: "nav-discover", type: "navigation", label: "Discover People", href: "/community/discover", icon: "🔍", layer: "community" },
  { id: "nav-saved", type: "navigation", label: "Saved Posts", href: "/community/saved", icon: "🔖", layer: "community" },
  { id: "nav-create", type: "navigation", label: "Create Post", href: "/community/create", icon: "✏️", layer: "community" },
  { id: "nav-analytics", type: "navigation", label: "Creator Analytics", href: "/community/analytics", icon: "📊", layer: "community" },
  { id: "nav-academy", type: "navigation", label: "Explore Courses", href: "/academy", icon: "🎓", layer: "academy" },
  { id: "nav-learning", type: "navigation", label: "My Learning", href: "/academy/my-learning", icon: "📚", layer: "academy" },
  { id: "nav-certificates", type: "navigation", label: "Certificates", href: "/academy/my-learning", icon: "🏆", layer: "academy" },
  { id: "nav-market", type: "navigation", label: "Marketplace", href: "/market", icon: "🛒", layer: "market" },
  { id: "nav-work", type: "navigation", label: "Find Work", href: "/work", icon: "💼", layer: "work" },
  { id: "nav-intelligence", type: "navigation", label: "AI Intelligence", href: "/intelligence", icon: "🤖", layer: "intelligence" },
  { id: "nav-home", type: "navigation", label: "User Home", href: "/home", icon: "⌂", layer: "core" },
  { id: "nav-team", type: "navigation", label: "Team", href: "/team", icon: "👥", layer: "core" },
  { id: "nav-billing", type: "navigation", label: "Billing", href: "/billing", icon: "💳", layer: "core" },
  { id: "nav-settings", type: "navigation", label: "Settings", href: "/settings", icon: "⚙️", layer: "core" },
];

const QUICK_ACTIONS: CommandResult[] = [
  { id: "action-post", type: "action", label: "New post in Community", href: "/community/create", icon: "✏️" },
  { id: "action-course", type: "action", label: "Create a new course", href: "/academy/instructor/create", icon: "🎬" },
  { id: "action-job", type: "action", label: "Apply to a job", href: "/work", icon: "📝" },
  { id: "action-product", type: "action", label: "Add product to store", href: "/market/vendor", icon: "📦" },
];

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<"nav" | "search" | "omega">("nav");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Filter results based on query
  const filteredNav = NAVIGATION_COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.layer?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = QUICK_ACTIONS.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredSearch = query.length > 0 ? [...filteredNav, ...filteredActions] : [];

  const allResults = mode === "omega" && query.startsWith("?")
    ? filteredSearch
    : filteredSearch;

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < allResults.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : allResults.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (allResults[selectedIndex]?.href) {
            navigate(allResults[selectedIndex].href!);
            onClose();
          }
          break;
        case "Tab":
          e.preventDefault();
          setMode((prev) => {
            if (prev === "nav") return "search";
            if (prev === "search") return "omega";
            return "nav";
          });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allResults, selectedIndex, navigate, onClose, mode]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Detect mode based on query
  useEffect(() => {
    if (query.startsWith("?")) {
      setMode("omega");
    } else if (query.length > 0) {
      setMode("search");
    } else {
      setMode("nav");
    }
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const selected = document.querySelector(".cmd-selected");
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const getLayerColor = (layer?: string) => {
    switch (layer) {
      case "community":
        return "var(--ice)";
      case "academy":
        return "var(--green)";
      case "market":
        return "var(--gold)";
      case "work":
        return "var(--blue)";
      case "intelligence":
        return "var(--purple)";
      case "core":
        return "var(--gold)";
      default:
        return "var(--text-dim)";
    }
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-header">
          <span className="cmd-icon">⌘K</span>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder={
              mode === "omega"
                ? "Ask OMEGA..."
                : mode === "search"
                ? "Search everything..."
                : "Search commands..."
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button className="cmd-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="cmd-body">
          {mode === "omega" && query.startsWith("?") && (
            <div className="cmd-section">
              <div className="cmd-section-title">🤖 OMEGA</div>
              <div className="cmd-item cmd-omega-result">
                <span className="cmd-item-icon">🤖</span>
                <div className="cmd-item-content">
                  <span className="cmd-item-label">{query.slice(1)}</span>
                  <span className="cmd-item-desc">OMEGA will answer...</span>
                </div>
              </div>
            </div>
          )}

          {mode === "nav" && query.length === 0 && (
            <>
              <div className="cmd-section">
                <div className="cmd-section-title">NAVIGATION</div>
                {NAVIGATION_COMMANDS.slice(0, 6).map((cmd, index) => (
                  <div
                    key={cmd.id}
                    className={`cmd-item ${index === selectedIndex ? "cmd-selected" : ""}`}
                    onClick={() => {
                      navigate(cmd.href!);
                      onClose();
                    }}
                  >
                    <span className="cmd-item-icon">{cmd.icon}</span>
                    <span className="cmd-item-label">{cmd.label}</span>
                    <span
                      className="cmd-item-layer"
                      style={{ color: getLayerColor(cmd.layer) }}
                    >
                      {cmd.layer}
                    </span>
                  </div>
                ))}
              </div>

              <div className="cmd-section">
                <div className="cmd-section-title">QUICK ACTIONS</div>
                {QUICK_ACTIONS.map((action, index) => (
                  <div
                    key={action.id}
                    className={`cmd-item ${
                      index + 6 === selectedIndex ? "cmd-selected" : ""
                    }`}
                    onClick={() => {
                      navigate(action.href!);
                      onClose();
                    }}
                  >
                    <span className="cmd-item-icon">{action.icon}</span>
                    <span className="cmd-item-label">{action.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {mode === "search" && allResults.length > 0 && (
            <div className="cmd-section">
              <div className="cmd-section-title">RESULTS</div>
              {allResults.map((result, index) => (
                <div
                  key={result.id}
                  className={`cmd-item ${index === selectedIndex ? "cmd-selected" : ""}`}
                  onClick={() => {
                    if (result.href) {
                      navigate(result.href);
                      onClose();
                    }
                  }}
                >
                  <span className="cmd-item-icon">{result.icon}</span>
                  <div className="cmd-item-content">
                    <span className="cmd-item-label">{result.label}</span>
                    {result.description && (
                      <span className="cmd-item-desc">{result.description}</span>
                    )}
                  </div>
                  {result.layer && (
                    <span
                      className="cmd-item-layer"
                      style={{ color: getLayerColor(result.layer) }}
                    >
                      {result.layer}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {mode === "search" && allResults.length === 0 && query.length > 0 && (
            <div className="cmd-empty">
              <span className="cmd-empty-icon">🔍</span>
              <span className="cmd-empty-text">No results found for "{query}"</span>
            </div>
          )}
        </div>

        <div className="cmd-footer">
          <div className="cmd-hint">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div className="cmd-modes">
            <span className={`cmd-mode ${mode === "nav" ? "active" : ""}`}>Nav</span>
            <span className={`cmd-mode ${mode === "search" ? "active" : ""}`}>Search</span>
            <span className={`cmd-mode ${mode === "omega" ? "active" : ""}`}>OMEGA</span>
          </div>
        </div>
      </div>

      <style>{`
        .command-palette-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 15vh;
        }

        .command-palette {
          width: 100%;
          max-width: 640px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          animation: cmdSlide 0.2s ease;
        }

        @keyframes cmdSlide {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .cmd-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .cmd-icon {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: var(--text-dim);
          background: var(--surface2);
          padding: 4px 8px;
          border-radius: 12px;
        }

        .cmd-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          color: var(--text);
        }

        .cmd-input::placeholder {
          color: var(--text-dim);
        }

        .cmd-close {
          background: none;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          padding: 4px;
          font-size: 14px;
        }

        .cmd-close:hover {
          color: var(--text);
        }

        .cmd-body {
          max-height: 400px;
          overflow-y: auto;
          padding: 8px;
        }

        .cmd-section {
          margin-bottom: 8px;
        }

        .cmd-section-title {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: var(--text-dim);
          padding: 8px 12px 4px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .cmd-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .cmd-item:hover,
        .cmd-item.cmd-selected {
          background: var(--surface2);
        }

        .cmd-item.cmd-selected {
          background: rgba(137, 196, 225, 0.1);
        }

        .cmd-item-icon {
          font-size: 16px;
          width: 24px;
          text-align: center;
        }

        .cmd-item-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cmd-item-label {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          color: var(--text);
        }

        .cmd-item-desc {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
        }

        .cmd-item-layer {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cmd-omega-result {
          border: 1px dashed var(--purple);
          background: rgba(155, 111, 255, 0.05);
        }

        .cmd-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 40px;
          color: var(--text-dim);
        }

        .cmd-empty-icon {
          font-size: 32px;
        }

        .cmd-empty-text {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
        }

        .cmd-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-top: 1px solid var(--border);
          background: var(--surface2);
        }

        .cmd-hint {
          display: flex;
          gap: 16px;
        }

        .cmd-hint span {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--text-dim);
        }

        .cmd-modes {
          display: flex;
          gap: 8px;
        }

        .cmd-mode {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          padding: 2px 8px;
          border-radius: 999px;
          background: var(--surface);
          color: var(--text-dim);
        }

        .cmd-mode.active {
          background: var(--ice);
          color: var(--bg);
        }
      `}</style>
    </div>
  );
}
