// src/utils/helpers.js
import { format, parseISO } from 'date-fns'

export const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return format(parseISO(dateString), 'MMM d, yyyy')
  } catch {
    return dateString
  }
}

export const formatTime = (timeString) => {
  if (!timeString) return ''
  try {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  } catch {
    return timeString
  }
}

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return '#EF4444'
    case 'medium': return '#F59E0B'
    case 'low': return '#10B981'
    default: return '#6B7280'
  }
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}