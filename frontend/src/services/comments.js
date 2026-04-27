import api from './api'

export const commentService = {
  getComments: async (taskId) => {
    const response = await api.get(`/api/v1/comments/task/${taskId}`)
    return response.data
  },

  createComment: async (taskId, commentData) => {
    const response = await api.post(`/api/v1/comments/task/${taskId}`, commentData)
    return response.data
  },

  addReaction: async (commentId, emoji) => {
    const response = await api.post(`/api/v1/comments/${commentId}/reactions`, { emoji })
    return response.data
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/api/v1/comments/${commentId}`)
    return response.data
  },
}