import React from 'react'
import ratingIcon from '../assets/Rating.svg'
import noPoster from '../assets/No-Poster.svg'

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

const MovieCard = ({ movie }) => {
  const { title } = movie;
  const rating_val = movie.vote_average ?? movie.rating ?? movie.voteAverage;
  const poster_val = movie.poster_path ?? movie.posterPath;
  const release_val = movie.release_date ?? movie.releaseDate ?? movie.releaseYear;
  const language_val = movie.original_language ?? movie.originalLanguage;

  const rating = rating_val != null ? Number(rating_val) : null;
  const year = release_val
    ? (String(release_val).includes('-') ? String(release_val).split('-')[0] : String(release_val))
    : 'N/A';

  const posterSrc = poster_val
    ? (String(poster_val).startsWith('http') ? poster_val : `${IMAGE_BASE}${String(poster_val).startsWith('/') ? '' : '/'}${poster_val}`)
    : noPoster;

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

          {language_val && (
            <>
              <span>•</span>
              <p className="lang">{language_val}</p>
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