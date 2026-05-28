import { useState, useEffect } from 'react'

// Mock Data for notifications
const mockNotifications = [
  {
    id: 1,
    type: 'episode',
    message: 'New episode of "Arcane" is now available!',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    isRead: false
  },
  {
    id: 2,
    type: 'admin',
    message: 'Welcome to SBA Movies! Explore our vast collection.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: false
  },
  {
    id: 3,
    type: 'episode',
    message: 'Top trending movie: "Dune: Part Two". Watch it now.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    isRead: true
  }
]

export const useNotifications = () => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const item = window.localStorage.getItem('sba_notifications')
      return item ? JSON.parse(item) : mockNotifications
    } catch (error) {
      return mockNotifications
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem('sba_notifications', JSON.stringify(notifications))
    } catch (error) {
      console.warn('Error setting localStorage', error)
    }
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const addNotification = (notification) => {
    setNotifications((prev) => [
      {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        isRead: false,
        ...notification
      },
      ...prev
    ])
  }

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    addNotification
  }
}
