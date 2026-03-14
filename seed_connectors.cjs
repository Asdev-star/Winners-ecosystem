require('dotenv/config');
const { Client } = require('pg');

const CONNECTORS = [
  { slug: 'mpesa', name: 'M-Pesa', desc: 'Safaricom M-Pesa mobile payments — Kenya and East Africa', cat: 'payments', auth: 'api_key', tier: 'community' },
  { slug: 'flutterwave', name: 'Flutterwave', desc: 'Pan-African payment gateway — cards, mobile money, bank transfers across 30+ countries', cat: 'payments', auth: 'api_key', tier: 'community' },
  { slug: 'paystack', name: 'Paystack', desc: 'Nigerian payment gateway — cards, bank transfer, USSD, QR code', cat: 'payments', auth: 'api_key', tier: 'community' },
  { slug: 'stripe', name: 'Stripe', desc: 'Global payment infrastructure — cards, subscriptions, payouts, Connect', cat: 'payments', auth: 'oauth2', tier: 'pro' },
  { slug: 'whatsapp', name: 'WhatsApp Business', desc: 'WhatsApp Business API — send messages, templates, media to 2B+ users', cat: 'communication', auth: 'api_key', tier: 'pro' },
  { slug: 'hubspot', name: 'HubSpot CRM', desc: 'Full CRM platform — contacts, deals, pipelines, email automation', cat: 'crm', auth: 'oauth2', tier: 'pro' },
  { slug: 'shopify', name: 'Shopify', desc: 'E-commerce platform — products, orders, customers, inventory sync', cat: 'ecommerce', auth: 'oauth2', tier: 'pro' },
  { slug: 'slack', name: 'Slack', desc: 'Team messaging — send messages, create channels, receive webhook events', cat: 'communication', auth: 'oauth2', tier: 'community' },
  { slug: 'mailchimp', name: 'Mailchimp', desc: 'Email marketing automation — lists, campaigns, analytics, automations', cat: 'marketing', auth: 'oauth2', tier: 'community' },
  { slug: 'google_workspace', name: 'Google Workspace', desc: 'Gmail, Drive, Calendar, Sheets — full Google productivity suite integration', cat: 'productivity', auth: 'oauth2', tier: 'pro' },
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to database');

  await client.query(`
    CREATE TABLE IF NOT EXISTS connectors (
      id TEXT NOT NULL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT NOT NULL,
      "logoUrl" TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      "authType" TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'community',
      price DOUBLE PRECISION NOT NULL DEFAULT 0,
      "installCount" INTEGER NOT NULL DEFAULT 0,
      rating DOUBLE PRECISION NOT NULL DEFAULT 0,
      "reviewCount" INTEGER NOT NULL DEFAULT 0,
      "developerId" TEXT,
      published BOOLEAN NOT NULL DEFAULT false,
      verified BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS connectors_slug_key ON connectors(slug)`);
  await client.query(`CREATE INDEX IF NOT EXISTS connectors_category_idx ON connectors(category)`);
  await client.query(`CREATE INDEX IF NOT EXISTS connectors_published_verified_idx ON connectors(published, verified)`);
  console.log('connectors table ready');

  let inserted = 0;
  let skipped = 0;

  for (const c of CONNECTORS) {
    const existing = await client.query('SELECT id FROM connectors WHERE slug = $1', [c.slug]);
    if (existing.rows.length > 0) {
      console.log(`SKIP: ${c.slug}`);
      skipped++;
      continue;
    }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    await client.query(
      `INSERT INTO connectors (id, name, slug, description, "logoUrl", category, "authType", tier, price, "installCount", rating, "reviewCount", published, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, 0, true, true)`,
      [id, c.name, c.slug, c.desc, '', c.cat, c.auth, c.tier]
    );
    console.log(`INSERT: ${c.slug}`);
    inserted++;
  }

  await client.end();
  console.log(`Done — inserted: ${inserted}, skipped: ${skipped}`);
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
