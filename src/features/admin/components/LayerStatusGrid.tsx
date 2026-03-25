type LayerStatusGridItem = {
  id: string;
  name: string;
  progress: number;
  statusLabel: string;
  actionLabel?: string;
  note: string;
  onSelect?: () => void;
};

type Props = {
  layers: LayerStatusGridItem[];
};

const css = `
  .als-grid{
    display:grid;
    grid-template-columns:repeat(4, minmax(0, 1fr));
    gap:12px;
  }
  .als-card{
    width:100%;
    padding:16px;
    border-radius:18px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);
    color:var(--text);
    text-align:left;
    cursor:pointer;
  }
  .als-card.static{
    cursor:default;
  }
  .als-head{
    display:flex;
    justify-content:space-between;
    gap:12px;
    align-items:flex-start;
  }
  .als-name{
    font-size:16px;
    font-weight:800;
  }
  .als-pill{
    display:inline-flex;
    align-items:center;
    padding:5px 9px;
    border-radius:999px;
    border:1px solid rgba(201,168,76,.22);
    background:rgba(201,168,76,.08);
    color:var(--gold);
    font-family:"Space Mono", monospace;
    font-size:9px;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .als-progress{
    margin-top:14px;
    height:10px;
    border-radius:999px;
    overflow:hidden;
    background:rgba(255,255,255,.08);
  }
  .als-fill{
    height:100%;
    border-radius:inherit;
    background:linear-gradient(90deg, rgba(201,168,76,.96), rgba(137,196,225,.88));
  }
  .als-meta{
    display:flex;
    justify-content:space-between;
    gap:12px;
    margin-top:10px;
    color:var(--text-dim);
    font-family:"Space Mono", monospace;
    font-size:10px;
    text-transform:uppercase;
  }
  .als-note{
    margin-top:10px;
    color:var(--text-dim);
    font-size:13px;
    line-height:1.55;
  }
  @media (max-width:1100px){
    .als-grid{
      grid-template-columns:repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width:760px){
    .als-grid{
      grid-template-columns:1fr;
    }
  }
`;

export type { LayerStatusGridItem };

export default function LayerStatusGrid({ layers }: Props) {
  return (
    <>
      <style>{css}</style>
      <div className="als-grid">
        {layers.map((layer) => {
          const isClickable = typeof layer.onSelect === "function";
          const Element = isClickable ? "button" : "div";

          return (
            <Element
              key={layer.id}
              className={`als-card${isClickable ? "" : " static"}`}
              {...(isClickable ? { type: "button", onClick: layer.onSelect } : {})}
            >
              <div className="als-head">
                <div className="als-name">{layer.name}</div>
                <span className="als-pill">{layer.statusLabel}</span>
              </div>
              <div className="als-progress">
                <div className="als-fill" style={{ width: `${layer.progress}%` }} />
              </div>
              <div className="als-meta">
                <span>{layer.progress}%</span>
                <span>{layer.actionLabel ?? "Inspect"}</span>
              </div>
              <div className="als-note">{layer.note}</div>
            </Element>
          );
        })}
      </div>
    </>
  );
}
