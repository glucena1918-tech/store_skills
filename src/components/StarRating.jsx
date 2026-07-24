import { Star } from 'lucide-react'

export default function StarRating({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`transition-colors duration-200 ${
            star <= rating
              ? 'fill-[var(--color-star)] text-[var(--color-star)]'
              : 'fill-none text-[var(--color-bg-tertiary)]'
          }`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  )
}
