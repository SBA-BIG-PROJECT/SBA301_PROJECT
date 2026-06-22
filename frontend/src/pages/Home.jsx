import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { movieService } from '../services'
import noPoster from '../assets/No-Poster.svg'
import heroImg from '../assets/hero-img.png'

const IMG_W500 = 'https://image.tmdb.org/t/p/w500'
const IMG_W1280 = 'https://image.tmdb.org/t/p/w1280'

const getPoster = (path) =>
  path
    ? path.startsWith('http') ? path : `${IMG_W500}${path.startsWith('/') ? '' : '/'}${path}`
    : noPoster

const getBackdrop = (path) =>
  path
    ? path.startsWith('http') ? path : `${IMG_W1280}${path.startsWith('/') ? '' : '/'}${path}`
    : heroImg

const getRating = (r) => (r != null && !isNaN(Number(r)) ? Number(r).toFixed(1) : null)
const getYear = (y) => y ? String(y).split('-')[0] : null

// ── Skeleton card ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="hm-card hm-card--skeleton">
    <div className="hm-card__poster hm-skeleton" />
    <div className="hm-card__body">
      <div className="hm-skeleton hm-skeleton--text" style={{ width: '80%' }} />
      <div className="hm-skeleton hm-skeleton--text" style={{ width: '50%', marginTop: 6 }} />
    </div>
  </div>
)

