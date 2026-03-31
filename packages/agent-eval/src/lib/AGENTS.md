# lib -- Core Implementation

## Overview

All framework logic lives here.
Flat module layout with two subdirectories (`agents/`, `o11y/`).

## Module Map

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `types.ts` | Leaf type definitions | `AgentType`, `ExperimentConfig`, `EvalFixture`, `Sandbox`, `ProgressEvent` |
| `config.ts` | Config loading/validation (Zod) | `loadConfig`, `resolveConfig`, `validateConfig`, `resolveEvalNames` |
| `runner.ts` | Experiment orchestrator | `runExperiment`, `runSingleEval`, `StartRateLimiter` |
| `results.ts` | Result persistence + formatting | `saveResults`, `formatResultsTable`, `scanReusableResults` |
| `fixture.ts` | Fixture discovery + validation | `discoverFixtures`, `loadFixture`, `loadAllFixtures` |
| `fingerprint.ts` | SHA-256 content fingerprinting | `computeFingerprint` |
| `classifier.ts` | AI failure classification | `classifyFailure`, `isNonModelFailure`, `isClassifierEnabled` |
| `sandbox.ts` | Sandbox abstraction (Vercel + Docker) | `createSandbox`, `SandboxManager`, `resolveBackend` |
| `docker-sandbox.ts` | Docker container sandbox | `DockerSandboxManager` |
| `housekeeping.ts` | Result cleanup/deduplication | `housekeep` |
| `dashboard.ts` | Live terminal progress display | `Dashboard`, `createConsoleProgressHandler` |
| `init.ts` | Project scaffolding | `initProject`, `getPostInitInstructions` |

## Dependency Flow

```
types.ts (leaf)
  ← fingerprint.ts, fixture.ts, classifier.ts
  ← config.ts ← agents/
  ← sandbox.ts ← docker-sandbox.ts
  ← results.ts ← classifier.ts, fixture.ts, o11y/
  ← runner.ts ← agents/, results.ts
  ← housekeeping.ts ← classifier.ts
  ← dashboard.ts ← results.ts
  ← init.ts (standalone)
```

## Key Patterns

- **Anti-cheating mechanism**: test files (EVAL.ts, PROMPT.md) are withheld from sandbox during agent execution, uploaded only after agent finishes
- **Git-based diffing**: `initGitAndCommit` creates baseline; `captureGeneratedFiles` uses `git diff HEAD --name-status`
- **Fingerprint-based reuse**: unchanged evals skip re-execution via SHA-256 content fingerprints
- **AI classifier with tool use**: Claude Haiku explores result files via sandboxed tools, then calls `classify()` with its verdict
- **Three sandbox modes**: `auto` (detect from credentials), `vercel`, `docker`
- **Anomaly-based retry**: failures under 5 seconds get exponential backoff retry (up to 5x) for infra flakiness
- **Structured results directory**: `results/{experiment}/{timestamp}/{eval}/run-{n}/`

## Anti-Patterns

- Do not add config via env vars -- extend `ExperimentConfig` in `types.ts` + Zod schema in `config.ts`
- Do not scatter classification logic -- it belongs in `classifier.ts`
- Case-sensitive file detection in `fixture.ts` -- do not assume filesystem case behavior
