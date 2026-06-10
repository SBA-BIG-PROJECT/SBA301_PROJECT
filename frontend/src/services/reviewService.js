import apiClient from './api'

/**
 * Review Service
 * Xử lý các API liên quan đến reviews và ratings
 */
const reviewService = {
  /**
   * Tạo review mới cho movie
   * POST /movies/{movieId}/reviews
   * @param {number} movieId
   * @param {Object} data - { rating, comment }
   * @returns {Promise} ReviewDto
   */
  async createReview(movieId, data) {
    const response = await apiClient.post(`/movies/${movieId}/reviews`, data)
    return response.data
  },

  /**
   * Lấy danh sách reviews của movie
   * GET /movies/{movieId}/reviews
   * @param {number} movieId
   * @param {Object} params - { page, size }
   * @returns {Promise} PageResponse<ReviewDto>
   */
  async getReviews(movieId, { page = 0, size = 10 } = {}) {
    const response = await apiClient.get(`/movies/${movieId}/reviews`, {
      params: { page, size }
    })
    return response.data
  },

  /**
   * Lấy rating summary của movie
   * GET /movies/{movieId}/rating
   * @param {number} movieId
   * @returns {Promise} RatingSummaryDto { averageRating, totalReviews }
   */
  async getMovieRating(movieId) {
    const response = await apiClient.get(`/movies/${movieId}/rating`)
    return response.data
  },

  /**
   * Cập nhật review
   * PUT /reviews/{reviewId}
   * @param {number} reviewId
   * @param {Object} data - { rating, comment }
   * @returns {Promise} ReviewDto
   */
  async updateReview(reviewId, data) {
    const response = await apiClient.put(`/reviews/${reviewId}`, data)
    return response.data
  },

  /**
   * Xóa review
   * DELETE /reviews/{reviewId}
   * @param {number} reviewId
   * @returns {Promise}
   */
  async deleteReview(reviewId) {
    const response = await apiClient.delete(`/reviews/${reviewId}`)
    return response.data
  }
}

export default reviewService
