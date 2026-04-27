// services/api.js
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'
console.log('API Base URL:', API_BASE_URL)

// ----------------------------
// Request Queue & Concurrency
// ----------------------------
let activeRequests = 0
const MAX_CONCURRENT_REQUESTS = 6
const requestQueue = []

const processQueue = () => {
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const { config, resolve, reject } = requestQueue.shift()
    activeRequests++

    axios(config)
      .then(response => {
        activeRequests--
        resolve(response)
        processQueue()
      })
      .catch(error => {
        activeRequests--
        reject(error)
        processQueue()
      })
  }
}

// ----------------------------
// Axios Instance
// ----------------------------
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ----------------------------
// Request Interceptor
// ----------------------------
api.interceptors.request.use(
  (config) => {
    let token = null

    // From localStorage
    const authData = localStorage.getItem('auth')
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData)
        token = parsedAuth.token
      } catch (error) {
        console.error('Error parsing auth data:', error)
      }
    }

    // From URL (for password reset, etc.)
    if (!token) {
      const urlParams = new URLSearchParams(window.location.search)
      token = urlParams.get('token')
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Cache busting
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _: Date.now(),
      }
    }

    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url} (Active: ${activeRequests})`)
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// ----------------------------
// Response Interceptor
// ----------------------------
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`)
    return response
  },
  (error) => {
    console.error('API Error:', error)

    if (error.code === 'ECONNREFUSED') {
      toast.error('Cannot connect to server. Please make sure the backend is running.')
    } else if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('auth')
        window.location.href = '/login'
      }
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment.')
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error)
    } else if (error.message === 'Network Error') {
      toast.error('Network error - please check your connection')
    } else if (error.response?.status === 404) {
      console.error('API endpoint not found:', error.config.url)
    } else if (error.code === 'ERR_CANCELED') {
      console.log('Request canceled:', error.config.url)
    } else {
      toast.error('Something went wrong! Please try again.')
    }

    return Promise.reject(error)
  }
)

// ----------------------------
// Helpers
// ----------------------------

// Queued request
api.queuedRequest = (config) => {
  return new Promise((resolve, reject) => {
    const request = { config, resolve, reject }
    if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      requestQueue.push(request)
    } else {
      activeRequests++
      axios(config)
        .then(response => {
          activeRequests--
          resolve(response)
          processQueue()
        })
        .catch(error => {
          activeRequests--
          reject(error)
          processQueue()
        })
    }
  })
}

