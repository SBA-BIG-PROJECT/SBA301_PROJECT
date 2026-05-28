import noPoster from '../assets/No-Poster.svg'
import { IMAGE_BASE_URL, formatRating, getYear } from '../lib/tmdb'

const PosterCard = ({ movie, onSelect, onPlay }) => {
  const posterUrl = movie.poster_path
    ? `${IMAGE_BASE_URL}${movie.poster_path}`
    : noPoster

  const handleSelect = () => {
    if (onSelect) {
      onSelect(movie)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelect()
    }
  }

  const handlePlay = (event) => {
    event.stopPropagation()
    if (onPlay) {
      onPlay(movie)
    }
  }

  return (
    <div
      className="poster-card"
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <img src={posterUrl} alt={movie.title} loading="lazy" />
      <div className="poster-card__overlay">
        <button className="poster-card__cta" type="button" onClick={handlePlay}>
          Trailer
        </button>
      </div>
      <div className="poster-card__meta">
        <h3>{movie.title}</h3>
        <div className="poster-card__sub">
          <span>{getYear(movie.release_date)}</span>
          <span>•</span>
          <span>{formatRating(movie.vote_average)}</span>
        </div>
      </div>
    </div>
  )
}

export default PosterCard
