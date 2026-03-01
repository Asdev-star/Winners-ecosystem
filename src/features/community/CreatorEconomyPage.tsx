// ─── Phase 2: Winners Community — Creator Economy Page ───────────────────────
// CreatorEconomyPage.tsx - Creator subscriptions, tiers, and earnings management

import { useEffect, useState } from 'react';
import { useCreatorStore } from './creatorStore';
import { useAuthStore } from '../auth/authStore';

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: '36px',
    fontWeight: 300,
    color: 'var(--gold)',
    marginBottom: '8px',
  },
  subtitle: {
    fontFamily: '"Syne", sans-serif',
    fontSize: '14px',
    color: 'var(--text-dim)',
    letterSpacing: '0.05em',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '32px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '8px',
  },
  tab: {
    padding: '12px 24px',
    fontFamily: '"Syne", sans-serif',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-dim)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  tabActive: {
    color: 'var(--gold)',
    borderBottom: '2px solid var(--gold)',
    marginBottom: '-9px',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '24px',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, var(--gold), transparent)',
  },
  cardTitle: {
    fontFamily: '"Syne", sans-serif',
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '16px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    background: 'var(--surface2)',
    borderRadius: '6px',
    padding: '20px',
    border: '1px solid var(--border)',
  },
  statLabel: {
    fontFamily: '"Space Mono", monospace',
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
    color: 'var(--text-dim)',
    marginBottom: '8px',
  },
  statValue: {
    fontFamily: '"Syne", sans-serif',
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--gold)',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontFamily: '"Space Mono", monospace',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--text-dim)',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontFamily: '"Syne", sans-serif',
    fontSize: '14px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    fontFamily: '"Syne", sans-serif',
    fontSize: '14px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    color: 'var(--text)',
    outline: 'none',
    minHeight: '100px',
    resize: 'vertical' as const,
  },
  button: {
    padding: '14px 28px',
    fontFamily: '"Syne", sans-serif',
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    background: 'var(--gold)',
    color: 'var(--bg)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  buttonSecondary: {
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  tierCard: {
    background: 'var(--surface2)',
    borderRadius: '6px',
    padding: '24px',
    border: '1px solid var(--border)',
  },
  tierName: {
    fontFamily: '"Syne", sans-serif',
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '8px',
  },
  tierPrice: {
    fontFamily: '"Space Mono", monospace',
    fontSize: '24px',
    color: 'var(--gold)',
    marginBottom: '16px',
  },
  tierDescription: {
    fontFamily: '"Syne", sans-serif',
    fontSize: '14px',
    color: 'var(--text-dim)',
    marginBottom: '16px',
  },
  benefitsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  benefit: {
    fontFamily: '"Syne", sans-serif',
    fontSize: '13px',
    color: 'var(--text)',
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  },
  subscriberCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: 'var(--surface2)',
    borderRadius: '6px',
    marginBottom: '12px',
  },
  subscriberAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'var(--gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Syne", sans-serif',
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--bg)',
  },
  subscriberInfo: {
    flex: 1,
  },
  subscriberName: {
    fontFamily: '"Syne", sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  subscriberTier: {
    fontFamily: '"Space Mono", monospace',
    fontSize: '11px',
    color: 'var(--text-dim)',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: 'var(--text-dim)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontFamily: '"Syne", sans-serif',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '8px',
  },
};

