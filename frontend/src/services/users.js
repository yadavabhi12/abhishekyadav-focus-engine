// services/users.js
import api from './api';

export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/me', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Update user settings
  updateSettings: async (settingsData) => {
    try {
      const response = await api.put('/users/me/settings', settingsData);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  // Upload profile photo (avatar)
  uploadPhoto: async (file) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/users/me/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  },

  // Upload cover photo (banner)
  uploadCover: async (file) => {
    try {
      const formData = new FormData();
      formData.append('cover', file);

      const response = await api.post('/users/me/cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading cover:', error);
      throw error;
    }
  },
removeCategoryTime: async (categoryId, minutes) => {
    try {
      const response = await api.post('/users/me/remove-category-time', {
        categoryId,
        minutes
      });
      return response.data;
    } catch (error) {
      console.error('Error removing category time:', error);
      throw error;
    }
  },
  // Get user timeline
  getTimeline: async (range = '7') => {
    try {
      const response = await api.get(`/users/timeline?range=${range}`);
      return response.data;
    } catch (error) {
      console.error('Error getting timeline:', error);
      throw error;
    }
  },

  getAchievements: async () => {
    try {
      const response = await api.get('/users/me/achievements');
      return response.data;
    } catch (error) {
      console.error('Error getting achievements:', error);
      // Return default achievements if API fails
      return {
        achievements: [
          {
            name: 'Daily Focus',
            description: 'Complete 2 hours of focused work today',
            progress: 0,
            completed: false,
            icon: '⏰',
            points: 10
          },
          {
            name: 'Focus Sessions',
            description: 'Complete 4 focus sessions today',
            progress: 0,
            completed: false,
            icon: '🎯',
            points: 15
          },
          {
            name: 'Weekly Goal',
            description: 'Reach your weekly goal of 20 hours',
            progress: 0,
            completed: false,
            icon: '🏆',
            points: 25
          }
        ]
      };
    }
  },
  
  

  // Get focus stats
  getFocusStats: async () => {
    try {
      const response = await api.get('/users/me/focus-stats');
      return response.data;
    } catch (error) {
      console.error('Error getting focus stats:', error);
      throw error;
    }
  }
,updateCategoryTime: async (categoryId, minutes, taskCompleted = false) => {
    try {
      const response = await api.post('/users/me/category-time', {
        categoryId,
        minutes,
        taskCompleted
      });
      return response.data;
    } catch (error) {
      console.error('Error updating category time:', error);
      throw error;
    }
  },
  
  updateFocusStats: async (date, updates) => {
    try {
      const response = await api.post('/users/me/focus-stats', {
        date,
        updates
      });
      return response.data;
    } catch (error) {
      console.error('Error updating focus stats:', error);
      throw error;
    }
  },
  
  getCategoryStats: async () => {
    try {
      const response = await api.get('/users/me/category-stats');
      return response.data;
    } catch (error) {
      console.error('Error getting category stats:', error);
      throw error;
    }
  }, 
  
};








// // services/users.js
// import api from './api'

// export const userService = {
//   getProfile: async () => {
//     try {
//       const response = await api.get('/users/me')
//       return response.data
//     } catch (error) {
//       console.error('Error getting user profile:', error)
//       throw error
//     }
//   },

//   updateProfile: async (profileData) => {
//     try {
//       const response = await api.put('/users/me', profileData)
//       return response.data

       
//     } catch (error) {
//       console.error('Error updating profile:', error)
//       throw error
//     }
//   },

//   // services/users.js - Add this function
// uploadCover: async (file) => {
//   try {
//     const formData = new FormData()
//     formData.append('cover', file)
    
//     const response = await api.post('/users/me/cover', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       }
//     })
//     return response.data
//   } catch (error) {
//     console.error('Error uploading cover:', error)
//     throw error
//   }
// },
//   updateSettings: async (settingsData) => {
//     try {
//       const response = await api.put('/users/me/settings', settingsData)
//       return response.data
//       console.log('setting \n\n =',response.data)
//     } catch (error) {
//       console.error('Error updating settings:', error)
//       throw error
//     }
//   },

//   uploadPhoto: async (file) => {
//     try {
//       const formData = new FormData()
//       formData.append('photo', file)
      
//       const response = await api.post('/users/me/photo', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data'
//         }
//       })
//       return response.data
//       console.log(response.data)
//     } catch (error) {
//       console.error('Error uploading photo:', error)
//       throw error
//     }
//   },

//   getTimeline: async (range = '7') => {
//     try {
//       const response = await api.get('/users/timeline', { params: { range } })
//       return response.data
//     } catch (error) {
//       console.error('Error getting timeline:', error)
//       throw error
//     }
//   },

//   getAchievements: async () => {
//     try {
//       const response = await api.get('/users/me/achievements')
//       return response.data
//     } catch (error) {
//       console.error('Error getting achievements:', error)
//       throw error
//     }
//   }
//   ,
// }