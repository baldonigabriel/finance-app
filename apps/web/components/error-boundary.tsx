'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Algo deu errado. Tente recarregar a página.';
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen items-center justify-center bg-gray-950">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <p className="text-lg font-semibold text-red-400">Erro inesperado</p>
              <p className="mt-2 text-sm text-gray-400">{this.state.message}</p>
              <button
                className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 cursor-pointer"
                onClick={() => window.location.reload()}
              >
                Recarregar
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
