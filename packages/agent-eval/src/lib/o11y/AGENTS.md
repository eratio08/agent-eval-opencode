# o11y -- Observability / Transcript Parsing

## Overview

Unified transcript parsing layer for OpenCode.
OpenCode JSONL transcripts are normalized into a common `Transcript` schema.

## Architecture

- `types.ts` -- shared types: `ToolName` (11 canonical names), `TranscriptEvent`, `TranscriptSummary`, `Transcript`
- `index.ts` -- barrel export of types + parsing API
- `parsers/index.ts` -- parser entry point + summary generator
- `parsers/opencode.ts` -- OpenCode transcript parser

## Parser Contract

Every parser exports: `parse*Transcript(raw: string) -> { events: TranscriptEvent[]; errors: string[] }`

Parsers inject `_extractedPath`, `_extractedUrl`, `_extractedCommand` into `tool.args` for summary generation.

## Parser Logic

`getParserForAgent` accepts only `opencode`.

## Key Functions

| Function | Purpose |
|----------|---------|
| `parseTranscript(raw, agent, model?)` | Route to parser, generate summary |
| `loadTranscript(content, agent?)` | Smart loader: detects pre-parsed JSON vs raw JSONL |
| `parseTranscriptSummary(raw, agent)` | Convenience: returns summary only |

## Parser Notes

| Parser | Input Source | Tool Name Casing | Unique Feature |
|--------|-------------|-----------------|----------------|
| `opencode` | Stdout JSONL (`--format json`) | Case-insensitive | Handles CLI `tool_use`/`text` plus legacy fallback events |

## Canonical Tool Names

`file_read`, `file_write`, `file_edit`, `shell`, `web_fetch`, `web_search`, `glob`, `grep`, `list_dir`, `agent_task`, `unknown`

## Updating the Parser

1. Modify `parsers/opencode.ts`
2. Keep `parsers/index.ts` aligned with the OpenCode-only contract
3. Update tests in `o11y.test.ts`
