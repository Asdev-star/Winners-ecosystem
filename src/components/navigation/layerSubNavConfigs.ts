export type BadgeTone = "neutral" | "info" | "positive" | "attention";

export type LayerSubNavItem = {
  id: string;
  label: string;
  to?: string;
  aliases?: string[];
  badge?: string;
  badgeTone?: BadgeTone;
  disabled?: boolean;
  children?: LayerSubNavItem[];
};

export type LayerSmartAction = {
  supervisor: "NOVA" | "SAGE" | "ATLAS" | "CIRCUIT" | "OMEGA";
  title: string;
  hint: string;
  to?: string;
  intent?: "open-command-palette";
};

export type LayerSubNavConfig = {
  key: string;
  layer: "community" | "academy" | "market" | "work" | "intelligence" | "core";
  accent: string;
  items: LayerSubNavItem[];
  smartAction: (pathname: string) => LayerSmartAction;
};

export const COMMUNITY_SUBNAV: LayerSubNavConfig = {
  key: "community",
  layer: "community",
  accent: "var(--ice)",
  items: [
    { id: "community-feed", label: "Feed", to: "/community" },
    { id: "community-groups", label: "Groups", to: "/community/groups" },
    { id: "community-spaces", label: "Live Spaces", to: "/community/spaces", badge: "Live", badgeTone: "positive" },
    { 
      id: "community-studio", 
      label: "🎙️ Studio", 
      to: "/community/studio", 
      badge: "NEW", 
      badgeTone: "positive",
      children: [
        { id: "studio-home", label: "Home", to: "/community/studio" },
        { id: "studio-rooms", label: "Video Rooms", to: "/community/studio?tab=rooms" },
        { id: "studio-streams", label: "Broadcasts", to: "/community/studio?tab=streams" },
        { id: "studio-events", label: "Events", to: "/community/studio?tab=events" },
      ]
    },
    { id: "community-directory", label: "Directory", to: "/community/directory" },
    { id: "community-opportunities", label: "Opportunities", to: "/community/opportunities", badge: "AI", badgeTone: "info" },
    { id: "community-social-ai", label: "Social AI 🤖", to: "/community/social-intelligence" },
    { id: "community-connect-apps", label: "Connect Apps 🔗", to: "/community/social-accounts" },
    {
      id: "community-creator",
      label: "Creator Hub",
      to: "/community/creator",
      children: [
        { id: "community-creator-overview", label: "Overview", to: "/community/creator" },
        { id: "community-creator-analytics", label: "Analytics", to: "/community/analytics" },
      ],
    },
    { id: "community-messages", label: "Messages", to: "/messages", aliases: ["/messages"] },
  ],
  smartAction: (pathname) => {
    if (pathname.startsWith("/messages")) {
      return {
        supervisor: "NOVA",
        title: "Summarize unread threads",
        hint: "Generate a concise digest before you reply.",
        intent: "open-command-palette",
      };
    }
    if (pathname.startsWith("/community/groups")) {
      return {
        supervisor: "NOVA",
        title: "Create high-signal group prompt",
        hint: "Draft a prompt tuned to current group activity.",
        intent: "open-command-palette",
      };
    }
    return {
      supervisor: "NOVA",
      title: "Draft high-conversion post",
      hint: "Use recent engagement data to shape the post.",
      intent: "open-command-palette",
    };
  },
};

export const ACADEMY_SUBNAV: LayerSubNavConfig = {
  key: "academy",
  layer: "academy",
  accent: "var(--gold)",
  items: [
    { id: "academy-browse", label: "Browse", to: "/academy" },
    { id: "academy-paths", label: "Learning Paths", to: "/academy/paths" },
    { id: "academy-explore", label: "Explore Global", to: "/academy/explore" },
    { id: "academy-study-groups", label: "Study Groups", to: "/academy/study-groups", aliases: ["/academy/cohorts"] },
    { id: "academy-learning", label: "My Learning", to: "/academy/my-learning" },
    {
      id: "academy-instructor",
      label: "Instructor",
      to: "/academy/instructor",
      children: [
        { id: "academy-instructor-home", label: "Dashboard", to: "/academy/instructor" },
        { id: "academy-instructor-create", label: "Create Course", to: "/academy/instructor/create" },
      ],
    },
  ],
  smartAction: (pathname) => {
    if (pathname.startsWith("/academy/instructor")) {
      return {
        supervisor: "SAGE",
        title: "Outline your next lesson",
        hint: "Auto-generate module structure from your syllabus.",
        intent: "open-command-palette",
      };
    }
    if (pathname.startsWith("/academy/explore")) {
      return {
        supervisor: "SAGE",
        title: "Find your next course",
        hint: "Get personalized recommendations based on your goals.",
        intent: "open-command-palette",
      };
    }
    return {
      supervisor: "SAGE",
      title: "Build your 7-day study loop",
      hint: "Personalized learning sprint based on active courses.",
      intent: "open-command-palette",
    };
  },
};

