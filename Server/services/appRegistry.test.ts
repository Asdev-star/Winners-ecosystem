// @vitest-environment node

import { describe, expect, it } from "vitest";
import AppRegistry from "./appRegistry.js";

describe("AppRegistry", () => {
  it("returns a consistent summary of registered apps", () => {
    const summary = AppRegistry.summary();

    expect(summary.totalApps).toBeGreaterThan(0);
    expect(summary.apps.length).toBe(summary.totalApps);
    expect(summary.liveApps).toBe(summary.apps.filter((app) => app.status === "live").length);
    expect(summary.apps.some((app) => app.id === "core")).toBe(true);
    expect(summary.apps.some((app) => app.id === "community")).toBe(true);
  });

  it("exposes dependency health and unknown app failures", () => {
    const academyDeps = AppRegistry.checkDependencies("academy");
    expect(academyDeps.ready).toBe(academyDeps.missing.length === 0);

    const unknownDeps = AppRegistry.checkDependencies("not_registered");
    expect(unknownDeps.ready).toBe(false);
    expect(unknownDeps.missing).toEqual(["not_registered"]);
  });
});
