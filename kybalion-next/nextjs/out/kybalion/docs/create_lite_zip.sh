#!/usr/bin/env bash
set -euo pipefail

# Delegates project-specific lite zip calls to the shared workspace toolkit.
# Keeps legacy script paths stable while centralizing behavior.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEARCH_DIR="${SCRIPT_DIR}"
TOOLKIT_SCRIPT=""

while true; do
  CANDIDATE="${SEARCH_DIR}/lite_zips/lite_zip_toolkit/create_lite_zip.sh"
  if [[ -f "${CANDIDATE}" ]]; then
    TOOLKIT_SCRIPT="${CANDIDATE}"
    break
  fi
  if [[ "${SEARCH_DIR}" == "/" ]]; then
    break
  fi
  SEARCH_DIR="$(dirname "${SEARCH_DIR}")"
done

if [[ -z "${TOOLKIT_SCRIPT}" ]]; then
  echo "ERROR: Shared toolkit not found from ${SCRIPT_DIR}."
  echo "Expected to find: <workspace>/lite_zips/lite_zip_toolkit/create_lite_zip.sh"
  exit 1
fi

# Preserve historical project naming for these scripts.
export LITE_ZIP_PROJECT_NAME="${LITE_ZIP_PROJECT_NAME:-kybalion}"

cd "${SCRIPT_DIR}"
if [[ -n "${1:-}" ]]; then
  exec "${TOOLKIT_SCRIPT}" "$1"
else
  exec "${TOOLKIT_SCRIPT}"
fi

