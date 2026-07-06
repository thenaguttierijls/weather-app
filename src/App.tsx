import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { CitiesList } from '@/components/cities/CitiesList'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { HeaderCitiesButton } from '@/components/HeaderCitiesButton'
import { HeaderSearchButton } from '@/components/HeaderSearchButton'
import { Hero } from '@/components/hero/Hero'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { SearchOverlay } from '@/components/search/SearchOverlay'
import { StaleBanner } from '@/components/StaleBanner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UnitToggle } from '@/components/UnitToggle'
import { ErrorState } from '@/components/states/ErrorState'
import { LoadingState } from '@/components/states/LoadingState'
import { FeelsLikeTile } from '@/components/tiles/FeelsLikeTile'
import { ForecastTile } from '@/components/tiles/ForecastTile'
import { HourlyTile } from '@/components/tiles/HourlyTile'
import { HumidityTile } from '@/components/tiles/HumidityTile'
import { PrecipTile } from '@/components/tiles/PrecipTile'
import { SunTile } from '@/components/tiles/SunTile'
import { TrendChartTile } from '@/components/tiles/TrendChartTile'
import { UvTile } from '@/components/tiles/UvTile'
import { WindTile } from '@/components/tiles/WindTile'
import { Toaster } from '@/components/ui/sonner'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useOnline } from '@/hooks/useOnline'
import { useTimezoneCity } from '@/hooks/useTimezoneCity'
import { useWeather, type WeatherCity } from '@/hooks/useWeather'
import { useCitiesStore } from '@/stores/useCitiesStore'
import { useSelectedCityStore } from '@/stores/useSelectedCityStore'
import { useViewStore } from '@/stores/useViewStore'

function App() {
  const timezoneCity = useTimezoneCity()
  const geo = useGeolocation()
  const selectedCity = useSelectedCityStore((s) => s.city)
  const cities = useCitiesStore((s) => s.cities)
  const addCity = useCitiesStore((s) => s.add)
  const view = useViewStore((s) => s.view)
  const [searchOpen, setSearchOpen] = useState(false)
  const deniedToastedRef = useRef(false)
  const online = useOnline()
  const wasOnlineRef = useRef(online)

  const geoPinCandidate = geo.status === 'ready' && geo.city ? geo.city : null

  useEffect(() => {
    if (!geoPinCandidate) return
    if (!geoPinCandidate.name || !geoPinCandidate.country) return
    const alreadyPinned = cities.some((c) => c.isPinned)
    if (alreadyPinned) return
    addCity(
      {
        name: geoPinCandidate.name,
        country: geoPinCandidate.country,
        lat: geoPinCandidate.lat,
        lng: geoPinCandidate.lng,
        timezone: geoPinCandidate.timezone,
      },
      { pinned: true }
    )
  }, [geoPinCandidate, cities, addCity])

  const cityFromStore = cities[0]
    ? {
        lat: cities[0].lat,
        lng: cities[0].lng,
        timezone: cities[0].timezone,
        name: cities[0].name,
        country: cities[0].country,
      }
    : null

  const city: WeatherCity = selectedCity ?? cityFromStore ?? geoPinCandidate ?? timezoneCity

  useEffect(() => {
    if (!selectedCity && geo.status === 'ready' && geo.city && !geo.toasted) {
      const suffix = geo.city.country ? `, ${geo.city.country}` : ''
      toast.info(`Detected ${geo.city.name}${suffix}.`)
      geo.markToasted()
    }
  }, [selectedCity, geo])

  useEffect(() => {
    if (
      !selectedCity &&
      cities.length === 0 &&
      (geo.status === 'denied' || geo.status === 'unavailable') &&
      !deniedToastedRef.current
    ) {
      deniedToastedRef.current = true
      toast.info(`Using ${timezoneCity.name} — you can change it via search.`)
    }
  }, [selectedCity, cities.length, geo.status, timezoneCity.name])

  const { data, loading, error, refetch, isStale, staleSince } = useWeather(city)

  useEffect(() => {
    const wasOnline = wasOnlineRef.current
    wasOnlineRef.current = online
    if (wasOnline === online) return
    if (online) {
      toast.info("You're back online.")
      refetch()
    } else {
      toast.info("You're offline. Showing what we have.")
    }
  }, [online, refetch])

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="flex items-center justify-between border-b border-border px-4 py-4 md:px-8">
          <h1 className="text-lg font-semibold">Weather App</h1>
          <div className="flex items-center gap-1">
            {!online && <OfflineIndicator />}
            <HeaderCitiesButton />
            <HeaderSearchButton onClick={() => setSearchOpen(true)} />
            <UnitToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8">
          {view === 'cities' ? (
            <CitiesList />
          ) : (
            <>
              {isStale && staleSince && <StaleBanner staleSince={staleSince} />}
              {loading && !data && <LoadingState variant="full-page" message="Loading weather…" />}
              {!loading && error && (
                <ErrorState
                  title="Couldn't load weather"
                  message={error}
                  onRetry={refetch}
                  variant="full-page"
                />
              )}
              {data && (
                <>
                  <Hero forecast={data} />
                  <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <HourlyTile forecast={data} className="col-span-2 md:col-span-4" />
                    <ForecastTile forecast={data} className="col-span-2" />
                    <FeelsLikeTile forecast={data} />
                    <HumidityTile forecast={data} />
                    <UvTile forecast={data} />
                    <PrecipTile forecast={data} />
                    <TrendChartTile forecast={data} className="col-span-2" />
                    <WindTile forecast={data} />
                    <SunTile forecast={data} />
                  </div>
                </>
              )}
            </>
          )}
        </main>
        <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
      <Toaster />
    </ErrorBoundary>
  )
}

export default App
