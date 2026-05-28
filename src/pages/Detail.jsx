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
  formatRating,
  getYear
} from '../lib/tmdb'

const Detail = () => {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [credits, setCredits] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    const loadDetails = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [movieData, creditsData] = await Promise.all([
          fetchMovie(id),
          fetchMovieCredits(id)
        ])

        if (!active) {
          return
        }

        setMovie(movieData)
        setCredits(creditsData)
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
    </section>
  )
}

export default Detail
