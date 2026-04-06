import "dotenv/config";
import { Client } from "pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DIRECT_URL or DATABASE_URL.");
  process.exit(1);
}

const expectedTables = [
  "users",
  "invites",
  "revenue_records",
  "analytics_events",
  "referral_credits",
  "posts",
  "groups",
  "privacy_acknowledgments",
  "courses",
];

const client = new Client({ connectionString });

try {
  await client.connect();

  const result = await client.query(
    "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );

  const rows = result.rows;
  const tableMap = new Map(rows.map((row) => [row.tablename, row]));
  const missing = expectedTables.filter((table) => !tableMap.has(table));
  const disabled = expectedTables.filter((table) => tableMap.get(table)?.rowsecurity !== true);

  console.log(JSON.stringify(rows, null, 2));

  if (missing.length || disabled.length) {
    console.error(
      JSON.stringify(
        {
          missing,
          disabled,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  console.log("RLS verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
} finally {
  await client.end().catch(() => undefined);
}
