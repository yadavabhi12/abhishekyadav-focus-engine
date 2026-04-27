import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { notificationService } from '../services/notifications'
import { useAuth } from './AuthContext'
import { toast } from 'react-hot-toast'

const NotificationContext = createContext()

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload, loading: false }
    case 'ADD_NOTIFICATION':
      // Prevent duplicates
      if (state.notifications.some(n => n._id === action.payload._id)) {
        return state
      }
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications],
        unreadCount: action.payload.read ? state.unreadCount : state.unreadCount + 1
      }
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification._id === action.payload 
            ? { ...notification, read: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          read: true
        })),
        unreadCount: 0
      }
    case 'DELETE_NOTIFICATION':
      const notificationToDelete = state.notifications.find(n => n._id === action.payload)
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification._id !== action.payload
        ),
        unreadCount: notificationToDelete && !notificationToDelete.read 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount
      }
    case 'DELETE_ALL_NOTIFICATIONS':
      return { ...state, notifications: [], unreadCount: 0 }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload }
    default:
      return state
  }
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false
}

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadNotifications()
      loadUnreadCount()
      
      const interval = setInterval(() => {
        loadUnreadCount()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [user])

  const loadNotifications = async (limit = 50, page = 1) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const { notifications } = await notificationService.getNotifications(limit, page)
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications })
      return notifications
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
      return []
    }
  }

  const loadUnreadCount = async () => {
    try {
      const { count } = await notificationService.getUnreadCount()
      dispatch({ type: 'SET_UNREAD_COUNT', payload: count })
      return count
    } catch (error) {
      console.error('Error loading unread count:', error)
      return 0
    }
  }

  const addNotification = (notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
  }

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)
      dispatch({ type: 'MARK_AS_READ', payload: notificationId })
      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
      return false
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      dispatch({ type: 'MARK_ALL_AS_READ' })
      toast.success('All notifications marked as read')
      return true
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
      return false
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId)
      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId })
      toast.success('Notification deleted')
      return true
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
      return false
    }
  }

  const deleteAllNotifications = async () => {
    try {
      await notificationService.deleteAllNotifications()
      dispatch({ type: 'DELETE_ALL_NOTIFICATIONS' })
      toast.success('All notifications cleared')
      return true
    } catch (error) {
      console.error('Error deleting all notifications:', error)
      toast.error('Failed to clear notifications')
      return false
    }
  }

  const value = {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    loadNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    loadUnreadCount
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}







// import React, { createContext, useContext, useReducer, useEffect } from 'react'
// import { notificationService } from '../services/notifications'
// import { useAuth } from './AuthContext'
// import { toast } from 'react-hot-toast'

// const NotificationContext = createContext()

// const notificationReducer = (state, action) => {
//   switch (action.type) {
//     case 'SET_NOTIFICATIONS':
//       return { ...state, notifications: action.payload, loading: false }
//     case 'ADD_NOTIFICATION':
//       return { ...state, notifications: [action.payload, ...state.notifications] }
//     case 'MARK_AS_READ':
//       return {
//         ...state,
//         notifications: state.notifications.map(notification =>
//           notification._id === action.payload 
//             ? { ...notification, read: true }
//             : notification
//         )
//       }
//     case 'MARK_ALL_AS_READ':
//       return {
//         ...state,
//         notifications: state.notifications.map(notification => ({
//           ...notification,
//           read: true
//         }))
//       }
//     case 'DELETE_NOTIFICATION':
//       return {
//         ...state,
//         notifications: state.notifications.filter(
//           notification => notification._id !== action.payload
//         )
//       }
//     case 'DELETE_ALL_NOTIFICATIONS':
//       return { ...state, notifications: [] }
//     case 'SET_LOADING':
//       return { ...state, loading: action.payload }
//     case 'SET_UNREAD_COUNT':
//       return { ...state, unreadCount: action.payload }
//     default:
//       return state
//   }
// }

// const initialState = {
//   notifications: [],
//   unreadCount: 0,
//   loading: false
// }

// export const NotificationProvider = ({ children }) => {
//   const [state, dispatch] = useReducer(notificationReducer, initialState)
//   const { user } = useAuth()

//   useEffect(() => {
//     if (user) {
//       loadNotifications()
//       loadUnreadCount()
      
