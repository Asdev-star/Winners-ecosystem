// src/components/ui/subnav.ts
// Pre-built navigation configs for all platform layers
// Import these in your page components

export interface SubNavItem {
  id: string;
  label: string;
  href: string;
  badge?: number;
  badgeType?: "normal" | "alert" | "streak" | "new";
  shortcut?: string;
}

export interface SmartAction {
  label: string;
  supervisor: "nova" | "sage" | "atlas" | "circuit" | "omega" | "forge";
  href: string;
  urgency?: "normal" | "hot" | "streak";
}

export const COMMUNITY_SUBNAV: SubNavItem[] = [
  { id: "feed",      label: "Feed",       href: "/community",           shortcut: "f" },
  { id: "groups",    label: "Groups",     href: "/community/groups",    shortcut: "g" },
  { id: "discover",  label: "Discover",   href: "/community/discover" },
  { id: "messages",  label: "Messages",   href: "/community/messages",  badge: 0 },
  { id: "saved",     label: "Saved",      href: "/community/saved" },
  { id: "create",    label: "Create",     href: "/community/create" },
  { id: "analytics", label: "Analytics",   href: "/community/analytics" },
];

export const ACADEMY_SUBNAV: SubNavItem[] = [
  { id: "explore",      label: "Explore",      href: "/academy" },
  { id: "my-learning",  label: "My Learning",  href: "/academy/my-learning", badge: 0 },
  { id: "certificates", label: "Certificates", href: "/academy/certificates" },
  { id: "paths",        label: "Paths",        href: "/academy/paths",       badgeType: "new" },
  { id: "teach",        label: "Teach",        href: "/academy/instructor" },
  { id: "cohorts",      label: "Cohorts",      href: "/academy/cohorts" },
];

export const MARKET_SUBNAV_BUYER: SubNavItem[] = [
  { id: "shop",     label: "Shop",      href: "/market" },
  { id: "trending", label: "Trending",  href: "/market/trending" },
  { id: "stream",   label: "Stream",    href: "/market/stream" },
  { id: "events",   label: "Events",    href: "/market/events" },
  { id: "services", label: "Services",  href: "/market/services" },
  { id: "career",   label: "CV Tools",  href: "/market/career" },
  { id: "business", label: "Biz Tools", href: "/market/business" },
  { id: "trading",  label: "Trading",   href: "/market/trading" },
];

export const MARKET_SUBNAV_SELLER: SubNavItem[] = [
  { id: "store",        label: "My Store",     href: "/market/store" },
  { id: "products",     label: "Products",     href: "/market/products" },
  { id: "orders",       label: "Orders",       href: "/market/orders",       badge: 0 },
  { id: "analytics",    label: "Analytics",    href: "/market/analytics" },
  { id: "dropshipping", label: "Dropshipping", href: "/market/dropshipping", badgeType: "new" },
  { id: "tools",        label: "Tools",        href: "/market/tools" },
];

export const WORK_SUBNAV_FREELANCER: SubNavItem[] = [
  { id: "find",      label: "Find Work",    href: "/work",               shortcut: "j" },
  { id: "applied",   label: "Applications", href: "/work/applications",  badge: 0 },
  { id: "contracts", label: "Contracts",    href: "/work/contracts",     badge: 0 },
  { id: "profile",   label: "Profile",      href: "/work/profile" },
  { id: "portfolio", label: "Portfolio",    href: "/work/portfolio" },
  { id: "earnings",  label: "Earnings",     href: "/work/earnings" },
];

export const WORK_SUBNAV_EMPLOYER: SubNavItem[] = [
  { id: "post",       label: "Post a Job",    href: "/work/post" },
  { id: "listings",   label: "My Listings",   href: "/work/listings",   badge: 0 },
  { id: "applicants", label: "Applicants",    href: "/work/applicants", badge: 0 },
  { id: "contracts",  label: "Contracts",     href: "/work/contracts" },
  { id: "payments",   label: "Payments",      href: "/work/payments" },
  { id: "talent",     label: "Talent Search", href: "/work/talent" },
];

export const INTELLIGENCE_SUBNAV: SubNavItem[] = [
  { id: "overview",  label: "Overview",     href: "/intelligence" },
  { id: "aria",      label: "Aria Chat",    href: "/intelligence/aria" },
  { id: "agents",    label: "Agents",       href: "/intelligence/agents" },
  { id: "loop",      label: "Loop Tracker", href: "/intelligence/loop",    badgeType: "new" },
  { id: "skills",    label: "Skills Graph", href: "/intelligence/skills" },
  { id: "reports",   label: "Reports",      href: "/intelligence/reports", badge: 0 },
  { id: "api",       label: "API",          href: "/intelligence/api" },
];

export const CORE_SUBNAV: SubNavItem[] = [
  { id: "home",         label: "User Home",    href: "/home" },
  { id: "team",         label: "Team",         href: "/team",                    badge: 0 },
  { id: "billing",      label: "Billing",      href: "/billing" },
  { id: "analytics",    label: "Analytics",    href: "/analytics" },
  { id: "integrations", label: "Integrations", href: "/settings/integrations" },
  { id: "security",     label: "Security",     href: "/settings/security" },
];
