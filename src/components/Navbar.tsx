import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, LayoutDashboard, Home as HomeIcon, Sparkles } from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8.5 h-8.5 rounded-xl-cozy cozy-button-gradient flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="font-extrabold text-base text-slate-800 tracking-tight block">
              Vizinho<span className="text-emerald-600">Indica</span>
            </span>
            <span className="text-[9px] text-slate-400 block -mt-1 font-semibold tracking-wider uppercase">Marketplace do Condomínio</span>
          </div>
        </Link>

        {/* Links & Auth Status */}
        <div className="flex items-center gap-3">
          <Link 
            to="/" 
            className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl-cozy hover:bg-slate-50"
          >
            <HomeIcon size={14} />
            <span className="hidden sm:inline">Início</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Perfil & Dashboard Link */}
              <Link 
                to="/dashboard" 
                className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl-cozy hover:bg-slate-50"
              >
                <LayoutDashboard size={14} />
                <span className="hidden sm:inline">Painel</span>
              </Link>

              <hr className="h-5 w-px bg-slate-100" />

              {/* Menu do Usuário */}
              <div className="flex items-center gap-2 pl-1">
                <img
                  src={profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'}
                  alt={profile?.nome_completo || 'Avatar'}
                  className="w-7.5 h-7.5 rounded-full object-cover border-2 border-emerald-50"
                />
                <div className="hidden md:block text-left">
                  <span className="text-[11px] font-bold text-slate-700 block leading-none max-w-[110px] truncate">
                    {profile?.nome_completo}
                  </span>
                  <span className="text-[8px] text-slate-400 block font-semibold uppercase mt-0.5">Morador</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sair"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/auth"
              className="text-xs font-extrabold text-white px-4 py-2.5 rounded-xl-cozy shadow-xs shadow-emerald-500/10 hover:shadow-md transition-all duration-300 cozy-button-gradient hover:scale-102 active:scale-98"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
export default Navbar;
