// Phase 5 - Intelligence Layer
// Routes: omegaRoutes
// OMEGA AI Supervisor routes - analysis, briefing, health, forecast

import { Request, Response, Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import { callAnthropicAndParseJson } from "../services/aiService.js";

const router = Router();
const prisma = db;

type BriefingRecommendation = {
  label: string;
  url: string;
  priority: "high" | "medium" | "low";
};

type BriefingResponse = {
  briefing: string;
  recommendations: BriefingRecommendation[];
  generatedAt: string;
  expiresAt: string;
  cached: boolean;
};

type ResumptionCard = {
  layer: "academy" | "community" | "market";
  title: string;
  sub: string;
  pct?: number;
  amount?: number;
  url: string;
  cta: string;
};

function metadataObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStringArray(value: unknown, limit = 3): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, limit);
}

function deriveMarketSignals(markets: string[]) {
  const has = (value: string) => markets.includes(value);
  const currencies = new Set<string>();
  const payments = new Set<string>();
  const languages = new Set<string>(["English"]);
  const seasonalSignals = new Set<string>();
  const communitySuggestions = new Set<string>();

  if (has("Nigeria specifically")) {
    currencies.add("NGN");
    payments.add("Flutterwave");
    payments.add("Paystack");
    payments.add("OPay");
    languages.add("Pidgin");
    seasonalSignals.add("Eid");
    seasonalSignals.add("year-end demand");
    communitySuggestions.add("Nigeria Builders");
  }
  if (has("Kenya specifically")) {
    currencies.add("KES");
    payments.add("M-Pesa (Safaricom)");
    payments.add("Flutterwave");
    languages.add("Swahili");
    seasonalSignals.add("KCSE season");
    communitySuggestions.add("Nairobi Builders");
  }
  if (has("Ghana specifically")) {
    currencies.add("GHS");
    payments.add("MTN MoMo");
    payments.add("Flutterwave");
    seasonalSignals.add("WASSCE season");
    communitySuggestions.add("Accra Builders");
  }
  if (has("South Africa specifically")) {
    currencies.add("ZAR");
    payments.add("Ozow");
    payments.add("Flutterwave");
    payments.add("Stripe");
    seasonalSignals.add("year-end demand");
    communitySuggestions.add("Johannesburg Operators");
  }
  if (has("Tanzania specifically")) {
    currencies.add("TZS");
    payments.add("Flutterwave");
    languages.add("Swahili");
    communitySuggestions.add("Dar Builders");
  }
  if (has("Uganda specifically")) {
    currencies.add("UGX");
    payments.add("Flutterwave");
    communitySuggestions.add("Kampala Builders");
  }
  if (has("UK - diaspora")) {
    currencies.add("GBP");
    payments.add("Stripe");
    payments.add("Wise transfer");
    communitySuggestions.add("London Diaspora Builders");
  }
  if (has("USA - diaspora")) {
    currencies.add("USD");
    payments.add("Stripe");
    payments.add("Flutterwave");
    communitySuggestions.add("US Diaspora Operators");
  }
  if (has("Canada - diaspora")) {
    currencies.add("CAD");
    payments.add("Stripe");
    payments.add("Wise transfer");
    communitySuggestions.add("Canada Diaspora Builders");
  }
  if (has("Africa") || has("West Africa broadly") || has("East Africa broadly") || has("African + global markets")) {
    payments.add("Flutterwave");
    seasonalSignals.add("Eid");
    seasonalSignals.add("year-end demand");
  }
  if (has("West Africa broadly")) {
    currencies.add("NGN");
    currencies.add("GHS");
    communitySuggestions.add("West Africa Operators");
  }
  if (has("East Africa broadly")) {
    currencies.add("KES");
    currencies.add("TZS");
    languages.add("Swahili");
    communitySuggestions.add("East Africa Builders");
  }
  if (has("African + global markets") || has("Global only")) {
    currencies.add("USD");
    payments.add("Stripe");
    payments.add("Wise transfer");
  }

  if (currencies.size === 0) currencies.add("USD");
  if (payments.size === 0) payments.add("Stripe");

  return {
    currencies: Array.from(currencies).slice(0, 4),
    primaryCurrency: Array.from(currencies)[0] ?? "USD",
    paymentRecommendations: Array.from(payments).slice(0, 4),
    jobMatchingPool:
      has("UK - diaspora") || has("USA - diaspora") || has("Canada - diaspora") || has("Global only")
        ? "diaspora and global clients"
        : has("Nigeria specifically") || has("Kenya specifically") || has("Ghana specifically") || has("South Africa specifically") || has("Tanzania specifically") || has("Uganda specifically") || has("West Africa broadly") || has("East Africa broadly") || has("Africa")
          ? "African remote clients and regional operators"
          : "African and global mixed clients",
    communitySuggestions: Array.from(communitySuggestions).slice(0, 3),
    languageOptions: Array.from(languages).slice(0, 4),
    seasonalSignals: Array.from(seasonalSignals).slice(0, 4),
  };
}

