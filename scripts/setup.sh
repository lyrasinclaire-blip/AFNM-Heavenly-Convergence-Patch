#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UPLOADER_DIR="$REPO_ROOT/../ModUploader-AFNM"

echo "=== AFNM Mod Template Setup ==="
echo ""

# Check required tools
missing=()
command -v bun >/dev/null 2>&1 || missing+=("bun (https://bun.sh)")
command -v node >/dev/null 2>&1 || missing+=("node (https://nodejs.org)")
command -v git >/dev/null 2>&1 || missing+=("git (https://git-scm.com)")

if [ ${#missing[@]} -gt 0 ]; then
  echo "Missing required tools:"
  for tool in "${missing[@]}"; do
    echo "  - $tool"
  done
  echo ""
  echo "Install them and re-run this script."
  exit 1
fi

echo "[ok] bun $(bun --version)"
echo "[ok] node $(node --version)"
echo "[ok] git $(git --version | cut -d' ' -f3)"

# Install dependencies
echo ""
echo "Installing project dependencies..."
cd "$REPO_ROOT"
bun install
echo "[ok] Dependencies installed"

# Clone ModUploader-AFNM if missing
echo ""
if [ -d "$UPLOADER_DIR" ]; then
  echo "[ok] ModUploader-AFNM found at $UPLOADER_DIR"
else
  echo "ModUploader-AFNM not found. Cloning..."
  git clone https://github.com/lemon07r/ModUploader-AFNM.git "$UPLOADER_DIR"
  echo "[ok] ModUploader-AFNM cloned to $UPLOADER_DIR"
fi

# Detect game installation
echo ""
GAME_CANDIDATES=(
  "$HOME/.local/share/Steam/steamapps/common/Ascend From Nine Mountains"
  "$HOME/Library/Application Support/Steam/steamapps/common/Ascend From Nine Mountains"
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Ascend From Nine Mountains"
  "C:\\Program Files\\Steam\\steamapps\\common\\Ascend From Nine Mountains"
)

game_found=""
for candidate in "${GAME_CANDIDATES[@]}"; do
  if [ -d "$candidate" ]; then
    game_found="$candidate"
    break
  fi
done

if [ -n "$game_found" ]; then
  echo "[ok] Game installation found: $game_found"
else
  echo "[!!] Game installation not detected."
  echo "     Set AFNM_GAME_DIR in your environment to use the runtime oracle."
  echo "     Example: export AFNM_GAME_DIR=\"/path/to/Ascend From Nine Mountains\""
fi

# Check optional tools
echo ""
echo "=== Optional Tools ==="
if command -v agent-browser >/dev/null 2>&1; then
  echo "[ok] agent-browser available (for automated game testing)"
else
  echo "[--] agent-browser not installed (optional, for automated game testing)"
  echo "     Install with: npm install -g @anthropic/agent-browser"
fi

# Verify the build works
echo ""
echo "=== Verifying Build ==="
bun run typecheck && echo "[ok] TypeScript passes" || echo "[!!] TypeScript errors found"
bun run build && echo "[ok] Build succeeds" || echo "[!!] Build failed"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Update package.json with your mod's name, description, and author"
echo "  2. Update package.json afnmWorkshop fields for Workshop publishing"
echo "  3. Replace the example logic in src/modContent/index.ts"
echo "  4. Run: bun run build"
echo "  5. Copy builds/*.zip to your game's mods/ directory to test"
echo ""
echo "See README.md and AGENTS.md for more details."
