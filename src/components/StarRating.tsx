import React from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  total?: number
  size?: number
  showLabel?: boolean
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  total, 
  size = 16, 
  showLabel = true 
}) => {
  const stars = []
  const roundedRating = Math.round(rating * 2) / 2 // Arredonda para o 0.5 mais próximo
  
  for (let i = 1; i <= 5; i++) {
    if (i <= roundedRating) {
      stars.push(
        <Star
          key={i}
          size={size}
          className="fill-amber-400 text-amber-400"
        />
      )
    } else if (i - 0.5 === roundedRating) {
      stars.push(
        <div key={i} className="relative inline-block" style={{ width: size, height: size }}>
          <Star size={size} className="text-slate-200" />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2 h-full">
            <Star size={size} className="fill-amber-400 text-amber-400" />
          </div>
        </div>
      )
    } else {
      stars.push(
        <Star
          key={i}
          size={size}
          className="text-slate-200"
        />
      )
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {stars}
      </div>
      {showLabel && rating > 0 && (
        <span className="font-bold text-slate-700 text-sm ml-0.5">
          {rating.toFixed(1)}
        </span>
      )}
      {total !== undefined && (
        <span className="text-slate-400 text-xs ml-0.5">
          ({total})
        </span>
      )}
    </div>
  )
}
export default StarRating;
