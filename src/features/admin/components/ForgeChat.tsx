import type { FormEvent } from "react";

type ForgeChatMessage = {
  id: string;
  role: "forge" | "operator";
  content: string;
};

type Props = {
  messages: ForgeChatMessage[];
  draft: string;
  onDraftChange: (next: string) => void;
  onSubmit: () => void;
  isStreaming?: boolean;
};

const css = `
  .fct-shell{
    display:grid;
    gap:14px;
  }
  .fct-thread{
    display:grid;
    gap:10px;
  }
  .fct-message{
    max-width:min(720px, 100%);
    padding:14px 16px;
    border-radius:18px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);
  }
  .fct-message.forge{
    border-color:rgba(201,168,76,.18);
    background:rgba(201,168,76,.08);
  }
  .fct-role{
    margin-bottom:6px;
    font-family:"Space Mono", monospace;
    font-size:10px;
    letter-spacing:.12em;
    text-transform:uppercase;
    color:var(--gold);
  }
  .fct-message.operator .fct-role{
    color:var(--text-dim);
  }
  .fct-copy{
    font-size:14px;
    line-height:1.7;
    color:var(--text);
  }
  .fct-form{
    display:grid;
    gap:10px;
  }
  .fct-input{
    width:100%;
    min-height:118px;
    padding:12px 14px;
    border-radius:16px;
    border:1px solid rgba(255,255,255,.1);
    background:rgba(8,14,24,.92);
    color:var(--text);
    resize:vertical;
    font:inherit;
  }
  .fct-actions{
    display:flex;
    justify-content:space-between;
    gap:12px;
    align-items:center;
    flex-wrap:wrap;
  }
  .fct-meta{
    color:var(--text-dim);
    font-family:"Space Mono", monospace;
    font-size:10px;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .fct-button{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-height:40px;
    padding:0 14px;
    border-radius:999px;
    border:1px solid rgba(201,168,76,.22);
    background:rgba(201,168,76,.08);
    color:var(--gold);
    font-family:"Space Mono", monospace;
    font-size:11px;
    letter-spacing:.08em;
    text-transform:uppercase;
    cursor:pointer;
  }
`;

export type { ForgeChatMessage };

export default function ForgeChat({ messages, draft, onDraftChange, onSubmit, isStreaming = false }: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <>
      <style>{css}</style>
      <div className="fct-shell">
        <div className="fct-thread">
          {messages.map((message) => (
            <div key={message.id} className={`fct-message ${message.role}`}>
              <div className="fct-role">{message.role === "forge" ? "FORGE" : "Operator"}</div>
              <div className="fct-copy">{message.content}</div>
            </div>
          ))}
        </div>

        <form className="fct-form" onSubmit={handleSubmit}>
          <textarea
            className="fct-input"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Write the next operator prompt for FORGE..."
          />
          <div className="fct-actions">
            <div className="fct-meta">{isStreaming ? "FORGE is streaming a response" : "Supervisor channel ready"}</div>
            <button className="fct-button" type="submit" disabled={!draft.trim()}>
              Send to FORGE
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
