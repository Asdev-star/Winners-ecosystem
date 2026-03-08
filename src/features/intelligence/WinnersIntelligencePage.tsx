// src/features/intelligence/WinnersIntelligencePage.tsx
// Phase 5 - Winners Intelligence Layer
// Main AI Dashboard - 9 Assistant Hub + Neural Visualizer

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContextBar from "../../components/ui/ContextBar";
import AIInsightBanner from "../../components/ui/AIInsightBanner";

const ASSISTANTS = [
  {
    id: "omega",
    name: "OMEGA",
    emoji: "🧠",
    role: "Master Orchestrator",
    description: "Cross-platform intelligence, Agentic Loop driver, ecosystem health supervisor",
    color: "var(--gold)",
    status: "live",
    capabilities: ["Strategic planning", "Cross-layer insights", "Revenue optimization", "Ecosystem monitoring"]
  },
  {
    id: "aria",
    name: "ARIA",
    emoji: "⬡",
    role: "Core Engine",
    description: "Dashboard insights, billing help, workspace management",
    color: "var(--blue)",
    status: "live",
    capabilities: ["Analytics", "Billing", "Workspace", "Tenant management"]
  },
  {
    id: "nova",
    name: "NOVA",
    emoji: "👥",
    role: "Community",
    description: "Content moderation, creator growth, talent detection, community AI",
    color: "var(--ice)",
    status: "building",
    capabilities: ["Moderation", "Creator coaching", "Talent spotting", "Trend analysis"]
  },
  {
    id: "sage",
    name: "SAGE",
    emoji: "🎓",
    role: "Academy",
    description: "Course tutoring, PDF analysis, lecture notes, skill guidance",
    color: "var(--green)",
    status: "building",
    capabilities: ["Tutoring", "PDF analysis", "Notes generation", "Skill assessment"]
  },
  {
    id: "atlas",
    name: "ATLAS",
    emoji: "🛒",
    role: "Market",
    description: "Product research, pricing strategy, vendor intelligence",
    color: "var(--purple)",
    status: "planned",
    capabilities: ["Market analysis", "Pricing", "Vendor research", "Product insights"]
  },
  {
    id: "forge",
    name: "FORGE",
    emoji: "🤖",
    role: "Intelligence",
    description: "Model routing, AI cost management, multimodal orchestration",
    color: "var(--red)",
    status: "building",
    capabilities: ["Model selection", "Cost optimization", "Performance tuning", "Provider routing"]
  },
  {
    id: "circuit",
    name: "CIRCUIT",
    emoji: "💼",
    role: "Work",
    description: "Job matching, proposal writing, contract review, code review",
    color: "var(--gold)",
    status: "planned",
    capabilities: ["Job matching", "Proposals", "Contracts", "Code review"]
  },
  {
    id: "nexus",
    name: "NEXUS",
    emoji: "☁️",
    role: "Cloud",
    description: "API guidance, SDK support, integration troubleshooting",
    color: "var(--blue)",
    status: "planned",
    capabilities: ["API docs", "SDK support", "Integrations", "Developer help"]
  },
  {
    id: "herald",
    name: "HERALD",
    emoji: "🧬",
    role: "AI Platform",
    description: "Ollama management, GPU routing, model benchmarking",
    color: "var(--purple)",
    status: "building",
    capabilities: ["Local AI", "GPU management", "Benchmarks", "Model deployment"]
  }
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .intelligence-page {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    padding: 24px;
  }

  .intelligence-header {
    margin-bottom: 32px;
  }
  
  .intelligence-header h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px;
    font-weight: 300;
    margin: 0 0 8px;
    background: linear-gradient(135deg, var(--gold), #E8D5A3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .intelligence-header p {
    color: var(--text-dim);
    font-size: 14px;
    margin: 0;
  }

  .context-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .ctx-badge {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    padding: 4px 10px;
    border-radius: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .ctx-badge.live {
    border-color: var(--green);
    color: var(--green);
  }

  .ctx-badge.active {
    background: var(--gold);
    color: var(--bg);
    border-color: var(--gold);
  }

  .ctx-badge.planned {
    opacity: 0.5;
  }

  .ctx-sep {
    color: var(--text-dim);
    align-self: center;
  }

  /* Neural Visualizer */
  .neural-visualizer {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 24px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
  }

  .neural-visualizer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--purple), var(--gold), var(--ice));
  }

  .neural-title {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-dim);
    margin-bottom: 16px;
  }

  .neural-grid {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-height: 80px;
  }

  .neural-node {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    animation: pulse 2s ease-in-out infinite;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .neural-node:hover {
    transform: scale(1.1);
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }

  .neural-line {
    height: 2px;
    width: 20px;
    background: linear-gradient(90deg, var(--border), var(--gold), var(--border));
  }

  /* Assistant Grid */
  .assistant-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .assistant-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 20px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .assistant-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--card-color, var(--gold)), transparent);
  }

  .assistant-card:hover {
    transform: translateY(-2px);
    border-color: var(--card-color, var(--gold));
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }

  .assistant-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .assistant-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    background: var(--card-color, var(--gold));
  }

  .assistant-info h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: var(--card-color, var(--gold));
  }

  .assistant-role {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-dim);
  }

  .assistant-status {
    margin-left: auto;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    padding: 3px 8px;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .assistant-status.live {
    background: rgba(45, 212, 160, 0.15);
    color: var(--green);
  }

  .assistant-status.building {
    background: rgba(201, 168, 76, 0.15);
    color: var(--gold);
  }

  .assistant-status.planned {
    background: rgba(90, 122, 150, 0.15);
    color: var(--text-dim);
  }

  .assistant-description {
    font-size: 13px;
    color: var(--text-dim);
    margin-bottom: 12px;
    line-height: 1.5;
  }

  .assistant-capabilities {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .capability-tag {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    padding: 3px 8px;
    background: var(--surface2);
    border-radius: 3px;
    color: var(--text-dim);
  }

  /* Model Selector */
  .model-selector {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 16px 20px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .model-selector-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
  }

  .model-options {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .model-option {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    transition: all 0.2s;
  }

  .model-option:hover {
    border-color: var(--gold);
  }

  .model-option.active {
    background: var(--gold);
    color: var(--bg);
    border-color: var(--gold);
  }

  /* Stats Row */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 32px;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 16px;
    text-align: center;
  }

  .stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--gold);
  }

  .stat-label {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    margin-top: 4px;
  }
