// Phase 4G — Winners Market: Winners Property
// African property listings, investment guides, mortgage tools
// AI supervisor: ATLAS / OMEGA

import { useState } from "react";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ContextBar from "../../components/ui/ContextBar";

export default function WinnersPropertyPage() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'buy' | 'rent' | 'invest' | 'agents'>('buy');

  const PROPERTIES = [
    { id: '1', title: 'Luxury 4BR Villa - Kilimani', location: 'Nairobi, Kenya', price: 450000, type: 'For Sale', image: 'https://images.unsplash.com/photo-1580587771525-78b9bed3b918?w=800&auto=format&fit=crop', tags: ['Modern', 'Secure'] },
    { id: '2', title: 'Silicon Savannah Apartment', location: 'Konza City, Kenya', price: 120000, type: 'Investment', image: 'https://images.unsplash.com/photo-1460317442991-0ec239397148?w=800&auto=format&fit=crop', tags: ['High ROI', 'Tech Hub'] },
    { id: '3', title: 'Penthouse with Ocean View', location: 'Lagos, Nigeria', price: 750000, type: 'For Sale', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop', tags: ['Beachfront', 'Elite'] },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 40px" }}>
      <ContextBar platform="market" />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, color: "var(--gold)", marginBottom: 8 }}>Winners Property</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 16 }}>Premium real estate and property investments in the African continent</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ 
            background: 'transparent', border: '1px solid var(--gold)', borderRadius: 6, padding: '10px 20px', 
            color: 'var(--gold)', fontWeight: 700, fontFamily: 'Syne', cursor: 'pointer' 
          }}>
            Calculate Mortgage
          </button>
          <button style={{ 
            background: 'var(--gold)', border: 'none', borderRadius: 6, padding: '10px 20px', 
            color: 'var(--bg)', fontWeight: 700, fontFamily: 'Syne', cursor: 'pointer' 
          }}>
            List Your Property
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {['buy', 'rent', 'invest', 'agents'].map((t) => (
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
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 24 }}>
         {/* Sidebar / Filters */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
               <h3 style={{ color: 'var(--text)', fontSize: 14, marginBottom: 16, fontFamily: 'Space Mono', textTransform: 'uppercase' }}>Filter Search</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>LOCATION</label>
                    <select style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', padding: 8, color: 'var(--text)', borderRadius: 4 }}>
                       <option>All Locations</option>
                       <option>Nairobi, Kenya</option>
                       <option>Lagos, Nigeria</option>
                       <option>Accra, Ghana</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>PROPERTY TYPE</label>
                    <select style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', padding: 8, color: 'var(--text)', borderRadius: 4 }}>
                       <option>Apartment</option>
                       <option>Villa/House</option>
                       <option>Land/Plot</option>
                       <option>Commercial</option>
                    </select>
                  </div>
                  <button style={{ width: '100%', marginTop: 8, background: 'var(--gold)', border: 'none', padding: 10, borderRadius: 4, fontWeight: 700, fontFamily: 'Syne', cursor: 'pointer' }}>Search Now</button>
               </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 20, position: 'relative' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--ice), transparent)' }} />
               <h3 style={{ color: 'var(--ice)', fontSize: 14, marginBottom: 16 }}>Investment Guide</h3>
               <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 16 }}>Download the latest 2026 report on East African real estate growth. SAGE AI summarized.</p>
               <button style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', padding: '8px', color: 'var(--text)', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Download PDF</button>
            </div>
         </div>

         {/* Listings Area */}
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24, alignContent: 'start' }}>
            {PROPERTIES.map(p => (
              <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                 <div style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
                    <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 4, color: 'white', fontSize: 11, fontFamily: 'Space Mono' }}>
                       {p.type}
                    </div>
                 </div>
                 <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                       {p.tags.map(t => <span key={t} style={{ fontSize: 9, background: 'var(--surface2)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t}</span>)}
                    </div>
                    <h3 style={{ fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>{p.title}</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 16 }}>📍 {p.location}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                       <span style={{ fontSize: 20, color: 'var(--gold)', fontWeight: 700, fontFamily: 'Space Mono' }}>
                          ${p.price.toLocaleString()}
                       </span>
                       <button style={{ background: 'transparent', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 4, color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>View Details</button>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>

      <div style={{ marginTop: 40, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
         <div>
            <h4 style={{ color: 'var(--text)', fontSize: 18, marginBottom: 4 }}>Are you a Property Developer or Agent?</h4>
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Get your properties in front of the global African diaspora community.</p>
         </div>
         <button style={{ background: 'var(--ice)', border: 'none', padding: '12px 24px', borderRadius: 6, color: 'var(--bg)', fontWeight: 700, cursor: 'pointer' }}>Become a Partner</button>
      </div>

      <AssistantPanel assistant="atlas" />
    </div>
  );
}
