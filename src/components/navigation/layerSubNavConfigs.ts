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
    {
      id: "community-feed",
      label: "Feed",
      to: "/community",
      aliases: ["/community/feed"],
    },
    { id: "community-groups", label: "Groups", to: "/community/groups" },
    {
      id: "community-spaces",
      label: "Live Spaces",
      to: "/community/spaces",
      badge: "Live",
      badgeTone: "positive",
    },
    {
      id: "community-studio",
      label: "🎙️ Studio",
      to: "/community/studio",
      badge: "NEW",
      badgeTone: "positive",
      children: [
        { id: "studio-home", label: "Home", to: "/community/studio" },
        {
          id: "studio-rooms",
          label: "Video Rooms",
          to: "/community/studio?tab=rooms",
        },
        {
          id: "studio-streams",
          label: "Broadcasts",
          to: "/community/studio?tab=streams",
        },
        {
          id: "studio-events",
          label: "Events",
          to: "/community/studio?tab=events",
        },
      ],
    },
    {
      id: "community-directory",
      label: "Directory",
      to: "/community/directory",
    },
    {
      id: "community-opportunities",
      label: "Opportunities",
      to: "/community/opportunities",
      badge: "AI",
      badgeTone: "info",
    },
    {
      id: "community-social-ai",
      label: "Social AI 🤖",
      to: "/community/social-intelligence",
    },
    {
      id: "community-connect-apps",
      label: "Connect Apps 🔗",
      to: "/community/social-accounts",
    },
    {
      id: "community-creator",
      label: "Creator Hub",
      to: "/community/creator",
      children: [
        {
          id: "community-creator-overview",
          label: "Overview",
          to: "/community/creator",
        },
        {
          id: "community-creator-analytics",
          label: "Analytics",
          to: "/community/analytics",
        },
      ],
    },
    {
      id: "community-messages",
      label: "Messages",
      to: "/messages",
      aliases: ["/messages"],
    },
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
    {
      id: "academy-study-groups",
      label: "Study Groups",
      to: "/academy/study-groups",
      aliases: ["/academy/cohorts"],
    },
    {
      id: "academy-learning",
      label: "My Learning",
      to: "/academy/my-learning",
    },
    {
      id: "academy-instructor",
      label: "Instructor",
      to: "/academy/instructor",
      children: [
        {
          id: "academy-instructor-home",
          label: "Dashboard",
          to: "/academy/instructor",
        },
        {
          id: "academy-instructor-create",
          label: "Create Course",
          to: "/academy/instructor/create",
        },
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
    {
      id: "market-hub",
      label: "Market Hub",
      to: "/market",
      badge: "Live",
      badgeTone: "positive",
    },
    {
      id: "market-dropshipping",
      label: "Dropshipping",
      to: "/market/dropshipping",
    },
    { id: "market-cart", label: "Cart", to: "/market/cart" },
    { id: "market-orders", label: "Orders", to: "/market/orders" },
    {
      id: "market-digital",
      label: "Digital Marketing",
      to: "/market/digital-marketing",
      aliases: ["/market/marketing"],
    },
    {
      id: "market-business",
      label: "Business Launcher",
      to: "/market/business-launcher",
    },
    { id: "market-stream", label: "Streaming", to: "/market/stream" },
    { id: "market-trading", label: "Trading", to: "/market/trading" },
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
    {
      id: "market-hub",
      label: "Market Hub",
      to: "/market",
      badge: "Live",
      badgeTone: "positive",
    },
    { id: "market-vendor", label: "My Store", to: "/market/vendor" },
    {
      id: "market-dropshipping",
      label: "Dropshipping",
      to: "/market/dropshipping",
    },
    { id: "market-orders", label: "Orders", to: "/market/orders" },
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
    {
      id: "work-jobs",
      label: "Browse Jobs",
      to: "/work",
      aliases: ["/work/jobs"],
      badge: "Live",
      badgeTone: "positive",
    },
    { id: "work-freelancers", label: "Find Talent", to: "/work/freelancers" },
    { id: "work-contracts", label: "My Contracts", to: "/work/contracts" },
    { id: "work-profile", label: "My Profile", to: "/work/profile" },
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
    {
      id: "work-jobs",
      label: "Job Board",
      to: "/work",
      aliases: ["/work/jobs"],
      badge: "Live",
      badgeTone: "positive",
    },
    { id: "work-freelancers", label: "Find Talent", to: "/work/freelancers" },
    { id: "work-contracts", label: "Contracts", to: "/work/contracts" },
    { id: "work-profile", label: "My Profile", to: "/work/profile" },
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
    {
      id: "intel-overview",
      label: "AI Hub",
      to: "/intelligence",
      badge: "Live",
      badgeTone: "positive",
    },
    { id: "intel-aria", label: "ARIA — Chat", to: "/intelligence/aria" },
    {
      id: "intel-omega",
      label: "OMEGA — Orchestrator",
      to: "/intelligence/omega",
      badge: "New",
      badgeTone: "attention",
    },
    {
      id: "intel-platform",
      label: "AI Platform",
      to: "/intelligence/platform",
    },
    {
      id: "intel-search",
      label: "⌘K Command",
      to: "/search",
      badge: "K",
      badgeTone: "info",
    },
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
    {
      id: "core-home",
      label: "User Home",
      to: "/home",
      badge: "Entry",
      badgeTone: "info",
    },
    {
      id: "core-settings",
      label: "Settings",
      to: "/settings",
      badge: "Hierarchy",
      badgeTone: "attention",
    },
    { id: "core-analytics", label: "Analytics", to: "/analytics" },
    {
      id: "core-search",
      label: "Search",
      to: "/search",
      badge: "K",
      badgeTone: "info",
    },
    { id: "core-activity", label: "Activity", to: "/activity" },
  ],
  smartAction: () => ({
    supervisor: "OMEGA",
    title: "Prioritize today plan",
    hint: "Generate the highest-impact action sequence now.",
    intent: "open-command-palette",
  }),
};

