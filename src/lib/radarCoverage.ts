interface Box {
  latMin: number
  latMax: number
  lngMin: number
  lngMax: number
}

// RainViewer coverage — regions where their radar network has data.
// Outside these boxes RainViewer returns a "ZOOM LEVEL NOT SUPPORTED" placeholder tile.
const COVERAGE: Box[] = [
  { latMin: 24, latMax: 49, lngMin: -125, lngMax: -66 }, // US mainland
  { latMin: 55, latMax: 72, lngMin: -170, lngMax: -130 }, // Alaska
  { latMin: 18, latMax: 23, lngMin: -161, lngMax: -154 }, // Hawaii
  { latMin: 35, latMax: 71, lngMin: -11, lngMax: 40 }, // Europe
  { latMin: -45, latMax: -10, lngMin: 110, lngMax: 155 }, // Australia
  { latMin: 30, latMax: 46, lngMin: 129, lngMax: 146 }, // Japan
  { latMin: 33, latMax: 39, lngMin: 124, lngMax: 132 }, // South Korea
]

export function hasRadarCoverage(lat: number, lng: number): boolean {
  return COVERAGE.some(
    (b) => lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax
  )
}