export default function CreatorEconomyPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tier' | 'subscribers' | 'subscriptions'>('overview');
  const { user } = useAuthStore();
  const {
    tier,
    subscribers,
    earnings,
    mySubscriptions,
    loading,
    fetchTier,
    createOrUpdateTier,
    fetchSubscribers,
    fetchEarnings,
    fetchMySubscriptions
  } = useCreatorStore();

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'tier') {
      fetchTier();
      fetchEarnings();
    }
    if (activeTab === 'subscribers') {
      fetchSubscribers();
    }
    if (activeTab === 'subscriptions') {
      fetchMySubscriptions();
    }
  }, [activeTab]);

  const [tierForm, setTierForm] = useState({
    name: '',
    description: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    benefits: ['']
  });

  useEffect(() => {
    if (tier) {
      setTierForm({
        name: tier.name,
        description: tier.description,
        monthlyPrice: tier.monthlyPrice,
        yearlyPrice: tier.yearlyPrice,
        benefits: tier.benefits.length > 0 ? tier.benefits : ['']
      });
    }
  }, [tier]);

  const handleSaveTier = async () => {
    await createOrUpdateTier({
      ...tierForm,
      benefits: tierForm.benefits.filter(b => b.trim() !== ''),
      isActive: true
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div style={styles.container}>
      <style>{`
        input:focus, textarea:focus {
          border-color: var(--gold) !important;
        }
        button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>

      <div style={styles.header}>
        <h1 style={styles.title}>Creator Economy</h1>
        <p style={styles.subtitle}>MONETIZE YOUR CONTENT · BUILD YOUR COMMUNITY</p>
      </div>

      <div style={styles.tabContainer}>
        {(['overview', 'tier', 'subscribers', 'subscriptions'] as const).map(tab => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'subscriptions' ? 'My Subscriptions' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total Earnings</div>
              <div style={styles.statValue}>{formatCurrency(earnings?.totalEarnings || 0)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Monthly Earnings</div>
              <div style={styles.statValue}>{formatCurrency(earnings?.monthlyEarnings || 0)}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Active Subscribers</div>
              <div style={styles.statValue}>{earnings?.subscriberCount || 0}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Your Tier</div>
              <div style={{...styles.statValue, fontSize: '20px'}}>{earnings?.tier?.name || 'Not Set'}</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardGlow} />
            <h2 style={styles.cardTitle}>Quick Actions</h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button style={styles.button} onClick={() => setActiveTab('tier')}>
                {tier ? 'Edit Tier' : 'Create Tier'}
              </button>
              <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={() => setActiveTab('subscribers')}>
                View Subscribers
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'tier' && (
        <div style={styles.card}>
          <div style={styles.cardGlow} />
          <h2 style={styles.cardTitle}>{tier ? 'Edit Your Tier' : 'Create Subscription Tier'}</h2>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Tier Name</label>
            <input
              type="text"
              style={styles.input}
              value={tierForm.name}
              onChange={e => setTierForm({ ...tierForm, name: e.target.value })}
              placeholder="e.g., Pro Fan, Premium Supporter"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              style={styles.textarea}
              value={tierForm.description}
              onChange={e => setTierForm({ ...tierForm, description: e.target.value })}
              placeholder="What do subscribers get access to?"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Monthly Price (cents)</label>
              <input
                type="number"
                style={styles.input}
                value={tierForm.monthlyPrice}
                onChange={e => setTierForm({ ...tierForm, monthlyPrice: parseInt(e.target.value) || 0 })}
                placeholder="500 = $5.00"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Yearly Price (cents)</label>
              <input
                type="number"
                style={styles.input}
                value={tierForm.yearlyPrice}
                onChange={e => setTierForm({ ...tierForm, yearlyPrice: parseInt(e.target.value) || 0 })}
                placeholder="5000 = $50.00"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Benefits (one per line)</label>
            <textarea
              style={styles.textarea}
              value={tierForm.benefits.join('\n')}
              onChange={e => setTierForm({ ...tierForm, benefits: e.target.value.split('\n') })}
              placeholder="Early access to content&#10;Exclusive posts&#10;Direct messaging"
            />
          </div>

          <button style={styles.button} onClick={handleSaveTier} disabled={loading}>
            {loading ? 'Saving...' : (tier ? 'Update Tier' : 'Create Tier')}
          </button>
        </div>
      )}

      {activeTab === 'subscribers' && (
        <div style={styles.card}>
          <div style={styles.cardGlow} />
          <h2 style={styles.cardTitle}>Your Subscribers</h2>
          
          {subscribers.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👥</div>
              <div style={styles.emptyTitle}>No Subscribers Yet</div>
              <p>Share your profile to attract subscribers</p>
            </div>
          ) : (
            subscribers.map(sub => (
              <div key={sub.id} style={styles.subscriberCard}>
                <div style={styles.subscriberAvatar}>
                  {sub.subscriber ? getInitials(sub.subscriber.name) : '?'}
                </div>
                <div style={styles.subscriberInfo}>
                  <div style={styles.subscriberName}>
                    {sub.subscriber?.name || 'Unknown User'}
                  </div>
                  <div style={styles.subscriberTier}>
                    {sub.tier} · {formatCurrency(sub.amount)}/month
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div style={styles.card}>
          <div style={styles.cardGlow} />
          <h2 style={styles.cardTitle}>Creators You Support</h2>
          
          {mySubscriptions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💎</div>
              <div style={styles.emptyTitle}>Not Supporting Any Creators</div>
              <p>Subscribe to your favorite creators to support their work</p>
            </div>
          ) : (
            mySubscriptions.map(sub => (
              <div key={sub.id} style={styles.subscriberCard}>
                <div style={styles.subscriberAvatar}>
                  {sub.creator ? getInitials(sub.creator.name || 'C') : '?'}
                </div>
                <div style={styles.subscriberInfo}>
                  <div style={styles.subscriberName}>
                    {sub.creator?.name || 'Unknown Creator'}
                  </div>
                  <div style={styles.subscriberTier}>
                    {sub.tier} · {formatCurrency(sub.amount)}/month
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
