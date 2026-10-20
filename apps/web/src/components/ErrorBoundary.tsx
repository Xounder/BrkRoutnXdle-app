import React from "react";
import { ErrorFallback } from "./ErrorFallback";
import { ThemeProvider } from "../theme/ThemeProvider";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // The boundary sits outside ThemeProvider in main.tsx, so its fallback
      // needs its own provider to render Mantine controls (including the UI Button).
      return (
        <ThemeProvider>
          <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />
        </ThemeProvider>
      );
    }
    return this.props.children;
  }
}
