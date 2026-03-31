import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AgentRunResult } from './agents/types.js'
import {
  agentResultToEvalRunData,
  createEvalSummary,
  createExperimentResults,
  formatResultsTable,
  formatRunResult,
  saveResults,
  scanReusableResults,
} from './results.js'
import type { EvalRunData, EvalRunResult, ResolvedExperimentConfig } from './types.js'

const TEST_DIR = '/tmp/eval-framework-results-test'

describe('results utilities', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true })
    }
  })

  it('converts agent results into run data', () => {
    const agentResult: AgentRunResult = {
      success: true,
      output: 'Agent output',
      transcript: '{"type":"text","part":{"text":"Hello"}}',
      duration: 45000,
      testResult: { success: true, output: 'test output' },
      scriptsResults: { build: { success: true, output: 'build output' } },
    }

    const runData = agentResultToEvalRunData(agentResult)

    expect(runData.result.status).toBe('passed')
    expect(runData.result.duration).toBe(45)
    expect(runData.outputContent?.eval).toBe('test output')
    expect(runData.outputContent?.scripts?.build).toBe('build output')
  })

  it('creates experiment results with timestamps', () => {
    const config: ResolvedExperimentConfig = {
      agent: 'opencode',
      model: 'github-copilot/claude-opus-4.6',
      evals: ['eval-1'],
      runs: 2,
      earlyExit: false,
      scripts: ['build'],
      timeout: 300,
      sandbox: 'docker',
      copyFiles: 'none',
    }

    const evals = [createEvalSummary('eval-1', [{ result: { status: 'passed', duration: 10 } }])]
    const startedAt = new Date('2024-01-26T12:00:00Z')
    const completedAt = new Date('2024-01-26T12:05:00Z')

    const results = createExperimentResults(config, evals, startedAt, completedAt)

    expect(results.startedAt).toBe('2024-01-26T12:00:00.000Z')
    expect(results.completedAt).toBe('2024-01-26T12:05:00.000Z')
  })

  it('saves results with the expected artifact layout', () => {
    const config: ResolvedExperimentConfig = {
      agent: 'opencode',
      model: 'github-copilot/claude-opus-4.6',
      evals: ['eval-1'],
      runs: 1,
      earlyExit: true,
      scripts: [],
      timeout: 300,
      sandbox: 'docker',
      copyFiles: 'none',
    }

    const evals = [
      createEvalSummary('eval-1', [
        {
          result: { status: 'passed', duration: 10 },
          transcript: '{"type":"text","part":{"text":"Hello"}}',
          outputContent: { eval: 'Test output here', scripts: { build: 'Build output here' } },
        },
      ]),
    ]

    const results = createExperimentResults(
      config,
      evals,
      new Date('2024-01-26T12:00:00Z'),
      new Date('2024-01-26T12:01:00Z'),
    )

    const outputDir = saveResults(results, {
      resultsDir: TEST_DIR,
      experimentName: 'test-experiment',
    })

    expect(existsSync(join(outputDir, 'eval-1', 'summary.json'))).toBe(true)
    expect(existsSync(join(outputDir, 'eval-1', 'run-1', 'result.json'))).toBe(true)
    expect(existsSync(join(outputDir, 'eval-1', 'run-1', 'transcript.json'))).toBe(true)
    expect(existsSync(join(outputDir, 'eval-1', 'run-1', 'transcript-raw.jsonl'))).toBe(true)
    expect(existsSync(join(outputDir, 'eval-1', 'run-1', 'outputs', 'eval.txt'))).toBe(true)
    expect(existsSync(join(outputDir, 'eval-1', 'run-1', 'outputs', 'scripts', 'build.txt'))).toBe(true)

    const resultJson = JSON.parse(readFileSync(join(outputDir, 'eval-1', 'run-1', 'result.json'), 'utf-8'))
    expect(resultJson.model).toBe('github-copilot/claude-opus-4.6')
    expect(resultJson.transcriptPath).toBe('./transcript.json')
    expect(resultJson.transcriptRawPath).toBe('./transcript-raw.jsonl')
    expect(resultJson.o11y).toBeDefined()

    const parsedTranscript = JSON.parse(readFileSync(join(outputDir, 'eval-1', 'run-1', 'transcript.json'), 'utf-8'))
    expect(parsedTranscript.agent).toBe('opencode')
  })

  it('formats result tables and run summaries', () => {
    const config: ResolvedExperimentConfig = {
      agent: 'opencode',
      model: 'github-copilot/claude-opus-4.6',
      evals: ['eval-1', 'eval-2'],
      runs: 2,
      earlyExit: false,
      scripts: [],
      timeout: 300,
      sandbox: 'docker',
      copyFiles: 'none',
    }

    const evals = [
      createEvalSummary('eval-1', [
        { result: { status: 'passed', duration: 10 } },
        { result: { status: 'passed', duration: 12 } },
      ]),
      createEvalSummary('eval-2', [
        { result: { status: 'passed', duration: 8 } },
        { result: { status: 'failed', duration: 15, error: 'Error' } },
      ]),
    ]

    const results = createExperimentResults(
      config,
      evals,
      new Date('2024-01-26T12:00:00Z'),
      new Date('2024-01-26T12:01:00Z'),
    )

    expect(formatResultsTable(results)).toContain('Overall')
    expect(formatRunResult('failing-eval', 1, 2, { status: 'failed', duration: 1, error: 'boom' })).toContain('boom')
  })

  it('finds reusable results by fingerprint', () => {
    const expDir = join(TEST_DIR, 'my-exp', '2024-01-26T12-00-00.000Z', 'eval-1')
    mkdirSync(expDir, { recursive: true })
    writeFileSync(
      join(expDir, 'summary.json'),
      JSON.stringify({ totalRuns: 2, passedRuns: 1, passRate: '50%', meanDuration: 10, fingerprint: 'abc123' }),
    )

    const result = scanReusableResults(TEST_DIR, 'my-exp', { 'eval-1': 'abc123' })
    expect(result.get('eval-1')?.fingerprint).toBe('abc123')
  })
})
