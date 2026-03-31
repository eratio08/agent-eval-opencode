import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isClassifierEnabled, isNonModelFailure, parseClassifierDecision } from './classifier.js'

describe('classifier', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'classifier-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true })
    delete process.env.OPENCODE_CLASSIFIER_TEST_MODE
  })

  describe('isClassifierEnabled', () => {
    it('supports test mode override', () => {
      process.env.OPENCODE_CLASSIFIER_TEST_MODE = '1'
      expect(isClassifierEnabled()).toBe(true)
    })
  })

  describe('parseClassifierDecision', () => {
    it('parses valid classifier output', () => {
      expect(
        parseClassifierDecision(
          'some log\nCLASSIFICATION_JSON:{"failureType":"infra","failureReason":"Docker failed before the model ran."}',
        ),
      ).toEqual({
        failureType: 'infra',
        failureReason: 'Docker failed before the model ran.',
      })
    })

    it('returns null for invalid classifier output', () => {
      expect(parseClassifierDecision('CLASSIFICATION_JSON:not-json')).toBeNull()
      expect(parseClassifierDecision('plain text')).toBeNull()
    })
  })

  describe('isNonModelFailure', () => {
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

    it('returns false when no classification.json exists', () => {
      expect(isNonModelFailure(tempDir)).toBe(false)
    })
  })
})
