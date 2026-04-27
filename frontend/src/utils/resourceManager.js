// src/utils/resourceManager.js
class ResourceManager {
  constructor() {
    this.operations = new Map()
    this.timeouts = new Map()
  }

  // Debounced function calls to prevent too many operations
  debounce(key, fn, delay = 300) {
    return (...args) => {
      // Clear existing timeout
      if (this.timeouts.has(key)) {
        clearTimeout(this.timeouts.get(key))
      }

      // Set new timeout
      const timeoutId = setTimeout(() => {
        fn(...args)
        this.timeouts.delete(key)
      }, delay)

      this.timeouts.set(key, timeoutId)
    }
  }

  // Throttled function calls
  throttle(key, fn, limit = 1000) {
    return (...args) => {
      if (!this.operations.has(key)) {
        fn(...args)
        this.operations.set(key, Date.now())
        
        setTimeout(() => {
          this.operations.delete(key)
        }, limit)
      }
    }
  }

  // Cancel pending operation
  cancel(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key))
      this.timeouts.delete(key)
    }
  }

  // Clear all pending operations
  clearAll() {
    this.timeouts.forEach((timeoutId, key) => {
      clearTimeout(timeoutId)
    })
    this.timeouts.clear()
    this.operations.clear()
  }

  // Memory cleanup
  cleanup() {
    const now = Date.now()
    this.operations.forEach((timestamp, key) => {
      if (now - timestamp > 30000) { // 30 seconds
        this.operations.delete(key)
      }
    })
  }
}

export const resourceManager = new ResourceManager()

// Usage example:
// const debouncedSearch = resourceManager.debounce('search', searchFunction, 500)