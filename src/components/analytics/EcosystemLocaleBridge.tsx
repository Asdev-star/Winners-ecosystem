import { useEffect } from "react";
import { API_BASE } from "../../lib/api";
import { detectBrowserCountry, getLandingDirection, resolveLandingLocale } from "../../lib/landingLocalization";
import { applyRuntimeTheme } from "../../features/theme/themeStore";

type PublicEcosystemSettings = {
  language?: string;
  adaptiveLanguage?: boolean;
  countryLanguageMapping?: Array<{ country: string; language: string }>;
  brandColor?: string;
  accentColor?: string;
  defaultTheme?: string;
  theme?: {
    brandColor?: string;
    accentColor?: string;
    defaultTheme?: "light" | "dark" | "auto";
    palette?: Partial<Record<"gold" | "blue" | "ice" | "green" | "red" | "purple" | "bg" | "surface" | "surface2" | "border" | "text" | "textDim", string>>;
    typography?: Partial<Record<"heading" | "display" | "mono" | "body", string>> & { scale?: number };
    card?: Partial<Record<"borderRadius" | "topBorderWidth", number>> & {
      topBorderStyle?: "gradient" | "solid" | "none";
      shadowIntensity?: "none" | "subtle" | "medium" | "strong";
    };
    density?: "compact" | "comfortable" | "spacious";
    animation?: { reducedMotion?: boolean; speed?: number };
    layerAccentOverrides?: Array<{ layerId: string; accentColor: string }>;
  };
};

export default function EcosystemLocaleBridge() {
  useEffect(() => {
    const controller = new AbortController();
    const country = detectBrowserCountry();

    async function applyLocale() {
      try {
        const response = await fetch(`${API_BASE}/public/ecosystem-settings?country=${encodeURIComponent(country)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          document.documentElement.lang = "en";
          document.documentElement.dir = "ltr";
          return;
        }

        const body = (await response.json().catch(() => ({}))) as {
          settings?: PublicEcosystemSettings;
          resolvedLanguage?: string;
          countryLanguageMapping?: Array<{ country: string; language: string }>;
        };

        const settings = body.settings ?? {};
        applyRuntimeTheme(settings.theme ?? {
          brandColor: settings.brandColor,
          accentColor: settings.accentColor,
          defaultTheme: (settings.defaultTheme as "light" | "dark" | "auto" | undefined) ?? "dark",
        });
        const language = settings.adaptiveLanguage === false
          ? (settings.language ?? "en")
          : body.resolvedLanguage ?? resolveLandingLocale(settings.language ?? "en", country, body.countryLanguageMapping ?? settings.countryLanguageMapping ?? []);

        document.documentElement.lang = language || "en";
        document.documentElement.dir = getLandingDirection(language || "en");
      } catch {
        if (!controller.signal.aborted) {
          document.documentElement.lang = "en";
          document.documentElement.dir = "ltr";
        }
      }
    }

    void applyLocale();
    return () => controller.abort();
  }, []);

  return null;
}
