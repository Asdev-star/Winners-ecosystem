import { useState } from "react";
import type { TranslationOverride } from "../settingsTypes";

type Props = {
  value: TranslationOverride[];
  languages: Array<{ code: string; name: string }>;
  disabled?: boolean;
  keyHints?: string[];
  onChange: (value: TranslationOverride[]) => void;
};

export default function TranslationOverrideEditor({ value, languages, disabled, keyHints = [], onChange }: Props) {
  const [draft, setDraft] = useState({
    key: keyHints[0] ?? "omega.greeting.morning.sw",
    languageCode: languages[0]?.code ?? "en",
    context: "supervisor",
    value: "",
  });

  function addOverride() {
    if (!draft.key.trim() || !draft.value.trim()) return;
    const next = value.filter((item) => !(item.key === draft.key.trim() && item.languageCode === draft.languageCode));
    onChange([
      ...next,
      {
        id: `${draft.key.trim()}:${draft.languageCode}`,
        key: draft.key.trim(),
        languageCode: draft.languageCode,
        context: draft.context.trim() || null,
        value: draft.value.trim(),
        updatedBy: null,
      },
    ]);
    setDraft((current) => ({ ...current, value: "" }));
  }

  return (
    <div className="asbuilder">
      <div className="asbuilder-grid">
        <input
          className="asinput full"
          list="translation-key-hints"
          value={draft.key}
          onChange={(e) => setDraft({ ...draft, key: e.target.value })}
          placeholder="Translation key"
        />
        <datalist id="translation-key-hints">
          {keyHints.map((hint) => <option key={hint} value={hint} />)}
        </datalist>
        <select className="asinput" value={draft.languageCode} onChange={(e) => setDraft({ ...draft, languageCode: e.target.value })}>
          {languages.map((language) => (
            <option key={language.code} value={language.code}>{language.name}</option>
          ))}
        </select>
        <input className="asinput" value={draft.context} onChange={(e) => setDraft({ ...draft, context: e.target.value })} placeholder="Context" />
        <textarea
          className="asinput full"
          rows={3}
          value={draft.value}
          onChange={(e) => setDraft({ ...draft, value: e.target.value })}
          placeholder="Translation text"
        />
      </div>
      <button className="asbtn" disabled={disabled} onClick={addOverride}>Save Translation</button>
      <div className="aslist">
        {value.map((item) => (
          <div key={`${item.key}:${item.languageCode}`} className="aslist-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <strong>{item.key}</strong>
              <span>{item.languageCode}</span>
            </div>
            <div style={{ color: "var(--text-dim)", fontSize: 12 }}>{item.value}</div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono), 'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)" }}>
                {item.context ?? "global"}
              </span>
              <button
                className="asbtn ghost"
                disabled={disabled}
                onClick={() => onChange(value.filter((entry) => !(entry.key === item.key && entry.languageCode === item.languageCode)))}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
