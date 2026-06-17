import apiClient from './api'

const userService = {
  getCurrentUserProfile: () => {
    return apiClient.get('/users/me')
  },

  updateProfile: (data) => {
    return apiClient.put('/users/me', data)
  },

  changePassword: (data) => {
    return apiClient.put('/users/me/password', data)
  },

  getSubscription: () => {
    return apiClient.get('/users/me/subscription')
  },

  getUserStats: () => {
    return apiClient.get('/users/me/stats')
  },

  deleteAccount: (data) => {
    return apiClient.delete('/users/me', { data })
  },

  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  deleteAvatar: () => {
    return apiClient.delete('/users/me/avatar')
  }
}

export default userService
