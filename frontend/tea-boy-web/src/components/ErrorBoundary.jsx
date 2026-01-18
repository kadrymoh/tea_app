// Error Boundary to catch JavaScript errors
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border-2 border-red-500/50 p-8 max-w-2xl">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💥</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4 text-center">
              Something went wrong!
            </h1>
            <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
              <p className="text-red-400 font-mono text-sm">
                {this.state.error && this.state.error.toString()}
              </p>
            </div>
            <details className="mb-6">
              <summary className="text-slate-300 cursor-pointer hover:text-white mb-2">
                Show error details
              </summary>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <pre className="text-xs text-slate-400 overflow-auto max-h-64">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
            </details>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all"
              >
                Clear & Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
