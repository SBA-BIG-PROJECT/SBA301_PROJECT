import React from 'react'
import ratingIcon from '../assets/Rating.svg'
import noPoster from '../assets/No-Poster.svg'

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

const MovieCard = ({ movie:
  { title, vote_average, poster_path, release_date, original_language }
}) => {
  const rating = vote_average != null ? Number(vote_average) : null
  const year = release_date
    ? (release_date.includes('-') ? release_date.split('-')[0] : String(release_date))
    : 'N/A'

  const posterSrc = poster_path
    ? (poster_path.startsWith('http') ? poster_path : `${IMAGE_BASE}${poster_path.startsWith('/') ? '' : '/'}${poster_path}`)
    : noPoster

  return (
    <div className="movie-card">
      <img src={posterSrc} alt={title} />

      <div className="mt-4">
        <h3>{title}</h3>

        <div className="content">
          <div className="rating">
            <img src={ratingIcon} alt="Star Icon" />
            <p>{rating != null && !isNaN(rating) ? rating.toFixed(1) : 'N/A'}</p>
          </div>

          {original_language && (
            <>
              <span>•</span>
              <p className="lang">{original_language}</p>
            </>
          )}

          <span>•</span>
          <p className="year">{year}</p>
        </div>
      </div>
    </div>
  )
}
export default MovieCard