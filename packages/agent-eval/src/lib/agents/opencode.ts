/**
 * OpenCode CLI agent implementation.
 * Uses host-mounted credentials (GitHub Copilot, etc.) for model access.
 */

import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { DockerSandboxManager } from '../docker-sandbox.js'
import type { SandboxFile } from '../sandbox.js'
import { collectLocalFiles, createSandbox, type SandboxManager, splitTestFiles, verifyNoTestFiles } from '../sandbox.js'
import type { ModelTier } from '../types.js'
import {
  captureGeneratedFiles,
  createVitestConfig,
  initGitAndCommit,
  injectTranscriptContext,
  runValidation,
} from './shared.js'
import type { Agent, AgentRunOptions, AgentRunResult } from './types.js'

/** Union type for sandbox implementations */
type AnySandbox = SandboxManager | DockerSandboxManager

/**
 * Extract transcript from OpenCode JSON output.
 * When run with --format json, OpenCode outputs JSON events to stdout.
 */
function extractTranscriptFromOutput(output: string): string | undefined {
  if (!output?.trim()) {
    return undefined
  }

  const lines = output.split('\n').filter((line) => {
    const trimmed = line.trim()
    return trimmed.startsWith('{') && trimmed.endsWith('}')
  })

  if (lines.length === 0) {
    return undefined
  }

  return lines.join('\n')
}

/**
 * Generate OpenCode config file content.
 * Only sets permissions -- provider auth comes from mounted credentials.
 */
function generateOpenCodeConfig(): string {
  return `{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "write": "allow",
    "edit": "allow",
    "bash": "allow"
  }
}`
}

interface CredentialUpload {
  containerDir: string
  files: SandboxFile[]
}

function collectCredentialFiles(): CredentialUpload[] {
  const home = homedir()
  const uploads: CredentialUpload[] = []

  const candidates: { hostDir: string; containerDir: string; fileNames: string[] }[] = [
    {
      hostDir: join(home, '.local', 'share', 'opencode'),
      containerDir: '/home/node/.local/share/opencode',
      fileNames: ['auth.json'],
    },
    {
      hostDir: join(home, '.config', 'github-copilot'),
      containerDir: '/home/node/.config/github-copilot',
      fileNames: ['apps.json', 'hosts.json'],
    },
  ]

  for (const { hostDir, containerDir, fileNames } of candidates) {
    if (!existsSync(hostDir)) {
      console.warn(`OpenCode agent: credential path not found, skipping: ${hostDir}`)
      continue
    }

    const files: SandboxFile[] = []
    for (const name of fileNames) {
      const fullPath = join(hostDir, name)
      if (existsSync(fullPath)) {
        files.push({ path: name, content: readFileSync(fullPath) })
      }
    }

    if (files.length > 0) {
      uploads.push({ containerDir, files })
    }
  }

  return uploads
}

/**
 * Create OpenCode agent using host-mounted credentials.
 * Requires Docker sandbox (bind mounts are not supported on Vercel sandbox).
 */
