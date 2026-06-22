import { useState, useCallback, useEffect } from 'react'
import { watchlistService, authService } from '../services'

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Fetch watchlist from API
  const fetchWatchlist = useCallback(async (pageNum = 0) => {
    // Only fetch if user is logged in
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await watchlistService.getMyWatchlist({
        page: pageNum,
        size: 20
      })

      const mappedContent = (response.content || []).map((item) => ({
        id: item.movieId, // Map movieId to id so that Link/MovieCard references the correct ID
        watchlistId: item.id,
        movieId: item.movieId,
        title: item.movieTitle,
        poster_path: item.posterPath,
        vote_average: item.voteAverage,
        release_date: item.releaseDate ? item.releaseDate.toString() : ''
      }))

      if (pageNum === 0) {
        setWatchlist(mappedContent)
      } else {
        setWatchlist((prev) => [...prev, ...mappedContent])
      }

      setHasMore(!response.last)
      setPage(pageNum)
      setInitialized(true)
    } catch (err) {
      console.error('Error fetching watchlist:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch on mount when user is logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchWatchlist(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Add movie to watchlist
  const addToWatchlist = async (movieId) => {
    if (!authService.isAuthenticated()) {
      throw new Error('Please login to add to watchlist')
    }

    try {
      setError(null)
      await watchlistService.addToWatchlist(movieId)
      
      // Refresh watchlist
      await fetchWatchlist(0)
      
      return true
    } catch (err) {
      console.error('Error adding to watchlist:', err)
      setError(err.response?.data?.message || err.message)
      throw err
    }
  }

  // Remove movie from watchlist
  const removeFromWatchlist = async (movieId) => {
    if (!authService.isAuthenticated()) {
      throw new Error('Please login to remove from watchlist')
    }

    try {
      setError(null)
      await watchlistService.removeFromWatchlist(movieId)
      
      // Update local state
      setWatchlist((prev) => prev.filter((item) => item.movieId !== movieId))
      
      return true
    } catch (err) {
      console.error('Error removing from watchlist:', err)
      setError(err.response?.data?.message || err.message)
      throw err
    }
  }

  // Check if movie is in watchlist
  const isInWatchlist = useCallback(async (movieId) => {
    if (!authService.isAuthenticated()) {
      return false
    }

    try {
      const response = await watchlistService.checkInWatchlist(movieId)
      return response.isInWatchlist
    } catch (err) {
      console.error('Error checking watchlist:', err)
      return false
    }
  }, [])

  // Load more items
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchWatchlist(page + 1)
    }
  }

  // Refresh watchlist
  const refresh = () => {
    fetchWatchlist(0)
  }

  return {
    watchlist,
    loading,
    error,
    hasMore,
    initialized,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    loadMore,
    refresh
  }
}
