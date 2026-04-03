import { getCountryRules } from "./ecosystemConfigService.js";
import { resolveLanguageRoute } from "./languageService.js";

export type GeoContext = {
  ipAddress: string;
  countryCode: string;
  countryName: string;
  language: string;
  fallbackLanguage: string;
  currencyCode: string;
  currencySymbol: string;
  paymentMethods: string[];
  timezone: string;
  rtl: boolean;
};

function inferCountryFromIp(ipAddress: string) {
  if (ipAddress === "127.0.0.1" || ipAddress === "::1") return "KE";
  if (ipAddress.startsWith("102.")) return "NG";
  if (ipAddress.startsWith("41.")) return "KE";
  return "US";
}

export async function detectGeoContext(ipAddress: string): Promise<GeoContext> {
  const countryCode = inferCountryFromIp(ipAddress);
  const route = await resolveLanguageRoute(countryCode);
  const countryRule = (await getCountryRules()).find((item) => item.countryCode === countryCode);
  const config = countryRule?.config && typeof countryRule.config === "object" ? countryRule.config as Record<string, unknown> : {};

  return {
    ipAddress,
    countryCode,
    countryName: typeof config.countryName === "string" ? config.countryName : route.countryName,
    language: typeof config.primaryLanguage === "string" ? config.primaryLanguage : route.language,
    fallbackLanguage: typeof config.fallbackLanguage === "string" ? config.fallbackLanguage : route.fallbackLanguage,
    currencyCode: typeof config.currencyCode === "string" ? config.currencyCode : route.currencyCode,
    currencySymbol: typeof config.currencySymbol === "string" ? config.currencySymbol : route.currencySymbol,
    paymentMethods: Array.isArray(config.paymentMethods) ? config.paymentMethods.filter((item): item is string => typeof item === "string") : route.paymentMethods,
    timezone: countryCode === "KE" ? "Africa/Nairobi" : countryCode === "NG" ? "Africa/Lagos" : "UTC",
    rtl: route.rtl,
  };
}
