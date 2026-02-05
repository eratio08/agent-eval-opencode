---
"@vercel/agent-eval": patch
---

Add observability (o11y) module for transcript parsing and analysis

- Normalized transcript parsing for Claude Code, Codex, and OpenCode agents
- Summary statistics: tool calls, files read/modified, shell commands, errors
- Save parsed transcript as `transcript.json` and raw as `transcript-raw.jsonl`
- Include `o11y` summary and `transcriptRawPath` in `result.json`
- Export `parseTranscript`, `loadTranscript`, `SUPPORTED_AGENTS` from public API
- Fix Codex agent `wire_api` config and transcript capture on failure