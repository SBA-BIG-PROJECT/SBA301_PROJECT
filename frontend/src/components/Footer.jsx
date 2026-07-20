import { Link } from 'react-router-dom'
import logo from '../assets/logo.svg'
import { authService } from '../services'

const Footer = () => {
  const isLoggedIn = authService.isAuthenticated()
  return (
    <footer className="footer">
      <div className="footer__brand">
        <img src={logo} alt="SBA Movies" />
        <div>
          <h3>SBA Movies</h3>
          <p className="footer__tagline">
            A calm place to discover trailers and movie details.
          </p>
        </div>
      </div>

      <div className="footer__grid">
        <div className="footer__col">
          <p className="footer__title">Explore</p>
          <Link className="footer__link" to="/">
            Home
          </Link>
          <Link className="footer__link" to="/category/trending">
            Trending
          </Link>
          <Link className="footer__link" to="/category/top-rated">
            Top Rated
          </Link>
        </div>
        <div className="footer__col">
          <p className="footer__title">Account</p>
          {isLoggedIn ? (
            <>
              <Link className="footer__link" to="/watchlist">
                Watchlist
              </Link>
              <Link className="footer__link" to="/history">
                Watch History
              </Link>
            </>
          ) : (
            <>
              <Link className="footer__link" to="/login">
                Sign in
              </Link>
              <Link className="footer__link" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
        <div className="footer__col">
          <p className="footer__title">Support</p>
          <a className="footer__link" href="mailto:levonhatquang11@gmail.com">
            levonhatquang11@gmail.com
          </a>
        </div>
      </div>

      <p className="footer__note">
        Demo only. Trailers are provided by TMDB and YouTube.
      </p>
    </footer>
  )
}

export default Footer
