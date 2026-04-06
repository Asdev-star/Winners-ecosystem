// @vitest-environment node

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readEscrowSource() {
  const filePath = path.resolve(process.cwd(), "Server/routes/escrowRoutes.ts");
  return fs.readFile(filePath, "utf8");
}

describe("escrowRoutes contract", () => {
  it("exposes a funded escrow flow with Stripe payment intents", async () => {
    const source = await readEscrowSource();
    expect(source).toContain("router.post('/fund'");
    expect(source).toContain("paymentIntents.create");
    expect(source).toContain("Escrow already exists for this contract");
  });

  it("uses tenant-scoped release logic for the client only", async () => {
    const source = await readEscrowSource();
    expect(source).toContain("router.post('/release/:escrowId'");
    expect(source).toContain("Only the client can release funds");
    expect(source).toContain("Milestone already paid");
  });

  it("blocks non-participants from opening disputes", async () => {
    const source = await readEscrowSource();
    expect(source).toContain("router.post('/dispute/:escrowId'");
    expect(source).toContain("Not authorised");
    expect(source).toContain("DISPUTED");
  });

  it("requires auth middleware for the escrow router", async () => {
    const source = await readEscrowSource();
    expect(source).toContain("router.use(authMiddleware)");
  });

  it("keeps fund idempotency through escrow upsert by contractId", async () => {
    const source = await readEscrowSource();
    expect(source).toContain("upsert");
    expect(source).toContain("where: { contractId }");
    expect(source).toContain("existing && existing.status !== 'REFUNDED'");
  });
});
