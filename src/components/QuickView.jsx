import { useEffect } from 'react'
import noPoster from '../assets/No-Poster.svg'
import { IMAGE_BASE_URL, formatRating, getYear } from '../lib/tmdb'

const QuickView = ({ movie, onClose, onWatch, onDetails }) => {
  useEffect(() => {
    if (!movie) {
      return
    }

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [movie, onClose])

  if (!movie) {
    return null
  }

  const poster = movie.poster_path
    ? `${IMAGE_BASE_URL}${movie.poster_path}`
    : noPoster

  return (
    <div className="quick-view" role="dialog" aria-modal="true">
      <div className="quick-view__scrim" onClick={onClose} />
      <div className="quick-view__panel">
        <button className="quick-view__close" type="button" onClick={onClose}>
          Close
        </button>
        <div className="quick-view__content">
          <div className="quick-view__poster">
            <img src={poster} alt={movie.title} />
          </div>
          <div className="quick-view__info">
            <h2>{movie.title}</h2>
            <div className="quick-view__meta">
              <span>{getYear(movie.release_date)}</span>
              <span>•</span>
              <span>{formatRating(movie.vote_average)}</span>
            </div>
            <p className="quick-view__overview">
              {movie.overview || 'Overview not available yet.'}
            </p>
            <div className="quick-view__actions">
              <button className="btn btn--primary" type="button" onClick={onWatch}>
                Watch Trailer
              </button>
              <button className="btn btn--ghost" type="button" onClick={onDetails}>
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickView
