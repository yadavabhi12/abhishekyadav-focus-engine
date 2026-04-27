import api from './api'

export const categoryService = {
  getCategories: async () => {
    const response = await api.get('/categories')
    return response.data
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData)
    return response.data
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData)
    return response.data
  },

  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`)
      return response.data
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Category is in use by tasks')
      }
      throw error
    }
  }
}




// // src/services/categories.js
// import api from './api'

// export const categoryService = {
//   getCategories: async () => {
//     const response = await api.get('/categories') // Fixed endpoint
//     return response.data
//   },

//   createCategory: async (categoryData) => {
//     const response = await api.post('/categories', categoryData) // Fixed endpoint
//     return response.data
//   },

//   updateCategory: async (id, categoryData) => {
//     const response = await api.put(`/categories/${id}`, categoryData) // Fixed endpoint
//     return response.data
//   },

//   deleteCategory: async (id) => {
//     const response = await api.delete(`/categories/${id}`) // Fixed endpoint
//     return response.data
//   }
// }

