import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Spinner from '../components/Spinner.jsx'
import heroImg from '../assets/hero-img.png'
import noPoster from '../assets/No-Poster.svg'
import {
  BACKDROP_BASE_URL,
  IMAGE_BASE_URL,
  fetchMovie,
  fetchMovieCredits,
  fetchMovieReviews,
  fetchRelatedMovies,
  formatRating,
  getYear
} from '../lib/tmdb'
import { useWatchlist } from '../hooks/useWatchlist'
import PosterCard from '../components/PosterCard.jsx'

const Detail = () => {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [credits, setCredits] = useState(null)
  const [reviews, setReviews] = useState([])
  const [relatedMovies, setRelatedMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist()
  
  useEffect(() => {
    let active = true

    const loadDetails = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [movieData, creditsData, reviewsData, relatedData] = await Promise.all([
          fetchMovie(id),
          fetchMovieCredits(id),
          fetchMovieReviews(id),
          fetchRelatedMovies(id)
        ])

        if (!active) {
          return
        }

        setMovie(movieData)
        setCredits(creditsData)
        setReviews(reviewsData.results || [])
        setRelatedMovies(relatedData.results || [])
      } catch (error) {
        console.error(`Error fetching details: ${error}`)
        if (active) {
          setErrorMessage('Could not load movie details. Please try again.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadDetails()

    return () => {
      active = false
    }
  }, [id])

  if (isLoading) {
    return <Spinner />
  }

  if (errorMessage) {
    return <p className="status">{errorMessage}</p>
  }

  if (!movie) {
    return <p className="status">Movie not found.</p>
  }

  const backdrop = movie.backdrop_path
    ? `${BACKDROP_BASE_URL}${movie.backdrop_path}`
    : heroImg
  const poster = movie.poster_path
    ? `${IMAGE_BASE_URL}${movie.poster_path}`
    : noPoster
  const genres = movie.genres?.map((genre) => genre.name) || []
  const cast = credits?.cast?.slice(0, 6) || []

  return (
    <section className="detail">
      <div
        className="detail__hero"
        style={{ backgroundImage: `url(${backdrop})` }}
      >
        <div className="detail__overlay" />
        <div className="detail__content">
          <div className="detail__poster">
            <img src={poster} alt={movie.title} />
          </div>
          <div className="detail__info">
            <div className="detail__breadcrumbs">
              <Link to="/">Home</Link>
              <span>•</span>
              <span>{movie.title}</span>
            </div>
            <h2>{movie.title}</h2>
            <div className="detail__meta">
              <span>{getYear(movie.release_date)}</span>
              <span>•</span>
              <span>{formatRating(movie.vote_average)}</span>
              <span>•</span>
              <span>{movie.runtime ? `${movie.runtime} min` : 'Runtime N/A'}</span>
            </div>
            <p className="detail__overview">
              {movie.overview || 'Overview not available.'}
            </p>
            <div className="detail__genres">
              {genres.map((genre) => (
                <span key={genre}>{genre}</span>
              ))}
            </div>
            <div className="detail__actions">
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => navigate(`/watch/${movie.id}`)}
              >
                Watch Trailer
              </button>
              
              {isInWatchlist(movie.id) ? (
                <button
                  className="btn btn--ghost text-red-300 border-red-300/30 hover:border-red-400"
                  type="button"
                  onClick={() => removeFromWatchlist(movie.id)}
                >
                  Remove from Watchlist
                </button>
              ) : (
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => addToWatchlist(movie)}
                >
                  Add to Watchlist
                </button>
              )}
              
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => navigate('/')}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="detail__cast">
        <div className="row__header">
          <h2>Top Cast</h2>
        </div>
        <div className="detail__cast-list">
          {cast.length === 0 ? (
            <p className="search-results__empty">
              Cast list not available yet.
            </p>
          ) : (
            cast.map((member) => (
              <div className="detail__cast-card" key={member.id}>
                <img
                  src={
                    member.profile_path
                      ? `${IMAGE_BASE_URL}${member.profile_path}`
                      : noPoster
                  }
                  alt={member.name}
                />
                <div>
                  <p className="detail__cast-name">{member.name}</p>
                  <p className="detail__cast-role">
                    {member.character || 'Unknown role'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="detail__related mt-10">
        <div className="row__header">
          <h2>Related Movies</h2>
        </div>
        <div className="row__list-wrapper pb-6">
          <div className="row__list">
            {relatedMovies.length === 0 ? (
              <p className="search-results__empty">No related movies found.</p>
            ) : (
              relatedMovies.slice(0, 10).map((rm) => (
                <PosterCard 
                  key={rm.id} 
                  movie={rm} 
                  onSelect={() => navigate(`/movie/${rm.id}`)}
                  onPlay={(e) => {
                    navigate(`/watch/${rm.id}`)
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="detail__reviews mt-10">
        <div className="row__header">
          <h2>Reviews</h2>
        </div>
        <div className="detail__reviews-list mt-6 grid gap-4 lg:grid-cols-2">
          {reviews.length === 0 ? (
            <p className="search-results__empty">No reviews yet.</p>
          ) : (
            reviews.slice(0, 4).map(review => {
              let avatarUrl = review.author_details?.avatar_path;
              if (avatarUrl) {
                if (avatarUrl.startsWith('/https')) {
                  avatarUrl = avatarUrl.substring(1);
                } else {
                  avatarUrl = `${IMAGE_BASE_URL}${avatarUrl}`;
                }
              }

              return (
                <div key={review.id} className="review-card">
                  <div className="review-card__header">
                    <div className="review-card__avatar">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt={review.author} 
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="review-card__avatar-placeholder">
                          {review.author.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="review-card__meta">
                      <h4>{review.author}</h4>
                      {review.author_details?.rating && (
                        <span className="review-card__rating">★ {review.author_details.rating}</span>
                      )}
                    </div>
                  </div>
                  <div className="review-card__content line-clamp-4">
                    <p>{review.content}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

export default Detail
