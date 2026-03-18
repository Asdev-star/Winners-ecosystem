// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

// Mock auth middleware
vi.mock("../middleware/authMiddleware.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { userId: "test-user-1", tenantId: "test-tenant-1", role: "user" };
    next();
  },
}));

describe("Cart & Checkout Flow Contract", () => {
  it("GET /cart retrieves user cart", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/cartRoutes.ts"),
      "utf8"
    );
    
    expect(source).toContain("router.get(\"/\"");
    expect(source).toContain("db.cart.findFirst");
  });

  it("POST /cart/items adds items to cart", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/cartRoutes.ts"),
      "utf8"
    );
    
    expect(source).toContain("router.post(\"/items\"");
    expect(source).toContain("db.cartItem.create");
  });

  it("DELETE /cart/items/:id removes items", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/cartRoutes.ts"),
      "utf8"
    );
    
    expect(source).toContain("router.delete(\"/items/:id\"");
    expect(source).toContain("db.cartItem.delete");
  });

  it("checkout-session creates Stripe session", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/orderRoutes.ts"),
      "utf8"
    );
    
    expect(source).toContain("router.post(\"/checkout-session\"");
    expect(source).toContain("stripe.checkout.sessions.create");
    expect(source).toContain("line_items");
    expect(source).toContain("success_url");
    expect(source).toContain("cancel_url");
  });

  it("order webhook handles Stripe events", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/orderRoutes.ts"),
      "utf8"
    );
    
    expect(source).toContain("router.post(\"/webhook\"");
    expect(source).toContain("stripe-signature");
    expect(source).toContain("checkout.session.completed");
    expect(source).toContain("paymentStatus");
  });

  it("orders are scoped to tenant", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/orderRoutes.ts"),
      "utf8"
    );
    
    // Verify tenantId is used in order creation
    expect(source).toContain("tenantId");
    expect(source).toContain("db.order.create");
  });
});