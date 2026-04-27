// src/contexts/AuthContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '../services/auth'
import { connectWebSocket } from '../services/websocket'

export const AuthContext = createContext()

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        user: action.payload.user, 
        token: action.payload.token,
        error: null 
      }
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload }
    case 'LOGOUT':
      return { ...state, user: null, token: null, error: null, loading: false }
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'RESTORE_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false
      }
    default:
      return state
  }
}

const initialState = {
  user: null,
  token: null,
  loading: true,
  error: null
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing auth on app load
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
       
        const storedAuth = localStorage.getItem('auth')
        
        if (storedAuth) {
          const authData = JSON.parse(storedAuth)
         
          
          const { user, token, expiry } = authData
          
          // Check if token is expired
          if (expiry && new Date().getTime() > expiry) {
            console.log('Token expired, removing from storage')
            localStorage.removeItem('auth')
            dispatch({ type: 'SET_LOADING', payload: false })
            return
          }
          
          if (user && token) {
            console.log('Found valid auth data, validating with server...')
            try {
              // Set auth immediately for better UX
              dispatch({ 
                type: 'RESTORE_AUTH', 
                payload: { user, token } 
              })
              
              // Verify token is still valid with backend (optional)
              // const response = await authService.getMe()
              // console.log('Token validation response:', response)
              
              // Connect WebSocket with valid token
              connectWebSocket(token)
              
              console.log('Auth restored successfully')
            } catch (error) {
              console.error('Token validation failed:', error)
              localStorage.removeItem('auth')
              dispatch({ type: 'SET_LOADING', payload: false })
            }
          } else {
            console.log('No valid user/token found in storage')
            dispatch({ type: 'SET_LOADING', payload: false })
          }
        } else {
          console.log('No auth data found in localStorage')
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Error loading stored auth:', error)
        localStorage.removeItem('auth')
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    checkExistingAuth()
  }, [])

  // Save auth to localStorage when it changes
  useEffect(() => {
    console.log('Auth state changed:', { 
      hasUser: !!state.user, 
      hasToken: !!state.token,
      user: state.user,
      token: state.token
    })
    
    if (state.user && state.token) {
      // Set token expiry (7 days from now)
      const expiry = new Date().getTime() + (7 * 24 * 60 * 60 * 1000)
      
      const authData = { 
        user: state.user, 
        token: state.token,
        expiry 
      }
      
      
      localStorage.setItem('auth', JSON.stringify(authData))
      
      // Connect WebSocket
      connectWebSocket(state.token)
    } else {
      console.log('Removing auth from localStorage')
      localStorage.removeItem('auth')
    }
  }, [state.user, state.token])

  const login = async (credentials) => {
    console.log('Login attempt with:', credentials)
    dispatch({ type: 'LOGIN_START' })
    try {
      const response = await authService.login(credentials)
      console.log('Login successful:', response)
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: response.user, 
          token: response.token 
        } 
      })
      return response
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      console.error('Login failed:', errorMessage)
      
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: errorMessage
      })
      throw error
    }
  }

  const register = async (userData) => {
    console.log('Register attempt with:', userData)
    dispatch({ type: 'LOGIN_START' })
    try {
      const response = await authService.register(userData)
      console.log('Register successful:', response)
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: response.user, 
          token: response.token 
        } 
      })
      return response
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed'
      console.error('Register failed:', errorMessage)
      
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: errorMessage
      })
      throw error
    }
  }

  const logout = () => {
    console.log('Logging out user')
    localStorage.removeItem('auth')
    dispatch({ type: 'LOGOUT' })
  }

  const updateUser = (userData) => {
    console.log('Updating user data:', userData)
    dispatch({ type: 'UPDATE_USER', payload: userData })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateUser,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}











// import { createContext, useContext, useEffect, useReducer } from 'react'
// import { authService } from '../services/auth'
// import { connectWebSocket, disconnectWebSocket } from '../services/websocket'

// // Create context with default value
// exportconst AuthContext = createContext()

