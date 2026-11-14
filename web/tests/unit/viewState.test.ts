import { describe, expect, it } from 'vitest'
import { buildViewStateFromResult, createLoadingState } from '../../src/data/viewState'

describe('view state machine', () => {
  it('creates a loading state in the selected language', () => {
    expect(createLoadingState('es').status).toBe('loading')
    expect(createLoadingState('en').message).toContain('Loading')
  })

  it('converts result errors into a controlled error state', () => {
    const state = buildViewStateFromResult(
      {
        status: 'error',
        message: 'Publication error',
        reason: 'The station could not be fetched.',
      },
      'en',
    )

    if (state.status !== 'error') {
      throw new Error('Expected error state')
    }

    expect(state.status).toBe('error')
    expect(state.reason).toBe('The station could not be fetched.')
  })
})
