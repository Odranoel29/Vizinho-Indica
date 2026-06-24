import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ServiceCard } from '../components/ServiceCard'
import { Search, Plus, Sparkles, AlertCircle, LogIn, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const categoryIcons: Record<string, string> = {
  Reformas: '\u{1F3D7}\u{FE0F}',
  Aulas: '\u{1F4DA}',
  Culinária: '\u{1F372}',
  Saúde: '\u{2764}\u{FE0F}',
  'Serviços Domésticos': '\u{1F3E0}',
  Automóveis: '\u{1F697}',
  Tecnologia: '\u{1F4BB}',
  'Eventos e Festas': '\u{1F389}',
  Limpeza: '\u{1F9F9}',
  Manutenção: '\u{1F527}',
}

export const Home: React.FC = () => {
  const { user } = useAuth()
  const [services, setServices] = useState<any[]>([])
  const [filteredServices, setFilteredServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<string | null>(null)
  const [subcategorias, setSubcategorias] = useState<any[]>([])
  const fastCategories = ['Reformas', 'Aulas', 'Culinária', 'Saúde', 'Serviços Domésticos', 'Automóveis', 'Tecnologia', 'Eventos e Festas']

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const [servicosRes, subRes] = await Promise.all([
          supabase.from('v_servicos_destaque').select('*'),
          supabase.from('subcategorias').select('*, categorias!inner(categorias)').order('nome')
        ])

        if (servicosRes.error) throw servicosRes.error

        if (servicosRes.data) {
          setServices(servicosRes.data)
          setFilteredServices(servicosRes.data)
        }
        if (subRes.data) setSubcategorias(subRes.data)
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  useEffect(() => {
    let result = services

    if (search.trim() !== '') {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.titulo?.toLowerCase().includes(q) ||
          s.descricao?.toLowerCase().includes(q) ||
          s.subcategoria_nome?.toLowerCase().includes(q)
      )
    }

    if (selectedCategory) {
      result = result.filter(
        (s) => s.categoria_nome?.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    if (selectedSubcategoria) {
      result = result.filter(
        (s) => s.subcategoria_nome?.toLowerCase() === selectedSubcategoria.toLowerCase()
      )
    }

    setFilteredServices(result)
  }, [search, selectedCategory, selectedSubcategoria, services])

  return (
    <div className="flex-1 pb-16">

      {/* Hero Section */}
      <header className="relative py-20 md:py-28 px-6 overflow-hidden text-center flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3)_0%,transparent_60%)]"></div>
        <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(#fff_0.5px,transparent_0.5px)] [background-size:20px_20px]"></div>

        <div className="max-w-3xl mx-auto flex flex-col gap-5 relative z-10">

          <div className="inline-flex items-center gap-1.5 self-center bg-white/20 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-[14px] font-extrabold uppercase tracking-wider text-white border border-white/20 shadow-sm">
            <Sparkles size={10} />
            <span>Serviços no seu Condomínio</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm">
            Encontre quem você pode confiar pertinho
          </h1>

          <p className="text-emerald-50 text-xs md:text-sm max-w-lg mx-auto leading-relaxed opacity-90">
            Contrate e recomende serviços de vizinhos. Segurança, praticidade e proximidade para as atividades do dia a dia.
          </p>

          {/* Barra de Busca */}
          <div className="w-full max-w-lg mx-auto relative mt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="O que você está procurando hoje? (Ex: pintor, aula, bolo...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-5 py-4 rounded-3xl-cozy border-0 bg-white/95 text-slate-700 placeholder-slate-400 shadow-lg focus:outline-hidden focus:ring-2 focus:ring-white/50 text-xs md:text-sm transition-all duration-300 backdrop-blur-sm"
            />
          </div>

          {/* Categorias */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
            <button
              onClick={() => { setSelectedCategory(null); setSelectedSubcategoria(null) }}
              className={`px-3.5 py-1.5 rounded-full text-[14px] font-bold transition-all duration-300 cursor-pointer ${
                selectedCategory === null
                  ? 'bg-white text-emerald-700 shadow-md'
                  : 'bg-white/20 text-white/90 border border-white/30 hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              Todos
            </button>
            {fastCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSelectedSubcategoria(null) }}
                className={`px-3.5 py-1.5 rounded-full text-[14px] font-bold transition-all duration-300 cursor-pointer ${
                  selectedCategory?.toLowerCase() === cat.toLowerCase()
                    ? 'bg-white text-emerald-700 shadow-md'
                    : 'bg-white/20 text-white/90 border border-white/30 hover:bg-white/30 backdrop-blur-sm'
                }`}
              >
                {categoryIcons[cat] && <span className="mr-1">{categoryIcons[cat]}</span>}
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Onda decorativa no final */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </header>

      {/* Banner Login CTA (se não estiver logado) */}
      {!user && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <Link
            to="/auth"
            className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-amber-100/80 border border-amber-200/50 rounded-2xl-cozy px-5 py-3.5 group hover:shadow-sm transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-200/60 flex items-center justify-center flex-shrink-0">
                <LogIn size={14} className="text-amber-700" />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-bold text-amber-700 uppercase tracking-wider">Faça Login</p>
                <p className="text-xs text-amber-600/80">Entre para anunciar, favoritar e contratar serviços</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-amber-500 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* Grid de Serviços */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-left">
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800">
              {selectedCategory || 'Serviços em Destaque'}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {selectedCategory
                ? `Profissionais de ${selectedCategory.toLowerCase()} recomendados pelos vizinhos`
                : 'Profissionais recomendados pelos seus vizinhos'}
            </p>
          </div>

          {(selectedCategory || search) && (
            <div className="text-xs text-slate-400 font-medium">
              Encontrados: <span className="font-bold text-slate-700">{filteredServices.length}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl-cozy border border-slate-100 p-5 flex flex-col gap-4 animate-pulse">
                <div className="aspect-video w-full bg-slate-100 rounded-xl-cozy"></div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100"></div>
                  <div className="h-2.5 bg-slate-100 rounded-md w-20"></div>
                </div>
                <div className="h-3 bg-slate-100 rounded-md w-3/4"></div>
                <div className="h-2.5 bg-slate-100 rounded-md w-1/2"></div>
                <div className="h-6 bg-slate-100 rounded-md mt-2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Subcategorias / Nichos */}
            {selectedCategory && (() => {
              const subs = subcategorias.filter(s =>
                s.categorias?.categorias?.toLowerCase() === selectedCategory?.toLowerCase()
              )
              if (subs.length === 0) return null
              return (
                <div className="-mt-2 mb-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">Nichos:</span>
                    {subs.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSubcategoria(selectedSubcategoria === s.nome ? null : s.nome)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all duration-300 cursor-pointer ${
                          selectedSubcategoria === s.nome
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {s.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}

            {filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((s, i) => (
                  <div
                    key={s.servico_id}
                    className="animate-fade-in"
                    style={{
                      animation: `fadeInUp 0.4s ease-out ${i * 0.06}s both`,
                    }}
                  >
                    <ServiceCard
                      id={s.servico_id}
                      titulo={s.titulo}
                      descricao={s.descricao}
                      preco_estimado={s.preco_estimado}
                      foto_url={s.foto_url}
                      categoria_nome={s.categoria_nome}
                      subcategoria_nome={s.subcategoria_nome}
                      autor_nome={s.autor_nome}
                      autor_avatar={s.autor_avatar}
                      autor_id={s.autor_id}
                      media_notas={s.media_notas}
                      total_avaliacoes={s.total_avaliacoes}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <AlertCircle size={24} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Nenhum serviço encontrado</h3>
                <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                  Tente redefinir a palavra-chave de busca ou escolha outra categoria para listar os prestadores da vizinhança.
                </p>
                <button
                  onClick={() => { setSearch(''); setSelectedCategory(null); setSelectedSubcategoria(null) }}
                  className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-[14px] font-bold text-slate-600 transition-colors cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-40">
        <Link
          to={user ? '/dashboard?action=anunciar' : '/auth'}
          className="flex items-center gap-1.5 bg-emerald-600 text-white font-extrabold px-5 py-3.5 rounded-full shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all duration-300 cozy-button-gradient cursor-pointer"
        >
          <Plus size={16} />
          <span className="text-xs">Anunciar</span>
        </Link>
      </div>

      {/* Keyframes injection */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  )
}
export default Home;
