import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { movieService, watchlistService, authService } from '../services'
import { useToast, ToastContainer } from '../components/Toast.jsx'
import { translateGenre } from '../utils/genreTranslator.js'
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

const getRating = (r) => (r != null && !isNaN(Number(r)) ? (Number(r) / 2).toFixed(1) : null)
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
const MovieCard = ({ movie, onNavigate, showToast }) => {
  const rating = getRating(movie.vote_average ?? movie.rating ?? movie.voteAverage)
  const year = getYear(movie.release_date ?? movie.releaseYear ?? movie.releaseDate)
  const poster = getPoster(movie.poster_path ?? movie.posterPath)
  const backdrop = getBackdrop(movie.backdrop_path ?? movie.backdropPath ?? movie.poster_path ?? movie.posterPath)

  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState(null);
  const cardRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const unhoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (unhoverTimeoutRef.current) clearTimeout(unhoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        let portalLeft = rect.left - 40;
        let portalWidth = rect.width + 80;
        
        if (portalLeft < 10) portalLeft = 10;
        if (portalLeft + portalWidth > window.innerWidth - 10) {
          portalLeft = window.innerWidth - portalWidth - 10;
        }

        setCoords({
          top: rect.top - 30,
          left: portalLeft,
          width: portalWidth,
        });
        setIsHovered(true);
      }
    }, 450);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    unhoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  // Close on scroll
  useEffect(() => {
    if (!isHovered) return;
    const handleScroll = () => setIsHovered(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHovered]);

  return (
    <>
      <div
        ref={cardRef}
        className="hm-card transition-opacity duration-300 w-full"
        style={{ opacity: isHovered ? 0 : 1 }}
        onClick={() => onNavigate(`/movie/${movie.id}`)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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

          {(movie.isPremium || movie.is_premium) && (
            <div style={{
              position: 'absolute',
              top: 8,
              left: 8,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              zIndex: 5,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 11, height: 11 }}>
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z"/>
              </svg>
              Premium
            </div>
          )}
        </div>
        <div className="hm-card__body">
          <h3 className="hm-card__title">{movie.title}</h3>
          <p className="hm-card__meta">{year || 'N/A'}</p>
        </div>
      </div>

      {isHovered && coords && createPortal(
        <div 
          className="fixed z-[999] bg-[#22242b] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-gray-700 overflow-hidden flex flex-col cursor-pointer"
          style={{
            top: coords.top,
            left: coords.left,
            width: coords.width,
            animation: 'zoomIn 0.2s ease-out'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => { e.stopPropagation(); onNavigate(`/movie/${movie.id}`); }}
        >
          {/* Backdrop Image */}
          <div className="relative w-full h-[150px] sm:h-[180px] bg-black">
            <img src={backdrop} alt={movie.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#22242b] via-[#22242b]/20 to-transparent" />
          </div>
          
          {/* Details */}
          <div className="p-4 flex flex-col gap-3">
            <div>
              <h3 className="text-lg font-bold text-white leading-tight mb-0.5 line-clamp-1">{movie.title}</h3>
              {movie.original_title && movie.original_title !== movie.title && (
                <p className="text-xs text-yellow-500 font-medium line-clamp-1">{movie.original_title}</p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                className="flex-[1.2] bg-[#facc15] hover:bg-yellow-400 text-black font-bold text-[13px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                onClick={(e) => { e.stopPropagation(); onNavigate(`/watch/${movie.id}`); }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Play
              </button>
              <button 
                className="flex-1 border border-gray-500 hover:border-gray-300 hover:bg-white/10 text-white font-medium text-[13px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                onClick={async (e) => { 
                  e.stopPropagation(); 
                  if (!authService.isAuthenticated()) {
                    showToast('warning', 'Please login to add to watchlist');
                    return;
                  }
                  try {
                    await watchlistService.addToWatchlist(movie.id);
                    showToast('success', 'Added to watchlist successfully!');
                  } catch (err) {
                    showToast('error', err.response?.data?.message || err.message || 'Error adding to watchlist');
                  }
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                Like
              </button>
              <button 
                className="flex-1 border border-gray-500 hover:border-gray-300 hover:bg-white/10 text-white font-medium text-[13px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                onClick={(e) => { e.stopPropagation(); onNavigate(`/movie/${movie.id}`); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                Info
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="border border-yellow-500 text-yellow-500 px-1.5 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 bg-yellow-500/10">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-yellow-400">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-white">{rating || 'N/A'}</span>
              </span>
              <span className="bg-white/10 text-white px-1.5 py-0.5 text-[10px] font-bold rounded">T16</span>
              <span className="bg-white/10 text-white px-1.5 py-0.5 text-[10px] font-bold rounded">{year || '2024'}</span>
              <span className="bg-white/10 text-white px-1.5 py-0.5 text-[10px] font-bold rounded">Full Episodes</span>
            </div>

            {/* Genres */}
            <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
              {movie.genres && movie.genres.length > 0 
                ? movie.genres.map(g => g.name || g).join(' • ')
                : 'Drama • Action'
              }
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
const Home = () => {
  const { toasts, showToast, closeToast } = useToast()
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [genreMovies, setGenreMovies] = useState({})
  const [heroMovies, setHeroMovies] = useState([])
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [heroLoaded, setHeroLoaded] = useState(false)
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
        setTotalPages(response.totalPages || 0)
        if (list.length > 0) setHeroMovies(list.slice(0, 5))

        const genresList = await movieService.getGenres()
        const topGenres = genresList.slice(0, 5).map(g => ({
          ...g,
          name: translateGenre(g.name?.replace(/^phim\s+/i, '').trim())
        }))
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

  const handlePageChange = async (page) => {
    if (page < 0 || page >= totalPages || page === currentPage) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await movieService.getMovies({ page, size: 20 });
      setMovies(response.content || []);
      setCurrentPage(page);
      setTotalPages(response.totalPages || 0);
      document.getElementById('all-movies-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error('[PageChange]', err);
      setErrorMessage('Failed to load page.');
    } finally {
      setIsLoading(false);
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
      <section className="relative w-screen ml-[calc(-50vw+50%)] h-[85vh] min-h-[600px] max-h-[850px] flex items-end mt-[-8rem] xs:mt-[-9rem] mb-12 overflow-hidden bg-[#030014]">
        {/* Backdrop */}
        <div
          key={heroBackdrop}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{ backgroundImage: `url(${heroBackdrop})` }}
        />
        {/* Gradients to blend text and bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-[#030014]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030014] via-[#030014]/80 to-transparent w-full md:w-3/4" />

        <div className="relative z-10 w-full max-w-[1800px] mx-auto px-5 xs:px-10 pb-16 flex flex-col gap-4">
          
          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-wide max-w-3xl leading-tight" style={{ textShadow: '2px 2px 10px rgba(0,0,0,0.8)', fontFamily: '"Bebas Neue", sans-serif' }}>
            {heroTitle}
          </h1>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="border border-yellow-500 text-yellow-500 px-2 py-0.5 text-xs font-bold rounded flex items-center gap-1 bg-yellow-500/10">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-yellow-400">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white">{heroRating || 'N/A'}</span>
            </span>
            <span className="border border-white/30 text-white px-2 py-0.5 text-xs font-bold rounded bg-white/5">T16</span>
            {heroYear && <span className="border border-white/30 text-white px-2 py-0.5 text-xs font-bold rounded bg-white/5">{heroYear}</span>}
            <span className="border border-white/30 text-white px-2 py-0.5 text-xs font-bold rounded bg-white/5">HD</span>
          </div>

          {/* Overview */}
          {heroOverview && (
            <p className="text-white/80 text-sm md:text-base leading-relaxed line-clamp-3 max-w-2xl mt-2 drop-shadow-md">
              {heroOverview}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-6">
            <button 
              className="w-14 h-14 bg-[#facc15] rounded-full flex items-center justify-center text-black hover:bg-yellow-400 hover:scale-110 transition-all shadow-[0_0_20px_rgba(250,204,21,0.4)]"
              onClick={() => heroMovie && navigate(`/watch/${heroMovie.id}`)}
              disabled={!heroMovie}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
            <button 
              className="w-12 h-12 border border-white/20 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all backdrop-blur-sm"
              disabled={!heroMovie}
              onClick={async () => {
                if (!heroMovie) return;
                if (!authService.isAuthenticated()) {
                  showToast('warning', 'Please login to add to watchlist');
                  return;
                }
                try {
                  await watchlistService.addToWatchlist(heroMovie.id);
                  showToast('success', 'Added to watchlist successfully!');
                } catch (err) {
                  showToast('error', err.response?.data?.message || err.message || 'Error adding to watchlist');
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
            <button 
              className="w-12 h-12 border border-white/20 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all backdrop-blur-sm"
              onClick={() => heroMovie && navigate(`/movie/${heroMovie.id}`)}
              disabled={!heroMovie}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
            </button>
          </div>
          
          {errorMessage && (
            <p className="text-red-400 text-sm mt-2">{errorMessage}</p>
          )}
        </div>

        {/* Thumbnails on the bottom right */}
        {heroMovies.length > 1 && (
          <div className="absolute bottom-8 right-5 xs:right-10 z-20 hidden lg:flex gap-3">
            {heroMovies.map((m, idx) => (
              <div 
                key={m.id}
                onClick={() => setActiveHeroIndex(idx)}
                className={`w-28 h-16 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 ${idx === activeHeroIndex ? 'border-yellow-500 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-10' : 'border-transparent hover:border-white/50 opacity-60 hover:opacity-100'}`}
              >
                <img src={getBackdrop(m.backdrop_path ?? m.poster_path ?? m.posterPath)} alt={m.title} className="w-full h-full object-cover" />
              </div>
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
                <div key={movie.id} className="snap-start shrink-0 w-[180px] sm:w-[220px] flex">
                  <MovieCard movie={movie} onNavigate={navigate} showToast={showToast} />
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {/* ── MOVIE GRID ────────────────────────────────────────────────── */}
      <section className="hm-section" id="all-movies-section">
        <div className="hm-section__header">
          <div className="hm-section__title-wrap">
            <div className="hm-section__accent" />
            <h2 className="hm-section__title">All Movies</h2>
          </div>
          {movies.length > 0 && (
            <span className="hm-section__count">{movies.length} movies</span>
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
              <MovieCard key={movie.id} movie={movie} onNavigate={navigate} showToast={showToast} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1E293B] text-white hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              &lt;
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = idx;
              } else if (currentPage <= 2) {
                pageNum = idx;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 5 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    pageNum === currentPage
                      ? 'bg-yellow-500 text-black font-bold'
                      : 'bg-[#1E293B] text-white hover:bg-yellow-500 hover:text-black font-medium'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1E293B] text-white hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              &gt;
            </button>
          </div>
        )}
      </section>

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  )
}

export default Home
