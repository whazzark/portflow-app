---
paths:
  - "apps/**"
  - "packages/**"
  - ".oxfmtrc.json"
  - ".env.example"
  - "package.json"
  - "pnpm-workspace.yaml"
  - "turbo.json"
  - "rust-toolchain.toml"
  - ".nvmrc"
  - "compose.yaml"
  - ".github/workflows/code.yml"
---

# Workspace commands

Toolchains: Node from `.nvmrc` (`nvm use`), pnpm from `packageManager`, Rust from
`rust-toolchain.toml` (rustup installs it on the first `cargo` command), Docker for
PostgreSQL. Run every command from the root of the repository: Turborepo runs it on
every workspace.

```
pnpm install                         # dependencies of every workspace
pnpm build
pnpm lint
pnpm format:check                    # oxfmt for TypeScript, one config: .oxfmtrc.json
pnpm test                            # tests that need PostgreSQL read DATABASE_URL
pnpm test:e2e                        # end-to-end suite: starts the API and the web app
pnpm db:up                           # local PostgreSQL; copy .env.example to .env first
pnpm db:down                         # stop it; the data stays in a Docker volume
pnpm <task> --filter <package>       # one workspace only, e.g. --filter @portflow/api
```

The commands of one area are in its rule: `backend.md`, `frontend.md`, `testing.md`.
