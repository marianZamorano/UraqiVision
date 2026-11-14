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
    expect(screen.queryByRole('link', { name: /atribución de cesium/i })).not.toBeInTheDocument()
  })

  it('renders a station detail route', async () => {
    render(
      <MemoryRouter initialEntries={['/station/santa-cruz']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: /santa cruz/i })).toBeInTheDocument()
  })

  it('shows the Cesium attribution only inside the explorer route', async () => {
    render(
      <MemoryRouter initialEntries={['/explore']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: /atribución de cesium/i })).toBeInTheDocument()
  })
})
