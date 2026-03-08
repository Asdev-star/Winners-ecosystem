// src/components/ui/CrossLayerHandoff.tsx
// Phase 2 V2.0: Cross-Layer Handoff Cards
// Implements: NOVA → SAGE, NOVA → CIRCUIT, NOVA → ATLAS handoff moments

import { useState } from "react";

interface HandoffCardProps {
  type: 'academy' | 'work' | 'market';
  title: string;
  subtitle: string;
  details: React.ReactNode;
  actionLabel: string;
  loopStage?: number;
  onAction?: () => void;
  onDismiss?: () => void;
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

.handoff-overlay {
  position: fixed; inset: 0; background: rgba(13, 21, 32, 0.85);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
  animation: handoff-fade-in 0.3s ease;
}
@keyframes handoff-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.handoff-card {
  background: var(--surface); border-radius: 16px;
  max-width: 420px; width: 100%; position: relative;
  overflow: hidden; animation: handoff-slide-up 0.4s ease;
}
@keyframes handoff-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Top gradient bar - varies by type */
.handoff-card.academy::before,
.handoff-card.work::before,
.handoff-card.market::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
}
.handoff-card.academy::before {
  background: linear-gradient(90deg, var(--green), transparent);
}
.handoff-card.work::before {
  background: linear-gradient(90deg, var(--blue), transparent);
}
.handoff-card.market::before {
  background: linear-gradient(90deg, var(--gold), transparent);
}

/* Header */
.handoff-header {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 20px 0;
}
.handoff-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.handoff-card.academy .handoff-icon {
  background: rgba(45, 212, 160, 0.12);
  border: 1px solid rgba(45, 212, 160, 0.2);
}
.handoff-card.work .handoff-icon {
  background: rgba(43, 95, 142, 0.12);
  border: 1px solid rgba(43, 95, 142, 0.2);
}
.handoff-card.market .handoff-icon {
  background: rgba(201, 168, 76, 0.12);
  border: 1px solid rgba(201, 168, 76, 0.2);
}

.handoff-meta { flex: 1; }
.handoff-assistant {
  font-family: 'Space Mono', monospace; font-size: 10px;
  letter-spacing: 0.12em; text-transform: uppercase;
}
.handoff-card.academy .handoff-assistant { color: var(--green); }
.handoff-card.work .handoff-assistant { color: var(--blue); }
.handoff-card.market .handoff-assistant { color: var(--gold); }

.handoff-type {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-dim); margin-top: 2px;
}

.handoff-close {
  background: none; border: none; color: var(--text-dim);
  font-size: 20px; cursor: pointer; padding: 4px;
  transition: color 0.15s;
}
.handoff-close:hover { color: var(--text); }

/* Body */
.handoff-body { padding: 16px 20px; }
.handoff-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px; font-weight: 600; color: var(--text);
  margin-bottom: 8px;
}
.handoff-subtitle {
  font-size: 14px; color: var(--text-dim);
  line-height: 1.6; margin-bottom: 16px;
}
.handoff-details {
  background: var(--surface2); border-radius: 10px;
  padding: 14px; margin-bottom: 16px;
}
.handoff-detail-row {
  display: flex; justify-content: space-between;
  align-items: center; padding: 6px 0;
}
.handoff-detail-row:not(:last-child) {
  border-bottom: 1px solid var(--border);
}
.handoff-detail-label {
  font-family: 'Space Mono', monospace; font-size: 10px;
  color: var(--text-dim); text-transform: uppercase;
}
.handoff-detail-value {
  font-size: 13px; font-weight: 600; color: var(--text);
}
.handoff-card.academy .handoff-detail-value { color: var(--green); }
.handoff-card.work .handoff-detail-value { color: var(--blue); }
.handoff-card.market .handoff-detail-value { color: var(--gold); }

/* AI Draft */
.handoff-draft {
  background: rgba(155, 111, 255, 0.06);
  border: 1px solid rgba(155, 111, 255, 0.15);
  border-radius: 10px; padding: 12px; margin-bottom: 16px;
}
.handoff-draft-label {
  font-family: 'Space Mono', monospace; font-size: 9px;
  color: var(--purple); text-transform: uppercase;
  margin-bottom: 6px; display: flex; align-items: center; gap: 4px;
}
.handoff-draft-text {
  font-size: 13px; color: var(--text); line-height: 1.5;
}

/* Loop Progress */
.handoff-loop {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px;
}
.handoff-loop-label {
  font-family: 'Space Mono', monospace; font-size: 10px;
  color: var(--text-dim);
}
.handoff-loop-bar {
  flex: 1; height: 4px; background: var(--border);
  border-radius: 2px; overflow: hidden;
}
.handoff-loop-fill {
  height: 100%; background: linear-gradient(90deg, var(--gold), var(--ice));
  border-radius: 2px; transition: width 0.5s ease;
}
.handoff-loop-stage {
  font-family: 'Space Mono', monospace; font-size: 10px;
  color: var(--gold);
}

