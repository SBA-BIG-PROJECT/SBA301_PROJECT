const API_BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const ROWS = [
  { id: 'trending', title: 'Trending Now', endpoint: '/trending/movie/week' },
  { id: 'now_playing', title: 'Now Playing', endpoint: '/movie/now_playing' },
  { id: 'top_rated', title: 'Top Rated', endpoint: '/movie/top_rated' },
  { id: 'upcoming', title: 'Coming Soon', endpoint: '/movie/upcoming' }
]

const FEATURED_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Animation'
]

const fetchFromTmdb = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, API_OPTIONS)

  if (!response.ok) {
    throw new Error('Failed to fetch data')
  }

  return response.json()
}

const fetchRows = async () => {
  const responses = await Promise.all(
    ROWS.map((row) => fetchFromTmdb(row.endpoint))
  )

  return ROWS.reduce((acc, row, index) => {
    acc[row.id] = responses[index]?.results || []
    return acc
  }, {})
}

const fetchMovie = (movieId) => fetchFromTmdb(`/movie/${movieId}`)
const fetchMovieCredits = (movieId) => fetchFromTmdb(`/movie/${movieId}/credits`)
const fetchMovieVideos = (movieId) => fetchFromTmdb(`/movie/${movieId}/videos`)
const fetchMovieReviews = (movieId) => fetchFromTmdb(`/movie/${movieId}/reviews`)
const fetchRelatedMovies = (movieId) => fetchFromTmdb(`/movie/${movieId}/similar`)
const searchMovies = (query) =>
  fetchFromTmdb(
    `/search/movie?query=${encodeURIComponent(query)}&include_adult=false`
  )
const fetchGenres = () => fetchFromTmdb('/genre/movie/list')
const fetchByGenre = (genreId) =>
  fetchFromTmdb(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`)

const fetchGenreRows = async (genreNames = FEATURED_GENRES) => {
  const data = await fetchGenres()
  const allGenres = data.genres || []

  const selected = genreNames
    .map((name) => allGenres.find((genre) => genre.name === name))
    .filter(Boolean)

  const responses = await Promise.all(
    selected.map((genre) => fetchByGenre(genre.id))
  )

  return selected.map((genre, index) => ({
    id: `genre_${genre.id}`,
    title: genre.name,
    items: responses[index]?.results || []
  }))
}

const getTrailerKey = (videos = []) => {
  const trailer = videos.find(
    (video) => video.site === 'YouTube' && video.type === 'Trailer'
  )
  return trailer?.key || ''
}

const getTrailerUrl = (videos = []) => {
  const key = getTrailerKey(videos)
  return key ? `https://www.youtube.com/watch?v=${key}` : ''
}

const getYear = (dateString) => {
  if (!dateString) {
    return 'N/A'
  }

  return dateString.split('-')[0]
}

const formatRating = (value) => {
  if (!value) {
    return 'N/A'
  }

  return value.toFixed(1)
}

export {
  API_BASE_URL,
  IMAGE_BASE_URL,
  BACKDROP_BASE_URL,
  ROWS,
  FEATURED_GENRES,
  fetchFromTmdb,
  fetchRows,
  fetchMovie,
  fetchMovieCredits,
  fetchMovieVideos,
  fetchMovieReviews,
  fetchRelatedMovies,
  fetchGenres,
  fetchByGenre,
  fetchGenreRows,
  searchMovies,
  getTrailerKey,
  getTrailerUrl,
  getYear,
  formatRating
}
