/**
 * Failure classification for eval results.
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import {
  DEFAULT_OPENCODE_MODEL,
  generateOpenCodeConfig,
  hasOpenCodeCredentials,
  uploadOpenCodeCredentials,
} from './agents/opencode.js'
import { parseOpenCodeTranscript } from './o11y/index.js'
import type { DockerSandboxManager } from './docker-sandbox.js'
import { createSandbox, type SandboxFile } from './sandbox.js'
import type { Classification } from './types.js'

const CLASSIFICATION_SENTINEL = 'CLASSIFICATION_JSON:'

export function isClassifierEnabled(): boolean {
  if (process.env.OPENCODE_CLASSIFIER_TEST_MODE === '1') {
    return true
  }

  return hasOpenCodeCredentials()
}

function buildClassifierPrompt(evalName: string, experimentName: string): string {
  return `You are classifying a failed eval run for an AI coding benchmark.

Eval: ${evalName}
Experiment: ${experimentName}

Inspect the files in the current working directory.
You will find summary.json, run-*/result.json, transcript files, and test/script outputs.

Classify into exactly one of:
- model: the model ran and attempted the task, but produced incorrect code
- infra: infrastructure broke and the model never really got to do useful work
- timeout: the run hit its time limit

Important guidance:
- Transcript evidence matters most.
- Test or build failures alone do not prove a model failure.
- Missing transcript, or a transcript showing only startup/errors with no meaningful model activity, is infra.

Output exactly one final line in this format:
${CLASSIFICATION_SENTINEL}{"failureType":"model|infra|timeout","failureReason":"short explanation"}`
}

function collectClassifierFiles(evalResultDir: string): SandboxFile[] {
  const files: SandboxFile[] = []

  function walk(currentDir: string, relativePath = ''): void {
    for (const entry of readdirSync(currentDir)) {
      const fullPath = join(currentDir, entry)
      const nextRelativePath = relativePath ? `${relativePath}/${entry}` : entry
      const info = statSync(fullPath)

      if (info.isDirectory()) {
        walk(fullPath, nextRelativePath)
      } else {
        files.push({ path: nextRelativePath, content: readFileSync(fullPath) })
      }
    }
  }

  walk(evalResultDir)
  return files
}

export function parseClassifierDecision(output: string): Classification | null {
  const candidateLines: string[] = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const { events } = parseOpenCodeTranscript(output)
  for (const event of events) {
    if (event.type === 'message' && event.content) {
      candidateLines.push(...event.content.split('\n').map((line) => line.trim()).filter(Boolean))
    }
  }

  for (let i = candidateLines.length - 1; i >= 0; i--) {
    const line = candidateLines[i]
    if (!line.startsWith(CLASSIFICATION_SENTINEL)) {
      continue
    }

    const payload = line.slice(CLASSIFICATION_SENTINEL.length)
    try {
      const parsed = JSON.parse(payload) as Classification
      if (
        (parsed.failureType === 'model' || parsed.failureType === 'infra' || parsed.failureType === 'timeout') &&
        typeof parsed.failureReason === 'string' &&
        parsed.failureReason.trim().length > 0
      ) {
        return {
          failureType: parsed.failureType,
          failureReason: parsed.failureReason.trim(),
        }
      }
    } catch {
      return null
    }
  }

  return null
}

export async function classifyWithOpenCode(
  evalResultDir: string,
  evalName: string,
  experimentName: string,
): Promise<Classification | null> {
  if (!isClassifierEnabled()) {
    return null
  }

  let sandbox: DockerSandboxManager | null = null

  try {
    sandbox = (await createSandbox({ backend: 'docker', runtime: 'node24', timeout: 180000 })) as DockerSandboxManager
    await uploadOpenCodeCredentials(sandbox)
    await sandbox.uploadFiles(collectClassifierFiles(evalResultDir))
    await sandbox.writeFiles({
      'opencode.json': generateOpenCodeConfig({ write: 'deny', edit: 'deny', bash: 'deny' }),
    })

    const cliInstall = await sandbox.runCommand('npm', ['install', '-g', 'opencode-ai'])
    if (cliInstall.exitCode !== 0) {
      return null
    }

    const prompt = buildClassifierPrompt(basename(evalName), experimentName)
    const result = await sandbox.runCommand('opencode', [
      'run',
      prompt,
      '--model',
      DEFAULT_OPENCODE_MODEL,
      '--format',
      'json',
    ])

    return parseClassifierDecision(result.stdout + result.stderr)
  } catch {
    return null
  } finally {
    if (sandbox) {
      await sandbox.stop().catch(() => {})
    }
  }
}

export async function classifyFailure(
  evalResultDir: string,
  evalName: string,
  experimentName: string,
): Promise<Classification | null> {
  const cachedPath = join(evalResultDir, 'classification.json')
  try {
    const cached = JSON.parse(readFileSync(cachedPath, 'utf-8'))
    if (cached.failureType && cached.failureReason) {
      return { failureType: cached.failureType, failureReason: cached.failureReason }
    }
  } catch {
    // No cache
  }

  const classification = await classifyWithOpenCode(evalResultDir, evalName, experimentName)

  if (classification) {
    try {
      writeFileSync(cachedPath, JSON.stringify(classification, null, 2))
    } catch {
      // Non-fatal: caching failed
    }
  }

  return classification
}

export function isNonModelFailure(evalResultDir: string): boolean {
  if (!existsSync(join(evalResultDir, 'classification.json'))) {
    return false
  }

  try {
    const classification = JSON.parse(readFileSync(join(evalResultDir, 'classification.json'), 'utf-8'))
    if (classification.acknowledged) return false
    return classification.failureType != null && classification.failureType !== 'model'
  } catch {
    return false
  }
}
