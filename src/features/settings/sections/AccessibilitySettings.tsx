const ACCESSIBILITY_SETTINGS = {
  textSize: {
    label: "Text Size",
    type: "slider",
    options: ["Small", "Default", "Large", "Extra Large"],
    current: "Default",
  },
  reduceMotion: { type: "toggle", label: "Reduce Motion", desc: "Minimise animations", current: false },
  highContrast: { type: "toggle", label: "High Contrast Mode", current: false },
  screenReader: { type: "toggle", label: "Screen Reader Optimisation", current: false },
};

export default ACCESSIBILITY_SETTINGS;
