// Phase 4I — Winners Market: Winners Health
// Wellness coaching, fitness programs, mental health, healthcare booking
// AI supervisor: SAGE / OMEGA

import { useState } from "react";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ContextBar from "../../components/ui/ContextBar";

export default function WinnersHealthPage() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'coaches' | 'programs' | 'wellness' | 'appointments'>('coaches');

  const PROGRAMS = [
    { id: '1', title: '30-Day African Fit Challenge', coach: 'Coach Ken', price: 29.99, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop', category: 'Fitness' },
    { id: '2', title: 'Mindful Meditation: Diaspora Edition', coach: 'Dr. Sarah', price: 15.00, image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop', category: 'Mental Health' },
    { id: '3', title: 'Nutrition for Busy Professionals', coach: 'Nourish With Nala', price: 45.00, image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop', category: 'Nutrition' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 40px" }}>
      <ContextBar platform="market" />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, color: "var(--gold)", marginBottom: 8 }}>Winners Health</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 16 }}>Holistic wellness and healthcare tailored for the global African community</p>
        </div>
        <button style={{ 
          background: 'var(--gold)', border: 'none', borderRadius: 6, padding: '12px 24px', 
          color: 'var(--bg)', fontWeight: 700, fontFamily: 'Syne', cursor: 'pointer' 
        }}>
          Book Consultation
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {['coaches', 'programs', 'wellness', 'appointments'].map((t) => (
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {PROGRAMS.map((program) => (
          <div key={program.id} style={{ 
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, 
            overflow: 'hidden'
          }}>
             <div style={{ height: 200, overflow: 'hidden' }}>
              <img src={program.image} alt={program.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            
            <div style={{ padding: 20 }}>
              <span style={{ fontSize: 10, color: 'var(--ice)', fontFamily: 'Space Mono', textTransform: 'uppercase' }}>{program.category}</span>
              <h3 style={{ fontSize: 18, color: 'var(--text)', margin: '8px 0' }}>{program.title}</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 16 }}>by {program.coach}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 18, color: 'var(--text)', fontWeight: 700 }}>${program.price}</span>
                <button style={{ 
                  background: 'transparent', border: '1px solid var(--gold)', borderRadius: 4, 
                  padding: '6px 16px', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', fontWeight: 600 
                }}>
                  Join Program
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
         <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 32 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--gold)", marginBottom: 16 }}>Personalized Health Analytics</h2>
            <p style={{ color: "var(--text-dim)", marginBottom: 24, lineHeight: 1.6 }}>
               SAGE AI analyzes your fitness data, sleep patterns, and nutrition to provide a tailored wellness plan. Connect your devices for real-time insights.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
               {[
                 { label: 'Activity Score', val: '88/100', color: 'var(--green)' },
                 { label: 'Avg Sleep', val: '7h 24m', color: 'var(--ice)' },
                 { label: 'Nutrition', val: 'Target Met', color: 'var(--gold)' },
                 { label: 'Stress Level', val: 'Low', color: 'var(--green)' },
               ].map(stat => (
                 <div key={stat.label} style={{ background: 'var(--surface2)', padding: 16, borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{stat.label}</div>
                    <div style={{ fontSize: 18, color: stat.color, fontWeight: 700, fontFamily: 'Space Mono' }}>{stat.val}</div>
                 </div>
               ))}
            </div>
         </div>

         <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 32, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--purple), transparent)' }} />
            <h3 style={{ color: 'var(--purple)', fontSize: 20, marginBottom: 16 }}>Wellness Library</h3>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24 }}>Access premium guided meditations, healthy African recipes, and wellness articles.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               {['Guided Breathwork (10 min)', 'High Protein Egusi Recipe', 'Mental Health in Diaspora', 'Vitamin D Guide'].map(item => (
                 <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--surface2)', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer' }}>
                    <span style={{ fontSize: 18 }}>📖</span>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{item}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <AssistantPanel assistant="sage" />
    </div>
  );
}
