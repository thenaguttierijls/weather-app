import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('ErrorBoundary caught an error', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <h1 className="text-2xl font-semibold">Something went wrong.</h1>
          <p className="max-w-md text-muted-foreground">
            The app hit an unexpected error. Reloading usually fixes it.
          </p>
          <Button onClick={this.handleReload}>Reload</Button>
        </div>
      )
    }
    return this.props.children
  }
}
