import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('UraqiVision base app', () => {
  it('renders the home page at the root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /base web del proyecto uraqivision/i })).toBeInTheDocument()
  })

  it('renders a station detail route', async () => {
    render(
      <MemoryRouter initialEntries={['/station/santa-cruz']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: /santa cruz/i })).toBeInTheDocument()
  })
})
