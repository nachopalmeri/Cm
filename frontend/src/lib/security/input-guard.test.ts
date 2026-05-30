import { describe, it, expect } from 'vitest'
import { validateTopic } from './input-guard'

describe('validateTopic', () => {
  it('accepts valid topic', () => {
    const result = validateTopic('How to improve your writing')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects empty topic', () => {
    const result = validateTopic('')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Topic is required')
  })

  it('rejects topic with scripts', () => {
    const result = validateTopic('<script>alert(1)</script>')
    expect(result.valid).toBe(false)
  })

  it('sanitizes valid topic', () => {
    const result = validateTopic('  Hello World  ')
    expect(result.sanitized).toBe('Hello World')
  })
})