// Cross-subdomain SSO launch: Community / Academy dedicated hosts (Phase 1 Core Engine).
import type { CSSProperties } from "react";
import { getPlatformSsoTarget, getSsoLaunchError, startSsoLaunch } from "./ssoLaunch";

type Variant = "team" | "settings";

const teamPanel: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  overflow: "hidden",
  position: "relative",
  marginBottom: "24px",
};

const teamPanelBar: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "2px",
  background: "linear-gradient(90deg, var(--gold), var(--ice))",
};

const teamTitle: CSSProperties = {
  fontFamily: "Space Mono, monospace",
  fontSize: "10px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  color: "var(--gold)",
  marginBottom: "10px",
};

const teamCopy: CSSProperties = {
  fontSize: "12px",
  color: "var(--text-dim)",
  lineHeight: 1.6,
  marginBottom: "14px",
};

const teamBtnRow: CSSProperties = { display: "flex", gap: "10px", flexWrap: "wrap" };

const teamBtn: CSSProperties = {
  padding: "8px 14px",
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--ice)",
  fontFamily: "Space Mono, monospace",
  fontSize: "10px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
};

export function CrossAppSsoActions({ variant }: { variant: Variant }) {
  const community = getPlatformSsoTarget("/community");
  const academy = getPlatformSsoTarget("/academy");
  if (!community && !academy) return null;

  const launch = async (origin: string, nextPath: string) => {
    try {
      await startSsoLaunch({ targetOrigin: origin, nextPath });
    } catch (e) {
      window.alert(getSsoLaunchError(e));
    }
  };

  if (variant === "settings") {
    return (
      <div className="st-form-card" style={{ marginTop: 18 }}>
        <div className="st-form-title">Cross-app sign-in (SSO)</div>
        <p className="st-copy" style={{ fontSize: 13 }}>
          Continue to dedicated Community or Academy hosts with a short-lived handoff from this
          session. Configure{" "}
          <code style={{ fontSize: 11 }}>VITE_SSO_COMMUNITY_ORIGIN</code> and{" "}
          <code style={{ fontSize: 11 }}>VITE_SSO_ACADEMY_ORIGIN</code> to enable these actions.
        </p>
        <div className="st-btn-row">
          {community ? (
            <button type="button" className="st-btn ghost" onClick={() => void launch(community, "/community")}>
              Community · SSO
            </button>
          ) : null}
          {academy ? (
            <button type="button" className="st-btn ghost" onClick={() => void launch(academy, "/academy")}>
              Academy · SSO
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div style={teamPanel}>
      <div style={teamPanelBar} />
      <div style={{ padding: "20px 24px" }}>
        <div style={teamTitle}>Cross-app SSO</div>
        <p style={teamCopy}>
          Open your workspace on dedicated Community or Academy surfaces without signing in again
          (when those hosts are configured).
        </p>
        <div style={teamBtnRow}>
          {community ? (
            <button type="button" style={teamBtn} onClick={() => void launch(community, "/community")}>
              Community →
            </button>
          ) : null}
          {academy ? (
            <button type="button" style={teamBtn} onClick={() => void launch(academy, "/academy")}>
              Academy →
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
