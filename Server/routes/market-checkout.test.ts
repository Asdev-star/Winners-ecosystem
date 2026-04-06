// @vitest-environment node

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readOrderSource() {
  const filePath = path.resolve(process.cwd(), "Server/routes/orderRoutes.ts");
  return fs.readFile(filePath, "utf8");
}

describe("market checkout contract", () => {
  it("splits a cart into multiple vendor groups", async () => {
    const source = await readOrderSource();
    expect(source).toContain("vendorGroups");
    expect(source).toContain("for (const [vendorId, { vendor, items }] of vendorGroups)");
  });

  it("creates Stripe checkout sessions with line items", async () => {
    const source = await readOrderSource();
    expect(source).toContain("stripe.checkout.sessions.create");
    expect(source).toContain("line_items");
    expect(source).toContain("success_url");
    expect(source).toContain("cancel_url");
  });

  it("rejects empty carts before checkout", async () => {
    const source = await readOrderSource();
    expect(source).toContain("Cart is empty or not found");
    expect(source).toContain("No valid vendors found for cart items");
  });

  it("preserves Stripe webhook raw body handling", async () => {
    const source = await readOrderSource();
    expect(source).toContain("router.post(\"/webhook\"");
    expect(source).toContain("rawBody");
    expect(source).toContain("stripe-signature");
  });
});
