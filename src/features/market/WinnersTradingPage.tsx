// Phase 4D — Winners Market: Winners Trading
// Stocks, Crypto, Forex, Copy Trading, African Market Signals
// AI supervisor: ATLAS / OMEGA

import { useState } from "react";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ContextBar from "../../components/ui/ContextBar";

export default function WinnersTradingPage() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'markets' | 'portfolio' | 'signals' | 'copy'>('markets');

  const MARKETS = [
    { symbol: 'NSE: EQTY', name: 'Equity Group Holdings', price: 42.50, change: +1.2, region: 'Kenya' },
    { symbol: 'NGX: MTNN', name: 'MTN Nigeria', price: 245.00, change: -0.5, region: 'Nigeria' },
    { symbol: 'JSE: NPN', name: 'Naspers Ltd', price: 3150.00, change: +0.8, region: 'South Africa' },
    { symbol: 'BTC/USD', name: 'Bitcoin', price: 68420.00, change: +2.4, region: 'Global' },
  ];

  const SIGNALS = [
    { type: 'BUY', symbol: 'NSE: SCOM', entry: 18.20, target: 21.00, stop: 17.00, confidence: '85%' },
    { type: 'SELL', symbol: 'BTC/USD', entry: 69500, target: 65000, stop: 71000, confidence: '72%' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 40px" }}>
      <ContextBar platform="market" />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, color: "var(--gold)", marginBottom: 8 }}>Winners Trading</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 16 }}>Professional trading tools for African and Global markets</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ 
            background: 'transparent', border: '1px solid var(--gold)', borderRadius: 6, padding: '10px 20px', 
            color: 'var(--gold)', fontWeight: 700, fontFamily: 'Syne', cursor: 'pointer' 
          }}>
            Paper Trading
          </button>
          <button style={{ 
            background: 'var(--gold)', border: 'none', borderRadius: 6, padding: '10px 20px', 
            color: 'var(--bg)', fontWeight: 700, fontFamily: 'Syne', cursor: 'pointer' 
          }}>
            Deposit Funds
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {['markets', 'portfolio', 'signals', 'copy'].map((t) => (
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 24 }}>
            <h3 style={{ color: 'var(--text)', marginBottom: 20, fontFamily: 'Syne' }}>Market Watch</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 0', color: 'var(--text-dim)', fontWeight: 400, fontSize: 12, fontFamily: 'Space Mono' }}>SYMBOL</th>
                  <th style={{ padding: '12px 0', color: 'var(--text-dim)', fontWeight: 400, fontSize: 12, fontFamily: 'Space Mono' }}>NAME</th>
                  <th style={{ padding: '12px 0', color: 'var(--text-dim)', fontWeight: 400, fontSize: 12, fontFamily: 'Space Mono' }}>PRICE</th>
                  <th style={{ padding: '12px 0', color: 'var(--text-dim)', fontWeight: 400, fontSize: 12, fontFamily: 'Space Mono' }}>24H %</th>
                </tr>
              </thead>
              <tbody>
                {MARKETS.map((m) => (
                  <tr key={m.symbol} style={{ borderBottom: '1px solid var(--border2)' }}>
                    <td style={{ padding: '16px 0', fontWeight: 700, color: 'var(--ice)' }}>{m.symbol}</td>
                    <td style={{ padding: '16px 0', color: 'var(--text)', fontSize: 14 }}>{m.name} <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>({m.region})</span></td>
                    <td style={{ padding: '16px 0', fontFamily: 'Space Mono' }}>${m.price.toLocaleString()}</td>
                    <td style={{ padding: '16px 0', color: m.change > 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'Space Mono' }}>
                      {m.change > 0 ? '+' : ''}{m.change}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
             <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
                <h4 style={{ color: 'var(--gold)', marginBottom: 12, fontSize: 14 }}>Copy Trading</h4>
                <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 16 }}>Follow the top performing traders in the African diaspora.</p>
                <button style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', padding: '8px', color: 'var(--text)', borderRadius: 4, cursor: 'pointer' }}>View Leaderboard</button>
             </div>
             <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
                <h4 style={{ color: 'var(--ice)', marginBottom: 12, fontSize: 14 }}>Education</h4>
                <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 16 }}>Learn the basics of technical analysis with SAGE AI.</p>
                <button style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', padding: '8px', color: 'var(--text)', borderRadius: 4, cursor: 'pointer' }}>Open Academy</button>
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 20, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--purple), transparent)' }} />
            <h3 style={{ color: 'var(--purple)', marginBottom: 16, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚡</span> Alpha Signals
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {SIGNALS.map((s, i) => (
                <div key={i} style={{ padding: 12, background: 'var(--surface2)', borderRadius: 4, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: s.type === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>{s.type}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 700 }}>{s.symbol}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Space Mono' }}>
                    <span>ENTRY: {s.entry}</span>
                    <span>TGT: {s.target}</span>
                  </div>
                  <div style={{ marginTop: 8, height: 4, background: 'var(--bg)', borderRadius: 2 }}>
                    <div style={{ width: s.confidence, height: '100%', background: 'var(--gold)', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
            <button style={{ width: '100%', marginTop: 16, background: 'transparent', border: '1px solid var(--purple)', padding: '10px', color: 'var(--purple)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Syne', fontWeight: 600 }}>Unlock Premium Signals</button>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
            <h4 style={{ color: 'var(--text)', marginBottom: 12, fontSize: 14 }}>Top Movers (NSE)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['KCB (+3.2%)', 'ABSA (+2.1%)', 'BAT (-1.4%)'].map((stock, i) => (
                <div key={i} style={{ fontSize: 13, color: stock.includes('+') ? 'var(--green)' : 'var(--red)', display: 'flex', justifyContent: 'space-between' }}>
                   <span>{stock.split(' ')[0]}</span>
                   <span style={{ fontFamily: 'Space Mono' }}>{stock.split(' ')[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AssistantPanel assistant="atlas" />
    </div>
  );
}
