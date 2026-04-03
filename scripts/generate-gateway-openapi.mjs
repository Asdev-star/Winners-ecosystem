import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ROUTES_DIR = path.join(ROOT, "Server", "routes");
const OUTPUT_FILE = path.join(ROOT, "docs", "GATEWAY_OPENAPI_SPEC.json");

const ROUTE_MODULES = [
  { file: "authRoutes.ts", prefix: "/auth", tag: "Auth" },
  { file: "passwordResetRoutes.ts", prefix: "/auth", tag: "Auth" },
  { file: "healthRoutes.ts", prefix: "/health", tag: "Health" },
  { file: "tenantsRoutes.ts", prefix: "/tenants", tag: "Tenants" },
  { file: "usersRoutes.ts", prefix: "/users", tag: "Users" },
  { file: "analyticsRoutes.ts", prefix: "/analytics", tag: "Analytics" },
  { file: "exportRoutes.ts", prefix: "/export", tag: "Export" },
  { file: "billingRoutes.ts", prefix: "/billing", tag: "Billing" },
  { file: "aiRoutes.ts", prefix: "/ai", tag: "AI" },
  { file: "profileRoutes.ts", prefix: "/profile", tag: "Profile" },
  { file: "onboardingRoutes.ts", prefix: "/onboarding", tag: "Onboarding" },
  { file: "emailRoutes.ts", prefix: "/email", tag: "Email" },
  { file: "notificationRoutes.ts", prefix: "/notifications", tag: "Notifications" },
  { file: "stripeRoutes.ts", prefix: "/stripe", tag: "Stripe" },
  { file: "searchRoutes.ts", prefix: "/search", tag: "Search" },
  { file: "activityRoutes.ts", prefix: "/activity", tag: "Activity" },
  { file: "referralRoutes.ts", prefix: "/referral", tag: "Referral" },
  { file: "adminRoutes.ts", prefix: "/admin", tag: "Admin" },
  { file: "changelogRoutes.ts", prefix: "/changelog", tag: "Changelog" },
  { file: "twoFactorRoutes.ts", prefix: "/2fa", tag: "TwoFactor" },
  { file: "postRoutes.ts", prefix: "/posts", tag: "Posts" },
  { file: "groupRoutes.ts", prefix: "/groups", tag: "Groups" },
  { file: "gdprRoutes.ts", prefix: "/gdpr", tag: "GDPR" },
  { file: "slackRoutes.ts", prefix: "/slack", tag: "Slack" },
  { file: "ssoRoutes.ts", prefix: "/sso", tag: "SSO" },
  { file: "whitelabelRoutes.ts", prefix: "/whitelabel", tag: "WhiteLabel" },
  { file: "registryRoutes.ts", prefix: "/registry", tag: "Registry" },
  { file: "academyRoutes.ts", prefix: "/academy", tag: "Academy" },
  { file: "chatRoutes.ts", prefix: "/chat", tag: "Chat" },
  { file: "messageRoutes.ts", prefix: "/messages", tag: "Messages" },
  { file: "aiPlatformRoutes.ts", prefix: "/ai-platform", tag: "AI Platform" },
  { file: "liveSessionRoutes.ts", prefix: "/live-sessions", tag: "Live Sessions" },
  { file: "liveSpaceRoutes.ts", prefix: "/spaces", tag: "Spaces" },
  { file: "opportunityRoutes.ts", prefix: "/opportunities", tag: "Opportunities" },
  { file: "communityIntelligenceRoutes.ts", prefix: "/community", tag: "Community" },
  { file: "externalCourseRoutes.ts", prefix: "/external-courses", tag: "External Courses" },
  { file: "socialRoutes.ts", prefix: "/social", tag: "Social" },
  { file: "vendorRoutes.ts", prefix: "/vendors", tag: "Marketplace" },
  { file: "productRoutes.ts", prefix: "/products", tag: "Marketplace" },
  { file: "cartRoutes.ts", prefix: "/cart", tag: "Marketplace" },
  { file: "orderRoutes.ts", prefix: "/orders", tag: "Marketplace" },
  { file: "workRoutes.ts", prefix: "/work", tag: "Work" },
  { file: "quizRoutes.ts", prefix: "/quizzes", tag: "Academy" },
  { file: "lectureUploadRoutes.ts", prefix: "/lecture-uploads", tag: "Academy" },
  { file: "dropshipRoutes.ts", prefix: "/dropship", tag: "Marketplace" },
  { file: "financeRoutes.ts", prefix: "/finance", tag: "Marketplace" },
  { file: "checkoutRoutes.ts", prefix: "/checkout", tag: "Marketplace" },
  { file: "cloudRoutes.ts", prefix: "/cloud", tag: "Cloud" },
  { file: "studioRoutes.ts", prefix: "/studio", tag: "Studio" },
  { file: "omegaRoutes.ts", prefix: "/omega", tag: "Omega" },
  { file: "supervisorRoutes.ts", prefix: "/supervisors", tag: "Supervisors" },
  { file: "communityExtrasRoutes.ts", prefix: "/community-extras", tag: "Community" },
  { file: "autonomousRoutes.ts", prefix: "/insights", tag: "Insights" },
  { file: "agenticLoopRoutes.ts", prefix: "/agentic", tag: "Agentic" },
  { file: "creditRoutes.ts", prefix: "/credits", tag: "Billing" },
  { file: "escrowRoutes.ts", prefix: "/escrow", tag: "Work" },
  { file: "circuitRoutes.ts", prefix: "/circuit", tag: "Work" },
  { file: "atlasRoutes.ts", prefix: "/atlas", tag: "Atlas" },
  { file: "atlasMarketRoutes.ts", prefix: "/ai/atlas", tag: "Atlas" },
  { file: "connectorRoutes.ts", prefix: "/connectors", tag: "Cloud" },
  { file: "tradingRoutes.ts", prefix: "/trading", tag: "Trading" },
  { file: "pluginRoutes.ts", prefix: "/plugins", tag: "Cloud" },
  { file: "notificationTokenRoutes.ts", prefix: "/push-tokens", tag: "Notifications" },
];

