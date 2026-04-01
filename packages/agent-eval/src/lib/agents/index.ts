/**
 * OpenCode-only agent entry point.
 */

import type { AgentType } from '../types.js'
import { createOpenCodeAgent, openCodeAgent } from './opencode.js'

export function getAgent(name: AgentType) {
  if (name !== 'opencode') {
    throw new Error(`Unsupported agent: ${name}`)
  }

  return openCodeAgent
}

// Re-export agent types
export type { Agent, AgentRunOptions, AgentRunResult } from './types.js'
export { createOpenCodeAgent, openCodeAgent }
