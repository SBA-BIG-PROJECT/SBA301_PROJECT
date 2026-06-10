import apiClient from './api'

/**
 * Authentication Service
 * Xử lý các API liên quan đến authentication
 */
const authService = {
  /**
   * Đăng ký tài khoản mới
   * POST /auth/register
   * @param {Object} data - { username, email, password, fullName }
   * @returns {Promise} AuthResponse { user, accessToken, refreshToken }
   */
  async register(data) {
    const response = await apiClient.post('/auth/register', data)
    
    // Lưu token và user info
    if (response.data) {
      const { accessToken, refreshToken, user } = response.data
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
    }
    
    return response.data
  },

  /**
   * Đăng nhập
   * POST /auth/login
   * @param {Object} credentials - { username, password }
   * @returns {Promise} AuthResponse { user, accessToken, refreshToken }
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials)
    
    // Lưu token và user info
    if (response.data) {
      const { accessToken, refreshToken, user } = response.data
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
    }
    
    return response.data
  },

  /**
   * Refresh access token
   * POST /auth/refresh
   * @param {string} refreshToken
   * @returns {Promise} AuthResponse { user, accessToken, refreshToken }
   */
  async refreshToken(refreshToken) {
    const response = await apiClient.post('/auth/refresh', { refreshToken })
    
    // Cập nhật token mới
    if (response.data) {
      const { accessToken, refreshToken: newRefreshToken } = response.data
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', newRefreshToken)
    }
    
    return response.data
  },

  /**
   * Đăng xuất
   * POST /auth/logout
   * @param {string} refreshToken
   * @returns {Promise}
   */
  async logout(refreshToken) {
    try {
      await apiClient.post('/auth/logout', { refreshToken })
    } finally {
      // Xóa token và user info
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  },

  /**
   * Lấy thông tin user hiện tại từ localStorage
   * @returns {Object|null} User object hoặc null
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Error parsing user from localStorage', error)
      return null
    }
  },

  /**
   * Kiểm tra user có đang đăng nhập không
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('access_token')
  },

  /**
   * Lấy access token
   * @returns {string|null}
   */
  getAccessToken() {
    return localStorage.getItem('access_token')
  }
}

export default authService
