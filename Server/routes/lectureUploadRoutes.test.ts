// @vitest-environment node

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readSource() {
  const filePath = path.resolve(process.cwd(), "Server/routes/lectureUploadRoutes.ts");
  return fs.readFile(filePath, "utf8");
}

describe("lectureUploadRoutes contract", () => {
  it("supports attaching a direct Cloudinary upload result", async () => {
    const source = await readSource();
    expect(source).toContain("cloudinaryUrl");
    expect(source).toContain("Video data or cloudinaryUrl is required");
    expect(source).toContain("fileUrl: secureUrl");
  });
});
