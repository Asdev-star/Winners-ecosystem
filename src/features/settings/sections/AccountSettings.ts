import { ACCOUNT_SETTINGS as BASE_ACCOUNT_SETTINGS } from "./PlatformBehaviorSettings";
import SECURITY_SETTINGS from "./SecuritySettings";
import BILLING_SETTINGS from "./BillingSettings";
import ACCESSIBILITY_SETTINGS from "./AccessibilitySettings";

export const ACCOUNT_SETTINGS = {
  displayName: BASE_ACCOUNT_SETTINGS.displayName,
  bio: BASE_ACCOUNT_SETTINGS.bio,
  location: BASE_ACCOUNT_SETTINGS.location,
  website: BASE_ACCOUNT_SETTINGS.website,
  timezone: BASE_ACCOUNT_SETTINGS.timezone,
  currency: BASE_ACCOUNT_SETTINGS.currency,
  ...SECURITY_SETTINGS,
  ...BILLING_SETTINGS,
  globalPushNotifications: BASE_ACCOUNT_SETTINGS.globalPushNotifications,
  emailDigest: BASE_ACCOUNT_SETTINGS.emailDigest,
  omegaBriefings: BASE_ACCOUNT_SETTINGS.omegaBriefings,
  ...ACCESSIBILITY_SETTINGS,
  theme: BASE_ACCOUNT_SETTINGS.theme,
  exportData: BASE_ACCOUNT_SETTINGS.exportData,
  deleteAccount: BASE_ACCOUNT_SETTINGS.deleteAccount,
};

export const ACCOUNT_SECTIONS = [
  { id: "profile", label: "Account", title: "Profile", keys: ["displayName", "bio", "location", "website", "timezone", "currency"] },
  { id: "security", label: "Security", title: "Security", keys: ["changePassword", "enable2FA", "activeSessions", "connectedAccounts"] },
  { id: "billing", label: "Billing", title: "Billing", keys: ["currentPlan", "manageBilling", "viewInvoices", "cancelSubscription"] },
  { id: "notifications", label: "Notifications", title: "Notifications", keys: ["globalPushNotifications", "emailDigest", "omegaBriefings"] },
  { id: "accessibility", label: "Accessibility", title: "Accessibility", keys: ["textSize", "reduceMotion", "highContrast", "screenReader"] },
  { id: "theme", label: "Theme", title: "Theme", keys: ["theme"] },
  { id: "data", label: "Data", title: "Data", keys: ["exportData", "deleteAccount"] },
];

export const ACCOUNT_BRANCH = {
  key: "account",
  icon: "⬡",
  navLabel: "Account",
  path: "/settings/account",
  title: "Account Settings",
  kicker: "Default branch",
  description: "Profile, security, billing, notifications, accessibility, theme, and privacy controls.",
  settings: ACCOUNT_SETTINGS,
  sections: ACCOUNT_SECTIONS,
};

export default ACCOUNT_SETTINGS;
