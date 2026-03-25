// Phase 6 — Plan-Gated Features & Services
// src/components/shared/PlanGate.tsx

import { useAuthStore } from '../../features/auth/authStore';

interface PlanGateProps {
  requiredPlan: 'PRO' | 'ENTERPRISE';
  feature: string;
  description?: string;
  children: React.ReactNode;
}

export default function PlanGate({ requiredPlan, feature, description, children }: PlanGateProps) {
  const user = useAuthStore((s) => s.user);
  
  const hasAccess =
    (requiredPlan === 'PRO' && ['PRO', 'ENTERPRISE'].includes(user?.plan || '')) ||
    (requiredPlan === 'ENTERPRISE' && user?.plan === 'ENTERPRISE');

  if (hasAccess) return <>{children}</>;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '24px', textAlign: 'center',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, var(--gold), transparent)'
      }} />
      <span style={{
        display: 'inline-block', background: 'var(--gold)', color: '#0D1520',
        padding: '2px 10px', borderRadius: 3, fontSize: 10, fontWeight: 700,
        fontFamily: "'Space Mono', monospace", marginBottom: 12
      }}>{requiredPlan}</span>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
        {feature}
      </h4>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16, lineHeight: 1.6 }}>
        {description || `${feature} is available on ${requiredPlan} plan and above.`}
      </p>
      <a href="/billing" style={{
        display: 'inline-block', background: 'var(--gold)', color: '#0D1520',
        padding: '8px 20px', borderRadius: 4, fontWeight: 700,
        textDecoration: 'none', fontSize: 13, fontFamily: "'Syne', sans-serif"
      }}>Upgrade to {requiredPlan} →</a>
    </div>
  );
}