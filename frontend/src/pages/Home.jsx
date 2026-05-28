import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QuickView from '../components/QuickView.jsx'
import Spinner from '../components/Spinner.jsx'
import PosterCard from '../components/PosterCard.jsx'
import heroImg from '../assets/hero-img.png'
import noPoster from '../assets/No-Poster.svg'
import {
  BACKDROP_BASE_URL,
  IMAGE_BASE_URL,
  fetchGenreRows,
  fetchRows,
  formatRating,
  getYear
} from '../lib/tmdb'

const Home = () => {
  const [sections, setSections] = useState([])
  const [heroMovie, setHeroMovie] = useState(null)
  const [quickMovie, setQuickMovie] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    const loadRows = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [baseRows, genreRows] = await Promise.all([
          fetchRows(),
          fetchGenreRows()
        ])

        if (!active) {
          return
        }

        const trendingItems = baseRows.trending || []
        const nextSections = [
          {
            id: 'trending',
            title: 'Trending Now',
            items: trendingItems
          },
          ...genreRows
        ]

        setSections(nextSections)

        const spotlight =
          trendingItems[0] ||
          genreRows[0]?.items?.[0] ||
          baseRows.top_rated?.[0] ||
          baseRows.now_playing?.[0] ||
          null

        setHeroMovie(spotlight)
      } catch (error) {
        console.error(`Error fetching rows: ${error}`)
        if (active) {
          setErrorMessage('Could not load movies. Please try again.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadRows()

    return () => {
      active = false
    }
  }, [])

  const heroBackdrop = heroMovie?.backdrop_path
    ? `${BACKDROP_BASE_URL}${heroMovie.backdrop_path}`
    : heroImg
  const heroPoster = heroMovie?.poster_path
    ? `${IMAGE_BASE_URL}${heroMovie.poster_path}`
    : noPoster
  const heroTitle = heroMovie?.title || 'Find your next movie obsession'
  const heroOverview =
    heroMovie?.overview ||
    'Pick a spotlight title and jump straight into the trailer.'

  const handleQuickWatch = () => {
    if (!quickMovie) {
      return
    }

    navigate(`/watch/${quickMovie.id}`)
    setQuickMovie(null)
  }

  const handleQuickDetails = () => {
    if (!quickMovie) {
      return
    }

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
          <span className="hero__eyebrow">Spotlight</span>
          <h1 className="hero__title">{heroTitle}</h1>
          <p className="hero__subtitle">{heroOverview}</p>
          <div className="hero__meta">
            <span>{getYear(heroMovie?.release_date)}</span>
            <span>•</span>
            <span>{formatRating(heroMovie?.vote_average)}</span>
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
        {isLoading ? (
          <Spinner />
        ) : (
          sections.map((section) => (
            <div className="row" key={section.id}>
              <div className="row__header">
                <h2>{section.title}</h2>
                <span className="row__hint">Scroll</span>
              </div>
              <div className="row__list">
                {(section.items || []).map((movie) => (
                  <PosterCard
                    key={movie.id}
                    movie={movie}
                    onSelect={(selected) => setQuickMovie(selected)}
                    onPlay={(selected) =>
                      navigate(`/watch/${selected.id}`)
                    }
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <QuickView
        movie={quickMovie}
        onClose={() => setQuickMovie(null)}
        onWatch={handleQuickWatch}
        onDetails={handleQuickDetails}
      />
    </section>
  )
}

export default Home
