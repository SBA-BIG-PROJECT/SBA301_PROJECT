import { Link } from 'react-router-dom'
import logo from '../assets/logo.svg'

const Footer = () => {
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
          <Link className="footer__link" to="/search?query=popular">
            Trending
          </Link>
          <Link className="footer__link" to="/search?query=top">
            Top Rated
          </Link>
        </div>
        <div className="footer__col">
          <p className="footer__title">Account</p>
          <Link className="footer__link" to="/login">
            Sign in
          </Link>
          <Link className="footer__link" to="/register">
            Register
          </Link>
        </div>
        <div className="footer__col">
          <p className="footer__title">Support</p>
          <a className="footer__link" href="#">
            Help Center
          </a>
          <a className="footer__link" href="#">
            Contact
          </a>
          <a className="footer__link" href="#">
            Feedback
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
