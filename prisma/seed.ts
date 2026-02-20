// prisma/seed.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Winners Ecosystem...");
  await db.analyticsEvent.deleteMany();
  await db.revenueRecord.deleteMany();
  await db.invite.deleteMany();
  await db.user.deleteMany();
  await db.tenant.deleteMany();

  const tenant = await db.tenant.create({
    data: { id: "tenant_001", name: "Winners Corp", plan: "PRO", timezone: "UTC", currency: "USD", fiscalMonth: 1 },
  });

  const hashedPassword = await bcrypt.hash("demo1234", 10);
  await Promise.all([
    db.user.create({ data: { id: "user_001", tenantId: tenant.id, email: "demo@winners.io",  name: "Demo User",   password: hashedPassword, role: "OWNER"  } }),
    db.user.create({ data: { id: "user_002", tenantId: tenant.id, email: "alice@winners.io", name: "Alice Smith", password: hashedPassword, role: "ADMIN"  } }),
    db.user.create({ data: { id: "user_003", tenantId: tenant.id, email: "bob@winners.io",   name: "Bob Jones",   password: hashedPassword, role: "MEMBER" } }),
    db.user.create({ data: { id: "user_004", tenantId: tenant.id, email: "carol@winners.io", name: "Carol Wu",    password: hashedPassword, role: "VIEWER" } }),
  ]);

  const now = new Date();
  const revenueData = [];
  const eventData = [];

  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const trend = (90 - i) / 90;
    const noise = (Math.random() - 0.48) * 0.18;
    const spike = Math.random() > 0.91 ? 1.45 : 1;
    revenueData.push({ tenantId: tenant.id, date, amount: Math.round(4200 * (1 + trend * 0.35 + noise) * spike), source: "organic" });
    eventData.push({ tenantId: tenant.id, date, eventType: "pageview", count: Math.round(140 * (1 + trend * 0.25 + noise)) });
  }

  await db.revenueRecord.createMany({ data: revenueData });
  await db.analyticsEvent.createMany({ data: eventData });

  console.log("Seed complete! Login: demo@winners.io / demo1234");
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());