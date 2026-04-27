// src/components/DebugLocalStorage.jsx
import { useEffect } from 'react'

const DebugLocalStorage = () => {
  useEffect(() => {
    // Log localStorage changes for debugging
    const logStorageChanges = () => {
      const authData = localStorage.getItem('auth')
      console.log('LocalStorage auth data:', authData)
    }

    // Check initially
    logStorageChanges()

    // Check every 2 seconds for debugging
    const interval = setInterval(logStorageChanges, 2000)

    return () => clearInterval(interval)
  }, [])

  return null
}

export default DebugLocalStorage