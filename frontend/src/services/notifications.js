import api from './api'

export const notificationService = {
  getNotifications: async (limit = 50, page = 1) => {
    try {
      const response = await api.get('/notifications', { 
        params: { limit, page } 
      })
      return response.data
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return { notifications: [] }
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`)
      return response.data
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.post('/notifications/read-all')
      return response.data
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  },

  deleteAllNotifications: async () => {
    try {
      const response = await api.delete('/notifications')
      return response.data
    } catch (error) {
      console.error('Error deleting all notifications:', error)
      throw error
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count')
      return response.data
    } catch (error) {
      console.error('Error loading unread count:', error)
      return { count: 0 }
    }
  }
}









// import api from './api'

// export const notificationService = {
//   getNotifications: async (limit = 50, page = 1) => {
//     const response = await api.get('/notifications', { 
//       params: { limit, page } 
//     })
//     return response.data
//   },

//   markAsRead: async (notificationId) => {
//     const response = await api.patch(`/notifications/${notificationId}/read`)
//     return response.data
//   },

//   markAllAsRead: async () => {
//     const response = await api.post('/notifications/read-all')
//     return response.data
//   },

//   deleteNotification: async (notificationId) => {
//     const response = await api.delete(`/notifications/${notificationId}`)
//     return response.data
//   },

//   deleteAllNotifications: async () => {
//     const response = await api.delete('/notifications')
//     return response.data
//   },

//   getUnreadCount: async () => {
//     const response = await api.get('/notifications/unread-count')
//     return response.data
//   }
// }



