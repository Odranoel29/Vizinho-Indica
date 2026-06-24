import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ServiceCard } from '../components/ServiceCard'
import { ArrowLeft, AlertCircle, ShieldCheck, Star, Calendar } from 'lucide-react'

const fallbackAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'

const PerfilPublico: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchProfile = async () => {
      try {
        setLoading(true)

        const { data: userData } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (userData) setProfile(userData)

        const { data: servicesData } = await supabase
          .from('v_servicos_destaque')
          .select('*')
          .eq('autor_id', id)

        if (servicesData) setServices(servicesData)
      } catch (err) {
        console.error('Erro ao buscar perfil:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-6 w-32 bg-slate-100 rounded-md" />
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-40 bg-slate-100 rounded-md" />
              <div className="h-3 w-24 bg-slate-100 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl-cozy border border-slate-100 p-5 flex flex-col gap-4">
                <div className="aspect-video w-full bg-slate-100 rounded-xl-cozy" />
                <div className="h-3 bg-slate-100 rounded-md w-3/4" />
                <div className="h-2.5 bg-slate-100 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-3">
        <AlertCircle size={32} className="text-slate-400" />
        <h3 className="font-bold text-slate-800 text-sm">Perfil não encontrado</h3>
        <p className="text-slate-400 text-xs">Este vizinho não está mais disponível ou o link é inválido.</p>
        <Link to="/" className="text-emerald-600 font-bold text-xs mt-2 hover:underline">Voltar para o Início</Link>
      </div>
    )
  }

  const totalAvaliacoes = services.reduce((acc, s) => acc + (s.total_avaliacoes || 0), 0)
  const mediaGeral = services.length > 0
    ? services.reduce((acc, s) => acc + (s.media_notas || 0), 0) / services.length
    : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">

      <Link to="/" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors w-fit">
        <ArrowLeft size={12} />
        Voltar para a vitrine
      </Link>

      {/* Card do Prestador */}
      <div className="bg-white rounded-3xl-cozy border border-slate-100 p-6 shadow-md flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
        <div className="relative shrink-0">
          <img
            src={profile.avatar_url || fallbackAvatar}
            alt={profile.nome_completo}
            className="w-20 h-20 rounded-full object-cover border-3 border-emerald-50 shadow-xs"
          />
          {profile.prestador_aprovado && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-1.5 border border-white shadow-xs">
              <ShieldCheck size={14} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <h1 className="font-extrabold text-slate-800 text-lg">{profile.nome_completo}</h1>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400">
            {profile.prestador_aprovado && (
              <div className="flex items-center gap-1 font-bold text-emerald-600">
                <ShieldCheck size={12} />
                Prestador Verificado
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star size={12} className="text-amber-400" />
              <span className="font-semibold text-slate-600">{mediaGeral.toFixed(1)}</span>
              <span>({totalAvaliacoes} {totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>Vizinho desde {new Date(profile.created_at || Date.now()).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}</span>
            </div>
          </div>

          {profile.bio && (
            <p className="text-slate-500 text-sm leading-relaxed italic bg-slate-50/30 p-4 rounded-xl-cozy border border-slate-100/50 mt-2">
              "{profile.bio}"
            </p>
          )}
        </div>
      </div>

      {/* Serviços do Prestador */}
      <div>
        <h2 className="font-extrabold text-slate-800 text-base mb-4">Serviços Anunciados</h2>
        {services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <ServiceCard
                key={s.servico_id}
                id={s.servico_id}
                titulo={s.titulo}
                descricao={s.descricao}
                preco_estimado={s.preco_estimado}
                foto_url={s.foto_url}
                categoria_nome={s.categoria_nome}
                subcategoria_nome={s.subcategoria_nome}
                autor_nome={s.autor_nome}
                autor_avatar={s.autor_avatar}
                media_notas={s.media_notas}
                total_avaliacoes={s.total_avaliacoes}
                autor_id={s.autor_id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-14 flex flex-col items-center gap-2 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl-cozy">
            <AlertCircle size={20} className="text-slate-300" />
            <p className="text-slate-400 text-xs">Este vizinho ainda não publicou nenhum serviço ativo.</p>
          </div>
        )}
      </div>

    </div>
  )
}

export default PerfilPublico
