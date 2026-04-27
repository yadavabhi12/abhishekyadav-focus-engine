





import React, { useState } from 'react'
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Flag, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Bell,
  User,
  Share2,
  Calendar
} from 'lucide-react'
import { useTasks } from '../../contexts/TaskContext'
import { format, formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

const TaskItem = ({ task, showDate, onEdit, onDelete, onSetAlarm, onShare }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { toggleComplete } = useTasks()

  const handleToggleComplete = async () => {
    try {
      await toggleComplete(task._id)
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const handleEdit = () => {
    setIsMenuOpen(false)
    onEdit?.(task)
  }

  const handleDelete = () => {
    setIsMenuOpen(false)
    onDelete?.(task._id)
  }

  const handleSetAlarm = () => {
    setIsMenuOpen(false)
    onSetAlarm?.(task)
  }

  const handleShare = () => {
    setIsMenuOpen(false)
    onShare?.(task)
  }

  const priorityColors = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
  }

  const priorityIcons = {
    urgent: <Flag className="h-3 w-3 fill-red-500 text-red-500" />,
    high: <Flag className="h-3 w-3 fill-orange-500 text-orange-500" />,
    medium: <Flag className="h-3 w-3 fill-yellow-500 text-yellow-500" />,
    low: <Flag className="h-3 w-3 fill-green-500 text-green-500" />
  }

  return (
    <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/60 dark:border-gray-700/60 hover:shadow-lg hover:border-blue-200/50 dark:hover:border-blue-600/30 transition-all duration-300 hover:scale-[1.02]">
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <button 
            onClick={handleToggleComplete} 
            className={clsx(
              "flex-shrink-0 mt-0.5 transition-all duration-200 transform hover:scale-110",
              task.completed 
                ? "text-green-500 hover:text-green-600" 
                : "text-gray-400 hover:text-blue-500"
            )}
            disabled={!toggleComplete}
          >
            {task.completed ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={clsx(
                'text-sm font-semibold truncate', 
                task.completed && 'line-through text-gray-500 dark:text-gray-400'
              )}>
                {task.title}
              </h3>
              
              {task.priority && task.priority !== 'medium' && (
                <span className={clsx(
                  'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                  priorityColors[task.priority]
                )}>
                  {priorityIcons[task.priority]}
                  {task.priority}
                </span>
              )}
            </div>

            {task.description && (
              <p className={clsx(
                'text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2',
                task.completed && 'line-through'
              )}>
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {showDate && task.date && (
                <span className={clsx(
                  'flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-full',
                  task.completed && 'line-through'
                )}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.date), 'MMM dd')}
                </span>
              )}

              {task.startTime && (
                <span className={clsx(
                  'flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-full',
                  task.completed && 'line-through'
                )}>
                  <Clock className="h-3 w-3" />
                  {task.startTime}
                </span>
              )}

              {task.estimatedMinutes > 0 && (
                <span className={clsx(
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full',
                  task.completed && 'line-through'
                )}>
                  {Math.ceil(task.estimatedMinutes / 60)}h
                </span>
              )}

              {task.alarm?.enabled && (
                <span className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full">
                  <Bell className="h-3 w-3" />
                  {task.alarm.time}
                </span>
              )}

              {task.assignedTo && (
                <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                  <User className="h-3 w-3" />
                  Assigned
                </span>
              )}
            </div>

            {task.category && (
              <div className="mt-2">
                <span 
                  className={clsx(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    task.completed && 'opacity-70'
                  )}
                  style={{ 
                    backgroundColor: `${task.category.color || '#3B82F6'}20`, 
                    color: task.category.color || '#3B82F6',
                    border: `1px solid ${task.category.color || '#3B82F6'}30`
                  }}
                >
                  {task.category.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {task.sharedWith?.length > 0 && (
            <div className="flex items-center text-xs text-gray-400 mr-2">
              <Share2 className="h-3 w-3 mr-1" />
              {task.sharedWith.length}
            </div>
          )}

          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 w-40 py-1 backdrop-blur-sm">
                <button 
                  onClick={handleEdit} 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" /> Edit
                </button>
                <button 
                  onClick={handleSetAlarm} 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" /> Set Alarm
                </button>
                <button 
                  onClick={handleShare} 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button 
                  onClick={handleDelete} 
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar for completed tasks */}
      {task.completed && (
        <div className="absolute inset-0 bg-green-500/5 rounded-2xl border-2 border-green-500/20 pointer-events-none" />
      )}
    </div>
  )
}

export default TaskItem