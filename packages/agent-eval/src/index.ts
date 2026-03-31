/**
 * agent-eval
 *
 * Framework for testing AI coding agents in isolated sandboxes.
 */

export { getAgent, listAgents, registerAgent } from './lib/agents/index.js'
// Re-export transcript context constants
export { TRANSCRIPT_CONTEXT_DIR, TRANSCRIPT_CONTEXT_PATH } from './lib/agents/shared.js'
// Re-export agent utilities
// Re-export agent registry
export type { Agent, AgentRunOptions, AgentRunResult, ScriptResult } from './lib/agents/types.js'
// Re-export classifier
export {
  classifyFailure,
  classifyWithAI,
  isClassifierEnabled,
  isNonModelFailure,
} from './lib/classifier.js'
// Re-export config utilities
export {
  CONFIG_DEFAULTS,
  loadConfig,
  resolveConfig,
  resolveEvalNames,
  validateConfig,
} from './lib/config.js'
// Re-export dashboard utilities
export { createConsoleProgressHandler, Dashboard } from './lib/dashboard.js'
// Re-export Docker sandbox
export type { DockerSandboxOptions } from './lib/docker-sandbox.js'
export { DockerSandboxManager } from './lib/docker-sandbox.js'
// Re-export fingerprinting
export { computeFingerprint } from './lib/fingerprint.js'
// Re-export fixture utilities
export {
  discoverFixtures,
  FixtureValidationError,
  getFixtureFiles,
  loadAllFixtures,
  loadFixture,
  readFixtureFiles,
  validateFixtureFiles,
  validatePackageJson,
} from './lib/fixture.js'
// Re-export housekeeping
export { housekeep } from './lib/housekeeping.js'
// Re-export init utilities
export type { InitOptions } from './lib/init.js'
export { getPostInitInstructions, initProject } from './lib/init.js'
// Re-export o11y (observability) utilities
export type {
  FileOperationInfo,
  ParseableAgent,
  ShellCommandInfo,
  ToolName,
  Transcript,
  TranscriptEvent,
  TranscriptSummary,
  WebFetchInfo,
} from './lib/o11y/index.js'
export {
  loadTranscript,
  parseClaudeCodeTranscript,
  parseCodexTranscript,
  parseOpenCodeTranscript,
  parseTranscript,
  parseTranscriptSummary,
  SUPPORTED_AGENTS,
} from './lib/o11y/index.js'
// Re-export results utilities
export type { ReusableResult, SaveResultsOptions } from './lib/results.js'
export {
  agentResultToEvalRunData,
  createEvalSummary,
  createExperimentResults,
  createProgressDisplay,
  formatResultsTable,
  formatRunResult,
  saveResults,
  scanReusableResults,
} from './lib/results.js'
// Re-export runner utilities
export type { RunExperimentOptions } from './lib/runner.js'
export { runExperiment, runSingleEval, StartRateLimiter } from './lib/runner.js'
// Re-export sandbox utilities
export type {
  CommandResult,
  SandboxBackend,
  SandboxBackendInfo,
  SandboxFile,
  SandboxOptions,
} from './lib/sandbox.js'
export {
  collectLocalFiles,
  createSandbox,
  DEFAULT_SANDBOX_TIMEOUT,
  getSandboxBackendInfo,
  IGNORED_PATTERNS,
  resolveBackend,
  SandboxManager,
  splitTestFiles,
  TEST_FILE_PATTERNS,
  verifyNoTestFiles,
} from './lib/sandbox.js'
// Re-export types
export type {
  AgentType,
  Classification,
  EvalFilter,
  EvalFixture,
  EvalRunData,
  EvalRunResult,
  EvalSummary,
  ExperimentConfig,
  ExperimentResults,
  FailureType,
  ModelTier,
  ProgressEvent,
  ResolvedExperimentConfig,
  Sandbox,
  SetupFunction,
} from './lib/types.js'
// Re-export constants
export { EXCLUDED_FILES, REQUIRED_EVAL_FILES } from './lib/types.js'
