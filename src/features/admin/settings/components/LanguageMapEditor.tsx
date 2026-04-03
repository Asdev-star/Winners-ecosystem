import { useState } from "react";

type MapEntry = { country: string; language: string };

type Props = {
  value: MapEntry[];
  languages: Array<{ code: string; name: string }>;
  disabled?: boolean;
  onChange: (value: MapEntry[]) => void;
};

export default function LanguageMapEditor({ value, languages, disabled, onChange }: Props) {
  const [country, setCountry] = useState("KE");
  const [language, setLanguage] = useState("sw");

  function addMapping() {
    const next = value.filter((item) => item.country !== country);
    onChange([...next, { country, language }]);
  }

  return (
    <div className="asbuilder">
      <div className="asbuilder-grid">
        <input className="asinput" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="Country code" />
        <select className="asinput" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {languages.map((item) => (
            <option key={item.code} value={item.code}>{item.name}</option>
          ))}
        </select>
      </div>
      <button className="asbtn" disabled={disabled} onClick={addMapping}>Save Mapping</button>
      <div className="aslist">
        {value.map((entry) => (
          <div key={entry.country} className="aslist-row">
            <strong>{entry.country}</strong>
            <span>{entry.language}</span>
            <button className="asbtn ghost" disabled={disabled} onClick={() => onChange(value.filter((item) => item.country !== entry.country))}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
