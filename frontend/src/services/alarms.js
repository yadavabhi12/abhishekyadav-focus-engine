// // src/services/alarms.js
// import api from './api'

// export const alarmService = {
//   // Get upcoming alarms
//   getUpcomingAlarms: async () => {
//     try {
//       const response = await api.get('/alarms/upcoming')
//       return response.data
//     } catch (error) {
//       // Don't throw error for unauthorized requests
//       if (error.response?.status === 401) {
//         return { alarms: [] }
//       }
//       console.error('Error getting upcoming alarms:', error)
//       throw error
//     }
//   },

//   // Get active alarms
//   getActiveAlarms: async () => {
//     try {
//       const response = await api.get('/alarms/active')
//       return response.data
//     } catch (error) {
//       console.error('Error getting active alarms:', error)
//       return { alarms: [] }
//     }
//   },

//   // Snooze alarm
//   snoozeAlarm: async (alarmId, minutes) => {
//     try {
//       const response = await api.post(`/alarms/${alarmId}/snooze`, { minutes })
//       return response.data
//     } catch (error) {
//       console.error('Error snoozing alarm:', error)
//       throw error
//     }
//   },

//   // Dismiss alarm
//   dismissAlarm: async (alarmId) => {
//     try {
//       const response = await api.post(`/alarms/${alarmId}/dismiss`)
//       return response.data
//     } catch (error) {
//       console.error('Error dismissing alarm:', error)
//       throw error
//     }
//   },

//   // Set alarm for task
//   setAlarm: async (taskId, alarmData) => {
//     try {
//       const response = await api.post(`/tasks/${taskId}/alarm`, alarmData)
//       return response.data
//     } catch (error) {
//       console.error('Error setting alarm:', error)
//       throw error
//     }
//   },

//   // Delete alarm
//   deleteAlarm: async (alarmId) => {
//     try {
//       const response = await api.delete(`/alarms/${alarmId}`)
//       return response.data
//     } catch (error) {
//       console.error('Error deleting alarm:', error)
//       throw error
//     }
//   },

//   // Get alarm by ID
//   getAlarm: async (alarmId) => {
//     try {
//       const response = await api.get(`/alarms/${alarmId}`)
//       return response.data
//     } catch (error) {
//       console.error('Error getting alarm:', error)
//       throw error
//     }
//   },

//   // Update alarm
//   updateAlarm: async (alarmId, alarmData) => {
//     try {
//       const response = await api.put(`/alarms/${alarmId}`, alarmData)
//       return response.data
//     } catch (error) {
//       console.error('Error updating alarm:', error)
//       throw error
//     }
//   },

//   // Get all alarms for user
//   getAllAlarms: async () => {
//     try {
//       const response = await api.get('/alarms')
//       return response.data
//     } catch (error) {
//       console.error('Error getting all alarms:', error)
//       return { alarms: [] }
//     }
//   }
// }





import api from './api'

export const alarmService = {
  getUpcomingAlarms: async () => {
    try {
      const response = await api.get('/alarms/upcoming')
      return response.data
    } catch (error) {
      console.error('Error fetching upcoming alarms:', error)
      return { alarms: [] }
    }
  },

  getActiveAlarms: async () => {
    try {
      const response = await api.get('/alarms/active')
      return response.data
    } catch (error) {
      console.error('Error fetching active alarms:', error)
      return { alarms: [] }
    }
  },

  setAlarm: async (taskId, alarmData) => {
    try {
      const response = await api.post(`/tasks/${taskId}/alarm`, alarmData)
      return response.data
    } catch (error) {
      console.error('Error setting alarm:', error)
      throw error
    }
  },

  snoozeAlarm: async (alarmId, minutes = 5) => {
    try {
      const response = await api.post(`/alarms/${alarmId}/snooze`, { minutes })
      return response.data
    } catch (error) {
      console.error('Error snoozing alarm:', error)
      throw error
    }
  },

  dismissAlarm: async (alarmId) => {
    try {
      const response = await api.post(`/alarms/${alarmId}/dismiss`)
      return response.data
    } catch (error) {
      console.error('Error dismissing alarm:', error)
      throw error
    }
  },

  deleteAlarm: async (alarmId) => {
    try {
      const response = await api.delete(`/alarms/${alarmId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting alarm:', error)
      throw error
    }
  },

  updateAlarm: async (alarmId, alarmData) => {
    try {
      const response = await api.put(`/alarms/${alarmId}`, alarmData)
      return response.data
    } catch (error) {
      console.error('Error updating alarm:', error)
      throw error
    }
  },

  // Test alarm function for development
  testAlarm: async (taskId) => {
    try {
      const response = await api.post(`/alarms/test/${taskId}`)
      return response.data
    } catch (error) {
      console.error('Error testing alarm:', error)
      throw error
    }
  }
}








