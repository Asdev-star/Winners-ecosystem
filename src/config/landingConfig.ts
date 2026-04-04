// Landing Page Configuration
// Customize colors, sections, content, and more

export interface LandingPageConfig {
  // Theme Colors - customize the color scheme
  theme: {
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    accentDim: string;
    background: string;
    surface: string;
    surface2: string;
    border: string;
    text: string;
    textDim: string;
    textFaint: string;
  };

  // Branding
  branding: {
    name: string;
    tagline: string;
    logo?: string; // URL to logo
    logoFallback?: string; // fallback text/icon
    favicon?: string;
    websiteUrl: string;
    supportEmail: string;
  };

  // Navigation
  nav: {
    showStatus: boolean;
    statusText: string;
    ctaText: string;
    ctaLink: string;
    links: { label: string; href: string }[];
  };

  // Sections - toggle visibility
  sections: {
    contextBar: boolean;
    hero: boolean;
    trustedBy: boolean;
    ecosystemBand: boolean;
    howItWorks: boolean;
    company: boolean;
    architecture: boolean;
    platforms: boolean;
    agenticLoop: boolean;
    features: boolean;
    buildProgress: boolean;
    pricing: boolean;
    testimonials: boolean;
    faq: boolean;
    cta: boolean;
    footer: boolean;
  };

  // Hero Section
  hero: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    metrics: { value: string; label: string }[];
  };

  // Trusted By Section
  trustedBy: {
    label: string;
    companies: string[];
  };

  // Ecosystem Band
  ecosystemBand: {
    label: string;
    title: string;
    titleHighlight: string;
    description: string;
    pillars: { icon: string; label: string; color: string }[];
  };

  // How It Works
  howItWorks: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    description: string;
    steps: { num: string; title: string; description: string }[];
  };

  // Company Section
  company: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    mission: string;
    description: string;
    services: { title: string; description: string }[];
  };

  // Architecture
  architecture: {
    eyebrow: string;
    title: string;
  };

  // Platforms
  platforms: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    description: string;
    items: {
      icon: string;
      name: string;
      phase: string;
      status: "live" | "soon" | "planned";
      pct: number;
      desc: string;
      tags: string[];
    }[];
  };

  // Agentic Loop
  agenticLoop: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    description: string;
    steps: { icon: string; label: string }[];
  };

  // Features
  features: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    description: string;
    items: { num: string; icon: string; title: string; desc: string }[];
  };

  // Build Progress
  buildProgress: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    description: string;
  };

  // Pricing
  pricing: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    description: string;
    plans: {
      name: string;
      tagline: string;
      price: string;
      period: string;
      featured?: boolean;
      features: { label: string; included: boolean }[];
      cta: string;
    }[];
  };

  // Testimonials
  testimonials: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    description: string;
    items: { quote: string; name: string; role: string }[];
  };

  // FAQ
  faq: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    description: string;
    cta: string;
    items: { q: string; a: string }[];
  };

  // CTA Band
  cta: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    tagline: string;
  };

  // Footer
  footer: {
    tagline: string;
    platformLinks: { label: string; href: string }[];
    productLinks: { label: string; href: string }[];
    ecosystemLinks: { label: string; href: string }[];
    socialLinks: {
      twitter?: string;
      linkedin?: string;
      github?: string;
      discord?: string;
      instagram?: string;
      youtube?: string;
    };
    copyright: string;
    legalLinks: { label: string; href: string }[];
  };
}

