/**
 * Agent registry with built-in agents.
 */

import { createClaudeCodeAgent } from './claude-code.js'
import { createCodexAgent } from './codex.js'
import { createCursorAgent } from './cursor.js'
import { createGeminiAgent } from './gemini.js'
import { createOpenCodeAgent } from './opencode.js'
import { getAgent, hasAgent, listAgents, registerAgent } from './registry.js'

// Register all agent variants (Vercel AI Gateway + Direct API)
registerAgent(createClaudeCodeAgent({ useVercelAiGateway: true })) // vercel-ai-gateway/claude-code
registerAgent(createClaudeCodeAgent({ useVercelAiGateway: false })) // claude-code
registerAgent(createCodexAgent({ useVercelAiGateway: true })) // vercel-ai-gateway/codex
registerAgent(createCodexAgent({ useVercelAiGateway: false })) // codex
registerAgent(createOpenCodeAgent()) // opencode
registerAgent(createGeminiAgent()) // gemini
registerAgent(createCursorAgent()) // cursor

// Re-export agent types
export type { Agent, AgentRunOptions, AgentRunResult } from './types.js'
// Re-export registry functions
export { getAgent, hasAgent, listAgents, registerAgent }
