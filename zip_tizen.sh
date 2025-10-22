#!/usr/bin/env bash
# Create Samsung-My-TV.zip from the Samsung-My-TV directory at repo root.
# Requires: zip (macOS/Linux)
set -euo pipefail

SRC_DIR="Samsung-My-TV"
OUT_ZIP="Samsung-My-TV.zip"

if [ ! -d "$SRC_DIR" ]; then
  echo "Error: Directory '$SRC_DIR' not found in current path: $(pwd)"
  exit 1
fi

# Overwrite if exists
if [ -f "$OUT_ZIP" ]; then
  rm -f "$OUT_ZIP"
fi

echo "Zipping '$SRC_DIR' -> '$OUT_ZIP' ..."
zip -r "$OUT_ZIP" "$SRC_DIR" >/dev/null

echo "Done. Find the archive at: $(pwd)/$OUT_ZIP"
