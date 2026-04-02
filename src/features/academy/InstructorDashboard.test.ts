// @vitest-environment node

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readSource() {
  const filePath = path.resolve(process.cwd(), "src/features/academy/InstructorDashboard.tsx");
  return fs.readFile(filePath, "utf8");
}

describe("InstructorDashboard academy media contract", () => {
  it("exposes a lecture uploads tab", async () => {
    const source = await readSource();
    expect(source).toContain("LectureUploadPanel");
    expect(source).toContain("lectures");
    expect(source).toContain("Create a course first, then upload lecture videos into it.");
  });
});
