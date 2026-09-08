import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">Something went wrong</h2>
              <p className="text-sm text-slate-500 mt-2">
                An unexpected interface issue occurred. You can restore the app without losing your session.
              </p>
            </div>
            {this.state.error && (
              <div className="text-left bg-slate-100 p-3 rounded-xl text-xs text-slate-600 font-mono overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-agro-600 hover:bg-agro-700 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
