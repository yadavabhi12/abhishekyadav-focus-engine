// src/services/quotes.js
import api from './api'

export const quoteService = {
  getQuotes: async () => {
    try {
      const response = await api.get('/quotes')
      return response.data
    } catch (error) {
      console.error('Error getting quotes:', error)
      throw error
    }
  },

  createQuote: async (quoteData) => {
    try {
      const response = await api.post('/quotes', quoteData)
      return response.data
    } catch (error) {
      console.error('Error creating quote:', error)
      throw error
    }
  },

  updateQuote: async (id, quoteData) => {
    try {
      const response = await api.put(`/quotes/${id}`, quoteData)
      return response.data
    } catch (error) {
      console.error('Error updating quote:', error)
      throw error
    }
  },

  deleteQuote: async (id) => {
    try {
      const response = await api.delete(`/quotes/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting quote:', error)
      throw error
    }
  },
}


// // src/services/quotes.js
// import api from './api'

// export const quoteService = {
//   getQuotes: async () => {
//     const response = await api.get('/quotes') // Remove the duplicate /api/v1
//     return response.data
//   },

//   createQuote: async (quoteData) => {
//     const response = await api.post('/quotes', quoteData)
//     return response.data
//   },

//   updateQuote: async (id, quoteData) => {
//     const response = await api.put(`/quotes/${id}`, quoteData)
//     return response.data
//   },

//   deleteQuote: async (id) => {
//     const response = await api.delete(`/quotes/${id}`)
//     return response.data
//   },
// }