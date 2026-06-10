import { useState, useEffect, useCallback } from 'react'
import { notificationService, authService } from '../services'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Fetch notifications từ API
  const fetchNotifications = useCallback(async (pageNum = 0) => {
    // Chỉ fetch nếu user đã đăng nhập
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

  // Load notifications và unread count khi component mount
  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchNotifications(0)
      fetchUnreadCount()
    }
  }, [fetchNotifications, fetchUnreadCount])

  // Đánh dấu tất cả là đã đọc
  const markAllAsRead = async () => {
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      await notificationService.markAllAsRead()
      
      // Cập nhật local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
      setError(err.message)
    }
  }

  // Đánh dấu 1 notification là đã đọc
  const markAsRead = async (notificationId) => {
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      await notificationService.markAsRead(notificationId)
      
      // Cập nhật local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking as read:', err)
      setError(err.message)
    }
  }

  // Xóa notification
  const deleteNotification = async (notificationId) => {
    if (!authService.isAuthenticated()) {
      return
    }

    try {
      await notificationService.deleteNotification(notificationId)
      
      // Cập nhật local state
      const notification = notifications.find((n) => n.id === notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      
      if (notification && !notification.read) {
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
