import { useAuthStore } from "../../features/auth/authStore";
import { useTrustScore } from "../../hooks/useTrustScore";
import { getOmegaProfileContext, type OmegaLayerKey, type OmegaTrustUnlock } from "../../features/onboarding/omegaProfileContext";

type Props = {
  layer: OmegaLayerKey;
};

function formatRange(unlock: OmegaTrustUnlock) {
  return `${unlock.min}-${unlock.max}`;
}

export default function OmegaProfileAssignmentCard({ layer }: Props) {
  const user = useAuthStore((state) => state.user);
  const { score, isLoading } = useTrustScore();
  const context = getOmegaProfileContext(user?.onboardingProfileType);

  if (!context || context.primaryLayer !== layer) return null;

  return (
    <section
      style={{
        margin: "18px 0 22px",
        borderRadius: 20,
        border: "1px solid rgba(201,168,76,0.18)",
        background:
          "radial-gradient(circle at top right, rgba(201,168,76,0.12), transparent 32%), linear-gradient(135deg, rgba(14,22,35,0.96), rgba(11,18,29,0.94))",
        boxShadow: "0 18px 42px rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 20px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--gold)",
          }}
        >
          <span>OMEGA Profile Route</span>
          <span
            style={{
              padding: "3px 8px",
              borderRadius: 999,
              border: "1px solid rgba(201,168,76,0.24)",
              background: "rgba(201,168,76,0.08)",
              color: "var(--gold)",
            }}
          >
            {context.profileType.replace("The ", "")}
          </span>
          <span
            style={{
              padding: "3px 8px",
              borderRadius: 999,
              border: "1px solid rgba(137,196,225,0.24)",
              background: "rgba(137,196,225,0.08)",
              color: "var(--ice)",
              letterSpacing: "0.08em",
            }}
          >
            {user?.onboardingSelectedPlan ?? "free"} plan
          </span>
        </div>

        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text)" }}>
          {context.primarySupervisor} leads this route.
          {context.secondarySupervisor ? ` ${context.secondarySupervisor} stays close behind.` : ""}
        </div>

        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--text-dim)" }}>
          Primary platform: <strong style={{ color: "var(--text)" }}>{context.primaryPlatformHost}</strong> with default entry at{" "}
          <code style={{ color: "var(--gold)" }}>{context.entryPath}</code>.
        </p>

        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: "var(--text-dim)" }}>
          Plan limits stay active first. Trust unlocks stack on top of your current plan instead of replacing it.
        </p>
      </div>

      <div style={{ padding: 20, display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)" }}>
            OMEGA briefing focus
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {context.briefingFocus.map((item) => (
              <div
                key={item}
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.03)",
                  color: "var(--text)",
                  fontSize: 13,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {context.preActivatedFeatures.length ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)" }}>
              Pre-activated features
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {context.preActivatedFeatures.map((item) => (
                <span
                  key={item}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(201,168,76,0.16)",
                    background: "rgba(201,168,76,0.06)",
                    color: "var(--text)",
                    fontSize: 12,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid rgba(137,196,225,0.18)",
            background: "rgba(137,196,225,0.06)",
          }}
        >
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ice)", marginBottom: 8 }}>
            Suggested first action
          </div>
          <div style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "var(--text)" }}>{context.firstAction}</div>
        </div>

        {context.trustUnlocks?.length ? (
          <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)" }}>
              Trust Score unlocks
            </div>
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(201,168,76,0.22)",
                background: "rgba(201,168,76,0.08)",
                color: "var(--gold)",
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
              }}
            >
              Trust Score {isLoading ? "..." : score}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {context.trustUnlocks.map((unlock) => {
              const active = !isLoading && score >= unlock.min && score <= unlock.max;

              return (
                <div
                  key={`${unlock.min}-${unlock.max}`}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: active ? "1px solid rgba(201,168,76,0.34)" : "1px solid rgba(255,255,255,0.06)",
                    background: active ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)",
                    display: "grid",
                    gap: 5,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong style={{ color: active ? "var(--gold)" : "var(--text)", fontSize: 13 }}>{unlock.label}</strong>
                    <span style={{ color: "var(--text-dim)", fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
                      {formatRange(unlock)}
                    </span>
                  </div>
                  <div style={{ color: "var(--text-dim)", fontSize: 12, lineHeight: 1.6 }}>{unlock.description}</div>
                </div>
              );
            })}
          </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
