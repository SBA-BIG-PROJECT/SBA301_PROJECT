import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Spinner from '../components/Spinner.jsx'
import heroImg from '../assets/hero-img.png'
import noPoster from '../assets/No-Poster.svg'
import { movieService, reviewService } from '../services'
import { useWatchlist } from '../hooks/useWatchlist'
import PosterCard from '../components/PosterCard.jsx'
import { useToast, ToastContainer } from '../components/Toast.jsx'
import { translateGenre } from '../utils/genreTranslator.js'

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280'

const Detail = () => {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [checkingWatchlist, setCheckingWatchlist] = useState(true)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)
  const [trailerEmbedUrl, setTrailerEmbedUrl] = useState('')
  const [relatedMovies, setRelatedMovies] = useState([])
  const [reviews, setReviews] = useState([])
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toasts, showToast, closeToast } = useToast()
  
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist()
  
  // Review states
  const [newComment, setNewComment] = useState('')
  const [newRating, setNewRating] = useState(5.0)
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const extractVideoID = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };
  
  useEffect(() => {
    window.scrollTo(0, 0);
    let active = true

    const loadDetails = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        // Call Backend API
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
        if (active) setCheckingWatchlist(false)

        if (movieData.genres && movieData.genres.length > 0) {
          try {
            const genreId = typeof movieData.genres[0] === 'object' ? movieData.genres[0].id : movieData.genres[0];
            const related = await movieService.getByGenre(genreId, { page: 0, size: 8 });
            if (active) setRelatedMovies((related.content || []).filter(m => m.id !== parseInt(id)));
          } catch (e) {
            console.error('Failed to load related movies', e);
          }
        }
        
        try {
          const revs = await movieService.getReviews(id, { page: 0, size: 10 });
          if (active) setReviews(revs.content || []);
        } catch (e) {
          console.error('Failed to load reviews', e);
        }

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

  }, [id, isInWatchlist])

  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        showToast('Developer tools are disabled on this page.', 'warning');
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showToast]);

  const handleWatchTrailer = async () => {
    if (trailerEmbedUrl) {
      setShowTrailer(true)
      return
    }
    
    if (!movie?.playToken) {
      showToast('Trailer not available or premium content.', 'error')
      return
    }
    
    try {
      const url = await movieService.resolvePlayToken(movie.playToken)
      setTrailerEmbedUrl(url)
      setShowTrailer(true)
    } catch (e) {
      console.error('Failed to resolve trailer URL', e)
      showToast('Failed to load trailer. Please try again.', 'error')
    }
  }

  const handleWatchlistToggle = async () => {
    try {
      if (inWatchlist) {
        await removeFromWatchlist(parseInt(id))
        setInWatchlist(false)
        showToast('success', 'Removed from watchlist')
      } else {
        await addToWatchlist(parseInt(id))
        setInWatchlist(true)
        showToast('success', 'Added to watchlist')
      }
    } catch (error) {
      console.error('Watchlist error:', error)
      showToast('error', 'Failed to update watchlist. Please login first.')
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    setSubmitting(true)
    try {
      const review = await reviewService.createReview(id, {
        rating: newRating * 2,
        comment: newComment
      })
      setReviews(prev => [review, ...prev])
      setNewComment('')
      setNewRating(5.0)
      setNewRating(5.0)
      showToast('success', 'Review posted successfully!')
    } catch (error) {
      console.error('Failed to create review', error)
      showToast('error', error.response?.data?.message || 'Failed to post review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleScrollToReview = () => {
    const reviewSection = document.getElementById('review-section');
    if (reviewSection) {
      reviewSection.scrollIntoView({ behavior: 'smooth' });
      // Focus the textarea if it exists
      const textarea = reviewSection.querySelector('textarea');
      if (textarea) {
        setTimeout(() => textarea.focus(), 500);
      }
    }
  };

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
    ? (movie.posterPath.startsWith('http') ? movie.posterPath : `${BACKDROP_BASE_URL}${movie.posterPath}`)
    : heroImg
  const poster = movie.posterPath
    ? (movie.posterPath.startsWith('http') ? movie.posterPath : `${IMAGE_BASE_URL}${movie.posterPath}`)
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
            <h2>
              {movie.title}
              {movie.requiresPremium && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: '12px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  verticalAlign: 'middle',
                  boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
                }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z"/>
                  </svg>
                  Premium
                </span>
              )}
            </h2>
            <div className="detail__meta">
              <span>{movie.releaseYear || (movie.releaseDate ? movie.releaseDate.substring(0, 4) : 'N/A')}</span>
              {movie.rating && (
                <>
                  <span>•</span>
                  <span>★ {(movie.rating / 2).toFixed(1)}</span>
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
                {movie.genres.map((g) => {
                  const genreId = typeof g === 'object' ? g.id : g
                  const genreName = typeof g === 'object' ? g.name : 'Unknown Genre'
                  return <span key={genreId}>{translateGenre(genreName)}</span>;
                })}
              </div>
            )}
            <div className="detail__actions">
              {movie.isLocked && movie.requiresPremium ? (
                <button
                  className="btn btn--primary flex items-center gap-2 text-sm"
                  type="button"
                  onClick={() => navigate('/payment')}
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z"/></svg>
                  Upgrade to Premium
                </button>
              ) : movie.isLocked ? (
                <button
                  className="btn btn--primary flex items-center gap-2 bg-gray-500 cursor-not-allowed text-sm"
                  type="button"
                  disabled
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  Available {new Date(movie.releaseDate).toLocaleString('en-US')}
                </button>
              ) : (
                <button
                  className="btn btn--primary flex items-center gap-2 bg-red-600 hover:bg-red-700"
                  type="button"
                  onClick={() => navigate(`/watch/${movie.id}`)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Watch Now
                </button>
              )}

              <button
                className="btn btn--secondary flex items-center gap-2 bg-gray-600 hover:bg-gray-700 bg-opacity-70"
                type="button"
                onClick={handleWatchTrailer}
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
                onClick={handleScrollToReview}
              >
                Rate Movie
              </button>
            </div>
          </div>
        </div>
      </div>

      {showTrailer && trailerEmbedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            <button 
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
              onClick={() => setShowTrailer(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <iframe
              className="w-full h-full"
              src={trailerEmbedUrl ? `${trailerEmbedUrl}${trailerEmbedUrl.includes('?') ? '&' : '?'}origin=${window.location.origin}` : ''}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation"
            ></iframe>
          </div>
        </div>
      )}

      {/* Cast section */}
      <div className="detail__cast">
        <div className="row__header">
          <h2>Top Cast</h2>
        </div>
        {movie.cast && movie.cast.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x w-full mt-6">
            {movie.cast.slice(0, 12).map(actor => (
              <div key={actor.personId || actor.id} className="detail__cast-card snap-start shrink-0 w-[220px]">
                {actor.profilePath ? (
                  <img src={actor.profilePath.startsWith('http') ? actor.profilePath : `${IMAGE_BASE_URL}${actor.profilePath}`} alt={actor.name} />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-gray-400">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </div>
                )}
                <div>
                  <p className="detail__cast-name line-clamp-1">{actor.name}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="search-results__empty">No cast information available.</p>
        )}
      </div>

      {/* Related movies */}
      <div className="detail__related mt-10">
        <div className="row__header">
          <h2>Related Movies</h2>
        </div>
        {relatedMovies.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-x w-full">
            {relatedMovies.map(relMovie => (
              <div 
                key={relMovie.id} 
                className="snap-start shrink-0 w-[160px] sm:w-[180px] hm-card cursor-pointer"
                onClick={() => navigate(`/movie/${relMovie.id}`)}
              >
                <div className="hm-card__poster-wrap">
                  <img 
                    className="hm-card__poster" 
                    src={relMovie.posterPath ? (relMovie.posterPath.startsWith('http') ? relMovie.posterPath : `${IMAGE_BASE_URL}${relMovie.posterPath}`) : noPoster} 
                    alt={relMovie.title} 
                  />
                  <div className="hm-card__overlay">
                    <button className="hm-card__info-btn">Details</button>
                  </div>
                </div>
                <div className="hm-card__body">
                  <h3 className="hm-card__title text-sm">{relMovie.title}</h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="search-results__empty">No related movies found.</p>
        )}
      </div>

      {/* Reviews */}
      <div id="review-section" className="detail__reviews mt-10">
        <div className="row__header mb-6">
          <h2>Reviews</h2>
        </div>
        
        {!user ? (
          <div className="mb-8">
            <Link to="/login" className="inline-flex items-center gap-2 bg-[#242730] hover:bg-[#2a2d36] text-gray-300 px-6 py-3 rounded-lg text-sm font-medium transition-colors">
              <span>➜</span> Login to review
            </Link>
          </div>
        ) : (
          <form 
            className="mb-8 flex flex-col gap-3 bg-dark-100/50 p-6 rounded-2xl border border-white/5"
            onSubmit={handleCommentSubmit}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-400">Your Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <svg 
                      className={`w-6 h-6 ${star <= (hoverRating || newRating) ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-gray-600'} transition-all`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative mt-2">
              <textarea 
                className="w-full bg-[#15161b] border border-white/10 rounded-xl p-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-red-500/50 resize-none min-h-[100px] text-sm transition-colors"
                placeholder="Write your review..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={1000}
              />
              <button 
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-medium text-sm disabled:opacity-50 transition-colors shadow-lg"
              >
                {submitting ? 'Posting...' : 'Post Review'}
              </button>
            </div>
          </form>
        )}

        {reviews.length > 0 ? (
          <div className="detail__reviews-list grid gap-4 lg:grid-cols-2">
            {reviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-card__header">
                  <div className="review-card__avatar">
                    <div className="review-card__avatar-placeholder">
                      {review.userName ? review.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>
                  <div className="review-card__meta">
                    <h4>{review.userName || 'Anonymous'}</h4>
                    <div className="review-card__rating">
                      ★ {(review.rating / 2).toFixed(1)} / 5
                    </div>
                  </div>
                </div>
                <p className="review-card__content">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="search-results__empty">No reviews yet. Be the first to review!</p>
        )}
      </div>

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </section>
  )
}

export default Detail
