// contexts/WebSocketContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { connectWebSocket, disconnectWebSocket, getSocket, isConnected } from '../services/websocket'

const WebSocketContext = createContext()

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const { user, token } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (user && token) {
      connect()
      
      return () => {
        disconnect()
      }
    } else {
      // If user logs out, disconnect
      disconnect()
    }
  }, [user, token])

  const connect = () => {
    try {
      const socket = connectWebSocket(token)
      
      if (socket) {
        socket.on('connect', () => {
          console.log('✅ Connected to WebSocket server')
          setIsConnected(true)
          setConnectionStatus('connected')
          reconnectAttemptsRef.current = 0
        })

        socket.on('disconnect', (reason) => {
          console.log('❌ Disconnected from WebSocket server:', reason)
          setIsConnected(false)
          setConnectionStatus('disconnected')
          
          // Attempt to reconnect for unexpected disconnections
          if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < maxReconnectAttempts) {
            setTimeout(() => {
              reconnectAttemptsRef.current += 1
              console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`)
              connect()
            }, 2000 * reconnectAttemptsRef.current) // Exponential backoff
          }
        })

        socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error)
          setConnectionStatus('error')
          
          // Retry connection on error
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            setTimeout(() => {
              reconnectAttemptsRef.current += 1
              console.log(`Retrying connection after error (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`)
              connect()
            }, 3000)
          }
        })

        socket.on('error', (error) => {
          console.error('WebSocket error:', error)
        })
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      setConnectionStatus('error')
    }
  }

  const disconnect = () => {
    disconnectWebSocket()
    setIsConnected(false)
    setConnectionStatus('disconnected')
    reconnectAttemptsRef.current = 0
  }

  const reconnect = () => {
    reconnectAttemptsRef.current = 0
    disconnect()
    setTimeout(() => connect(), 1000)
  }

  const value = {
    socket: getSocket(),
    isConnected,
    connectionStatus,
    reconnect,
    disconnect
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}