`;

export default function WinnersIntelligencePage() {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState("claude");

  const handleAssistantClick = (assistantId: string) => {
    if (assistantId === "aria") {
      navigate("/intelligence/aria");
    } else {
      // Future: navigate to specific assistant chat
      console.log(`Opening ${assistantId}...`);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="intelligence-page">
        {/* Context Bar */}
        <div className="context-bar">
          <span className="ctx-badge live">⬡ Core Engine</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge planned">🧑‍🤝‍🧑 Community</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge planned">🎓 Academy</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge planned">🛒 Market</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge active">🤖 Intelligence</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge planned">💼 Work</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge planned">☁️ Cloud</span>
        </div>

        {/* Header */}
        <div className="intelligence-header">
          <h1>Winners Intelligence</h1>
          <p>9 AI assistants. One ecosystem. Unlimited possibilities.</p>
        </div>
        
        {/* AI Insight Banner - FORGE oversees the AI platform */}
        <AIInsightBanner page="intelligence" assistant="forge" />

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">9</div>
            <div className="stat-label">AI Assistants</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">4</div>
            <div className="stat-label">Providers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">∞</div>
            <div className="stat-label">Context Window</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">24/7</div>
            <div className="stat-label">Availability</div>
          </div>
        </div>

        {/* Model Selector */}
        <div className="model-selector">
          <span className="model-selector-label">Active Model:</span>
          <div className="model-options">
            <button 
              className={`model-option ${selectedModel === "claude" ? "active" : ""}`}
              onClick={() => setSelectedModel("claude")}
            >
              Claude
            </button>
            <button 
              className={`model-option ${selectedModel === "gpt4o" ? "active" : ""}`}
              onClick={() => setSelectedModel("gpt4o")}
            >
              GPT-4o
            </button>
            <button 
              className={`model-option ${selectedModel === "gemini" ? "active" : ""}`}
              onClick={() => setSelectedModel("gemini")}
            >
              Gemini
            </button>
            <button 
              className={`model-option ${selectedModel === "ollama" ? "active" : ""}`}
              onClick={() => setSelectedModel("ollama")}
            >
              Ollama
            </button>
          </div>
        </div>

        {/* Neural Visualizer */}
        <div className="neural-visualizer">
          <div className="neural-title">Neural Network Visualization</div>
          <div className="neural-grid">
            <div className="neural-node" style={{background: "var(--gold)"}}>🧠</div>
            <div className="neural-line"></div>
            <div className="neural-node" style={{background: "var(--blue)"}}>⬡</div>
            <div className="neural-node" style={{background: "var(--ice)"}}>👥</div>
            <div className="neural-node" style={{background: "var(--green)"}}>🎓</div>
            <div className="neural-line"></div>
            <div className="neural-node" style={{background: "var(--purple)"}}>🛒</div>
            <div className="neural-node" style={{background: "var(--red)"}}>🤖</div>
            <div className="neural-line"></div>
            <div className="neural-node" style={{background: "var(--gold)"}}>💼</div>
            <div className="neural-node" style={{background: "var(--blue)"}}>☁️</div>
            <div className="neural-node" style={{background: "var(--purple)"}}>🧬</div>
          </div>
        </div>

        {/* Assistant Grid */}
        <div className="assistant-grid">
          {ASSISTANTS.map((assistant) => (
            <div 
              key={assistant.id}
              className="assistant-card"
              style={{ "--card-color": assistant.color } as React.CSSProperties}
              onClick={() => handleAssistantClick(assistant.id)}
            >
              <div className="assistant-card-header">
                <div 
                  className="assistant-avatar"
                  style={{ background: assistant.color }}
                >
                  {assistant.emoji}
                </div>
                <div className="assistant-info">
                  <h3>{assistant.name}</h3>
                  <span className="assistant-role">{assistant.role}</span>
                </div>
                <span className={`assistant-status ${assistant.status}`}>
                  {assistant.status}
                </span>
              </div>
              <p className="assistant-description">{assistant.description}</p>
              <div className="assistant-capabilities">
                {assistant.capabilities.map((cap) => (
                  <span key={cap} className="capability-tag">{cap}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
