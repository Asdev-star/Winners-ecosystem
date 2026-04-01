const FORGE_INTELLIGENT_ENGINE = {
  forgeAutonomyMode: {
    label: "FORGE autonomy mode",
    description: "How aggressively FORGE should optimise platform experiments and model routing",
    options: ["observe", "assist", "optimise"],
    current: "assist",
    experimental: true,
  },
  forgeRoutingInsights: {
    label: "Expose routing insights",
    type: "toggle",
    current: true,
    experimental: true,
  },
};

export default FORGE_INTELLIGENT_ENGINE;
