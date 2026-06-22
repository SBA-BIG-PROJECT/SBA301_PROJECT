import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MovieCard from '../components/MovieCard.jsx'
import Spinner from '../components/Spinner.jsx'
import { movieService } from '../services'

const Category = () => {
  const { id } = useParams()
  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const categoryNames = {
    'trending': 'Trending',
    'top-rated': 'Top Rated',
    'now-playing': 'Now Playing',
    'upcoming': 'Upcoming'
  }
  const categoryName = categoryNames[id] || 'Category'

  useEffect(() => {
    let active = true

    if (!id || !categoryNames[id]) {
      setErrorMessage('Invalid category.')
      setIsLoading(false)
      setMovies([])
      return () => {
        active = false
      }
    }

    const loadCategory = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        let response;
        if (id === 'trending') {
          response = await movieService.getTrending()
        } else if (id === 'top-rated') {
          response = await movieService.getTopRated()
        } else if (id === 'now-playing') {
          response = await movieService.getNowPlaying()
        } else if (id === 'upcoming') {
          response = await movieService.getUpcoming()
        }

        if (!active) {
          return
        }
        
        // Backend returns PageResponse<MovieDto> with content property
        setMovies(response?.content || [])
      } catch (error) {
        console.error(`Error fetching category: ${error}`)
        if (active) {
          setErrorMessage('Could not load this category. Please try again.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadCategory()

    return () => {
      active = false
    }
  }, [id])

  return (
    <section className="search-results pt-[100px] pb-10 container">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">{categoryName} Movies</h2>
        <Link className="hm-btn hm-btn--ghost" to="/">
          Back to Home
        </Link>
      </div>

      {isLoading ? (
        <Spinner />
      ) : errorMessage ? (
        <p className="status">{errorMessage}</p>
      ) : movies.length === 0 ? (
        <p className="search-results__empty">
          No movies found for this category yet.
        </p>
      ) : (
        <div className="hm-grid">
          {movies.map((movie) => (
            <Link className="hm-card" to={`/movie/${movie.id}`} key={movie.id}>
              <MovieCard movie={{
                id: movie.id,
                title: movie.title,
                poster_path: movie.posterPath,
                vote_average: movie.voteAverage,
                release_date: movie.releaseDate
              }} />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default Category
