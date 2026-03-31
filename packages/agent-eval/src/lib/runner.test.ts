import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as agentsIndex from './agents/index.js'
import type { Agent } from './agents/types.js'
import { runExperiment, runSingleEval } from './runner.js'
import type { EvalFixture, ResolvedExperimentConfig } from './types.js'

const TEST_DIR = '/tmp/eval-framework-runner-test'

describe('runner', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true })
    }
    vi.restoreAllMocks()
  })

  it('runs all attempts concurrently', async () => {
    const startTimes: number[] = []

    const mockAgent: Agent = {
      name: 'opencode',
      displayName: 'OpenCode',
      getApiKeyEnvVar: () => '',
      getDefaultModel: () => 'mock-model',
      run: vi.fn().mockImplementation(async () => {
        startTimes.push(Date.now())
        await new Promise((resolve) => setTimeout(resolve, 50))
        return {
          success: true,
          output: 'Agent output',
          duration: 50,
          testResult: { success: true, output: 'Test passed' },
          scriptsResults: {},
        }
      }),
    }

    vi.spyOn(agentsIndex, 'getAgent').mockReturnValue(mockAgent)

    const config: ResolvedExperimentConfig = {
      agent: 'opencode',
      model: 'github-copilot/claude-opus-4.6',
      evals: ['eval-1', 'eval-2'],
      runs: 3,
      earlyExit: false,
      scripts: [],
      timeout: 300,
      sandbox: 'docker',
      copyFiles: 'none',
    }

    const fixtures: EvalFixture[] = [
      { name: 'eval-1', path: '/fake/path/eval-1', prompt: 'Test 1', isModule: true },
      { name: 'eval-2', path: '/fake/path/eval-2', prompt: 'Test 2', isModule: true },
    ]

    await runExperiment({
      config,
      fixtures,
      apiKey: '',
      resultsDir: TEST_DIR,
      experimentName: 'test-experiment',
    })

    expect(mockAgent.run).toHaveBeenCalledTimes(6)
    expect(Math.max(...startTimes) - Math.min(...startTimes)).toBeLessThan(30)
  })

  it('aborts remaining attempts when one passes with earlyExit', async () => {
    const mockAgent: Agent = {
      name: 'opencode',
      displayName: 'OpenCode',
      getApiKeyEnvVar: () => '',
      getDefaultModel: () => 'mock-model',
      run: vi.fn().mockImplementation(async (_fixturePath: string, options: { signal?: AbortSignal }) => {
        if (options.signal?.aborted) {
          return { success: false, output: '', error: 'Aborted', duration: 0 }
        }

        await new Promise((resolve) => setTimeout(resolve, 10))

        if (options.signal?.aborted) {
          return { success: false, output: '', error: 'Aborted', duration: 10 }
        }

        return {
          success: true,
          output: 'Agent output',
          duration: 10,
          testResult: { success: true, output: 'Test passed' },
          scriptsResults: {},
        }
      }),
    }

    vi.spyOn(agentsIndex, 'getAgent').mockReturnValue(mockAgent)

    const results = await runExperiment({
      config: {
        agent: 'opencode',
        model: 'github-copilot/claude-opus-4.6',
        evals: ['test-eval'],
        runs: 5,
        earlyExit: true,
        scripts: [],
        timeout: 300,
        sandbox: 'docker',
        copyFiles: 'none',
      },
      fixtures: [{ name: 'test-eval', path: '/fake/path', prompt: 'Test prompt', isModule: true }],
      apiKey: '',
      resultsDir: TEST_DIR,
      experimentName: 'test-experiment',
    })

    expect(results.evals[0].totalRuns).toBe(1)
    expect(results.evals[0].passedRuns).toBe(1)
  })

  it('passes the expected options to agent.run', async () => {
    const mockSetup = vi.fn()
    const mockAgent: Agent = {
      name: 'opencode',
      displayName: 'OpenCode',
      getApiKeyEnvVar: () => '',
      getDefaultModel: () => 'mock-model',
      run: vi.fn().mockResolvedValue({
        success: true,
        output: 'Agent output',
        duration: 1000,
        testResult: { success: true, output: 'Test passed' },
        scriptsResults: {},
      }),
    }

    vi.spyOn(agentsIndex, 'getAgent').mockReturnValue(mockAgent)

    await runExperiment({
      config: {
        agent: 'opencode',
        model: 'github-copilot/claude-opus-4.6',
        evals: ['test-eval'],
        runs: 1,
        earlyExit: false,
        scripts: ['build', 'lint'],
        timeout: 600,
        setup: mockSetup,
        sandbox: 'docker',
        copyFiles: 'none',
      },
      fixtures: [{ name: 'test-eval', path: '/fake/path', prompt: 'Test prompt for agent', isModule: true }],
      apiKey: '',
      resultsDir: TEST_DIR,
      experimentName: 'test-experiment',
    })

    expect(mockAgent.run).toHaveBeenCalledWith('/fake/path', {
      prompt: 'Test prompt for agent',
      model: 'github-copilot/claude-opus-4.6',
      timeout: 600000,
      apiKey: '',
      setup: mockSetup,
      scripts: ['build', 'lint'],
      signal: expect.any(AbortSignal),
      sandbox: 'docker',
    })
  })

  it('uses opencode as the default single-eval agent', async () => {
    const mockAgent: Agent = {
      name: 'opencode',
      displayName: 'OpenCode',
      getApiKeyEnvVar: () => '',
      getDefaultModel: () => 'mock-model',
      run: vi.fn().mockResolvedValue({
        success: true,
        output: 'Agent output',
        duration: 1000,
        testResult: { success: true, output: 'Test passed' },
        scriptsResults: {},
      }),
    }

    const getAgentSpy = vi.spyOn(agentsIndex, 'getAgent').mockReturnValue(mockAgent)

    await runSingleEval(
      { name: 'test-eval', path: '/fake/path', prompt: 'Prompt', isModule: true },
      {
        model: 'github-copilot/claude-opus-4.6',
        timeout: 60,
        apiKey: '',
        scripts: [],
      },
    )

    expect(getAgentSpy).toHaveBeenCalledWith('opencode')
  })
})
