import { useState, useEffect, useCallback } from 'react'
import { authService } from '../services'

/**
 * Custom hook để quản lý authentication
 */
export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load user từ localStorage khi component mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    const authenticated = authService.isAuthenticated()
    
    setUser(currentUser)
    setIsAuthenticated(authenticated)
    setLoading(false)
  }, [])

  // Đăng ký
  const register = useCallback(async (data) => {
    try {
      const response = await authService.register(data)
      setUser(response.user)
      setIsAuthenticated(true)
      return response
    } catch (error) {
      throw error
    }
  }, [])

  // Đăng nhập
  const login = useCallback(async (credentials) => {
    try {
      const response = await authService.login(credentials)
      setUser(response.user)
      setIsAuthenticated(true)
      return response
    } catch (error) {
      throw error
    }
  }, [])

  // Đăng xuất
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      // Vẫn xóa local data nếu có lỗi
      setUser(null)
      setIsAuthenticated(false)
      throw error
    }
  }, [])

  return {
    user,
    isAuthenticated,
    loading,
    register,
    login,
    logout
  }
}
