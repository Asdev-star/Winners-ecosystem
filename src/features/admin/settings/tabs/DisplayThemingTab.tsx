import { useEffect, useMemo, useState, type CSSProperties } from "react";
import SettingSelect from "../components/SettingSelect";
import SettingSlider from "../components/SettingSlider";
import SettingToggle from "../components/SettingToggle";
import { THEME_DEFAULTS, type ThemeConfig } from "../settingsTypes";

type Props = {
  value: ThemeConfig;
  disabled?: boolean;
  onChange: (value: ThemeConfig) => void;
};

const PALETTE_FIELDS = [
  { key: "gold", label: "Gold", fallback: THEME_DEFAULTS["theme.color.gold"] },
  { key: "blue", label: "Blue", fallback: THEME_DEFAULTS["theme.color.blue"] },
  { key: "ice", label: "Ice", fallback: THEME_DEFAULTS["theme.color.ice"] },
  { key: "green", label: "Green", fallback: THEME_DEFAULTS["theme.color.green"] },
  { key: "red", label: "Red", fallback: THEME_DEFAULTS["theme.color.red"] },
  { key: "purple", label: "Purple", fallback: THEME_DEFAULTS["theme.color.purple"] },
  { key: "bg", label: "Background", fallback: THEME_DEFAULTS["theme.color.bg"] },
  { key: "surface", label: "Surface", fallback: THEME_DEFAULTS["theme.color.surface"] },
  { key: "surface2", label: "Surface 2", fallback: THEME_DEFAULTS["theme.color.surface2"] },
  { key: "border", label: "Border", fallback: THEME_DEFAULTS["theme.color.border"] },
  { key: "text", label: "Text", fallback: THEME_DEFAULTS["theme.color.text"] },
  { key: "textDim", label: "Text Dim", fallback: THEME_DEFAULTS["theme.color.textDim"] },
] as const;

const LAYER_FIELDS = [
  { layerId: "community", label: "Community", fallback: THEME_DEFAULTS["theme.layer.community.accent"] },
  { layerId: "academy", label: "Academy", fallback: THEME_DEFAULTS["theme.layer.academy.accent"] },
  { layerId: "market", label: "Market", fallback: THEME_DEFAULTS["theme.layer.market.accent"] },
  { layerId: "work", label: "Work", fallback: THEME_DEFAULTS["theme.layer.work.accent"] },
  { layerId: "intelligence", label: "Intelligence", fallback: THEME_DEFAULTS["theme.layer.intelligence.accent"] },
  { layerId: "cloud", label: "Cloud", fallback: THEME_DEFAULTS["theme.layer.cloud.accent"] },
] as const;

const FONT_OPTIONS = [
  { value: "Cormorant Garamond", label: "Cormorant Garamond" },
  { value: "Syne", label: "Syne" },
  { value: "Space Mono", label: "Space Mono" },
  { value: "Inter", label: "Inter" },
  { value: "Manrope", label: "Manrope" },
] as const;

const BORDER_RADIUS_OPTIONS = [
  { value: "4", label: "4px" },
  { value: "6", label: "6px" },
  { value: "8", label: "8px" },
  { value: "12", label: "12px" },
  { value: "16", label: "16px" },
] as const;

const TOP_BORDER_WIDTH_OPTIONS = [
  { value: "0", label: "None" },
  { value: "1", label: "1px" },
  { value: "2", label: "2px" },
  { value: "4", label: "4px" },
] as const;

const TOP_BORDER_STYLE_OPTIONS = [
  { value: "gradient", label: "Gradient" },
  { value: "solid", label: "Solid" },
  { value: "none", label: "None" },
] as const;

const SHADOW_OPTIONS = [
  { value: "none", label: "None" },
  { value: "subtle", label: "Subtle" },
  { value: "medium", label: "Medium" },
  { value: "strong", label: "Strong" },
] as const;

function hexToRgb(hex: string) {
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length !== 6) return null;
  const numeric = Number.parseInt(cleaned, 16);
  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  };
}

