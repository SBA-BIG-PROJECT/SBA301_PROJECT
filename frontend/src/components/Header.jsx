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

const Header = () => {
  const menuItems = [
    'Chu De',
    'The loai',
    'Phim Le',
    'Phim Bo',
    'Xem Chung',
    'Quoc Gia',
    'Dien Vien',
    'Lich Chieu'
  ]
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('query') || ''
  )
  const [debounced, setDebounced] = useState(searchTerm)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleRef = useRef(null)
  const panelRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

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

  // close mobile panel on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

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
            placeholder="Tim kiem phim, dien vien"
          />
          <div className="nav__menu" role="list">
            {menuItems.map((item) => (
              <button
                className="nav__menu-item"
                type="button"
                key={item}
              >
                {item}
              </button>
            ))}
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
            Thanh vien
          </Link>
        </div>
      </nav>

      {mobileOpen && (
        <div className="nav__mobile-panel" role="dialog" aria-modal="true">
          <div className="nav__mobile-scrim" onClick={() => setMobileOpen(false)} />
          <div className="nav__mobile-body" ref={panelRef}>
            <div className="nav__mobile-list">
              {menuItems.map((item) => (
                <button
                  className="nav__mobile-item"
                  key={item}
                  type="button"
                  onClick={() => setMobileOpen(false)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
