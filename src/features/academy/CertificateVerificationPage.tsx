// Phase 3 — Winners Academy — CertificateVerificationPage.tsx
// Public page: verify a certificate by token (no auth required)

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE } from '../../lib/api';

interface CertificateInfo {
  id: string;
  userName: string;
  courseTitle: string;
  courseDescription?: string;
  issuedAt: string;
  verifyToken: string;
}

interface VerifyResponse {
  valid: boolean;
  certificate?: CertificateInfo;
  message?: string;
}

export default function CertificateVerificationPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  useEffect(() => {
    if (!token) return;
    void verify();
  }, [token]);

  const verify = async () => {
    try {
      const res = await fetch(`${API_BASE}/academy/certificates/verify/${token}`);
      const data = await res.json() as VerifyResponse;
      setResult(data);
    } catch {
      setResult({ valid: false, message: 'Unable to reach verification server. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      <style>{`
        .cert-verify-shell {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .cert-verify-logo {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 40px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cert-card {
          width: 100%;
          max-width: 560px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 36px;
          position: relative;
          overflow: hidden;
          text-align: center;
        }
        .cert-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--gold), var(--ice), transparent);
        }
        .cert-icon { font-size: 56px; margin-bottom: 16px; }
        .cert-valid-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 20px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 22px;
        }
        .cert-valid-badge.valid   { background: rgba(45,212,160,0.12); border: 1px solid rgba(45,212,160,0.4); color: var(--green); }
        .cert-valid-badge.invalid { background: rgba(224,90,78,0.10);  border: 1px solid rgba(224,90,78,0.4);  color: var(--red); }
        .cert-username {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 600;
          color: var(--gold);
          margin-bottom: 6px;
          font-style: italic;
        }
        .cert-completed-text {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .cert-course-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
        .cert-course-desc {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          color: var(--text-dim);
          line-height: 1.5;
          margin-bottom: 22px;
        }
        .cert-divider {
          height: 1px;
          background: var(--border);
          margin: 22px 0;
        }
        .cert-meta-row {
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }
        .cert-meta-item { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .cert-meta-label { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; }
        .cert-meta-value { font-family: 'Syne', sans-serif; font-size: 13px; color: var(--text); font-weight: 600; }
        .cert-invalid-msg {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          color: var(--text-dim);
          margin-bottom: 24px;
        }
        .cert-back-link {
          display: inline-block;
          padding: 10px 22px;
          border-radius: 5px;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text-dim);
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          text-decoration: none;
          text-transform: uppercase;
          transition: all 200ms ease;
        }
        .cert-back-link:hover { border-color: var(--gold); color: var(--gold); }
        .cert-footer {
          margin-top: 32px;
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: var(--text-dim);
          letter-spacing: 0.08em;
          text-align: center;
        }
        .cert-spinner {
          width: 36px; height: 36px;
          border: 3px solid var(--border);
          border-top-color: var(--gold);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .cert-token-line {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: var(--text-dim);
          word-break: break-all;
          margin-top: 8px;
          opacity: 0.6;
        }
      `}</style>

      <div className="cert-verify-shell">
        <div className="cert-verify-logo">
          ⬡ Winners Ecosystem
        </div>

        <div className="cert-card">
          {loading && (
            <>
              <div className="cert-spinner" />
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text-dim)' }}>
                Verifying certificate…
              </div>
            </>
          )}

          {!loading && result?.valid && result.certificate && (
            <>
              <div className="cert-icon">🏆</div>
              <div className="cert-valid-badge valid">✓ Verified Certificate</div>

              <div className="cert-completed-text">This certifies that</div>
              <div className="cert-username">{result.certificate.userName}</div>
              <div className="cert-completed-text">has successfully completed</div>
              <div className="cert-course-title">{result.certificate.courseTitle}</div>
              {result.certificate.courseDescription && (
                <div className="cert-course-desc">{result.certificate.courseDescription}</div>
              )}

              <div className="cert-divider" />

              <div className="cert-meta-row">
                <div className="cert-meta-item">
                  <span className="cert-meta-label">Issue Date</span>
                  <span className="cert-meta-value">{formatDate(result.certificate.issuedAt)}</span>
                </div>
                <div className="cert-meta-item">
                  <span className="cert-meta-label">Platform</span>
                  <span className="cert-meta-value">Winners Academy</span>
                </div>
                <div className="cert-meta-item">
                  <span className="cert-meta-label">Certificate ID</span>
                  <span className="cert-meta-value" style={{ fontSize: 11 }}>{result.certificate.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div className="cert-token-line">Verification token: {result.certificate.verifyToken}</div>
            </>
          )}

          {!loading && (!result?.valid) && (
            <>
              <div className="cert-icon">❌</div>
              <div className="cert-valid-badge invalid">✗ Invalid Certificate</div>
              <div className="cert-invalid-msg">
                {result?.message ?? 'This certificate could not be verified.'}
              </div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, color: 'var(--text-dim)', marginBottom: 24 }}>
                If you believe this is an error, contact support at the Winners Ecosystem.
              </p>
            </>
          )}
        </div>

        {!loading && (
          <div style={{ marginTop: 24 }}>
            <Link to="/" className="cert-back-link">← Go to Winners Ecosystem</Link>
          </div>
        )}

        <div className="cert-footer">
          winners ecosystem · academy certificates · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
