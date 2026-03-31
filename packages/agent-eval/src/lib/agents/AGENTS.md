# agents -- Agent Implementations

## Overview

Plugin-style registry of AI coding agent wrappers.
Each agent wraps a CLI tool in the uniform `Agent` interface.

## Architecture

- `types.ts` -- `Agent` interface contract (`name`, `run`, `getApiKeyEnvVar`, `getDefaultModel`)
- `registry.ts` -- `Map<string, Agent>` singleton with `registerAgent`/`getAgent`/`listAgents`/`hasAgent`
- `index.ts` -- wires up all agent factories, registers 7 variants, re-exports registry API
- `shared.ts` -- cross-cutting utilities used by all agents

## Registered Agents

| Registry Key | Factory | Default Model | CLI Package | Install |
|---|---|---|---|---|
| `vercel-ai-gateway/claude-code` | `createClaudeCodeAgent({useVercelAiGateway: true})` | `opus` | `@anthropic-ai/claude-code` | npm |
| `claude-code` | `createClaudeCodeAgent({useVercelAiGateway: false})` | `opus` | same | npm |
| `vercel-ai-gateway/codex` | `createCodexAgent({useVercelAiGateway: true})` | `openai/gpt-5.2-codex` | `@openai/codex` | npm |
| `codex` | `createCodexAgent({useVercelAiGateway: false})` | same | same | npm |
| `opencode` | `createOpenCodeAgent()` | `github-copilot/claude-opus-4.6` | `opencode-ai` | npm |
| `gemini` | `createGeminiAgent()` | `gemini-3-pro-preview` | `@google/gemini-cli` | npm |
| `cursor` | `createCursorAgent()` | `composer-1.5` | Cursor CLI | curl script |

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
| Add new agent | New file here + follow checklist in root AGENTS.md |
| Change shared sandbox logic | `shared.ts` |
| Modify agent registry | `registry.ts` |
| API key constants | `shared.ts` (`AI_GATEWAY`, `ANTHROPIC_DIRECT`, etc.) |

## Agent-Specific Notes

- **Claude Code**: reads transcript from `~/.claude/projects/` filesystem, not stdout
- **Codex**: writes TOML config to `~/.codex/config.toml`; supports `?reasoningEffort=` query param in model string
- **OpenCode**: writes `opencode.json` config; Docker-only (mounts local credential files, no API key needed)
- **Cursor**: installed via `curl`, not npm; binary is `agent` not `cursor`
- **Gemini**: simplest implementation -- no config file, no model parsing