// Retry
api.retry = async (config, retries = 2, delay = 1000) => {
  try {
    return await api(config)
  } catch (error) {
    if (retries > 0 &&
        (error.code === 'ERR_NETWORK' ||
         error.code === 'ECONNREFUSED' ||
         error.response?.status >= 500)) {
      console.log(`Retrying request... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return api.retry(config, retries - 1, delay * 1.5)
    }
    throw error
  }
}

// Clear queue
api.clearQueue = () => {
  requestQueue.length = 0
  console.log('API request queue cleared')
}

// Cancel token
api.createCancelToken = () => {
  return axios.CancelToken.source()
}

// ----------------------------
// Cache System
// ----------------------------
api.cache = {
  store: new Map(),
  set(key, data, ttl = 30000) {
    this.store.set(key, { data, expiry: Date.now() + ttl })
  },
  get(key) {
    const item = this.store.get(key)
    if (!item) return null
    if (Date.now() > item.expiry) {
      this.store.delete(key)
      return null
    }
    return item.data
  },
  delete(key) {
    this.store.delete(key)
  },
  clear() {
    this.store.clear()
  },
}

// Cached GET
api.cachedGet = async (url, config = {}, ttl = 10000) => {
  const cacheKey = `${url}-${JSON.stringify(config.params || {})}`
  const cachedResponse = api.cache.get(cacheKey)

  if (cachedResponse) {
    console.log('Returning cached response for:', url)
    return cachedResponse
  }

  try {
    const response = await api.get(url, config)
    api.cache.set(cacheKey, response, ttl)
    return response
  } catch (error) {
    throw error
  }
}

export default api






// import axios from 'axios'
// import toast from 'react-hot-toast'

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

// console.log('API Base URL:', API_BASE_URL)

// // Request counter and queue for better resource management
// let activeRequests = 0
// const MAX_CONCURRENT_REQUESTS = 6
// const requestQueue = []

// // Cache for GET request
// const requestCache = new Map()

// const processQueue = () => {
//   while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
//     const { config, resolve, reject } = requestQueue.shift()
//     activeRequests++
    
//     // Use the original axios instance to make the request
//     axios(config)
//       .then(response => {
//         activeRequests--
//         resolve(response)
//         processQueue()
//       })
//       .catch(error => {
//         activeRequests--
//         reject(error)
//         processQueue()
//       })
//   }
// }

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 30000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// })

// // Enhanced request interceptor - FIXED
// api.interceptors.request.use(
//   (config) => {
//     // Try to get token from multiple sources
//     let token = null
    
//     // First try localStorage
//     const authData = localStorage.getItem('auth')
//     if (authData) {
//       try {
//         const parsedAuth = JSON.parse(authData)
//         token = parsedAuth.token
//       } catch (error) {
//         console.error('Error parsing auth data:', error)
//       }
//     }
    
//     // If no token in localStorage, check URL params (for password reset links, etc.)
//     if (!token) {
//       const urlParams = new URLSearchParams(window.location.search)
//       token = urlParams.get('token')
//     }

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`
//     }
    
//     // Add cache busting for GET requests
//     if (config.method === 'get') {
//       config.params = {
//         ...config.params,
//         _: Date.now() // Cache buster
//       }
//     }
    
//     console.log(`API Request: ${config.method?.toUpperCase()} ${config.url} (Active: ${activeRequests})`)
    
//     // Return the config directly instead of wrapping in a Promise
//     return config
//   },
//   (error) => {
//     console.error('Request interceptor error:', error)
//     return Promise.reject(error)
//   }
// )


// api.interceptors.response.use(
//   (response) => {
//     console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
//     return response;
//   },
//   (error) => {
//     console.error('API Error:', error);
    
//     // Handle specific error cases
//     if (error.code === 'ECONNREFUSED') {
//       toast.error('Cannot connect to server. Please make sure the backend is running.');
//     } 
//     else if (error.response?.status === 401) {
//       // Clear invalid auth data only if we're not already on login page
//       if (!window.location.pathname.includes('/login')) {
//         localStorage.removeItem('auth');
//         window.location.href = '/login';
//       }
//       // Don't show toast for 401 errors
//     } 
//     else if (error.response?.status === 429) {
//       toast.error('Too many requests. Please wait a moment.');
//     }
//     else if (error.response?.data?.error) {
//       toast.error(error.response.data.error);
//     } 
//     else if (error.message === 'Network Error') {
//       toast.error('Network error - please check your connection');
//     } 
//     else if (error.response?.status === 404) {
//       console.error('API endpoint not found:', error.config.url);
//       // Don't show toast for 404 errors
//     }
//     else if (error.code === 'ERR_CANCELED') {
//       console.log('Request canceled:', error.config.url);
//       // Don't show toast for canceled requests
//     }
//     else {
//       toast.error('Something went wrong! Please try again.');
//     }
    
//     return Promise.reject(error);
//   }
// );


// api.queuedRequest = (config) => {
//   return new Promise((resolve, reject) => {
//     const request = { config, resolve, reject }
    
//     if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
//       requestQueue.push(request)
//     } else {
//       activeRequests++
//       axios(config)
//         .then(response => {
//           activeRequests--
//           resolve(response)
//           processQueue()
//         })
//         .catch(error => {
//           activeRequests--
//           reject(error)
//           processQueue()
//         })
//     }
//   })
// }

// // Add retry mechanism for failed requests
// api.retry = async (config, retries = 2, delay = 1000) => {
//   try {
//     return await api(config)
//   } catch (error) {
//     if (retries > 0 && 
//         (error.code === 'ERR_NETWORK' || 
//          error.code === 'ECONNREFUSED' ||
//          error.response?.status >= 500)) {
//       console.log(`Retrying request... (${retries} attempts left)`)
//       await new Promise(resolve => setTimeout(resolve, delay))
//       return api.retry(config, retries - 1, delay * 1.5)
//     }
//     throw error
//   }
// }

// // Utility function to clear pending requests
// api.clearQueue = () => {
//   requestQueue.length = 0
//   console.log('API request queue cleared')
// }

// // Add request cancellation support
// api.createCancelToken = () => {
//   return axios.CancelToken.source()
// }

// // Add cache control helper
// api.cache = {
//   store: new Map(),
//   set(key, data, ttl = 30000) {
//     this.store.set(key, {
//       data,
//       expiry: Date.now() + ttl
//     })
//   },
//   get(key) {
//     const item = this.store.get(key)
//     if (!item) return null
    
//     if (Date.now() > item.expiry) {
//       this.store.delete(key)
//       return null
//     }
    
//     return item.data
//   },
//   delete(key) {
//     this.store.delete(key)
//   },
//   clear() {
//     this.store.clear()
//   }
// }

// // Cached GET requests to prevent excessive API calls
// api.cachedGet = async (url, config = {}, ttl = 10000) => {
//   const cacheKey = `${url}-${JSON.stringify(config.params || {})}`
//   const cachedResponse = api.cache.get(cacheKey)
  
//   if (cachedResponse) {
//     console.log('Returning cached response for:', url)
//     return cachedResponse
//   }
  
//   try {
//     const response = await api.get(url, config)
//     api.cache.set(cacheKey, response, ttl)
//     return response
//   } catch (error) {
//     throw error
//   }
// }

// export default api

