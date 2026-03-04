// Phase 5 - Intelligence Layer
// Component: OmegaDashboard
// OMEGA Master Orchestrator - Ecosystem Health at a Glance

import { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";

// CSS Variables - uses global theme
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

.omega-root {
  min-height: 100vh;
  background: 
    radial-gradient(ellipse 80% 50% at 20% 0%, rgba(155,111,255,0.06) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(240,180,41,0.04) 0%, transparent 50%),
    var(--bg);
  font-family: 'Syne', sans-serif;
  color: var(--text);
  padding: 28px 32px;
}

.omega-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.omega-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px;
  font-weight: 300;
  letter-spacing: -0.02em;
}

.omega-title em {
  font-style: italic;
  color: var(--purple);
}

.omega-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(155,111,255,0.1);
  border: 1px solid rgba(155,111,255,0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--purple);
}

.omega-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--purple);
  animation: omegaPulse 2s ease-in-out infinite;
}

@keyframes omegaPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Grid Layout */
.omega-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.omega-layer-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.omega-layer-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.omega-layer-card.core::before { background: linear-gradient(90deg, var(--gold), transparent); }
.omega-layer-card.community::before { background: linear-gradient(90deg, var(--ice), transparent); }
.omega-layer-card.academy::before { background: linear-gradient(90deg, var(--gold), var(--ice), transparent); }
.omega-layer-card.market::before { background: linear-gradient(90deg, var(--green), transparent); }
.omega-layer-card.intelligence::before { background: linear-gradient(90deg, var(--purple), transparent); }
.omega-layer-card.work::before { background: linear-gradient(90deg, var(--blue), transparent); }
.omega-layer-card.mobile::before { background: linear-gradient(90deg, var(--ice), var(--purple), transparent); }
.omega-layer-card.cloud::before { background: linear-gradient(90deg, var(--blue), var(--purple), transparent); }

.omega-layer-icon {
  font-size: 24px;
  margin-bottom: 12px;
}

.omega-layer-name {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-dim);
  margin-bottom: 4px;
}

.omega-layer-title {
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.omega-layer-progress {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.omega-layer-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.8s ease;
}

.omega-layer-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.omega-layer-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.omega-layer-status.live .omega-layer-status-dot { background: var(--green); }
.omega-layer-status.building .omega-layer-status-dot { background: var(--gold); }
.omega-layer-status.planned .omega-layer-status-dot { background: var(--text-dim); }

/* Agentic Loop Section */
.omega-loop-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 28px;
  margin-bottom: 32px;
}

.omega-loop-title {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-dim);
  margin-bottom: 20px;
}

.omega-loop-visual {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  padding: 20px 0;
}

.omega-loop-visual::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 40px;
  right: 40px;
  height: 2px;
  background: var(--border);
  z-index: 0;
}

.omega-loop-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1;
  position: relative;
}

.omega-loop-node-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--surface2);
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.omega-loop-node.completed .omega-loop-node-icon {
  border-color: var(--green);
  background: rgba(45,212,160,0.1);
}

.omega-loop-node.current .omega-loop-node-icon {
  border-color: var(--gold);
  background: rgba(240,180,41,0.15);
  box-shadow: 0 0 20px rgba(240,180,41,0.2);
  animation: loopPulse 1.5s ease-in-out infinite;
}

@keyframes loopPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(240,180,41,0.2); }
  50% { box-shadow: 0 0 30px rgba(240,180,41,0.35); }
}

.omega-loop-node-label {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim);
}

.omega-loop-node.completed .omega-loop-node-label { color: var(--green); }
.omega-loop-node.current .omega-loop-node-label { color: var(--gold); }

/* Intelligence Feed */
.omega-feed {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.omega-feed-main {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 24px;
}

.omega-feed-title {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-dim);
  margin-bottom: 20px;
}

.omega-feed-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}

.omega-feed-item:last-child {
  border-bottom: none;
}

.omega-feed-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--surface2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.omega-feed-content {
  flex: 1;
}

.omega-feed-text {
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 4px;
}

.omega-feed-meta {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
}

/* Action Queue */
.omega-actions {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 24px;
}

.omega-actions-title {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-dim);
  margin-bottom: 16px;
}

.omega-action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--surface2);
  border-radius: 6px;
  margin-bottom: 8px;
}

.omega-action-text {
  font-size: 12px;
}

.omega-action-btn {
  background: var(--gold);
  color: var(--bg);
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  cursor: pointer;
}

.omega-action-btn:hover {
  opacity: 0.9;
}

