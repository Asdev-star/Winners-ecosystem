const fs = require("fs");
const path = require("path");

const repairs = [
  {
    packageName: "react-native-gesture-handler",
    sourceEntry: ["src", "index.ts"],
    commonJsEntry: ["lib", "commonjs", "index.js"],
  },
  {
    packageName: "react-native-screens",
    sourceEntry: ["src", "index.ts"],
    commonJsEntry: ["lib", "commonjs", "index.js"],
  },
];

let repairedPackages = 0;

for (const repair of repairs) {
  const packageRoot = path.join(__dirname, "..", "node_modules", repair.packageName);
  const sourceEntry = path.join(packageRoot, ...repair.sourceEntry);
  const sourceDir = path.dirname(sourceEntry);
  const commonJsEntry = path.join(packageRoot, ...repair.commonJsEntry);

  if (!fs.existsSync(packageRoot) || fs.existsSync(sourceEntry) || !fs.existsSync(commonJsEntry)) {
    continue;
  }

  const relativeCommonJs = path
    .relative(sourceDir, commonJsEntry)
    .replace(/\\/g, "/")
    .replace(/\.js$/, "");

  fs.mkdirSync(sourceDir, { recursive: true });
  fs.writeFileSync(
    sourceEntry,
    `export * from "${relativeCommonJs}";\nexport { default } from "${relativeCommonJs}";\n`,
    "utf8",
  );

  repairedPackages += 1;
  console.log(`Repaired ${repair.packageName} source entry for Metro.`);
}

if (!repairedPackages) {
  console.log("No React Native package source-entry repairs were needed.");
}
