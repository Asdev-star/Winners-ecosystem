// @vitest-environment node

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readCourseCreateSource() {
  const filePath = path.resolve(process.cwd(), "src/features/academy/CourseCreatePage.tsx");
  return fs.readFile(filePath, "utf8");
}

describe("CourseCreatePage academy media contract", () => {
  it("uses the Cloudinary video uploader for preview videos", async () => {
    const source = await readCourseCreateSource();
    expect(source).toContain('import VideoUploader from "./components/VideoUploader";');
    expect(source).toContain("<VideoUploader");
    expect(source).toContain("Cloudinary-hosted course trailer");
  });
});
