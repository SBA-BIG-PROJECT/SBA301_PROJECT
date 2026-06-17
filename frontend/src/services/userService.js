import apiClient from './api'

const userService = {
  async getCurrentUserProfile() {
    const response = await apiClient.get('/users/me')
    return response.data
  },

  async updateProfile(data) {
    const response = await apiClient.put('/users/me', data)
    return response.data
  },

  async changePassword(data) {
    const response = await apiClient.put('/users/me/password', data)
    return response.data
  },

  async getSubscription() {
    const response = await apiClient.get('/users/me/subscription')
    return response.data
  },

  async getUserStats() {
    const response = await apiClient.get('/users/me/stats')
    return response.data
  },

  async deleteAccount(data) {
    const response = await apiClient.delete('/users/me', { data })
    return response.data
  },

  async uploadAvatar(file) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  async deleteAvatar() {
    const response = await apiClient.delete('/users/me/avatar')
    return response.data
  }
}

export default userService
