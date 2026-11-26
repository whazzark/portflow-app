#!/usr/bin/env bash
# Builds the Impeccable engine from source, at the commit pinned in pin.env, into
# engine/bin/ (ignored by git). Nothing else is installed: no hook, no agent, no
# skill, no launcher. Run it by hand, once per clone or worktree.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=pin.env
. "$here/pin.env"

src="$here/bin/src"
bin="$here/bin/impeccable"
repo="https://github.com/pbakaus/impeccable.git"

mkdir -p "$here/bin"
if [ ! -d "$src/.git" ]; then
  git init -q "$src"
fi
git -C "$src" fetch -q --depth 1 "$repo" "$IMPECCABLE_ENGINE_COMMIT"
git -C "$src" -c advice.detachedHead=false checkout -q --force FETCH_HEAD

head="$(git -C "$src" rev-parse HEAD)"
if [ "$head" != "$IMPECCABLE_ENGINE_COMMIT" ]; then
  echo "error: fetched $head, expected $IMPECCABLE_ENGINE_COMMIT" >&2
  exit 1
fi
version="$(cat "$src/ENGINE_VERSION")"
if [ "$version" != "$IMPECCABLE_ENGINE_VERSION" ]; then
  echo "error: ENGINE_VERSION is $version, expected $IMPECCABLE_ENGINE_VERSION" >&2
  exit 1
fi

# --locked: the dependencies are the ones of the pinned Cargo.lock.
(cd "$src" && cargo build --release --locked -p impeccable)
install -m 0755 "$src/target/release/impeccable" "$bin"

probe="$("$bin" engine-probe)"
if [ "$probe" != "impeccable-engine $IMPECCABLE_ENGINE_VERSION" ]; then
  echo "error: the built engine answers '$probe'" >&2
  exit 1
fi
echo "installed: $bin ($probe, commit $head)"
