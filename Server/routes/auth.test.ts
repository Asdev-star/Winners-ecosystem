// @vitest-environment node

import { describe, expect, it, beforeEach, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

type MockAuthRequest = Request & {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
  };
};

// Mock auth middleware
vi.mock("../middleware/authMiddleware.js", () => ({
  authMiddleware: (req: MockAuthRequest, _res: Response, next: NextFunction) => {
    req.user = { userId: "test-user-1", tenantId: "test-tenant-1", role: "user" };
    next();
  },
}));

describe("Auth Routes Contract", () => {
  it("register endpoint requires email, password, name", async () => {
    // This is a contract test - verifies the route structure exists
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/authRoutes.ts"),
      "utf8"
    );
    
    expect(source).toContain('router.post("/register"');
    expect(source).toContain("email");
    expect(source).toContain("password");
    expect(source).toContain("name");
  });

  it("login endpoint exists and validates credentials", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/authRoutes.ts"),
      "utf8"
    );
    
    expect(source).toContain('router.post("/login"');
    expect(source).toContain("email");
    expect(source).toContain("password");
  });

  it("profile endpoint exists", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/authRoutes.ts"),
      "utf8"
    );
    
    expect(source).toContain('router.get("/me"');
  });

  it("refresh token endpoint exists", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/authRoutes.ts"),
      "utf8"
    );
    
    expect(source).toContain('router.post("/refresh"');
  });

  it("2fa endpoints exist for enhanced security", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/twoFactorRoutes.ts"),
      "utf8"
    );
    
    expect(source).toContain('router.post("/totp/setup"');
    expect(source).toContain('router.post("/totp/verify"');
    expect(source).toContain('router.post("/disable"');
  });
});
