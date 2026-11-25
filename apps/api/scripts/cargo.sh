#!/bin/sh
# Runs one cargo task on the workspace of the API; called by the scripts of package.json.
# Cargo refuses a workspace without members, and the crates arrive with the walking
# skeleton of the back end: until the first crate exists, the task is skipped.
set -eu
cd "$(dirname "$0")/.."

if ! ls crates/*/Cargo.toml >/dev/null 2>&1; then
  echo "apps/api: no crate yet, cargo $1 skipped"
  exit 0
fi

case "$1" in
  build) cargo build --all-targets ;;
  lint) cargo clippy --all-targets -- -D warnings ;;
  format:check) cargo fmt --all --check ;;
  test) cargo test ;;
  *) echo "apps/api: unknown task $1" >&2; exit 2 ;;
esac
