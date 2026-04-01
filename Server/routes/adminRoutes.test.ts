// @vitest-environment node

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readAdminRoutesSource() {
  const filePath = path.resolve(process.cwd(), "Server/routes/adminRoutes.ts");
  return fs.readFile(filePath, "utf8");
}

describe("adminRoutes wiring contract", () => {
  it("keeps the canonical platform control endpoints mounted", async () => {
    const source = await readAdminRoutesSource();

    [
      'router.get("/platform/status"',
      'router.post("/platform/:id/launch"',
      'router.post("/platform/:id/suspend"',
      'router.post("/impersonate/:tenantId"',
    ].forEach((routeLine) => {
      expect(source).toContain(routeLine);
    });
  });

  it("keeps the admin operations endpoints mounted", async () => {
    const source = await readAdminRoutesSource();

    [
      'router.get("/revenue/breakdown"',
      'router.get("/health"',
      'router.get("/errors"',
      'router.post("/broadcast"',
      'router.get("/broadcasts"',
      'router.get("/actions"',
      'router.post("/forge/ask"',
      'router.get("/settings/core"',
      'router.post("/settings/core/recommendations/:id/apply"',
      'router.post("/settings/core/recommendations/:id/dismiss"',
      'router.post("/settings/core/auto"',
      'router.post("/settings/core/ask"',
      'router.get("/security/audit"',
    ].forEach((routeLine) => {
      expect(source).toContain(routeLine);
    });
  });

  it("keeps security session management wired for the admin page", async () => {
    const source = await readAdminRoutesSource();
    expect(source).toContain('router.get("/security/sessions"');
    expect(source).toContain('router.post("/security/sessions/:id/revoke"');
  });
});
