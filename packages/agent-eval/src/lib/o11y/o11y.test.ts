import { describe, expect, it } from 'vitest'
import {
  loadTranscript,
  parseOpenCodeTranscript,
  parseTranscript,
  parseTranscriptSummary,
  SUPPORTED_AGENTS,
} from './index.js'
import type { Transcript } from './types.js'

describe('o11y', () => {
  describe('parseTranscript', () => {
    it('returns empty result for empty input', () => {
      const result = parseTranscript('', 'opencode')

      expect(result.agent).toBe('opencode')
      expect(result.events).toEqual([])
      expect(result.summary.totalTurns).toBe(0)
      expect(result.summary.totalToolCalls).toBe(0)
      expect(result.parseSuccess).toBe(true)
    })

    it('rejects unsupported agents', () => {
      const result = parseTranscript('{"type":"assistant"}', 'claude-code')

      expect(result.parseSuccess).toBe(false)
      expect(result.parseErrors).toContain('No parser available for agent: claude-code. Supported agents: opencode')
    })

    it('includes model in result', () => {
      const result = parseTranscript('{}', 'opencode', 'github-copilot/claude-opus-4.6')
      expect(result.model).toBe('github-copilot/claude-opus-4.6')
    })
  })

  describe('parseTranscriptSummary', () => {
    it('returns only the summary', () => {
      const transcript = JSON.stringify({ type: 'text', part: { text: 'Hello' } })
      const summary = parseTranscriptSummary(transcript, 'opencode')

      expect(summary.totalTurns).toBe(1)
      expect(summary.totalToolCalls).toBe(0)
    })
  })

  describe('parseOpenCodeTranscript', () => {
    it('parses assistant messages', () => {
      const transcript = JSON.stringify({
        type: 'text',
        timestamp: '2026-02-12T20:21:56.095Z',
        part: { text: 'Hello' },
      })
      const { events } = parseOpenCodeTranscript(transcript)

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('message')
      expect(events[0].role).toBe('assistant')
      expect(events[0].content).toBe('Hello')
    })

    it('parses tool call and result events', () => {
      const transcript = JSON.stringify({
        type: 'tool_use',
        timestamp: '2026-02-12T20:21:56.095Z',
        part: {
          tool: 'bash',
          state: {
            status: 'completed',
            input: { command: 'npm test' },
            output: 'ok',
            metadata: { exit: 0 },
          },
        },
      })

      const { events } = parseOpenCodeTranscript(transcript)

      expect(events).toHaveLength(2)
      expect(events[0].type).toBe('tool_call')
      expect(events[0].tool?.name).toBe('shell')
      expect(events[0].tool?.args?._extractedCommand).toBe('npm test')
      expect(events[1].type).toBe('tool_result')
      expect(events[1].tool?.success).toBe(true)
    })

    it('extracts file paths from read tools', () => {
      const transcript = JSON.stringify({
        type: 'tool_use',
        part: {
          tool: 'read',
          state: { status: 'pending', input: { path: 'src/index.ts' } },
        },
      })

      const { events } = parseOpenCodeTranscript(transcript)

      expect(events[0].tool?.name).toBe('file_read')
      expect(events[0].tool?.args?._extractedPath).toBe('src/index.ts')
    })
  })

  describe('loadTranscript', () => {
    it('returns parsed transcripts unchanged', () => {
      const transcript: Transcript = {
        agent: 'opencode',
        events: [],
        summary: {
          totalTurns: 0,
          toolCalls: {
            file_read: 0,
            file_write: 0,
            file_edit: 0,
            shell: 0,
            web_fetch: 0,
            web_search: 0,
            glob: 0,
            grep: 0,
            list_dir: 0,
            agent_task: 0,
            unknown: 0,
          },
          totalToolCalls: 0,
          webFetches: [],
          filesRead: [],
          filesModified: [],
          shellCommands: [],
          errors: [],
          thinkingBlocks: 0,
        },
        parseSuccess: true,
      }

      expect(loadTranscript(JSON.stringify(transcript))).toEqual(transcript)
    })

    it('parses raw transcripts when agent is provided', () => {
      const raw = JSON.stringify({ type: 'text', part: { text: 'Hello' } })
      const result = loadTranscript(raw, 'opencode')

      expect(result.agent).toBe('opencode')
      expect(result.events).toHaveLength(1)
    })

    it('requires agent when loading raw transcripts', () => {
      const raw =
        JSON.stringify({ type: 'text', part: { text: 'Hello' } }) +
        '\n' +
        JSON.stringify({ type: 'text', part: { text: 'World' } })
      expect(() => loadTranscript(raw)).toThrow('Agent type is required')
    })
  })

  it('reports the supported agent list', () => {
    expect(SUPPORTED_AGENTS).toEqual(['opencode'])
  })
})
