import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QuickView from '../components/QuickView.jsx'
import Spinner from '../components/Spinner.jsx'
import PosterCard from '../components/PosterCard.jsx'
import heroImg from '../assets/hero-img.png'
import noPoster from '../assets/No-Poster.svg'
import { movieService } from '../services'

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280'

const Home = () => {
  const [movies, setMovies] = useState([])
  const [heroMovie, setHeroMovie] = useState(null)
  const [quickMovie, setQuickMovie] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    const loadMovies = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        // Gọi Backend API
        const response = await movieService.getMovies({
          page: 0,
          size: 20
        })

        if (!active) return

        const moviesList = response.content || []
        setMovies(moviesList)
        setHasMore(!response.last)
        
        // Set hero movie (first movie)
        if (moviesList.length > 0) {
          setHeroMovie(moviesList[0])
        }
      } catch (error) {
        console.error(`Error fetching movies: ${error}`)
        if (active) {
          setErrorMessage('Could not load movies. Please ensure backend is running.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadMovies()

    return () => {
      active = false
    }
  }, [])

  const loadMore = async () => {
    if (isLoading || !hasMore) return
    
    setIsLoading(true)
    try {
      const response = await movieService.getMovies({
        page: page + 1,
        size: 20
      })
      
      setMovies(prev => [...prev, ...(response.content || [])])
      setHasMore(!response.last)
      setPage(page + 1)
    } catch (error) {
      console.error('Error loading more:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const heroBackdrop = heroMovie?.posterPath
    ? `${BACKDROP_BASE_URL}${heroMovie.posterPath}`
    : heroImg
  const heroPoster = heroMovie?.posterPath
    ? `${IMAGE_BASE_URL}${heroMovie.posterPath}`
    : noPoster
  const heroTitle = heroMovie?.title || 'Welcome to SBA Movies'
  const heroOverview = heroMovie?.overview || 'Browse our collection of movies from the backend.'

  const handleQuickWatch = () => {
    if (!quickMovie) return
    navigate(`/watch/${quickMovie.id}`)
    setQuickMovie(null)
  }

  const handleQuickDetails = () => {
    if (!quickMovie) return
    navigate(`/movie/${quickMovie.id}`)
    setQuickMovie(null)
  }

  return (
    <section className="home">
      <section className="hero">
        <div
          className="hero__backdrop"
          style={{ backgroundImage: `url(${heroBackdrop})` }}
        />
        <div className="hero__overlay" />

        <div className="hero__content">
          <span className="hero__eyebrow">Featured</span>
          <h1 className="hero__title">{heroTitle}</h1>
          <p className="hero__subtitle">{heroOverview}</p>
          <div className="hero__meta">
            <span>{heroMovie?.releaseYear || 'N/A'}</span>
            {heroMovie?.rating && (
              <>
                <span>•</span>
                <span>★ {heroMovie.rating.toFixed(1)}</span>
              </>
            )}
          </div>
          <div className="hero__actions">
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => heroMovie && navigate(`/watch/${heroMovie.id}`)}
              disabled={!heroMovie}
            >
              Watch Trailer
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => heroMovie && navigate(`/movie/${heroMovie.id}`)}
              disabled={!heroMovie}
            >
              View Details
            </button>
          </div>
          {errorMessage && <p className="status">{errorMessage}</p>}
        </div>

        <div className="hero__poster">
          <img src={heroPoster} alt={heroTitle} />
        </div>
      </section>

      <section className="rows">
        {isLoading && movies.length === 0 ? (
          <Spinner />
        ) : (
          <div className="row">
            <div className="row__header">
              <h2>All Movies</h2>
              <span className="row__hint">Scroll</span>
            </div>
            <div className="row__list">
              {movies.map((movie) => (
                <PosterCard
                  key={movie.id}
                  movie={{
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.posterPath,
                    vote_average: movie.rating,
                    release_date: movie.releaseYear?.toString()
                  }}
                  onSelect={(selected) => setQuickMovie(movie)}
                  onPlay={(selected) => navigate(`/watch/${movie.id}`)}
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="row__footer">
                <button 
                  className="btn btn--ghost" 
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
        
        {!isLoading && movies.length === 0 && !errorMessage && (
          <div className="status">
            <p>No movies available. Please check if backend is running.</p>
          </div>
        )}
      </section>

      <QuickView
        movie={quickMovie ? {
          id: quickMovie.id,
          title: quickMovie.title,
          poster_path: quickMovie.posterPath,
          vote_average: quickMovie.rating,
          overview: quickMovie.overview,
          release_date: quickMovie.releaseYear?.toString()
        } : null}
        onClose={() => setQuickMovie(null)}
        onWatch={handleQuickWatch}
        onDetails={handleQuickDetails}
      />
    </section>
  )
}

export default Home
