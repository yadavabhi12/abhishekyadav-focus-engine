// src/components/AutoLogout.jsx
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const AutoLogout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return

    // Check token expiry every 30 seconds
    const checkTokenExpiry = () => {
      try {
        const storedAuth = localStorage.getItem('auth')
        if (storedAuth) {
          const { expiry } = JSON.parse(storedAuth)
          
          // Check if token is expired
          if (expiry && Date.now() > expiry) {
            console.log('Token expired, logging out')
            logout()
            toast.error('Session expired. Please login again.')
            navigate('/login', { 
              state: { message: 'Session expired. Please login again.' },
              replace: true 
            })
          }
        }
      } catch (error) {
        console.error('Error checking token expiry:', error)
      }
    }

    // Check immediately on mount
    checkTokenExpiry()

    // Set up interval for periodic checking
    const interval = setInterval(checkTokenExpiry, 30000) // Check every 30 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [user, logout, navigate])

  return null
}

export default AutoLogout