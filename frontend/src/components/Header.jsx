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
import { useNotifications } from '../hooks/useNotifications'
const Header = () => {
  const menuItems = [
    { id: 'genres', label: 'Genres' },
    { id: 'movies', label: 'Movies' },
    { id: 'series', label: 'Series' }
  ]
  const [genres, setGenres] = useState([])
  const [genresError, setGenresError] = useState('')
  const [genresOpen, setGenresOpen] = useState(false)
  const [mobileGenresOpen, setMobileGenresOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  
  const { notifications, unreadCount, markAllAsRead } = useNotifications()
  
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
    setNotificationsOpen(false)
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
          
          <div className="nav__menu hidden lg:flex" role="list">
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

        <div className="nav__center">
          <Search
            className="nav__search"
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Search movies, actors"
          />
        </div>

        <div className="nav__right">
          <div className="nav__action-island hidden sm:flex">
            {/* History Icon */}
            <Link className="nav__action-btn" to="/history" aria-label="History" title="History">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </Link>

            {/* Watchlist Icon */}
            <Link className="nav__action-btn" to="/watchlist" aria-label="Watchlist" title="Watchlist">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </Link>

            {/* Notifications Dropdown */}
            <div className="relative flex">
              <button 
                className="nav__action-btn"
                aria-label="Notifications"
                title="Notifications"
                onClick={() => setNotificationsOpen(v => !v)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="nav__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              
              {notificationsOpen && (
                <div className="nav__notifications-panel">
                  <div className="nav__notifications-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button type="button" onClick={markAllAsRead}>Mark all read</button>
                    )}
                  </div>
                  <div className="nav__notifications-list">
                    {notifications.length === 0 ? (
                      <p className="nav__notifications-empty">No notifications yet.</p>
                    ) : (
                      notifications.map(note => (
                        <div key={note.id} className={`nav__notification-item ${!note.isRead ? 'nav__notification-item--unread' : ''}`}>
                          <div className="nav__notification-icon">
                             {note.type === 'episode' ? (
                               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                             ) : (
                               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                             )}
                          </div>
                          <div className="nav__notification-content">
                            <p>{note.message}</p>
                            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* <button
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
          </button> */}

          <Link className="nav__avatar" to="/login" title="Member Profile">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-3.866 0-7 3.134-7 7h2c0-2.757 2.243-5 5-5s5 2.243 5 5h2c0-3.866-3.134-7-7-7Z" />
            </svg>
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
              
              <div className="nav__mobile-divider" />
              <Link className="nav__mobile-item" to="/watchlist" onClick={() => setMobileOpen(false)}>
                My Watchlist
              </Link>
              <Link className="nav__mobile-item" to="/history" onClick={() => setMobileOpen(false)}>
                Watch History
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
