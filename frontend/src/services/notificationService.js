import apiClient from './api'

/**
 * Notification Service
 * Xử lý các API liên quan đến notifications
 */
const notificationService = {
  /**
   * Lấy danh sách notifications
   * GET /notifications
   * @param {Object} params - { page, size }
   * @returns {Promise} PageResponse<NotificationDto>
   */
  async getNotifications({ page = 0, size = 10 } = {}) {
    const response = await apiClient.get('/notifications', {
      params: { page, size }
    })
    return response.data
  },

  /**
   * Lấy số lượng notification chưa đọc
   * GET /notifications/unread-count
   * @returns {Promise} number
   */
  async getUnreadCount() {
    const response = await apiClient.get('/notifications/unread-count')
    return response.data
  },

  /**
   * Đánh dấu notification là đã đọc
   * PATCH /notifications/{notificationId}/read
   * @param {number} notificationId
   * @returns {Promise}
   */
  async markAsRead(notificationId) {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`)
    return response.data
  },

  /**
   * Đánh dấu tất cả notifications là đã đọc
   * PUT /notifications/read-all
   * @returns {Promise}
   */
  async markAllAsRead() {
    const response = await apiClient.put('/notifications/read-all')
    return response.data
  },

  /**
   * Xóa notification
   * DELETE /notifications/{notificationId}
   * @param {number} notificationId
   * @returns {Promise}
   */
  async deleteNotification(notificationId) {
    const response = await apiClient.delete(`/notifications/${notificationId}`)
    return response.data
  }
}

export default notificationService
