import { useState, useEffect } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths,
  subMonths,
  parseISO,
  isToday,
  isWeekend
} from 'date-fns'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Grid,
  List,
  Clock,
  AlertCircle,
  CheckCircle,
  Star,
  TrendingUp,
  Target
} from 'lucide-react'
import { useTasks } from '../contexts/TaskContext'
import { useAuth } from '../contexts/AuthContext'

import Button from '../components/ui/Button'
import TaskForm from '../components/tasks/TaskForm'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState('month') // 'month' or 'list'
  const [filterCompleted, setFilterCompleted] = useState(false)
  const { tasks, loading } = useTasks()
  const { user } = useAuth()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get tasks for specific date with filtering
  const getTasksForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return tasks.filter(task => {
      const matchesDate = task.date === dateStr
      const matchesFilter = filterCompleted ? !task.completed : true
      return matchesDate && matchesFilter
    })
  }

  // Navigation functions
  const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1))
  const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Stats calculations
  const completedTasks = tasks.filter(task => task.completed).length
  const pendingTasks = tasks.filter(task => !task.completed).length
  const highPriorityTasks = tasks.filter(task => task.priority === 'high' && !task.completed).length
  const todayTasks = tasks.filter(task => task.date === format(new Date(), 'yyyy-MM-dd')).length

  // Get color based on priority
  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }

  // Day cell classes
  const getDayClass = (day) => {
    let classes = 'h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200'
    
    if (!isSameMonth(day, currentDate)) {
      return `${classes} text-gray-400 dark:text-gray-600 opacity-60`
    }
    
    if (isToday(day)) {
      return `${classes} bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-110`
    }
    
    if (isWeekend(day)) {
      return `${classes} text-gray-500 dark:text-gray-400`
    }
    
    if (selectedDate && isSameDay(day, selectedDate)) {
      return `${classes} bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 ring-2 ring-blue-500`
    }
    
    return `${classes} text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer`
  }

  // Handle date selection
  const handleDateSelect = (day) => {
    if (isSameMonth(day, currentDate)) {
      setSelectedDate(day)
    }
  }

  // Quick actions
  const quickActions = [
    { label: 'Today', count: todayTasks, icon: Target, color: 'blue' },
    { label: 'Pending', count: pendingTasks, icon: Clock, color: 'yellow' },
    { label: 'Completed', count: completedTasks, icon: CheckCircle, color: 'green' },
    { label: 'High Priority', count: highPriorityTasks, icon: AlertCircle, color: 'red' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pb-20">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
                <CalendarIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {format(currentDate, 'MMMM yyyy')} • {tasks.length} tasks
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button variant="secondary" onClick={goToToday} size="sm">
                Today
              </Button>
              
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={viewMode === 'month' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className="px-3"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={() => setIsTaskFormOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{action.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{action.count}</p>
                </div>
                <div className={`p-2 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/40`}>
                  <action.icon className={`h-5 w-5 text-${action.color}-600 dark:text-${action.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar View */}
        {viewMode === 'month' && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                
                <Button
                  variant="ghost"
                  onClick={goToNextMonth}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={filterCompleted}
                    onChange={(e) => setFilterCompleted(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  Hide completed
                </label>
              </div>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-3 font-semibold"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {daysInMonth.map(day => {
                const dayTasks = getTasksForDate(day)
                const hasTasks = dayTasks.length > 0
                
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => handleDateSelect(day)}
                    className={`min-h-[120px] p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      hasTasks 
                        ? 'bg-blue-50/50 border-blue-200/50 dark:bg-blue-900/20 dark:border-blue-700/30 hover:bg-blue-100/50 dark:hover:bg-blue-900/30' 
                        : 'border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <div className={getDayClass(day)}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="flex-1 mt-2 space-y-1 overflow-hidden">
                        {dayTasks.slice(0, 3).map(task => (
                          <div
                            key={task._id}
                            className={`text-xs p-1.5 rounded-lg truncate border-l-4 ${
                              getPriorityColor(task.priority)
                            } ${task.completed ? 'line-through opacity-70' : ''}`}
                            style={{ borderLeftColor: 'currentColor' }}
                          >
                            {task.title}
                          </div>
                        ))}
                        
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upcoming Tasks - {format(currentDate, 'MMMM yyyy')}
              </h2>
              <Badge variant="primary">{tasks.length} tasks</Badge>
            </div>

            <div className="space-y-3">
              {tasks.slice(0, 10).map(task => (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${getPriorityColor(task.priority)}`}>
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {task.date} • {task.startTime || 'All day'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {task.completed && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    <Badge variant={task.priority === 'high' ? 'danger' : 'secondary'}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-12">
                  <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No tasks scheduled
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Get started by creating your first task
                  </p>
                  <Button onClick={() => setIsTaskFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {format(selectedDate, 'EEEE, MMMM d')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(null)}
              >
                Close
              </Button>
            </div>
            
            <div className="space-y-3">
              {getTasksForDate(selectedDate).map(task => (
                <div
                  key={task._id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {task.startTime && `${task.startTime} - ${task.endTime || ''}`}
                      </p>
                    </div>
                    <Badge variant={task.completed ? 'success' : 'secondary'}>
                      {task.completed ? 'Completed' : task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {getTasksForDate(selectedDate).length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No tasks scheduled for this day
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <Button
          onClick={() => setIsTaskFormOpen(true)}
          size="lg"
          className="rounded-full p-4 shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Task Form Modal */}
      <Modal
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        title="Create New Task"
        size="lg"
      >
        <TaskForm
          onSuccess={() => {
            setIsTaskFormOpen(false)
            setSelectedDate(null)
          }}
          onCancel={() => setIsTaskFormOpen(false)}
        />
      </Modal>
    </div>
  )
}

export default Calendar