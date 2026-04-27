// src/services/auth.js
import api from './api'

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials, {
        timeout: 15000
      })
      return response.data
    } catch (error) {
      console.error('Auth service login error:', error)
      throw error
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      console.error('Auth service register error:', error)
      throw error
    }
  },

  getMe: async () => {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      console.error('Auth service getMe error:', error)
      throw error
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/me', userData)
      return response.data
    } catch (error) {
      console.error('Auth service updateProfile error:', error)
      throw error
    }
  },

  updateSettings: async (settingsData) => {
    try {
      const response = await api.put('/users/me/settings', settingsData)
      return response.data
    } catch (error) {
      console.error('Auth service updateSettings error:', error)
      throw error
    }
  },

  uploadPhoto: async (file) => {
    try {
      const formData = new FormData()
      formData.append('photo', file)
      
      const response = await api.post('/users/me/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      })
      return response.data
    } catch (error) {
      console.error('Auth service uploadPhoto error:', error)
      throw error
    }
  },

  // Token validation function
  validateToken: async (token) => {
    try {
      const response = await api.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Token validation error:', error)
      throw error
    }
  }
}







// // src/services/auth.js
// import api from './api'

// export const authService = {
//   login: async (credentials) => {
//     try {
//       const response = await api.post('/auth/login', credentials, {
//         timeout: 15000
//       })
//       return response.data
//     } catch (error) {
//       console.error('Auth service login error:', error)
//       throw error
//     }
//   },

//   register: async (userData) => {
//     try {
//       const response = await api.post('/auth/register', userData)
//       return response.data
//     } catch (error) {
//       console.error('Auth service register error:', error)
//       throw error
//     }
//   },

//   getMe: async () => {
//     try {
//       const response = await api.get('/auth/me')
//       return response.data
//     } catch (error) {
//       console.error('Auth service getMe error:', error)
//       throw error
//     }
//   },

//   updateProfile: async (userData) => {
//     try {
//       const response = await api.put('/users/me', userData)
//       return response.data
//     } catch (error) {
//       console.error('Auth service updateProfile error:', error)
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
//         },
//         timeout: 30000
//       })
//       return response.data
//     } catch (error) {
//       console.error('Auth service uploadPhoto error:', error)
//       throw error
//     }
//   },

//   // Token validation function
//   validateToken: async (token) => {
//     try {
//       const response = await api.get('/auth/validate', {
//         headers: {
//           Authorization: `Bearer ${token}`
//         }
//       })
//       return response.data
//     } catch (error) {
//       console.error('Token validation error:', error)
//       throw error
//     }
//   }
// }



