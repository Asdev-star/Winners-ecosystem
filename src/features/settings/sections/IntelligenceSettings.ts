import { INTELLIGENCE_SETTINGS } from "./PlatformBehaviorSettings";

export const INTELLIGENCE_SECTIONS = [
  { id: "omega", label: "OMEGA", title: "OMEGA Briefing", keys: ["omegaBriefingEnabled", "omegaBriefingTime", "omegaBriefingDepth"] },
  { id: "aria", label: "ARIA", title: "ARIA", keys: ["ariaPersonality", "ariaContextMemory"] },
  { id: "credits", label: "Credits", title: "Credits", keys: ["creditAlertThreshold", "showCreditUsage"] },
];

export const INTELLIGENCE_BRANCH = {
  key: "intelligence",
  icon: "🤖",
  navLabel: "Intelligence",
  path: "/settings/intelligence",
  title: "Intelligence Settings",
  kicker: "Supervisor layer",
  description: "OMEGA briefing schedule, ARIA chat preferences, AI credit usage, and supervisor interaction style.",
  settings: INTELLIGENCE_SETTINGS,
  sections: INTELLIGENCE_SECTIONS,
};

export default INTELLIGENCE_SETTINGS;