// const authReducer = (state, action) => {
//   switch (action.type) {

//     case 'SET_LOADING':
//       return { ...state, loading: action.payload }
//     case 'SET_USER':
//       return { ...state, user: action.payload, loading: false }
//     case 'LOGOUT':
//       return { ...state, user: null, loading: false }
//     case 'UPDATE_USER':
//       return { ...state, user: { ...state.user, ...action.payload } }
//     default:
//       return state
//   }
// }

// const initialState = {
//   user: null,
//   loading: true,
// }

// export const AuthProvider = ({ children }) => {
//   const [state, dispatch] = useReducer(authReducer, initialState)

//   useEffect(() => {
//     const initAuth = async () => {
//       const token = localStorage.getItem('token')
//       const savedUser = localStorage.getItem('user')

//       if (token && savedUser) {
//         try {
//           const userData = JSON.parse(savedUser)
//           dispatch({ type: 'SET_USER', payload: userData })
          
//           // Connect WebSocket
//           connectWebSocket(token)
//         } catch (error) {
//           console.error('Error parsing saved user:', error)
//           logout()
//         }
//       } else {
//         dispatch({ type: 'SET_LOADING', payload: false })
//       }
//     }

//     initAuth()
//   }, [])

//   const login = async (credentials) => {
//     try {
//       const { token, user } = await authService.login(credentials)
//       localStorage.setItem('token', token)
//       localStorage.setItem('user', JSON.stringify(user))
//       dispatch({ type: 'SET_USER', payload: user })
      
//       // Connect WebSocket
//       connectWebSocket(token)
      
//       return { success: true }
//     } catch (error) {
//       return { success: false, error: error.response?.data?.error || 'Login failed' }
//     }
//   }

//   const register = async (userData) => {
//     try {
//       const { token, user } = await authService.register(userData)
//       localStorage.setItem('token', token)
//       localStorage.setItem('user', JSON.stringify(user))
//       dispatch({ type: 'SET_USER', payload: user })
      
//       // Connect WebSocket
//       connectWebSocket(token)
      
//       return { success: true }
//     } catch (error) {
//       return { success: false, error: error.response?.data?.error || 'Registration failed' }
//     }
//   }

//   const logout = () => {
//     localStorage.removeItem('token')
//     localStorage.removeItem('user')
//     dispatch({ type: 'LOGOUT' })
    
//     // Disconnect WebSocket
//     disconnectWebSocket()
//   }

//   const updateProfile = async (profileData) => {
//     try {
//       const { user } = await authService.updateProfile(profileData)
//       localStorage.setItem('user', JSON.stringify(user))
//       dispatch({ type: 'UPDATE_USER', payload: user })
//       return { success: true }
//     } catch (error) {
//       return { success: false, error: error.response?.data?.error || 'Update failed' }
//     }
//   }

//   const updateSettings = async (settings) => {
//     try {
//       const { user } = await authService.updateSettings(settings)
//       localStorage.setItem('user', JSON.stringify(user))
//       dispatch({ type: 'UPDATE_USER', payload: user })
//       return { success: true }
//     } catch (error) {
//       return { success: false, error: error.response?.data?.error || 'Update failed' }
//     }
//   }

//   const uploadPhoto = async (file) => {
//     try {
//       const { user, photoUrl } = await authService.uploadPhoto(file)
//       const updatedUser = { ...user, photoUrl }
//       localStorage.setItem('user', JSON.stringify(updatedUser))
//       dispatch({ type: 'UPDATE_USER', payload: updatedUser })
//       return { success: true, photoUrl }
//     } catch (error) {
//       return { success: false, error: error.response?.data?.error || 'Upload failed' }
//     }
//   }

//   const value = {
//     user: state.user,
//     loading: state.loading,
//     login,
//     register,
//     logout,
//     updateProfile,
//     updateSettings,
//     uploadPhoto,
//   }

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }

// // Export the custom hook
// export const useAuth = () => {
//   const context = useContext(AuthContext)
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }