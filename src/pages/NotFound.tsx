import React from 'react'
import { Link } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center bg-white border border-slate-100 rounded-3xl-cozy p-8 max-w-md shadow-xs flex flex-col items-center gap-3">
        <AlertCircle size={40} className="text-slate-300" />
        <h1 className="font-extrabold text-slate-800 text-lg">Página não encontrada</h1>
        <p className="text-slate-400 text-xs leading-relaxed">
          A página que você procura não existe ou foi removida.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-white font-extrabold px-4 py-2 rounded-xl-cozy cozy-button-gradient hover:scale-102 active:scale-98 transition-all text-xs"
        >
          <Home size={12} />
          Voltar ao Início
        </Link>
      </div>
    </div>
  )
}
export default NotFound
