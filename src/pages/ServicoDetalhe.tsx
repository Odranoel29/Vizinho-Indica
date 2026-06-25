import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { StarRating } from '../components/StarRating'
import { useAuth } from '../contexts/AuthContext'
import { Phone, Heart, ArrowLeft, ShieldCheck, Calendar, MessageSquare, AlertCircle, Star, Loader, Flag, Lock, Camera, X, ImageUp } from 'lucide-react'

export const ServicoDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [service, setService] = useState<any | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoritingLoading, setFavoritingLoading] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)
  const [reviewNota, setReviewNota] = useState(0)
  const [reviewComentario, setReviewComentario] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })
  const [denunciaAberta, setDenunciaAberta] = useState(false)
  const [denunciaMotivo, setDenunciaMotivo] = useState('')
  const [denunciaLoading, setDenunciaLoading] = useState(false)

  const [isOwner, setIsOwner] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [podeAvaliar, setPodeAvaliar] = useState(false)
  const [interacaoId, setInteracaoId] = useState<number | null>(null)
  const [jaAvaliou, setJaAvaliou] = useState(false)

  const fallbackServiceImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'
  const fallbackAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        setLoading(true)
        let ownerId: number | undefined

        const { data: serviceData, error: serviceError } = await supabase
          .from('v_servicos_destaque')
          .select('*')
          .eq('servico_id', id)
          .maybeSingle()

        if (serviceError) throw serviceError
        
        if (serviceData) {
          setService(serviceData)
          ownerId = serviceData.autor_id
        } else {
          // Fallback caso não seja retornado pela view (ex: sem avaliações)
          const { data: fbData } = await supabase
            .from('servicos')
            .select('*, usuarios:criado_por(*)')
            .eq('id', id)
            .maybeSingle()
          
          if (fbData) {
            setService({
              servico_id: fbData.id,
              titulo: fbData.titulo,
              descricao: fbData.descricao,
              preco_estimado: fbData.preco_estimado,
              preco_detalhe: fbData.preco_detalhe,
              foto_url: fbData.foto_url,
              whatsapp: fbData.whatsapp,
              autor_id: fbData.usuarios?.id,
              autor_nome: fbData.usuarios?.nome_completo,
              autor_avatar: fbData.usuarios?.avatar_url,
              autor_bio: fbData.usuarios?.bio,
              media_notas: 0,
              total_avaliacoes: 0
            })
            ownerId = fbData.criado_por
          }
        }

        // Buscar as avaliações
        if (ownerId) {
          const { data: reviewsData } = await supabase
            .from('avaliacoes')
            .select('*, interacoes!inner(cliente_nome)')
            .eq('prestador_id', ownerId)

          if (reviewsData) {
            setReviews(reviewsData)
          }
        }

        // Verificar se está favoritado
        if (user && profile) {
          const { data: favData } = await supabase
            .from('favoritos')
            .select('*')
            .eq('usuario_id', profile.id)
            .eq('servicos_id', id)
            .maybeSingle()

          if (favData) {
            setIsFavorited(true)
          } else {
            const localFavs = JSON.parse(localStorage.getItem('favoritos') || '[]')
            setIsFavorited(localFavs.includes(Number(id)))
          }
        } else {
          const localFavs = JSON.parse(localStorage.getItem('favoritos') || '[]')
          setIsFavorited(localFavs.includes(Number(id)))
        }

        // Verificar se o usuário é o dono do serviço
        if (profile && ownerId) {
          setIsOwner(profile.id === ownerId)
        } else {
          setIsOwner(false)
        }

        // Verificar interação liberada para avaliação
        if (profile?.whatsapp && ownerId) {
          const { data: interacao } = await supabase
            .from('interacoes')
            .select('id')
            .eq('prestador_id', ownerId)
            .eq('cliente_whatsapp', profile.whatsapp)
            .eq('status', 'LIBERADO')
            .maybeSingle()

          if (interacao) {
            setPodeAvaliar(true)
            setInteracaoId(interacao.id)
          }

          const { data: jaAvaliado } = await supabase
            .from('interacoes')
            .select('id')
            .eq('prestador_id', ownerId)
            .eq('cliente_whatsapp', profile.whatsapp)
            .eq('status', 'AVALIADO')
            .maybeSingle()

          if (jaAvaliado) {
            setJaAvaliou(true)
          }
        }

      } catch (err) {
        console.error('Erro ao buscar serviço:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchServiceData()
    }
  }, [id, user, profile])

  const handleFavoriteToggle = async () => {
    if (!service) return
    setFavoritingLoading(true)

    try {
      if (user && profile) {
        if (isFavorited) {
          await supabase
            .from('favoritos')
            .delete()
            .eq('usuario_id', profile.id)
            .eq('servicos_id', service.servico_id)
        } else {
          await supabase
            .from('favoritos')
            .insert({
              usuario_id: profile.id,
              servicos_id: service.servico_id
            })
        }
      }
      
      const localFavs = JSON.parse(localStorage.getItem('favoritos') || '[]')
      let newFavs
      if (isFavorited) {
        newFavs = localFavs.filter((fId: number) => fId !== service.servico_id)
      } else {
        newFavs = [...localFavs, service.servico_id]
      }
      localStorage.setItem('favoritos', JSON.stringify(newFavs))
      setIsFavorited(!isFavorited)
    } catch (err) {
      console.warn('Erro ao atualizar favoritos no banco, salvando localmente:', err)
      setIsFavorited(!isFavorited)
    } finally {
      setFavoritingLoading(false)
    }
  }

  const handleWhatsAppContact = async () => {
    if (!service) return
    if (!user) {
      navigate('/auth')
      return
    }
    setContactLoading(true)

    try {
      await supabase
        .from('interacoes')
        .insert({
          prestador_id: service.autor_id,
          cliente_nome: profile?.nome_completo || user.email?.split('@')[0] || 'Vizinho',
          cliente_whatsapp: profile?.whatsapp || '',
          data_contato: new Date().toISOString(),
          status: 'PENDENTE'
        })

      await supabase
        .from('contatos')
        .insert({
          servico_id: service.servico_id,
          prestador_id: service.autor_id,
          cliente_id: user.id,
          created_at: new Date().toISOString()
        })
    } catch (err) {
      console.error('Erro ao registrar interação:', err)
    }

    const cleanedNumber = service.whatsapp ? service.whatsapp.replace(/\D/g, '') : ''
    const msg = encodeURIComponent(`Olá, vi seu serviço "${service.titulo}" no Vizinho Indica. Está disponível?`)
    window.open(`https://wa.me/${cleanedNumber}?text=${msg}`, '_blank')
    setContactLoading(false)
    setToast({ show: true, message: 'Redirecionando para o WhatsApp...', type: 'success' })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  const handleSubmitReview = async () => {
    if (!user || !profile || !service || reviewNota === 0 || !interacaoId) return
    setReviewLoading(true)

    try {
      const { error } = await supabase
        .from('avaliacoes')
        .insert({
          interacao_id: interacaoId,
          prestador_id: service.autor_id,
          nota: reviewNota,
          comentario: reviewComentario || null,
          data_avaliacao: new Date().toISOString()
        })

      if (error) throw error

      await supabase
        .from('interacoes')
        .update({ status: 'AVALIADO', updated_at: new Date().toISOString() })
        .eq('id', interacaoId)

      await supabase.rpc('recalcular_metricas_prestador', { p_prestador_id: service.autor_id })

      setReviewNota(0)
      setReviewComentario('')
      setPodeAvaliar(false)
      setJaAvaliou(true)
      setToast({ show: true, message: 'Avaliação enviada com sucesso!', type: 'success' })
      setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)

    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Erro ao enviar avaliação.', type: 'error' })
      setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
    } finally {
      setReviewLoading(false)
    }
  }

  const openImageModal = () => {
    setImageFile(null)
    setImagePreview('')
    setImageUrl('')
    setImageModalOpen(true)
  }

  const handleImageChange = async () => {
    if (!service || !profile) return
    setImageUploading(true)

    try {
      let fotoUrlFinal = imageUrl || null

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const filePath = `${profile.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('servicos')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('servicos')
          .getPublicUrl(filePath)

        fotoUrlFinal = publicUrlData?.publicUrl || null
      }

      if (!fotoUrlFinal) {
        throw new Error('Selecione uma imagem ou insira uma URL.')
      }

      const { error: updateError } = await supabase
        .from('servicos')
        .update({ foto_url: fotoUrlFinal })
        .eq('id', service.servico_id)

      if (updateError) throw updateError

      setService({ ...service, foto_url: fotoUrlFinal })
      setImageModalOpen(false)
      setToast({ show: true, message: 'Imagem de capa atualizada com sucesso!', type: 'success' })
      setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Erro ao atualizar imagem.', type: 'error' })
      setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
    } finally {
      setImageUploading(false)
    }
  }

  const handleDenunciar = async () => {
    if (!user || !service || !denunciaMotivo.trim()) return
    setDenunciaLoading(true)

    try {
      const { error } = await supabase
        .from('denuncias')
        .insert({
          servico_id: service.servico_id,
          autor_id: user.id,
          motivo: denunciaMotivo.trim()
        })

      if (error) throw error

      setDenunciaAberta(false)
      setDenunciaMotivo('')
      setToast({ show: true, message: 'Denúncia enviada com sucesso!', type: 'success' })
      setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Erro ao enviar denúncia.', type: 'error' })
      setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
    } finally {
      setDenunciaLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse flex flex-col gap-6">
        <div className="h-6 bg-slate-100 rounded-md w-24"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="aspect-video bg-slate-100 rounded-2xl-cozy w-full"></div>
            <div className="h-6 bg-slate-100 rounded-md w-3/4"></div>
            <div className="h-4 bg-slate-100 rounded-md w-full"></div>
          </div>
          <div className="bg-white rounded-2xl-cozy border border-slate-100 p-6 h-64"></div>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-3">
        <AlertCircle size={32} className="text-slate-400" />
        <h3 className="font-bold text-slate-800 text-sm">Serviço não encontrado</h3>
        <p className="text-slate-400 text-xs">O serviço solicitado foi removido ou não existe.</p>
        <Link to="/" className="text-emerald-600 font-bold text-xs mt-2 hover:underline">Voltar para o Início</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6 text-left relative">
      
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl-cozy text-xs font-bold shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <Link to="/" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors w-fit">
        <ArrowLeft size={12} />
        Voltar para a vitrine
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Coluna Esquerda */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="aspect-video w-full rounded-2xl-cozy overflow-hidden bg-slate-50 border border-slate-100 relative group">
            <img
              src={service.foto_url || fallbackServiceImage}
              alt={service.titulo}
              className="w-full h-full object-cover"
            />
            {isOwner && (
              <button
                onClick={openImageModal}
                className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center cursor-pointer"
              >
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center gap-1.5 bg-white/90 text-slate-700 px-4 py-2.5 rounded-2xl-cozy shadow-lg">
                  <Camera size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Alterar Capa</span>
                </div>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 leading-tight">
              {service.titulo}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
              {service.categoria_nome && (
                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider">
                  {service.subcategoria_nome || service.categoria_nome}
                </span>
              )}
              <div className="flex items-center gap-1">
                <StarRating rating={service.media_notas} showLabel={false} size={14} />
                <span className="font-bold text-slate-700">{service.media_notas?.toFixed(1) || '0.0'}</span>
                <span>({service.total_avaliacoes || 0} avaliações)</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Descrição do Serviço</h2>
            <p className="text-slate-500 text-xs md:text-sm leading-relaxed whitespace-pre-line bg-white p-5 rounded-2xl-cozy border border-slate-100 shadow-xs">
              {service.descricao || 'Nenhuma descrição fornecida pelo prestador.'}
            </p>
          </div>

          {service.preco_detalhe && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Preço Detalhado</h2>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed bg-emerald-50/20 p-5 rounded-2xl-cozy border border-emerald-100 text-emerald-800">
                {service.preco_detalhe}
              </p>
            </div>
          )}

          <hr className="border-slate-100" />

          {/* Avaliações */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Opinião da Vizinhança</h2>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {reviews.length} avaliações
              </span>
            </div>

            {reviews.length > 0 ? (
              <div className="flex flex-col gap-4.5">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white rounded-2xl-cozy border border-slate-100 p-5 shadow-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs border border-slate-100">
                          {(rev.interacoes?.cliente_nome || 'V')[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-700 text-xs block leading-tight">
                            {rev.interacoes?.cliente_nome || 'Vizinho'}
                          </span>
                          <span className="text-[8px] text-slate-400 font-semibold uppercase mt-0.5">
                            {new Date(rev.created_at || Date.now()).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <StarRating rating={rev.nota} showLabel={true} size={12} />
                    </div>
                    {rev.comentario && (
                      <p className="text-slate-500 text-xs leading-relaxed bg-slate-50/50 p-3.5 rounded-xl-cozy border border-slate-100/30">
                        "{rev.comentario}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl-cozy flex flex-col items-center gap-2">
                <MessageSquare className="text-slate-300" size={20} />
                <p className="text-slate-400 text-xs">Ainda não avaliaram este serviço. Seja o primeiro a contratar!</p>
              </div>
            )}
          </div>

          {/* Formulario de Avaliação */}
          {user && podeAvaliar && (
            <div className="bg-white rounded-2xl-cozy border border-emerald-200 p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Avaliar este serviço</h3>
              </div>
              <p className="text-[10px] text-slate-500">Você clicou no WhatsApp deste prestador. Conte sua experiência!</p>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewNota(n)}
                    className="cursor-pointer transition-all hover:scale-110"
                  >
                    <Star
                      size={20}
                      className={n <= reviewNota ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                    />
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Conte sua experiência (opcional)..."
                value={reviewComentario}
                onChange={(e) => setReviewComentario(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50 resize-none"
              />

              <button
                onClick={handleSubmitReview}
                disabled={reviewNota === 0 || reviewLoading}
                className="self-end text-white font-extrabold px-4 py-2 rounded-xl-cozy shadow-xs shadow-emerald-500/10 hover:shadow-md transition-all duration-300 cozy-button-gradient hover:scale-102 active:scale-98 flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50"
              >
                {reviewLoading ? <Loader size={12} className="animate-spin" /> : <MessageSquare size={12} />}
                {reviewLoading ? 'Enviando...' : 'Enviar Avaliação'}
              </button>
            </div>
          )}

          {user && jaAvaliou && (
            <div className="bg-slate-50 rounded-2xl-cozy border border-slate-200 p-5 flex items-center gap-3">
              <MessageSquare size={16} className="text-slate-400" />
              <p className="text-xs text-slate-500">Você já avaliou este serviço. Obrigado pelo feedback!</p>
            </div>
          )}

        </div>

        {/* Coluna Direita */}
        <div className="lg:sticky lg:top-20 flex flex-col gap-4">
          <div className="bg-white rounded-3xl-cozy border border-slate-100 p-6 shadow-md flex flex-col gap-5 text-center items-center">
            
            <Link to={`/perfil/${service.autor_id}`} className="relative block">
              <img
                src={service.autor_avatar || fallbackAvatar}
                alt={service.autor_nome}
                className="w-18 h-18 rounded-full object-cover border-3 border-emerald-50 shadow-xs hover:opacity-80 transition-opacity"
              />
              <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-1 border border-white shadow-xs">
                <ShieldCheck size={14} />
              </div>
            </Link>

            <div className="flex flex-col gap-1 w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prestador do Serviço</span>
              <Link to={`/perfil/${service.autor_id}`} className="hover:text-emerald-600 transition-colors">
                <h3 className="font-extrabold text-slate-800 text-sm leading-tight">
                  {service.autor_nome || 'Vizinho Anônimo'}
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full text-[8px] font-bold text-slate-500 w-fit mx-auto mt-1 border border-slate-100">
                <Calendar size={8} />
                <span>Vizinho Ativo</span>
              </div>
            </div>

            {service.autor_bio && (
              <p className="text-slate-500 text-xs leading-relaxed italic bg-slate-50/30 p-3.5 rounded-xl-cozy w-full border border-slate-100/50">
                "{service.autor_bio}"
              </p>
            )}

            <hr className="border-slate-100 w-full" />

            {user ? (
              <div className="flex flex-col gap-0.5 w-full">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Preço Estimado</span>
                <span className="text-emerald-600 font-black text-2xl">
                  R$ {service.preco_estimado ? service.preco_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                </span>
              </div>
            ) : (
              <div className="w-full bg-slate-50 rounded-2xl-cozy px-4 py-3.5 flex items-center gap-2.5 border border-slate-100">
                <Lock size={14} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Preço restrito</p>
                  <p className="text-[10px] text-slate-400">Faça login para ver o valor do serviço</p>
                </div>
              </div>
            )}

            {user ? (
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={handleWhatsAppContact}
                  disabled={contactLoading}
                  className="w-full text-white font-extrabold py-3.5 rounded-2xl-cozy shadow-xs shadow-emerald-500/10 hover:shadow-md transition-all duration-300 cozy-button-gradient hover:scale-102 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer text-xs disabled:opacity-50"
                >
                  {contactLoading ? <Loader size={12} className="animate-spin" /> : <Phone size={12} />}
                  {contactLoading ? 'Abrindo WhatsApp...' : 'Chamar no WhatsApp'}
                </button>

                <button
                  onClick={handleFavoriteToggle}
                  disabled={favoritingLoading}
                  className={`w-full font-extrabold py-3 rounded-2xl-cozy border transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                    isFavorited
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100/80'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Heart size={12} className={isFavorited ? 'fill-red-600' : ''} />
                  {isFavorited ? 'Remover dos Favoritos' : 'Salvar nos Favoritos'}
                </button>

                <button
                  onClick={() => setDenunciaAberta(true)}
                  className="w-full font-extrabold py-3 rounded-2xl-cozy border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50/50 transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <Flag size={12} />
                  Denunciar
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="w-full bg-emerald-600 text-white font-extrabold py-3.5 rounded-2xl-cozy shadow-xs shadow-emerald-500/10 hover:shadow-md transition-all duration-300 cozy-button-gradient hover:scale-102 active:scale-98 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <Lock size={12} />
                Faça login para interagir com o serviço
              </Link>
            )}

          </div>

          {/* Modal de Denúncia */}
          {denunciaAberta && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-6">
              <div className="bg-white max-w-sm w-full rounded-3xl-cozy p-6 shadow-xl flex flex-col gap-4">
                <h3 className="font-extrabold text-slate-800 text-sm">Denunciar este serviço</h3>
                <p className="text-xs text-slate-400">Conte o motivo da denúncia para a moderação.</p>

                <textarea
                  placeholder="Ex: Anúncio falso, preço abusivo, conteúdo impróprio..."
                  value={denunciaMotivo}
                  onChange={(e) => setDenunciaMotivo(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-red-500 text-xs bg-slate-50/50 resize-none"
                />

                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => { setDenunciaAberta(false); setDenunciaMotivo('') }}
                    className="px-4 py-2 rounded-xl-cozy border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDenunciar}
                    disabled={!denunciaMotivo.trim() || denunciaLoading}
                    className="px-4 py-2 rounded-xl-cozy bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {denunciaLoading ? <Loader size={12} className="animate-spin" /> : <Flag size={12} />}
                    {denunciaLoading ? 'Enviando...' : 'Enviar Denúncia'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Alterar Capa */}
          {imageModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-6">
              <div className="bg-white max-w-sm w-full rounded-3xl-cozy p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-sm">Alterar Imagem de Capa</h3>
                  <button
                    onClick={() => setImageModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <label className="relative flex flex-col items-center justify-center w-full h-32 rounded-2xl-cozy border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer group overflow-hidden">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
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
                        setImageFile(file)
                        setImagePreview(URL.createObjectURL(file))
                        setImageUrl('')
                      }
                    }}
                  />
                </label>

                <div className="relative">
                  <span className="text-[9px] text-slate-400 pl-1">Ou cole uma URL</span>
                  <input
                    type="url"
                    placeholder="https://link-da-imagem.com/servico.jpg"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value)
                      if (e.target.value) {
                        setImageFile(null)
                        setImagePreview('')
                      }
                    }}
                    className="w-full px-4 py-2 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50 mt-1"
                  />
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setImageModalOpen(false)}
                    className="px-4 py-2 rounded-xl-cozy border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImageChange}
                    disabled={(!imageFile && !imageUrl.trim()) || imageUploading}
                    className="px-4 py-2 rounded-xl-cozy bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {imageUploading ? <Loader size={12} className="animate-spin" /> : <Camera size={12} />}
                    {imageUploading ? 'Enviando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
export default ServicoDetalhe;
