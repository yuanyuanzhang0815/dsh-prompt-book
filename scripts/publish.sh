#!/usr/bin/env bash
# Publish to the public npm registry (the local config points at a mirror, which
# cannot accept publishes). Run `npm login --registry=https://registry.npmjs.org`
# once beforehand.
set -euo pipefail
cd "$(dirname "$0")/.."

REGISTRY=https://registry.npmjs.org

if [[ " $* " != *" --dry-run "* ]] && ! npm whoami --registry="$REGISTRY" >/dev/null 2>&1; then
  echo "Not logged in to $REGISTRY — run:" >&2
  echo "  npm login --registry=$REGISTRY" >&2
  exit 1
fi

echo "Publishing $(node -p "require('./package.json').name")@$(node -p "require('./package.json').version")"
npm publish --registry="$REGISTRY" --access public "$@"
