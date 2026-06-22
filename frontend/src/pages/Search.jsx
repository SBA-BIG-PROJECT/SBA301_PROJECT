import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Spinner from '../components/Spinner.jsx'
import MovieCard from '../components/MovieCard.jsx'
import { movieService } from '../services'

const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('query') || '').trim()
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

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
        // Call Backend API search
        const response = await movieService.searchMovies(query, 0, 20)
        
        if (!active) return

        setResults(response.content || [])
        setHasMore(!response.last)
        setPage(0)
      } catch (error) {
        console.error(`Error fetching search results: ${error}`)
        if (active) {
          setErrorMessage('Could not load search results. Please ensure backend is running.')
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

  const loadMore = async () => {
    if (isLoading || !hasMore || !query) return
    
    setIsLoading(true)
    try {
      const response = await movieService.searchMovies(query, page + 1, 20)
      
      setResults(prev => [...prev, ...(response.content || [])])
      setHasMore(!response.last)
      setPage(page + 1)
    } catch (error) {
      console.error('Error loading more:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="search-results">
      <div className="row__header">
        <h2>Results for "{query || '...'}"</h2>
      </div>

      {isLoading && results.length === 0 ? (
        <Spinner />
      ) : errorMessage ? (
        <p className="status">{errorMessage}</p>
      ) : results.length === 0 ? (
        <p className="search-results__empty">
          {query ? 'No results found. Try another title.' : 'Enter a search query.'}
        </p>
      ) : (
        <>
          <div className="search-results__grid">
            {results.map((movie) => (
              <div className="movie-card__cell" key={movie.id}>
                <Link
                  className="movie-card__link"
                  to={`/movie/${movie.id}`}
                >
                  <MovieCard movie={{
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.posterPath,
                    vote_average: movie.voteAverage,
                    release_date: movie.releaseDate,
                    overview: movie.overview
                  }} />
                </Link>
                <div className="movie-card__actions">
                  <Link className="btn btn--ghost" to={`/movie/${movie.id}`}>
                    Details
                  </Link>
                  <Link className="btn btn--primary" to={`/watch/${movie.id}`}>
                    Watch Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="row__footer mt-8">
              <button 
                className="btn btn--ghost" 
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default SearchPage
