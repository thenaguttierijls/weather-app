import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold">Weather App</h1>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center p-6">
          <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-xl font-semibold">Weather app — under construction</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Real weather data coming soon.
            </p>
          </section>
        </main>
      </div>
      <Toaster />
    </ErrorBoundary>
  )
}

export default App
