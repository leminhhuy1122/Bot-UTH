import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary bắt được lỗi render:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-100 p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800">
                {this.props.fallbackTitle || 'Đã xảy ra lỗi khi hiển thị giao diện'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống đã tự động ghi nhận sự cố này. Bạn có thể tải lại trang hoặc quay về trang chủ để tiếp tục.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-left">
                  <div className="text-[10px] font-mono text-rose-600 truncate">
                    {this.state.error.message}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-[#008272] hover:bg-[#007062] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tải lại trang</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

