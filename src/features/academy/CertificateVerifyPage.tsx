import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE } from "../../lib/api";

interface CertificateInfo {
  id: string;
  certNumber: string;
  verificationCode: string;
  userName: string;
  courseTitle: string;
  courseDescription?: string | null;
  issuedAt: string;
  pdfUrl?: string | null;
  verifyUrl?: string;
}

interface VerifyResponse {
  valid: boolean;
  certificate?: CertificateInfo;
  message?: string;
}

export default function CertificateVerifyPage() {
  const params = useParams<{ code?: string; token?: string }>();
  const code = params.code ?? params.token ?? "";
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const verify = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`${API_BASE}/academy/verify/${code}`);
      const data = (await res.json()) as VerifyResponse;
      setResult(data);
    } catch {
      setResult({
        valid: false,
        message: "Unable to reach verification server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void verify();
  }, [verify]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const shareUrl = result?.certificate?.verifyUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(result.certificate.verifyUrl)}`
    : "";

  return (
    <div>
      <style>{`
        .cv-shell {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at top, rgba(201,168,76,0.08), transparent 40%),
            var(--bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .cv-brand {
          font-family: "Space Mono", monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 28px;
        }
        .cv-card {
          width: 100%;
          max-width: 620px;
          background: linear-gradient(180deg, rgba(8,17,28,0.98), rgba(15,22,34,0.98));
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 22px 60px rgba(0,0,0,0.35);
        }
        .cv-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border: 1px solid rgba(201,168,76,0.32);
          border-radius: 18px;
          pointer-events: none;
        }
        .cv-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-family: "Space Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 22px;
        }
        .cv-badge.valid {
          border: 1px solid rgba(45,212,160,0.35);
          background: rgba(45,212,160,0.08);
          color: var(--green);
        }
        .cv-badge.invalid {
          border: 1px solid rgba(224,90,78,0.35);
          background: rgba(224,90,78,0.08);
          color: var(--red);
        }
        .cv-title {
          font-family: "Cormorant Garamond", serif;
          font-size: clamp(34px, 6vw, 52px);
          font-weight: 600;
          color: var(--gold);
          text-align: center;
          line-height: 1;
          margin-bottom: 10px;
        }
        .cv-subtitle {
          font-family: "Syne", sans-serif;
          text-align: center;
          color: var(--text-dim);
          line-height: 1.6;
          font-size: 14px;
          margin: 0 auto 22px;
          max-width: 500px;
        }
        .cv-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 22px;
        }
        .cv-meta {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.02);
        }
        .cv-meta-label {
          font-family: "Space Mono", monospace;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-dim);
          margin-bottom: 6px;
        }
        .cv-meta-value {
          font-family: "Syne", sans-serif;
          color: var(--text);
          font-size: 13px;
          line-height: 1.5;
          word-break: break-word;
        }
        .cv-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 22px;
        }
        .cv-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          text-decoration: none;
          font-family: "Space Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: all 0.18s ease;
        }
        .cv-btn.primary {
          border: 1px solid var(--gold);
          color: var(--bg);
          background: var(--gold);
        }
        .cv-btn.secondary {
          border: 1px solid var(--border);
          color: var(--text-dim);
          background: var(--surface2);
        }
        .cv-btn:hover { transform: translateY(-1px); }
        .cv-spinner {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid var(--border);
          border-top-color: var(--gold);
          margin: 0 auto 16px;
          animation: spin 0.85s linear infinite;
        }
        .cv-footer {
          margin-top: 20px;
          font-family: "Space Mono", monospace;
          font-size: 9px;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-align: center;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .cv-card { padding: 22px 18px; border-radius: 16px; }
          .cv-grid { grid-template-columns: 1fr; }
          .cv-actions { align-items: stretch; }
          .cv-btn { width: 100%; }
        }
      `}</style>

      <div className="cv-shell">
        <div className="cv-brand">Winners Ecosystem · Public Verification</div>

        <div className="cv-card">
          {loading && (
            <>
              <div className="cv-spinner" />
              <div style={{ textAlign: "center", fontFamily: "Space Mono, monospace", fontSize: 11, color: "var(--text-dim)" }}>
                Verifying certificate…
              </div>
            </>
          )}

          {!loading && result?.valid && result.certificate && (
            <>
              <div style={{ textAlign: "center" }}>
                <div className="cv-badge valid">✓ Verified Certificate</div>
                <div className="cv-title">{result.certificate.userName}</div>
                <p className="cv-subtitle">
                  has successfully completed <strong>{result.certificate.courseTitle}</strong>.
                </p>
              </div>

              {result.certificate.courseDescription && (
                <p className="cv-subtitle" style={{ marginTop: 0 }}>
                  {result.certificate.courseDescription}
                </p>
              )}

              <div className="cv-grid">
                <div className="cv-meta">
                  <div className="cv-meta-label">Certificate No</div>
                  <div className="cv-meta-value">{result.certificate.certNumber}</div>
                </div>
                <div className="cv-meta">
                  <div className="cv-meta-label">Issued</div>
                  <div className="cv-meta-value">{formatDate(result.certificate.issuedAt)}</div>
                </div>
                <div className="cv-meta">
                  <div className="cv-meta-label">Verification Code</div>
                  <div className="cv-meta-value">{result.certificate.verificationCode}</div>
                </div>
                <div className="cv-meta">
                  <div className="cv-meta-label">Status</div>
                  <div className="cv-meta-value">Academy certificate in good standing</div>
                </div>
              </div>

              <div className="cv-actions">
                {shareUrl && (
                  <a href={shareUrl} target="_blank" rel="noreferrer" className="cv-btn primary">
                    Verify on LinkedIn
                  </a>
                )}
                {result.certificate.pdfUrl && (
                  <a href={result.certificate.pdfUrl} target="_blank" rel="noreferrer" className="cv-btn secondary">
                    Open PDF
                  </a>
                )}
                {result.certificate.verifyUrl && (
                  <a href={result.certificate.verifyUrl} target="_blank" rel="noreferrer" className="cv-btn secondary">
                    Copyable Verify Link
                  </a>
                )}
              </div>
            </>
          )}

          {!loading && !result?.valid && (
            <>
              <div style={{ textAlign: "center" }}>
                <div className="cv-badge invalid">✕ Invalid Certificate</div>
                <p className="cv-subtitle" style={{ marginBottom: 10 }}>
                  {result?.message ?? "This certificate could not be verified."}
                </p>
                <p className="cv-subtitle" style={{ marginBottom: 0 }}>
                  If you believe this is an error, contact Winners Ecosystem support.
                </p>
              </div>
            </>
          )}
        </div>

        {!loading && (
          <div style={{ marginTop: 24 }}>
            <Link to="/" style={{ color: "var(--text-dim)", textDecoration: "none" }} className="cv-btn secondary">
              Back to Winners Ecosystem
            </Link>
          </div>
        )}

        <div className="cv-footer">public certificate verification · {new Date().getFullYear()}</div>
      </div>
    </div>
  );
}
