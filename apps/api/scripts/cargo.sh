#!/bin/sh
# Runs one cargo task on the workspace of the API; called by the scripts of package.json.
set -eu
cd "$(dirname "$0")/.."

case "$1" in
  build) cargo build --all-targets ;;
  lint) cargo clippy --all-targets -- -D warnings ;;
  format:check) cargo fmt --all --check ;;
  test) cargo test ;;
  migrate) cargo run --quiet --package api -- migrate ;;
  openapi) cargo run --quiet --package api -- openapi ../../packages/contracts/openapi.json ;;
  start) cargo run --quiet --package api -- serve ;;
  *) echo "apps/api: unknown task $1" >&2; exit 2 ;;
esac