function readOnboardingSignals(metadata: unknown) {
  const root = metadataObject(metadata);
  const onboarding = metadataObject(root.onboarding);
  const omegaRouting = metadataObject(root.omegaRouting);
  const routingMarketFocus = normalizeStringArray(omegaRouting.marketFocus);
  const onboardingMarketFocus = normalizeStringArray(onboarding.marketFocus);
  const marketFocus = routingMarketFocus.length ? routingMarketFocus : onboardingMarketFocus;
  const routingTopSkills = normalizeStringArray(omegaRouting.topSkills, 5);
  const onboardingTopSkills = normalizeStringArray(onboarding.topSkills, 5);
  const topSkills = routingTopSkills.length ? routingTopSkills : onboardingTopSkills;

  return {
    experienceLevel:
      normalizeString(omegaRouting.experienceLevel) ??
      normalizeString(onboarding.experienceLevel),
    incomeTarget:
      normalizeString(omegaRouting.incomeTarget) ??
      normalizeString(onboarding.incomeTarget),
    primaryLayer:
      normalizeString(omegaRouting.primaryLayer) ??
      normalizeString(onboarding.primaryLayer),
    profileType:
      normalizeString(omegaRouting.profileType) ??
      normalizeString(onboarding.profileType),
    buildingFocus:
      normalizeString(omegaRouting.buildingFocus) ??
      normalizeString(onboarding.buildingFocus),
    marketFocus,
    topSkills,
    marketSignals: deriveMarketSignals(marketFocus),
  };
}

function omegaCalibration(experienceLevel: string | null, incomeTarget: string | null, markets: string[]) {
  let experienceLine = "Use your default OMEGA tone.";
  if (experienceLevel === "Just starting out - less than 1 year") {
    experienceLine = "Explain more, keep the action plan confidence-building, and recommend Academy-first sequencing before harder Work or Market execution when needed.";
  }
  if (experienceLevel === "Expert - 7+ years or professional-level") {
    experienceLine = "Assume context, skip basics, and keep the recommendations concise, commercial, and strategically direct.";
  }
  if (experienceLevel === "Established - 3 to 7 years") {
    experienceLine = "Assume solid foundations and prioritize leverage over hand-holding.";
  }
  if (experienceLevel === "Some experience - 1 to 3 years") {
    experienceLine = "Balance speed with explanation and keep the guidance practical.";
  }
  const revenueLine = incomeTarget && incomeTarget !== "Not focused on income right now"
    ? `Use ${incomeTarget} as the revenue baseline for forecasts and progress framing.`
    : "Do not force revenue pressure if income is not the current priority.";
  const marketLine = markets.length
    ? `Use the selected markets ${markets.join(", ")} to shape currencies, payments, job pools, community suggestions, and seasonal signals.`
    : "Use broad African and global assumptions for currencies, payments, and market signals.";
  return `${experienceLine} ${revenueLine} ${marketLine}`;
}

function getTrustTier(score: number | null | undefined) {
  const value = typeof score === "number" ? score : 0;
  if (value >= 90) return "PLATINUM";
  if (value >= 80) return "GOLD";
  if (value >= 60) return "SILVER";
  if (value >= 40) return "BRONZE";
  return "STARTER";
}

