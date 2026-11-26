#!/usr/bin/env bash
# Runs `impeccable detect --json` on local files only, with every upload turned off.
# Never downloads or builds anything.
#
# Usage: detect.sh <file or folder>...
# Exit: 0 no finding, 2 findings (the JSON on stdout), 3 engine missing or wrong,
# 4 refused arguments; any other code is a failure of the engine (137: it was
# killed for reaching the network).
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=pin.env
. "$here/pin.env"
bin="$here/bin/impeccable"

if [ ! -x "$bin" ]; then
  echo "error: the Impeccable engine is not installed ($bin); run $here/install.sh" >&2
  exit 3
fi
probe="$("$bin" engine-probe 2>/dev/null || true)"
if [ "$probe" != "impeccable-engine $IMPECCABLE_ENGINE_VERSION" ]; then
  echo "error: the engine answers '$probe', expected impeccable-engine $IMPECCABLE_ENGINE_VERSION; run $here/install.sh" >&2
  exit 3
fi
if [ "$#" -eq 0 ]; then
  echo "usage: detect.sh <file or folder>..." >&2
  exit 4
fi
for arg in "$@"; do
  case "$arg" in
    http://* | https://* | file://* | --cdp* | --before* | --changed* | --stream*)
      echo "error: $arg is not allowed: scan local files only" >&2
      exit 4
      ;;
  esac
done

# An empty engine home holds no sign-in, so no scan can be uploaded, and the
# opt-outs stop the background reports. The real ~/.impeccable is never read
# for an account.
home="$here/bin/home"
mkdir -p "$home"
cmd=(env -u IMPECCABLE_ACCOUNT_URL -u IMPECCABLE_SKILL_DIR
  IMPECCABLE_HOME="$home" DO_NOT_TRACK=1 IMPECCABLE_NO_TELEMETRY=1 IMPECCABLE_NO_TASTE=1
  "$bin" detect --json "$@")

# On macOS the engine runs in a sandbox that kills it on any network operation.
if command -v sandbox-exec >/dev/null 2>&1; then
  exec sandbox-exec -p '(version 1)(allow default)(deny network* (with send-signal SIGKILL))' "${cmd[@]}"
fi
exec "${cmd[@]}"
