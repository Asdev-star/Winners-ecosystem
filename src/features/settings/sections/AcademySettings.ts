import { ACADEMY_SETTINGS } from "./PlatformBehaviorSettings";

export const ACADEMY_SECTIONS = [
  { id: "sage", label: "SAGE", title: "SAGE", keys: ["sageTutorStyle"] },
  { id: "study", label: "Study", title: "Study Reminders", keys: ["studyRemindersEnabled", "studyReminderTime", "studyGoalMinutes"] },
  { id: "offline", label: "Offline", title: "Offline", keys: ["autoDownloadEnabled", "offlineStorageLimit"] },
  { id: "certificates", label: "Certificates", title: "Certificates", keys: ["notifyCertificate", "autoCvUpdate"] },
];

export const ACADEMY_BRANCH = {
  key: "academy",
  icon: "🎓",
  navLabel: "Academy",
  path: "/settings/academy",
  title: "Academy Settings",
  kicker: "Learning layer",
  description: "Learning preferences, SAGE AI tutor behavior, certificate notifications, study reminders, and offline downloads.",
  settings: ACADEMY_SETTINGS,
  sections: ACADEMY_SECTIONS,
};

export default ACADEMY_SETTINGS;
