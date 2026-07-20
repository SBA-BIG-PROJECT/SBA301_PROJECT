import apiClient from './api'

export const commentService = {
  getComments: async (movieId, page = 0, size = 10) => {
    const response = await apiClient.get(`/comment/movies/${movieId}?page=${page}&size=${size}`)
    return response.data
  },
  createComment: async (movieId, data) => {
    const response = await apiClient.post(`/comment/movies/${movieId}`, data)
    return response.data
  },
  toggleLike: async (commentId) => {
    const response = await apiClient.post(`/comment/${commentId}/like`)
    return response.data
  },
  deleteComment: async (commentId) => {
    const response = await apiClient.delete(`/comment/${commentId}`)
    return response.data
  }
}
