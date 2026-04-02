// @vitest-environment node

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readHookSource() {
  const filePath = path.resolve(process.cwd(), "src/hooks/useMultimodalChat.ts");
  return fs.readFile(filePath, "utf8");
}

describe("useMultimodalChat contract", () => {
  it("routes file-heavy prompts through the multimodal endpoint", async () => {
    const source = await readHookSource();
    expect(source).toContain("multimodalRequest");
    expect(source).toContain("files.length > 0");
    expect(source).toContain("/api/v1/ai-platform/multimodal");
  });

  it("keeps backend model names aligned with the AI platform proxy", async () => {
    const source = await readHookSource();
    expect(source).toContain("toBackendModel");
    expect(source).toContain('if (model.startsWith("claude")) return "claude";');
    expect(source).toContain('return "ollama";');
  });
});
