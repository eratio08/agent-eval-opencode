import { createServer } from 'node:net'
import type { EvalRunData, RubricConfig, RubricRunResult } from './types.js'

const MAX_FILE_CHARS = 20_000

function truncate(content: string): string {
  return content.length > MAX_FILE_CHARS ? `${content.slice(0, MAX_FILE_CHARS)}\n\n[truncated]` : content
}

function parseModelIdentifier(model: string): { providerID: string; modelID: string } | null {
  const slashIndex = model.indexOf('/')
  if (slashIndex === -1) return null
  return {
    providerID: model.slice(0, slashIndex),
    modelID: model.slice(slashIndex + 1),
  }
}

async function getAvailablePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Failed to allocate local port for OpenCode rubric server')))
        return
      }
      const { port } = address
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve(port)
      })
    })
  })
}

function buildRubricPrompt(params: {
  rubric: RubricConfig
  evalName: string
  experimentName: string
  runData: EvalRunData
}): string {
  const { rubric, evalName, experimentName, runData } = params
  const scriptOutputs = Object.entries(runData.outputContent?.scripts ?? {})
    .map(([name, content]) => `## Script Output: ${name}\n${truncate(content)}`)
    .join('\n\n')
  const generatedFiles = Object.keys(runData.generatedFiles ?? {}).sort()

  return [
    rubric.prompt,
    `Eval name: ${evalName}`,
    `Experiment name: ${experimentName}`,
    `## Deterministic Result\n${JSON.stringify(runData.result, null, 2)}`,
    runData.transcript ? `## Transcript\n${truncate(runData.transcript)}` : '',
    runData.outputContent?.eval ? `## outputs/eval.txt\n${truncate(runData.outputContent.eval)}` : '',
    scriptOutputs,
    generatedFiles.length > 0 ? `## Generated Files\n${generatedFiles.join('\n')}` : '',
    'Return only structured output matching the provided schema.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

export async function gradeRunWithRubric(params: {
  rubric: RubricConfig
  evalName: string
  experimentName: string
  runData: EvalRunData
  model: string
}): Promise<RubricRunResult> {
  const { rubric, evalName, experimentName, runData, model } = params

  try {
    const { createOpencodeClient } = await import('@opencode-ai/sdk/client')
    const { createOpencodeServer } = await import('@opencode-ai/sdk/server')
    const port = await getAvailablePort()
    const server = await createOpencodeServer({ port })
    const client = createOpencodeClient({ baseUrl: server.url })

    try {
      const session = await client.session.create({
        body: { title: `rubric-${experimentName}-${evalName}` },
      })
      if (!session.data) {
        return {
          status: 'failed',
          model: rubric.model ?? model,
          error: 'Failed to create OpenCode rubric grading session',
        }
      }

      const response = await client.session.prompt({
        path: { id: session.data.id },
        body: {
          ...(parseModelIdentifier(rubric.model ?? model)
            ? { model: parseModelIdentifier(rubric.model ?? model) }
            : {}),
          parts: [{ type: 'text', text: buildRubricPrompt({ rubric, evalName, experimentName, runData }) }],
          format: {
            type: 'json_schema',
            schema: rubric.schema,
            retryCount: rubric.retryCount,
          },
        } as {
          model?: { providerID: string; modelID: string }
          parts: Array<{ type: 'text'; text: string }>
          format: { type: 'json_schema'; schema: Record<string, unknown>; retryCount?: number }
        },
      } as {
        path: { id: string }
        body: {
          model?: { providerID: string; modelID: string }
          parts: Array<{ type: 'text'; text: string }>
          format: { type: 'json_schema'; schema: Record<string, unknown>; retryCount?: number }
        }
      })
      if (!response.data) {
        return {
          status: 'failed',
          model: rubric.model ?? model,
          error: 'OpenCode rubric grading returned no response data',
        }
      }

      const responseInfo = response.data.info as {
        structured?: Record<string, unknown>
        structured_output?: Record<string, unknown>
      }
      const output = responseInfo.structured ?? responseInfo.structured_output
      const overallPass = output?.[rubric.passField]
      if (typeof overallPass !== 'boolean') {
        return {
          status: 'failed',
          model: rubric.model ?? model,
          output,
          error: `Rubric output is missing boolean field ${rubric.passField}`,
        }
      }

      return {
        status: overallPass ? 'passed' : 'failed',
        model: rubric.model ?? model,
        output,
      }
    } finally {
      server.close()
    }
  } catch (error) {
    return {
      status: 'failed',
      model: rubric.model ?? model,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
