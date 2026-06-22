import { useState, useEffect, useCallback } from 'react'
import { historyService, authService } from '../services'

export const useHistory = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Fetch history from API
  const fetchHistory = useCallback(async (pageNum = 0) => {
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await historyService.getHistory({
        page: pageNum,
        size: 20
      })

      // Map ViewHistoryDto to Movie object compatible with MovieCard
      const mappedContent = (response.content || []).map((item) => ({
        id: item.movieId, // Map movieId to id so Links navigate to correct movie
        viewId: item.id, // Save viewId for deletion purpose
        movieId: item.movieId,
        title: item.movieTitle,
        poster_path: item.posterPath,
        vote_average: item.voteAverage,
        release_date: item.releaseDate ? item.releaseDate.toString() : '',
        watchedAt: item.watchedAt
      }))

      if (pageNum === 0) {
        setHistory(mappedContent)
      } else {
        setHistory((prev) => [...prev, ...mappedContent])
      }

      setHasMore(!response.last)
      setPage(pageNum)
      setInitialized(true)
    } catch (err) {
      console.error('Error fetching history:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initialize - Called automatically when user is logged in
  useEffect(() => {
    if (!initialized && authService.isAuthenticated()) {
      fetchHistory(0)
    }
  }, [initialized, fetchHistory])

  // Add movie to history
  const addToHistory = async (movie, watchDuration = 0) => {
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      await historyService.addHistory({
        movieId: movie.id,
        watchDuration: watchDuration
      })
      // Fetch first page again
      fetchHistory(0)
    } catch (err) {
      console.error('Error adding to history:', err)
    }
  }

  // Remove movie from history
  const removeFromHistory = async (movieId) => {
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      const item = history.find((h) => h.movieId === movieId)
      if (item && item.viewId) {
        await historyService.deleteHistoryItem(item.viewId)
        setHistory((prev) => prev.filter((h) => h.movieId !== movieId))
      }
    } catch (err) {
      console.error('Error removing from history:', err)
    }
  }

  // Clear all history
  const clearHistory = async () => {
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      await historyService.clearHistory()
      setHistory([])
    } catch (err) {
      console.error('Error clearing history:', err)
    }
  }

  return {
    history,
    loading,
    error,
    hasMore,
    addToHistory,
    removeFromHistory,
    clearHistory,
    refresh: () => fetchHistory(0)
  }
}
