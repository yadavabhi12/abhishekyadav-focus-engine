// src/utils/constants.js
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#10B981' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#EF4444' }
]

export const TASK_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  OVERDUE: 'overdue'
}

export const NOTIFICATION_TYPES = {
  ALARM: 'alarm',
  REMINDER: 'reminder',
  ASSIGNMENT: 'assignment',
  COMMENT: 'comment'
}

export const CATEGORY_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#EF4444', // red
  '#8B5CF6', // purple
  '#F59E0B', // orange
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16'  // lime
]

export const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#3B82F6', icon: 'Briefcase', productive: true },
  { name: 'Personal', color: '#10B981', icon: 'User', productive: true },
  { name: 'Health', color: '#EF4444', icon: 'Heart', productive: true },
  { name: 'Learning', color: '#8B5CF6', icon: 'BookOpen', productive: true },
  { name: 'Break', color: '#F59E0B', icon: 'Coffee', productive: false }
]