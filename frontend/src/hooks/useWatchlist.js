import { useState, useCallback } from 'react'
import { watchlistService, authService } from '../services'

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Fetch watchlist từ API
  const fetchWatchlist = useCallback(async (pageNum = 0) => {
    // Chỉ fetch nếu user đã đăng nhập
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

      if (pageNum === 0) {
        setWatchlist(response.content || [])
      } else {
        setWatchlist((prev) => [...prev, ...(response.content || [])])
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

  // Initialize - call manually when component mounts
  const initialize = useCallback(() => {
    if (!initialized && authService.isAuthenticated()) {
      fetchWatchlist(0)
    }
  }, [initialized, fetchWatchlist])

  // Thêm movie vào watchlist
  const addToWatchlist = async (movieId) => {
    if (!authService.isAuthenticated()) {
      throw new Error('Please login to add to watchlist')
    }

    try {
      setError(null)
      await watchlistService.addToWatchlist(movieId)
      
      // Refresh lại watchlist
      await fetchWatchlist(0)
      
      return true
    } catch (err) {
      console.error('Error adding to watchlist:', err)
      setError(err.response?.data?.message || err.message)
      throw err
    }
  }

  // Xóa movie khỏi watchlist
  const removeFromWatchlist = async (movieId) => {
    if (!authService.isAuthenticated()) {
      throw new Error('Please login to remove from watchlist')
    }

    try {
      setError(null)
      await watchlistService.removeFromWatchlist(movieId)
      
      // Cập nhật local state
      setWatchlist((prev) => prev.filter((item) => item.movieId !== movieId))
      
      return true
    } catch (err) {
      console.error('Error removing from watchlist:', err)
      setError(err.response?.data?.message || err.message)
      throw err
    }
  }

  // Kiểm tra movie có trong watchlist không
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
    initialize,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    loadMore,
    refresh
  }
}