@media (max-width: 1200px) {
  .omega-grid { grid-template-columns: repeat(2, 1fr); }
  .omega-feed { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .omega-grid { grid-template-columns: 1fr; }
  .omega-loop-visual { flex-wrap: wrap; gap: 16px; justify-content: center; }
  .omega-loop-visual::before { display: none; }
}
`;

// Layer data
const LAYERS = [
  { id: "core", icon: "⬡", name: "Core Engine", title: "Core Engine", progress: 90, status: "live", className: "core" },
  { id: "community", icon: "🧑‍🤝‍🧑", name: "Community", title: "Winners Community", progress: 55, status: "building", className: "community" },
  { id: "academy", icon: "🎓", name: "Academy", title: "Winners Academy", progress: 30, status: "building", className: "academy" },
  { id: "market", icon: "🛒", name: "Market", title: "Winners Market", progress: 0, status: "planned", className: "market" },
  { id: "intelligence", icon: "🤖", name: "Intelligence", title: "Winners Intelligence", progress: 15, status: "building", className: "intelligence" },
  { id: "work", icon: "💼", name: "Work", title: "Winners Work", progress: 0, status: "planned", className: "work" },
  { id: "mobile", icon: "📱", name: "Mobile", title: "Mobile App", progress: 0, status: "planned", className: "mobile" },
  { id: "cloud", icon: "☁️", name: "Cloud", title: "Winners Cloud", progress: 0, status: "planned", className: "cloud" },
];

// Agentic Loop stages
const LOOP_STAGES = [
  { id: "community", icon: "👥", label: "Community", completed: true },
  { id: "nova", icon: "🔍", label: "NOVA Detects", completed: true },
  { id: "academy", icon: "🎓", label: "Academy", completed: false, current: true },
  { id: "certificate", icon: "📜", label: "Certificate", completed: false },
  { id: "work", icon: "💼", label: "Work Match", completed: false },
  { id: "contract", icon: "🤝", label: "Contract Won", completed: false },
];

// Sample intelligence feed
const INTELLIGENCE_FEED = [
  { icon: "👥", text: "NOVA detected React skill in 3 new posts. Academy badge available.", time: "2 min ago" },
  { icon: "🎓", text: "SAGE completed Module 4 analysis. User at 78% completion.", time: "15 min ago" },
  { icon: "💼", text: "CIRCUIT surfaced 2 matching jobs for React Developer certification.", time: "1 hour ago" },
  { icon: "🛒", text: "ATLAS identified trending product opportunity: African print fashion.", time: "3 hours ago" },
];

export default function OmegaDashboard() {
  const user = useAuthStore((state) => state.user);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  return (
    <>
      <style>{css}</style>
      
      <div className="omega-root">
        {/* Header */}
        <div className="omega-header">
          <h1 className="omega-title">
            OMEGA <em>Dashboard</em>
          </h1>
          <div className="omega-badge">
            <span className="omega-badge-dot" />
            Master Orchestrator Active
          </div>
        </div>

        {/* Layer Health Grid */}
        <div className="omega-grid">
          {LAYERS.map((layer) => (
            <div key={layer.id} className={`omega-layer-card ${layer.className}`}>
              <div className="omega-layer-icon">{layer.icon}</div>
              <div className="omega-layer-name">{layer.name}</div>
              <div className="omega-layer-title">{layer.title}</div>
              <div className="omega-layer-progress">
                <div 
                  className="omega-layer-progress-fill"
                  style={{ 
                    width: `${layer.progress}%`,
                    background: layer.status === "live" ? "var(--green)" : layer.status === "building" ? "var(--gold)" : "var(--text-dim)"
                  }}
                />
              </div>
              <div className={`omega-layer-status ${layer.status}`}>
                <span className="omega-layer-status-dot" />
                {layer.status === "live" ? "● Live" : layer.status === "building" ? "◐ Building" : "○ Planned"} · {layer.progress}%
              </div>
            </div>
          ))}
        </div>

        {/* Agentic Loop Visualizer */}
        <div className="omega-loop-section">
          <div className="omega-loop-title">Your Ecosystem Journey — Loop #1 in Progress</div>
          <div className="omega-loop-visual">
            {LOOP_STAGES.map((stage, index) => (
              <div key={stage.id} className={`omega-loop-node ${stage.completed ? "completed" : ""} ${stage.current ? "current" : ""}`}>
                <div className="omega-loop-node-icon">{stage.icon}</div>
                <span className="omega-loop-node-label">{stage.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Feed & Action Queue */}
        <div className="omega-feed">
          <div className="omega-feed-main">
            <div className="omega-feed-title">Cross-Layer Intelligence</div>
            {INTELLIGENCE_FEED.map((item, index) => (
              <div key={index} className="omega-feed-item">
                <div className="omega-feed-icon">{item.icon}</div>
                <div className="omega-feed-content">
                  <div className="omega-feed-text">{item.text}</div>
                  <div className="omega-feed-meta">{item.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="omega-actions">
            <div className="omega-actions-title">Action Queue</div>
            <div className="omega-action-item">
              <span className="omega-action-text">Complete React Module 4 to unlock Work badges</span>
              <button className="omega-action-btn">Approve</button>
            </div>
            <div className="omega-action-item">
              <span className="omega-action-text">NOVA wants to recommend Academy courses</span>
              <button className="omega-action-btn">Review</button>
            </div>
            <div className="omega-action-item">
              <span className="omega-action-text">ATLAS detected vendor opportunity</span>
              <button className="omega-action-btn">View</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
