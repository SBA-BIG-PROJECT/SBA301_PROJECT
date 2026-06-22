import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MovieCard from '../components/MovieCard.jsx'
import Spinner from '../components/Spinner.jsx'
import { translateGenre } from '../utils/genreTranslator.js'
import { movieService } from '../services'

const Genre = () => {
  const { id } = useParams()
  const genreId = Number(id)
  const [genreName, setGenreName] = useState('')
  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    if (!id || Number.isNaN(genreId)) {
      setErrorMessage('Invalid genre.')
      setIsLoading(false)
      setMovies([])
      return () => {
        active = false
      }
    }

    const loadGenre = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [genresData, moviesData] = await Promise.all([
          movieService.getGenres(),
          movieService.getByGenre(genreId)
        ])

        if (!active) {
          return
        }

        const allGenres = genresData || []
        const match = allGenres.find((genre) => genre.id === genreId)

        setGenreName(translateGenre(match?.name) || 'Genre')
        
        // Backend returns PageResponse<MovieDto> with content property
        setMovies(moviesData?.content || [])
      } catch (error) {
        console.error(`Error fetching genre: ${error}`)
        if (active) {
          setErrorMessage('Could not load this genre. Please try again.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadGenre()

    return () => {
      active = false
    }
  }, [id, genreId])

  return (
    <section className="search-results">
      <div className="row__header">
        <h2>{genreName ? `${genreName} Movies` : 'Genre'}</h2>
        <Link className="btn btn--ghost" to="/">
          Back to Home
        </Link>
      </div>

      {isLoading ? (
        <Spinner />
      ) : errorMessage ? (
        <p className="status">{errorMessage}</p>
      ) : movies.length === 0 ? (
        <p className="search-results__empty">
          No movies found for this genre yet.
        </p>
      ) : (
        <div className="search-results__grid">
          {movies.map((movie) => (
            <div className="movie-card__cell" key={movie.id}>
              <Link className="movie-card__link" to={`/movie/${movie.id}`}>
                <MovieCard movie={{
                  id: movie.id,
                  title: movie.title,
                  poster_path: movie.posterPath,
                  vote_average: movie.voteAverage,
                  release_date: movie.releaseDate
                }} />
              </Link>
              <div className="movie-card__actions">
                <Link className="btn btn--ghost" to={`/movie/${movie.id}`}>
                  View Details
                </Link>
                <Link className="btn btn--primary" to={`/watch/${movie.id}`}>
                  Trailer
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Genre
