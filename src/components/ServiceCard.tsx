import React from 'react'
import { Link } from 'react-router-dom'
import { StarRating } from './StarRating'
import { Tag, MapPin, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export interface ServiceCardProps {
  id: number
  titulo: string
  descricao?: string
  preco_estimado: number
  foto_url?: string
  categoria_nome?: string
  subcategoria_nome?: string
  autor_nome: string
  autor_avatar?: string
  autor_id?: string
  media_notas: number
  total_avaliacoes?: number
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  titulo,
  descricao,
  preco_estimado,
  foto_url,
  categoria_nome,
  subcategoria_nome,
  autor_nome,
  autor_avatar,
  autor_id,
  media_notas,
  total_avaliacoes,
}) => {
  const { user } = useAuth()
  const fallbackServiceImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80'
  const fallbackAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'

  return (
    <Link
      to={`/servico/${id}`}
      className="group block bg-white rounded-2xl-cozy overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5"
    >
      {/* Imagem */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-50">
        <img
          src={foto_url || fallbackServiceImage}
          alt={titulo}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {categoria_nome && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-100/30 flex items-center gap-1 shadow-xs">
            <Tag size={10} />
            {subcategoria_nome || categoria_nome}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex flex-col gap-3">
        {/* Autor */}
        <div className="flex items-center gap-2">
          <Link
            to={autor_id ? `/perfil/${autor_id}` : '#'}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src={autor_avatar || fallbackAvatar}
              alt={autor_nome}
              className="w-6.5 h-6.5 rounded-full object-cover border border-slate-100 ring-1 ring-white"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-600 truncate max-w-[140px] leading-tight">
                {autor_nome}
              </span>
              <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                <MapPin size={8} />
                Vizinho
              </span>
            </div>
          </Link>
        </div>

        {/* Título */}
        <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1 group-hover:text-emerald-600 transition-colors">
          {titulo}
        </h3>

        {/* Descrição */}
        {descricao && (
          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
            {descricao}
          </p>
        )}

        {/* Preço + Avaliação */}
        <div className="flex items-end justify-between mt-1 pt-3 border-t border-slate-100">
          {user ? (
            <div>
              <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">A partir de</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-slate-400 text-xs font-bold">R$</span>
                <span className="text-emerald-600 font-black text-lg">
                  {preco_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',')}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Lock size={10} />
              <span className="text-[9px] font-semibold uppercase tracking-wider">Faça login para ver o preço</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            {media_notas > 0 ? (
              <StarRating rating={media_notas} total={total_avaliacoes} showLabel={true} />
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">Sem avaliações</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
export default ServiceCard;
