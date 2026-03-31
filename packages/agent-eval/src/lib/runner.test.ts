import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./rubric.js', () => ({
  gradeRunWithRubric: vi.fn(),
}))

import * as agentsIndex from './agents/index.js'
import type { Agent } from './agents/types.js'
import * as rubric from './rubric.js'
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

  it('runs all attempts when earlyExit is true but all runs fail', async () => {
    const mockAgent: Agent = {
      name: 'opencode',
      displayName: 'OpenCode',
      getApiKeyEnvVar: () => '',
      getDefaultModel: () => 'mock-model',
      run: vi.fn().mockResolvedValue({
        success: false,
        output: 'Agent output',
        duration: 6000,
        error: 'Test failed',
        testResult: { success: false, output: 'Test failed' },
        scriptsResults: {},
      }),
    }

    vi.spyOn(agentsIndex, 'getAgent').mockReturnValue(mockAgent)

    const config: ResolvedExperimentConfig = {
      agent: 'opencode',
      model: 'github-copilot/claude-opus-4.6',
      evals: ['test-eval'],
      runs: 3,
      earlyExit: true,
      scripts: [],
      timeout: 300,
      copyFiles: 'none',
      sandbox: 'docker',
    }

    const fixtures: EvalFixture[] = [
      {
        name: 'test-eval',
        path: '/fake/path',
        prompt: 'Test prompt',
        isModule: true,
      },
    ]

    const results = await runExperiment({
      config,
      fixtures,
      apiKey: '',
      resultsDir: TEST_DIR,
      experimentName: 'test-experiment',
    })

    expect(mockAgent.run).toHaveBeenCalledTimes(3)
    expect(results.evals[0].totalRuns).toBe(3)
    expect(results.evals[0].passedRuns).toBe(0)
  })

  it('runs all configured runs when earlyExit is false', async () => {
    const mockAgent: Agent = {
      name: 'opencode',
      displayName: 'OpenCode',
      getApiKeyEnvVar: () => '',
      getDefaultModel: () => 'mock-model',
      run: vi.fn().mockResolvedValue({
        success: true,
        output: 'Agent output',
        duration: 6000,
        testResult: { success: true, output: 'Test passed' },
        scriptsResults: {},
      }),
    }

    vi.spyOn(agentsIndex, 'getAgent').mockReturnValue(mockAgent)

    const config: ResolvedExperimentConfig = {
      agent: 'opencode',
      model: 'github-copilot/claude-opus-4.6',
      evals: ['test-eval'],
      runs: 4,
      earlyExit: false,
      scripts: [],
      timeout: 300,
      copyFiles: 'none',
      sandbox: 'docker',
    }

    const fixtures: EvalFixture[] = [
      {
        name: 'test-eval',
        path: '/fake/path',
        prompt: 'Test prompt',
        isModule: true,
      },
    ]

    const results = await runExperiment({
      config,
      fixtures,
      apiKey: '',
      resultsDir: TEST_DIR,
      experimentName: 'test-experiment',
    })

    expect(mockAgent.run).toHaveBeenCalledTimes(4)
    expect(results.evals[0].totalRuns).toBe(4)
    expect(results.evals[0].passedRuns).toBe(4)
  })

  it('aborts in-flight runs when one passes', async () => {
    const abortEvents: string[] = []
    let completedCount = 0

    const mockAgent: Agent = {
      name: 'opencode',
      displayName: 'OpenCode',
      getApiKeyEnvVar: () => '',
      getDefaultModel: () => 'mock-model',
      run: vi.fn().mockImplementation(async (_fixturePath: string, options: { signal?: AbortSignal }) => {
        const runId = completedCount
        completedCount++

        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            abortEvents.push(`run-${runId}-aborted-at-${Date.now()}`)
          })
        }

        if (runId === 0) {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return {
            success: true,
            output: 'Agent output',
            duration: 10,
            testResult: { success: true, output: 'Test passed' },
            scriptsResults: {},
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100))

        if (options.signal?.aborted) {
          return {
            success: false,
            output: '',
            error: 'Aborted',
            duration: 100,
          }
        }

        return {
          success: true,
          output: 'Agent output',
          duration: 100,
          testResult: { success: true, output: 'Test passed' },
          scriptsResults: {},
        }
      }),
    }

    vi.spyOn(agentsIndex, 'getAgent').mockReturnValue(mockAgent)

    const config: ResolvedExperimentConfig = {
      agent: 'opencode',
      model: 'github-copilot/claude-opus-4.6',
      evals: ['test-eval'],
      runs: 3,
      earlyExit: true,
      scripts: [],
      timeout: 300,
      copyFiles: 'none',
      sandbox: 'docker',
    }

    const fixtures: EvalFixture[] = [
      {
        name: 'test-eval',
        path: '/fake/path',
        prompt: 'Test prompt',
        isModule: true,
      },
    ]

    const results = await runExperiment({
      config,
      fixtures,
      apiKey: '',
      resultsDir: TEST_DIR,
      experimentName: 'test-experiment',
    })

    expect(mockAgent.run).toHaveBeenCalledTimes(3)
    expect(results.evals[0].totalRuns).toBe(1)
    expect(results.evals[0].passedRuns).toBe(1)
    expect(abortEvents.length).toBeGreaterThanOrEqual(2)
  })

  it('always passes signal for timeout cleanup even when earlyExit is false', async () => {
    const receivedSignals: (AbortSignal | undefined)[] = []

    const mockAgent: Agent = {
      name: 'opencode',
      displayName: 'OpenCode',
      getApiKeyEnvVar: () => '',
      getDefaultModel: () => 'mock-model',
      run: vi.fn().mockImplementation(async (_fixturePath: string, options: { signal?: AbortSignal }) => {
        receivedSignals.push(options.signal)
        return {
          success: true,
          output: 'Agent output',
          duration: 1000,
          testResult: { success: true, output: 'Test passed' },
          scriptsResults: {},
        }
      }),
    }

    vi.spyOn(agentsIndex, 'getAgent').mockReturnValue(mockAgent)

    const config: ResolvedExperimentConfig = {
      agent: 'opencode',
      model: 'github-copilot/claude-opus-4.6',
      evals: ['test-eval'],
      runs: 2,
      earlyExit: false,
      scripts: [],
      timeout: 300,
      copyFiles: 'none',
      sandbox: 'docker',
    }

    const fixtures: EvalFixture[] = [
      {
        name: 'test-eval',
        path: '/fake/path',
        prompt: 'Test prompt',
        isModule: true,
      },
    ]

    await runExperiment({
      config,
      fixtures,
      apiKey: '',
      resultsDir: TEST_DIR,
      experimentName: 'test-experiment',
    })

    expect(receivedSignals.every((signal) => signal instanceof AbortSignal)).toBe(true)
  })

  it('runs all fixtures with independent early exit per fixture', async () => {
    const callsByPath = new Map<string, number>()

    const mockAgent: Agent = {
      name: 'opencode',
      displayName: 'OpenCode',
      getApiKeyEnvVar: () => '',
      getDefaultModel: () => 'mock-model',
      run: vi.fn().mockImplementation(async (fixturePath: string) => {
        const count = (callsByPath.get(fixturePath) ?? 0) + 1
        callsByPath.set(fixturePath, count)

        if (fixturePath.includes('eval-1')) {
          return {
            success: true,
            output: 'Agent output',
            duration: 6000,
            testResult: { success: true, output: 'Test passed' },
            scriptsResults: {},
          }
        }

        const success = count > 1
        return {
          success,
          output: 'Agent output',
          duration: 6000,
          error: success ? undefined : 'Test failed',
          testResult: { success, output: success ? 'Test passed' : 'Test failed' },
          scriptsResults: {},
        }
      }),
    }

    vi.spyOn(agentsIndex, 'getAgent').mockReturnValue(mockAgent)

    const config: ResolvedExperimentConfig = {
      agent: 'opencode',
      model: 'github-copilot/claude-opus-4.6',
      evals: ['eval-1', 'eval-2'],
      runs: 5,
      earlyExit: true,
      scripts: [],
      timeout: 300,
      copyFiles: 'none',
      sandbox: 'docker',
    }

    const fixtures: EvalFixture[] = [
      {
        name: 'eval-1',
        path: '/fake/path/eval-1',
        prompt: 'Test prompt 1',
        isModule: true,
      },
      {
        name: 'eval-2',
        path: '/fake/path/eval-2',
        prompt: 'Test prompt 2',
        isModule: true,
      },
    ]

    const results = await runExperiment({
      config,
      fixtures,
      apiKey: '',
      resultsDir: TEST_DIR,
      experimentName: 'test-experiment',
    })

    expect(results.evals[0].totalRuns).toBe(1)
    expect(results.evals[0].passedRuns).toBe(1)
    expect(results.evals[1].totalRuns).toBe(2)
    expect(results.evals[1].passedRuns).toBe(1)
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

  it('times out and returns error when agent exceeds timeout', async () => {
    const mockAgent: Agent = {
      name: 'opencode',
      displayName: 'OpenCode',
      getApiKeyEnvVar: () => '',
      getDefaultModel: () => 'mock-model',
      run: vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return {
          success: true,
          output: 'Should not reach this',
          duration: 500,
          testResult: { success: true, output: 'Test passed' },
          scriptsResults: {},
        }
      }),
    }

    vi.spyOn(agentsIndex, 'getAgent').mockReturnValue(mockAgent)

    const config: ResolvedExperimentConfig = {
      agent: 'opencode',
      model: 'github-copilot/claude-opus-4.6',
      evals: ['test-eval'],
      runs: 1,
      earlyExit: false,
      scripts: [],
      timeout: 0.1,
      copyFiles: 'none',
      sandbox: 'docker',
    }

    const fixtures: EvalFixture[] = [
      {
        name: 'test-eval',
        path: '/fake/path',
        prompt: 'Test prompt',
        isModule: true,
      },
    ]

    const startTime = Date.now()
    const results = await runExperiment({
      config,
      fixtures,
      apiKey: '',
      resultsDir: TEST_DIR,
      experimentName: 'test-experiment',
    })
    const elapsed = Date.now() - startTime

    expect(results.evals[0].passedRuns).toBe(0)
    expect(results.evals[0].runs[0].result.status).toBe('failed')
    expect(results.evals[0].runs[0].result.error).toContain('timed out')
    expect(elapsed).toBeLessThan(300)
  })

  it('signals abort to agent on timeout for cleanup', async () => {
    let receivedSignal: AbortSignal | undefined
    let signalAborted = false

    const mockAgent: Agent = {
      name: 'opencode',
      displayName: 'OpenCode',
      getApiKeyEnvVar: () => '',
      getDefaultModel: () => 'mock-model',
      run: vi.fn().mockImplementation(async (_path: string, options: { signal?: AbortSignal }) => {
        receivedSignal = options.signal

        if (receivedSignal) {
          receivedSignal.addEventListener('abort', () => {
            signalAborted = true
          })
        }

        await new Promise((resolve) => setTimeout(resolve, 500))
        return {
          success: true,
          output: 'Done',
          duration: 500,
          testResult: { success: true, output: 'Test passed' },
          scriptsResults: {},
        }
      }),
    }

    vi.spyOn(agentsIndex, 'getAgent').mockReturnValue(mockAgent)

    const config: ResolvedExperimentConfig = {
      agent: 'opencode',
      model: 'github-copilot/claude-opus-4.6',
      evals: ['test-eval'],
      runs: 1,
      earlyExit: false,
      scripts: [],
      timeout: 0.1,
      copyFiles: 'none',
      sandbox: 'docker',
    }

    const fixtures: EvalFixture[] = [
      {
        name: 'test-eval',
        path: '/fake/path',
        prompt: 'Test prompt',
        isModule: true,
      },
    ]

    await runExperiment({
      config,
      fixtures,
      apiKey: '',
      resultsDir: TEST_DIR,
      experimentName: 'test-experiment',
    })

    expect(receivedSignal).toBeDefined()
    expect(signalAborted).toBe(true)
  })

  describe('rubric grading', () => {
    it('fails the overall run when rubric grading fails', async () => {
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
      vi.spyOn(rubric, 'gradeRunWithRubric').mockResolvedValue({
        status: 'failed',
        model: 'github-copilot/claude-opus-4.6',
        output: { overall_pass: false },
      })

      const config: ResolvedExperimentConfig = {
        agent: 'opencode',
        model: 'github-copilot/claude-opus-4.6',
        evals: ['test-eval'],
        runs: 1,
        earlyExit: false,
        scripts: [],
        timeout: 300,
        copyFiles: 'none',
        sandbox: 'docker',
        rubric: {
          prompt: 'Grade this output',
          schema: { type: 'object' },
          passField: 'overall_pass',
        },
      }

      const fixtures: EvalFixture[] = [{ name: 'test-eval', path: '/fake/path', prompt: 'Test prompt', isModule: true }]

      const results = await runExperiment({
        config,
        fixtures,
        apiKey: '',
        resultsDir: TEST_DIR,
        experimentName: 'test-experiment',
      })

      expect(results.evals[0].passedRuns).toBe(0)
      expect(results.evals[0].deterministic.passedRuns).toBe(1)
      expect(results.evals[0].rubric?.passedRuns).toBe(0)
      expect(results.evals[0].runs[0].result.status).toBe('failed')
      expect(results.evals[0].runs[0].result.rubric?.status).toBe('failed')
    })

    it('skips rubric grading when deterministic validation already failed', async () => {
      const mockAgent: Agent = {
        name: 'opencode',
        displayName: 'OpenCode',
        getApiKeyEnvVar: () => '',
        getDefaultModel: () => 'mock-model',
        run: vi.fn().mockResolvedValue({
          success: false,
          output: 'Agent output',
          duration: 6000,
          error: 'Test failed',
          testResult: { success: false, output: 'Test failed' },
          scriptsResults: {},
        }),
      }

      vi.spyOn(agentsIndex, 'getAgent').mockReturnValue(mockAgent)
      const rubricSpy = vi.spyOn(rubric, 'gradeRunWithRubric').mockResolvedValue({
        status: 'passed',
        model: 'github-copilot/claude-opus-4.6',
        output: { overall_pass: true },
      })

      const config: ResolvedExperimentConfig = {
        agent: 'opencode',
        model: 'github-copilot/claude-opus-4.6',
        evals: ['test-eval'],
        runs: 1,
        earlyExit: false,
        scripts: [],
        timeout: 300,
        copyFiles: 'none',
        sandbox: 'docker',
        rubric: {
          prompt: 'Grade this output',
          schema: { type: 'object' },
          passField: 'overall_pass',
        },
      }

      const fixtures: EvalFixture[] = [{ name: 'test-eval', path: '/fake/path', prompt: 'Test prompt', isModule: true }]

      const results = await runExperiment({
        config,
        fixtures,
        apiKey: '',
        resultsDir: TEST_DIR,
        experimentName: 'test-experiment',
      })

      expect(results.evals[0].passedRuns).toBe(0)
      expect(results.evals[0].deterministic.passedRuns).toBe(0)
      expect(results.evals[0].rubric).toBeUndefined()
      expect(rubricSpy).not.toHaveBeenCalled()
    })
  })
})