//       // Set up interval to refresh notifications every 30 seconds
//       const interval = setInterval(() => {
//         loadUnreadCount()
//       }, 30000)
      
//       return () => clearInterval(interval)
//     }
//   }, [user])

//   const loadNotifications = async (limit = 50, page = 1) => {
//     try {
//       dispatch({ type: 'SET_LOADING', payload: true })
//       const { notifications } = await notificationService.getNotifications(limit, page)
//       dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications })
//       return notifications
//     } catch (error) {
//       console.error('Error loading notifications:', error)
//       toast.error('Failed to load notifications')
//       return []
//     }
//   }

//   const loadUnreadCount = async () => {
//     try {
//       const { count } = await notificationService.getUnreadCount()
//       dispatch({ type: 'SET_UNREAD_COUNT', payload: count })
//       return count
//     } catch (error) {
//       console.error('Error loading unread count:', error)
//       return 0
//     }
//   }

//   const addNotification = (notification) => {
//     dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
//     dispatch({ type: 'SET_UNREAD_COUNT', payload: state.unreadCount + 1 })
//   }

//   const markAsRead = async (notificationId) => {
//     try {
//       await notificationService.markAsRead(notificationId)
//       dispatch({ type: 'MARK_AS_READ', payload: notificationId })
      
//       // Update unread count
//       dispatch({ type: 'SET_UNREAD_COUNT', payload: Math.max(0, state.unreadCount - 1) })
      
//       return true
//     } catch (error) {
//       console.error('Error marking notification as read:', error)
//       toast.error('Failed to mark notification as read')
//       return false
//     }
//   }

//   const markAllAsRead = async () => {
//     try {
//       await notificationService.markAllAsRead()
//       dispatch({ type: 'MARK_ALL_AS_READ' })
//       dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 })
//       toast.success('All notifications marked as read')
//       return true
//     } catch (error) {
//       console.error('Error marking all notifications as read:', error)
//       toast.error('Failed to mark all notifications as read')
//       return false
//     }
//   }

//   const deleteNotification = async (notificationId) => {
//     try {
//       // Check if the notification is unread to update count
//       const notification = state.notifications.find(n => n._id === notificationId)
//       const wasUnread = notification && !notification.read
      
//       await notificationService.deleteNotification(notificationId)
//       dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId })
      
//       // Update unread count if the deleted notification was unread
//       if (wasUnread) {
//         dispatch({ type: 'SET_UNREAD_COUNT', payload: Math.max(0, state.unreadCount - 1) })
//       }
      
//       toast.success('Notification deleted')
//       return true
//     } catch (error) {
//       console.error('Error deleting notification:', error)
//       toast.error('Failed to delete notification')
//       return false
//     }
//   }

//   const deleteAllNotifications = async () => {
//     try {
//       await notificationService.deleteAllNotifications()
//       dispatch({ type: 'DELETE_ALL_NOTIFICATIONS' })
//       dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 })
//       toast.success('All notifications cleared')
//       return true
//     } catch (error) {
//       console.error('Error deleting all notifications:', error)
//       toast.error('Failed to clear notifications')
//       return false
//     }
//   }

//   const clearExpiredNotifications = async () => {
//     try {
//       await notificationService.clearExpired()
//       // Reload notifications after clearing expired ones
//       await loadNotifications()
//       await loadUnreadCount()
//       toast.success('Expired notifications cleared')
//       return true
//     } catch (error) {
//       console.error('Error clearing expired notifications:', error)
//       toast.error('Failed to clear expired notifications')
//       return false
//     }
//   }

//   const value = {
//     notifications: state.notifications,
//     unreadCount: state.unreadCount,
//     loading: state.loading,
//     loadNotifications,
//     addNotification,
//     markAsRead,
//     markAllAsRead,
//     deleteNotification,
//     deleteAllNotifications,
//     clearExpiredNotifications,
//     loadUnreadCount
//   }

//   return (
//     <NotificationContext.Provider value={value}>
//       {children}
//     </NotificationContext.Provider>
//   )
// }

// export const useNotifications = () => {
//   const context = useContext(NotificationContext)
//   if (!context) {
//     throw new Error('useNotifications must be used within a NotificationProvider')
//   }
//   return context
// }



