import { describe, expect, it, vi } from 'vitest'
import { buildAbortSignal, isAbortError } from '../src/http-util.js'

describe('buildAbortSignal', () => {
  it('returns a fresh signal that is not aborted by default', () => {
    const signal = buildAbortSignal(undefined, 1000)
    expect(signal.aborted).toBe(false)
  })

  it('aborts immediately when the caller signal is already aborted', () => {
    const external = AbortSignal.abort()
    const signal = buildAbortSignal(external, 1000)
    expect(signal.aborted).toBe(true)
  })

  it('aborts when the external signal fires', async () => {
    const controller = new AbortController()
    const signal = buildAbortSignal(controller.signal, 10_000)
    expect(signal.aborted).toBe(false)
    controller.abort()
    expect(signal.aborted).toBe(true)
  })
})

describe('isAbortError', () => {
  it('recognises AbortError and ABORT_ERR', () => {
    expect(isAbortError(Object.assign(new Error('x'), { name: 'AbortError' }))).toBe(true)
    expect(isAbortError(Object.assign(new Error('x'), { code: 'ABORT_ERR' }))).toBe(true)
  })

  it('rejects ordinary errors and non-errors', () => {
    expect(isAbortError(new Error('boom'))).toBe(false)
    expect(isAbortError('not an error')).toBe(false)
  })
})
