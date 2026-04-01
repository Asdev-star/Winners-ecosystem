import { useMemo, useState } from "react";
import { useAuthStore } from "../../auth/authStore";

type AtlasResearchResult = {
  winningProducts?: Array<{
    name?: string;
    estimatedMargin?: string | number;
    supplierRecommendation?: string;
    targetAudience?: string;
    africanMarketFit?: string;
  }>;
  bestSupplier?: string;
  pricingStrategy?: string | Record<string, unknown>;
  demandForecast?: string;
  atlasConclusion?: string;
};

type Props = {
  platformContext: Record<string, unknown>;
};

const starterPrompts = [
  "Research African fashion niche",
  "Find winning health products",
];

function safeParseAtlasResult(value: string): AtlasResearchResult | null {
  try {
    return JSON.parse(value) as AtlasResearchResult;
  } catch {
    const jsonMatch = value.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    try {
      return JSON.parse(jsonMatch[0]) as AtlasResearchResult;
    } catch {
      return null;
    }
  }
}

export default function ATLASPanel({ platformContext }: Props) {
  const token = useAuthStore((state) => state.token);
  const [niche, setNiche] = useState(starterPrompts[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState("");
  const [result, setResult] = useState<AtlasResearchResult | null>(null);

  const pricingSummary = useMemo(() => {
    if (!result?.pricingStrategy) return null;
    if (typeof result.pricingStrategy === "string") return result.pricingStrategy;

    return Object.entries(result.pricingStrategy)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ");
  }, [result]);

  async function runResearch(selectedNiche: string) {
    if (!token) {
      setError("Sign in to use ATLAS research.");
      return;
    }

    setNiche(selectedNiche);
    setIsLoading(true);
    setError(null);
    setRawResponse("");
    setResult(null);

    try {
      const response = await fetch("/api/v1/atlas/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          niche: selectedNiche,
          platformContext,
        }),
      });

      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "ATLAS research failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");
        buffer = messages.pop() || "";

        for (const message of messages) {
          const payload = message
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.replace(/^data:\s*/, ""))
            .join("");

          if (!payload || payload === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payload) as { token?: string };
            if (parsed.token) {
              accumulated += parsed.token;
              setRawResponse(accumulated);
            }
          } catch {
            // Ignore malformed chunks and continue streaming.
          }
        }
      }

      const parsedResult = safeParseAtlasResult(accumulated);
      if (!parsedResult) {
        throw new Error("ATLAS did not return valid research JSON.");
      }

      setResult(parsedResult);
      setRawResponse(accumulated);
    } catch (researchError) {
      setError(
        researchError instanceof Error
          ? researchError.message
          : "ATLAS research failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      style={{
        background: "linear-gradient(180deg, rgba(201,168,76,0.08), rgba(17,29,46,0.96))",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: 8,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "var(--gold)",
              marginBottom: 8,
            }}
          >
            ATLAS Research
          </div>
          <h3
            style={{
              margin: 0,
              color: "var(--text)",
              fontFamily: "var(--font-display)",
              fontSize: 24,
            }}
          >
            Market intelligence for your next winning product
          </h3>
        </div>
        <button
          type="button"
          onClick={() => void runResearch(niche)}
          disabled={isLoading}
          style={{
            alignSelf: "flex-start",
            padding: "12px 18px",
            borderRadius: 6,
            border: "none",
            background: "var(--gold)",
            color: "var(--bg)",
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? "Researching..." : "Run ATLAS"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16, marginBottom: 16 }}>
        {starterPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void runResearch(prompt)}
            disabled={isLoading}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: niche === prompt ? "1px solid var(--gold)" : "1px solid var(--border)",
              background: niche === prompt ? "rgba(201,168,76,0.08)" : "var(--surface2)",
              color: niche === prompt ? "var(--gold)" : "var(--text)",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: 12,
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          htmlFor="atlas-niche"
          style={{
            display: "block",
            color: "var(--text-dim)",
            fontSize: 12,
            marginBottom: 6,
          }}
        >
          Research niche
        </label>
        <input
          id="atlas-niche"
          value={niche}
          onChange={(event) => setNiche(event.target.value)}
          placeholder="Research African fashion niche"
          style={{
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            padding: "12px 14px",
          }}
        />
      </div>

      {error ? (
        <div
          style={{
            borderRadius: 6,
            border: "1px solid rgba(224,90,78,0.3)",
            background: "rgba(224,90,78,0.08)",
            color: "var(--red)",
            padding: 12,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      ) : null}

      {result ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ color: "var(--text)", fontWeight: 700 }}>Winning Products</div>
            {result.winningProducts?.map((product, index) => (
              <div
                key={`${product.name ?? "product"}-${index}`}
                style={{
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  padding: 14,
                }}
              >
                <div style={{ color: "var(--text)", fontWeight: 700 }}>{product.name ?? `Product ${index + 1}`}</div>
                <div style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 6 }}>
                  Margin: {String(product.estimatedMargin ?? "N/A")} · Supplier: {product.supplierRecommendation ?? "N/A"}
                </div>
                <div style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 6 }}>
                  Audience: {product.targetAudience ?? "N/A"}
                </div>
                <div style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 6 }}>
                  African market fit: {product.africanMarketFit ?? "N/A"}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <div style={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", padding: 14 }}>
              <div style={{ color: "var(--gold)", fontSize: 12, marginBottom: 6 }}>Best Supplier</div>
              <div style={{ color: "var(--text)" }}>{result.bestSupplier ?? "Not provided"}</div>
            </div>
            <div style={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", padding: 14 }}>
              <div style={{ color: "var(--gold)", fontSize: 12, marginBottom: 6 }}>Pricing Strategy</div>
              <div style={{ color: "var(--text)" }}>{pricingSummary ?? "Not provided"}</div>
            </div>
            <div style={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", padding: 14 }}>
              <div style={{ color: "var(--gold)", fontSize: 12, marginBottom: 6 }}>Demand Forecast</div>
              <div style={{ color: "var(--text)" }}>{result.demandForecast ?? "Not provided"}</div>
            </div>
          </div>

          <div style={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", padding: 14 }}>
            <div style={{ color: "var(--gold)", fontSize: 12, marginBottom: 6 }}>ATLAS Conclusion</div>
            <div style={{ color: "var(--text)" }}>{result.atlasConclusion ?? "Not provided"}</div>
          </div>
        </div>
      ) : rawResponse ? (
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            color: "var(--text)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 14,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {rawResponse}
        </pre>
      ) : (
        <div
          style={{
            borderRadius: 6,
            border: "1px dashed var(--border)",
            padding: 18,
            color: "var(--text-dim)",
            background: "rgba(17,29,46,0.55)",
          }}
        >
          Run ATLAS to get winning products, pricing strategy, and demand forecast tailored to your current vendor data.
        </div>
      )}
    </section>
  );
}
