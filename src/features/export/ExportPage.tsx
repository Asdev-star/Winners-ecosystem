// src/features/export/ExportPage.tsx

import { useState, useEffect } from "react";
import { getAuthHeaders } from "../auth/authStore";

import { API_BASE } from "../../lib/api";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .ep-root {
    --gold: var(--gold); --bg: var(--bg); --surface: var(--surface); --surface2: var(--surface2);
    --border: var(--border); --text: var(--text); --text-dim: var(--text-dim);
    --green: var(--green); --blue: var(--blue); --red: var(--red); --purple: var(--purple);
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif; min-height: 100vh; padding: 32px 24px 80px;
  }

  .ep-inner { max-width: 900px; margin: 0 auto; }

  .ep-header { margin-bottom: 36px; }
  .ep-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .ep-title span { color: var(--gold); }
  .ep-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-top: 4px; }

  .ep-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }

  .ep-section-label {
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px;
    text-transform: uppercase; color: var(--gold); margin-bottom: 12px;
    display: flex; align-items: center; gap: 10px;
  }
  .ep-section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .ep-option-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .ep-option {
    background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
    padding: 16px; cursor: pointer; transition: all 0.15s; position: relative; overflow: hidden;
  }
  .ep-option::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: transparent; transition: background 0.15s; }
  .ep-option:hover { border-color: rgba(245,200,66,0.3); }
  .ep-option.selected { border-color: var(--gold); background: rgba(245,200,66,0.06); }
  .ep-option.selected::before { background: var(--gold); }

  .ep-option-icon { font-size: 22px; margin-bottom: 8px; }
  .ep-option-name { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
  .ep-option.selected .ep-option-name { color: var(--gold); }
  .ep-option-desc { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

  .ep-check {
    position: absolute; top: 10px; right: 10px;
    width: 16px; height: 16px; border-radius: 50%;
    background: var(--gold); display: flex; align-items: center; justify-content: center;
    font-size: 9px; color: var(--bg); font-weight: 700; opacity: 0; transition: opacity 0.15s;
  }
  .ep-option.selected .ep-check { opacity: 1; }

  .ep-period-row { display: flex; gap: 8px; }
  .ep-period-btn {
    background: var(--surface); border: 1px solid var(--border); border-radius: 3px;
    padding: 8px 16px; font-family: 'Space Mono', monospace; font-size: 11px;
    color: var(--text-dim); cursor: pointer; transition: all 0.15s; letter-spacing: 1px;
  }
  .ep-period-btn:hover { border-color: var(--gold); color: var(--gold); }
  .ep-period-btn.active { background: rgba(245,200,66,0.1); border-color: var(--gold); color: var(--gold); }

  .ep-export-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 28px; }

  .ep-export-btn {
    background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
    padding: 18px 20px; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 14px; position: relative; overflow: hidden;
  }
  .ep-export-btn::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
  .ep-export-btn.json::before  { background: var(--blue); }
  .ep-export-btn.csv::before   { background: var(--green); }
  .ep-export-btn.xlsx::before  { background: var(--purple); }
  .ep-export-btn.pdf::before   { background: var(--red); }

  .ep-export-btn:hover { transform: translateY(-2px); }
  .ep-export-btn.json:hover  { border-color: rgba(74,158,255,0.3);  box-shadow: 0 4px 20px rgba(74,158,255,0.08); }
  .ep-export-btn.csv:hover   { border-color: rgba(45,212,160,0.3);  box-shadow: 0 4px 20px rgba(45,212,160,0.08); }
  .ep-export-btn.xlsx:hover  { border-color: rgba(155,111,255,0.3); box-shadow: 0 4px 20px rgba(155,111,255,0.08); }
  .ep-export-btn.pdf:hover   { border-color: rgba(255,89,117,0.3);  box-shadow: 0 4px 20px rgba(255,89,117,0.08); }

  .ep-export-btn.loading { opacity: 0.6; cursor: not-allowed; transform: none; }

  .ep-export-icon { font-size: 28px; flex-shrink: 0; }
  .ep-export-info { flex: 1; }
  .ep-export-name { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
  .ep-export-btn.json  .ep-export-name { color: var(--blue); }
  .ep-export-btn.csv   .ep-export-name { color: var(--green); }
  .ep-export-btn.xlsx  .ep-export-name { color: var(--purple); }
  .ep-export-btn.pdf   .ep-export-name { color: var(--red); }
  .ep-export-desc { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

  .ep-export-arrow { color: var(--text-dim); font-size: 16px; }

  .ep-history { margin-top: 32px; }
  .ep-history-card { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
  .ep-history-header { padding: 14px 20px; border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 700; }
  .ep-history-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 20px; border-bottom: 1px solid var(--border);
  }
  .ep-history-row:last-child { border-bottom: none; }
  .ep-history-name { font-size: 12px; font-weight: 600; }
  .ep-history-meta { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 2px; }
  .ep-history-badge {
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1px;
    text-transform: uppercase; padding: 3px 8px; border-radius: 2px;
  }
  .ep-history-badge.json  { background: rgba(74,158,255,0.1);  color: var(--blue);   border: 1px solid rgba(74,158,255,0.2); }
  .ep-history-badge.csv   { background: rgba(45,212,160,0.1);  color: var(--green);  border: 1px solid rgba(45,212,160,0.2); }
  .ep-history-badge.xlsx  { background: rgba(155,111,255,0.1); color: var(--purple); border: 1px solid rgba(155,111,255,0.2); }
  .ep-history-badge.pdf   { background: rgba(255,89,117,0.1);  color: var(--red);    border: 1px solid rgba(255,89,117,0.2); }

  .ep-toast {
    position: fixed; bottom: 24px; right: 24px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
    padding: 12px 18px; font-family: 'Space Mono', monospace; font-size: 11px;
    display: flex; align-items: center; gap: 10px;
    animation: ep-slide 0.3s ease forwards; z-index: 999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .ep-toast.success { border-color: rgba(45,212,160,0.3); color: var(--green); }
  .ep-toast.error   { border-color: rgba(255,89,117,0.3); color: var(--red); }

  @keyframes ep-slide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 640px) { .ep-grid { grid-template-columns: 1fr; } .ep-export-grid { grid-template-columns: 1fr; } .ep-option-grid { grid-template-columns: 1fr; } }
`;

type Period  = "7d" | "30d" | "90d";
type Dataset = "revenue" | "activity" | "team" | "all";
type Format  = "json" | "csv" | "xlsx" | "pdf";

interface HistoryItem {
  id:      number;
  format:  Format;
  dataset: Dataset;
  period:  string;
  time:    string;
}

const DATASETS: { key: Dataset; icon: string; name: string; desc: string }[] = [
  { key: "revenue",  icon: "💰", name: "Revenue",         desc: "Daily revenue records" },
  { key: "activity", icon: "📊", name: "Activity",        desc: "Analytics event data" },
  { key: "team",     icon: "👥", name: "Team Members",    desc: "Users & roles" },
  { key: "all",      icon: "🗂️", name: "Full Dashboard",  desc: "All data combined" },
];

const FORMATS: { key: Format; icon: string; name: string; desc: string }[] = [
  { key: "json",  icon: "{ }", name: "JSON",  desc: "Raw structured data" },
  { key: "csv",   icon: "📋",  name: "CSV",   desc: "Spreadsheet compatible" },
  { key: "xlsx",  icon: "📊",  name: "Excel", desc: "Formatted workbook" },
  { key: "pdf",   icon: "📄",  name: "PDF",   desc: "Printable report" },
];

export default function ExportPage() {
  const [period,   setPeriod]   = useState<Period>("30d");
  const [dataset,  setDataset]  = useState<Dataset>("revenue");
  const [loading,  setLoading]  = useState<Format | null>(null);
  const [history,  setHistory]  = useState<HistoryItem[]>([]);
  const [toast,    setToast]    = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const id = "ep-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = async (format: Format) => {
    setLoading(format);
    try {
      const params = new URLSearchParams({ period, dataset });
      const res    = await fetch(`${API_BASE}/export/${format}?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Export failed");

      // Trigger browser download
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      const ext      = format === "xlsx" ? "xlsx" : format === "pdf" ? "pdf" : format === "csv" ? "csv" : "json";
      a.href         = url;
      a.download     = `winners-${dataset}-${period}-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      // Add to history
      setHistory((h) => [{
        id:      Date.now(),
        format,
        dataset,
        period,
        time:    new Date().toLocaleTimeString(),
      }, ...h.slice(0, 4)]);

      showToast(`${format.toUpperCase()} export downloaded`, "success");
    } catch {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="ep-root">
      <div className="ep-inner">

        {/* Header */}
        <div className="ep-header">
          <h1 className="ep-title">Export <span>Reports</span></h1>
          <p className="ep-subtitle">Download your data in any format</p>
        </div>

        <div className="ep-grid">
          {/* Dataset */}
          <div>
            <div className="ep-section-label">Dataset</div>
            <div className="ep-option-grid">
              {DATASETS.map((d) => (
                <div
                  key={d.key}
                  className={`ep-option${dataset === d.key ? " selected" : ""}`}
                  onClick={() => setDataset(d.key)}
                >
                  <div className="ep-check">✓</div>
                  <div className="ep-option-icon">{d.icon}</div>
                  <div className="ep-option-name">{d.name}</div>
                  <div className="ep-option-desc">{d.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Period */}
          <div>
            <div className="ep-section-label">Period</div>
            <div className="ep-period-row">
              {(["7d", "30d", "90d"] as Period[]).map((p) => (
                <button key={p} className={`ep-period-btn${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="ep-section-label">Export Format</div>
        <div className="ep-export-grid">
          {FORMATS.map((f) => (
            <div
              key={f.key}
              className={`ep-export-btn ${f.key}${loading === f.key ? " loading" : ""}`}
              onClick={() => !loading && handleExport(f.key)}
            >
              <div className="ep-export-icon">{f.icon}</div>
              <div className="ep-export-info">
                <div className="ep-export-name">
                  {loading === f.key ? "Exporting…" : `Download ${f.name}`}
                </div>
                <div className="ep-export-desc">{f.desc} · {dataset} · {period}</div>
              </div>
              <div className="ep-export-arrow">{loading === f.key ? "⏳" : "↓"}</div>
            </div>
          ))}
        </div>

        {/* Export History */}
        {history.length > 0 && (
          <div className="ep-history">
            <div className="ep-section-label" style={{ marginTop: 32 }}>Recent Exports</div>
            <div className="ep-history-card">
              <div className="ep-history-header">This Session</div>
              {history.map((h) => (
                <div className="ep-history-row" key={h.id}>
                  <div>
                    <div className="ep-history-name">{h.dataset} · {h.period}</div>
                    <div className="ep-history-meta">{h.time}</div>
                  </div>
                  <span className={`ep-history-badge ${h.format}`}>{h.format}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Toast */}
      {toast && (
        <div className={`ep-toast ${toast.type}`}>
          {toast.type === "success" ? "✓" : "✗"} {toast.msg}
        </div>
      )}
    </div>
  );
}
