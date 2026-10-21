import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error('LIMS Uncaught Error Caught by Boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-6 bg-white border border-rose-200 rounded-xl shadow-lg space-y-4 font-sans">
          <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-3">
            <AlertOctagon className="w-7 h-7 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {this.props.fallbackTitle || 'A rendering error occurred in this view.'}
              </h2>
              <p className="text-xs text-slate-500">
                The application encountered an unexpected issue while loading data.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-mono text-rose-900 overflow-x-auto">
              {this.state.error.toString()}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0176d3] hover:bg-[#0060b2] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry / Return</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-all cursor-pointer"
            >
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
