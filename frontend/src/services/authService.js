import apiClient from './api'

/**
 * Authentication Service
 * Handle API calls related to authentication
 */
const authService = {
  /**
   * Register new account
   * POST /auth/register
   * @param {Object} data - { username, email, password, fullName }
   * @returns {Promise} AuthResponse { user, accessToken, refreshToken }
   */
  async register(data) {
    const response = await apiClient.post('/auth/register', data)

    // Save token and user info
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
   * Login
   * POST /auth/login
   * @param {Object} credentials - { username, password }
   * @returns {Promise} AuthResponse { user, accessToken, refreshToken }
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials)

    // Save token and user info
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

    // Update new token
    if (response.data) {
      const accessToken = response.data.token || response.data.accessToken
      const newRefreshToken = response.data.refreshToken
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', newRefreshToken)
    }

    return response.data
  },

  /**
   * Logout
   * POST /auth/logout
   * @param {string} refreshToken
   * @returns {Promise}
   */
  async logout(refreshToken) {
    try {
      await apiClient.post('/auth/logout', { refreshToken })
    } finally {
      // Remove token and user info
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  },

  /**
   * Get current user info from localStorage
   * @returns {Object|null} User object or null
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
   * Check if user is logged in and token is valid
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = localStorage.getItem('access_token')
    if (!token || token === 'undefined') return false

    // Check if token is in valid JWT format (3 parts separated by dots)
    const parts = token.split('.')
    if (parts.length !== 3) {
      // Token is not standard JWT - if token exists, consider it authenticated
      return true
    }

    try {
      // Decode JWT token payload (handle base64url encoding)
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      // Add padding for valid Base64 length
      base64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')

      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))

      const payload = JSON.parse(jsonPayload)
      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token expired — clear all data
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        return false
      }
      return true
    } catch (error) {
      // If decode fails but token exists, still consider authenticated
      // Backend will reject if token is truly invalid
      console.warn('Could not decode token for expiry check, assuming valid:', error.message)
      return true
    }
  },

  /**
   * Get access token
   * @returns {string|null}
   */
  getAccessToken() {
    const token = localStorage.getItem('access_token')
    return token === 'undefined' ? null : token
  }
}

export default authService
