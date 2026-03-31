import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getPostInitInstructions, initProject } from './init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = resolve(__dirname, '../..')

const TEST_DIR = '/tmp/eval-framework-init-test'

describe('init utilities', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true })
    }
  })

  describe('initProject', () => {
    it('creates project directory structure', () => {
      const projectDir = initProject({
        name: 'my-evals',
        targetDir: TEST_DIR,
      })

      expect(existsSync(projectDir)).toBe(true)
      expect(existsSync(join(projectDir, 'package.json'))).toBe(true)
      expect(existsSync(join(projectDir, '.tool-versions'))).toBe(true)
      expect(existsSync(join(projectDir, '.env.example'))).toBe(true)
      expect(existsSync(join(projectDir, '.gitignore'))).toBe(true)
      expect(existsSync(join(projectDir, 'experiments'))).toBe(true)
      expect(existsSync(join(projectDir, 'evals'))).toBe(true)
    })

    it('creates opencode experiment config', () => {
      const projectDir = initProject({
        name: 'test-project',
        targetDir: TEST_DIR,
      })

      const configPath = join(projectDir, 'experiments/opencode.ts')
      expect(existsSync(configPath)).toBe(true)

      const content = readFileSync(configPath, 'utf-8')
      expect(content).toContain("from 'agent-eval-opencode'")
      expect(content).toContain("agent: 'opencode'")
    })

    it('creates example eval fixture', () => {
      const projectDir = initProject({
        name: 'test-project',
        targetDir: TEST_DIR,
      })

      const evalDir = join(projectDir, 'evals/add-greeting')
      expect(existsSync(evalDir)).toBe(true)
      expect(existsSync(join(evalDir, 'PROMPT.md'))).toBe(true)
      expect(existsSync(join(evalDir, 'EVAL.ts'))).toBe(true)
      expect(existsSync(join(evalDir, 'package.json'))).toBe(true)
      expect(existsSync(join(evalDir, 'src/App.tsx'))).toBe(true)
    })

    it('creates valid package.json with correct name', () => {
      const projectDir = initProject({
        name: 'custom-name',
        targetDir: TEST_DIR,
      })

      const pkgPath = join(projectDir, 'package.json')
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

      expect(pkg.name).toBe('custom-name')
      expect(pkg.packageManager).toBe('pnpm@10.33.0')
      expect(pkg.type).toBe('module')
      expect(pkg.scripts).toBeUndefined()
    })

    it('uses the forked package name in devDependencies', () => {
      const projectDir = initProject({
        name: 'test-project',
        targetDir: TEST_DIR,
      })

      const pkgPath = join(projectDir, 'package.json')
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

      expect(pkg.devDependencies['agent-eval-opencode']).toBeDefined()
      expect(pkg.devDependencies['@vercel/agent-eval']).toBeUndefined()
    })

    it('creates .tool-versions for asdf', () => {
      const projectDir = initProject({
        name: 'test-project',
        targetDir: TEST_DIR,
      })

      const toolVersionsPath = join(projectDir, '.tool-versions')
      const content = readFileSync(toolVersionsPath, 'utf-8')

      expect(content).toContain('nodejs 24.14.1')
      expect(content).toContain('pnpm 10.33.0')
    })

    it('creates eval fixture with type: module', () => {
      const projectDir = initProject({
        name: 'test-project',
        targetDir: TEST_DIR,
      })

      const evalPkgPath = join(projectDir, 'evals/add-greeting/package.json')
      const pkg = JSON.parse(readFileSync(evalPkgPath, 'utf-8'))

      expect(pkg.type).toBe('module')
    })

    it('throws if directory already exists', () => {
      // Create the directory first
      mkdirSync(join(TEST_DIR, 'existing-project'))

      expect(() =>
        initProject({
          name: 'existing-project',
          targetDir: TEST_DIR,
        }),
      ).toThrow('Directory already exists')
    })

    it('supports absolute output paths', () => {
      const absoluteProjectDir = '/tmp/eval-framework-init-test/absolute-project'

      const projectDir = initProject({
        name: absoluteProjectDir,
        targetDir: TEST_DIR,
      })

      expect(projectDir).toBe(absoluteProjectDir)
      expect(existsSync(join(absoluteProjectDir, 'package.json'))).toBe(true)

      const pkg = JSON.parse(readFileSync(join(absoluteProjectDir, 'package.json'), 'utf-8'))
      expect(pkg.name).toBe('absolute-project')
    })

    it('creates .env.example with sandbox info', () => {
      const projectDir = initProject({
        name: 'test-project',
        targetDir: TEST_DIR,
      })

      const envPath = join(projectDir, '.env.example')
      const content = readFileSync(envPath, 'utf-8')

      expect(content).toContain('opencode')
      expect(content).toContain('VERCEL_TOKEN')
    })

    it('creates .gitignore with common patterns', () => {
      const projectDir = initProject({
        name: 'test-project',
        targetDir: TEST_DIR,
      })

      const gitignorePath = join(projectDir, '.gitignore')
      const content = readFileSync(gitignorePath, 'utf-8')

      expect(content).toContain('node_modules')
      expect(content).toContain('.env')
      expect(content).toContain('results/')
    })

    it('passes TypeScript type checking after pnpm install', { timeout: 120000 }, () => {
      const projectDir = initProject({
        name: 'typecheck-test',
        targetDir: TEST_DIR,
      })

      // For testing, link the local package instead of downloading from npm
      // This allows the test to work before publishing
      const pkgPath = join(projectDir, 'package.json')
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      pkg.devDependencies['agent-eval-opencode'] = `file:${PROJECT_ROOT}`
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))

      // Install dependencies
      execSync('pnpm install', {
        cwd: projectDir,
        stdio: 'pipe',
      })

      // Run type checker - this should pass without errors
      // This catches issues like missing @types/node, vitest types, etc.
      execSync('npx tsc --noEmit', {
        cwd: projectDir,
        stdio: 'pipe',
      })
    })
  })

  describe('getPostInitInstructions', () => {
    it('returns instructions with project path', () => {
      const instructions = getPostInitInstructions('/path/to/project', 'my-project')

      expect(instructions).toContain('/path/to/project')
      expect(instructions).toContain('cd my-project')
      expect(instructions).toContain('asdf install')
      expect(instructions).toContain('pnpm install')
      expect(instructions).toContain('npx agent-eval-opencode --dry')
    })
  })
})
