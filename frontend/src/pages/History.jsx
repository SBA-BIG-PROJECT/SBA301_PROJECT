import { Link } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import MovieCard from '../components/MovieCard.jsx'
import Spinner from '../components/Spinner.jsx'

const History = () => {
  const { history, loading, error, removeFromHistory, clearHistory } = useHistory()

  return (
    <section className="search-results">
      <div className="row__header">
        <h2>Watch History</h2>
        {history.length > 0 && (
          <button
            type="button"
            className="text-sm text-light-200 hover:text-red-400 transition"
            onClick={clearHistory}
          >
            Clear History
          </button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="empty">
          <p className="search-results__empty text-red-400">Cannot load history. Please try again.</p>
        </div>
      ) : history.length === 0 ? (
        <div className="empty">
          <p className="search-results__empty">You haven't watched any movies yet.</p>
          <Link className="btn btn--primary mt-4" to="/">Start Watching</Link>
        </div>
      ) : (
        <div className="search-results__grid">
          {history.map((movie) => (
            <div className="movie-card__cell" key={movie.viewId ?? movie.id}>
              <Link className="movie-card__link" to={`/movie/${movie.id}`}>
                <MovieCard movie={movie} />
              </Link>
              <p className="text-xs text-light-200 text-center">
                Watched: {movie.watchedAt ? new Date(movie.watchedAt).toLocaleDateString('en-US') : '—'}
              </p>
              <div className="movie-card__actions">
                <Link className="btn btn--primary flex-1" to={`/watch/${movie.id}`}>
                  Watch Again
                </Link>
                <button
                  type="button"
                  className="btn btn--ghost flex-1"
                  onClick={() => removeFromHistory(movie.movieId ?? movie.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default History
