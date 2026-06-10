import { useState, useEffect, useCallback } from 'react'
import { reviewService, authService } from '../services'

/**
 * Custom hook để quản lý reviews của một movie
 * @param {number} movieId - ID của movie
 */
export const useReviews = (movieId) => {
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Fetch reviews
  const fetchReviews = useCallback(async (pageNum = 0) => {
    if (!movieId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await reviewService.getReviews(movieId, {
        page: pageNum,
        size: 10
      })

      if (pageNum === 0) {
        setReviews(response.content || [])
      } else {
        setReviews((prev) => [...prev, ...(response.content || [])])
      }

      setHasMore(!response.last)
      setPage(pageNum)
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [movieId])

  // Fetch rating summary
  const fetchRating = useCallback(async () => {
    if (!movieId) return

    try {
      const data = await reviewService.getMovieRating(movieId)
      setRating(data)
    } catch (err) {
      console.error('Error fetching rating:', err)
    }
  }, [movieId])

  // Load reviews và rating khi component mount
  useEffect(() => {
    if (movieId) {
      fetchReviews(0)
      fetchRating()
    }
  }, [movieId, fetchReviews, fetchRating])

  // Tạo review mới
  const createReview = async (data) => {
    if (!authService.isAuthenticated()) {
      throw new Error('Please login to write a review')
    }

    try {
      setError(null)
      const newReview = await reviewService.createReview(movieId, data)
      
      // Thêm review mới vào đầu danh sách
      setReviews((prev) => [newReview, ...prev])
      
      // Refresh rating
      await fetchRating()
      
      return newReview
    } catch (err) {
      console.error('Error creating review:', err)
      setError(err.response?.data?.message || err.message)
      throw err
    }
  }

  // Cập nhật review
  const updateReview = async (reviewId, data) => {
    if (!authService.isAuthenticated()) {
      throw new Error('Please login to update review')
    }

    try {
      setError(null)
      const updatedReview = await reviewService.updateReview(reviewId, data)
      
      // Cập nhật review trong danh sách
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? updatedReview : r))
      )
      
      // Refresh rating
      await fetchRating()
      
      return updatedReview
    } catch (err) {
      console.error('Error updating review:', err)
      setError(err.response?.data?.message || err.message)
      throw err
    }
  }

  // Xóa review
  const deleteReview = async (reviewId) => {
    if (!authService.isAuthenticated()) {
      throw new Error('Please login to delete review')
    }

    try {
      setError(null)
      await reviewService.deleteReview(reviewId)
      
      // Xóa review khỏi danh sách
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
      
      // Refresh rating
      await fetchRating()
      
      return true
    } catch (err) {
      console.error('Error deleting review:', err)
      setError(err.response?.data?.message || err.message)
      throw err
    }
  }

  // Load more reviews
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchReviews(page + 1)
    }
  }

  // Refresh reviews và rating
  const refresh = () => {
    fetchReviews(0)
    fetchRating()
  }

  return {
    reviews,
    rating,
    loading,
    error,
    hasMore,
    createReview,
    updateReview,
    deleteReview,
    loadMore,
    refresh
  }
}