// ── Movie Card ─────────────────────────────────────────────────────────────
const MovieCard = ({ movie, onNavigate }) => {
  const rating = getRating(movie.vote_average ?? movie.rating ?? movie.voteAverage)
  const year = getYear(movie.release_date ?? movie.releaseYear ?? movie.releaseDate)
  const poster = getPoster(movie.poster_path ?? movie.posterPath)

  return (
    <div
      className="hm-card"
      onClick={() => onNavigate(`/movie/${movie.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate(`/movie/${movie.id}`)}
    >
      <div className="hm-card__poster-wrap">
        <img
          className="hm-card__poster"
          src={poster}
          alt={movie.title}
          loading="lazy"
        />

        {rating && (
          <div className="hm-card__badge">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-yellow-400">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {rating}
          </div>
        )}
      </div>
      <div className="hm-card__body">
        <h3 className="hm-card__title">{movie.title}</h3>
        <p className="hm-card__meta">{year || 'N/A'}</p>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
const Home = () => {
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [genreMovies, setGenreMovies] = useState({})
  const [heroMovies, setHeroMovies] = useState([])
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [loadMoreLoading, setLoadMoreLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loadMoreError, setLoadMoreError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [heroLoaded, setHeroLoaded] = useState(false)
  const currentPage = useRef(0)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    const load = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const response = await movieService.getMovies({ page: 0, size: 20 })
        if (!active) return
        const list = response.content || []
        setMovies(list)
        setHasMore(!response.last)
        if (list.length > 0) setHeroMovies(list.slice(0, 5))

        const genresList = await movieService.getGenres()
        const topGenres = genresList.slice(0, 5)
        if (active) setGenres(topGenres)

        const gMovies = {}
        await Promise.all(topGenres.map(async (g) => {
          try {
            const res = await movieService.getByGenre(g.id, { page: 0, size: 10 })
            gMovies[g.id] = res.content || []
          } catch (e) {
            console.error('Failed to load genre', g.name, e)
          }
        }))
        if (active) setGenreMovies(gMovies)

      } catch (err) {
        console.error(err)
        if (active) setErrorMessage('Cannot load movies. Please ensure backend is running.')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (heroMovies.length <= 1) return;
    const timer = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, 6000); // Auto slide every 6 seconds
    return () => clearInterval(timer);
  }, [heroMovies.length]);

  const loadMore = async () => {
    if (loadMoreLoading || !hasMore) return
    const nextPage = currentPage.current + 1
    setLoadMoreLoading(true)
    setLoadMoreError('')
    try {
      const response = await movieService.getMovies({ page: nextPage, size: 20 })
      const newMovies = response.content || []
      if (newMovies.length === 0) {
        setHasMore(false)
        setLoadMoreError('All movies displayed.')
      } else {
        setMovies(prev => [...prev, ...newMovies])
        setHasMore(!response.last)
        currentPage.current = nextPage
      }
    } catch (err) {
      console.error('[LoadMore]', err)
      setLoadMoreError('Failed to load. Please try again.')
    } finally {
      setLoadMoreLoading(false)
    }
  }

  const heroMovie = heroMovies[activeHeroIndex] || null;
  const heroBackdrop = getBackdrop(heroMovie?.poster_path ?? heroMovie?.posterPath)
  const heroPoster = getPoster(heroMovie?.poster_path ?? heroMovie?.posterPath)
  const heroTitle = heroMovie?.title || 'Welcome to SBA Movies'
  const heroOverview = heroMovie?.overview || 'Explore our extensive movie collection.'
  const heroRating = getRating(heroMovie?.vote_average ?? heroMovie?.rating ?? heroMovie?.voteAverage)
  const heroYear = getYear(heroMovie?.release_date ?? heroMovie?.releaseYear ?? heroMovie?.releaseDate)

  return (
    <div className="hm-page">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="hm-hero relative">
        {/* We use key to force re-render/animation when backdrop changes */}
        <div
          key={heroBackdrop}
          className="hm-hero__backdrop"
          style={{ backgroundImage: `url(${heroBackdrop})`, transition: 'background-image 1s ease-in-out' }}
        />
        <div className="hm-hero__gradient" />

        <div className="hm-hero__content">
          <span className="hm-hero__tag">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Today's Recommendations
          </span>

          <h1 className="hm-hero__title">{heroTitle}</h1>

          {heroOverview && (
            <p className="hm-hero__overview">{heroOverview}</p>
          )}

          <div className="hm-hero__meta">
            {heroYear && <span>{heroYear}</span>}
            {heroRating && (
              <>
                <span className="hm-hero__dot" />
                <span className="hm-hero__rating">
                  ★ {heroRating}
                </span>
              </>
            )}
          </div>

          <div className="hm-hero__actions">
            <button
              className="hm-btn hm-btn--primary"
              type="button"
              onClick={() => heroMovie && navigate(`/watch/${heroMovie.id}`)}
              disabled={!heroMovie}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Xem phim
            </button>
            <button
              className="hm-btn hm-btn--ghost"
              type="button"
              onClick={() => heroMovie && navigate(`/movie/${heroMovie.id}`)}
              disabled={!heroMovie}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Details
            </button>
          </div>

          {errorMessage && (
            <p className="hm-hero__error">{errorMessage}</p>
          )}
        </div>

        <div className="hm-hero__poster-wrap">
          <img
            key={heroPoster}
            className={`hm-hero__poster ${heroLoaded ? 'hm-hero__poster--loaded' : ''}`}
            src={heroPoster}
            alt={heroTitle}
            onLoad={() => setHeroLoaded(true)}
            style={{ animation: 'zoomIn 0.5s ease-out' }}
          />
        </div>
        
        {/* Navigation Dots */}
        {heroMovies.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {heroMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveHeroIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${idx === activeHeroIndex ? 'w-8 bg-red-500' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── GENRE ROWS ────────────────────────────────────────────────── */}
      {genres.map(genre => {
        const rowMovies = genreMovies[genre.id] || []
        if (rowMovies.length === 0) return null
        return (
          <section key={genre.id} className="hm-section" style={{ paddingBottom: '0' }}>
            <div className="hm-section__header">
              <div className="hm-section__title-wrap">
                <div className="hm-section__accent" />
                <h2 className="hm-section__title">{genre.name}</h2>
              </div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-x w-full" style={{ scrollBehavior: 'smooth' }}>
              {rowMovies.map((movie) => (
                <div key={movie.id} className="snap-start shrink-0 w-[180px] sm:w-[220px]">
                  <MovieCard movie={movie} onNavigate={navigate} />
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {/* ── MOVIE GRID ────────────────────────────────────────────────── */}
      <section className="hm-section">
        <div className="hm-section__header">
          <div className="hm-section__title-wrap">
            <div className="hm-section__accent" />
            <h2 className="hm-section__title">All Movies</h2>
          </div>
          {movies.length > 0 && (
            <span className="hm-section__count">{movies.length} phim</span>
          )}
        </div>

        {isLoading && movies.length === 0 ? (
          <div className="hm-grid">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : movies.length === 0 && !errorMessage ? (
          <div className="hm-empty">
            <div className="hm-empty__icon">🎬</div>
            <p className="hm-empty__text">No movies available. Check backend connection.</p>
          </div>
        ) : (
          <div className="hm-grid">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onNavigate={navigate} />
            ))}
            {loadMoreLoading &&
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)
            }
          </div>
        )}

        {loadMoreError && (
          <p className="hm-load-msg">{loadMoreError}</p>
        )}

        {hasMore && !isLoading && (
          <div className="hm-load-more">
            <button
              className="hm-load-more__btn"
              onClick={loadMore}
              disabled={loadMoreLoading}
            >
              {loadMoreLoading ? (
                <span className="hm-load-more__spinner" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  Load more movies
                </>
              )}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default Home
