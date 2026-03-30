#!/usr/bin/env bash
set -euo pipefail

WRAPPER="android/gradle/wrapper/gradle-wrapper.properties"
if [ -f "$WRAPPER" ]; then
  sed -i 's#distributionUrl=.*#distributionUrl=https\://services.gradle.org/distributions/gradle-8.13-bin.zip#' "$WRAPPER"
fi