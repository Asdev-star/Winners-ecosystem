// Phase 4H — Winners Market: Winners Events
// Event ticketing, virtual concerts, NFT passes, organizer dashboard
// AI supervisor: NOVA / OMEGA

import { useState } from "react";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ContextBar from "../../components/ui/ContextBar";

export default function WinnersEventsPage() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'virtual' | 'my-tickets' | 'hosting'>('upcoming');

  const EVENTS = [
    { id: '1', title: 'Global Diaspora Tech Summit', date: 'Oct 24, 2026', location: 'London + Virtual', price: 49.99, image: 'https://images.unsplash.com/photo-1540575861501-7ad05823c95b?w=800&auto=format&fit=crop', category: 'Tech' },
    { id: '2', title: 'Afrobeats Live: Summer Fest', date: 'Nov 12, 2026', location: 'Lagos, Nigeria', price: 25.00, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop', category: 'Music' },
    { id: '3', title: 'Winners Ecosystem Workshop', date: 'Dec 05, 2026', location: 'Virtual', price: 0, image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&auto=format&fit=crop', category: 'Education' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 40px" }}>
      <ContextBar platform="market" />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, color: "var(--gold)", marginBottom: 8 }}>Winners Events</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 16 }}>Premium ticketing & event experiences for the global community</p>
        </div>
        <button style={{ 
          background: 'var(--gold)', border: 'none', borderRadius: 6, padding: '12px 24px', 
          color: 'var(--bg)', fontWeight: 700, fontFamily: 'Syne', cursor: 'pointer' 
        }}>
          Create Event
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {['upcoming', 'virtual', 'my-tickets', 'hosting'].map((t) => (
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {EVENTS.map((event) => (
          <div key={event.id} style={{ 
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, 
            overflow: 'hidden', position: 'relative'
          }}>
             <div style={{ height: 180, overflow: 'hidden' }}>
              <img src={event.image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                   <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'Space Mono', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{event.category}</span>
                   <h3 style={{ fontSize: 18, color: 'var(--text)', marginTop: 4 }}>{event.title}</h3>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-dim)' }}>
                   <span>📅</span> {event.date}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-dim)' }}>
                   <span>📍</span> {event.location}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 16, color: 'var(--text)', fontWeight: 700 }}>
                  {event.price === 0 ? 'FREE' : `$${event.price}`}
                </span>
                <button style={{ 
                  background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, 
                  padding: '8px 16px', color: 'var(--text)', fontSize: 13, cursor: 'pointer', fontFamily: 'Syne'
                }}>
                  Book Ticket
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 64, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 32, position: 'relative', overflow: 'hidden' }}>
         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
            <div>
               <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "var(--gold)", marginBottom: 16 }}>NFT Ticket Passes</h2>
               <p style={{ color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 24 }}>
                  Experience secure, collectible, and resellable tickets. Every ticket in the Winners Ecosystem can be minted as a commemorative NFT on the Polygon network.
               </p>
               <button style={{ background: 'transparent', border: '1px solid var(--gold)', borderRadius: 6, padding: '10px 20px', color: 'var(--gold)', cursor: 'pointer', fontWeight: 600 }}>Explore NFT Marketplace</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
               {[
                 { label: 'Royal Pass', icon: '👑', color: 'var(--gold)' },
                 { label: 'Backstage', icon: '🎫', color: 'var(--ice)' },
                 { label: 'VVIP Access', icon: '💎', color: 'var(--purple)' },
                 { label: 'Live Stream', icon: '📹', color: 'var(--green)' },
               ].map(pass => (
                 <div key={pass.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: 16, borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{pass.icon}</div>
                    <div style={{ fontSize: 11, color: pass.color, fontFamily: 'Space Mono', fontWeight: 700 }}>{pass.label}</div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <AssistantPanel assistant="nova" />
    </div>
  );
}
