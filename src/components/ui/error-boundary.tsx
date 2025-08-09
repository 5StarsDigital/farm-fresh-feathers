import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: any;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("App crashed:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center shadow-lg">
            <h1 className="text-xl font-semibold mb-2">Đã xảy ra lỗi</h1>
            <p className="text-sm text-muted-foreground mb-4">Giao diện không thể hiển thị. Vui lòng thử tải lại trang.</p>
            <button onClick={this.handleRetry} className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition">
              Tải lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
