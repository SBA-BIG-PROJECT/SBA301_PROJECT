import { useEffect, useRef, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams
} from 'react-router-dom'
import { useDebounce } from 'react-use'
import Search from './Search.jsx'
import logo from '../assets/logo.svg'
import { fetchGenres } from '../lib/tmdb'

const Header = () => {
  const menuItems = [
    { id: 'topics', label: 'Topics' },
    { id: 'genres', label: 'Genres' },
    { id: 'movies', label: 'Movies' },
    { id: 'series', label: 'Series' }
  ]
  const [genres, setGenres] = useState([])
  const [genresError, setGenresError] = useState('')
  const [genresOpen, setGenresOpen] = useState(false)
  const [mobileGenresOpen, setMobileGenresOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('query') || ''
  )
  const [debounced, setDebounced] = useState(searchTerm)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleRef = useRef(null)
  const panelRef = useRef(null)
  const genresButtonRef = useRef(null)
  const genresPanelRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let active = true

    const loadGenres = async () => {
      setGenresError('')

      try {
        const data = await fetchGenres()
        if (!active) {
          return
        }

        const sorted = (data?.genres || []).slice().sort((a, b) =>
          a.name.localeCompare(b.name)
        )
        setGenres(sorted)
      } catch (error) {
        console.error(`Error fetching genres: ${error}`)
        if (active) {
          setGenresError('Could not load genres.')
        }
      }
    }

    loadGenres()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const query = searchParams.get('query') || ''
    setSearchTerm(query)
  }, [searchParams])

  useDebounce(() => setDebounced(searchTerm), 400, [searchTerm])

  useEffect(() => {
    const trimmed = debounced.trim()

    if (!trimmed) {
      if (location.pathname.startsWith('/search')) {
        navigate('/', { replace: true })
      }
      return
    }

    navigate(`/search?query=${encodeURIComponent(trimmed)}`, { replace: true })
  }, [debounced, navigate])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  // lock body scroll and manage focus when panel opens
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.activeElement
      document.body.style.overflow = 'hidden'
      // focus first focusable inside panel
      requestAnimationFrame(() => {
        const first = panelRef.current?.querySelector('button, a, [tabindex]')
        if (first) first.focus()
      })
      return () => {
        document.body.style.overflow = ''
        if (prev && prev instanceof HTMLElement) prev.focus()
      }
    }
    return undefined
  }, [mobileOpen])

  useEffect(() => {
    if (!genresOpen) {
      return
    }

    const handleClick = (event) => {
      const target = event.target
      if (
        genresPanelRef.current?.contains(target) ||
        genresButtonRef.current?.contains(target)
      ) {
        return
      }

      setGenresOpen(false)
    }

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setGenresOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [genresOpen])

  useEffect(() => {
    if (mobileOpen) {
      setGenresOpen(false)
    }
  }, [mobileOpen])

  // close mobile panel on navigation
  useEffect(() => {
    setMobileOpen(false)
    setGenresOpen(false)
    setMobileGenresOpen(false)
  }, [location.pathname])

  const handleGenreSelect = (genreId) => {
    setGenresOpen(false)
    setMobileOpen(false)
    setMobileGenresOpen(false)
    navigate(`/genre/${genreId}`)
  }

  return (
    <header
      className={`site-header ${isScrolled ? 'site-header--scrolled' : ''}`.trim()}
    >
      <nav className="nav">
        <div className="nav__left">
          <Link className="nav__brand" to="/">
            <img src={logo} alt="SBA Movies" />
            <span>SBA Movies</span>
          </Link>
        </div>

        <div className="nav__center">
          <Search
            className="nav__search"
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Search movies, actors"
          />
          <div className="nav__menu" role="list">
            {menuItems.map((item) => {
              if (item.id === 'genres') {
                return (
                  <div className="nav__menu-item--dropdown" key={item.id}>
                    <button
                      className="nav__menu-trigger"
                      type="button"
                      aria-expanded={genresOpen}
                      aria-controls="genres-panel"
                      onClick={() => setGenresOpen((value) => !value)}
                      ref={genresButtonRef}
                    >
                      {item.label}
                      <svg
                        viewBox="0 0 20 20"
                        className="nav__menu-caret"
                        aria-hidden
                      >
                        <path
                          d="M5.5 7.5 10 12l4.5-4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {genresOpen && (
                      <div
                        className="nav__genres-panel"
                        id="genres-panel"
                        ref={genresPanelRef}
                        role="listbox"
                      >
                        {genres.length === 0 ? (
                          <p className="nav__genres-status">
                            {genresError || 'Loading genres...'}
                          </p>
                        ) : (
                          <div className="nav__genres-grid">
                            {genres.map((genre) => (
                              <button
                                className="nav__genres-item"
                                key={genre.id}
                                type="button"
                                onClick={() => handleGenreSelect(genre.id)}
                              >
                                {genre.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <button
                  className="nav__menu-item"
                  type="button"
                  key={item.id}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="nav__right">
          <button
            className="nav__mobile-toggle"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            ref={toggleRef}
            type="button"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              {mobileOpen ? (
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>

          <Link className="nav__member" to="/login">
            <span className="nav__member-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img">
                <path
                  d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-3.866 0-7 3.134-7 7h2c0-2.757 2.243-5 5-5s5 2.243 5 5h2c0-3.866-3.134-7-7-7Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            Member
          </Link>
        </div>
      </nav>

      {mobileOpen && (
        <div className="nav__mobile-panel" role="dialog" aria-modal="true">
          <div className="nav__mobile-scrim" onClick={() => setMobileOpen(false)} />
          <div className="nav__mobile-body" ref={panelRef}>
            <div className="nav__mobile-list">
              {menuItems.map((item) => {
                if (item.id === 'genres') {
                  return (
                    <div className="nav__mobile-section" key={item.id}>
                      <button
                        className="nav__mobile-item"
                        type="button"
                        aria-expanded={mobileGenresOpen}
                        onClick={() =>
                          setMobileGenresOpen((value) => !value)
                        }
                      >
                        {item.label}
                      </button>
                      {mobileGenresOpen && (
                        <div className="nav__mobile-genres">
                          {genres.length === 0 ? (
                            <p className="nav__genres-status">
                              {genresError || 'Loading genres...'}
                            </p>
                          ) : (
                            <div className="nav__mobile-genres-grid">
                              {genres.map((genre) => (
                                <button
                                  className="nav__mobile-genre-item"
                                  key={genre.id}
                                  type="button"
                                  onClick={() => handleGenreSelect(genre.id)}
                                >
                                  {genre.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <button
                    className="nav__mobile-item"
                    key={item.id}
                    type="button"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
