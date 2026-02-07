#!/usr/bin/env bash
set -euo pipefail

# create_lite_zip.sh
# Creates a "lite" ZIP of this project by excluding patterns in .liteignore
#
# Output folder priority:
# 1) First CLI arg (explicit)
# 2) $LITE_ZIPS_ROOT (env, preferred)
# 3) $LITE_ZIP_OUT (env, legacy)
# 4) ~/VSCode_Scripts/lite_zips (if exists)
# 5) <project>/_lite_zip_out

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IGNORE_FILE="${ROOT}/.liteignore"

if [[ ! -f "${IGNORE_FILE}" ]]; then
  echo "ERROR: .liteignore not found at project root: ${IGNORE_FILE}"
  exit 1
fi

PROJECT_ROOT="${ROOT}"
if command -v git >/dev/null 2>&1; then
  GIT_TOP="$(git -C "${ROOT}" rev-parse --show-toplevel 2>/dev/null || true)"
  if [[ -n "${GIT_TOP}" ]]; then
    PROJECT_ROOT="${GIT_TOP}"
  fi
fi

PROJECT_NAME="kybalion"
STAMP="$(date +%Y%m%d_%H%M)"

# Resolve output parent
if [[ "${1:-}" != "" ]]; then
  OUT_PARENT="$1"
elif [[ -n "${LITE_ZIPS_ROOT:-}" && -d "${LITE_ZIPS_ROOT}" ]]; then
  OUT_PARENT="${LITE_ZIPS_ROOT}"
elif [[ -n "${LITE_ZIP_OUT:-}" && -d "${LITE_ZIP_OUT}" ]]; then
  OUT_PARENT="${LITE_ZIP_OUT}"
elif [[ -d "/Volumes/JBOD/Dropbox/documents/VSCode_Scripts/lite_zips" ]]; then
  OUT_PARENT="/Volumes/JBOD/Dropbox/documents/VSCode_Scripts/lite_zips"
elif [[ -d "${HOME}/VSCode_Scripts/lite_zips" ]]; then
  OUT_PARENT="${HOME}/VSCode_Scripts/lite_zips"
else
  OUT_PARENT="${ROOT}/_lite_zip_out"
fi

OUT_PARENT="${OUT_PARENT}/${PROJECT_NAME}"
mkdir -p "${OUT_PARENT}"
STAGE="${OUT_PARENT}/${PROJECT_NAME}_lite-zip_${STAMP}"

echo "Staging project to: ${STAGE}"
rsync -a --delete \
  --exclude-from="${IGNORE_FILE}" \
  "${ROOT}/" "${STAGE}/"

# Extra safeguard: remove output folder from inside the stage (if any)
rm -rf "${STAGE}/_lite_zip_out" || true

ZIP_PATH="${OUT_PARENT}/${PROJECT_NAME}_lite-zip_${STAMP}.zip"
echo "Creating ZIP: ${ZIP_PATH}"
(cd "${OUT_PARENT}" && zip -r "$(basename "${ZIP_PATH}")" "$(basename "${STAGE}")" >/dev/null)

echo ""
echo "✅ Done"
echo "ZIP: ${ZIP_PATH}"
echo "STAGE: ${STAGE}"
