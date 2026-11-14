import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary ha catturato un errore:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-white">
          <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-white">
                Si è verificato un errore
              </h2>
              <p className="text-xs text-[#86868B] dark:text-gray-400">
                {this.state.error?.message || "Un componente non è stato caricato correttamente."}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#007AFF] hover:bg-blue-600 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ricarica FLOW</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetStorage}
                className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-[#86868B] dark:text-gray-300 font-semibold text-xs transition cursor-pointer"
              >
                Ripristina Dati Locali
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

