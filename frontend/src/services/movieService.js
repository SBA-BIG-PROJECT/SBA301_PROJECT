import apiClient from './api'

/**
 * Movie Service
 * Xử lý các API liên quan đến movies
 * 
 * STRATEGY: Ưu tiên Backend API, fallback to TMDB nếu cần
 */
const movieService = {
  /**
   * Lấy danh sách movies với phân trang và tìm kiếm
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
   * Lấy chi tiết movie theo ID
   * GET /movies/{id}
   * @param {number} movieId
   * @returns {Promise} MovieDetailDto
   */
  async getMovieDetail(movieId) {
    const response = await apiClient.get(`/movies/${movieId}`)
    return response.data
  },

  /**
   * Tìm kiếm movies
   * GET /movies?search=query
   * @param {string} query - Từ khóa tìm kiếm
   * @param {number} page
   * @param {number} size
   * @returns {Promise} PageResponse<MovieDto>
   */
  async searchMovies(query, page = 0, size = 20) {
    return this.getMovies({ page, size, search: query })
  },

  /**
   * Lấy trending movies
   * Note: Backend cần implement endpoint này
   * @param {number} page
   * @param {number} size
   * @returns {Promise} PageResponse<MovieDto>
   */
  async getTrending({ page = 0, size = 20 } = {}) {
    // TODO: Backend needs GET /movies/trending endpoint
    // Workaround: Gọi /movies và filter/sort
    const response = await apiClient.get('/movies', { 
      params: { page, size } 
    })
    return response.data
  },

  /**
   * Lấy top rated movies
   * Note: Backend cần implement endpoint này
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
   * Lấy now playing movies
   * Note: Backend cần implement endpoint này
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
   * Lấy upcoming movies
   * Note: Backend cần implement endpoint này
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
   * Lấy movies theo genre
   * Note: Backend cần implement endpoint này
   * @param {number} genreId
   * @param {number} page
   * @param {number} size
   * @returns {Promise} PageResponse<MovieDto>
   */
  async getByGenre(genreId, { page = 0, size = 20 } = {}) {
    // TODO: Backend needs GET /movies/genre/{genreId} endpoint
    const response = await apiClient.get('/movies', { 
      params: { page, size, genre: genreId } 
    })
    return response.data
  },

  /**
   * Lấy all genres
   * Note: Backend cần implement endpoint này
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
  }
}

export default movieService
