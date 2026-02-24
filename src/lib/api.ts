// src/lib/api.ts
// Single source of truth for frontend API base URL.

const RAW_API_URL = import.meta.env.VITE_API_URL ?? "";
const NORMALIZED_API_URL = RAW_API_URL.replace(/\/$/, "");

export const API_BASE = `${NORMALIZED_API_URL}/api/v1`;

