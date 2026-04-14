#!/bin/bash
# ── Lindcott Armory — One-command Android Deploy ──────────────────────────────
# Usage: ./deploy-android.sh
# Builds the web app, syncs to Android, builds signed AAB, uploads to Play Store
# Internal Testing track.
#
# Prerequisites:
#   - android/keystore.properties filled in with real passwords
#   - android/fastlane/play-store-key.json exists (Google Play API service account)
# ─────────────────────────────────────────────────────────────────────────────

set -e  # stop on any error

# Use Java 21 (required by Capacitor Android plugins)
export JAVA_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home -v 17 2>/dev/null)

echo "▶ [1/4] Building web bundle..."
npm run build

echo "▶ [2/4] Syncing to Android..."
npx cap sync android

echo "▶ [3/4] Building signed AAB + uploading to Play Store..."
cd android
fastlane deploy

echo ""
echo "✅ Done! New build is live on Play Store Internal Testing."
echo "   Testers will get the update automatically within a few minutes."
