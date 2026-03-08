// Phase 4 Layer: Winners Market
// Entry point for all 10 Market verticals
// Build sequence: 4A → 4B → 4C → 4E → 4F → 4D → 4G → 4H → 4I → 4J

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Market Vertical Types
interface MarketVertical {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  status: 'live' | 'building' | 'planned';
  revenue: string;
  features: string[];
  path: string;
}

const MARKET_VERTICALS: MarketVertical[] = [
  {
    id: '4B',
    icon: '📣',
    name: 'Digital Marketing Hub',
    tagline: 'AI-powered ad campaigns, SEO, social scheduling',
    status: 'building',
    revenue: '$49-199/mo',
    features: [
      'AI Ad Campaign Builder',
      'SEO Analysis & Recommendations',
      'Social Media Scheduler',
      'Email Marketing Campaigns',
      'Analytics Dashboard',
      'Competitor Insights'
    ],
    path: '/market/digital-marketing'
  },
  {
    id: '4C',
    icon: '📺',
    name: 'Winners Stream',
    tagline: 'Live streaming, VOD, pay-per-view, creator tools',
    status: 'planned',
    revenue: '15% subs + 10% tips',
    features: [
      'Live Streaming',
      'Video-on-Demand (VOD)',
      'Pay-Per-View Events',
      'Channel Subscriptions',
      'Creator Tipping',
      'Virtual Concerts'
    ],
    path: '/market/stream'
  },
  {
    id: '4E',
    icon: '📋',
    name: 'Business Launcher',
    tagline: 'AI business plans, pitch decks, financial projections',
    status: 'building',
    revenue: '$29-99/plan',
    features: [
      'AI Business Plan Generator',
      'Pitch Deck Builder',
      'Financial Projections',
      'Market Research',
      'Legal Templates',
      'Company Registration Guides'
    ],
    path: '/market/business-launcher'
  },
  {
    id: '4F',
    icon: '📄',
    name: 'CV & Career Tools',
    tagline: 'ATS-optimized CVs, cover letters, LinkedIn optimization',
    status: 'building',
    revenue: '$9.99-29/doc',
    features: [
      'ATS-Optimized CV Builder',
      'AI Cover Letter Generator',
      'LinkedIn Profile Optimizer',
      'Interview Prep Assistant',
      'Portfolio Builder',
      'Career Path Advisor'
    ],
    path: '/market/cv-tools'
  },
  {
    id: '4D',
    icon: '📈',
    name: 'Trading & Signals',
    tagline: 'Market data, copy trading, investment signals',
    status: 'planned',
    revenue: '$49-149/mo',
    features: [
      'Paper Trading Simulator',
      'Live Market Data',
      'Copy Trading',
      'Investment Signals',
      'African Stock Focus',
      'Portfolio Analytics'
    ],
    path: '/market/trading'
  },
  {
    id: '4A',
    icon: '🛒',
    name: 'Commerce Hub',
    tagline: 'Multi-vendor marketplace, dropshipping, products',
    status: 'planned',
    revenue: '10-20% commission',
    features: [
      'Vendor Onboarding',
      'Product Catalogues',
      'Shopping Cart',
      'Secure Checkout',
      'Dropshipping Integration',
      'Print-on-Demand'
    ],
    path: '/market/commerce'
  }
];

// AI-Powered Tool Interfaces
interface ToolRequest {
  type: string;
  data: Record<string, string>;
}

