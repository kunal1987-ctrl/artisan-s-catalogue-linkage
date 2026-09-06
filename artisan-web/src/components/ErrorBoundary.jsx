import React, { Component } from 'react';
import { clearCorruptedStorage, isStorageQuotaError } from '../utils/storageCleanup';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isCleaning: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });

    // If it's a storage quota exhaustion error, attempt automatic silent cleanup
    if (isStorageQuotaError(error)) {
      clearCorruptedStorage().catch((err) => {
        console.error('[ErrorBoundary] Silent storage cleanup failed:', err);
      });
    }
  }

  handleResetAndReload = async () => {
    this.setState({ isCleaning: true });
    try {
      await clearCorruptedStorage();
    } catch (e) {
      console.error('[ErrorBoundary] Storage cleanup error:', e);
    } finally {
      window.location.href = '/';
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isQuotaErr = isStorageQuotaError(this.state.error);

      return (
        <div className="min-h-screen bg-[#fdf9f3] text-[#180f0a] flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-[#e8e2d9] shadow-2xl flex flex-col items-center text-center">
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 rounded-full bg-[#ffdbce] text-[#9c441c] flex items-center justify-center mb-5 shadow-inner">
              <span className="material-symbols-outlined text-[34px]">
                {isQuotaErr ? 'disc_full' : 'warning'}
              </span>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-[#180f0a] mb-2 tracking-tight">
              {isQuotaErr ? 'Browser Storage Quota Exceeded' : 'Something Went Wrong'}
            </h1>

            {/* Explanatory Message */}
            <p className="text-[14px] text-[#80756f] leading-relaxed mb-6">
              {isQuotaErr
                ? 'Your browser ran out of IndexedDB/storage space (FILE_ERROR_NO_SPACE) or encountered cached file corruption. Clearing temporary app caches will restore normal operation.'
                : 'An unexpected application error occurred. You can safely clear temporary offline caches and reload to continue.'}
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={this.handleResetAndReload}
                disabled={this.state.isCleaning}
                className="w-full h-12 rounded-xl bg-[#9c441c] hover:bg-[#b04d20] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                type="button"
              >
                {this.state.isCleaning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Clearing Storage & Reloading...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">mop</span>
                    <span>Reset & Reload App</span>
                  </>
                )}
              </button>

              <button
                onClick={this.handleReload}
                className="w-full h-11 rounded-xl bg-[#f1ede7] hover:bg-[#ebe8e2] text-[#180f0a] font-semibold text-[13px] border border-[#e8e2d9] transition-colors cursor-pointer"
                type="button"
              >
                Refresh Page
              </button>
            </div>

            {/* Collapsible Error Details for Troubleshooting */}
            {this.state.error && (
              <details className="w-full mt-6 text-left border-t border-[#e8e2d9] pt-4">
                <summary className="text-[11px] font-bold text-[#80756f] uppercase tracking-wider cursor-pointer hover:text-[#180f0a] select-none">
                  Diagnostic Details
                </summary>
                <div className="mt-2 p-3 rounded-xl bg-[#180f0a] text-red-300 font-mono text-[11px] overflow-x-auto max-h-36">
                  <p className="font-bold text-white mb-1">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="text-white/60 whitespace-pre-wrap">
                      {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
