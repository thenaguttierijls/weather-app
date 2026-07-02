import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Hero } from '@/components/hero/Hero'
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
import { useTimezoneCity } from '@/hooks/useTimezoneCity'
import { useWeather } from '@/hooks/useWeather'

function App() {
  const city = useTimezoneCity()
  const { data, loading, error, refetch } = useWeather(city)

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="flex items-center justify-between border-b border-border px-4 py-4 md:px-8">
          <h1 className="text-lg font-semibold">Weather App</h1>
          <div className="flex items-center gap-1">
            <UnitToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8">
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
        </main>
      </div>
      <Toaster />
    </ErrorBoundary>
  )
}

export default App
