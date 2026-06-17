import apiClient from './api'

const historyService = {
  addHistory: (data) => {
    return apiClient.post('/history', data)
  },

  getHistory: () => {
    return apiClient.get('/history')
  },

  clearHistory: () => {
    return apiClient.delete('/history/clear')
  },

  deleteHistoryItem: (viewId) => {
    return apiClient.delete(`/history/${viewId}`)
  }
}

export default historyService
