import { useState, useEffect } from 'react'

export const useHistory = () => {
  const [history, setHistory] = useState(() => {
    try {
      const item = window.localStorage.getItem('sba_history')
      return item ? JSON.parse(item) : []
    } catch (error) {
      console.warn('Error reading localStorage', error)
      return []
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem('sba_history', JSON.stringify(history))
    } catch (error) {
      console.warn('Error setting localStorage', error)
    }
  }, [history])

  const addToHistory = (movie) => {
    setHistory((prev) => {
      // Remove if it already exists to put it at the top
      const filtered = prev.filter((item) => item.id !== movie.id)
      return [{ ...movie, watchedAt: new Date().toISOString() }, ...filtered].slice(0, 50) // keep last 50
    })
  }

  const removeFromHistory = (movieId) => {
    setHistory((prev) => prev.filter((item) => item.id !== movieId))
  }

  const clearHistory = () => {
    setHistory([])
  }

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  }
}
