// Phase 3 — ATLAS AI Integration
// src/features/market/atlas/AtlasContextBar.tsx

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../features/auth/authStore';

interface AtlasContextBarProps {
  view: string;
}

export default function AtlasContextBar({ view }: AtlasContextBarProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s: { token?: string }) => s.token);

  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    fetch(`/api/v1/ai/atlas/market-insight?view=${view}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { setInsight(d.insight); setLoading(false); })
      .catch(() => setLoading(false));
  }, [view, token]);

  if (loading) return (
    <div style={{
      margin: '12px 24px', height: 40,
      background: 'linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%)',
      backgroundSize: '200% 100%',
      borderRadius: 6,
      animation: 'shimmer 1.4s ease infinite'
    }} />
  );
  if (!insight) return null;

  return (
    <div style={{
      margin: '12px 24px',
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, var(--gold), transparent)'
      }} />
      <span style={{
        fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '.1em',
        textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap'
      }}>⚡ ATLAS</span>
      <p style={{ color: 'var(--text)', fontSize: 12, flex: 1, margin: 0, lineHeight: 1.5 }}>
        {insight}
      </p>
      <button style={{
        fontFamily: "'Space Mono', monospace", fontSize: 9, color: 'var(--gold)',
        background: 'none', border: '1px solid rgba(201,168,76,.3)',
        borderRadius: 3, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap'
      }}>
        Ask ATLAS →
      </button>
    </div>
  );
}