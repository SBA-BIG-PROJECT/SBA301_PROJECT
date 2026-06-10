import apiClient from './api'

/**
 * Watchlist Service
 * Xử lý các API liên quan đến watchlist
 */
const watchlistService = {
  /**
   * Thêm movie vào watchlist
   * POST /watchlist/{movieId}
   * @param {number} movieId
   * @returns {Promise} WatchlistDto
   */
  async addToWatchlist(movieId) {
    const response = await apiClient.post(`/watchlist/${movieId}`)
    return response.data
  },

  /**
   * Lấy danh sách watchlist của user
   * GET /watchlist
   * @param {Object} params - { page, size }
   * @returns {Promise} PageResponse<WatchlistDto>
   */
  async getMyWatchlist({ page = 0, size = 20 } = {}) {
    const response = await apiClient.get('/watchlist', {
      params: { page, size }
    })
    return response.data
  },

  /**
   * Kiểm tra movie có trong watchlist không
   * GET /watchlist/check/{movieId}
   * @param {number} movieId
   * @returns {Promise} { isInWatchlist: boolean }
   */
  async checkInWatchlist(movieId) {
    const response = await apiClient.get(`/watchlist/check/${movieId}`)
    return response.data
  },

  /**
   * Xóa movie khỏi watchlist
   * DELETE /watchlist/{movieId}
   * @param {number} movieId
   * @returns {Promise}
   */
  async removeFromWatchlist(movieId) {
    const response = await apiClient.delete(`/watchlist/${movieId}`)
    return response.data
  }
}

export default watchlistService
