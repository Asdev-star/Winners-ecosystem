import { COMMUNITY_SETTINGS } from "./PlatformBehaviorSettings";

export const COMMUNITY_SECTIONS = [
  { id: "feed", label: "Feed", title: "Feed", keys: ["feedAlgorithm"] },
  { id: "nova", label: "NOVA", title: "NOVA", keys: ["novaSkillDetection"] },
  { id: "privacy", label: "Privacy", title: "Privacy", keys: ["whoCanDm", "whoCanSeeActivity"] },
  { id: "notifications", label: "Notifications", title: "Notifications", keys: ["notifyNewFollower", "notifyPostLike", "notifyPostComment", "notifyGroupActivity", "notifyMentions"] },
];

export const COMMUNITY_BRANCH = {
  key: "community",
  icon: "👥",
  navLabel: "Community",
  path: "/settings/community",
  title: "Community Settings",
  kicker: "Social layer",
  description: "Feed preferences, privacy, NOVA behavior, group notifications, and creator monetisation.",
  settings: COMMUNITY_SETTINGS,
  sections: COMMUNITY_SECTIONS,
};

export default COMMUNITY_SETTINGS;