function clampWords(input: string, maxWords: number) {
  const words = input.trim().split(/\s+/);
  if (words.length <= maxWords) return input.trim();
  return `${words.slice(0, maxWords).join(" ").replace(/[.,;:!?-]*$/, "")}.`;
}

function safeJsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function firstNameFromFullName(name: string | null | undefined) {
  return (name ?? "Winner").trim().split(/\s+/)[0] ?? "Winner";
}

async function countUnreadMessages(userId: string, tenantId: string) {
  const memberships = await prisma.conversationParticipant.findMany({
    where: { tenantId, userId },
    select: { conversationId: true, lastReadAt: true },
  });

  if (!memberships.length) return 0;

  const unreadCounts = await Promise.all(
    memberships.map((membership) =>
      prisma.message.count({
        where: {
          tenantId,
          conversationId: membership.conversationId,
          senderId: { not: userId },
          deletedAt: null,
          createdAt: { gt: membership.lastReadAt },
        },
      }),
    ),
  );

  return unreadCounts.reduce((sum, count) => sum + count, 0);
}

async function findJobMatches(userId: string, tenantId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      primarySkills: true,
      skills: true,
      metadata: true,
      trustScore: true,
    },
  });

  const onboardingSignals = readOnboardingSignals(user?.metadata);
  const candidateSkills = normalizeStringArray(
    [
      ...(user?.primarySkills ?? []),
      ...(user?.skills ?? []),
      ...onboardingSignals.topSkills,
    ],
    8,
  );

  if (!candidateSkills.length) return [];

  const jobs = await prisma.jobListing.findMany({
    where: {
      tenantId,
      status: "OPEN",
      skills: { hasSome: candidateSkills.slice(0, 5) },
    },
    select: {
      id: true,
      title: true,
      skills: true,
      budgetMin: true,
      budgetMax: true,
      currency: true,
      deadline: true,
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 12,
  });

  return jobs
    .map((job) => {
      const overlap = job.skills.filter((skill) => candidateSkills.includes(skill)).length;
      const matchScore = Math.min(96, 45 + overlap * 14 + Math.round((user?.trustScore ?? 50) / 6));
      return { ...job, matchScore, overlap };
    })
    .filter((job) => job.matchScore >= 70)
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, 5);
}

