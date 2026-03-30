const fs = require('fs');
const path = require('path');
const {
  withDangerousMod,
  withProjectBuildGradle,
} = require('@expo/config-plugins');

const GRADLE_VERSION = '8.13';
const AGP_VERSION = '8.7.3';
const KOTLIN_VERSION = '2.0.21';
const BUILD_TOOLS = '35.0.0';
const MIN_SDK = 24;
const COMPILE_SDK = 35;
const TARGET_SDK = 35;

function updateWrapper(contents) {
  const desired = `distributionUrl=https\\://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip`;
  if (contents.includes(desired)) {
    return contents;
  }
  if (/distributionUrl=.*$/m.test(contents)) {
    return contents.replace(/distributionUrl=.*$/m, desired);
  }
  return `${contents.trim()}\n${desired}\n`;
}

function updateBuildGradle(contents) {
  let next = contents;
  next = next.replace(/buildToolsVersion\s*=\s*["'][^"']+["']/, `buildToolsVersion = "${BUILD_TOOLS}"`);
  next = next.replace(/minSdkVersion\s*=\s*\d+/, `minSdkVersion = ${MIN_SDK}`);
  next = next.replace(/compileSdkVersion\s*=\s*\d+/, `compileSdkVersion = ${COMPILE_SDK}`);
  next = next.replace(/targetSdkVersion\s*=\s*\d+/, `targetSdkVersion = ${TARGET_SDK}`);
  next = next.replace(/kotlinVersion\s*=\s*["'][^"']+["']/, `kotlinVersion = "${KOTLIN_VERSION}"`);

  next = next.replace(
    /classpath\(['"]com\.android\.tools\.build:gradle:[^'"]+['"]\)/,
    `classpath('com.android.tools.build:gradle:${AGP_VERSION}')`
  );
  next = next.replace(
    /classpath\(['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin:[^'"]+['"]\)/,
    `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")`
  );

  return next;
}

module.exports = function withPinnedGradle(config) {
  config = withProjectBuildGradle(config, (config) => {
    config.modResults.contents = updateBuildGradle(config.modResults.contents);
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const wrapperPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle',
        'wrapper',
        'gradle-wrapper.properties'
      );
      const contents = fs.readFileSync(wrapperPath, 'utf8');
      const next = updateWrapper(contents);
      if (next !== contents) {
        fs.writeFileSync(wrapperPath, next);
      }
      return config;
    },
  ]);

  return config;
};
