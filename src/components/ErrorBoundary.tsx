// components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="p-6 border border-red-800 bg-zinc-900 rounded-lg max-w-md w-full shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-red-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Something went wrong
                </h2>
                <p className="text-red-400 mb-4">
                  {this.state.error?.message || "An unknown error occurred"}
                </p>
                <button
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                  onClick={() =>
                    this.setState({ hasError: false, error: null })
                  }
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try again</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
