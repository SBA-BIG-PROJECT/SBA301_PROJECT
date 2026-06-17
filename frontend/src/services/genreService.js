import apiClient from './api'

const genreService = {
  getAllGenres: () => {
    return apiClient.get('/genres')
  }
}

export default genreService
