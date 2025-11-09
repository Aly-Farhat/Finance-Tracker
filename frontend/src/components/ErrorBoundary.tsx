import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="text-destructive" size={48} />
              </div>
              
              <h1 className="text-3xl font-bold">Something Went Wrong</h1>
              
              <p className="text-muted-foreground text-lg">
                We're sorry, but something unexpected happened. The error has been logged.
              </p>

              {this.state.error && (
                <details className="w-full text-left bg-secondary/50 rounded-lg p-4 cursor-pointer">
                  <summary className="font-semibold mb-2">Error Details</summary>
                  <pre className="text-xs overflow-auto max-h-48 text-muted-foreground">
                    {this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={this.handleReset}
                  className="gap-2"
                >
                  <RefreshCcw size={16} />
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

