import { defineConfig } from "prisma/config";
import "dotenv/config";

function normalizeDatasourceUrl(rawUrl?: string) {
  if (!rawUrl) {
    throw new Error("DATABASE_URL is required");
  }

  try {
    const url = new URL(rawUrl);

    if (url.hostname.endsWith(".proxy.rlwy.net") && !url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "no-verify");
    } else if (url.hostname.endsWith(".rlwy.net") && !url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

export default defineConfig({
  datasource: {
    url: normalizeDatasourceUrl(process.env.DIRECT_URL ?? process.env.DATABASE_URL),
  },
});
