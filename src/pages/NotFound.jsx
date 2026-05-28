import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <section className="empty">
      <h2>Page not found</h2>
      <p className="search-results__empty">
        The page you are looking for does not exist.
      </p>
      <Link className="btn btn--primary" to="/">
        Back to home
      </Link>
    </section>
  )
}

export default NotFound
