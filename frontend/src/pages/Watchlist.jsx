import { Link } from 'react-router-dom'
import { useWatchlist } from '../hooks/useWatchlist'
import MovieCard from '../components/MovieCard.jsx'

const Watchlist = () => {
  const { watchlist, removeFromWatchlist } = useWatchlist()

  return (
    <section className="search-results">
      <div className="row__header">
        <h2>My Watchlist</h2>
      </div>

      {watchlist.length === 0 ? (
        <div className="empty">
          <p className="search-results__empty">Your watchlist is empty.</p>
          <Link className="btn btn--primary mt-4" to="/">Explore Movies</Link>
        </div>
      ) : (
        <div className="search-results__grid">
          {watchlist.map((movie) => (
            <div className="movie-card__cell" key={movie.id}>
              <Link className="movie-card__link" to={`/movie/${movie.id}`}>
                <MovieCard movie={movie} />
              </Link>
              <div className="movie-card__actions">
                <Link className="btn btn--primary flex-1" to={`/watch/${movie.id}`}>
                  Watch
                </Link>
                <button
                  type="button"
                  className="btn btn--ghost flex-1 text-red-400 hover:text-red-300 hover:border-red-400/50"
                  onClick={() => removeFromWatchlist(movie.id)}
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

export default Watchlist
