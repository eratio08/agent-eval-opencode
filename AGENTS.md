# Agent Eval

**Generated:** 2026-02-26 | **Commit:** 9120750 | **Branch:** main

## Overview

Framework for evaluating AI coding agents (`agent-eval-opencode`).
Single-package pnpm workspace for the forked CLI/library. The `playground` command delegates to Vercel's official `@vercel/agent-eval-playground` package.

## Structure

```
/
├── packages/
│   └── agent-eval/        # Core: CLI, library, agents, runner, sandbox
│       └── src/
│           ├── cli.ts     # CLI entry (commander)
│           ├── index.ts   # Library entry (public API)
│           └── lib/       # All implementation modules
├── .changeset/            # Changesets for versioning
└── .github/workflows/     # CI (build+test) + Release (changesets)
```

## Where to Look

| Task | Location |
|------|----------|
| Add/modify an agent | `packages/agent-eval/src/lib/agents/` |
| Add transcript parser | `packages/agent-eval/src/lib/o11y/parsers/` |
| Change config schema | `packages/agent-eval/src/lib/config.ts` + `types.ts` |
| Modify eval runner | `packages/agent-eval/src/lib/runner.ts` |
| Sandbox behavior | `packages/agent-eval/src/lib/sandbox.ts`, `docker-sandbox.ts` |
| Failure classification | `packages/agent-eval/src/lib/classifier.ts` |
| Result persistence | `packages/agent-eval/src/lib/results.ts` |
| Fixture discovery | `packages/agent-eval/src/lib/fixture.ts` |
| CI/Release | `.github/workflows/` |

## Conventions

- **ESM-only**: `"type": "module"`, all imports use `.js` extensions (NodeNext resolution)
- **Strict TypeScript**: `strict: true`, ES2022 target
- **No new env vars**: config goes in `ExperimentConfig`; only API keys are env vars
- **DRY + colocation**: shared logic in the module that owns the concept
- **Unused vars**: prefix with `_` (ESLint rule)
- **Changesets required**: every PR needs `npx changeset`
- **README updates**: required for user-facing behavior changes

## Anti-Patterns

- Do not create standalone test scripts in `/tmp` -- use `src/integration.test.ts`
- Do not duplicate logic across files -- extract to the owning module
- Do not add configuration via environment variables

## Commands

```bash
npm run build          # tsc (agent-eval package only)
npm test               # vitest run (unit tests)
npm run lint           # biome check .
npm run test:integration  # INTEGRATION_TEST=1 vitest (needs API keys)
npm run test:docker    # SANDBOX_BACKEND=docker vitest
npx changeset          # create changeset for PR
```

## Adding a New Agent

Checklist (all steps required):

1. Agent implementation in `src/lib/agents/`
2. Register in `src/lib/agents/index.ts`
3. Add to `AgentType` union in `src/lib/types.ts`
4. Add to Zod schema in `src/lib/config.ts`
5. Add API key config in `src/lib/agents/shared.ts`
6. Add transcript parser in `src/lib/o11y/parsers/`
7. Register parser in `src/lib/o11y/parsers/index.ts`
8. Export parser from `src/lib/o11y/index.ts`
9. Add parser tests in `src/lib/o11y/o11y.test.ts`
10. Add integration tests in `src/integration.test.ts`
11. Update README.md

## Notes

- Root build/test/lint scripts delegate to `packages/agent-eval`
- Integration tests are gated by `INTEGRATION_TEST=1` and per-agent API key availability
- CI runs unit tests only; integration tests require external credentials
