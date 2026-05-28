import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Spinner from '../components/Spinner.jsx'
import { fetchMovie, fetchMovieVideos, getTrailerKey } from '../lib/tmdb'

const Watch = () => {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [trailerKey, setTrailerKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    const loadWatch = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [movieData, videoData] = await Promise.all([
          fetchMovie(id),
          fetchMovieVideos(id)
        ])

        if (!active) {
          return
        }

        setMovie(movieData)
        setTrailerKey(getTrailerKey(videoData.results || []))
      } catch (error) {
        console.error(`Error fetching trailer: ${error}`)
        if (active) {
          setErrorMessage('Could not load trailer. Please try again.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadWatch()

    return () => {
      active = false
    }
  }, [id])

  const embedUrl = trailerKey
    ? `https://www.youtube.com/embed/${trailerKey}`
    : ''

  return (
    <section className="watch">
      <div className="row__header">
        <h2>{movie?.title || 'Watch Trailer'}</h2>
        <Link className="nav__link" to={`/movie/${id}`}>
          Back to details
        </Link>
      </div>

      {isLoading ? (
        <Spinner />
      ) : errorMessage ? (
        <p className="status">{errorMessage}</p>
      ) : trailerKey ? (
        <div className="watch__player">
          <iframe
            className="watch__frame"
            src={embedUrl}
            title={movie?.title || 'Trailer'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="search-results__empty">
          Trailer not available for this title.
        </p>
      )}
    </section>
  )
}

export default Watch
