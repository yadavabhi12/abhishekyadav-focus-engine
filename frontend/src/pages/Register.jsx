// src/pages/Register.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Eye, 
  EyeOff, 
  UserPlus,
  Mail,
  Lock,
  User,
  CheckCircle,
  AlertCircle,
  Shield,
  Sparkles,
  ArrowRight,
  FileText
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const Register = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setUserData(prev => ({
      ...prev,
      [name]: value
    }))

    // Calculate password strength when password changes
    if (name === 'password') {
      calculatePasswordStrength(value)
    }
  }

  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 6) strength += 25
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    setPasswordStrength(Math.min(strength, 100))
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500'
    if (passwordStrength < 50) return 'bg-orange-500'
    if (passwordStrength < 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Very Weak'
    if (passwordStrength < 50) return 'Weak'
    if (passwordStrength < 75) return 'Medium'
    if (passwordStrength < 100) return 'Strong'
    return 'Very Strong'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!userData.name || !userData.email || !userData.password || !userData.confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (userData.password !== userData.confirmPassword) {
      toast.error('Passwords do not match', {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      })
      return
    }

    if (userData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (!termsAccepted) {
      toast.error('Please accept the Terms and Conditions')
      return
    }

    setIsLoading(true)

    try {
      const response = await register({
        name: userData.name,
        email: userData.email,
        password: userData.password
      })
      
      if (response && response.user) {
        toast.success('Account created successfully! 🎉', {
          icon: '🎉',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
          duration: 4000,
        })
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header Card */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 transform hover:scale-[1.02] transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-16 w-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform duration-300 shadow-lg">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
              Join Our Community
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create your account and start your journey
            </p>
          </div>

          {/* Benefits Tags */}
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle className="h-3 w-3 mr-1" /> Free Access
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              <Shield className="h-3 w-3 mr-1" /> Secure
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              <Sparkles className="h-3 w-3 mr-1" /> Lifetime
            </span>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 inline-flex items-center group"
              >
                Sign in here
                <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={userData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                           placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white 
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                           dark:bg-gray-700 dark:focus:ring-green-500 transition-all duration-200
                           hover:border-green-400 dark:hover:border-green-500"
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={userData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                           placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white 
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                           dark:bg-gray-700 dark:focus:ring-green-500 transition-all duration-200
                           hover:border-green-400 dark:hover:border-green-500"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={userData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                           placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white 
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                           dark:bg-gray-700 dark:focus:ring-green-500 transition-all duration-200
                           hover:border-green-400 dark:hover:border-green-500"
                  placeholder="Create a password (min. 6 characters)"
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
              
              {/* Password Strength Indicator */}
              {userData.password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-xs font-medium text-gray-600 dark:text-gray-400">
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <ul className="grid grid-cols-2 gap-1 text-xs">
                    <li className={`flex items-center ${userData.password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Min. 6 chars
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(userData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Uppercase
                    </li>
                    <li className={`flex items-center ${/[0-9]/.test(userData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Number
                    </li>
                    <li className={`flex items-center ${/[^A-Za-z0-9]/.test(userData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Special char
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={userData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-xl 
                           placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white 
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                           dark:bg-gray-700 dark:focus:ring-green-500 transition-all duration-200
                           hover:border-green-400 dark:hover:border-green-500
                           ${userData.confirmPassword && userData.password !== userData.confirmPassword 
                             ? 'border-red-500 dark:border-red-500' 
                             : userData.confirmPassword && userData.password === userData.confirmPassword
                             ? 'border-green-500 dark:border-green-500'
                             : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                  )}
                </button>
              </div>
              {userData.confirmPassword && userData.password !== userData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Passwords do not match
                </p>
              )}
              {userData.confirmPassword && userData.password === userData.confirmPassword && userData.password && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded 
                           dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-green-600
                           transition-colors duration-200 cursor-pointer"
                  disabled={isLoading}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                  I agree to the{' '}
                  <a 
                    href="#" 
                    className="text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 font-medium hover:underline"
                  >
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a 
                    href="#" 
                    className="text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 font-medium hover:underline"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !termsAccepted}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent 
                         text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-blue-600 
                         hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed
                         transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <span className="flex items-center">
                    Create Account
                    <ArrowRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>

            {/* Security Note */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                <Shield className="h-3 w-3 mr-1" />
                Your information is encrypted and secure
              </p>
            </div>
          </form>
        </div>

        {/* Additional Info Card */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Why join us?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Get access to exclusive features, personalized content, and connect with our community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register