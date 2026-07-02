import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Hero } from '@/components/hero/Hero'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UnitToggle } from '@/components/UnitToggle'
import { ErrorState } from '@/components/states/ErrorState'
import { LoadingState } from '@/components/states/LoadingState'
import { Toaster } from '@/components/ui/sonner'
import { useTimezoneCity } from '@/hooks/useTimezoneCity'
import { useWeather } from '@/hooks/useWeather'

function App() {
  const city = useTimezoneCity()
  const { data, loading, error, refetch } = useWeather(city)

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold">Weather App</h1>
          <div className="flex items-center gap-1">
            <UnitToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 flex-col p-6">
          {loading && !data && <LoadingState variant="full-page" message="Loading weather…" />}
          {!loading && error && (
            <ErrorState
              title="Couldn't load weather"
              message={error}
              onRetry={refetch}
              variant="full-page"
            />
          )}
          {data && <Hero forecast={data} />}
        </main>
      </div>
      <Toaster />
    </ErrorBoundary>
  )
}

export default App
