// src/hooks/useWebSocket.js
import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export const useWebSocket = () => {
  const socketRef = useRef(null)

  const connect = (token) => {
    if (socketRef.current) {
      disconnect()
    }

    try {
      socketRef.current = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      })

      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket server')
      })

      socketRef.current.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason)
      })

      socketRef.current.on('error', (error) => {
        console.error('WebSocket error:', error)
      })

    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  }

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    connect,
    disconnect,
    socket: socketRef.current
  }
}



// import { useEffect, useRef } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// import { useNotifications } from '../contexts/NotificationContext'
// import { connectWebSocket, disconnectWebSocket, getSocket } from '../services/websocket'
// import { ChatProvider } from '../contexts/ChatContext'
// const useWebSocket = () => {
//   const { user } = useAuth()
//   const { addNotification } = useNotifications()
//   const isConnected = useRef(false)

//   useEffect(() => {
//     if (user && !isConnected.current) {
//       const token = localStorage.getItem('token')
//       if (token) {
//         connectWebSocket(token)
//         isConnected.current = true

//         const socket = getSocket()
//         if (socket) {
//           socket.on('notification', (data) => {
//             addNotification(data)
//           })

//           socket.on('task-update', (data) => {
//             console.log('Task updated via WebSocket:', data)
//           })

//           socket.on('disconnect', () => {
//             console.log('WebSocket disconnected')
//             isConnected.current = false
//           })
//         }
//       }
//     }

//     return () => {
//       if (isConnected.current) {
//         disconnectWebSocket()
//         isConnected.current = false
//       }
//     }
//   }, [user, addNotification])

//   return { isConnected: isConnected.current }
// }

// export default useWebSocket