"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[20rem] flex-col items-center justify-center gap-4 rounded-2xl border border-coral/20 bg-surface p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-coral/70" />
          <div>
            <p className="font-display text-base font-bold text-ink">
              Something went wrong
            </p>
            <p className="mt-1 text-sm text-muted">
              {this.state.error.message || "An unexpected error occurred."}
            </p>
          </div>
          <button
            onClick={this.reset}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-elevated px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