const ROUTE_RE = /router\.(get|post|put|patch|delete)\(\s*(?:\r?\n\s*)?(["'`])([^"'`]+?)\2/gms;
const PUBLIC_PREFIXES = new Set(["/auth", "/health", "/registry"]);

function toOpenApiPath(prefix, routePath) {
  const joined = routePath === "/" ? prefix : `${prefix}${routePath}`;
  return joined.replace(/\/{2,}/g, "/").replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function toOperationId(method, fullPath) {
  return `${method}_${fullPath}`
    .replace(/[{}]/g, "")
    .replace(/[^A-Za-z0-9]+([A-Za-z0-9])/g, (_, c) => c.toUpperCase())
    .replace(/^[^A-Za-z]+/, "");
}

function tagFromPrefix(prefix) {
  const found = ROUTE_MODULES.find((entry) => entry.prefix === prefix);
  return found?.tag ?? prefix.replace(/^\//, "").split("/")[0];
}

async function readRouteDefinitions() {
  const paths = {};
  const tags = new Set();

  for (const module of ROUTE_MODULES) {
    const filePath = path.join(ROUTES_DIR, module.file);
    const source = await readFile(filePath, "utf8");
    tags.add(module.tag);

    for (const match of source.matchAll(ROUTE_RE)) {
      const method = match[1].toLowerCase();
      const routePath = match[3];
      const fullPath = toOpenApiPath(module.prefix, routePath);
      const operationId = toOperationId(method, fullPath);
      const existing = paths[fullPath] ?? {};
      const parameters = [...fullPath.matchAll(/\{([^}]+)\}/g)].map((m) => ({
        name: m[1],
        in: "path",
        required: true,
        schema: { type: "string" },
      }));

      existing[method] = {
        tags: [tagFromPrefix(module.prefix)],
        summary: `${method.toUpperCase()} ${fullPath}`,
        operationId,
        parameters,
        ...(method === "get" || method === "delete"
          ? {}
          : {
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      additionalProperties: true,
                    },
                  },
                },
              },
            }),
        responses: {
          200: {
            description: "Success",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GenericObject" },
              },
            },
          },
          400: { description: "Bad request" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Not found" },
          500: { description: "Server error" },
        },
      };

      if (PUBLIC_PREFIXES.has(module.prefix) && (module.prefix !== "/auth" || ["/register", "/login", "/refresh", "/google", "/google/callback", "/google/exchange", "/facebook", "/facebook/callback", "/facebook/exchange"].some((suffix) => fullPath.startsWith(`${module.prefix}${suffix}`)))) {
        existing[method].security = [];
      }

      paths[fullPath] = existing;
    }
  }

  return { paths, tags: Array.from(tags).sort() };
}

async function main() {
  const { paths, tags } = await readRouteDefinitions();

  const doc = {
    openapi: "3.0.3",
    info: {
      title: "Winners Ecosystem Gateway API",
      description: "Full REST gateway for the Winners Ecosystem. Covers auth, tenants, academy, social, work, cloud, admin, and controller surfaces.",
      version: "1.0.0",
      contact: {
        name: "Winners Ecosystem Support",
        email: "support@winnersempire.io",
        url: "https://docs.winnersempire.io",
      },
    },
    servers: [
      { url: "https://winners-empire-eco.up.railway.app/api/v1", description: "Production" },
      { url: "http://localhost:3001/api/v1", description: "Development" },
    ],
    tags: tags.map((name) => ({ name })),
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    paths,
    components: {
      schemas: {
        GenericObject: {
          type: "object",
          additionalProperties: true,
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
    },
  };

  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
