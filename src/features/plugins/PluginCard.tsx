interface Plugin {
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
}

interface PluginCardProps {
  plugin: Plugin;
  viewMode: "grid" | "list";
  onInstall: () => void;
  onClick: () => void;
}

export function PluginCard({ plugin, viewMode, onInstall, onClick }: PluginCardProps) {
  const priceLabel =
    !plugin.price || plugin.price <= 0
      ? "Free"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: plugin.currency || "USD",
        }).format(plugin.price);

  return (
    <article
      onClick={onClick}
      style={{
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 16,
        background: "var(--surface)",
        display: "grid",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", textTransform: "uppercase" }}>{plugin.category}</div>
          <h3 style={{ margin: "6px 0 0", color: "var(--text)" }}>{plugin.name}</h3>
        </div>
        <span style={{ fontSize: 12, color: "var(--gold)" }}>
          {plugin.installed ? "Installed" : viewMode === "grid" ? "Grid" : "List"}
        </span>
      </div>
      <p style={{ margin: 0, color: "var(--text-dim)", lineHeight: 1.5 }}>{plugin.description}</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
            {plugin.averageRating?.toFixed(1) ?? "New"} rating • {plugin.installCount ?? 0} installs
          </span>
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
            {priceLabel}{plugin.version ? ` • v${plugin.version}` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onInstall();
          }}
          style={{
            border: "1px solid rgba(201,168,76,.25)",
            background: "rgba(201,168,76,.08)",
            color: "var(--gold)",
            borderRadius: 999,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          {plugin.installed ? "Installed" : "Install"}
        </button>
      </div>
    </article>
  );
}
