// Phase 4C — Winners Market: Winners Stream
// Live streaming, VOD, pay-per-view events, creator tools
// AI supervisor: NOVA (Community) / OMEGA

import { useState } from "react";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ContextBar from "../../components/ui/ContextBar";

const API_BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || "http://localhost:3001/api/v1";

interface StreamItem {
  id: string;
  title: string;
  creator: string;
  viewers: number;
  thumbnail: string;
  type: 'live' | 'vod' | 'ppv';
  price?: number;
}

const FEATURED_STREAMS: StreamItem[] = [
  { id: '1', title: 'Building African Tech Hubs', creator: 'Tech King', viewers: 1200, thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop', type: 'live' },
  { id: '2', title: 'Creative Studio Session', creator: 'Artiste X', viewers: 850, thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop', type: 'live' },
  { id: '3', title: 'Financial Freedom Masterclass', creator: 'Wealth Guru', viewers: 0, thumbnail: 'https://images.unsplash.com/photo-1591696208199-5955f7296255?w=800&auto=format&fit=crop', type: 'ppv', price: 19.99 },
];

export default function WinnersStreamPage() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'discover' | 'my-content' | 'live-now'>('discover');

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 40px" }}>
      <ContextBar platform="market" />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, color: "var(--gold)", marginBottom: 8 }}>Winners Stream</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 16 }}>Live streaming & VOD for the sovereign creator economy</p>
        </div>
        <button style={{ 
          background: 'var(--gold)', border: 'none', borderRadius: 6, padding: '12px 24px', 
          color: 'var(--bg)', fontWeight: 700, fontFamily: 'Syne', cursor: 'pointer' 
        }}>
          Go Live Now
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {['discover', 'live-now', 'my-content'].map((t) => (
          <button 
            key={t}
            onClick={() => setActiveTab(t as any)}
            style={{ 
              background: 'transparent', border: 'none', padding: '8px 16px', 
              color: activeTab === t ? 'var(--gold)' : 'var(--text-dim)', 
              fontFamily: 'Space Mono', fontSize: 12, textTransform: 'uppercase', 
              cursor: 'pointer', borderBottom: activeTab === t ? '2px solid var(--gold)' : 'none'
            }}
          >
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {FEATURED_STREAMS.map((stream) => (
          <div key={stream.id} className="stream-card" style={{ 
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, 
            overflow: 'hidden', position: 'relative', transition: 'transform 0.2s'
          }}>
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1, display: 'flex', gap: 8 }}>
              {stream.type === 'live' && (
                <span style={{ background: 'var(--red)', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>LIVE</span>
              )}
              {stream.type === 'ppv' && (
                <span style={{ background: 'var(--purple)', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>PPV</span>
              )}
            </div>
            
            <div style={{ height: 180, overflow: 'hidden' }}>
              <img src={stream.thumbnail} alt={stream.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ padding: 16 }}>
              <h3 style={{ fontSize: 18, marginBottom: 4, color: 'var(--text)' }}>{stream.title}</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 12 }}>{stream.creator}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'Space Mono' }}>
                  {stream.type === 'live' ? `👁 ${stream.viewers.toLocaleString()} viewers` : stream.type === 'ppv' ? `$${stream.price}` : 'VOD'}
                </span>
                <button style={{ 
                  background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, 
                  padding: '4px 12px', color: 'var(--gold)', fontSize: 12, cursor: 'pointer' 
                }}>
                  Watch
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 64 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--gold)", marginBottom: 24 }}>Creator Tools</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
          {[
            { title: 'Stream Analytics', icon: '📊', desc: 'Real-time viewer data and retention' },
            { id: 'monetization', title: 'Monetization', icon: '💰', desc: 'Subscriptions, tips, and PPV' },
            { title: 'AI Highlight Reel', icon: '✂️', desc: 'Auto-generate clips from streams' },
          ].map((tool) => (
            <div key={tool.title} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{tool.icon}</div>
              <h4 style={{ color: 'var(--text)', marginBottom: 8 }}>{tool.title}</h4>
              <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <AssistantPanel assistant="nova" />
    </div>
  );
}
