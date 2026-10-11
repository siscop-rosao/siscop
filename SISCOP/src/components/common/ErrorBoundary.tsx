import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error('[SISCOP ErrorBoundary] Erro capturado com segurança:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 bg-white rounded-2xl border border-amber-300 shadow-lg text-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-700 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{this.props.fallbackTitle || 'Aviso de Recuperação do Sistema'}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ocorreu uma inconsistência temporária na renderização deste módulo, mas a plataforma SISCOP permaneceu ativa e segura.
          </p>
          <div className="pt-2">
            <button
              onClick={this.handleReset}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restabelecer Visualização</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
