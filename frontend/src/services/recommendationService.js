import apiClient from './api'

const recommendationService = {
  getRecommendations: async (page = 0, size = 20) => {
    const response = await apiClient.get(`/recommendations?page=${page}&size=${size}`)
    return response.data
  }
}

export default recommendationService
