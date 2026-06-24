import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Plus, Edit2, Trash2, Heart, BarChart3, List, ExternalLink, RefreshCw, X, AlertCircle, Archive, Shield, ImageUp, Loader, Store, UserCheck, Clock, Flag, Users, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'anuncios'

  const [myServices, setMyServices] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategoriasDisponiveis, setSubcategoriasDisponiveis] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [adminServices, setAdminServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<any | null>(null)
  
  const [formTitulo, setFormTitulo] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formPrecoEstimado, setFormPrecoEstimado] = useState('')
  const [formPrecoDetalhe, setFormPrecoDetalhe] = useState('')
  const [formFotoUrl, setFormFotoUrl] = useState('')
  const [formWhatsapp, setFormWhatsapp] = useState('')
  const [formCategoria, setFormCategoria] = useState('')
  const [formSubcategoria, setFormSubcategoria] = useState('')
  const [formFotoFile, setFormFotoFile] = useState<File | null>(null)
  const [formFotoPreview, setFormFotoPreview] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formSubmitLoading, setFormSubmitLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [prestadoresPendentes, setPrestadoresPendentes] = useState<any[]>([])
  const [denuncias, setDenuncias] = useState<any[]>([])
  const [totalMoradores, setTotalMoradores] = useState(0)
  const [prestadoresList, setPrestadoresList] = useState<any[]>([])
  const [denunciaFilter, setDenunciaFilter] = useState<string>('todas')
  const [denunciaModalOpen, setDenunciaModalOpen] = useState(false)
  const [denunciaFinalizandoId, setDenunciaFinalizandoId] = useState<number | null>(null)
  const [denunciaResultado, setDenunciaResultado] = useState<'positivo' | 'alerta'>('positivo')
  const [denunciaObservacao, setDenunciaObservacao] = useState('')
  const [denunciaActionLoading, setDenunciaActionLoading] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [formValidationError, setFormValidationError] = useState('')

  const fallbackServiceImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80'

  const fallbackCategories = [
    { id: 1, categorias: 'Aulas' },
    { id: 2, categorias: 'Culinária' },
    { id: 3, categorias: 'Limpeza' },
    { id: 4, categorias: 'Manutenção' },
    { id: 5, categorias: 'Saúde' },
    { id: 6, categorias: 'Reformas' },
    { id: 7, categorias: 'Serviços Domésticos' },
    { id: 8, categorias: 'Automóveis' },
    { id: 9, categorias: 'Tecnologia' },
    { id: 10, categorias: 'Eventos e Festas' }
  ]

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'anunciar') {
      openCreateModal()
      setSearchParams({ tab: 'anuncios' })
    }
  }, [searchParams])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth')
    }
  }, [user, authLoading, navigate])

  const fetchData = async () => {
    if (!profile) return
    setLoading(true)
    try {
      // 1. Busca os meus anúncios
      const { data: myData } = await supabase
        .from('servicos')
        .select('*, categorias(categorias)')
        .eq('criado_por', profile.id)
      
      if (myData) setMyServices(myData)

      // 2. Busca favoritos
      const { data: favsData } = await supabase
        .from('favoritos')
        .select('*, servicos(*, categorias(categorias))')
        .eq('usuario_id', profile?.id)

      if (favsData) {
        const mappedFavs = favsData.map(f => {
          if (!f.servicos) return null
          return {
            id: f.servicos.id,
            titulo: f.servicos.titulo,
            preco_estimado: f.servicos.preco_estimado,
            foto_url: f.servicos.foto_url,
            categoria_nome: f.servicos.categorias?.categorias
          }
        }).filter(Boolean)
        setFavorites(mappedFavs)
      } else {
        const localFavs = JSON.parse(localStorage.getItem('favoritos') || '[]')
        if (localFavs.length > 0) {
          const { data: localFavsData } = await supabase
            .from('v_servicos_destaque')
            .select('*')
            .in('servico_id', localFavs)
          if (localFavsData) {
            setFavorites(localFavsData.map(s => ({
              id: s.servico_id,
              titulo: s.titulo,
              preco_estimado: s.preco_estimado,
              foto_url: s.foto_url,
              categoria_nome: s.categoria_nome
            })))
          }
        }
      }

      // 3. Busca categorias
      const { data: catData, error: catError } = await supabase
        .from('categorias')
        .select('*')

      if (catError) {
        console.error('Erro ao buscar categorias:', catError)
      }

      if (catData && catData.length > 0) {
        setCategories(catData)
      } else {
        console.warn('Categorias do banco vazias, usando fallback')
        setCategories(fallbackCategories)
      }

      // 4. Busca leads de contatos
      const { data: leadsData } = await supabase
        .from('contatos')
        .select('*, servicos(titulo)')
        .eq('prestador_id', profile.id)

      if (leadsData) {
        setLeads(leadsData)
      } else {
        const localClicks = JSON.parse(localStorage.getItem('whatsapp_clicks') || '{}')
        const simulatedLeads = []
        for (const [sId, count] of Object.entries(localClicks)) {
          const matchServ = myData?.find(s => s.id === Number(sId))
          if (matchServ) {
            simulatedLeads.push({
              servico_id: Number(sId),
              servico_titulo: matchServ.titulo,
              clicks: count
            })
          }
        }
        setLeads(simulatedLeads)
      }

      // 5. Se for admin, busca dados administrativos
      if (profile.is_admin) {
        const { data: adminData } = await supabase
          .from('servicos')
          .select('*, categorias(categorias), usuarios:criado_por(nome_completo, email)')
          .order('created_at', { ascending: false })

        if (adminData) setAdminServices(adminData)

        const { data: pendentes } = await supabase
          .from('usuarios')
          .select('*')
          .eq('tipo', 'prestador')
          .eq('prestador_aprovado', false)

        if (pendentes) setPrestadoresPendentes(pendentes)

        const { data: denunciasData } = await supabase
          .from('denuncias')
          .select('*, servicos(titulo)')
          .order('created_at', { ascending: false })

        if (denunciasData) setDenuncias(denunciasData)

        // Métricas
        const { count: moradoresCount } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true })
          .or('tipo.eq.morador,tipo.is.null')

        if (moradoresCount !== null) setTotalMoradores(moradoresCount)

        const { data: prestadores } = await supabase
          .from('usuarios')
          .select('*')
          .eq('tipo', 'prestador')
          .eq('prestador_aprovado', true)
          .order('nome_completo')

        if (prestadores) setPrestadoresList(prestadores)
      }

    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile, currentTab])

  const carregarSubcategorias = async (categoriaNome: string) => {
    try {
      // Busca o id da categoria pelo state (categories) e depois os nichos no banco
      const cat = categories.find(c => c.categorias === categoriaNome)
      if (!cat) { setSubcategoriasDisponiveis([]); return }

      const { data, error } = await supabase
        .from('subcategorias')
        .select('*')
        .eq('categoria_id', cat.id)
        .order('nome')
      if (error) { console.error('Erro subcategorias:', error); return }
      if (data) setSubcategoriasDisponiveis(data)
    } catch (err) {
      console.error('Erro ao carregar subcategorias:', err)
    }
  }

  // Revogar Object URL anterior pra evitar vazamento de memória
  const revokePreview = () => {
    if (formFotoPreview && formFotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(formFotoPreview)
    }
  }

  const openCreateModal = () => {
    revokePreview()
    setEditingService(null)
    setFormTitulo('')
    setFormDescricao('')
    setFormPrecoEstimado('')
    setFormPrecoDetalhe('')
    setFormFotoUrl('')
    setFormFotoFile(null)
    setFormFotoPreview('')
    setFormWhatsapp(profile?.whatsapp || '')
    const catNome = categories[0]?.categorias || ''
    setFormCategoria(catNome)
    setFormSubcategoria('')
    setFormError('')
    setModalOpen(true)
    if (catNome) carregarSubcategorias(catNome)
  }

  const openEditModal = (service: any) => {
    setEditingService(service)
    setFormTitulo(service.titulo || '')
    setFormDescricao(service.descricao || '')
    setFormPrecoEstimado(service.preco_estimado?.toString() || '')
    setFormPrecoDetalhe(service.preco_detalhe || '')
    setFormFotoUrl(service.foto_url || '')
    setFormFotoFile(null)
    setFormFotoPreview('')
    setFormWhatsapp(service.whatsapp || '')
    const cat = categories.find(c => c.id === service.categoria)
    const catNome = cat?.categorias || categories[0]?.categorias || ''
    setFormCategoria(catNome)
    setFormSubcategoria('')
    setFormError('')
    setModalOpen(true)
    if (catNome) carregarSubcategorias(catNome)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitLoading(true)
    setFormError('')
    setFormValidationError('')

    // Validação campos obrigatórios
    const required = [
      { field: formTitulo, name: 'Título do Serviço' },
      { field: formDescricao, name: 'Descrição' },
      { field: formPrecoEstimado, name: 'Preço Inicial' },
      { field: formWhatsapp, name: 'WhatsApp' },
      { field: formFotoFile || formFotoUrl, name: 'Foto do Serviço' },
    ]

    const missing = required.filter(r => !r.field || (typeof r.field === 'string' && r.field.trim() === ''))
    if (missing.length > 0) {
      setFormSubmitLoading(false)
      setFormValidationError(`Preencha todos os campos com * para salvar o anúncio.`)
      return
    }

    if (!profile) return

    // Busca o ID real da categoria pelo nome
    const { data: catReal } = await supabase
      .from('categorias')
      .select('id')
      .eq('categorias', formCategoria)
      .maybeSingle()

    if (!catReal) {
      setFormSubmitLoading(false)
      setFormError('Categoria não encontrada no banco de dados.')
      return
    }

    const servicePayload = {
      titulo: formTitulo,
      descricao: formDescricao,
      preco_estimado: parseFloat(formPrecoEstimado) || 0,
      preco_detalhe: formPrecoDetalhe || null,
      foto_url: formFotoUrl || null,
      whatsapp: formWhatsapp,
      categoria: catReal.id,
      subcategoria_id: formSubcategoria ? parseInt(formSubcategoria) : null,
      criado_por: profile.id
    }

    try {
      let fotoUrlFinal = formFotoUrl || null

      // Upload da imagem se houver arquivo selecionado
      if (formFotoFile) {
        setUploadingImage(true)
        const fileExt = formFotoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const filePath = `${profile.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('servicos')
          .upload(filePath, formFotoFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('servicos')
          .getPublicUrl(filePath)

        fotoUrlFinal = publicUrlData?.publicUrl || null
        setUploadingImage(false)
      }

      const payload = {
        ...servicePayload,
        foto_url: fotoUrlFinal
      }

      if (editingService) {
        const { error } = await supabase
          .from('servicos')
          .update(payload)
          .eq('id', editingService.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('servicos')
          .insert(payload)

        if (error) throw error
      }

      setModalOpen(false)
      setFormFotoFile(null)
      setFormFotoPreview('')
      fetchData()
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar anúncio.')
    } finally {
      setFormSubmitLoading(false)
      setUploadingImage(false)
    }
  }

  const handleDeleteService = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este anúncio?')) return

    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Erro ao excluir anúncio:', err)
    }
  }

  const handleArchiveService = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'arquivado' ? 'ativo' : 'arquivado'
    const action = newStatus === 'arquivado' ? 'arquivar' : 'reativar'

    if (!window.confirm(`Tem certeza que deseja ${action} este anúncio?`)) return

    try {
      const { error } = await supabase
        .from('servicos')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Erro ao arquivar/reativar anúncio:', err)
    }
  }

  const diasRestantes = React.useMemo(() => {
    if (!profile?.prestador_expiracao) return null
    const diff = new Date(profile.prestador_expiracao).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }, [profile?.prestador_expiracao])

  const isExpirado = diasRestantes !== null && diasRestantes <= 0

  const handleRenovar = async () => {
    if (!profile) return
    setUpgradeLoading(true)
    const novaExpiracao = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

    try {
      await supabase
        .from('usuarios')
        .update({ prestador_expiracao: novaExpiracao, prestador_aprovado: true })
        .eq('id', profile.id)

      await supabase
        .from('servicos')
        .update({ status: 'ativo' })
        .eq('criado_por', profile.id)
        .eq('status', 'suspenso')

      await refreshProfile()
      fetchData()
    } catch (err) {
      console.error('Erro ao renovar:', err)
    } finally {
      setUpgradeLoading(false)
    }
  }

  // Suspende automaticamente se expirou
  React.useEffect(() => {
    if (isExpirado && profile?.tipo === 'prestador' && profile?.prestador_aprovado) {
      supabase
        .from('usuarios')
        .update({ prestador_aprovado: false })
        .eq('id', profile.id)
        .then(() => refreshProfile())

      supabase
        .from('servicos')
        .update({ status: 'suspenso' })
        .eq('criado_por', profile.id)
        .eq('status', 'ativo')
    }
  }, [isExpirado])

  const handleSolicitarUpgrade = async () => {
    if (!profile) return
    setUpgradeLoading(true)

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ tipo: 'prestador', prestador_aprovado: false })
        .eq('id', profile.id)

      if (error) throw error
      await refreshProfile()
    } catch (err: any) {
      console.error('Erro ao solicitar upgrade:', err)
    } finally {
      setUpgradeLoading(false)
    }
  }

  const handleAprovarPrestador = async (userId: number) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          prestador_aprovado: true,
          prestador_desde: new Date().toISOString(),
          prestador_expiracao: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Erro ao aprovar prestador:', err)
    }
  }

  const handleFinalizarDenuncia = async () => {
    if (!denunciaFinalizandoId) return
    setDenunciaActionLoading(true)
    try {
      await supabase
        .from('denuncias')
        .update({ status: 'finalizada', resultado: denunciaResultado, observacao: denunciaObservacao || null })
        .eq('id', denunciaFinalizandoId)

      if (denunciaResultado === 'alerta') {
        const { data: denuncia } = await supabase
          .from('denuncias')
          .select('*, servicos(criado_por)')
          .eq('id', denunciaFinalizandoId)
          .single()

        if (denuncia?.servicos?.criado_por) {
          const prestadorId = denuncia.servicos.criado_por
          const { data: prestador } = await supabase
            .from('usuarios')
            .select('alertas')
            .eq('id', prestadorId)
            .single()

          const novosAlertas = (prestador?.alertas || 0) + 1
          await supabase.from('usuarios').update({ alertas: novosAlertas }).eq('id', prestadorId)

          if (novosAlertas >= 3) {
            await supabase.from('usuarios').update({ prestador_aprovado: false, tipo: 'morador' }).eq('id', prestadorId)
            await supabase.from('servicos').update({ status: 'arquivado' }).eq('criado_por', prestadorId)
          }
        }
      }

      setDenunciaModalOpen(false)
      setDenunciaFinalizandoId(null)
      setDenunciaResultado('positivo')
      setDenunciaObservacao('')
      fetchData()
    } catch (err) {
      console.error('Erro ao finalizar denúncia:', err)
    } finally {
      setDenunciaActionLoading(false)
    }
  }

  const handleMudarStatusDenuncia = async (id: number, status: string) => {
    try {
      await supabase.from('denuncias').update({ status }).eq('id', id)
      fetchData()
    } catch (err) {
      console.error('Erro ao atualizar denúncia:', err)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 animate-pulse flex flex-col gap-6">
        <div className="h-6 bg-slate-100 rounded-md w-36"></div>
        <div className="h-10 bg-slate-100 rounded-md w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-100 rounded-xl"></div>
          <div className="h-32 bg-slate-100 rounded-xl"></div>
          <div className="h-32 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6 text-left relative min-h-[80vh]">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">
            Painel do Morador
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Gerencie seus anúncios, favoritos e acompanhe suas indicações
          </p>
        </div>
        
        {currentTab === 'anuncios' && profile?.tipo === 'prestador' && profile?.prestador_aprovado && (
          <button
            onClick={openCreateModal}
            className="text-white font-extrabold px-4.5 py-2.5 rounded-xl-cozy shadow-xs shadow-emerald-500/10 hover:shadow-md transition-all duration-300 cozy-button-gradient hover:scale-102 active:scale-98 flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <Plus size={14} />
            Novo Anúncio
          </button>
        )}
      </div>

      {/* Banner de assinatura para prestadores */}
      {profile?.tipo === 'prestador' && profile?.prestador_aprovado && diasRestantes !== null && (
        <div className={`rounded-2xl-cozy p-4 flex items-center gap-3 ${
          diasRestantes <= 10
            ? 'bg-red-50 border border-red-200'
            : diasRestantes <= 30
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-emerald-50 border border-emerald-200'
        }`}>
          <Store size={18} className={
            diasRestantes <= 10 ? 'text-red-600' : diasRestantes <= 30 ? 'text-amber-600' : 'text-emerald-600'
          } />
          <div className="flex-1">
            <p className={`font-bold text-xs ${
              diasRestantes <= 10 ? 'text-red-800' : diasRestantes <= 30 ? 'text-amber-800' : 'text-emerald-800'
            }`}>
              Plano Prestador • {diasRestantes}d restantes
            </p>
            <p className={`text-[10px] mt-0.5 ${
              diasRestantes <= 10 ? 'text-red-600' : diasRestantes <= 30 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {diasRestantes <= 10
                ? 'Sua assinatura está prestes a expirar. Renove para não suspender seus anúncios.'
                : `Taxa de manutenção vigente por mais ${diasRestantes} dias.`}
            </p>
          </div>
          <button
            onClick={handleRenovar}
            disabled={upgradeLoading}
            className={`font-extrabold px-4 py-2 rounded-xl-cozy transition-all duration-300 text-xs whitespace-nowrap cursor-pointer disabled:opacity-50 ${
              diasRestantes <= 10
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {upgradeLoading ? 'Processando...' : `Renovar R$ 100 (${diasRestantes > 60 ? '+' : ''}60d)`}
          </button>
        </div>
      )}

      {/* Prestador expirado */}
      {profile?.tipo === 'prestador' && isExpirado && (
        <div className="bg-red-50 border border-red-200 rounded-2xl-cozy p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-red-800 text-xs">Assinatura Expirada</p>
            <p className="text-red-600 text-[10px] mt-0.5">Seus anúncios foram suspensos. Renove para reativá-los.</p>
          </div>
          <button
            onClick={handleRenovar}
            disabled={upgradeLoading}
            className="bg-red-600 text-white font-extrabold px-4 py-2 rounded-xl-cozy hover:bg-red-700 transition-all text-xs whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {upgradeLoading ? 'Processando...' : 'Renovar R$ 100'}
          </button>
        </div>
      )}

      {/* Menu Superior / Abas */}
      <div className="flex border-b border-slate-100 gap-1.5 overflow-x-auto pb-px">
        <button
          onClick={() => setSearchParams({ tab: 'anuncios' })}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs transition-all duration-300 whitespace-nowrap cursor-pointer ${
            currentTab === 'anuncios'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
          }`}
        >
          <List size={14} />
          Meus Anúncios ({myServices.length})
        </button>
        
        <button
          onClick={() => setSearchParams({ tab: 'favoritos' })}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs transition-all duration-300 whitespace-nowrap cursor-pointer ${
            currentTab === 'favoritos'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
          }`}
        >
          <Heart size={14} />
          Meus Favoritos ({favorites.length})
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'contatos' })}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs transition-all duration-300 whitespace-nowrap cursor-pointer ${
            currentTab === 'contatos'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
          }`}
        >
          <BarChart3 size={14} />
          Métricas de Contatos
        </button>

        {profile?.is_admin && (
          <button
            onClick={() => setSearchParams({ tab: 'admin' })}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs transition-all duration-300 whitespace-nowrap cursor-pointer ${
              currentTab === 'admin'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
            }`}
          >
            <Shield size={14} />
            Admin ({adminServices.length})
          </button>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 mt-2">
        {currentTab === 'anuncios' && (
          profile?.tipo === 'morador' || !profile?.tipo ? (
            <div className="text-center py-14 bg-white border border-slate-100 rounded-3xl-cozy flex flex-col items-center gap-3 shadow-xs max-w-md mx-auto">
              <Store size={32} className="text-slate-300" />
              <h3 className="font-bold text-slate-800 text-sm">Torne-se um Prestador</h3>
              <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                Ofereça seus serviços no condomínio! Após solicitar, um administrador irá liberar seu acesso.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl-cozy p-4 text-left w-full flex flex-col gap-1.5">
                <p className="font-bold text-amber-800 text-xs">Taxa de Manutenção</p>
                <p className="text-amber-700 text-[10px] leading-relaxed">
                  <strong>R$ 100,00</strong> a cada 2 meses para manter o site online. 
                  Você pode renovar antecipadamente para não suspender seus anúncios.
                </p>
              </div>
              <button
                onClick={handleSolicitarUpgrade}
                disabled={upgradeLoading}
                className="text-white font-extrabold px-5 py-2.5 rounded-xl-cozy shadow-xs shadow-emerald-500/10 hover:shadow-md transition-all duration-300 cozy-button-gradient hover:scale-102 active:scale-98 flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50"
              >
                {upgradeLoading ? <Loader size={12} className="animate-spin" /> : <Store size={14} />}
                {upgradeLoading ? 'Solicitando...' : 'Quero ser Prestador'}
              </button>
            </div>
          ) : profile?.tipo === 'prestador' && !profile?.prestador_aprovado ? (
            <div className="text-center py-14 bg-white border border-amber-200 rounded-3xl-cozy flex flex-col items-center gap-3 shadow-xs max-w-md mx-auto">
              <Clock size={32} className="text-amber-500" />
              <h3 className="font-bold text-amber-800 text-sm">Aguardando liberação</h3>
              <p className="text-amber-600 text-xs max-w-xs leading-relaxed">
                Sua solicitação para ser prestador foi enviada. 
                Um administrador irá analisar e liberar seu acesso em breve.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl-cozy p-4 text-left w-full flex flex-col gap-1.5">
                <p className="font-bold text-amber-800 text-xs">Taxa de Manutenção</p>
                <p className="text-amber-700 text-[10px] leading-relaxed">
                  Após aprovado, você terá <strong>60 dias</strong> de acesso. 
                  <strong> R$ 100,00</strong> a cada 2 meses para manter o site online.
                </p>
              </div>
            </div>
          ) : myServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="bg-white rounded-2xl-cozy border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    <div className="relative aspect-video w-full bg-slate-50 border-b border-slate-100">
                      <img
                        src={service.foto_url || fallbackServiceImage}
                        alt={service.titulo}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                        {service.categorias?.categorias || 'Serviço'}
                      </div>
                      {service.status && service.status !== 'ativo' && (
                        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          service.status === 'arquivado'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {service.status}
                        </div>
                      )}
                    </div>

                  <div className="p-4.5 flex flex-col gap-3 flex-1">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{service.titulo}</h3>
                    
                    <div className="text-emerald-600 font-extrabold text-sm">
                      R$ {service.preco_estimado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 gap-2">
                      <Link
                        to={`/servico/${service.id}`}
                        className="text-slate-500 hover:text-emerald-600 font-bold text-xs flex items-center gap-1"
                        title="Ver no site"
                      >
                        <ExternalLink size={12} />
                        Visualizar
                      </Link>

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => openEditModal(service)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 bg-white border border-slate-100 rounded-3xl-cozy flex flex-col items-center gap-2 shadow-xs">
              <List className="text-slate-300" size={24} />
              <h3 className="font-bold text-slate-800 text-sm">Nenhum serviço cadastrado</h3>
              <p className="text-slate-400 text-xs">Comece a oferecer seus serviços no condomínio!</p>
              <button
                onClick={openCreateModal}
                className="text-white font-extrabold px-4 py-2 rounded-xl-cozy shadow-xs shadow-emerald-500/10 hover:shadow-md transition-all duration-300 cozy-button-gradient hover:scale-102 active:scale-98 flex items-center gap-1 cursor-pointer text-xs mt-2"
              >
                <Plus size={12} />
                Cadastrar Meu Primeiro Serviço
              </button>
            </div>
          )
        )}

        {currentTab === 'favoritos' && (
          favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((fav) => (
                <Link
                  key={fav.id}
                  to={`/servico/${fav.id}`}
                  className="bg-white rounded-2xl-cozy border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  <div className="relative aspect-video w-full bg-slate-50 border-b border-slate-100">
                    <img
                      src={fav.foto_url || fallbackServiceImage}
                      alt={fav.titulo}
                      className="w-full h-full object-cover"
                    />
                    {fav.categoria_nome && (
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                        {fav.categoria_nome}
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col gap-1.5">
                    <h3 className="font-bold text-slate-800 text-xs truncate group-hover:text-emerald-600 transition-colors">
                      {fav.titulo}
                    </h3>
                    <div className="text-emerald-600 font-extrabold text-xs">
                      R$ {fav.preco_estimado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 bg-white border border-slate-100 rounded-3xl-cozy flex flex-col items-center gap-2 shadow-xs">
              <Heart className="text-slate-300 fill-slate-50" size={24} />
              <h3 className="font-bold text-slate-800 text-sm">Nenhum favorito salvo</h3>
              <p className="text-slate-400 text-xs">Salve os serviços recomendados clicando no coração!</p>
            </div>
          )
        )}

        {currentTab === 'contatos' && (
          <div className="flex flex-col gap-6">

            {profile?.is_admin && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl-cozy border border-slate-100 p-5 shadow-xs flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Users size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">Usuários Cadastrados</span>
                      <span className="text-lg font-black text-slate-800 mt-1 block">{totalMoradores}</span>
                      <span className="text-[9px] text-slate-400 font-semibold">moradores</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl-cozy border border-slate-100 p-5 shadow-xs flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Store size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">Prestadores Cadastrados</span>
                      <span className="text-lg font-black text-slate-800 mt-1 block">{prestadoresList.length}</span>
                      <span className="text-[9px] text-slate-400 font-semibold">prestadores</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl-cozy border border-slate-100 p-5 shadow-xs flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <BarChart3 size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">Total de Chamados</span>
                      <span className="text-lg font-black text-slate-800 mt-1 block">
                        {leads.reduce((acc, curr) => acc + (curr.clicks || 1), 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lista de Prestadores com Farol + Pagamento */}
                <div className="bg-white rounded-3xl-cozy border border-slate-100 overflow-hidden shadow-xs">
                  <div className="p-5 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-800 text-sm">Status dos Prestadores</h3>
                    <p className="text-slate-400 text-[10px] mt-0.5">Farol de assinatura e situação de pagamento</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="px-6 py-4">Prestador</th>
                          <th className="px-6 py-4 text-center">Assinatura</th>
                          <th className="px-6 py-4 text-center">Pagamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {prestadoresList.map((p) => {
                          const diff = p.prestador_expiracao
                            ? Math.ceil((new Date(p.prestador_expiracao).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                            : 0
                          const farolCor = diff <= 0 ? 'bg-red-500' : diff <= 15 ? 'bg-amber-500' : 'bg-emerald-500'
                          const farolLabel = diff <= 0 ? 'Expirado' : diff <= 15 ? `${diff} dias` : `${diff} dias`

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{p.nome_completo}</td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className={`inline-block w-2 h-2 rounded-full ${farolCor}`} />
                                  <span className={`text-[10px] font-bold ${diff <= 0 ? 'text-red-600' : diff <= 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {farolLabel}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.pagamento_status === 'pago'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-red-50 text-red-700'
                                }`}>
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${p.pagamento_status === 'pago' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                  {p.pagamento_status === 'pago' ? 'Pago' : 'Em Aberto'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {prestadoresList.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-slate-400">Nenhum prestador aprovado.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {!profile?.is_admin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl-cozy border border-slate-100 p-5 shadow-xs flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">Total de Chamados</span>
                    <span className="text-lg font-black text-slate-800 mt-1 block">
                      {leads.reduce((acc, curr) => acc + (curr.clicks || 1), 0)}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl-cozy border border-slate-100 p-5 shadow-xs flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <RefreshCw size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">Acompanhamento Admin</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5 block w-fit">
                      Status do Lead Ativo
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tabela de contatos */}
            <div className="bg-white rounded-3xl-cozy border border-slate-100 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-800 text-sm">Métricas de Chamados no WhatsApp</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Número de vizinhos interessados que entraram em contato com você</p>
              </div>

              {leads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-4">Serviço</th>
                        <th className="px-6 py-4 text-center">Contatos (WhatsApp)</th>
                        <th className="px-6 py-4">Última Indicação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.map((lead, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-700">
                            {lead.servicos?.titulo || lead.servico_titulo || 'Serviço da Vitrine'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                              {lead.clicks || 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Simulado localmente'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-2">
                  <AlertCircle size={20} className="text-slate-300" />
                  <p className="text-slate-400 text-xs">Nenhum chamado de contato recebido até o momento.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'admin' && profile?.is_admin && (
          <div className="flex flex-col gap-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl-cozy p-4 flex items-center gap-3">
              <Shield size={18} className="text-amber-600 shrink-0" />
              <div>
                <p className="font-bold text-amber-800 text-xs">Painel de Administração</p>
                <p className="text-amber-600 text-[10px]">Você pode arquivar, reativar ou excluir qualquer anúncio.</p>
              </div>
            </div>

            {/* Prestadores Pendentes */}
            {prestadoresPendentes.length > 0 && (
              <div className="bg-white rounded-3xl-cozy border border-slate-100 overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Prestadores Pendentes</h3>
                    <p className="text-slate-400 text-[10px] mt-0.5">{prestadoresPendentes.length} aguardando aprovação</p>
                  </div>
                  <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{prestadoresPendentes.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-4">Nome</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prestadoresPendentes.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-700">{p.nome_completo}</td>
                          <td className="px-6 py-4 text-slate-500">{p.email}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleAprovarPrestador(p.id)}
                              className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-xl-cozy transition-colors cursor-pointer text-[10px]"
                            >
                              <UserCheck size={12} />
                              Aprovar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Denúncias */}
            <div className="bg-white rounded-3xl-cozy border border-slate-100 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Flag size={14} className="text-red-500" />
                    Denúncias
                  </h3>
                  <p className="text-slate-400 text-[10px] mt-0.5">{denuncias.length} {denuncias.length === 1 ? 'denúncia' : 'denúncias'}</p>
                </div>
              </div>

              {/* Filtros */}
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-1">
                {['todas', 'pendente', 'aguardando', 'finalizada'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setDenunciaFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      denunciaFilter === f
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {f === 'todas' ? 'Todas' : f === 'pendente' ? 'Feitas' : f === 'aguardando' ? 'Aguardando' : 'Finalizadas'}
                  </button>
                ))}
              </div>

              {denuncias.filter(d => denunciaFilter === 'todas' || d.status === denunciaFilter).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-4">Serviço</th>
                        <th className="px-6 py-4">Motivo</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {denuncias.filter(d => denunciaFilter === 'todas' || d.status === denunciaFilter).map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-700">{d.servicos?.titulo || 'Serviço removido'}</td>
                          <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{d.motivo}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              d.status === 'pendente' ? 'bg-red-50 text-red-700' :
                              d.status === 'aguardando' ? 'bg-amber-50 text-amber-700' :
                              d.status === 'finalizada' ? 'bg-slate-50 text-slate-500' : ''
                            }`}>
                              {d.status === 'finalizada' && d.resultado === 'positivo' && <ThumbsUp size={10} />}
                              {d.status === 'finalizada' && d.resultado === 'alerta' && <ThumbsDown size={10} />}
                              {d.status === 'pendente' ? 'Feita' : d.status === 'aguardando' ? 'Aguardando' : d.status === 'finalizada' ? `Finalizada (${d.resultado === 'positivo' ? 'Positiva' : 'Alerta'})` : d.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                            {new Date(d.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {d.status !== 'finalizada' && (
                              <div className="flex items-center justify-center gap-1">
                                {d.status === 'pendente' && (
                                  <button
                                    onClick={() => handleMudarStatusDenuncia(d.id, 'aguardando')}
                                    className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-[9px] transition-colors cursor-pointer"
                                  >
                                    Aguardar
                                  </button>
                                )}
                                {d.status === 'aguardando' && (
                                  <button
                                    onClick={() => handleMudarStatusDenuncia(d.id, 'pendente')}
                                    className="px-2 py-1 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 font-bold text-[9px] transition-colors cursor-pointer"
                                  >
                                    Reabrir
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setDenunciaFinalizandoId(d.id)
                                    setDenunciaResultado('positivo')
                                    setDenunciaObservacao('')
                                    setDenunciaModalOpen(true)
                                  }}
                                  className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[9px] transition-colors cursor-pointer"
                                >
                                  <CheckCircle size={12} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-2">
                  <Flag size={20} className="text-slate-300" />
                  <p className="text-slate-400 text-xs">Nenhuma denúncia neste filtro.</p>
                </div>
              )}
            </div>

            {adminServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl-cozy border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    <div className="relative aspect-video w-full bg-slate-50 border-b border-slate-100">
                      <img
                        src={service.foto_url || fallbackServiceImage}
                        alt={service.titulo}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                        {service.categorias?.categorias || 'Serviço'}
                      </div>
                      <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        service.status === 'arquivado'
                          ? 'bg-amber-100 text-amber-700'
                          : service.status === 'excluido'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {service.status || 'ativo'}
                      </div>
                    </div>

                    <div className="p-4.5 flex flex-col gap-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{service.titulo}</h3>
                      </div>

                      <div className="text-[10px] text-slate-400">
                        por <span className="font-bold text-slate-600">{service.usuarios?.nome_completo || 'Desconhecido'}</span>
                      </div>

                      <div className="text-emerald-600 font-extrabold text-sm">
                        R$ {service.preco_estimado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 gap-2">
                        <Link
                          to={`/servico/${service.id}`}
                          className="text-slate-500 hover:text-emerald-600 font-bold text-xs flex items-center gap-1"
                        >
                          <ExternalLink size={12} />
                          Visualizar
                        </Link>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleArchiveService(service.id, service.status)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              service.status === 'arquivado'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                            title={service.status === 'arquivado' ? 'Reativar' : 'Arquivar'}
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir permanentemente"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-14 bg-white border border-slate-100 rounded-3xl-cozy flex flex-col items-center gap-2 shadow-xs">
                <Shield className="text-slate-300" size={24} />
                <h3 className="font-bold text-slate-800 text-sm">Nenhum anúncio encontrado</h3>
                <p className="text-slate-400 text-xs">Todos os anúncios estão ativos ou ainda não foram criados.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Finalizar Denúncia */}
      {denunciaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl-cozy w-full max-w-md shadow-xl border border-slate-100 flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-extrabold text-sm text-slate-800">Finalizar Denúncia</h2>
              <button
                onClick={() => setDenunciaModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Resultado</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDenunciaResultado('positivo')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl-cozy border font-bold text-xs transition-all cursor-pointer ${
                      denunciaResultado === 'positivo'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <ThumbsUp size={14} />
                    Positiva
                  </button>
                  <button
                    onClick={() => setDenunciaResultado('alerta')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl-cozy border font-bold text-xs transition-all cursor-pointer ${
                      denunciaResultado === 'alerta'
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <ThumbsDown size={14} />
                    Alerta
                  </button>
                </div>
                {denunciaResultado === 'alerta' && (
                  <p className="text-[9px] text-red-500 font-semibold mt-1">
                    Um alerta será adicionado ao prestador. Com 3 alertas, ele será removido como prestador.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Observação (opcional)</label>
                <textarea
                  placeholder="Descreva o desfecho da denúncia..."
                  value={denunciaObservacao}
                  onChange={(e) => setDenunciaObservacao(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  onClick={() => setDenunciaModalOpen(false)}
                  className="px-4 py-2 rounded-xl-cozy border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalizarDenuncia}
                  disabled={denunciaActionLoading}
                  className="px-4 py-2 rounded-xl-cozy bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {denunciaActionLoading ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  {denunciaActionLoading ? 'Finalizando...' : 'Finalizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Criar/Editar Serviço */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl-cozy w-full max-w-lg shadow-xl border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">

            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-extrabold text-sm text-slate-800">
                {editingService ? 'Editar Anúncio' : 'Anunciar Novo Serviço'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-left">

              {formValidationError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl-cozy p-4 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-700 text-xs font-bold">{formValidationError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormValidationError('')}
                    className="self-end text-[10px] font-bold text-red-500 hover:text-red-700 underline cursor-pointer"
                  >
                    Entendi
                  </button>
                </div>
              )}

              {formError && (
                <div className="bg-red-50 text-red-600 text-xs font-semibold p-3.5 rounded-xl-cozy border border-red-100">
                  {formError}
                </div>
              )}

              {/* Título do Serviço */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Título do Serviço <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ex: Pintura Residencial de Portas e Paredes"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50"
                />
              </div>

              {/* Categoria */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Categoria <span className="text-red-500">*</span></label>
                <select
                  value={formCategoria}
                  onChange={(e) => {
                    setFormCategoria(e.target.value)
                    carregarSubcategorias(e.target.value)
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50 cursor-pointer font-semibold"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.categorias}>
                      {cat.categorias}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategoria */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Nicho (opcional) {subcategoriasDisponiveis.length > 0 && <span className="text-emerald-500">({subcategoriasDisponiveis.length} disponíveis)</span>}</label>
                <select
                  value={formSubcategoria}
                  onChange={(e) => setFormSubcategoria(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50 cursor-pointer font-semibold"
                >
                  <option value="">Selecione um nicho</option>
                  {subcategoriasDisponiveis.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
                {subcategoriasDisponiveis.length === 0 && formCategoria && (
                  <p className="text-[9px] text-red-400 font-semibold">Nenhum nicho encontrado para esta categoria.</p>
                )}
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Descrição <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  placeholder="Descreva detalhadamente o serviço que você oferece, materiais, etc..."
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Preço Estimado */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Preço Inicial (R$) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 120.00"
                    value={formPrecoEstimado}
                    onChange={(e) => setFormPrecoEstimado(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50"
                  />
                </div>

                {/* Whatsapp */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">WhatsApp <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    placeholder="Ex: 11999999999"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Preço Detalhe */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Regra de Cobrança (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: R$ 80/hora ou Cobrado por m²"
                  value={formPrecoDetalhe}
                  onChange={(e) => setFormPrecoDetalhe(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50"
                />
              </div>

              {/* Foto do Serviço */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Foto do Serviço <span className="text-red-500">*</span></label>

                {/* Upload Area */}
                <label className="relative flex flex-col items-center justify-center w-full h-32 rounded-2xl-cozy border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer group overflow-hidden">
                  {formFotoPreview ? (
                    <>
                      <img src={formFotoPreview} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <ImageUp size={22} className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </div>
                    </>
                  ) : formFotoUrl ? (
                    <>
                      <img src={formFotoUrl} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <ImageUp size={22} className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <ImageUp size={22} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">Clique para selecionar .jpg</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        revokePreview()
                        setFormFotoFile(file)
                        setFormFotoPreview(URL.createObjectURL(file))
                        setFormFotoUrl('')
                      }
                    }}
                  />
                </label>

                {/* Manter URL como alternativa */}
                <div className="relative">
                  <span className="text-[9px] text-slate-400 pl-1">Ou cole uma URL</span>
                  <input
                    type="url"
                    placeholder="https://link-da-imagem.com/servico.jpg"
                    value={formFotoUrl}
                    onChange={(e) => {
                      setFormFotoUrl(e.target.value)
                      if (e.target.value) {
                        setFormFotoFile(null)
                        setFormFotoPreview('')
                      }
                    }}
                    className="w-full px-4 py-2 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50 mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl-cozy text-xs border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitLoading || uploadingImage}
                  className="text-white font-extrabold px-5 py-2 rounded-xl-cozy shadow-xs shadow-emerald-500/10 hover:shadow-md transition-all duration-300 cozy-button-gradient hover:scale-102 active:scale-98 disabled:opacity-50 cursor-pointer text-xs flex items-center gap-1.5"
                >
                  {(formSubmitLoading || uploadingImage) && <Loader size={12} className="animate-spin" />}
                  {uploadingImage ? 'Enviando imagem...' : formSubmitLoading ? 'Salvando...' : 'Salvar Anúncio'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
export default Dashboard;
