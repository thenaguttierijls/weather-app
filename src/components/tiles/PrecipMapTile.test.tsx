import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import type { NormalizedForecast } from '@/api/types'
import { useThemeStore } from '@/stores/useThemeStore'
import { PrecipMapTile } from './PrecipMapTile'

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, center }: { children: React.ReactNode; center: [number, number] }) => (
    <div data-testid="map-container" data-center={JSON.stringify(center)}>
      {children}
    </div>
  ),
  TileLayer: ({ url, attribution }: { url: string; attribution?: string }) => (
    <div data-testid="tile-layer" data-url={url} data-attribution={attribution ?? ''} />
  ),
  useMap: () => ({ setView: vi.fn() }),
}))

function makeForecast(overrides: Partial<NormalizedForecast> = {}): NormalizedForecast {
  return {
    location: { name: 'Chicago', country: 'US', timezone: 'UTC', lat: 41.88, lng: -87.63 },
    current: {
      tempC: 20, apparentC: 20, humidity: 50, windKph: 5, windDir: 0,
      weatherCode: 0, isDay: true, precip: 0, uv: 3,
    },
    hourly: [],
    daily: [],
    ...overrides,
  }
}

const OK_MANIFEST = {
  radar: {
    past: [
      { path: '/v2/radar/1700000000', time: 1700000000 },
      { path: '/v2/radar/1700000600', time: 1700000600 },
    ],
  },
}

describe('PrecipMapTile', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(OK_MANIFEST),
    } as Response)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the tile chrome', () => {
    render(<PrecipMapTile forecast={makeForecast()} />)
    expect(screen.getByRole('region', { name: /precipitation map/i })).toBeInTheDocument()
  })

  it('centers the map on the selected city', () => {
    render(<PrecipMapTile forecast={makeForecast()} />)
    const map = screen.getByTestId('map-container')
    expect(map.getAttribute('data-center')).toBe(JSON.stringify([41.88, -87.63]))
  })

  it('uses the Carto Positron base tiles when theme is light', () => {
    useThemeStore.setState({ theme: 'light' })
    render(<PrecipMapTile forecast={makeForecast()} />)
    const layers = screen.getAllByTestId('tile-layer')
    expect(layers[0]?.getAttribute('data-url')).toMatch(/light_all/)
  })

  it('uses the Carto Dark Matter base tiles when theme is dark', () => {
    useThemeStore.setState({ theme: 'dark' })
    render(<PrecipMapTile forecast={makeForecast()} />)
    const layers = screen.getAllByTestId('tile-layer')
    expect(layers[0]?.getAttribute('data-url')).toMatch(/dark_all/)
  })

  it('fetches the RainViewer manifest and renders a radar tile layer with the latest frame', async () => {
    render(<PrecipMapTile forecast={makeForecast()} />)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.rainviewer.com')
    )
    await waitFor(() => {
      const layers = screen.getAllByTestId('tile-layer')
      const radarLayer = layers.find((l) => l.getAttribute('data-url')?.includes('tilecache.rainviewer.com'))
      expect(radarLayer).toBeDefined()
      expect(radarLayer?.getAttribute('data-url')).toContain('/v2/radar/1700000600')
    })
  })

  it('shows an unavailable message when the radar fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network fail'))
    render(<PrecipMapTile forecast={makeForecast()} />)
    await waitFor(() => {
      expect(screen.getByText(/radar unavailable/i)).toBeInTheDocument()
    })
  })
})
