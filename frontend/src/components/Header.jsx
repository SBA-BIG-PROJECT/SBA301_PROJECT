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
import { movieService, authService, userService, genreService } from '../services'
import { useNotifications } from '../hooks/useNotifications'
import UserProfile from '../pages/userprofile.jsx'

const Header = () => {
  const menuItems = [
    { id: 'genres', label: 'Genres' },
    { id: 'categories', label: 'Categories' }
  ]
  const categoriesList = [
    { id: 'trending', name: 'Trending 🔥' },
    { id: 'top-rated', name: 'Top Rated 🌟' },
    { id: 'now-playing', name: 'Now Playing 🎬' },
    { id: 'upcoming', name: 'Upcoming 🚀' }
  ]
  const [genres, setGenres] = useState([])
  const [genresError, setGenresError] = useState('')
  const [genresOpen, setGenresOpen] = useState(false)
  const [mobileGenresOpen, setMobileGenresOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  
  const { notifications, unreadCount, markAllAsRead, markAsRead, refresh } = useNotifications()
  const [profileOpen, setProfileOpen] = useState(false)
  const isLoggedIn = authService.isAuthenticated()
  const [profile, setProfile] = useState(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

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
  const categoriesButtonRef = useRef(null)
  const categoriesPanelRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let active = true

    const loadGenres = async () => {
      setGenresError('')

      try {
        const response = await genreService.getAllGenres()
        const data = response.data
        if (!active) {
          return
        }

        const sorted = (data || [])
          // Remove TV Shows genre
          .filter((g) => !g.name?.toLowerCase().includes('chương trình') && !g.name?.toLowerCase().includes('truyền hình'))
          // Remove the word "Phim" from the beginning of genre name
          .map((g) => ({ ...g, name: g.name?.replace(/^phim\s+/i, '').trim() }))
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
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
    let active = true
    if (isLoggedIn) {
      userService.getCurrentUserProfile().then(data => {
        if (active) setProfile(data)
      }).catch(() => {})
    }
    return () => { active = false }
  }, [isLoggedIn])

  useEffect(() => {
    if (!profileMenuOpen) return
    const handleClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [profileMenuOpen])

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
    if (!categoriesOpen) {
      return
    }

    const handleClick = (event) => {
      const target = event.target
      if (
        categoriesPanelRef.current?.contains(target) ||
        categoriesButtonRef.current?.contains(target)
      ) {
        return
      }

      setCategoriesOpen(false)
    }

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setCategoriesOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [categoriesOpen])

  useEffect(() => {
    if (mobileOpen) {
      setGenresOpen(false)
      setCategoriesOpen(false)
    }
  }, [mobileOpen])

  // close mobile panel on navigation
  useEffect(() => {
    setMobileOpen(false)
    setGenresOpen(false)
    setMobileGenresOpen(false)
    setCategoriesOpen(false)
    setMobileCategoriesOpen(false)
    setNotificationsOpen(false)
  }, [location.pathname])

  const handleGenreSelect = (genreId) => {
    setGenresOpen(false)
    setMobileOpen(false)
    setMobileGenresOpen(false)
    navigate(`/genre/${genreId}`)
  }

  const handleCategorySelect = (categoryId) => {
    setCategoriesOpen(false)
    setMobileOpen(false)
    setMobileCategoriesOpen(false)
    navigate(`/category/${categoryId}`)
  }

  return (
    <>
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
                        {/* Panel header */}
                        <div className="genres-panel__head">
                          <div className="genres-panel__head-left">
                            <span className="genres-panel__icon">🎬</span>
                            <div>
                              <p className="genres-panel__heading">Movie Genres</p>
                              <p className="genres-panel__sub">
                                {genres.length > 0 ? `${genres.length} genres` : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            className="genres-panel__close"
                            type="button"
                            onClick={() => setGenresOpen(false)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>

                        {genres.length === 0 ? (
                          <div className="genres-panel__empty">
                            <div className="genres-panel__spinner" />
                            <p>{genresError || 'Loading genres...'}</p>
                          </div>
                        ) : (
                          <div className="genres-panel__grid">
                            {genres.map((genre, index) => {
                              const colors = [
                                'genre-pill--blue','genre-pill--purple','genre-pill--pink',
                                'genre-pill--green','genre-pill--orange','genre-pill--teal',
                                'genre-pill--red','genre-pill--indigo','genre-pill--yellow',
                                'genre-pill--cyan'
                              ]
                              const color = colors[index % colors.length]
                              return (
                                <button
                                  className={`genre-pill ${color}`}
                                  key={genre.id}
                                  type="button"
                                  onClick={() => handleGenreSelect(genre.id)}
                                >
                                  <span className="genre-pill__name">{genre.name}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              }

              if (item.id === 'categories') {
                return (
                  <div className="nav__menu-item--dropdown" key={item.id}>
                    <button
                      className="nav__menu-trigger"
                      type="button"
                      aria-expanded={categoriesOpen}
                      aria-controls="categories-panel"
                      onClick={() => setCategoriesOpen((value) => !value)}
                      ref={categoriesButtonRef}
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
                    {categoriesOpen && (
                      <div
                        className="nav__genres-panel"
                        id="categories-panel"
                        ref={categoriesPanelRef}
                        role="listbox"
                      >
                        {/* Panel header */}
                        <div className="genres-panel__head">
                          <div className="genres-panel__head-left">
                            <span className="genres-panel__icon">🔥</span>
                            <div>
                              <p className="genres-panel__heading">Movie Categories</p>
                              <p className="genres-panel__sub">
                                {categoriesList.length > 0 ? `${categoriesList.length} categories` : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            className="genres-panel__close"
                            type="button"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>

                        <div className="genres-panel__grid">
                          {categoriesList.map((category, index) => {
                            const colors = [
                              'genre-pill--blue','genre-pill--purple','genre-pill--pink',
                              'genre-pill--green','genre-pill--orange','genre-pill--teal',
                              'genre-pill--red','genre-pill--indigo'
                            ]
                            const color = colors[index % colors.length]
                            return (
                              <button
                                className={`genre-pill ${color}`}
                                key={category.id}
                                type="button"
                                onClick={() => handleCategorySelect(category.id)}
                              >
                                <span className="genre-pill__name">{category.name}</span>
                              </button>
                            )
                          })}
                        </div>
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
            {/* Notifications Dropdown */}
            <div className="relative flex">
              <button 
                className="nav__action-btn"
                aria-label="Notifications"
                title="Notifications"
                onClick={() => {
                  setNotificationsOpen(v => !v);
                  if (!notificationsOpen) refresh();
                }}
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
                        <div 
                          key={note.id} 
                          className={`nav__notification-item ${!note.isRead ? 'nav__notification-item--unread cursor-pointer hover:bg-[#1E293B]' : ''}`}
                          onClick={() => {
                            if (!note.isRead) markAsRead(note.id);
                          }}
                        >
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

          {isLoggedIn ? (
            <div className="relative flex" ref={profileMenuRef}>
              <button 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity border border-gray-600 rounded-full p-1 pr-2 ml-2 bg-[#1E293B]"
                onClick={() => setProfileMenuOpen(v => !v)}
                type="button"
              >
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center font-bold text-white text-sm">
                    {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#1a1c22] rounded-xl border border-gray-800 shadow-2xl overflow-hidden z-50 flex flex-col font-['Inter']">
                  <div className="p-5 border-b border-gray-800">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-gray-200 text-lg">{profile?.fullName || 'User'}</span>
                      <svg className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/>
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Upgrade your account to <strong className="text-white">RoX</strong> for a premium experience.
                    </p>
                    <Link 
                      to="/payment" 
                      onClick={() => setProfileMenuOpen(false)}
                      className="block w-full bg-[#fbd065] hover:bg-[#facc15] text-black text-center py-2.5 rounded-md font-bold text-sm transition-colors"
                    >
                      Upgrade now <span className="ml-1">^</span>
                    </Link>
                  </div>

                  <div className="px-5 py-4 flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                      <span className="text-gray-300 font-medium text-sm">Balance</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-yellow-500">0 <span className="w-5 h-5 inline-flex items-center justify-center bg-[#2a2d36] rounded-full text-[10px] ml-1">R</span></span>
                      <button className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-gray-200 transition-colors">
                        <span>+</span> Deposit
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col py-2">
                    <Link to="/watchlist" className="px-5 py-3 flex items-center gap-4 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white" onClick={() => setProfileMenuOpen(false)}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      <span className="text-sm font-medium">Watchlist</span>
                    </Link>
                    <Link to="/history" className="px-5 py-3 flex items-center gap-4 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white" onClick={() => setProfileMenuOpen(false)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <span className="text-sm font-medium">Watch History</span>
                    </Link>
                    <button onClick={() => { setProfileMenuOpen(false); setProfileOpen(true); }} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white w-full text-left">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      <span className="text-sm font-medium">Account</span>
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-800 py-2">
                    <button 
                      onClick={() => {
                        setProfileMenuOpen(false);
                        const refreshToken = localStorage.getItem('refresh_token')
                        if (refreshToken) authService.logout(refreshToken)
                        localStorage.removeItem('access_token')
                        localStorage.removeItem('refresh_token')
                        localStorage.removeItem('user')
                        navigate('/')
                        window.location.reload()
                      }}
                      className="px-5 py-3 flex items-center gap-4 hover:bg-gray-800 transition-colors text-gray-300 hover:text-white w-full text-left"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 bg-[#E2E4E9] hover:bg-[#d1d5db] text-[#1E293B] px-4 py-2 rounded-full font-medium transition-colors ml-2 text-sm h-10">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-3.866 0-7 3.134-7 7h2c0-2.757 2.243-5 5-5s5 2.243 5 5h2c0-3.866-3.134-7-7-7Z" />
              </svg>
              <span>Member</span>
            </Link>
          )}
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

                if (item.id === 'categories') {
                  return (
                    <div className="nav__mobile-section" key={item.id}>
                      <button
                        className="nav__mobile-item"
                        type="button"
                        aria-expanded={mobileCategoriesOpen}
                        onClick={() =>
                          setMobileCategoriesOpen((value) => !value)
                        }
                      >
                        {item.label}
                      </button>
                      {mobileCategoriesOpen && (
                        <div className="nav__mobile-genres">
                          <div className="nav__mobile-genres-grid">
                            {categoriesList.map((category) => (
                              <button
                                className="nav__mobile-genre-item"
                                key={category.id}
                                type="button"
                                onClick={() => handleCategorySelect(category.id)}
                              >
                                {category.name}
                              </button>
                            ))}
                          </div>
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

    {/* User Profile Modal */}
    {profileOpen && (
      <UserProfile onClose={() => setProfileOpen(false)} />
    )}
  </>
  )
}

export default Header
