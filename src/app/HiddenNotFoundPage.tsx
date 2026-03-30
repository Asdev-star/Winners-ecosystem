import { Link } from "react-router-dom";

const css = `
  .hnf-root {
    min-height: 100%;
    display: grid;
    place-items: center;
    padding: 48px 20px 72px;
  }

  .hnf-card {
    width: min(460px, 100%);
    padding: 28px;
    border-radius: 12px;
    border: 1px solid rgba(201, 168, 76, 0.18);
    background: linear-gradient(180deg, rgba(13, 24, 38, 0.94), rgba(17, 29, 46, 0.9));
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
    text-align: center;
  }

  .hnf-code {
    font-family: "Space Mono", monospace;
    font-size: 11px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 12px;
  }

  .hnf-title {
    margin: 0;
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: var(--text);
  }

  .hnf-copy {
    margin: 12px 0 0;
    color: var(--text-dim);
    line-height: 1.6;
    font-size: 14px;
  }

  .hnf-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid rgba(201, 168, 76, 0.28);
    color: var(--gold);
    text-decoration: none;
    font-family: "Space Mono", monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: rgba(201, 168, 76, 0.08);
  }
`;

export default function HiddenNotFoundPage() {
  return (
    <div className="hnf-root">
      <style>{css}</style>
      <div className="hnf-card">
        <div className="hnf-code">404</div>
        <h1 className="hnf-title">Not Found</h1>
        <p className="hnf-copy">
          The page you requested could not be found.
        </p>
        <Link className="hnf-link" to="/home">
          Return to home
        </Link>
      </div>
    </div>
  );
}