export const MARKET_SUBNAV_BUYER: LayerSubNavConfig = {
  key: "market-buyer",
  layer: "market",
  accent: "var(--purple)",
  items: [
    { id: "market-browse", label: "Browse", to: "/market", disabled: true, badge: "Soon", badgeTone: "neutral" },
    { id: "market-cart", label: "Cart", to: "/market/cart", disabled: true },
    { id: "market-orders", label: "Orders", to: "/market/orders", disabled: true },
  ],
  smartAction: () => ({
    supervisor: "ATLAS",
    title: "Find best-value product path",
    hint: "Match products to your goals and budget profile.",
    intent: "open-command-palette",
  }),
};

export const MARKET_SUBNAV_SELLER: LayerSubNavConfig = {
  key: "market-seller",
  layer: "market",
  accent: "var(--purple)",
  items: [
    { id: "market-seller-listings", label: "Listings", to: "/market/seller/listings", disabled: true, badge: "Soon", badgeTone: "neutral" },
    { id: "market-seller-orders", label: "Orders", to: "/market/seller/orders", disabled: true },
    { id: "market-seller-analytics", label: "Analytics", to: "/market/seller/analytics", disabled: true },
  ],
  smartAction: () => ({
    supervisor: "ATLAS",
    title: "Predict top converting listing",
    hint: "Estimate conversion impact before publishing.",
    intent: "open-command-palette",
  }),
};

export const WORK_SUBNAV_FREELANCER: LayerSubNavConfig = {
  key: "work-freelancer",
  layer: "work",
  accent: "var(--blue)",
  items: [
    { id: "work-jobs", label: "Jobs", to: "/work/jobs", disabled: true, badge: "Planned", badgeTone: "neutral" },
    { id: "work-proposals", label: "Proposals", to: "/work/proposals", disabled: true },
    { id: "work-contracts", label: "Contracts", to: "/work/contracts", disabled: true },
  ],
  smartAction: () => ({
    supervisor: "CIRCUIT",
    title: "Generate winning proposal",
    hint: "Tailor proposal framing to employer intent signals.",
    intent: "open-command-palette",
  }),
};

export const WORK_SUBNAV_EMPLOYER: LayerSubNavConfig = {
  key: "work-employer",
  layer: "work",
  accent: "var(--blue)",
  items: [
    { id: "work-hire", label: "Hire", to: "/work/employer", disabled: true, badge: "Planned", badgeTone: "neutral" },
    { id: "work-employer-contracts", label: "Contracts", to: "/work/employer/contracts", disabled: true },
    { id: "work-employer-review", label: "Reviews", to: "/work/employer/reviews", disabled: true },
  ],
  smartAction: () => ({
    supervisor: "CIRCUIT",
    title: "Rank candidate fit",
    hint: "Score candidates by delivery risk and skill match.",
    intent: "open-command-palette",
  }),
};

export const INTELLIGENCE_SUBNAV: LayerSubNavConfig = {
  key: "intelligence",
  layer: "intelligence",
  accent: "var(--purple)",
  items: [
    { id: "intel-overview", label: "Overview", to: "/intelligence" },
    { id: "intel-chat", label: "Assistant", to: "/intelligence/aria" },
    { id: "intel-platform", label: "AI Platform", to: "/intelligence/platform" },
    { id: "intel-search", label: "Command", to: "/search", badge: "K", badgeTone: "info" },
  ],
  smartAction: (pathname) => {
    if (pathname.startsWith("/intelligence/platform")) {
      return {
        supervisor: "OMEGA",
        title: "Run model routing audit",
        hint: "Check quality/cost drift and recommended routing.",
        intent: "open-command-palette",
      };
    }
    return {
      supervisor: "OMEGA",
      title: "Open strategic command",
      hint: "Execute a cross-layer action from one prompt.",
      intent: "open-command-palette",
    };
  },
};

export const CORE_SUBNAV: LayerSubNavConfig = {
  key: "core",
  layer: "core",
  accent: "var(--gold)",
  items: [
    { id: "core-dashboard", label: "Control Center", to: "/dashboard" },
    { id: "core-analytics", label: "Analytics", to: "/analytics" },
    { id: "core-search", label: "Search", to: "/search", badge: "K", badgeTone: "info" },
    { id: "core-activity", label: "Activity", to: "/activity" },
    { id: "core-ops", label: "Core Ops", to: "/ops", badge: "New", badgeTone: "attention" },
  ],
  smartAction: () => ({
    supervisor: "OMEGA",
    title: "Prioritize today plan",
    hint: "Generate the highest-impact action sequence now.",
    intent: "open-command-palette",
  }),
};

export function getLayerSubNavForPath(pathname: string): LayerSubNavConfig {
  if (pathname.startsWith("/community") || pathname.startsWith("/messages")) return COMMUNITY_SUBNAV;
  if (pathname.startsWith("/academy")) return ACADEMY_SUBNAV;
  if (pathname.startsWith("/intelligence")) return INTELLIGENCE_SUBNAV;
  if (pathname.startsWith("/market/seller")) return MARKET_SUBNAV_SELLER;
  if (pathname.startsWith("/market") || pathname.startsWith("/shop")) return MARKET_SUBNAV_BUYER;
  if (pathname.startsWith("/work/employer")) return WORK_SUBNAV_EMPLOYER;
  if (pathname.startsWith("/work") || pathname.startsWith("/freelance")) return WORK_SUBNAV_FREELANCER;
  return CORE_SUBNAV;
}
