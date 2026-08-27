import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public props!: Props;
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleCopyDebug = async () => {
    const debugText = `
=== COSMIC OBSERVER ERROR DEBUG REPORT ===
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error Message: ${this.state.error?.message || 'Unknown Error'}
Error Stack:
${this.state.error?.stack || 'No Stack Available'}

Component Stack:
${this.state.errorInfo?.componentStack || 'No Component Stack Available'}
=========================================
    `.trim();

    try {
      await navigator.clipboard.writeText(debugText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    } catch (err) {
      console.error('Failed to copy debug info:', err);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 md:p-6 select-text">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-full blur-sm opacity-60"></div>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Core Crash</h1>
                <p className="text-slate-400 text-sm max-w-md">
                  The client runtime encountered an unhandled exception. This could be due to unexpected telemetry structure from API servers.
                </p>
              </div>
            </div>

            {/* Collapsible/Details Debug Box */}
            <div className="space-y-3 bg-slate-950/60 border border-slate-800 rounded-xl p-4 md:p-5 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/85 pb-2 text-slate-400 font-semibold">
                <span>EXCEPTION_DETAILS</span>
                <button
                  onClick={this.handleCopyDebug}
                  className="inline-flex items-center gap-1 hover:text-white bg-slate-900 px-2 py-1 rounded border border-slate-800 hover:border-slate-700 transition"
                >
                  {this.state.copied ? (
                    <>
                      <Check size={12} className="text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy Trace
                    </>
                  )}
                </button>
              </div>
              
              <div className="space-y-2 text-slate-300 max-h-48 overflow-y-auto pr-2 custom-scrollbar break-all">
                <p className="text-red-400 font-bold break-words">
                  Error: {this.state.error?.message || 'Unknown Exception'}
                </p>
                {this.state.error?.stack && (
                  <pre className="text-[10px] leading-relaxed text-slate-500 whitespace-pre-wrap font-mono mt-1 select-text">
                    {this.state.error.stack}
                  </pre>
                )}
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] leading-relaxed text-slate-500 whitespace-pre-wrap font-mono mt-2 pt-2 border-t border-slate-900 select-text">
                    Component Stack:
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md"
              >
                <RefreshCw size={15} />
                Refresh Application
              </button>
              <button 
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold px-6 py-2.5 rounded-xl transition text-sm"
              >
                Ignore & Clear Error
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
