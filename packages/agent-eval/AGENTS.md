# agent-eval Package

## Overview

Core CLI and library package (`agent-eval-opencode`).
Discovers eval fixtures, runs AI agents in sandboxes, validates results, persists structured output.

## Entry Points

| Entry | File | Role |
|-------|------|------|
| CLI | `src/cli.ts` | Commander-based CLI: `agent-eval-opencode [config]`, `run-all`, `init`, `playground` |
| Library | `src/index.ts` | Public API barrel -- re-exports from 12+ internal modules |
| Binary | `dist/cli.js` | Published as `agent-eval-opencode` npm bin |

## Where to Look

| Task | File |
|------|------|
| Add CLI subcommand | `src/cli.ts` |
| Change public API | `src/index.ts` |
| Core types | `src/lib/types.ts` |
| Config schema | `src/lib/config.ts` (Zod) |

## Testing

- **Unit tests**: colocated `*.test.ts` next to source modules
- **Integration test**: `src/integration.test.ts` -- gated by `INTEGRATION_TEST=1`
- **CLI test**: `src/cli.test.ts`
- **Vitest config**: `vitest.config.ts` -- `globals: false`, `environment: node`
- **Setup**: `src/test-setup.ts` loads `.env` via dotenv
- Explicit `import { describe, it, expect } from 'vitest'` required everywhere
- No shared test utilities -- each test is self-contained with inline helpers
- Temp dirs use `/tmp/eval-framework-<module>-test` pattern with beforeEach/afterEach cleanup
- Integration tests use `it.concurrent.skipIf` for parallel per-agent execution

## Conventions

- TS config files loaded via `jiti` (with `moduleCache: false`)
- JS config files loaded via dynamic `import()`
- Three config stages: `ExperimentConfig` -> `ResolvedExperimentConfig` -> `RunnableExperimentConfig`
- `prepublishOnly` runs `tsc` build before publish
