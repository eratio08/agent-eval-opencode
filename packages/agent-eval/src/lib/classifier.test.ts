import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isNonModelFailure } from './classifier.js'

describe('isNonModelFailure', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'classifier-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true })
  })

  it('returns true for infra failure', () => {
    writeFileSync(
      join(tempDir, 'classification.json'),
      JSON.stringify({ failureType: 'infra', failureReason: 'Rate limited' }),
    )
    expect(isNonModelFailure(tempDir)).toBe(true)
  })

  it('returns true for timeout failure', () => {
    writeFileSync(
      join(tempDir, 'classification.json'),
      JSON.stringify({ failureType: 'timeout', failureReason: 'Timed out' }),
    )
    expect(isNonModelFailure(tempDir)).toBe(true)
  })

  it('returns false for model failure', () => {
    writeFileSync(
      join(tempDir, 'classification.json'),
      JSON.stringify({ failureType: 'model', failureReason: 'Wrong code' }),
    )
    expect(isNonModelFailure(tempDir)).toBe(false)
  })

  it('returns false for acknowledged infra failure', () => {
    writeFileSync(
      join(tempDir, 'classification.json'),
      JSON.stringify({ failureType: 'infra', failureReason: 'Rate limited', acknowledged: true }),
    )
    expect(isNonModelFailure(tempDir)).toBe(false)
  })

  it('returns false for acknowledged timeout failure', () => {
    writeFileSync(
      join(tempDir, 'classification.json'),
      JSON.stringify({ failureType: 'timeout', failureReason: 'Timed out', acknowledged: true }),
    )
    expect(isNonModelFailure(tempDir)).toBe(false)
  })

  it('returns false when no classification.json exists', () => {
    expect(isNonModelFailure(tempDir)).toBe(false)
  })
})
