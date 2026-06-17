import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Spinner from '../components/Spinner.jsx'
import heroImg from '../assets/hero-img.png'
import noPoster from '../assets/No-Poster.svg'
import { movieService } from '../services'
import { useWatchlist } from '../hooks/useWatchlist'
import PosterCard from '../components/PosterCard.jsx'

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280'

const Detail = () => {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [checkingWatchlist, setCheckingWatchlist] = useState(true)
  const [inWatchlist, setInWatchlist] = useState(false)
  const navigate = useNavigate()
  
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist()
  
  useEffect(() => {
    let active = true

    const loadDetails = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        // Gọi Backend API
        const movieData = await movieService.getMovieDetail(id)

        if (!active) return

        setMovie(movieData)
        
        // Check if in watchlist separately so it doesn't break movie loading if 403
        try {
          const inList = await isInWatchlist(id)
          setInWatchlist(inList)
        } catch (watchlistError) {
          console.warn('Watchlist check failed, possibly not logged in:', watchlistError)
          setInWatchlist(false)
        }
        setCheckingWatchlist(false)
      } catch (error) {
        console.error(`Error fetching details: ${error}`)
        if (active) {
          setErrorMessage('Could not load movie details. Please ensure backend is running.')
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
  }, [id, isInWatchlist])

  const handleWatchlistToggle = async () => {
    try {
      if (inWatchlist) {
        await removeFromWatchlist(parseInt(id))
        setInWatchlist(false)
      } else {
        await addToWatchlist(parseInt(id))
        setInWatchlist(true)
      }
    } catch (error) {
      console.error('Watchlist error:', error)
      alert('Failed to update watchlist. Please login first.')
    }
  }

  if (isLoading) {
    return <Spinner />
  }

  if (errorMessage) {
    return (
      <div className="container py-20">
        <p className="status">{errorMessage}</p>
        <button className="btn btn--primary mt-4" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="container py-20">
        <p className="status">Movie not found.</p>
        <button className="btn btn--primary mt-4" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    )
  }

  const backdrop = movie.posterPath
    ? `${BACKDROP_BASE_URL}${movie.posterPath}`
    : heroImg
  const poster = movie.posterPath
    ? `${IMAGE_BASE_URL}${movie.posterPath}`
    : noPoster

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
              <span>{movie.releaseYear || 'N/A'}</span>
              {movie.rating && (
                <>
                  <span>•</span>
                  <span>★ {movie.rating.toFixed(1)}</span>
                </>
              )}
              {movie.runtime && (
                <>
                  <span>•</span>
                  <span>{movie.runtime} min</span>
                </>
              )}
            </div>
            <p className="detail__overview">
              {movie.overview || 'Overview not available.'}
            </p>
            {movie.genres && movie.genres.length > 0 && (
              <div className="detail__genres">
                {movie.genres.map((genre) => {
                  const genreId = typeof genre === 'object' ? genre.id || genre.name : genre;
                  const genreName = typeof genre === 'object' ? genre.name : genre;
                  return <span key={genreId}>{genreName}</span>;
                })}
              </div>
            )}
            <div className="detail__actions">
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => navigate(`/watch/${movie.id}`)}
              >
                Watch Trailer
              </button>
              
              <button
                className="btn btn--ghost"
                type="button"
                onClick={handleWatchlistToggle}
                disabled={checkingWatchlist}
              >
                {checkingWatchlist ? 'Loading...' : 
                  inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
              </button>
              
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

      {/* Cast section - Backend chưa có endpoint này */}
      <div className="detail__cast">
        <div className="row__header">
          <h2>Top Cast</h2>
        </div>
        <div className="detail__cast-list">
          <p className="search-results__empty">
            Cast information coming soon (Backend endpoint needed)
          </p>
        </div>
      </div>

      {/* Related movies - Backend chưa có endpoint này */}
      <div className="detail__related mt-10">
        <div className="row__header">
          <h2>Related Movies</h2>
        </div>
        <div className="row__list-wrapper pb-6">
          <p className="search-results__empty">
            Related movies coming soon (Backend endpoint needed)
          </p>
        </div>
      </div>

      {/* Reviews - Backend có endpoint rồi, tạm thời hiển thị message */}
      <div className="detail__reviews mt-10">
        <div className="row__header">
          <h2>Reviews</h2>
        </div>
        <div className="detail__reviews-list mt-6 grid gap-4 lg:grid-cols-2">
          <p className="search-results__empty">
            Reviews feature coming soon (Use Review API)
          </p>
        </div>
      </div>
    </section>
  )
}

export default Detail
