import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle,
  Mail,
  Lock,
  Sparkles,
  Shield,
  ArrowRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  
  const { user, login, error, clearError, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get return URL from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard'

  // Redirect if already logged in - FIXED: Add proper dependencies
  useEffect(() => {
    if (user && !loading) {
      navigate(from, { replace: true })
    }
  }, [user, loading, navigate, from])

  // Clear errors when component unmounts - FIXED: Only run once
  useEffect(() => {
    return () => {
      if (clearError) {
        clearError()
      }
    }
  }, []) // Empty dependency array to run only once

  const handleChange = (e) => {
    const { name, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!credentials.email || !credentials.password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    if (clearError) clearError()

    try {
      console.log('Attempting login with:', credentials)
      const response = await login(credentials)
      
      if (response && response.user) {
        toast.success('Welcome back!', {
          icon: '👋',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        })
        console.log('Login successful, navigating to:', from)
        navigate(from, { replace: true })
      }
    } catch (error) {
      console.error('Login failed:', error)
      // Error is already handled in the auth service and context
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center transform hover:scale-105 transition-transform duration-300">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Checking authentication...</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Please wait a moment</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center transform hover:scale-105 transition-transform duration-300">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-green-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Redirecting to dashboard...</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">You'll be redirected shortly</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transform hover:scale-[1.02] transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform duration-300 shadow-lg">
                  <LogIn className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to continue your journey
            </p>
          </div>

          {/* Features Tags */}
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              <Shield className="h-3 w-3 mr-1" /> Secure
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              <Sparkles className="h-3 w-3 mr-1" /> Fast
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <Mail className="h-3 w-3 mr-1" /> Easy
            </span>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              New here?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center group"
              >
                Create an account
                <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800 animate-shake">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Login Failed
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={credentials.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                             placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             dark:bg-gray-700 dark:focus:ring-blue-500 transition-all duration-200
                             hover:border-blue-400 dark:hover:border-blue-500"
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {credentials.email && !error && (
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={credentials.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                             placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             dark:bg-gray-700 dark:focus:ring-blue-500 transition-all duration-200
                             hover:border-blue-400 dark:hover:border-blue-500"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded 
                           dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-600
                           transition-colors duration-200 cursor-pointer"
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a 
                  href="#" 
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 
                           dark:hover:text-blue-300 inline-flex items-center group"
                >
                  Forgot password?
                  <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent 
                         text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 
                         hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                         transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span className="flex items-center">
                    Sign in
                    <ArrowRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>

            {/* Security Note */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                <Shield className="h-3 w-3 mr-1" />
                Your information is protected by 256-bit encryption
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login