export const ADMIN_SUBNAV: LayerSubNavConfig = {
  key: "admin",
  layer: "core",
  accent: "var(--gold)",
  items: [
    {
      id: "admin-overview",
      label: "Admin Dashboard",
      to: "/dashboard",
      aliases: ["/admin", "/admin/overview"],
    },
    {
      id: "admin-core-settings",
      label: "Core Settings",
      to: "/settings/core",
      aliases: ["/admin/settings"],
      badge: "Root",
      badgeTone: "attention",
    },
    { id: "admin-launch", label: "Launcher", to: "/admin/platform" },
    { id: "admin-tenants", label: "Tenants", to: "/admin/tenants" },
    { id: "admin-users", label: "Users", to: "/admin/users" },
    { id: "admin-revenue", label: "Revenue", to: "/admin/revenue" },
    {
      id: "admin-forge",
      label: "FORGE",
      to: "/admin/forge",
      badge: "AI",
      badgeTone: "info",
    },
    {
      id: "admin-health",
      label: "System Health",
      to: "/admin/health",
      aliases: ["/ops"],
    },
    {
      id: "admin-broadcast",
      label: "OMEGA Broadcast",
      to: "/admin/broadcast",
      badge: "Live",
      badgeTone: "attention",
    },
    { id: "admin-security", label: "Security", to: "/admin/security" },
  ],
  smartAction: () => ({
    supervisor: "OMEGA",
    title: "Open sovereign command",
    hint: "Coordinate launch, health, and cross-layer directives from one surface.",
    intent: "open-command-palette",
  }),
};

export function getLayerSubNavForPath(pathname: string): LayerSubNavConfig {
  if (pathname.startsWith("/settings/core")) return ADMIN_SUBNAV;
  if (pathname.startsWith("/admin") || pathname.startsWith("/ops"))
    return ADMIN_SUBNAV;
  if (pathname.startsWith("/community") || pathname.startsWith("/messages"))
    return COMMUNITY_SUBNAV;
  if (pathname.startsWith("/academy")) return ACADEMY_SUBNAV;
  if (pathname.startsWith("/intelligence")) return INTELLIGENCE_SUBNAV;
  if (pathname.startsWith("/market/seller")) return MARKET_SUBNAV_SELLER;
  if (pathname.startsWith("/market") || pathname.startsWith("/shop"))
    return MARKET_SUBNAV_BUYER;
  if (pathname.startsWith("/work/employer")) return WORK_SUBNAV_EMPLOYER;
  if (pathname.startsWith("/work") || pathname.startsWith("/freelance"))
    return WORK_SUBNAV_FREELANCER;
  return CORE_SUBNAV;
}
