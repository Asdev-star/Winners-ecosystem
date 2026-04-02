// prisma/seeds/connectors.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

const CONNECTORS = [
  {
    id: "mpesa",
    name: "M-Pesa",
    slug: "mpesa",
    description: "Kenya's leading mobile money — payments, STK Push, C2B, B2C",
    logoUrl: "",
    category: "Payments",
    authType: "api_key",
    tier: "community",
    price: 0,
    published: true,
    verified: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    slug: "stripe",
    description: "Global payments — cards, subscriptions, Stripe Connect payouts",
    logoUrl: "",
    category: "Payments",
    authType: "oauth2",
    tier: "community",
    price: 0,
    published: true,
    verified: true,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    slug: "hubspot",
    description: "CRM — contacts, deals, pipelines, marketing automation",
    logoUrl: "",
    category: "CRM",
    authType: "oauth2",
    tier: "community",
    price: 0,
    published: true,
    verified: true,
  },
  {
    id: "google_workspace",
    name: "Google Workspace",
    slug: "google_workspace",
    description: "Gmail, Calendar, Drive, Sheets, Docs automation",
    logoUrl: "",
    category: "Productivity",
    authType: "oauth2",
    tier: "community",
    price: 0,
    published: true,
    verified: true,
  },
  {
    id: "slack",
    name: "Slack",
    slug: "slack",
    description: "Team messaging — send messages, create channels, manage users",
    logoUrl: "",
    category: "Communication",
    authType: "oauth2",
    tier: "community",
    price: 0,
    published: true,
    verified: true,
  },
];

async function main() {
  console.log("Seeding connectors...");

  for (const connector of CONNECTORS) {
    await db.connector.upsert({
      where: { slug: connector.slug },
      update: connector,
      create: connector,
    });
    console.log(`✓ Created/updated connector: ${connector.name}`);
  }

  console.log("Connector seed complete!");
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());