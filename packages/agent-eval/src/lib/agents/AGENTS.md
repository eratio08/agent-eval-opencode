# agents -- Agent Implementations

## Overview

OpenCode-only agent wrapper.
The `Agent` interface remains as an internal contract, but only the OpenCode implementation is shipped.

## Architecture

- `types.ts` -- internal `Agent` contract (`name`, `run`, `getApiKeyEnvVar`, `getDefaultModel`)
- `index.ts` -- exports the OpenCode entry point via `getAgent('opencode')`
- `opencode.ts` -- OpenCode implementation and default model constant
- `shared.ts` -- shared sandbox validation and transcript helpers

## Shipped Agent

| Key | Factory | Default Model | CLI Package | Install |
|---|---|---|---|---|
| `opencode` | `createOpenCodeAgent()` | `github-copilot/claude-opus-4.6` | `opencode-ai` | npm |

## Shared Agent Lifecycle

1. Create sandbox, upload workspace files (tests withheld)
2. `initGitAndCommit` -- establish git baseline
3. `npm install` (retried once on failure)
4. Install agent CLI globally
5. Run agent with prompt
6. Upload test files, `createVitestConfig`, `injectTranscriptContext`
7. `runValidation` (vitest + custom scripts)
8. `captureGeneratedFiles` via git diff
9. Stop sandbox

## Where to Look

| Task | File |
|------|------|
| Change shared sandbox logic | `shared.ts` |
| Change agent entry point | `index.ts` |
| Change OpenCode behavior | `opencode.ts` |

## Agent-Specific Notes

- **OpenCode**: writes `opencode.json`, mounts local credential files, and currently requires the Docker sandbox for credential injection.
