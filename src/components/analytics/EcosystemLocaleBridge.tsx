import { useEffect } from "react";
import { API_BASE } from "../../lib/api";
import { detectBrowserCountry, getLandingDirection, resolveLandingLocale } from "../../lib/landingLocalization";

type PublicEcosystemSettings = {
  language?: string;
  adaptiveLanguage?: boolean;
  countryLanguageMapping?: Array<{ country: string; language: string }>;
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
