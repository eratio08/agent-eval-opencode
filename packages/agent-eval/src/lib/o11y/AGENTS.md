# o11y -- Observability / Transcript Parsing

## Overview

Unified transcript parsing layer.
Five agent-specific parsers normalize JSONL transcripts into a common `Transcript` schema.

## Architecture

- `types.ts` -- shared types: `ToolName` (11 canonical names), `TranscriptEvent`, `TranscriptSummary`, `Transcript`
- `index.ts` -- barrel export of types + parsing API + individual parsers
- `parsers/index.ts` -- router (`getParserForAgent` via substring matching) + summary generator
- `parsers/{agent}.ts` -- one parser per agent

## Parser Contract

Every parser exports: `parse*Transcript(raw: string) -> { events: TranscriptEvent[]; errors: string[] }`

Parsers inject `_extractedPath`, `_extractedUrl`, `_extractedCommand` into `tool.args` for summary generation.

## Router Logic

`getParserForAgent` uses substring matching:
`"vercel-ai-gateway/claude-code"` matches `"claude-code"` parser.

## Key Functions

| Function | Purpose |
|----------|---------|
| `parseTranscript(raw, agent, model?)` | Route to parser, generate summary |
| `loadTranscript(content, agent?)` | Smart loader: detects pre-parsed JSON vs raw JSONL |
| `parseTranscriptSummary(raw, agent)` | Convenience: returns summary only |

## Per-Parser Notes

| Parser | Input Source | Tool Name Casing | Unique Feature |
|--------|-------------|-----------------|----------------|
| `claude-code` | File-based JSONL (`~/.claude/`) | Case-sensitive | 30 tool name mappings, MCP tool support |
| `codex` | Stdout JSONL (`--json`) | Case-insensitive | Handles Responses API events (`item.started`, etc.) |
| `opencode` | Stdout JSONL (`--format json`) | Case-insensitive | Dual format: CLI `tool_use`/`text` + legacy events |
| `gemini` | Stdout JSONL (`--output-format stream-json`) | Case-insensitive | Two formats (CLI + direct-API); delta aggregation |
| `cursor` | Stdout JSONL (`--print`) | Static key map | Key-name-based tool ID (`readToolCall`, `shellToolCall`) |

## Canonical Tool Names

`file_read`, `file_write`, `file_edit`, `shell`, `web_fetch`, `web_search`, `glob`, `grep`, `list_dir`, `agent_task`, `unknown`

## Adding a Parser

1. Create `parsers/{agent}.ts` implementing the parser contract
2. Register in `parsers/index.ts` `AGENT_PARSERS` map
3. Export from `index.ts`
4. Add tests in `o11y.test.ts`
