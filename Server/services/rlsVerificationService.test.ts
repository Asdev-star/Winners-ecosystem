// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.hoisted(() => vi.fn());

vi.mock("../db.js", () => ({
  default: {
    $queryRaw: queryRaw,
  },
}));

import { getExpectedRlsPolicies, verifyRlsPolicies } from "./rlsVerificationService.js";

describe("rlsVerificationService", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("lists the expected policies", () => {
    expect(getExpectedRlsPolicies()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tableName: "users", policyName: "users_tenant_isolation" }),
        expect.objectContaining({ tableName: "posts", policyName: "posts_tenant_isolation" }),
      ]),
    );
  });

  it("reports a passing verification when the policies exist and RLS is enabled", async () => {
    queryRaw
      .mockResolvedValueOnce([
        { tablename: "users", relrowsecurity: true },
        { tablename: "posts", relrowsecurity: true },
        { tablename: "courses", relrowsecurity: true },
        { tablename: "groups", relrowsecurity: true },
        { tablename: "invites", relrowsecurity: true },
        { tablename: "revenue_records", relrowsecurity: true },
        { tablename: "analytics_events", relrowsecurity: true },
        { tablename: "referral_credits", relrowsecurity: true },
        { tablename: "privacy_acknowledgments", relrowsecurity: true },
      ])
      .mockResolvedValueOnce([
        { tablename: "users", policyname: "users_tenant_isolation" },
        { tablename: "posts", policyname: "posts_tenant_isolation" },
        { tablename: "courses", policyname: "courses_tenant_isolation" },
        { tablename: "groups", policyname: "groups_tenant_isolation" },
        { tablename: "invites", policyname: "invites_tenant_isolation" },
        { tablename: "revenue_records", policyname: "revenue_records_tenant_isolation" },
        { tablename: "analytics_events", policyname: "analytics_events_tenant_isolation" },
        { tablename: "referral_credits", policyname: "referral_credits_tenant_isolation" },
        { tablename: "privacy_acknowledgments", policyname: "privacy_ack_tenant_isolation" },
      ]);

    const result = await verifyRlsPolicies();

    expect(result.passed).toBe(true);
    expect(result.tables).toHaveLength(9);
    expect(result.summary).toContain("Verified 9 tenant-scoped RLS policies");
  });

  it("reports a failing verification when a policy is missing", async () => {
    queryRaw
      .mockResolvedValueOnce([
        { tablename: "users", relrowsecurity: true },
        { tablename: "posts", relrowsecurity: true },
      ])
      .mockResolvedValueOnce([
        { tablename: "users", policyname: "users_tenant_isolation" },
      ]);

    const result = await verifyRlsPolicies();

    expect(result.passed).toBe(false);
    expect(result.summary).toContain("RLS verification found gaps");
    expect(result.tables.find((table) => table.tableName === "posts")?.policyExists).toBe(false);
  });
});
