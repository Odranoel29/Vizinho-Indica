import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="text-center bg-white border border-slate-100 rounded-3xl-cozy p-8 max-w-md shadow-xs flex flex-col items-center gap-3">
            <AlertCircle size={32} className="text-red-400" />
            <h2 className="font-extrabold text-slate-800 text-sm">Algo deu errado</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 text-white font-extrabold px-4 py-2 rounded-xl-cozy cozy-button-gradient hover:scale-102 active:scale-98 transition-all text-xs cursor-pointer"
            >
              <RefreshCw size={12} />
              Recarregar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
