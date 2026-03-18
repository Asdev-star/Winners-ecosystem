// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

// Mock auth middleware
vi.mock("../middleware/authMiddleware.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { userId: "test-user-1", tenantId: "test-tenant-1", role: "user" };
    next();
  },
}));

describe("Post Routes Security Contract", () => {
  it("PATCH /posts/:id enforces tenantId scoping", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/postRoutes.ts"),
      "utf8"
    );
    
    // Verify tenantId is in the WHERE clause for update
    expect(source).toContain('where: { id: postId, tenantId }');
  });

  it("DELETE /posts/:id enforces tenantId scoping", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/postRoutes.ts"),
      "utf8"
    );
    
    // Verify tenantId is checked before delete
    expect(source).toContain('where: { id: postId, tenantId, deletedAt: null }');
  });

  it("DELETE comments enforces tenantId scoping", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/postRoutes.ts"),
      "utf8"
    );
    
    // Verify comment delete also checks tenantId
    expect(source).toContain('where: { id: commentId, postId, tenantId');
  });

  it("post routes require authentication", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/postRoutes.ts"),
      "utf8"
    );
    
    // Check authMiddleware is imported and used
    expect(source).toContain("import authMiddleware");
    expect(source).toContain("router.use(authMiddleware)");
  });

  it("POST /posts validates required fields", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/postRoutes.ts"),
      "utf8"
    );
    
    // Verify content validation exists
    expect(source).toContain("if (!content");
  });

  it("PUT /posts/:id/like properly scopes likes to tenant", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("path");
    const source = await fs.readFile(
      path.resolve(process.cwd(), "Server/routes/postRoutes.ts"),
      "utf8"
    );
    
    // Verify likes are tenant-scoped
    expect(source).toContain("userId_postId_tenantId");
  });
});