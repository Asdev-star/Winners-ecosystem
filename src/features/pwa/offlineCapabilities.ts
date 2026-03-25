export const offlineCapabilities = {
  alwaysAvailable: [
    "Recently viewed Academy lessons",
    "Community feed (read-only)",
    "User profile and Trust Score",
    "Downloaded course content",
    "OMEGA's last daily briefing",
    "Job listings viewed in the last 7 days",
    "Notification history",
  ],
  degraded: [
    "Post a community update",
    "Like or comment on community content",
    "Submit a job application",
    "Send a direct message",
  ],
  unavailable: [
    "AI supervisor chat",
    "New course enrollment",
    "Market checkout",
    "Real-time Socket.io events",
  ],
  heraldMonitors: [
    "Offline queue depth",
    "Sync success rate",
    "Cache hit rate",
  ],
} as const;
