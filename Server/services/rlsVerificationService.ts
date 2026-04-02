import { Prisma } from "@prisma/client";
import db from "../db.js";

type RlsTableExpectation = {
  tableName: string;
  policyName: string;
};

type RlsTableStatus = RlsTableExpectation & {
  tableExists: boolean;
  rlsEnabled: boolean;
  policyExists: boolean;
};

export interface RlsVerificationResult {
  verifiedAt: string;
  passed: boolean;
  summary: string;
  tables: RlsTableStatus[];
}

const EXPECTED_RLS_POLICIES: RlsTableExpectation[] = [
  { tableName: "users", policyName: "users_tenant_isolation" },
  { tableName: "invites", policyName: "invites_tenant_isolation" },
  { tableName: "revenue_records", policyName: "revenue_records_tenant_isolation" },
  { tableName: "analytics_events", policyName: "analytics_events_tenant_isolation" },
  { tableName: "referral_credits", policyName: "referral_credits_tenant_isolation" },
  { tableName: "posts", policyName: "posts_tenant_isolation" },
  { tableName: "groups", policyName: "groups_tenant_isolation" },
  { tableName: "privacy_acknowledgments", policyName: "privacy_ack_tenant_isolation" },
  { tableName: "courses", policyName: "courses_tenant_isolation" },
];

function formatSummary(tables: RlsTableStatus[]) {
  const missing = tables.filter((table) => !table.tableExists || !table.rlsEnabled || !table.policyExists);
  if (missing.length === 0) {
    return `Verified ${tables.length} tenant-scoped RLS policies on ${new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}.`;
  }

  const missingLabels = missing
    .map((table) => {
      if (!table.tableExists) return `${table.tableName} table is missing`;
      if (!table.rlsEnabled) return `${table.tableName} RLS is disabled`;
      return `${table.policyName} is missing`;
    })
    .join("; ");

  return `RLS verification found gaps: ${missingLabels}.`;
}

export async function verifyRlsPolicies(): Promise<RlsVerificationResult> {
  const tableNames = EXPECTED_RLS_POLICIES.map((policy) => policy.tableName);

  const [tableRows, policyRows] = await Promise.all([
    db.$queryRaw<Array<{ tablename: string; relrowsecurity: boolean }>>(Prisma.sql`
      SELECT c.relname AS tablename, c.relrowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = current_schema()
        AND c.relkind = 'r'
        AND c.relname IN (${Prisma.join(tableNames)})
    `),
    db.$queryRaw<Array<{ tablename: string; policyname: string }>>(Prisma.sql`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = current_schema()
        AND tablename IN (${Prisma.join(tableNames)})
    `),
  ]);

  const tableMap = new Map(tableRows.map((row) => [row.tablename, row]));
  const policyMap = new Map(policyRows.map((row) => [row.tablename, row.policyname]));

  const tables = EXPECTED_RLS_POLICIES.map<RlsTableStatus>((expected) => {
    const tableRow = tableMap.get(expected.tableName);
    return {
      ...expected,
      tableExists: Boolean(tableRow),
      rlsEnabled: tableRow?.relrowsecurity === true,
      policyExists: policyMap.get(expected.tableName) === expected.policyName,
    };
  });

  return {
    verifiedAt: new Date().toISOString(),
    passed: tables.every((table) => table.tableExists && table.rlsEnabled && table.policyExists),
    summary: formatSummary(tables),
    tables,
  };
}

export function getExpectedRlsPolicies() {
  return [...EXPECTED_RLS_POLICIES];
}
