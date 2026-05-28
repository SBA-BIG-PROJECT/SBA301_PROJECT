import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Spinner from '../components/Spinner.jsx'
import MovieCard from '../components/MovieCard.jsx'
import { searchMovies } from '../lib/tmdb'

const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('query') || '').trim()
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    if (!query) {
      setResults([])
      setIsLoading(false)
      setErrorMessage('')
      return
    }

    const loadResults = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const data = await searchMovies(query)
        if (!active) {
          return
        }

        setResults(data.results || [])
      } catch (error) {
        console.error(`Error fetching search results: ${error}`)
        if (active) {
          setErrorMessage('Could not load search results. Please try again.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadResults()

    return () => {
      active = false
    }
  }, [query])

  return (
    <section className="search-results">
      <div className="row__header">
        <h2>Results for "{query || '...'}"</h2>
      </div>

      {isLoading ? (
        <Spinner />
      ) : errorMessage ? (
        <p className="status">{errorMessage}</p>
      ) : results.length === 0 ? (
        <p className="search-results__empty">
          No results yet. Try another title.
        </p>
      ) : (
        <div className="search-results__grid">
          {results.map((movie) => (
            <div className="movie-card__cell" key={movie.id}>
              <Link
                className="movie-card__link"
                to={`/movie/${movie.id}`}
              >
                <MovieCard movie={movie} />
              </Link>
              <div className="movie-card__actions">
                <Link className="btn btn--ghost" to={`/movie/${movie.id}`}>
                  Chi tiet
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

export default SearchPage
