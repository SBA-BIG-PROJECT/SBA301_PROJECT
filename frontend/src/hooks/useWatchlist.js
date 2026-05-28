import { useState, useEffect } from 'react'

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const item = window.localStorage.getItem('sba_watchlist')
      return item ? JSON.parse(item) : []
    } catch (error) {
      console.warn('Error reading localStorage', error)
      return []
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem('sba_watchlist', JSON.stringify(watchlist))
    } catch (error) {
      console.warn('Error setting localStorage', error)
    }
  }, [watchlist])

  const addToWatchlist = (movie) => {
    setWatchlist((prev) => {
      // Prevent duplicates
      if (prev.find((item) => item.id === movie.id)) {
        return prev
      }
      return [movie, ...prev]
    })
  }

  const removeFromWatchlist = (movieId) => {
    setWatchlist((prev) => prev.filter((item) => item.id !== movieId))
  }

  const isInWatchlist = (movieId) => {
    return watchlist.some((item) => item.id === movieId)
  }

  const clearWatchlist = () => {
    setWatchlist([])
  }

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist
  }
}
