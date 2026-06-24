import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ServicoDetalhe from './pages/ServicoDetalhe'
import Dashboard from './pages/Dashboard'
import Auth from './pages/Auth'
import NotFound from './pages/NotFound'
import PerfilPublico from './pages/PerfilPublico'

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-bg-main">
          {/* Menu de Navegação Global */}
          <Navbar />
          
          {/* Conteúdo Principal do Roteador */}
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/servico/:id" element={<ServicoDetalhe />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/perfil/:id" element={<PerfilPublico />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>

          {/* Rodapé Fixo Estilizado */}
          <footer className="border-t border-slate-100 py-6 text-center text-[10px] text-slate-400 bg-white">
            <p>© {new Date().getFullYear()} Vizinho Indica. Todos os direitos reservados.</p>
            <p className="mt-1">Conectando moradores e fomentando serviços de confiança na sua comunidade.</p>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