/* Actions */
.handoff-actions {
  display: flex; gap: 10px; padding: 0 20px 20px;
}
.handoff-btn {
  flex: 1; padding: 12px 16px; border-radius: 10px;
  font-family: 'Syne', sans-serif; font-size: 13px;
  font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.handoff-btn.primary {
  border: none;
}
.handoff-card.academy .handoff-btn.primary {
  background: var(--green); color: var(--bg);
}
.handoff-card.academy .handoff-btn.primary:hover {
  background: var(--green); transform: translateY(-1px);
}
.handoff-card.work .handoff-btn.primary {
  background: var(--blue); color: white;
}
.handoff-card.work .handoff-btn.primary:hover {
  background: var(--blue); transform: translateY(-1px);
}
.handoff-card.market .handoff-btn.primary {
  background: var(--gold); color: var(--bg);
}
.handoff-card.market .handoff-btn.primary:hover {
  background: var(--gold); transform: translateY(-1px);
}

.handoff-btn.secondary {
  background: transparent; border: 1px solid var(--border);
  color: var(--text-dim);
}
.handoff-btn.secondary:hover {
  border-color: var(--text-dim); color: var(--text);
}

/* Mini Card Variant */
.handoff-mini {
  background: var(--surface); border-radius: 12px;
  border: 1px solid var(--border); padding: 14px;
  display: flex; align-items: center; gap: 12px;
  cursor: pointer; transition: all 0.2s;
}
.handoff-mini:hover {
  transform: translateX(4px);
  border-color: rgba(137, 196, 225, 0.3);
}
.handoff-card.academy .handoff-mini:hover {
  border-color: rgba(45, 212, 160, 0.3);
}
.handoff-card.work .handoff-mini:hover {
  border-color: rgba(43, 95, 142, 0.3);
}
.handoff-card.market .handoff-mini:hover {
  border-color: rgba(201, 168, 76, 0.3);
}

.handoff-mini-icon {
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.handoff-card.academy .handoff-mini-icon { background: rgba(45, 212, 160, 0.1); }
.handoff-card.work .handoff-mini-icon { background: rgba(43, 95, 142, 0.1); }
.handoff-card.market .handoff-mini-icon { background: rgba(201, 168, 76, 0.1); }

.handoff-mini-content { flex: 1; min-width: 0; }
.handoff-mini-title {
  font-size: 13px; font-weight: 700; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.handoff-mini-subtitle {
  font-size: 11px; color: var(--text-dim);
}

.handoff-mini-arrow {
  color: var(--text-dim); font-size: 16px;
}

/* Responsive */
@media (max-width: 480px) {
  .handoff-card { max-width: 100%; }
  .handoff-actions { flex-direction: column; }
}
`;

export function HandoffCard({ 
  type, title, subtitle, details, actionLabel, loopStage = 2, onAction, onDismiss 
}: HandoffCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'academy': return '🎓';
      case 'work': return '💼';
      case 'market': return '🛒';
    }
  };

  const getAssistant = () => {
    switch (type) {
      case 'academy': return 'SAGE';
      case 'work': return 'CIRCUIT';
      case 'market': return 'ATLAS';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'academy': return 'Learning Opportunity';
      case 'work': return 'Opportunity Match';
      case 'market': return 'Market Signal';
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="handoff-overlay" onClick={onDismiss}>
        <div className={`handoff-card ${type}`} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="handoff-header">
            <div className="handoff-icon">{getIcon()}</div>
            <div className="handoff-meta">
              <div className="handoff-assistant">{getAssistant()}</div>
              <div className="handoff-type">{getTypeLabel()}</div>
            </div>
            <button className="handoff-close" onClick={onDismiss}>×</button>
          </div>

          {/* Body */}
          <div className="handoff-body">
            <h3 className="handoff-title">{title}</h3>
            <p className="handoff-subtitle">{subtitle}</p>

            {/* Details */}
            <div className="handoff-details">
              {details}
            </div>

            {/* AI Draft (for Work type) */}
            {type === 'work' && (
              <div className="handoff-draft">
                <div className="handoff-draft-label">🤖 CIRCUIT has drafted an opener for you</div>
                <p className="handoff-draft-text">
                  "Hi [Name], I came across your React developer position and I'm excited to apply. 
                  With 3 years of experience building fintech applications and a strong background 
                  in TypeScript, I believe I can contribute to your team's mission..."
                </p>
              </div>
            )}

            {/* Loop Progress */}
            <div className="handoff-loop">
              <span className="handoff-loop-label">Loop Progress</span>
              <div className="handoff-loop-bar">
                <div className="handoff-loop-fill" style={{ width: `${(loopStage / 7) * 100}%` }} />
              </div>
              <span className="handoff-loop-stage">Stage {loopStage}/7</span>
            </div>
          </div>

          {/* Actions */}
          <div className="handoff-actions">
            <button className="handoff-btn secondary" onClick={onDismiss}>
              Maybe Later
            </button>
            <button className="handoff-btn primary" onClick={onAction}>
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Mini handoff for inline display
export function MiniHandoffCard({ 
  type, title, subtitle, onClick 
}: { 
  type: 'academy' | 'work' | 'market'; 
  title: string; 
  subtitle: string; 
  onClick?: () => void; 
}) {
  const getIcon = () => {
    switch (type) {
      case 'academy': return '🎓';
      case 'work': return '💼';
      case 'market': return '🛒';
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className={`handoff-mini ${type}`} onClick={onClick}>
        <div className="handoff-mini-icon">{getIcon()}</div>
        <div className="handoff-mini-content">
          <div className="handoff-mini-title">{title}</div>
          <div className="handoff-mini-subtitle">{subtitle}</div>
        </div>
        <span className="handoff-mini-arrow">→</span>
      </div>
    </>
  );
}

// Demo component to showcase the handoffs
export function HandoffDemo() {
  const [showAcademy, setShowAcademy] = useState(false);
  const [showWork, setShowWork] = useState(false);
  const [showMarket, setShowMarket] = useState(false);

  return (
    <>
      <style>{css}</style>
      <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <h2 style={{ fontFamily: 'Syne', color: 'var(--text)', marginBottom: 24 }}>
          Cross-Layer Handoff Cards
        </h2>
        
        <button 
          onClick={() => setShowAcademy(true)}
          style={{ padding: '12px 24px', background: 'var(--green)', color: 'var(--bg)', 
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          Show Academy Handoff (SAGE)
        </button>
        
        <button 
          onClick={() => setShowWork(true)}
          style={{ padding: '12px 24px', background: 'var(--blue)', color: 'white', 
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          Show Work Handoff (CIRCUIT)
        </button>
        
        <button 
          onClick={() => setShowMarket(true)}
          style={{ padding: '12px 24px', background: 'var(--gold)', color: 'var(--bg)', 
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          Show Market Handoff (ATLAS)
        </button>

        {showAcademy && (
          <HandoffCard
            type="academy"
            title="Skill Detected"
            subtitle="You just wrote about React hooks and people felt it. SAGE is ready to take you further."
            details={
              <div>
                <div className="handoff-detail-row">
                  <span className="handoff-detail-label">Course</span>
                  <span className="handoff-detail-value">Advanced React Patterns</span>
                </div>
                <div className="handoff-detail-row">
                  <span className="handoff-detail-label">Rating</span>
                  <span className="handoff-detail-value">4.9 ★ (847 enrolled)</span>
                </div>
              </div>
            }
            actionLabel="Continue Your Loop →"
            loopStage={2}
            onAction={() => setShowAcademy(false)}
            onDismiss={() => setShowAcademy(false)}
          />
        )}

        {showWork && (
          <HandoffCard
            type="work"
            title="Opportunity Match"
            subtitle="Your post reached 3 hiring managers this week."
            details={
              <div>
                <div className="handoff-detail-row">
                  <span className="handoff-detail-label">Position</span>
                  <span className="handoff-detail-value">React Developer — Lagos Fintech</span>
                </div>
                <div className="handoff-detail-row">
                  <span className="handoff-detail-label">Match Score</span>
                  <span className="handoff-detail-value">94%</span>
                </div>
                <div className="handoff-detail-row">
                  <span className="handoff-detail-label">Salary</span>
                  <span className="handoff-detail-value">$1,800/mo</span>
                </div>
              </div>
            }
            actionLabel="Apply with AI Draft →"
            loopStage={4}
            onAction={() => setShowWork(false)}
            onDismiss={() => setShowWork(false)}
          />
        )}

        {showMarket && (
          <HandoffCard
            type="market"
            title="Market Signal"
            subtitle="Your followers are asking about your process."
            details={
              <div>
                <div className="handoff-detail-row">
                  <span className="handoff-detail-label">Product Idea</span>
                  <span className="handoff-detail-value">Design Systems Template Pack</span>
                </div>
                <div className="handoff-detail-row">
                  <span className="handoff-detail-label">Potential Buyers</span>
                  <span className="handoff-detail-value">11 in your network</span>
                </div>
              </div>
            }
            actionLabel="Create a Product →"
            loopStage={5}
            onAction={() => setShowMarket(false)}
            onDismiss={() => setShowMarket(false)}
          />
        )}
      </div>
    </>
  );
}

export default HandoffCard;