export default function MarketPage() {
  const navigate = useNavigate();
  const [activeVertical, setActiveVertical] = useState<string | null>(null);
  const [showAITools, setShowAITools] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiOutput, setAiOutput] = useState('');

  // Digital Marketing Tool State
  const [dmNiche, setDmNiche] = useState('');
  const [dmPlatform, setDmPlatform] = useState('facebook');
  const [dmBudget, setDmBudget] = useState('');

  // Business Plan Tool State
  const [bpBusinessName, setBpBusinessName] = useState('');
  const [bpIndustry, setBpIndustry] = useState('');
  const [bpTarget, setBpTarget] = useState('');
  const [bpRevenue, setBpRevenue] = useState('');

  // CV Tool State
  const [cvName, setCvName] = useState('');
  const [cvRole, setCvRole] = useState('');
  const [cvExperience, setCvExperience] = useState('');
  const [cvSkills, setCvSkills] = useState('');

  // AI Tool Handlers
  const handleAIGenerate = async (toolType: string) => {
    setAiLoading(toolType);
    setAiOutput('');
    
    let prompt = '';
    switch (toolType) {
      case 'dm-strategy':
        prompt = `Create a comprehensive digital marketing strategy for:
- Niche: ${dmNiche}
- Platform: ${dmPlatform}
- Budget: ${dmBudget}

Include: target audience analysis, content pillars, posting schedule, ad copy suggestions, KPIs to track, and recommended tools.`;
        break;
      case 'business-plan':
        prompt = `Generate a detailed business plan for:
- Business Name: ${bpBusinessName}
- Industry: ${bpIndustry}
- Target Market: ${bpTarget}
- Projected Revenue: ${bpRevenue}

Include: executive summary, market analysis, competitive advantage, marketing strategy, financial projections, and implementation timeline.`;
        break;
      case 'cv-builder':
        prompt = `Create a professional ATS-optimized CV for:
- Name: ${cvName}
- Target Role: ${cvRole}
- Years of Experience: ${cvExperience}
- Key Skills: ${cvSkills}

Include: professional summary, work experience, skills section, education, and keywords for ATS optimization.`;
        break;
      case 'cover-letter':
        prompt = `Write a compelling cover letter for:
- Applicant Name: ${cvName}
- Target Role: ${cvRole}
- Key Skills: ${cvSkills}

Make it professional, engaging, and tailored to stand out to recruiters.`;
        break;
      default:
        prompt = 'Provide helpful information.';
    }

    try {
      const response = await fetch('/api/v1/ai/stream-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: 'market-tools' })
      });

      if (!response.ok) throw new Error('AI generation failed');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setAiOutput(prev => prev + decoder.decode(value));
        }
      }
    } catch (error) {
      setAiOutput('Error generating content. Please try again.');
    } finally {
      setAiLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'var(--green)';
      case 'building': return 'var(--gold)';
      default: return 'var(--text-dim)';
    }
  };

  return (
    <div className="market-page">
      <style>{`
        .market-page {
          
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          padding: 24px;
          font-family: 'Syne', sans-serif;
        }

        .market-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .market-header h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          font-weight: 300;
          color: var(--gold);
          margin-bottom: 8px;
        }

        .market-header p {
          color: var(--text-dim);
          font-size: 1rem;
        }

        /* Context Bar */
        .ctx-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          justify-content: center;
        }

        .ctx-badge {
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-family: 'Space Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          background: var(--surface);
          border: 1px solid var(--border);
        }

        .ctx-badge.live { border-color: var(--green); color: var(--green); }
        .ctx-badge.building { border-color: var(--gold); color: var(--gold); }
        .ctx-badge.planned { border-color: var(--text-dim); color: var(--text-dim); }

        /* Vertical Grid */
        .verticals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .vertical-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 24px;
          cursor: pointer;
          transition: all 200ms ease;
          position: relative;
          overflow: hidden;
        }

        .vertical-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          opacity: 0;
          transition: opacity 200ms ease;
        }

        .vertical-card:hover {
          border-color: var(--gold);
          transform: translateY(-2px);
        }

        .vertical-card:hover::before {
          opacity: 1;
        }

        .vertical-icon {
          font-size: 2rem;
          margin-bottom: 12px;
        }

        .vertical-name {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 4px;
          color: var(--text);
        }

        .vertical-tagline {
          font-size: 0.85rem;
          color: var(--text-dim);
          margin-bottom: 12px;
        }

        .vertical-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
        }

        .vertical-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .vertical-revenue {
          color: var(--green);
          font-family: 'Space Mono', monospace;
        }

        /* AI Tools Section */
        .ai-tools-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 24px;
          margin-top: 40px;
        }

        .ai-tools-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--purple), transparent);
        }

        .ai-tools-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .ai-tools-header h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: var(--purple);
        }

        .ai-tools-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .ai-tab {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 0.85rem;
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--text-dim);
          cursor: pointer;
          transition: all 200ms ease;
        }

        .ai-tab.active {
          background: var(--purple);
          color: var(--bg);
          border-color: var(--purple);
        }

        .ai-form {
          display: grid;
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.75rem;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px 14px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-size: 0.9rem;
          font-family: 'Syne', sans-serif;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--purple);
        }

        .generate-btn {
          padding: 12px 24px;
          background: var(--purple);
          color: var(--bg);
          border: none;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .generate-btn:hover {
          background: var(--purple);
        }

        .generate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ai-output {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 20px;
          margin-top: 20px;
          max-height: 400px;
          overflow-y: auto;
          white-space: pre-wrap;
          font-size: 0.9rem;
          line-height: 1.6;
          color: var(--text);
        }

        .ai-output:empty {
          display: none;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .market-page {
            padding: 16px;
          }

          .verticals-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Context Bar */}
      <div className="ctx-bar">
        <span className="ctx-badge live">⬡ Core Engine</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge live">🧑‍🤝‍🧑 Community</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge live">🎓 Academy</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge building">🛒 Market</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge planned">🤖 Intelligence</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge planned">💼 Work</span>
      </div>

      {/* Header */}
      <div className="market-header">
        <h1>🛒 Winners Market</h1>
        <p>Your digital empire starts here. 10 verticals. Unlimited possibilities.</p>
      </div>

      {/* Market Verticals Grid */}
      <div className="verticals-grid">
        {MARKET_VERTICALS.map((vertical) => (
          <div 
            key={vertical.id}
            className="vertical-card"
            onClick={() => setActiveVertical(activeVertical === vertical.id ? null : vertical.id)}
          >
            <div className="vertical-icon">{vertical.icon}</div>
            <div className="vertical-name">{vertical.name}</div>
            <div className="vertical-tagline">{vertical.tagline}</div>
            
            {activeVertical === vertical.id && (
              <div className="vertical-features" style={{ marginTop: 16, marginBottom: 16 }}>
                {vertical.features.map((feature, i) => (
                  <div key={i} style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--text-dim)',
                    padding: '4px 0',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    ✓ {feature}
                  </div>
                ))}
              </div>
            )}
            
            <div className="vertical-meta">
              <div className="vertical-status">
                <span 
                  className="status-dot" 
                  style={{ background: getStatusColor(vertical.status) }}
                />
                <span style={{ color: getStatusColor(vertical.status) }}>
                  {vertical.status}
                </span>
              </div>
              <div className="vertical-revenue">{vertical.revenue}</div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Tools Section */}
      <div className="ai-tools-section">
        <div className="ai-tools-header">
          <h2>🤖 AI Market Tools</h2>
          <button 
            className="ai-tab active"
            onClick={() => setShowAITools(!showAITools)}
          >
            {showAITools ? 'Hide Tools' : 'Show Tools'}
          </button>
        </div>

        {showAITools && (
          <>
            {/* Tool Tabs */}
            <div className="ai-tools-tabs">
              <button 
                className={`ai-tab ${activeVertical === 'dm' ? 'active' : ''}`}
                onClick={() => setActiveVertical('dm')}
              >
                📣 Digital Marketing
              </button>
              <button 
                className={`ai-tab ${activeVertical === 'bp' ? 'active' : ''}`}
                onClick={() => setActiveVertical('bp')}
              >
                📋 Business Plan
              </button>
              <button 
                className={`ai-tab ${activeVertical === 'cv' ? 'active' : ''}`}
                onClick={() => setActiveVertical('cv')}
              >
                📄 CV Builder
              </button>
            </div>

            {/* Digital Marketing Tool */}
            {activeVertical === 'dm' && (
              <div className="ai-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Your Niche / Industry</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Fashion, Tech, Food"
                      value={dmNiche}
                      onChange={(e) => setDmNiche(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Primary Platform</label>
                    <select value={dmPlatform} onChange={(e) => setDmPlatform(e.target.value)}>
                      <option value="facebook">Facebook Ads</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="google">Google Ads</option>
                      <option value="whatsapp">WhatsApp Business</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Monthly Budget ($)</label>
                    <input 
                      type="text" 
                      placeholder="e.g., 1000"
                      value={dmBudget}
                      onChange={(e) => setDmBudget(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  className="generate-btn"
                  onClick={() => handleAIGenerate('dm-strategy')}
                  disabled={aiLoading !== null || !dmNiche}
                >
                  {aiLoading === 'dm-strategy' ? '⏳ Generating...' : '🚀 Generate Strategy'}
                </button>
              </div>
            )}

            {/* Business Plan Tool */}
            {activeVertical === 'bp' && (
              <div className="ai-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Business Name</label>
                    <input 
                      type="text" 
                      placeholder="Your business name"
                      value={bpBusinessName}
                      onChange={(e) => setBpBusinessName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Industry</label>
                    <select value={bpIndustry} onChange={(e) => setBpIndustry(e.target.value)}>
                      <option value="">Select industry</option>
                      <option value="tech">Technology & SaaS</option>
                      <option value="ecommerce">E-Commerce</option>
                      <option value="finance">Finance & Fintech</option>
                      <option value="health">Health & Wellness</option>
                      <option value="education">Education</option>
                      <option value="food">Food & Agriculture</option>
                      <option value="creative">Creative & Media</option>
                      <option value="retail">Retail</option>
                      <option value="services">Professional Services</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Target Market</label>
                    <input 
                      type="text" 
                      placeholder="e.g., African diaspora, SMEs"
                      value={bpTarget}
                      onChange={(e) => setBpTarget(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Projected Revenue (Year 1)</label>
                    <input 
                      type="text" 
                      placeholder="e.g., $100,000"
                      value={bpRevenue}
                      onChange={(e) => setBpRevenue(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  className="generate-btn"
                  onClick={() => handleAIGenerate('business-plan')}
                  disabled={aiLoading !== null || !bpBusinessName || !bpIndustry}
                >
                  {aiLoading === 'business-plan' ? '⏳ Generating...' : '📋 Generate Business Plan'}
                </button>
              </div>
            )}

            {/* CV Builder Tool */}
            {activeVertical === 'cv' && (
              <div className="ai-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Your full name"
                      value={cvName}
                      onChange={(e) => setCvName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Target Role</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Software Developer"
                      value={cvRole}
                      onChange={(e) => setCvRole(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Years of Experience</label>
                    <select value={cvExperience} onChange={(e) => setCvExperience(e.target.value)}>
                      <option value="">Select experience</option>
                      <option value="0-1">0-1 years (Entry Level)</option>
                      <option value="2-3">2-3 years (Junior)</option>
                      <option value="4-6">4-6 years (Mid-Level)</option>
                      <option value="7-10">7-10 years (Senior)</option>
                      <option value="10+">10+ years (Executive)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Key Skills (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g., React, Node.js, TypeScript"
                      value={cvSkills}
                      onChange={(e) => setCvSkills(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button 
                    className="generate-btn"
                    onClick={() => handleAIGenerate('cv-builder')}
                    disabled={aiLoading !== null || !cvName || !cvRole}
                  >
                    {aiLoading === 'cv-builder' ? '⏳ Generating...' : '📄 Generate CV'}
                  </button>
                  <button 
                    className="generate-btn"
                    style={{ background: 'var(--blue)' }}
                    onClick={() => handleAIGenerate('cover-letter')}
                    disabled={aiLoading !== null || !cvName || !cvRole}
                  >
                    {aiLoading === 'cover-letter' ? '⏳ Generating...' : '✉️ Generate Cover Letter'}
                  </button>
                </div>
              </div>
            )}

            {/* AI Output */}
            {aiOutput && (
              <div className="ai-output">
                {aiOutput}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