export function createOpenCodeAgent(): Agent {
  return {
    name: 'opencode',
    displayName: 'OpenCode',

    getApiKeyEnvVar(): string {
      return ''
    },

    getDefaultModel(): ModelTier {
      return 'github-copilot/claude-opus-4.6'
    },

    async run(fixturePath: string, options: AgentRunOptions): Promise<AgentRunResult> {
      const startTime = Date.now()
      let sandbox: AnySandbox | null = null
      let agentOutput = ''
      let transcript: string | undefined
      let aborted = false
      let sandboxStopped = false

      const abortHandler = () => {
        aborted = true
        if (sandbox && !sandboxStopped) {
          sandboxStopped = true
          sandbox.stop().catch(() => {})
        }
      }

      if (options.signal) {
        if (options.signal.aborted) {
          return {
            success: false,
            output: '',
            error: 'Aborted before start',
            duration: 0,
          }
        }
        options.signal.addEventListener('abort', abortHandler)
      }

      try {
        const allFiles = await collectLocalFiles(fixturePath)
        const { workspaceFiles, testFiles } = splitTestFiles(allFiles)

        if (aborted) {
          return {
            success: false,
            output: '',
            error: 'Aborted',
            duration: Date.now() - startTime,
          }
        }

        const credentialUploads = collectCredentialFiles()

        const resolvedBackend = options.sandbox === 'vercel' ? 'vercel' : 'docker'
        if (resolvedBackend === 'vercel') {
          throw new Error(
            'OpenCode agent requires Docker sandbox for credential injection. ' +
              'Set sandbox: "docker" in your experiment config.',
          )
        }

        sandbox = await createSandbox({
          timeout: options.timeout,
          runtime: 'node24',
          backend: options.sandbox,
        })

        if (aborted) {
          return {
            success: false,
            output: '',
            error: 'Aborted',
            duration: Date.now() - startTime,
            sandboxId: sandbox.sandboxId,
          }
        }

        const dockerSandbox = sandbox as DockerSandboxManager
        for (const upload of credentialUploads) {
          await dockerSandbox.uploadFilesToPath(upload.containerDir, upload.files)
        }
        await dockerSandbox.ensureUserOwnership('/home/node')

        await sandbox.uploadFiles(workspaceFiles)

        await initGitAndCommit(sandbox)

        if (options.setup) {
          await options.setup(sandbox)
        }

        let installResult = await sandbox.runCommand('npm', ['install'])
        if (installResult.exitCode !== 0) {
          installResult = await sandbox.runCommand('npm', ['install'])
        }
        if (installResult.exitCode !== 0) {
          const output = (installResult.stdout + installResult.stderr).trim().split('\n').slice(-10).join('\n')
          throw new Error(`npm install failed (exit code ${installResult.exitCode}):\n${output}`)
        }

        const cliInstall = await sandbox.runCommand('npm', ['install', '-g', 'opencode-ai'])
        if (cliInstall.exitCode !== 0) {
          throw new Error(`OpenCode CLI install failed: ${cliInstall.stderr}`)
        }

        const configContent = generateOpenCodeConfig()
        await sandbox.writeFiles({
          'opencode.json': configContent,
        })

        await verifyNoTestFiles(sandbox)

        const opencodeResult = await sandbox.runCommand('opencode', [
          'run',
          options.prompt,
          '--model',
          options.model,
          '--format',
          'json',
        ])

        agentOutput = opencodeResult.stdout + opencodeResult.stderr
        transcript = extractTranscriptFromOutput(agentOutput)

        if (opencodeResult.exitCode !== 0) {
          const errorLines = agentOutput.trim().split('\n').slice(-5).join('\n')
          return {
            success: false,
            output: agentOutput,
            transcript,
            error: errorLines || `OpenCode CLI exited with code ${opencodeResult.exitCode}`,
            duration: Date.now() - startTime,
            sandboxId: sandbox.sandboxId,
          }
        }

        await sandbox.uploadFiles(testFiles)

        await createVitestConfig(sandbox)

        await injectTranscriptContext(sandbox, transcript, 'opencode', options.model)

        const validationResults = await runValidation(sandbox, options.scripts ?? [])

        const { generatedFiles, deletedFiles } = await captureGeneratedFiles(sandbox)

        return {
          success: validationResults.allPassed,
          output: agentOutput,
          transcript,
          duration: Date.now() - startTime,
          testResult: validationResults.test,
          scriptsResults: validationResults.scripts,
          sandboxId: sandbox.sandboxId,
          generatedFiles,
          deletedFiles,
        }
      } catch (error) {
        if (aborted) {
          return {
            success: false,
            output: agentOutput,
            transcript,
            error: 'Aborted',
            duration: Date.now() - startTime,
            sandboxId: sandbox?.sandboxId,
          }
        }
        return {
          success: false,
          output: agentOutput,
          transcript,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
          sandboxId: sandbox?.sandboxId,
        }
      } finally {
        if (options.signal) {
          options.signal.removeEventListener('abort', abortHandler)
        }
        if (sandbox && !sandboxStopped) {
          sandboxStopped = true
          await sandbox.stop()
        }
      }
    },
  }
}
