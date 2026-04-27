import { io } from 'socket.io-client'

let socket = null
const eventListeners = new Map()

export const connectWebSocket = (token) => {
  if (socket && socket.connected) {
    return socket
  }

  if (socket) {
    socket.disconnect()
  }

  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000'
    console.log('Connecting to WebSocket at:', baseURL)
    
    socket = io(baseURL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server')
      // Re-register all existing listeners
      eventListeners.forEach((listeners, event) => {
        listeners.forEach(listener => {
          socket.on(event, listener)
        })
      })
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
    })

    return socket
  } catch (error) {
    console.error('Failed to initialize WebSocket:', error)
    return null
  }
}

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('WebSocket disconnected')
  }
}

export const listenToEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback)
  }

  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set())
  }
  eventListeners.get(event).add(callback)
}

export const removeListener = (event, callback) => {
  if (socket && callback) {
    socket.off(event, callback)
  }

  if (eventListeners.has(event)) {
    if (callback) {
      eventListeners.get(event).delete(callback)
    } else {
      eventListeners.get(event).clear()
    }
  }
}

export const emitEvent = (event, data) => {
  if (socket) {
    socket.emit(event, data)
  }
}

export const getSocket = () => {
  return socket
}

export const isConnected = () => {
  return socket && socket.connected
}

export const getConnectionState = () => {
  return socket ? socket.connected ? 'connected' : 'disconnected' : 'not_initialized'
}




// import { io } from 'socket.io-client'

// let socket = null
// const eventListeners = new Map()

// export const connectWebSocket = (token) => {
//   if (socket && socket.connected) {
//     return socket
//   }

//   if (socket) {
//     socket.disconnect()
//   }

//   socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000', {
//     auth: {
//       token
//     },
//     transports: ['websocket', 'polling'],
//     reconnection: true,
//     reconnectionAttempts: 5,
//     reconnectionDelay: 1000,
//   })

//   socket.on('connect', () => {
//     console.log('✅ Connected to WebSocket server')
//     // Re-register all existing listeners
//     eventListeners.forEach((listeners, event) => {
//       listeners.forEach(listener => {
//         socket.on(event, listener)
//       })
//     })
//   })

//   socket.on('disconnect', (reason) => {
//     console.log('❌ Disconnected from WebSocket server:', reason)
//   })

//   socket.on('connect_error', (error) => {
//     console.error('WebSocket connection error:', error)
//   })

//   return socket
// }

// export const disconnectWebSocket = () => {
//   if (socket) {
//     socket.disconnect()
//     socket = null
//     console.log('WebSocket disconnected')
//   }
// }

// export const listenToEvent = (event, callback) => {
//   if (socket) {
//     socket.on(event, callback)
//   }

//   if (!eventListeners.has(event)) {
//     eventListeners.set(event, new Set())
//   }
//   eventListeners.get(event).add(callback)
// }

// export const removeListener = (event, callback) => {
//   if (socket && callback) {
//     socket.off(event, callback)
//   }

//   if (eventListeners.has(event)) {
//     if (callback) {
//       eventListeners.get(event).delete(callback)
//     } else {
//       eventListeners.get(event).clear()
//     }
//   }
// }

// export const emitEvent = (event, data) => {
//   if (socket) {
//     socket.emit(event, data)
//   }
// }

// export const getSocket = () => {
//   return socket
// }

// export const isConnected = () => {
//   return socket && socket.connected
// }

// export const getConnectionState = () => {
//   return socket ? socket.connected ? 'connected' : 'disconnected' : 'not_initialized'
// }


