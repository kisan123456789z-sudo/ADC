import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside Anujay Dental Clinic app:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    try {
      window.location.reload();
    } catch {
      // fallback
    }
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    try {
      window.location.href = './';
    } catch {
      // fallback
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
              Anujay Dental Clinic
            </h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              We encountered a temporary display issue loading the portal. Click below to reload or return to the clinic homepage.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Portal</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl border border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Home className="w-4 h-4 text-slate-600" />
                <span>Clinic Home</span>
              </button>
            </div>

            {this.state.error && (
              <details className="text-left text-xs text-slate-500 bg-slate-100 rounded-lg p-3 overflow-hidden">
                <summary className="cursor-pointer font-medium text-slate-700 hover:underline">
                  Technical diagnostic info
                </summary>
                <p className="mt-2 font-mono break-all text-[11px] text-red-600">
                  {this.state.error.toString()}
                </p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
