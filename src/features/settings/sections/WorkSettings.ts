import { WORK_SETTINGS } from "./PlatformBehaviorSettings";

export const WORK_SECTIONS = [
  { id: "availability", label: "Availability", title: "Availability", keys: ["availabilityStatus"] },
  { id: "circuit", label: "CIRCUIT", title: "CIRCUIT", keys: ["circuitJobMatching", "circuitProposalStyle", "circuitMatchThreshold"] },
  { id: "visibility", label: "Visibility", title: "Visibility", keys: ["showRateOnProfile", "showEarningsTotal", "acceptDirectContracts"] },
  { id: "notifications", label: "Notifications", title: "Notifications", keys: ["notifyJobMatch", "notifyContractUpdate", "notifyEscrowEvent"] },
];

export const WORK_BRANCH = {
  key: "work",
  icon: "💼",
  navLabel: "Work",
  path: "/settings/work",
  title: "Work Settings",
  kicker: "Talent layer",
  description: "Job preferences, CIRCUIT AI matching behavior, availability status, rate visibility, and contract notifications.",
  settings: WORK_SETTINGS,
  sections: WORK_SECTIONS,
};

export default WORK_SETTINGS;