function contrastRatio(a: string, b: string) {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) return 0;

  const luminance = ({ r, g, b: blue }: { r: number; g: number; b: number }) => {
    const [rr, gg, bb] = [r, g, blue].map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
  };

  const lumA = luminance(rgbA);
  const lumB = luminance(rgbB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function DisplayThemingTab({ value, disabled, onChange }: Props) {
  const [previewMobile, setPreviewMobile] = useState(false);
  const [previewValue, setPreviewValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setPreviewValue(value), 200);
    return () => window.clearTimeout(timeout);
  }, [value]);

  const contrast = useMemo(() => contrastRatio(value.brandColor, value.palette.bg), [value.brandColor, value.palette.bg]);

  const update = (patch: Partial<ThemeConfig>) => onChange({ ...value, ...patch });

  const updatePalette = (key: keyof ThemeConfig["palette"], next: string) => {
    const palette = { ...value.palette, [key]: next };
    update({
      palette,
      brandColor: key === "gold" ? next : value.brandColor,
      accentColor: key === "ice" ? next : value.accentColor,
    });
  };

  const resetPalette = (key: keyof ThemeConfig["palette"]) => {
    const fallbackKey = `theme.color.${key}` as keyof typeof THEME_DEFAULTS;
    updatePalette(key, THEME_DEFAULTS[fallbackKey]);
  };

  const updateLayerAccent = (layerId: string, accentColor: string) => {
    const next = value.layerAccentOverrides.filter((layer) => layer.layerId !== layerId);
    onChange({
      ...value,
      layerAccentOverrides: [...next, { layerId, accentColor }],
    });
  };

  const getLayerAccent = (layerId: string, fallback: string) =>
    value.layerAccentOverrides.find((layer) => layer.layerId === layerId)?.accentColor ?? fallback;

  const previewStyle: CSSProperties = {
    background: previewValue.palette.bg,
    color: previewValue.palette.text,
    border: `1px solid ${previewValue.palette.border}`,
    borderRadius: 22,
    padding: previewMobile ? 14 : 18,
    width: "100%",
    maxWidth: previewMobile ? 375 : 1000,
    boxShadow:
      previewValue.card.shadowIntensity === "none"
        ? "none"
        : previewValue.card.shadowIntensity === "subtle"
          ? "0 10px 30px rgba(0,0,0,.12)"
          : previewValue.card.shadowIntensity === "medium"
            ? "0 18px 46px rgba(0,0,0,.22)"
            : "0 26px 64px rgba(0,0,0,.32)",
    fontFamily: previewValue.typography.body,
    fontSize: `${Math.round(15 * previewValue.typography.scale)}px`,
    lineHeight: 1.5,
    transition: "all 200ms ease",
  };

  const cardRadius = `${value.card.borderRadius}px`;
  const cardBorder = `1px solid ${value.palette.border}`;
  const cardShadow =
    value.card.shadowIntensity === "none"
      ? "none"
      : value.card.shadowIntensity === "subtle"
        ? "0 8px 22px rgba(0,0,0,.14)"
        : value.card.shadowIntensity === "medium"
          ? "0 18px 34px rgba(0,0,0,.22)"
          : "0 28px 54px rgba(0,0,0,.3)";
  const topBorder =
    value.card.topBorderStyle === "none" || value.card.topBorderWidth === 0
      ? "none"
      : value.card.topBorderStyle === "solid"
        ? `${value.card.topBorderWidth}px solid ${value.brandColor}`
        : `${value.card.topBorderWidth}px solid transparent`;

  return (
    <div className="tabgrid">
      <section className="tabcard">
        <div className="tabtitle">Colour Palette</div>
        <div className="aslist">
          {PALETTE_FIELDS.map((entry) => {
            const current = value.palette[entry.key];
            return (
              <div key={entry.key} className="aslist-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <strong>{entry.label}</strong>
                  <span style={{ fontFamily: "Space Mono, monospace", fontSize: 11 }}>{current}</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="color" value={current} disabled={disabled} onChange={(e) => updatePalette(entry.key, e.target.value)} />
                  <input
                    className="asinput"
                    value={current}
                    disabled={disabled}
                    onChange={(e) => updatePalette(entry.key, e.target.value)}
                  />
                  <button className="asbtn ghost" type="button" disabled={disabled} onClick={() => resetPalette(entry.key)}>
                    Reset
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-dim)" }}>
          FORGE recommends keeping gold contrast above 4.5:1. Current contrast: {contrast.toFixed(1)}:1
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Typography</div>
        <div className="tabrow">
          <SettingSelect
            label="Heading Font"
            value={value.typography.heading}
            disabled={disabled}
            options={FONT_OPTIONS.map((font) => ({ value: font.value, label: font.label }))}
            onChange={(heading) => update({ typography: { ...value.typography, heading } })}
          />
          <SettingSelect
            label="Display Font"
            value={value.typography.display}
            disabled={disabled}
            options={FONT_OPTIONS.map((font) => ({ value: font.value, label: font.label }))}
            onChange={(display) => update({ typography: { ...value.typography, display } })}
          />
        </div>
        <div className="tabrow">
          <SettingSelect
            label="Mono Font"
            value={value.typography.mono}
            disabled={disabled}
            options={FONT_OPTIONS.map((font) => ({ value: font.value, label: font.label }))}
            onChange={(mono) => update({ typography: { ...value.typography, mono } })}
          />
          <SettingSelect
            label="Body Font"
            value={value.typography.body}
            disabled={disabled}
            options={FONT_OPTIONS.map((font) => ({ value: font.value, label: font.label }))}
            onChange={(body) => update({ typography: { ...value.typography, body } })}
          />
        </div>
        <SettingSlider
          label="Font Scale"
          description="Applies a global scale multiplier to the ecosystem."
          min={0.9}
          max={1.3}
          step={0.1}
          value={value.typography.scale}
          disabled={disabled}
          onChange={(scale) => update({ typography: { ...value.typography, scale: Number(scale.toFixed(1)) } })}
        />
        <div className="aslist-row" style={{ marginTop: 14, gap: 16, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: value.typography.heading, fontSize: 20, fontWeight: 700 }}>Winners Ecosystem</div>
            <div style={{ fontFamily: value.typography.body, color: "var(--text-dim)" }}>Typography preview for the admin shell.</div>
          </div>
          <code style={{ fontFamily: value.typography.mono, fontSize: 12, color: value.palette.ice }}>space-mono://forge</code>
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Card Style</div>
        <div className="tabrow">
          <SettingSelect
            label="Border Radius"
            value={String(value.card.borderRadius)}
            disabled={disabled}
            options={BORDER_RADIUS_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(borderRadius) =>
              update({ card: { ...value.card, borderRadius: Number(borderRadius) } })
            }
          />
          <SettingSelect
            label="Top Border Style"
            value={value.card.topBorderStyle}
            disabled={disabled}
            options={TOP_BORDER_STYLE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(topBorderStyle) =>
              update({ card: { ...value.card, topBorderStyle: topBorderStyle as ThemeConfig["card"]["topBorderStyle"] } })
            }
          />
        </div>
        <div className="tabrow">
          <SettingSelect
            label="Top Border Width"
            value={String(value.card.topBorderWidth)}
            disabled={disabled}
            options={TOP_BORDER_WIDTH_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(topBorderWidth) =>
              update({ card: { ...value.card, topBorderWidth: Number(topBorderWidth) } })
            }
          />
          <SettingSelect
            label="Shadow Intensity"
            value={value.card.shadowIntensity}
            disabled={disabled}
            options={SHADOW_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(shadowIntensity) =>
              update({ card: { ...value.card, shadowIntensity: shadowIntensity as ThemeConfig["card"]["shadowIntensity"] } })
            }
          />
        </div>
        <SettingToggle
          label="Reduced Motion"
          description="Lowers animation intensity across the ecosystem."
          note="FORGE will keep transitions lightweight for accessibility."
          checked={value.animation.reducedMotion}
          disabled={disabled}
          onChange={(reducedMotion) => update({ animation: { ...value.animation, reducedMotion } })}
        />
        <SettingSlider
          label="Animation Speed"
          description="Multiplier where 1.0 is the default pace."
          min={0.5}
          max={2}
          step={0.1}
          value={value.animation.speed}
          disabled={disabled}
          onChange={(speed) => update({ animation: { ...value.animation, speed: Number(speed.toFixed(1)) } })}
        />
        <SettingSelect
          label="Density"
          value={value.density}
          disabled={disabled}
          options={[
            { value: "compact", label: "Compact" },
            { value: "comfortable", label: "Comfortable" },
            { value: "spacious", label: "Spacious" },
          ]}
          onChange={(density) => update({ density: density as ThemeConfig["density"] })}
        />
      </section>

      <section className="tabcard">
        <div className="tabtitle">Layer Accent Overrides</div>
        <div className="aslist">
          {LAYER_FIELDS.map((layer) => {
            const accentColor = getLayerAccent(layer.layerId, layer.fallback);
            return (
              <div key={layer.layerId} className="aslist-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <strong>{layer.label}</strong>
                  <span style={{ fontFamily: "Space Mono, monospace", fontSize: 11 }}>{accentColor}</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="color" value={accentColor} disabled={disabled} onChange={(e) => updateLayerAccent(layer.layerId, e.target.value)} />
                  <button className="asbtn ghost" type="button" disabled={disabled} onClick={() => updateLayerAccent(layer.layerId, layer.fallback)}>
                    Reset
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Live Preview</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 0 }}>
          <div className="asbadge">200ms debounce preview</div>
          <SettingToggle
            label="Preview on mobile"
            checked={previewMobile}
            disabled={disabled}
            onChange={setPreviewMobile}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={previewStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontFamily: previewValue.typography.display, fontSize: 24, fontWeight: 700 }}>
                  Winners
                </div>
                <div style={{ color: previewValue.palette.textDim }}>Dashboard preview with current theme tokens.</div>
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: previewValue.palette.surface2,
                  border: `1px solid ${previewValue.palette.border}`,
                  color: previewValue.palette.textDim,
                  fontFamily: previewValue.typography.mono,
                  fontSize: 11,
                }}
              >
                theme://{previewValue.defaultTheme}
              </div>
            </div>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: previewMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
              <article
                style={{
                  background: previewValue.palette.surface,
                  border: cardBorder,
                  borderTop: topBorder,
                  borderRadius: cardRadius,
                  boxShadow: cardShadow,
                  padding: 16,
                }}
              >
                <div style={{ color: previewValue.brandColor, fontFamily: previewValue.typography.mono, fontSize: 11, letterSpacing: ".12em" }}>
                  FORGE INSIGHT
                </div>
                <h3 style={{ margin: "10px 0 8px", fontFamily: previewValue.typography.heading }}>The ecosystem is live.</h3>
                <p style={{ margin: 0, color: previewValue.palette.textDim }}>
                  Palette, typography, and card treatment now render from the admin theme configuration.
                </p>
              </article>
              <article
                style={{
                  background: previewValue.palette.surface2,
                  border: cardBorder,
                  borderTop: topBorder,
                  borderRadius: cardRadius,
                  boxShadow: cardShadow,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "6px 10px", borderRadius: 999, background: previewValue.palette.bg, color: previewValue.accentColor }}>
                    Accent
                  </span>
                  <span style={{ padding: "6px 10px", borderRadius: 999, background: previewValue.palette.bg, color: previewValue.palette.green }}>
                    Green
                  </span>
                  <span style={{ padding: "6px 10px", borderRadius: 999, background: previewValue.palette.bg, color: previewValue.palette.purple }}>
                    Purple
                  </span>
                </div>
                <div style={{ marginTop: 14, color: previewValue.palette.textDim }}>
                  Default theme: <strong style={{ color: previewValue.palette.text }}>{previewValue.defaultTheme}</strong>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