async function generateOMEGABriefing(userId: string, tenantId: string): Promise<BriefingResponse> {
  const [
    user,
    recentActivity,
    certificates,
    jobMatches,
    loopProgress,
    pendingOrders,
    unreadMessages,
    trustSnapshot,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, trustScore: true, metadata: true },
    }),
    prisma.activityLog.findMany({
      where: { tenantId, userId },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: { action: true, category: true, createdAt: true, metadata: true },
    }),
    prisma.certificate.findMany({
      where: { tenantId, userId },
      orderBy: { issuedAt: "desc" },
      take: 5,
      select: {
        issuedAt: true,
        course: { select: { title: true, slug: true } },
      },
    }),
    findJobMatches(userId, tenantId),
    prisma.agenticLoopProgress.findUnique({
      where: { userId },
      select: { stage: true, currentStage: true, coursesTaken: true, contractsWon: true },
    }),
    prisma.order.findMany({
      where: { tenantId, userId, status: "PENDING" },
      take: 5,
      select: { id: true, status: true, total: true, createdAt: true },
    }),
    countUnreadMessages(userId, tenantId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { trustScore: true },
    }),
  ]);

  const topMatch = jobMatches[0] ?? null;
  const latestCertificate = certificates[0] ?? null;
  const firstName = firstNameFromFullName(user?.name);
  const fallbackBriefing = clampWords(
    `${firstName}, ${latestCertificate ? `your ${latestCertificate.course.title} certificate is now strengthening your profile. ` : ""}${topMatch ? `${jobMatches.length} Work matches are ready and ${topMatch.title} is the strongest at ${topMatch.matchScore}% match. ` : ""}${unreadMessages > 0 ? `You also have ${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}. ` : ""}${pendingOrders.length > 0 ? `${pendingOrders.length} order${pendingOrders.length === 1 ? " is" : "s are"} still pending in Market. ` : ""}${typeof trustSnapshot?.trustScore === "number" ? `Your Trust Score is ${trustSnapshot.trustScore}, with the next tier within reach.` : ""}`,
    80,
  );

  const fallbackRecommendations: BriefingRecommendation[] = [
    topMatch
      ? { label: `Review ${topMatch.title} (${topMatch.matchScore}% match)`, url: "/work/jobs", priority: "high" }
      : { label: "Open your strongest layer and review today's best opportunity", url: "/intelligence", priority: "high" },
    latestCertificate
      ? { label: `Use ${latestCertificate.course.title} to unlock the next step`, url: `/academy/courses/${latestCertificate.course.slug}`, priority: "medium" }
      : { label: "Continue your next Academy module", url: "/academy", priority: "medium" },
    pendingOrders.length > 0
      ? { label: "Resolve pending Market orders", url: "/market/orders", priority: "medium" }
      : { label: "Check new messages and replies", url: "/community", priority: "low" },
  ];

  const prompt = `You are OMEGA, the master orchestrator of the Winners Ecosystem.
Generate a personalized login briefing for ${user?.name ?? "this user"}.

User context:
- Recent activity: ${JSON.stringify(recentActivity.slice(0, 5))}
- Certificates earned: ${certificates.map((certificate) => certificate.course.title).join(", ") || "none"}
- Job matches ready: ${jobMatches.length} (highest: ${topMatch?.matchScore ?? 0}% for ${topMatch?.title ?? "none"})
- Trust Score: ${trustSnapshot?.trustScore ?? user?.trustScore ?? 0} (tier: ${getTrustTier(trustSnapshot?.trustScore ?? user?.trustScore)})
- Loop stage: ${loopProgress?.stage ?? 1} of 6 (${loopProgress?.currentStage ?? "starting"})
- Pending orders: ${pendingOrders.length}
- Unread messages: ${unreadMessages}

Rules:
- Be specific, not generic. Name actual courses, job titles, and amounts when available.
- Give a maximum of 3 recommendations. Each must be actionable right now.
- Use the user's first name once at the start.
- Maximum 80 words in the main briefing text.
- Return JSON only in this exact shape:
{"briefing":"...","recommendations":[{"label":"...","url":"...","priority":"high"}]}`;

  const aiResult = await callAnthropicAndParseJson<{ briefing?: string; recommendations?: BriefingRecommendation[] }>(
    prompt,
    { model: "claude-sonnet-4-6", max_tokens: 400 },
    { briefing: fallbackBriefing, recommendations: fallbackRecommendations },
  );

  const briefing = clampWords(
    typeof aiResult.briefing === "string" && aiResult.briefing.trim()
      ? aiResult.briefing.trim()
      : fallbackBriefing,
    80,
  );
  const recommendations = safeJsonArray<BriefingRecommendation>(aiResult.recommendations)
    .filter((item) => typeof item?.label === "string" && typeof item?.url === "string")
    .slice(0, 3)
    .map((item, index) => ({
      label: item.label.trim(),
      url: item.url.trim() || fallbackRecommendations[index]?.url || "/intelligence",
      priority:
        item.priority === "high" || item.priority === "medium" || item.priority === "low"
          ? item.priority
          : fallbackRecommendations[index]?.priority ?? "medium",
    }));

  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + 6 * 60 * 60 * 1000);

  await prisma.oMEGABriefing.upsert({
    where: { userId },
    create: {
      userId,
      tenantId,
      content: briefing,
      highlights: recommendations,
      topAction: recommendations[0] ?? {},
      loopStatus: {
        stage: loopProgress?.stage ?? 1,
        currentStage: loopProgress?.currentStage ?? "starting",
        trustScore: trustSnapshot?.trustScore ?? user?.trustScore ?? 0,
      },
      generatedAt,
      expiresAt,
    },
    update: {
      tenantId,
      content: briefing,
      highlights: recommendations,
      topAction: recommendations[0] ?? {},
      loopStatus: {
        stage: loopProgress?.stage ?? 1,
        currentStage: loopProgress?.currentStage ?? "starting",
        trustScore: trustSnapshot?.trustScore ?? user?.trustScore ?? 0,
      },
      generatedAt,
      expiresAt,
      openedAt: null,
      actedOnAt: null,
    },
  });

  return {
    briefing,
    recommendations: recommendations.length ? recommendations : fallbackRecommendations,
    generatedAt: generatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    cached: false,
  };
}

