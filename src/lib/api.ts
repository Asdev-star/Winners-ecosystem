// src/lib/api.ts
// Single source of truth for frontend API base URL.

const RAW_API_URL = import.meta.env.VITE_API_URL ?? "";
const NORMALIZED_API_URL = RAW_API_URL.trim().replace(/\/+$/, "");
const API_V1_PREFIX = "/api/v1";

export const API_BASE = NORMALIZED_API_URL.endsWith(API_V1_PREFIX)
  ? NORMALIZED_API_URL
  : `${NORMALIZED_API_URL}${API_V1_PREFIX}`;
