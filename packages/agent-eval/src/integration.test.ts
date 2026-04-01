/**
 * End-to-end integration tests for the eval framework.
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { config as dotenvConfig } from 'dotenv'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadConfig } from './lib/config.js'
import { loadAllFixtures, loadFixture } from './lib/fixture.js'
import { initProject } from './lib/init.js'
import { runSingleEval } from './lib/runner.js'

dotenvConfig({ path: '.env.local' })
dotenvConfig()

const TEST_DIR = '/tmp/eval-framework-integration-test'

function isDockerAvailableSync(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

describe.skipIf(!process.env.INTEGRATION_TEST)('integration tests', () => {
  beforeAll(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterAll(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true })
    }
  })

  describe('project initialization', () => {
    beforeAll(() => {
      const projectDir = join(TEST_DIR, 'test-project')
      if (!existsSync(projectDir)) {
        initProject({
          name: 'test-project',
          targetDir: TEST_DIR,
        })
      }
    })

    it('creates an opencode project structure', () => {
      const projectDir = join(TEST_DIR, 'test-project')

      expect(existsSync(join(projectDir, 'package.json'))).toBe(true)
      expect(existsSync(join(projectDir, 'experiments/opencode.ts'))).toBe(true)
      expect(existsSync(join(projectDir, 'evals/add-greeting/PROMPT.md'))).toBe(true)
      expect(existsSync(join(projectDir, 'evals/add-greeting/EVAL.ts'))).toBe(true)
      expect(existsSync(join(projectDir, 'evals/add-greeting/package.json'))).toBe(true)

      const pkg = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf-8'))
      expect(pkg.name).toBe('test-project')
      expect(pkg.type).toBe('module')
    })

    it('loads fixtures from the generated project', () => {
      const { fixtures, errors } = loadAllFixtures(join(TEST_DIR, 'test-project', 'evals'))

      expect(errors).toHaveLength(0)
      expect(fixtures).toHaveLength(1)
      expect(fixtures[0].name).toBe('add-greeting')
    })

    it('loads the generated opencode config', async () => {
      const config = await loadConfig(join(TEST_DIR, 'test-project', 'experiments/opencode.ts'))

      expect(config.agent).toBe('opencode')
      expect(config.model).toBe('github-copilot/claude-opus-4.6')
      expect(config.sandbox).toBe('docker')
    })
  })

  it.skipIf(!isDockerAvailableSync())('fails fast when opencode is forced onto the vercel sandbox', async () => {
    const fixtureDir = join(TEST_DIR, 'vercel-only-fixture')
    mkdirSync(join(fixtureDir, 'src'), { recursive: true })
    writeFileSync(join(fixtureDir, 'PROMPT.md'), 'Say hello')
    writeFileSync(
      join(fixtureDir, 'EVAL.ts'),
      "import { test, expect } from 'vitest'; test('dummy', () => expect(true).toBe(true));",
    )
    writeFileSync(
      join(fixtureDir, 'package.json'),
      JSON.stringify({ name: 'fixture', type: 'module', devDependencies: { vitest: '^2.1.0' } }),
    )
    writeFileSync(join(fixtureDir, 'src/index.ts'), '')

    const fixture = loadFixture(TEST_DIR, 'vercel-only-fixture')
    const result = await runSingleEval(fixture, {
      agent: 'opencode',
      model: 'github-copilot/claude-opus-4.6',
      timeout: 60,
      apiKey: '',
      scripts: [],
      sandbox: 'vercel',
    })

    expect(result.result.status).toBe('failed')
    expect(result.result.error).toContain('requires Docker sandbox')
  })
})