async function getResumptionCards(userId: string, tenantId: string): Promise<ResumptionCard[]> {
  const cards: ResumptionCard[] = [];

  const lastCourse = await prisma.enrollment.findFirst({
    where: { tenantId, userId, completedAt: null, status: "ACTIVE" },
    include: {
      course: { select: { title: true, slug: true } },
      progress: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: {
          lesson: {
            select: {
              order: true,
              module: { select: { order: true } },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (lastCourse) {
    const [completedLessons, totalLessons] = await Promise.all([
      prisma.lessonProgress.count({
        where: { tenantId, enrollmentId: lastCourse.id, completed: true },
      }),
      prisma.lesson.count({
        where: { tenantId, module: { courseId: lastCourse.courseId } },
      }),
    ]);
    const latestProgress = lastCourse.progress[0];
    const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    cards.push({
      layer: "academy",
      title: lastCourse.course.title,
      sub: latestProgress
        ? `Module ${latestProgress.lesson.module.order}, Lesson ${latestProgress.lesson.order}`
        : "Resume your latest lesson",
      pct,
      url: `/academy/courses/${lastCourse.course.slug}`,
      cta: "Continue",
    });
  }

  const [unreadMessages, recentReplies] = await Promise.all([
    countUnreadMessages(userId, tenantId),
    prisma.comment.count({
      where: {
        tenantId,
        authorId: { not: userId },
        post: { authorId: userId },
      },
    }),
  ]);

  if (unreadMessages + recentReplies > 0) {
    cards.push({
      layer: "community",
      title: `${unreadMessages + recentReplies} new interactions`,
      sub: `${unreadMessages} messages - ${recentReplies} post replies`,
      url: "/community",
      cta: "View Replies",
    });
  }

  const cart = await prisma.cart.findFirst({
    where: { tenantId, userId, status: "ACTIVE" },
    include: { items: { select: { price: true, quantity: true } } },
    orderBy: { updatedAt: "desc" },
  });

  if (cart?.items.length) {
    const amount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cards.push({
      layer: "market",
      title: `Cart has ${cart.items.length} ${cart.items.length === 1 ? "item" : "items"}`,
      sub: `$${amount.toFixed(2)} saved`,
      amount,
      url: "/market/cart",
      cta: "Checkout",
    });
  }

  return cards.slice(0, 3);
}

type PendingAutonomousAction = {
  id: string;
  category: "post_content" | "apply_to_job" | "send_connection_request" | "enroll_in_course" | "list_product" | "update_pricing" | "schedule_session";
  title: string;
  description: string;
  layer: string;
  estimatedImpact: string;
  confidence: number;
  payload: Record<string, unknown>;
  status: "pending_approval";
  scheduledFor: string;
  createdAt: string;
};

async function getPendingAutonomousActions(userId: string, tenantId: string): Promise<PendingAutonomousAction[]> {
  const [lastCourse, unreadMessages, pendingOrders, recentSkills] = await Promise.all([
    prisma.enrollment.findFirst({
      where: { tenantId, userId, completedAt: null, status: "ACTIVE" },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        progress: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          include: {
            lesson: {
              select: {
                title: true,
                order: true,
                module: { select: { title: true, order: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    countUnreadMessages(userId, tenantId),
    prisma.order.count({ where: { tenantId, userId, status: "PENDING" } }),
    prisma.novaSkillDetection.findMany({
      where: { userId },
      orderBy: { confidence: "desc" },
      take: 3,
      select: { skill: true, confidence: true },
    }),
  ]);

  const now = new Date();
  const actions: PendingAutonomousAction[] = [];

  if (lastCourse) {
    const latestProgress = lastCourse.progress[0];
    actions.push({
      id: `academy_${lastCourse.courseId}`,
      category: "enroll_in_course",
      title: `Continue ${lastCourse.course.title}`,
      description: latestProgress
        ? `Resume Module ${latestProgress.lesson.module.order}, Lesson ${latestProgress.lesson.order}.`
        : `Pick up where you left off in ${lastCourse.course.title}.`,
      layer: "Academy",
      estimatedImpact: "Keeps your certificate path moving",
      confidence: 92,
      payload: { courseId: lastCourse.courseId, slug: lastCourse.course.slug },
      status: "pending_approval",
      scheduledFor: now.toISOString(),
      createdAt: now.toISOString(),
    });
  }

  if (unreadMessages > 0) {
    actions.push({
      id: `community_${userId}`,
      category: "send_connection_request",
      title: `Respond to ${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`,
      description: "You have active conversations waiting in Community.",
      layer: "Community",
      estimatedImpact: "Improves visibility and response time",
      confidence: 81,
      payload: { unreadMessages },
      status: "pending_approval",
      scheduledFor: now.toISOString(),
      createdAt: now.toISOString(),
    });
  }

  if (pendingOrders > 0) {
    actions.push({
      id: `market_${userId}`,
      category: "update_pricing",
      title: `Review ${pendingOrders} pending order${pendingOrders === 1 ? "" : "s"}`,
      description: "Market has orders waiting for your attention.",
      layer: "Market",
      estimatedImpact: "Reduces fulfilment delay",
      confidence: 87,
      payload: { pendingOrders },
      status: "pending_approval",
      scheduledFor: now.toISOString(),
      createdAt: now.toISOString(),
    });
  }

  if (!actions.length && recentSkills.length > 0) {
    actions.push({
      id: `community_skill_${userId}`,
      category: "post_content",
      title: `Share your ${recentSkills[0]?.skill ?? "latest"} progress`,
      description: "NOVA can amplify your recent skill signals with a community post.",
      layer: "Community",
      estimatedImpact: "Boosts discovery and trust",
      confidence: 74,
      payload: { skill: recentSkills[0]?.skill ?? null },
      status: "pending_approval",
      scheduledFor: now.toISOString(),
      createdAt: now.toISOString(),
    });
  }

  return actions.slice(0, 3);
}

// GET /omega/analyze - Get comprehensive user analysis
router.get(
  "/analyze",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const tenantId = req.user!.tenantId;

      // Gather user data from all layers
      const [
        user,
        skills,
        certificates,
        enrollments,
        posts,
        followers,
        following,
        loopProgress,
      ] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.novaSkillDetection.findMany({
          where: { userId },
          orderBy: { confidence: "desc" },
          take: 10,
        }),
        prisma.certificate.findMany({ where: { userId } }),
        prisma.enrollment.findMany({
          where: { userId },
          include: { course: true },
        }),
        prisma.post.findMany({
          where: { authorId: userId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.follow.count({ where: { followingId: userId } }),
        prisma.follow.count({ where: { followerId: userId } }),
        prisma.agenticLoopProgress.findUnique({ where: { userId } }),
      ]);

      // Calculate trust score components
      const trustScoreComponents = {
        profileCompleteness: user?.name && user?.email ? 80 : 40,
        skillsDetected: Math.min(skills.length * 10, 30),
        certificatesEarned: certificates.length * 15,
        communityEngagement: Math.min(posts.length * 2, 20),
        networkSize: Math.min(followers * 0.5, 20),
      };

      const trustScore = Object.values(trustScoreComponents).reduce(
        (a, b) => a + b,
        0,
      );
      const onboardingSignals = readOnboardingSignals(user?.metadata);

      // Determine current loop stage
      let currentStage = "community";
      if (enrollments.some((e) => e.completedAt)) currentStage = "academy";
      if (loopProgress?.currentStage) currentStage = loopProgress.currentStage;

      // Generate AI insights using Claude
      const prompt = `You are OMEGA, the Winners Ecosystem Master Orchestrator.

Analyze this user's ecosystem profile and provide strategic insights:

USER PROFILE:
- Trust Score: ${trustScore}/100
- Skills Detected: ${skills.map(s => s.skill).join(", ") || "none"}
- Certificates: ${certificates.length}
- Courses Enrolled: ${enrollments.length}
- Posts: ${posts.length}
- Followers: ${followers}
- Following: ${following}
- Current Stage: ${currentStage}
- Onboarding Experience Level: ${onboardingSignals.experienceLevel ?? "unknown"}
- Onboarding Income Target: ${onboardingSignals.incomeTarget ?? "unknown"}
- Onboarding Primary Layer: ${onboardingSignals.primaryLayer ?? "unknown"}
- Onboarding Profile Type: ${onboardingSignals.profileType ?? "unknown"}
- Building Focus: ${onboardingSignals.buildingFocus ?? "unknown"}
- Market Focus: ${onboardingSignals.marketFocus.join(", ") || "unknown"}
- Onboarding Top Skills: ${onboardingSignals.topSkills.join(", ") || "unknown"}
- Market Currencies: ${onboardingSignals.marketSignals.currencies.join(", ")}
- Payment Recommendations: ${onboardingSignals.marketSignals.paymentRecommendations.join(", ")}
- Job Matching Pool: ${onboardingSignals.marketSignals.jobMatchingPool}
- Community Suggestions: ${onboardingSignals.marketSignals.communitySuggestions.join(", ") || "none"}
- Language Options: ${onboardingSignals.marketSignals.languageOptions.join(", ")}
- Seasonal Signals: ${onboardingSignals.marketSignals.seasonalSignals.join(", ") || "none"}

CALIBRATION:
${omegaCalibration(onboardingSignals.experienceLevel, onboardingSignals.incomeTarget, onboardingSignals.marketFocus)}

Provide a JSON response with:
{
  "strengths": ["top 3 strengths based on their data"],
  "opportunities": ["top 3 growth opportunities"],
  "nextBestAction": "one specific action they should take",
  "predictedOutcome": "what happens if they take that action",
  "ecosystemHealth": "excellent|good|needs_attention"
}`;
      const fallbackInsights = {
        strengths: ["Active community member"],
        opportunities: ["Complete more courses"],
        nextBestAction: "Post more content to get skills detected",
        predictedOutcome: "Higher trust score",
        ecosystemHealth: "good",
      };

      const insights = await callAnthropicAndParseJson(
        prompt,
        { model: "claude-sonnet-4-6", max_tokens: 800 },
        fallbackInsights,
      );

      res.json({
        userId,
        trustScore,
        trustScoreComponents,
        currentStage,
        skills,
        certificates: certificates.length,
        enrollments: enrollments.length,
        posts: posts.length,
        followers,
        following,
        onboardingSignals,
        insights,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Omega analyze error:", error);
      res.status(500).json({ error: "Failed to generate analysis" });
    }
  },
);

// GET /omega/briefing - Get personalized daily briefing
router.get(
  "/briefing",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const tenantId = req.user!.tenantId;
      const now = new Date();

      const cached = await prisma.oMEGABriefing.findUnique({
        where: { userId },
        select: {
          content: true,
          highlights: true,
          generatedAt: true,
          expiresAt: true,
        },
      });

      if (cached && cached.expiresAt > now) {
        return res.json({
          briefing: cached.content,
          recommendations: safeJsonArray<BriefingRecommendation>(cached.highlights).slice(0, 3),
          generatedAt: cached.generatedAt.toISOString(),
          expiresAt: cached.expiresAt.toISOString(),
          cached: true,
        } satisfies BriefingResponse);
      }

      const briefing = await generateOMEGABriefing(userId, tenantId);
      return res.json(briefing);
    } catch (error) {
      console.error("Omega briefing error:", error);
      res.status(500).json({ error: "Failed to generate briefing" });
    }
  },
);

router.get("/briefing/morning", authMiddleware, async (req: Request, res: Response) => {
  try {
    const briefing = await generateOMEGABriefing(req.user!.userId, req.user!.tenantId);
    return res.json(briefing);
  } catch (error) {
    console.error("Omega morning briefing error:", error);
    return res.status(500).json({ error: "Failed to generate morning briefing" });
  }
});

router.get(
  "/resumption",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const tenantId = req.user!.tenantId;
      const cards = await getResumptionCards(userId, tenantId);
      res.json({ cards });
    } catch (error) {
      console.error("Omega resumption error:", error);
      res.status(500).json({ error: "Failed to load resumption cards" });
    }
  },
);

router.get("/autonomous/pending", authMiddleware, async (req: Request, res: Response) => {
  try {
    const actions = await getPendingAutonomousActions(req.user!.userId, req.user!.tenantId);
    return res.json({ actions });
  } catch (error) {
    console.error("Omega autonomous pending error:", error);
    return res.status(500).json({ error: "Failed to load pending autonomous actions" });
  }
});

// GET /omega/health - Get ecosystem health metrics
router.get(
  "/health",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;

      // Get community health metrics
      const [totalUsers, activeUsers, totalPosts, totalSkills, avgTrustScore] =
        await Promise.all([
          prisma.user.count({ where: { tenantId } }),
          prisma.user.count({
            where: {
              tenantId,
              updatedAt: { gte: new Date(Date.now() - 7 * 86400000) },
            },
          }),
          prisma.post.count(),
          prisma.novaSkillDetection.count(),
          prisma.user.aggregate({
            where: { tenantId },
            _avg: { trustScore: true },
          }),
        ]);

      // Calculate health indicators
      const health = {
        community: {
          totalUsers,
          activeUsers,
          activeRatio: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
          status: activeUsers > 10 ? "healthy" : "growing",
        },
        engagement: {
          totalPosts,
          postsPerUser: totalUsers > 0 ? totalPosts / totalUsers : 0,
          status: totalPosts > 100 ? "healthy" : "needs_boost",
        },
        intelligence: {
          skillsDetected: totalSkills,
          avgTrustScore: avgTrustScore._avg.trustScore || 0,
          status: totalSkills > 50 ? "healthy" : "early",
        },
        overall:
          activeUsers > 10 && totalPosts > 50
            ? "excellent"
            : activeUsers > 5 && totalPosts > 20
              ? "good"
              : "developing",
      };

      res.json(health);
    } catch (error) {
      console.error("Omega health error:", error);
      res.status(500).json({ error: "Failed to get health metrics" });
    }
  },
);

// GET /omega/forecast - Get revenue/growth predictions
router.get(
  "/forecast",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;

      // Get user's business metrics
      const [skills, certificates, completedEnrollments, loopProgress] =
        await Promise.all([
          prisma.novaSkillDetection.findMany({
            where: { userId, confidence: { gte: 0.75 } },
            select: { skill: true },
          }),
          prisma.certificate.count({ where: { userId } }),
          prisma.enrollment.count({
            where: { userId, completedAt: { not: null } },
          }),
          prisma.agenticLoopProgress.findUnique({ where: { userId } }),
        ]);

      // Simple prediction model
      const skillCount = skills.length;
      const certCount = certificates;
      const courseCount = completedEnrollments;

      // Predict based on loop completion
      let stage = "starter";
      if (loopProgress?.currentStage === "academy") stage = "learner";
      if (loopProgress?.currentStage === "work") stage = "earner";
      if (loopProgress?.currentStage === "market") stage = "seller";

      const predictions = {
        currentStage: stage,
        trustScoreProjection: Math.min(
          100,
          30 + skillCount * 8 + certCount * 12,
        ),
        skillGrowthRate:
          skillCount > 0 ? "high" : skillCount > 3 ? "medium" : "building",
        revenuePotential:
          certCount > 2 ? "high" : certCount > 0 ? "medium" : "developing",
        timeline: {
          toIntermediate: courseCount >= 1 ? "achieved" : "2-4 weeks",
          toAdvanced: certCount >= 2 ? "achieved" : "1-3 months",
          toExpert: certCount >= 5 ? "achieved" : "3-6 months",
        },
        recommendations: [
          certCount === 0
            ? "Complete your first course to unlock work opportunities"
            : null,
          skillCount < 3 ? "Post more to let NOVA detect your skills" : null,
          !loopProgress ? "Start your Agentic Loop to accelerate growth" : null,
        ].filter(Boolean),
      };

      res.json(predictions);
    } catch (error) {
      console.error("Omega forecast error:", error);
      res.status(500).json({ error: "Failed to generate forecast" });
    }
  },
);

export default router;
