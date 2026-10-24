import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('[Flowbean ErrorBoundary caught]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#2C2018] flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-md bg-[#FFFDF9] border border-[#DECFC0] rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-fadeIn">
            {/* Espresso Warmth Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#C26D52]/10 border border-[#C26D52]/30 flex items-center justify-center text-[#C26D52] shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold font-mono text-[#2C2018]">
                Noget gik galt under visningen
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6E65] leading-relaxed">
                Flowbean stødte på en uventet visningsfejl. Dine gemte opskrifter og bønner er intakte.
              </p>
            </div>

            {/* Error Message Box */}
            {this.state.error && (
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#DECFC0] text-left text-[11px] font-mono text-[#7A6E65] max-h-28 overflow-y-auto break-words">
                <span className="font-bold text-[#B85B48]">{this.state.error.name}: </span>
                {this.state.error.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl border border-[#DECFC0] bg-[#FAF7F2] hover:bg-[#DECFC0]/40 text-[#2C2018] text-xs font-bold font-mono transition active:scale-95 cursor-pointer"
              >
                Prøv igen
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-[#2C2018] hover:bg-[#3D2C22] text-[#FAF7F2] text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#C26D52]" />
                <span>Genindlæs Flowbean</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
