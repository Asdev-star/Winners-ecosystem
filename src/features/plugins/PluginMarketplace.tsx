import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { PluginCard } from "./PluginCard";

type Plugin = {
  id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  currency?: string;
  version?: string;
  averageRating?: number;
  installCount?: number;
  installed?: boolean;
  developer?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type PluginDetail = Plugin & {
  reviews?: Array<{
    id: string;
    rating: number;
    title: string;
    content: string;
    createdAt: string;
    user?: { id: string; name: string } | null;
  }>;
};

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

export function PluginMarketplace() {
  const token = useAuthStore((state) => state.token);
  const [query, setQuery] = useState("");
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [installingId, setInstallingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function loadMarketplace() {
      setLoading(true);
      setError("");

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [pluginsRes, installsRes] = await Promise.all([
          fetch(`${API}/plugins`, { headers }),
          fetch(`${API}/plugins/installed`, { headers }),
        ]);

        const pluginPayload = await pluginsRes.json().catch(() => ({ plugins: [] }));
        const installsPayload = await installsRes.json().catch(() => ({ installs: [] }));

        if (!pluginsRes.ok) {
          throw new Error(pluginPayload.error || "Failed to load plugins");
        }

        const nextInstalledIds = Array.isArray(installsPayload.installs)
          ? installsPayload.installs
              .map((install: { pluginId?: string; plugin?: { id?: string } | null }) => install.pluginId || install.plugin?.id)
              .filter((value: unknown): value is string => typeof value === "string")
          : [];

        if (cancelled) return;

        setInstalledIds(nextInstalledIds);
        setPlugins(
          (Array.isArray(pluginPayload.plugins) ? pluginPayload.plugins : []).map((plugin: Plugin) => ({
            ...plugin,
            installed: nextInstalledIds.includes(plugin.id),
          })),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load plugin marketplace");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMarketplace();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const filteredPlugins = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return plugins;
    return plugins.filter(
      (plugin) =>
        plugin.name.toLowerCase().includes(normalized) ||
        plugin.description.toLowerCase().includes(normalized) ||
        plugin.category.toLowerCase().includes(normalized),
    );
  }, [plugins, query]);

  async function handleInstall(pluginId: string) {
    if (!token || installedIds.includes(pluginId)) return;

    setInstallingId(pluginId);
    setError("");

    try {
      const res = await fetch(`${API}/plugins/${pluginId}/install`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((payload as { error?: string }).error || "Failed to install plugin");
      }

      setInstalledIds((current) => [...current, pluginId]);
      setPlugins((current) =>
        current.map((plugin) =>
          plugin.id === pluginId
            ? { ...plugin, installed: true, installCount: (plugin.installCount ?? 0) + 1 }
            : plugin,
        ),
      );
      setSelectedPlugin((current) =>
        current?.id === pluginId
          ? { ...current, installed: true, installCount: (current.installCount ?? 0) + 1 }
          : current,
      );
    } catch (installError) {
      setError(installError instanceof Error ? installError.message : "Failed to install plugin");
    } finally {
      setInstallingId(null);
    }
  }

  async function handleSelect(pluginId: string) {
    if (!token) return;

    try {
      const res = await fetch(`${API}/plugins/${pluginId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((payload as { error?: string }).error || "Failed to load plugin details");
      }

      setSelectedPlugin({
        ...(payload as PluginDetail),
        installed: installedIds.includes(pluginId),
      });
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Failed to load plugin details");
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "var(--gold)", textTransform: "uppercase" }}>Cloud / Plugins</div>
        <h1 style={{ margin: "8px 0", color: "var(--text)" }}>Plugin Marketplace</h1>
        <p style={{ margin: 0, color: "var(--text-dim)", maxWidth: 720 }}>
          Browse published plugins, inspect developer listings, and install cloud extensions directly from the live marketplace API.
        </p>
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(224,90,78,.26)",
            background: "rgba(224,90,78,.08)",
            color: "#ffcbc5",
          }}
        >
          {error}
        </div>
      ) : null}

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search plugins"
        style={{
          width: "100%",
          maxWidth: 420,
          marginBottom: 20,
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
        }}
      />

      {loading ? (
        <div style={{ color: "var(--text-dim)" }}>Loading plugin marketplace...</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {filteredPlugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={{ ...plugin, installed: installedIds.includes(plugin.id) }}
                viewMode="grid"
                onInstall={() => void handleInstall(plugin.id)}
                onClick={() => void handleSelect(plugin.id)}
              />
            ))}
          </div>

          {selectedPlugin ? (
            <section
              style={{
                marginTop: 24,
                border: "1px solid var(--border)",
                borderRadius: 16,
                background: "var(--surface)",
                padding: 20,
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--gold)", textTransform: "uppercase" }}>{selectedPlugin.category}</div>
                  <h2 style={{ margin: "6px 0", color: "var(--text)" }}>{selectedPlugin.name}</h2>
                  <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
                    {selectedPlugin.developer?.name ?? "Unknown developer"} • v{selectedPlugin.version ?? "1.0.0"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlugin(null)}
                  style={{
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-dim)",
                    borderRadius: 999,
                    padding: "8px 14px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
              <p style={{ margin: 0, color: "var(--text-dim)", lineHeight: 1.6 }}>{selectedPlugin.description}</p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "var(--text-dim)", fontSize: 13 }}>
                <span>Rating: {selectedPlugin.averageRating?.toFixed(1) ?? "New"}</span>
                <span>Installs: {selectedPlugin.installCount ?? 0}</span>
                <span>
                  Price:{" "}
                  {!selectedPlugin.price || selectedPlugin.price <= 0
                    ? "Free"
                    : new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: selectedPlugin.currency || "USD",
                      }).format(selectedPlugin.price)}
                </span>
              </div>
              {selectedPlugin.reviews?.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <h3 style={{ margin: 0, color: "var(--text)" }}>Recent Reviews</h3>
                  {selectedPlugin.reviews.map((review) => (
                    <div key={review.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                      <div style={{ color: "var(--text)", fontWeight: 600 }}>{review.title || `${review.rating}/5`}</div>
                      <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 2 }}>
                        {review.user?.name ?? "Anonymous"} • {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                      <p style={{ margin: "8px 0 0", color: "var(--text-dim)" }}>{review.content}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <div>
                <button
                  type="button"
                  disabled={selectedPlugin.installed || installingId === selectedPlugin.id}
                  onClick={() => void handleInstall(selectedPlugin.id)}
                  style={{
                    border: "1px solid rgba(201,168,76,.25)",
                    background: "rgba(201,168,76,.08)",
                    color: "var(--gold)",
                    borderRadius: 999,
                    padding: "10px 16px",
                    cursor: selectedPlugin.installed ? "default" : "pointer",
                  }}
                >
                  {selectedPlugin.installed ? "Installed" : installingId === selectedPlugin.id ? "Installing..." : "Install Plugin"}
                </button>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

export default PluginMarketplace;
