import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SISCOP ErrorBoundary] Erro capturado com segurança:', error, errorInfo);
  }

  public handleReset = () => {
    try {
      this.props.onReset?.();
    } catch (err) {
      console.warn('[SISCOP ErrorBoundary] Erro ao executar onReset:', err);
    }
    this.setState({ hasError: false, error: null, showDetails: false });
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
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restabelecer Visualização</span>
            </button>
            {this.state.error && (
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-semibold underline cursor-pointer"
              >
                {this.state.showDetails ? 'Ocultar detalhes' : 'Ver detalhes técnicos'}
              </button>
            )}
          </div>
          {this.state.showDetails && this.state.error && (
            <div className="mt-3 p-3 bg-slate-900 text-amber-300 rounded-lg text-[11px] font-mono break-all max-h-36 overflow-y-auto">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
