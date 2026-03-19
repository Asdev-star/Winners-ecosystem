import { defineConfig } from "prisma/config";
import "dotenv/config";

function normalizeDatasourceUrl(rawUrl?: string) {
  if (!rawUrl) {
    return undefined;
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

const datasourceUrl = normalizeDatasourceUrl(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

export default defineConfig({
  ...(datasourceUrl
    ? {
        datasource: {
          url: datasourceUrl,
        },
      }
    : {}),
});