export const defaultConfig: LandingPageConfig = {
  theme: {
    primary: "#c9a84c",
    primaryHover: "#d4b85e",
    secondary: "#2b5f8e",
    accent: "#c9a84c",
    accentDim: "rgba(201,168,76,0.08)",
    background: "#0f1826",
    surface: "#141f2e",
    surface2: "#1a2940",
    border: "rgba(30,50,72,0.6)",
    text: "#f2f7fc",
    textDim: "rgba(242,247,252,0.78)",
    textFaint: "rgba(30,50,72,0.6)",
  },

  branding: {
    name: "Winners Ecosystem",
    tagline: "Digital Sovereign Infrastructure",
    logo: "/logo.jpg",
    logoFallback: "W",
    websiteUrl: "https://winnersecosystem.com",
    supportEmail: "hello@winnersecosystem.com",
  },

  nav: {
    showStatus: true,
    statusText: "Core Engine Live",
    ctaText: "Enter →",
    ctaLink: "/login",
    links: [
      { label: "Company", href: "#company" },
      { label: "Platforms", href: "#platforms" },
      { label: "Build Status", href: "#build" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },

  sections: {
    contextBar: true,
    hero: true,
    trustedBy: true,
    ecosystemBand: true,
    howItWorks: true,
    company: true,
    architecture: true,
    platforms: true,
    agenticLoop: true,
    features: true,
    buildProgress: true,
    pricing: true,
    testimonials: true,
    faq: true,
    cta: true,
    footer: true,
  },

  hero: {
    eyebrow:
      "Digital Sovereign Infrastructure · AI-Powered · Trusted by 10,000+ Users",
    title: "Build. Learn. Earn.",
    titleHighlight: "Earn.",
    subtitle: "The unified platform for creators and digital entrepreneurs",
    description:
      "Winners Ecosystem brings together Community, Academy, Market, Work, and AI intelligence into one powerful platform. Connect with others, learn in-demand skills, sell products, find work, and grow your digital business — all from a single account with unified billing and AI-powered insights.",
    ctaPrimary: "Get Started Free",
    ctaSecondary: "See How It Works →",
    metrics: [
      { value: "9", label: "Platform Layers" },
      { value: "9", label: "AI Supervisors" },
      { value: "150+", label: "DB Models" },
      { value: "52", label: "API Routes" },
      { value: "24/7", label: "Uptime" },
    ],
  },

  trustedBy: {
    label: "Trusted by leading companies worldwide",
    companies: [
      "TechCorp",
      "InnovateCo",
      "FutureLabs",
      "DigitalEdge",
      "CloudNine",
    ],
  },

  ecosystemBand: {
    label: "The Core Concept",
    title: "Not a website. Not a SaaS.",
    titleHighlight: "A Digital Operating System.",
    description:
      "Winners Ecosystem is infrastructure. Every platform layer — Community, Academy, Market, Work, Intelligence — runs on the same brain. One account. One billing system. One AI core that connects them all and makes them smarter together than they are apart.",
    pillars: [
      { icon: "🧑‍🤝‍🧑", label: "Connect", color: "blue" },
      { icon: "🎓", label: "Learn", color: "gold" },
      { icon: "💰", label: "Earn", color: "green" },
      { icon: "🛒", label: "Sell", color: "blue" },
      { icon: "🤖", label: "Automate", color: "purple" },
      { icon: "🌍", label: "Scale", color: "gold" },
    ],
  },

  howItWorks: {
    eyebrow: "The Journey",
    title: "How to Sovereign",
    titleHighlight: "Sovereign",
    description:
      "The Winners Ecosystem doesn't just host your data—it guides your growth through the Agentic Loop.",
    steps: [
      {
        num: "01",
        title: "Join & Post",
        description:
          "Create your account and start sharing in the Community. NOVA AI passively monitors your signal to detect latent skills and interests.",
      },
      {
        num: "02",
        title: "Learn & Prove",
        description:
          "SAGE AI recommends specific Academy modules to sharpen your detected skills. Earn verified certificates that compound your Trust Score.",
      },
      {
        num: "03",
        title: "Unlock & Earn",
        description:
          "As your Trust Score grows, OMEGA unlocks commercial surfaces in Work and Market, matching you to high-leverage opportunities automatically.",
      },
    ],
  },

  company: {
    eyebrow: "The Company",
    title: "Winners Empire",
    titleHighlight: "Empire",
    mission:
      '"To build the world\'s first truly integrated Digital Sovereign Infrastructure that empowers creators, entrepreneurs, and digital businesses to own their growth."',
    description:
      "Winners Ecosystem is not just a collection of apps; it's a strategic engine designed to eliminate the friction between learning, creating, and earning. Founded on the principle of Digital Sovereignty, we provide the infrastructure that allows users to escape fragmented tools and enter a unified, AI-orchestrated environment. Our company focuses on long-term sustainability, transparent building, and the relentless pursuit of an 'Agentic Loop' where human potential is maximized by intelligent automation.",
    services: [
      {
        title: "AI Orchestration",
        description:
          "9 dedicated AI supervisors (OMEGA core) orchestrating cross-layer workflows and strategic recommendations.",
      },
      {
        title: "Sovereign Identity",
        description:
          "Unified identity and reputation passport that follows you across every platform layer without data leakage.",
      },
      {
        title: "Platform Infrastructure",
        description:
          "Enterprise-grade multi-tenant architecture with RBAC, SSO, and 2FA built into the foundation.",
      },
      {
        title: "Developer Cloud",
        description:
          "API-first design with a dedicated SDK and webhook engine for building custom integrations on the ecosystem.",
      },
    ],
  },

  architecture: {
    eyebrow: "Architecture",
    title: "Three zones. One system.",
  },

  platforms: {
    eyebrow: "Ecosystem Platforms",
    title: "Six platforms.",
    titleHighlight: "One ecosystem.",
    description:
      "Each layer is a standalone product and a monetizable business. Built sequentially, connected by the AI core, evolved continuously.",
    items: [
      {
        icon: "⬡",
        name: "Core Engine",
        phase: "Phase 1",
        status: "live",
        pct: 92,
        desc: "The control tower. Multi-tenant auth, billing, analytics, 2FA, RBAC, SSO, and the 52-route API gateway powering every platform layer.",
        tags: ["Auth & 2FA", "Billing", "Analytics", "52 API Routes"],
      },
      {
        icon: "🧑‍🤝‍🧑",
        name: "Winners Community",
        phase: "Phase 2",
        status: "live",
        pct: 80,
        desc: "Full social platform. Posts, groups, DMs, live spaces, studio, creator economy, skill endorsements, and NOVA AI skill detection powering the Agentic Loop.",
        tags: ["Social Feed", "Live Spaces", "Creator Economy", "NOVA AI"],
      },
      {
        icon: "🎓",
        name: "Winners Academy",
        phase: "Phase 3",
        status: "live",
        pct: 100,
        desc: "Complete learning platform. Courses, instructor dashboard, learning paths, study groups, live sessions, certificates, and SAGE AI tutor.",
        tags: ["Courses", "Certificates", "SAGE AI Tutor", "Live Sessions"],
      },
      {
        icon: "🛒",
        name: "Winners Market",
        phase: "Phase 4",
        status: "live",
        pct: 100,
        desc: "Complete e-commerce platform. Multi-vendor marketplace with Stripe Connect, dropshipping integration, product reviews, order fulfillment, and ATLAS AI commerce intelligence.",
        tags: ["Multi-Vendor", "Stripe Connect", "Dropshipping", "ATLAS AI"],
      },
      {
        icon: "🤖",
        name: "Winners Intelligence",
        phase: "Phase 5",
        status: "live",
        pct: 75,
        desc: "9 AI supervisors live. OMEGA orchestrates the Agentic Loop. Token-by-token streaming, multi-turn memory, SSE — all 9 assistants active.",
        tags: [
          "9 Supervisors",
          "OMEGA Dashboard",
          "Streaming AI",
          "Agentic Loop",
        ],
      },
      {
        icon: "💼",
        name: "Winners Work",
        phase: "Phase 6",
        status: "soon",
        pct: 35,
        desc: "Freelance marketplace. Job board, freelancer profiles, applications, contracts, and AI-powered CIRCUIT matching — escrow integration building.",
        tags: ["Job Board", "Freelancers", "CIRCUIT AI", "Contracts"],
      },
      {
        icon: "☁️",
        name: "Winners Cloud",
        phase: "Phase 8",
        status: "soon",
        pct: 40,
        desc: "Developer infrastructure. API keys, connector marketplace, webhook subscriptions, automations, AI agents builder, and DNS management.",
        tags: ["API Keys", "Connectors", "Webhooks", "NEXUS AI"],
      },
      {
        icon: "🧬",
        name: "AI Platform",
        phase: "Phase 9",
        status: "soon",
        pct: 60,
        desc: "Universal multimodal AI service. FastAPI + Ollama (Llama 3.1, DeepSeek, Qwen), faster-whisper offline STT, and ComfyUI image generation.",
        tags: ["Ollama Local", "Whisper STT", "ComfyUI", "HERALD AI"],
      },
      {
        icon: "📱",
        name: "Mobile App",
        phase: "Phase 7",
        status: "soon",
        pct: 25,
        desc: "PWA ready today. React Native super app in progress — community, learning, commerce, and all 9 AI supervisors in one mobile experience.",
        tags: ["PWA Ready", "React Native", "Push Notifications", "Offline AI"],
      },
    ],
  },

  agenticLoop: {
    eyebrow: "The Agentic Loop",
    title: "Every action feeds the next.",
    titleHighlight: "The ecosystem compounds.",
    description:
      "Winners Intelligence connects all platforms into one reinforcing loop. Your activity in Community becomes your curriculum in Academy. Your certificate becomes your job listing. Your income becomes your market. Every loop makes you more valuable.",
    steps: [
      { icon: "🧑‍🤝‍🧑", label: "Post in Community" },
      { icon: "🤖", label: "AI Analyses Skills" },
      { icon: "🎓", label: "Course Recommended" },
      { icon: "📜", label: "Certificate Earned" },
      { icon: "💼", label: "Job Matched" },
      { icon: "🛒", label: "Sell in Market" },
      { icon: "📈", label: "Revenue Grows" },
    ],
  },

  features: {
    eyebrow: "Core Capabilities",
    title: "Built for scale.",
    titleHighlight: "From day one.",
    description:
      "The Core Engine isn't a feature — it's the foundation every platform layer runs on. Built once, never abandoned.",
    items: [
      {
        num: "01",
        icon: "🧠",
        title: "AI Intelligence Core",
        desc: "Claude-powered analytics surfaces insights, detects anomalies, and generates strategic recommendations across every ecosystem layer — automatically.",
      },
      {
        num: "02",
        icon: "🏗",
        title: "Multi-Tenant Architecture",
        desc: "Full workspace isolation with role-based access. Every platform layer shares one identity system. One login, every product, zero data leakage.",
      },
      {
        num: "03",
        icon: "💳",
        title: "Unified Billing Engine",
        desc: "One billing system governs all platforms. Subscriptions, marketplace commissions, course revenue, and AI credits — managed from a single control panel.",
      },
      {
        num: "04",
        icon: "🔗",
        title: "API-First Design",
        desc: "Every layer exposes clean, versioned APIs. Future developers and partners can build on Winners Ecosystem. You stop being a product. You become infrastructure.",
      },
      {
        num: "05",
        icon: "🔐",
        title: "Enterprise Security",
        desc: "2FA (TOTP + Email OTP + backup codes), audit logs, encrypted storage, rate limiting, and GDPR compliance built into the core. Security is the foundation.",
      },
      {
        num: "06",
        icon: "📊",
        title: "Data Dominance",
        desc: "Every interaction tracked. Revenue, engagement, retention, and cohort analytics available across all platforms in one unified intelligence dashboard.",
      },
    ],
  },

  buildProgress: {
    eyebrow: "Build Status · February 2026",
    title: "Phase 2 of 8.",
    titleHighlight: "Active build.",
    description:
      "Transparent progress. Every layer tracked. Shipped in order. Never abandoned.",
  },

  pricing: {
    eyebrow: "Pricing",
    title: "One account.",
    titleHighlight: "Every platform.",
    description:
      "All plans give you access to the full ecosystem as each layer launches. No per-platform pricing. One subscription covers everything.",
    plans: [
      {
        name: "Starter",
        tagline: "Explore the ecosystem",
        price: "0",
        period: "Free forever",
        features: [
          { label: "Winners Community access", included: true },
          { label: "1 workspace", included: true },
          { label: "Basic analytics (30 days)", included: true },
          { label: "Academy courses (free tier)", included: true },
          { label: "AI recommendations", included: false },
          { label: "Winners Market storefront", included: false },
          { label: "Custom domain", included: false },
        ],
        cta: "Get Started Free",
      },
      {
        name: "Pro",
        tagline: "Build your business",
        price: "29",
        period: "/ month",
        featured: true,
        features: [
          { label: "All Starter features", included: true },
          { label: "Unlimited workspaces", included: true },
          { label: "Advanced analytics + AI insights", included: true },
          { label: "All Academy courses", included: true },
          { label: "Winners Market storefront", included: true },
          { label: "AI recommendations + automation", included: true },
          { label: "Priority support", included: true },
        ],
        cta: "Start Pro Trial",
      },
      {
        name: "Enterprise",
        tagline: "Full ecosystem control",
        price: "99",
        period: "/ month",
        features: [
          { label: "All Pro features", included: true },
          { label: "White-label ecosystem", included: true },
          { label: "API access + developer SDK", included: true },
          { label: "SSO + advanced RBAC", included: true },
          { label: "Custom AI agents (per tenant)", included: true },
          { label: "Dedicated support + SLA", included: true },
          { label: "Enterprise billing integration", included: true },
        ],
        cta: "Contact Sales",
      },
    ],
  },

  testimonials: {
    eyebrow: "Success Stories",
    title: "Loved by",
    titleHighlight: "thousands",
    description:
      "Hear from users who have transformed their digital presence with Winners Ecosystem.",
    items: [
      {
        quote:
          "Winners Ecosystem transformed how I run my online business. The unified platform means I manage my store, courses, and community all in one place. The AI recommendations helped me triple my revenue in just 3 months.",
        name: "Sarah Chen",
        role: "Digital Entrepreneur",
      },
      {
        quote:
          "The Academy feature is incredible. I went from knowing nothing about trading to earning my first income through the Work platform. The AI tutor SAGE guided me every step of the way.",
        name: "Michael Rodriguez",
        role: "Academy Graduate",
      },
      {
        quote:
          "As a freelancer, having access to the Work platform with CIRCUIT AI matching has been life-changing. I'm matched with high-quality clients consistently without spending hours searching.",
        name: "Emma Thompson",
        role: "Freelance Designer",
      },
    ],
  },

  faq: {
    eyebrow: "FAQ",
    title: "Common",
    titleHighlight: "questions.",
    description:
      "Everything you need to know about the ecosystem before joining.",
    cta: "Join Free Today",
    items: [
      {
        q: "What exactly is Winners Ecosystem?",
        a: "Winners Ecosystem is a Digital Sovereign Infrastructure — a Central Digital Operating System that hosts, governs, and intelligently orchestrates six platform products: Community, Academy, Market, Work, Intelligence, and a Developer Cloud. One login gives you access to all of them. Every layer shares identity, billing, and AI.",
      },
      {
        q: "How does the AI Agentic Loop work?",
        a: "The AI core monitors your activity across all platforms. Post in Community → AI detects skills → recommends a course in Academy → you earn a certificate → AI matches you to a job in Winners Work → you earn and spend in the Market. The ecosystem feeds itself and compounds your growth automatically.",
      },
      {
        q: "What is live right now?",
        a: "Core Engine (92%) — auth, billing, analytics, 2FA, RBAC, 52 API routes live. Community (80%) — social feed, groups, DMs, live spaces, creator studio, skill endorsements, NOVA AI live. Academy (72%) — courses, instructor dashboard, learning paths, study groups, live sessions, certificates, SAGE AI tutor live. Intelligence (75%) — all 9 AI supervisors streaming live. Market (55%) — vendor stores, cart, orders, dropshipping built. Work (35%) — job board, freelancer profiles, applications built. Cloud (40%) — API keys, connectors, webhooks built. AI Platform (60%) — FastAPI multimodal service containerised.",
      },
      {
        q: "Can I use just one platform layer?",
        a: "Yes. Each layer is a standalone product. Community works without Academy. Market works without Work. All platforms share your identity and data, but none require the others to function.",
      },
      {
        q: "How does multi-tenant isolation work?",
        a: "Each workspace is fully isolated with role-based permissions (Owner, Admin, Member, Viewer). Teams collaborate without data leakage. An enterprise can run multiple isolated workspaces under one billing account — each with custom permissions and branding.",
      },
      {
        q: "When will the mobile app launch?",
        a: "A React Native super app is planned for Phase 7 — covering community, learning, commerce, and AI assistant in one mobile experience. A PWA version will ship before native apps to get mobile access faster.",
      },
    ],
  },

  cta: {
    title: "Start building your",
    titleHighlight: "digital future",
    subtitle: "Join thousands of creators, entrepreneurs, and businesses",
    ctaPrimary: "Get Started Free",
    ctaSecondary: "View Platforms →",
    tagline:
      "Infrastructure → Engagement → Value → Monetization → Intelligence → Scale.",
  },

  footer: {
    tagline:
      "A Central Digital Operating System. Six platforms, one identity, one AI intelligence core. Building the infrastructure for the next generation of creators, entrepreneurs, and digital businesses.",
    platformLinks: [
      { label: "Core Engine", href: "#platforms" },
      { label: "Winners Community", href: "#platforms" },
      { label: "Winners Academy", href: "#platforms" },
      { label: "Winners Market", href: "#platforms" },
      { label: "Winners Intelligence", href: "#platforms" },
      { label: "Winners Work", href: "#platforms" },
    ],
    productLinks: [
      { label: "Features", href: "#features" },
      { label: "Build Status", href: "#build" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
      { label: "Sign In", href: "/login" },
    ],
    ecosystemLinks: [
      { label: "Phase 1 — Core ✅", href: "#" },
      { label: "Phase 2 — Community 🔄", href: "#" },
      { label: "Phase 3 — Academy 🔄", href: "#" },
      { label: "Phase 4 — Market 📋", href: "#" },
      { label: "Phase 5 — Intelligence 📋", href: "#" },
      { label: "Phase 6–8 — Planned 📋", href: "#" },
    ],
    socialLinks: {
      twitter: "https://twitter.com/winnersecosystem",
      linkedin: "https://linkedin.com/company/winnersecosystem",
      github: "https://github.com/winnersecosystem",
      discord: "https://discord.gg/winnersecosystem",
      instagram: "https://instagram.com/winnersecosystem",
      youtube: "https://youtube.com/@winnersecosystem",
    },
    copyright:
      "© 2024–2026 Winners Ecosystem · Digital Sovereign Infrastructure · Built with discipline.",
    legalLinks: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "API Docs", href: "#" },
    ],
  },
};
