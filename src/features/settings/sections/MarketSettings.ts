import { MARKET_SETTINGS } from "./PlatformBehaviorSettings";

export const MARKET_SECTIONS = [
  { id: "atlas", label: "ATLAS", title: "ATLAS", keys: ["atlasProductSuggestions", "atlasPricingAlerts"] },
  { id: "vendor", label: "Vendor", title: "Vendor", keys: ["vendorPublicProfile", "showSalesCount", "autoFulfillDigital"] },
  { id: "payments", label: "Payments", title: "Payments", keys: ["preferredPayoutMethod", "payoutSchedule"] },
  { id: "notifications", label: "Notifications", title: "Notifications", keys: ["notifyNewOrder", "notifyLowInventory", "notifyPriceAlert", "notifyReview"] },
];

export const MARKET_BRANCH = {
  key: "market",
  icon: "🛒",
  navLabel: "Market",
  path: "/settings/market",
  title: "Market Settings",
  kicker: "Commerce layer",
  description: "Vendor preferences, ATLAS AI behavior, order notifications, payment methods, and storefront preferences.",
  settings: MARKET_SETTINGS,
  sections: MARKET_SECTIONS,
};

export default MARKET_SETTINGS;
