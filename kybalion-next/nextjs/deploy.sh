#!/bin/bash
# deploy.sh — Build Next.js static export and deploy to GitHub Pages
#
# This script:
#   1. Runs `npx next build` to generate static export in out/
#   2. Syncs out/ → local nextjs docs/ (working copy)
#   3. Syncs out/ → repo-root docs/ (what GitHub Pages serves)
#   4. Commits and pushes to origin/main
#
# GitHub Pages is configured to serve from the repo-root docs/ folder.
# The git repo root is at comms/ (two levels above this script).
#
# Usage:
#   cd kybalion-next/nextjs && bash deploy.sh
#   bash deploy.sh --skip-build   # Skip build, just sync and push

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NEXTJS_DIR="$SCRIPT_DIR"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Deploy: Next.js → GitHub Pages"
echo "  Next.js dir : $NEXTJS_DIR"
echo "  Repo root   : $REPO_ROOT"
echo "  Repo docs/  : $REPO_ROOT/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Build ──────────────────────────────────────────
if [[ "${1:-}" != "--skip-build" ]]; then
    echo ""
    echo "▶ Step 1: Building Next.js static export..."
    cd "$NEXTJS_DIR"
    npx next build
    echo "✅ Build complete → out/"
else
    echo ""
    echo "▶ Step 1: Skipped (--skip-build)"
fi

# Verify out/ exists
if [[ ! -d "$NEXTJS_DIR/out" ]]; then
    echo "❌ Error: $NEXTJS_DIR/out/ does not exist. Run without --skip-build."
    exit 1
fi

# ── Step 2: Sync to local nextjs docs/ ────────────────────
echo ""
echo "▶ Step 2: Syncing out/ → nextjs docs/ (working copy)..."
rsync -a --delete "$NEXTJS_DIR/out/" "$NEXTJS_DIR/docs/"
echo "✅ Synced to $NEXTJS_DIR/docs/"

# ── Step 3: Sync to repo-root docs/ (GitHub Pages) ───────
echo ""
echo "▶ Step 3: Syncing out/ → repo-root docs/ (GitHub Pages)..."
rsync -a --delete --exclude='CNAME' "$NEXTJS_DIR/out/" "$REPO_ROOT/docs/"
echo "✅ Synced to $REPO_ROOT/docs/"

# ── Step 4: Git commit and push ──────────────────────────
echo ""
echo "▶ Step 4: Committing and pushing..."
cd "$REPO_ROOT"

git add -A docs/ kybalion-next/nextjs/docs/
CHANGES=$(git diff --cached --stat | tail -1)

if [[ -z "$CHANGES" ]]; then
    echo "ℹ️  No changes to commit. docs/ is already up to date."
    exit 0
fi

echo "  Changes: $CHANGES"
git commit -m "Deploy: update GitHub Pages from Next.js build

$CHANGES"
git push

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployed! GitHub Pages will update in ~60 seconds."
echo "   Live site: https://comms.davidelloyd.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
