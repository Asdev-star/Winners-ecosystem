export type OnboardingProfileType =
  | "creator"
  | "freelancer"
  | "entrepreneur"
  | "learner"
  | "vendor"
  | "developer"
  | "marketer"
  | "explorer";

export interface OnboardingAnswers {
  q1?: string | null;
  q2?: string | null;
  q3?: string | null;
  q4?: string | null;
  q5?: string[] | null;
  q6?: string[] | null;
  q7?: string | null;
}

export const PROFILE_TO_PLATFORM: Record<OnboardingProfileType, string> = {
  creator: "community",
  freelancer: "work",
  entrepreneur: "market",
  learner: "academy",
  vendor: "market",
  developer: "cloud",
  marketer: "market",
  explorer: "community",
};

export const PLATFORM_TO_PATH: Record<string, string> = {
  community: "/community",
  work: "/work/jobs",
  market: "/market/vendor",
  academy: "/academy",
  cloud: "/cloud",
  intelligence: "/intelligence",
};

const PLATFORM_TO_SUPERVISOR: Record<string, string> = {
  community: "NOVA",
  work: "CIRCUIT",
  market: "ATLAS",
  academy: "SAGE",
  cloud: "NEXUS",
  intelligence: "FORGE",
};

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStringArray(value: unknown, limit = 5): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, limit);
}

export function normalizeRole(value: unknown): string | null {
  const role = normalizeString(value)?.toLowerCase();
  if (!role) return null;
  if (role.includes("vendor")) return "vendor_seller";
  return role.replace(/\s+/g, "_");
}

export function normalizeIncomeGoal(value: unknown): string | null {
  const goal = normalizeString(value)?.toLowerCase();
  if (!goal) return null;
  if (goal.includes("extra income")) return "extra";
  if (goal.includes("side income")) return "side";
  if (goal.includes("full-time income")) return "fulltime";
  if (goal.includes("scale income")) return "scale";
  if (goal.includes("serious scale")) return "serious";
  if (goal.includes("not focused")) return "none";
  return null;
}

export function normalizeExperienceLevel(value: unknown): string | null {
  const level = normalizeString(value)?.toLowerCase();
  if (!level) return null;
  if (level.includes("just starting")) return "beginner";
  if (level.includes("some experience")) return "intermediate";
  if (level.includes("established")) return "established";
  if (level.includes("expert")) return "expert";
  return null;
}

export function normalizeTeamType(value: unknown): string | null {
  const team = normalizeString(value)?.toLowerCase();
  if (!team) return null;
  if (team.includes("solo")) return "solo";
  if (team.includes("small team")) return "team";
  if (team.includes("organization") || team.includes("organisation")) return "organisation";
  return null;
}

export function normalizeProfileType(value: unknown): OnboardingProfileType | null {
  const raw = normalizeString(value)?.toLowerCase();
  if (!raw) return null;
  const normalized = raw.replace(/^the\s+/, "").replace(/\s+/g, "_");
  if (normalized === "vendor/seller" || normalized === "vendor_seller") return "vendor";
  if (normalized === "creator") return "creator";
  if (normalized === "freelancer") return "freelancer";
  if (normalized === "entrepreneur") return "entrepreneur";
  if (normalized === "learner") return "learner";
  if (normalized === "vendor") return "vendor";
  if (normalized === "developer") return "developer";
  if (normalized === "marketer") return "marketer";
  if (normalized === "explorer") return "explorer";
  return null;
}

export function profileTypeDisplay(profileType: OnboardingProfileType): string {
  switch (profileType) {
    case "creator":
      return "The Creator";
    case "freelancer":
      return "The Freelancer";
    case "entrepreneur":
      return "The Entrepreneur";
    case "learner":
      return "The Learner";
    case "vendor":
      return "The Vendor";
    case "developer":
      return "The Developer";
    case "marketer":
      return "The Marketer";
    default:
      return "The Explorer";
  }
}

export function classifyProfile(answers: OnboardingAnswers): OnboardingProfileType {
  const role = normalizeRole(answers.q2);
  const skills = normalizeStringArray(answers.q6, 8);
  const incomeGoal = normalizeIncomeGoal(answers.q4);
  const experienceLevel = normalizeExperienceLevel(answers.q3);

  if (role === "developer" || skills.includes("Software Development")) return "developer";
  if (role === "learner" || experienceLevel === "beginner") return "learner";
  if (role === "vendor_seller") return "vendor";
  if (role === "creator") return "creator";
  if (role === "freelancer") return "freelancer";
  if (role === "entrepreneur" && incomeGoal !== "none") return "entrepreneur";
  if (skills.includes("Marketing & Growth")) return "marketer";
  return "explorer";
}

export function buildOnboardingProfileFields(answers: OnboardingAnswers) {
  const profileType = classifyProfile(answers);
  const firstPlatform = PROFILE_TO_PLATFORM[profileType];
  const redirectPath = PLATFORM_TO_PATH[firstPlatform] ?? "/dashboard";

  return {
    profileType,
    profileTypeDisplay: profileTypeDisplay(profileType),
    primaryPlatform: firstPlatform,
    redirectPath,
    supervisor: PLATFORM_TO_SUPERVISOR[firstPlatform] ?? "OMEGA",
    omegaMission: normalizeString(answers.q1),
    incomeGoal: normalizeIncomeGoal(answers.q4),
    experienceLevel: normalizeExperienceLevel(answers.q3),
    primaryMarkets: normalizeStringArray(answers.q5, 5),
    primarySkills: normalizeStringArray(answers.q6, 5),
    teamType: normalizeTeamType(answers.q7),
    onboardingData: {
      q1: normalizeString(answers.q1),
      q2: normalizeString(answers.q2),
      q3: normalizeString(answers.q3),
      q4: normalizeString(answers.q4),
      q5: normalizeStringArray(answers.q5, 5),
      q6: normalizeStringArray(answers.q6, 5),
      q7: normalizeString(answers.q7),
    },
  };
}
