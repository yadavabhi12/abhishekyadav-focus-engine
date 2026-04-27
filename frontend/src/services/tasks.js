// services/tasks.js (Fixed with proper version handling)
import api from './api'

export const taskService = {
   getTasks: async (params = {}) => {
    try {
      const response = await api.get('/tasks', { params })
      return response.data
    } catch (error) {
      console.error('Error getting tasks:', error)
      throw error
    }
  },

  getTaskStats: async (range = '30') => {
    try {
      const response = await api.get(`/tasks/stats/overview?range=${range}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task stats:', error);
      throw error;
    }
  },

  getTask: async (id) => {
    try {
      const response = await api.get(`/tasks/${id}`)
      return response.data
    } catch (error) {
      console.error('Error getting task:', error)
      throw error
    }
  },

  createTask: async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData)
      return response.data
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  },
updateTask: async (id, taskData, maxRetries = 3) => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        // First, get the latest version of the task
        const latestTaskResponse = await api.get(`/tasks/${id}`)
        const latestTask = latestTaskResponse.data.task
        
        // Merge the changes with the latest version
        const updatedTaskData = {
          ...taskData,
          __v: latestTask.__v // Use the latest version
        }
        
        const response = await api.put(`/tasks/${id}`, updatedTaskData)
        return response.data
      } catch (error) {
        retries++;
        
        if (error.response?.status === 409 && retries < maxRetries) {
          // Version conflict - wait a bit and retry
          console.log(`Version conflict, retrying (${maxRetries - retries} attempts left)...`)
          await new Promise(resolve => setTimeout(resolve, 500 * retries)); // Exponential backoff
          continue;
        }
        
        if (error.response?.status === 409) {
          throw new Error('VERSION_CONFLICT')
        }
        throw error
      }
    }
    
    throw new Error('VERSION_CONFLICT')
  },
  deleteTask: async (id) => {
    try {
      const response = await api.delete(`/tasks/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  },

  toggleComplete: async (id) => {
    try {
      const response = await api.post(`/tasks/${id}/complete`)
      return response.data
    } catch (error) {
      console.error('Error toggling task completion:', error)
      throw error
    }
  },

  setAlarm: async (id, alarmData) => {
    try {
      const response = await api.post(`/tasks/${id}/alarm`, alarmData)
      return response.data
    } catch (error) {
      console.error('Error setting alarm:', error)
      throw error
    }
  },

  snoozeAlarm: async (id, minutes) => {
    try {
      const response = await api.post(`/tasks/${id}/snooze`, { minutes })
      return response.data
    } catch (error) {
      console.error('Error snoozing alarm:', error)
      throw error
    }
  },

  shareTask: async (id, userEmail, permission = 'viewer') => {
    try {
      const response = await api.post(`/tasks/${id}/share`, {
        userEmail,
        permission
      });
      return response.data;
    } catch (error) {
      console.error('Error sharing task:', error);
      throw error;
    }
  },

  assignTask: async (id, userEmail) => {
    try {
      const response = await api.post(`/tasks/${id}/assign`, { userEmail })
      return response.data
    } catch (error) {
      console.error('Error assigning task:', error)
      throw error
    }
  },

  addSubtask: async (id, title) => {
    try {
      const response = await api.post(`/tasks/${id}/subtasks`, { title })
      return response.data
    } catch (error) {
      console.error('Error adding subtask:', error)
      throw error
    }
  },

  updateSubtask: async (id, subtaskId, data) => {
    try {
      const response = await api.put(`/tasks/${id}/subtasks/${subtaskId}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating subtask:', error)
      throw error
    }
  },

  deleteSubtask: async (id, subtaskId) => {
    try {
      const response = await api.delete(`/tasks/${id}/subtasks/${subtaskId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting subtask:', error)
      throw error
    }
  },

  getStats: async (range = '30') => {
    try {
      const response = await api.get('/tasks/stats', { params: { range } })
      return response.data
    } catch (error) {
      console.error('Error getting stats:', error)
      throw error
    }
  }
}








// // src/services/tasks.js
// import api from './api'

// export const taskService = {
//   getTasks: async (params = {}) => {
//     try {
//       const response = await api.get('/tasks', { params })
//       return response.data
//     } catch (error) {
//       console.error('Error getting tasks:', error)
//       throw error
//     }
//   },

//    getTaskStats: async (range = '30') => {
//     try {
//       const response = await api.get(`/tasks/stats/overview?range=${range}`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching task stats:', error);
//       throw error;
//     }
//   },

//   getTask: async (id) => {
//     try {
//       const response = await api.get(`/tasks/${id}`)
//       return response.data
//     } catch (error) {
//       console.error('Error getting task:', error)
//       throw error
//     }
//   },

//   createTask: async (taskData) => {
//     try {
//       const response = await api.post('/tasks', taskData)
//       return response.data
//     } catch (error) {
//       console.error('Error creating task:', error)
//       throw error
//     }
//   },

//   updateTask: async (id, taskData) => {
//     try {
//       const response = await api.put(`/tasks/${id}`, taskData)
//       return response.data
//     } catch (error) {
//       console.error('Error updating task:', error)
//       throw error
//     }
//   },

//   deleteTask: async (id) => {
//     try {
//       const response = await api.delete(`/tasks/${id}`)
//       return response.data
//     } catch (error) {
//       console.error('Error deleting task:', error)
//       throw error
//     }
//   },

//   toggleComplete: async (id) => {
//     try {
//       const response = await api.post(`/tasks/${id}/complete`)
//       return response.data
//     } catch (error) {
//       console.error('Error toggling task completion:', error)
//       throw error
//     }
//   },

//   setAlarm: async (id, alarmData) => {
//     try {
//       const response = await api.post(`/tasks/${id}/alarm`, alarmData)
//       return response.data
//     } catch (error) {
//       console.error('Error setting alarm:', error)
//       throw error
//     }
//   },

//   snoozeAlarm: async (id, minutes) => {
//     try {
//       const response = await api.post(`/tasks/${id}/snooze`, { minutes })
//       return response.data
//     } catch (error) {
//       console.error('Error snoozing alarm:', error)
//       throw error
//     }
//   },

//   // shareTask: async (id, userEmail, permission) => {
//   //   try {
//   //     const response = await api.post(`/tasks/${id}/share`, { userEmail, permission })
//   //     return response.data
//   //   } catch (error) {
//   //     console.error('Error sharing task:', error)
//   //     throw error
//   //   }
//   // },

//    shareTask: async (id, userEmail, permission = 'viewer') => {
//     try {
//       const response = await api.post(`/tasks/${id}/share`, {
//         userEmail,
//         permission
//       });
//       return response.data;
//     } catch (error) {
//       console.error('Error sharing task:', error);
//       throw error;
//     }
//   },
//   assignTask: async (id, userEmail) => {
//     try {
//       const response = await api.post(`/tasks/${id}/assign`, { userEmail })
//       return response.data
//     } catch (error) {
//       console.error('Error assigning task:', error)
//       throw error
//     }
//   },

//   addSubtask: async (id, title) => {
//     try {
//       const response = await api.post(`/tasks/${id}/subtasks`, { title })
//       return response.data
//     } catch (error) {
//       console.error('Error adding subtask:', error)
//       throw error
//     }
//   },

//   updateSubtask: async (id, subtaskId, data) => {
//     try {
//       const response = await api.put(`/tasks/${id}/subtasks/${subtaskId}`, data)
//       return response.data
//     } catch (error) {
//       console.error('Error updating subtask:', error)
//       throw error
//     }
//   },

//   deleteSubtask: async (id, subtaskId) => {
//     try {
//       const response = await api.delete(`/tasks/${id}/subtasks/${subtaskId}`)
//       return response.data
//     } catch (error) {
//       console.error('Error deleting subtask:', error)
//       throw error
//     }
//   },

//   getStats: async (range = '30') => {
//     try {
//       const response = await api.get('/tasks/stats', { params: { range } })
//       return response.data
//     } catch (error) {
//       console.error('Error getting stats:', error)
//       throw error
//     }
//   }
// }