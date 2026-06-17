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
      const accessToken = response.data.token || response.data.accessToken
      const refreshToken = response.data.refreshToken
      const user = response.data.user
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
      const accessToken = response.data.token || response.data.accessToken
      const refreshToken = response.data.refreshToken
      const user = response.data.user
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
      const accessToken = response.data.token || response.data.accessToken
      const newRefreshToken = response.data.refreshToken
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
   * Kiểm tra user có đang đăng nhập không và token còn hợp lệ không
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = localStorage.getItem('access_token')
    if (!token || token === 'undefined') return false

    // Kiểm tra xem token có đúng định dạng JWT (3 phần ngăn cách bởi dấu chấm) không
    const parts = token.split('.')
    if (parts.length !== 3) {
      // Token không phải JWT chuẩn — chỉ cần có token là coi như authenticated
      return true
    }

    try {
      // Decode JWT token payload (handle base64url encoding)
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      // Thêm padding cho hợp lệ độ dài Base64
      base64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')

      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))

      const payload = JSON.parse(jsonPayload)
      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token expired — xóa hết data
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        return false
      }
      return true
    } catch (error) {
      // Nếu decode lỗi nhưng token tồn tại, vẫn coi là authenticated
      // Backend sẽ reject nếu token thật sự không hợp lệ
      console.warn('Could not decode token for expiry check, assuming valid:', error.message)
      return true
    }
  },

  /**
   * Lấy access token
   * @returns {string|null}
   */
  getAccessToken() {
    const token = localStorage.getItem('access_token')
    return token === 'undefined' ? null : token
  }
}

export default authService
