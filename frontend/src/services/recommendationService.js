import apiClient from './api'

const recommendationService = {
  generateRecommendations: () => {
    return apiClient.post('/recommendations/generate')
  },

  getRecommendations: () => {
    return apiClient.get('/recommendations')
  },

  deleteRecommendation: (recommendationId) => {
    return apiClient.delete(`/recommendations/${recommendationId}`)
  }
}

export default recommendationService
