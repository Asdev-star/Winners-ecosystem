import { useState } from "react";

type Rule = {
  countryCode: string;
  countryName: string;
  primaryLanguage: string;
  fallbackLanguage: string;
  currencyCode: string;
  currencySymbol: string;
  paymentMethods: string[];
};

type Props = {
  value: Rule[];
  disabled?: boolean;
  onChange: (value: Rule[]) => void;
};

export default function CountryRuleBuilder({ value, disabled, onChange }: Props) {
  const [draft, setDraft] = useState<Rule>({
    countryCode: "NG",
    countryName: "Nigeria",
    primaryLanguage: "en",
    fallbackLanguage: "en",
    currencyCode: "NGN",
    currencySymbol: "₦",
    paymentMethods: ["paystack", "flutterwave"],
  });

  function addRule() {
    if (!draft.countryCode.trim()) return;
    const next = value.filter((item) => item.countryCode !== draft.countryCode.trim());
    onChange([...next, { ...draft, countryCode: draft.countryCode.trim(), countryName: draft.countryName.trim() }]);
  }

  return (
    <div className="asbuilder">
      <div className="asbuilder-grid">
        <input className="asinput" value={draft.countryCode} onChange={(e) => setDraft({ ...draft, countryCode: e.target.value.toUpperCase() })} placeholder="Country code" />
        <input className="asinput" value={draft.countryName} onChange={(e) => setDraft({ ...draft, countryName: e.target.value })} placeholder="Country name" />
        <input className="asinput" value={draft.primaryLanguage} onChange={(e) => setDraft({ ...draft, primaryLanguage: e.target.value })} placeholder="Primary language" />
        <input className="asinput" value={draft.fallbackLanguage} onChange={(e) => setDraft({ ...draft, fallbackLanguage: e.target.value })} placeholder="Fallback language" />
        <input className="asinput" value={draft.currencyCode} onChange={(e) => setDraft({ ...draft, currencyCode: e.target.value.toUpperCase() })} placeholder="Currency code" />
        <input className="asinput" value={draft.currencySymbol} onChange={(e) => setDraft({ ...draft, currencySymbol: e.target.value })} placeholder="Symbol" />
        <input className="asinput full" value={draft.paymentMethods.join(", ")} onChange={(e) => setDraft({ ...draft, paymentMethods: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="Payment methods, comma separated" />
      </div>
      <button className="asbtn" disabled={disabled} onClick={addRule}>Add / Update Rule</button>
      <div className="aslist">
        {value.map((rule) => (
          <div key={rule.countryCode} className="aslist-row">
            <strong>{rule.countryCode}</strong>
            <span>{rule.primaryLanguage} · {rule.currencyCode}</span>
            <button className="asbtn ghost" disabled={disabled} onClick={() => onChange(value.filter((item) => item.countryCode !== rule.countryCode))}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
