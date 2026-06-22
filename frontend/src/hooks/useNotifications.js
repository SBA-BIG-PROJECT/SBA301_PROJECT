import { useState, useEffect, useCallback } from 'react'
import { notificationService, authService } from '../services'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (pageNum = 0) => {
    // Only fetch if user is logged in
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await notificationService.getNotifications({
        page: pageNum,
        size: 10
      })

      if (pageNum === 0) {
        setNotifications(response.content || [])
      } else {
        setNotifications((prev) => [...prev, ...(response.content || [])])
      }

      setHasMore(!response.last)
      setPage(pageNum)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }, [])

  // Load notifications and unread count on mount
  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchNotifications(0)
      fetchUnreadCount()
    }
  }, [fetchNotifications, fetchUnreadCount])

  // Mark all as read
  const markAllAsRead = async () => {
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      await notificationService.markAllAsRead()
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
      setError(err.message)
    }
  }

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      await notificationService.markAsRead(notificationId)
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking as read:', err)
      setError(err.message)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      await notificationService.deleteNotification(notificationId)
      
      // Update local state
      const notification = notifications.find((n) => n.id === notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
      setError(err.message)
    }
  }

  // Load more notifications
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1)
    }
  }

  // Refresh notifications
  const refresh = () => {
    fetchNotifications(0)
    fetchUnreadCount()
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    loadMore,
    refresh
  }
}
