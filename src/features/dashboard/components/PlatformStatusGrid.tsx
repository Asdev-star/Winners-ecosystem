type OverviewLayer = {
  id: string;
  name: string;
  progress: number;
  status: "live" | "ready" | "locked" | "build";
  statusLabel: string;
  adminPath?: string;
  actionLabel: string;
  note: string;
};

type Props = {
  layers: OverviewLayer[];
  nextLocked: OverviewLayer | null;
  onReviewNext: () => void;
  onSelectLayer: (layer: OverviewLayer) => void;
  getLayerChrome: (name: string) => { icon: string; supervisor: string };
};

export default function PlatformStatusGrid({
  layers,
  nextLocked,
  onReviewNext,
  onSelectLayer,
  getLayerChrome,
}: Props) {
  return (
    <div className="aov-panel">
      <div className="aov-head">
        <div>
          <div className="aov-kicker">Platform Layer Status Grid</div>
          <h2 className="aov-title">Nine-layer activation matrix</h2>
        </div>
        {nextLocked ? (
          <button className="aov-mini-link" onClick={onReviewNext}>
            Review Next Activation
          </button>
        ) : null}
      </div>
      <div className="aov-layers">
        {layers.map((layer) => {
          const chrome = getLayerChrome(layer.name);
          return (
            <button key={layer.id} type="button" className="aov-layer" onClick={() => onSelectLayer(layer)}>
              <div className="aov-layer-head">
                <h3 className="aov-layer-name">{chrome.icon} {layer.name}</h3>
                <span className={`aov-pill ${layer.status}`}>{layer.statusLabel}</span>
              </div>
              <div className="aov-progress">
                <div className="aov-fill" style={{ width: `${layer.progress}%` }} />
              </div>
              <div className="aov-layer-meta">
                <span>{layer.progress}% complete</span>
                <span>{layer.actionLabel}</span>
              </div>
              <div className="aov-layer-supervisor">{chrome.supervisor}</div>
              <div className="aov-layer-note">{layer.note}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
