import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-destructive/5 rounded-2xl border-2 border-destructive/20 mt-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-destructive">
                {this.props.fallbackTitle || "Ops! Algo deu errado nesta aba"}
              </h2>
              <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg border border-destructive/10 font-mono text-left overflow-auto max-h-32">
                {this.state.error?.message || "Erro desconhecido"}
              </p>
              <p className="text-xs text-muted-foreground">
                Este erro pode ser específico do seu navegador ou dispositivo Android.
              </p>
            </div>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
