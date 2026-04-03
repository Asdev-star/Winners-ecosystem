import db from "../db.js";
import {
  getLanguageRoutes as readLanguageRoutes,
  upsertLanguageRoute as writeLanguageRoute,
} from "./ecosystemConfigService.js";

export const SUPPORTED_LANGUAGES = {
  en: { name: "English", nativeName: "English", rtl: false, coverage: 100 },
  sw: { name: "Swahili", nativeName: "Kiswahili", rtl: false, coverage: 85 },
  fr: { name: "French", nativeName: "Français", rtl: false, coverage: 80 },
  ha: { name: "Hausa", nativeName: "Hausa", rtl: false, coverage: 60 },
  yo: { name: "Yoruba", nativeName: "Yorùbá", rtl: false, coverage: 55 },
  zu: { name: "Zulu", nativeName: "isiZulu", rtl: false, coverage: 50 },
  am: { name: "Amharic", nativeName: "አማርኛ", rtl: false, coverage: 45 },
  ar: { name: "Arabic", nativeName: "العربية", rtl: true, coverage: 70 },
  pt: { name: "Portuguese", nativeName: "Português", rtl: false, coverage: 65 },
  pcm: { name: "Nigerian Pidgin", nativeName: "Naijá", rtl: false, coverage: 40 },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export type LanguageRouteInput = {
  countryCode: string;
  countryName: string;
  primaryLanguage: LanguageCode | string;
  fallbackLanguage: LanguageCode | string;
  supervisorLocale?: string | null;
  paymentMethods: string[];
  currencyCode: string;
  currencySymbol: string;
  dateFormat?: string;
  timeFormat?: string;
  isActive?: boolean;
};

export type TranslationOverride = {
  id: string;
  key: string;
  languageCode: LanguageCode;
  value: string;
  context: string | null;
  updatedBy: string | null;
};

export const COUNTRY_LANGUAGE_DEFAULTS: Record<
  string,
  {
    language: LanguageCode;
    fallback: LanguageCode;
    currency: string;
    symbol: string;
    payments: string[];
  }
> = {
  KE: { language: "sw", fallback: "en", currency: "KES", symbol: "KSh", payments: ["mpesa", "flutterwave"] },
  TZ: { language: "sw", fallback: "en", currency: "TZS", symbol: "TSh", payments: ["mpesa", "flutterwave"] },
  UG: { language: "sw", fallback: "en", currency: "UGX", symbol: "USh", payments: ["mtn_momo", "flutterwave"] },
  NG: { language: "en", fallback: "en", currency: "NGN", symbol: "₦", payments: ["flutterwave", "paystack"] },
  GH: { language: "en", fallback: "en", currency: "GHS", symbol: "GH₵", payments: ["mtn_momo", "paystack"] },
  ZA: { language: "en", fallback: "en", currency: "ZAR", symbol: "R", payments: ["stripe", "flutterwave"] },
  SN: { language: "fr", fallback: "en", currency: "XOF", symbol: "CFA", payments: ["wave", "flutterwave"] },
  CI: { language: "fr", fallback: "en", currency: "XOF", symbol: "CFA", payments: ["wave", "mtn_momo"] },
  CM: { language: "fr", fallback: "en", currency: "XAF", symbol: "CFA", payments: ["mtn_momo", "flutterwave"] },
  ET: { language: "am", fallback: "en", currency: "ETB", symbol: "Br", payments: ["telebirr", "flutterwave"] },
  EG: { language: "ar", fallback: "en", currency: "EGP", symbol: "£", payments: ["fawry", "stripe"] },
  GB: { language: "en", fallback: "en", currency: "GBP", symbol: "£", payments: ["stripe", "wise"] },
  US: { language: "en", fallback: "en", currency: "USD", symbol: "$", payments: ["stripe"] },
  CA: { language: "en", fallback: "en", currency: "CAD", symbol: "CA$", payments: ["stripe"] },
};

export const SUPERVISOR_LOCALE_KEYS = {
  "omega.greeting.morning.sw": "Habari za asubuhi, [name]. Hivi ndivyo mfumo wako unavyoenda...",
  "omega.greeting.morning.fr": "Bonjour, [name]. Voici ce qui se passe dans votre écosystème...",
  "omega.greeting.morning.ha": "Ina gaisuwa, [name]. Ga abin da ke faruwa a cikin tsarinka...",
  "omega.greeting.morning.yo": "E káàárọ̀, [name]. Èyí ni ohun tí ń ṣẹlẹ̀ nínú eto rẹ...",
  "sage.encouragement.sw": "Umefanya vizuri sana. Endelea kufanya kazi nzuri.",
  "sage.encouragement.fr": "Excellent travail. Continuez comme ça.",
  "atlas.product.idea.sw": "ATLAS imeona fursa nzuri ya biashara katika soko lako.",
  "atlas.product.idea.fr": "ATLAS a identifié une bonne opportunité commerciale sur votre marché.",
  "circuit.job.match.sw": "CIRCUIT imepata kazi inayolingana na ujuzi wako wa [skill].",
  "circuit.job.match.fr": "CIRCUIT a trouvé un contrat correspondant à vos compétences en [skill].",
  "nova.skill.detected.sw": "NOVA imeona ujuzi wa [skill] katika chapisho lako.",
  "nova.skill.detected.fr": "NOVA a détecté des compétences en [skill] dans votre publication.",
} as const;

function normalizeLanguage(value: string | null | undefined, fallback: LanguageCode = "en"): LanguageCode {
  const candidate = (value ?? fallback).toLowerCase();
  return (candidate in SUPPORTED_LANGUAGES ? candidate : fallback) as LanguageCode;
}

export async function getLanguageRoutes() {
  return readLanguageRoutes();
}

export async function getTranslationOverrides(): Promise<TranslationOverride[]> {
  const records = await db.$queryRaw<Array<{
    id: string;
    key: string;
    languageCode: string;
    value: string;
    context: string | null;
    updatedBy: string | null;
  }>>`
    SELECT
      "id",
      "key",
      "languageCode",
      "value",
      "context",
      "updatedBy"
    FROM "translation_overrides"
    ORDER BY "updatedAt" DESC
  `;
  return records.map((record) => ({
    id: record.id,
    key: record.key,
    languageCode: record.languageCode as LanguageCode,
    value: record.value,
    context: record.context ?? null,
    updatedBy: record.updatedBy ?? null,
  }));
}

export async function resolveLanguageRoute(countryCode: string) {
  const normalized = countryCode.toUpperCase();
  const route = (await readLanguageRoutes()).find((entry) => entry.countryCode === normalized);
  const defaults = COUNTRY_LANGUAGE_DEFAULTS[normalized] ?? COUNTRY_LANGUAGE_DEFAULTS.US;

  const primaryLanguage = normalizeLanguage(route?.primaryLanguage ?? defaults.language);
  const fallbackLanguage = normalizeLanguage(route?.fallbackLanguage ?? defaults.fallback);
  const language = primaryLanguage;
  const rtl = SUPPORTED_LANGUAGES[language].rtl;

  return {
    countryCode: normalized,
    countryName: route?.countryName ?? normalized,
    language,
    fallbackLanguage,
    currencyCode: route?.currencyCode ?? defaults.currency,
    currencySymbol: route?.currencySymbol ?? defaults.symbol,
    paymentMethods: route?.paymentMethods ?? defaults.payments,
    supervisorLocale: route?.supervisorLocale ?? language,
    rtl,
  };
}

export async function upsertLanguageRoute(input: LanguageRouteInput, userId: string) {
  return writeLanguageRoute(input, userId);
}

export async function upsertTranslationOverrides(
  overrides: Array<{
    key: string;
    languageCode: LanguageCode;
    value: string;
    context?: string | null;
  }>,
  userId: string,
) {
  const saved = await Promise.all(overrides.map(async (override) => {
    const [record] = await db.$queryRaw<Array<{
      id: string;
      key: string;
      languageCode: string;
      value: string;
      context: string | null;
      updatedBy: string | null;
    }>>`
      INSERT INTO "translation_overrides" (
        "key",
        "languageCode",
        "value",
        "context",
        "updatedBy",
        "updatedAt"
      )
      VALUES (
        ${override.key},
        ${override.languageCode},
        ${override.value},
        ${override.context ?? null},
        ${userId},
        NOW()
      )
      ON CONFLICT ("key", "languageCode")
      DO UPDATE SET
        "value" = EXCLUDED."value",
        "context" = EXCLUDED."context",
        "updatedBy" = EXCLUDED."updatedBy",
        "updatedAt" = NOW()
      RETURNING
        "id",
        "key",
        "languageCode",
        "value",
        "context",
        "updatedBy"
    `;

    return record;
  }));

  return saved.map((record) => ({
    id: record.id,
    key: record.key,
    languageCode: record.languageCode as LanguageCode,
    value: record.value,
    context: record.context ?? null,
    updatedBy: record.updatedBy ?? null,
  }));
}
