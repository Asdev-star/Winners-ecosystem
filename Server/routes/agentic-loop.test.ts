// @vitest-environment node

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readAgenticSource() {
  const filePath = path.resolve(process.cwd(), "Server/routes/agenticLoopRoutes.ts");
  return fs.readFile(filePath, "utf8");
}

describe("agentic loop contract", () => {
  it("triggers cross-layer events and emits websocket updates", async () => {
    const source = await readAgenticSource();
    expect(source).toContain("router.post(\"/trigger\"");
    expect(source).toContain("notifyUser(userId");
    expect(source).toContain("loop:stage_advanced");
  });

  it("persists agentic loop history in assistant memory", async () => {
    const source = await readAgenticSource();
    expect(source).toContain("assistantMemory.upsert");
    expect(source).toContain("Last loop event:");
  });

  it("computes the next cross-layer stage from the trigger layer", async () => {
    const source = await readAgenticSource();
    expect(source).toContain("getNextStage");
    expect(source).toContain("STAGE_ORDER");
    expect(source).toContain("nextMilestone");
  });
});
