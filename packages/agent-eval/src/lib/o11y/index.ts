/**
 * Observability module for agent-eval.
 * Provides transcript parsing and analysis for OpenCode.
 */

export type { ParseableAgent } from './parsers/index.js'
export { loadTranscript, parseTranscript, parseTranscriptSummary, SUPPORTED_AGENTS } from './parsers/index.js'
export { parseOpenCodeTranscript } from './parsers/opencode.js'
// Types
export type {
  FileOperationInfo,
  ShellCommandInfo,
  ToolName,
  Transcript,
  TranscriptEvent,
  TranscriptSummary,
  WebFetchInfo,
} from './types.js'
