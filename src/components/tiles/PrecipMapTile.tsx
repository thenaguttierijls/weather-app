import { Map as MapIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'

import type { NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'
import { logger } from '@/lib/logger'
import { useThemeStore } from '@/stores/useThemeStore'

interface PrecipMapTileProps {
  forecast: NormalizedForecast
  className?: string
}

interface RainViewerFrame {
  path: string
  time: number
}

interface RainViewerManifest {
  radar?: {
    past?: RainViewerFrame[]
  }
}

const MANIFEST_URL = 'https://api.rainviewer.com/public/weather-maps.json'
const BASE_LIGHT = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
const BASE_DARK = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
const BASE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
const RADAR_ATTRIBUTION =
  'Radar &copy; <a href="https://www.rainviewer.com/">RainViewer</a>'

function CenterOnCity({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [map, center[0], center[1]]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export function PrecipMapTile({ forecast, className }: PrecipMapTileProps) {
  const theme = useThemeStore((s) => s.theme)
  const { location } = forecast
  const [radarPath, setRadarPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(MANIFEST_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`RainViewer ${r.status}`)
        return r.json() as Promise<RainViewerManifest>
      })
      .then((data) => {
        if (cancelled) return
        const past = data?.radar?.past ?? []
        const latest = past[past.length - 1]
        if (latest?.path) {
          setRadarPath(latest.path)
        } else {
          setError('Radar unavailable.')
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        logger.warn('RainViewer manifest fetch failed', { error: String(err) })
        setError('Radar unavailable.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const baseUrl = theme === 'dark' ? BASE_DARK : BASE_LIGHT
  const radarUrl = radarPath
    ? `https://tilecache.rainviewer.com${radarPath}/512/{z}/{x}/{y}/2/1_1.png`
    : null
  const center: [number, number] = [location.lat, location.lng]

  return (
    <Tile title="Precipitation map" icon={MapIcon} ariaLabel="Precipitation map" className={className}>
      <div className="overflow-hidden rounded-xl">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: 420, width: '100%' }}
          attributionControl={true}
        >
          <TileLayer url={baseUrl} attribution={BASE_ATTRIBUTION} detectRetina={true} />
          {radarUrl && <TileLayer url={radarUrl} opacity={0.7} attribution={RADAR_ATTRIBUTION} />}
          <CenterOnCity center={center} />
        </MapContainer>
      </div>
      {error && (
        <p className="mt-2 text-xs text-muted-foreground">{error}</p>
      )}
    </Tile>
  )
}
