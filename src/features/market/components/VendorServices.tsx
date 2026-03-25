// Phase 6 — Vendor-Side Recommended Services
// src/features/market/components/VendorServices.tsx

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/authStore';

interface VendorService {
  id: string;
  title: string;
  description: string;
  layer: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  cta: string;
}

const VENDOR_SERVICES: VendorService[] = [
  {
    id: 'atlas-research',
    title: 'ATLAS Product Research',
    description: 'AI market research for any niche — demand signals, competitor pricing, margin recommendations.',
    layer: 'market',
    plan: 'PRO',
    cta: 'Run Research →'
  },
  {
    id: 'academy-seller',
    title: 'Seller Courses — Academy',
    description: 'Complete "How to Sell on Winners Market" and earn a Certified Vendor badge.',
    layer: 'academy',
    plan: 'FREE',
    cta: 'Start Course →'
  },
  {
    id: 'work-freelancers',
    title: 'Hire via Winners Work',
    description: 'Find photographers, designers, and copywriters to improve your listings.',
    layer: 'work',
    plan: 'FREE',
    cta: 'Browse Talent →'
  },
  {
    id: 'verified-vendor',
    title: 'Verified Vendor Badge',
    description: 'Submit business documents for admin review. Verified badge increases buyer trust and conversion.',
    layer: 'market',
    plan: 'PRO',
    cta: 'Apply for Verification →'
  },
  {
    id: 'promotion-engine',
    title: 'Discount Codes & Flash Sales',
    description: 'ATLAS recommends optimal discount percentage based on your conversion data.',
    layer: 'market',
    plan: 'ENTERPRISE',
    cta: 'Create Promotion →'
  }
];

export default function VendorServices() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user) as any;
  const userPlan = user?.plan || 'FREE';

  const hasAccess = (requiredPlan: 'FREE' | 'PRO' | 'ENTERPRISE') => {
    if (requiredPlan === 'FREE') return true;
    if (requiredPlan === 'PRO') return ['PRO', 'ENTERPRISE'].includes(userPlan);
    return userPlan === 'ENTERPRISE';
  };

  const handleAction = (service: VendorService) => {
    switch (service.id) {
      case 'atlas-research':
        // Open ATLAS research modal or navigate
        navigate('/intelligence?panel=atlas-research');
        break;
      case 'academy-seller':
        navigate('/academy/courses/sell-on-winners');
        break;
      case 'work-freelancers':
        navigate('/work');
        break;
      case 'verified-vendor':
        navigate('/market/vendor/verify');
        break;
      case 'promotion-engine':
        navigate('/market/vendor/promotions');
        break;
      default:
        break;
    }
  };

  const availableServices = VENDOR_SERVICES.filter(s => hasAccess(s.plan));

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--text)',
        marginBottom: 16,
        fontFamily: "'Syne', sans-serif"
      }}>
        Grow Your Business
      </h3>
      
      <div style={{ display: 'grid', gap: 12 }}>
        {availableServices.map((service) => (
          <div
            key={service.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 14,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: service.plan === 'ENTERPRISE' 
                ? 'linear-gradient(90deg, var(--purple), transparent)'
                : service.plan === 'PRO'
                ? 'linear-gradient(90deg, var(--gold), transparent)'
                : 'linear-gradient(90deg, var(--green), transparent)'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: service.plan === 'ENTERPRISE' ? 'var(--purple)' 
                      : service.plan === 'PRO' ? 'var(--gold)' 
                      : 'var(--green)',
                    fontFamily: "'Space Mono', monospace"
                  }}>
                    {service.plan}
                  </span>
                  <span style={{
                    fontSize: 10,
                    color: 'var(--text-dim)',
                    fontFamily: "'Space Mono', monospace"
                  }}>
                    {service.layer.toUpperCase()}
                  </span>
                </div>
                <h4 style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  margin: '0 0 4px 0'
                }}>
                  {service.title}
                </h4>
                <p style={{
                  fontSize: 11,
                  color: 'var(--text-dim)',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  {service.description}
                </p>
              </div>
              <button
                onClick={() => handleAction(service)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--gold)',
                  color: 'var(--gold)',
                  borderRadius: 4,
                  padding: '6px 12px',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  marginLeft: 12,
                  fontFamily: "'Space Mono', monospace"
                }}
              >
                {service.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}