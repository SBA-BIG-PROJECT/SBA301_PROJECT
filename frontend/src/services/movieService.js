import apiClient from './api'

/**
 * Movie Service
 * Handle API calls related to movies
 * 
 * STRATEGY: Prioritize Backend API, fallback to TMDB if needed
 */
const movieService = {
  /**
   * Get movies list with pagination and search
   * GET /movies
   * @param {Object} params - { page, size, search }
   * @returns {Promise} PageResponse<MovieDto>
   */
  async getMovies({ page = 0, size = 20, search = '' } = {}) {
    const params = { page, size }
    if (search) {
      params.search = search
    }

    const response = await apiClient.get('/movies', { params })
    return response.data
  },

  /**
   * Get movie detail by ID
   * GET /movies/{id}
   * @param {number} movieId
   * @returns {Promise} MovieDetailDto
   */
  async getMovieDetail(movieId) {
    const response = await apiClient.get(`/movies/${movieId}`)
    return response.data
  },

  /**
   * Search movies
   * GET /movies?search=query
   * @param {string} query - Search keyword
   * @param {number} page
   * @param {number} size
   * @returns {Promise} PageResponse<MovieDto>
   */
  async searchMovies(query, page = 0, size = 20) {
    return this.getMovies({ page, size, search: query })
  },

  /**
   * Get trending movies
   * Note: Backend needs to implement this endpoint
   * @param {number} page
   * @param {number} size
   * @returns {Promise} PageResponse<MovieDto>
   */
  async getTrending({ page = 0, size = 20 } = {}) {
    // TODO: Backend needs GET /movies/trending endpoint
    // Workaround: Call /movies and filter/sort
    const response = await apiClient.get('/movies', {
      params: { page, size }
    })
    return response.data
  },

  /**
   * Get top rated movies
   * Note: Backend needs to implement this endpoint
   * @param {number} page
   * @param {number} size
   * @returns {Promise} PageResponse<MovieDto>
   */
  async getTopRated({ page = 0, size = 20 } = {}) {
    // TODO: Backend needs GET /movies/top-rated endpoint
    const response = await apiClient.get('/movies', {
      params: { page, size }
    })
    return response.data
  },

  /**
   * Get now playing movies
   * Note: Backend needs to implement this endpoint
   * @param {number} page
   * @param {number} size
   * @returns {Promise} PageResponse<MovieDto>
   */
  async getNowPlaying({ page = 0, size = 20 } = {}) {
    // TODO: Backend needs GET /movies/now-playing endpoint
    const response = await apiClient.get('/movies', {
      params: { page, size }
    })
    return response.data
  },

  /**
   * Get upcoming movies
   * Note: Backend needs to implement this endpoint
   * @param {number} page
   * @param {number} size
   * @returns {Promise} PageResponse<MovieDto>
   */
  async getUpcoming({ page = 0, size = 20 } = {}) {
    // TODO: Backend needs GET /movies/upcoming endpoint
    const response = await apiClient.get('/movies', {
      params: { page, size }
    })
    return response.data
  },

  /**
   * Get movies by genre
   * Note: Backend needs to implement this endpoint
   * @param {number} genreId
   * @param {number} page
   * @param {number} size
   * @returns {Promise} PageResponse<MovieDto>
   */
  async getByGenre(genreId, { page = 0, size = 20 } = {}) {
    // TODO: Backend needs GET /movies/genre/{genreId} endpoint
    const response = await apiClient.get('/movies', {
      params: { page, size, genreId }
    })
    return response.data
  },

  /**
   * Get all genres
   * Note: Backend needs to implement this endpoint
   * @returns {Promise} Array<{id, name}>
   */
  async getGenres() {
    // TODO: Backend needs GET /genres endpoint
    try {
      const response = await apiClient.get('/genres')
      return response.data
    } catch (error) {
      console.warn('Genres endpoint not available, returning empty array')
      return []
    }
  },

  /**
   * Get reviews for a movie
   * GET /movies/{movieId}/reviews
   * @param {number} movieId
   * @param {number} page
   * @param {number} size
   */
  async getReviews(movieId, { page = 0, size = 10 } = {}) {
    try {
      const response = await apiClient.get(`/movies/${movieId}/reviews`, {
        params: { page, size }
      })
      return response.data
    } catch (error) {
      console.warn('Failed to load reviews')
      return { content: [] }
    }
  },

  /**
   * Resolve movie embed URL from play token
   * GET /api/stream/play?token={token}
   * @param {string} token - playToken
   * @returns {Promise<string>} embedUrl
   */
  async resolvePlayToken(token) {
    const response = await apiClient.get('/stream/play', {
      params: { token }
    })
    return response.data?.embedUrl
  }
}

export default movieService
