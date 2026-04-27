// src/components/PrivateRoute.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocation, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const PrivateRoute = ({ children }) => {
  const { user, loading, validateSession } = useAuth()
  const location = useLocation()
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    // Validate session on route change if user exists
    if (user && !loading && validateSession) {
      const validate = async () => {
        setIsValidating(true)
        try {
          const isValid = await validateSession()
          if (!isValid) {
            // Session is invalid, will be handled by auth context
            console.log('Session validation failed')
          }
        } catch (error) {
          console.error('Session validation error:', error)
        } finally {
          setIsValidating(false)
        }
      }
      
      validate()
    }
  }, [user, loading, validateSession, location])

  if (loading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default PrivateRoute

