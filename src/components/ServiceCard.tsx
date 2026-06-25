import React from 'react'
import { Link } from 'react-router-dom'
import { Phone, Star, MapPin } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export interface ServiceCardProps {
  id: number
  titulo: string
  descricao?: string
  preco_estimado: number
  foto_url?: string
  whatsapp?: string
  categoria_nome?: string
  subcategoria_nome?: string
  autor_nome: string
  autor_empresa?: string
  autor_cidade?: string
  autor_avatar?: string
  autor_id?: string
  media_notas: number
  total_avaliacoes?: number
}

const fallbackServiceImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80'
const fallbackAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'

export const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  titulo,
  preco_estimado,
  foto_url,
  whatsapp,
  autor_nome,
  autor_empresa,
  autor_cidade,
  autor_avatar,
  autor_id,
  media_notas,
  total_avaliacoes,
}) => {
  const { user } = useAuth()
  const rating = media_notas || 0
  const reviewCount = total_avaliacoes || 0

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!whatsapp) return
    const cleaned = whatsapp.replace(/\D/g, '')
    const msg = encodeURIComponent(`Olá, vi seu serviço "${titulo}" no Vizinho Indica. Está disponível?`)
    window.open(`https://wa.me/${cleaned}?text=${msg}`, '_blank')
  }

  return (
    <Link
      to={`/servico/${id}`}
      className="group block bg-white rounded-2xl-cozy overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5"
    >
      <div className="aspect-video w-full bg-slate-50 overflow-hidden">
        <img
          src={foto_url || fallbackServiceImage}
          alt={titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-extrabold text-slate-800 text-sm leading-tight line-clamp-2">
          {titulo}
        </h3>

        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={10}
                className={n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-slate-700">{rating.toFixed(1)}</span>
          <span className="text-[10px] text-slate-400">({reviewCount})</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link
              to={autor_id ? `/perfil/${autor_id}` : '#'}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            >
              <img
                src={autor_avatar || fallbackAvatar}
                alt={autor_nome}
                className="w-7 h-7 rounded-full object-cover border border-slate-100"
              />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Prestador</p>
              <p className="text-[12px] font-bold text-slate-700 truncate leading-tight mt-0.5">
                {autor_empresa || autor_nome}
              </p>
              {autor_cidade && (
                <p className="text-[9px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                  <MapPin size={7} />
                  {autor_cidade}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user && (
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block font-semibold">A partir de</span>
                <span className="text-emerald-600 font-black text-sm">
                  R$ {preco_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',')}
                </span>
              </div>
            )}
            {whatsapp && (
              <button
                onClick={handleWhatsAppClick}
                className="flex items-center gap-1 bg-emerald-600 text-white font-extrabold px-2.5 py-1.5 rounded-xl-cozy text-[9px] hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
              >
                <Phone size={9} />
                Chamar
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
export default ServiceCard;
