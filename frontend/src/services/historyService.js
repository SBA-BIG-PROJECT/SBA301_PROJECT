import apiClient from './api'

const historyService = {
  async addHistory(data) {
    const response = await apiClient.post('/history', data)
    return response.data
  },

  async getHistory({ page = 0, size = 20 } = {}) {
    const response = await apiClient.get('/history', {
      params: { page, size }
    })
    return response.data
  },

  async clearHistory() {
    const response = await apiClient.delete('/history/clear')
    return response.data
  },

  async deleteHistoryItem(viewId) {
    const response = await apiClient.delete(`/history/${viewId}`)
    return response.data
  }
}

export default historyService
