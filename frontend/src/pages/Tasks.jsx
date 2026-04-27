
import React, { useEffect, useState } from 'react'
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  Grid, 
  List, 
  RefreshCw, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Bell,
  Users,
  Target,
  Sparkles
} from 'lucide-react'
import { useTasks } from '../contexts/TaskContext'
import { useAuth } from '../contexts/AuthContext'
import TaskList from '../components/tasks/TaskList'
import TaskForm from '../components/tasks/TaskForm'
import TaskFilters from '../components/tasks/TaskFilters'
import AlarmModal from '../components/alarms/AlarmModal'
import ShareModal from '../components/tasks/ShareModal'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { toast } from 'react-hot-toast'
import { format, startOfWeek, endOfWeek, isToday, isThisWeek } from 'date-fns'
import { motion } from 'framer-motion'

const Tasks = () => {
  const { tasks = [], loadTasks, filters, deleteTask, loading, setFilters } = useTasks()
  const { user } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [activeQuickFilter, setActiveQuickFilter] = useState('all')

  // Load tasks on component mount
  useEffect(() => {
    loadTasks(filters)
  }, [])

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setIsFormOpen(true)
  }

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId)
        toast.success('Task deleted successfully')
      } catch (error) {
        toast.error('Failed to delete task')
      }
    }
  }

  const handleSetAlarm = (task) => {
    setSelectedTask(task)
    setIsAlarmModalOpen(true)
  }

  const handleShareTask = (task) => {
    setSelectedTask(task)
    setIsShareModalOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedTask(null)
  }

  const handleTaskCreated = () => {
    handleCloseForm()
    loadTasks(filters)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTasks(filters)
    setTimeout(() => setRefreshing(false), 700)
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleQuickFilter = (filter) => {
    setActiveQuickFilter(filter)
    
    let newFilters = { ...filters }
    
    if (filter === 'today') {
      newFilters.date = format(new Date(), 'yyyy-MM-dd')
      newFilters.range = '1'
    } else if (filter === 'week') {
      const start = format(startOfWeek(new Date()), 'yyyy-MM-dd')
      const end = format(endOfWeek(new Date()), 'yyyy-MM-dd')
      newFilters.date = start
      newFilters.range = '7'
    } else if (filter === 'month') {
      newFilters.range = '30'
      newFilters.date = null
    } else if (filter === 'high') {
      newFilters.priority = 'high'
      newFilters.completed = false
    } else if (filter === 'completed') {
      newFilters.completed = true
    } else {
      // Reset filters for 'all'
      newFilters = {
        date: null,
        range: '7',
        category: '',
        search: '',
        completed: undefined,
        priority: '',
        assignedToMe: false,
      }
    }
    
    setFilters(newFilters)
    loadTasks(newFilters)
  }

  const filteredTasks = (tasks || []).filter(task => {
    const matchesSearch = 
      (task.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = !filters.category || task.category === filters.category
    const matchesPriority = !filters.priority || task.priority === filters.priority
    const matchesCompleted = filters.completed === undefined || task.completed === filters.completed
    const matchesDate = !filters.date || task.date === filters.date
    
    return matchesSearch && matchesCategory && matchesPriority && matchesCompleted && matchesDate
  })

  const completedTasks = (tasks || []).filter(task => task.completed).length
  const pendingTasks = (tasks || []).filter(task => !task.completed).length
  const highPriorityTasks = (tasks || []).filter(task => task.priority === 'high' && !task.completed).length
  const tasksWithAlarms = (tasks || []).filter(task => task.alarm?.enabled).length

  const quickFilters = [
    { label: 'All Tasks', value: 'all', count: tasks.length, icon: List },
    { label: 'Today', value: 'today', count: (tasks || []).filter(t => isToday(new Date(t.date))).length, icon: Calendar },
    { label: 'This Week', value: 'week', count: (tasks || []).filter(t => isThisWeek(new Date(t.date))).length, icon: Clock },
    { label: 'This Month', value: 'month', count: (tasks || []).length, icon: Calendar },
    { label: 'High Priority', value: 'high', count: highPriorityTasks, icon: AlertCircle },
    { label: 'Completed', value: 'completed', count: completedTasks, icon: TrendingUp }
  ]

  const stats = [
    { label: 'Total', value: tasks.length, color: 'blue', icon: Target },
    { label: 'Completed', value: completedTasks, color: 'green', icon: TrendingUp },
    { label: 'Pending', value: pendingTasks, color: 'orange', icon: Clock },
    { label: 'High Priority', value: highPriorityTasks, color: 'red', icon: AlertCircle },
    { label: 'With Alarms', value: tasksWithAlarms, color: 'yellow', icon: Bell },
    { label: 'Shared', value: (tasks || []).filter(t => t.sharedWith?.length > 0).length, color: 'purple', icon: Users }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  My Tasks
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {tasks.length} tasks • {completedTasks} completed • {pendingTasks} pending
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 mt-4 sm:mt-0"
            >
              <Button 
                variant="ghost" 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>

              <Button 
                variant="secondary" 
                onClick={() => setIsFiltersOpen(true)} 
                className="hidden sm:flex items-center gap-2 rounded-xl bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/60 hover:shadow-md"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(filters.category || filters.priority || filters.search) && (
                  <Badge variant="primary" className="ml-1">Active</Badge>
                )}
              </Button>

              <Button 
                onClick={() => setIsFormOpen(true)} 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 rounded-xl px-6 py-3"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Task
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-xl`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Quick Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          {quickFilters.map((filter) => {
            const Icon = filter.icon
            return (
              <Button
                key={filter.value}
                variant={activeQuickFilter === filter.value ? "primary" : "secondary"}
                size="sm"
                onClick={() => handleQuickFilter(filter.value)}
                className={`rounded-xl px-4 py-2 transition-all duration-200 ${
                  activeQuickFilter === filter.value 
                    ? 'shadow-lg transform scale-105' 
                    : 'bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/60 hover:shadow-md'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {filter.label}
                <Badge 
                  variant={activeQuickFilter === filter.value ? "secondary" : "primary"} 
                  className="ml-2"
                >
                  {filter.count}
                </Badge>
              </Button>
            )
          })}
        </motion.div>

        {/* Search and View Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search tasks, descriptions, or tags..." 
              value={searchQuery} 
              onChange={handleSearch} 
              className="pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/60 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 rounded-xl border border-gray-200/60 dark:border-gray-600/60">
            <Button 
              variant={viewMode === 'grid' ? "primary" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode('grid')} 
              className="p-2 rounded-lg"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? "primary" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode('list')} 
              className="p-2 rounded-lg"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsFiltersOpen(true)} 
              className="p-2 rounded-lg sm:hidden"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Tasks List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <TaskList 
            tasks={filteredTasks} 
            showDate={true} 
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onSetAlarm={handleSetAlarm}
            onShareTask={handleShareTask}
            viewMode={viewMode}
          />
        </motion.div>

        {/* Empty State */}
        {filteredTasks.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-12 border border-gray-200/50 dark:border-gray-700/50 max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {searchQuery ? 'No tasks found' : 'Your task list is empty!'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                  : 'Ready to boost your productivity? Create your first task and start organizing your day.'
                }
              </p>
              <Button 
                onClick={() => setIsFormOpen(true)} 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3 rounded-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Task
              </Button>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading your tasks...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Getting everything organized for you</p>
            </div>
          </motion.div>
        )}

        {/* Floating Action Button for Mobile */}
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 right-6 sm:hidden z-40"
        >
          <Button 
            onClick={() => setIsFormOpen(true)} 
            size="lg" 
            className="rounded-full p-5 shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        title={selectedTask ? 'Edit Task' : 'Create New Task'} 
        size="lg"
      >
        <TaskForm 
          task={selectedTask} 
          onSuccess={handleTaskCreated} 
          onCancel={handleCloseForm} 
        />
      </Modal>

      <Modal 
        isOpen={isFiltersOpen} 
        onClose={() => setIsFiltersOpen(false)} 
        title="Filter Tasks" 
        size="md"
      >
        <TaskFilters onClose={() => setIsFiltersOpen(false)} />
      </Modal>

      <Modal 
        isOpen={isAlarmModalOpen} 
        onClose={() => setIsAlarmModalOpen(false)} 
        title="Set Alarm" 
        size="sm"
      >
        <AlarmModal 
          task={selectedTask} 
          onClose={() => setIsAlarmModalOpen(false)} 
          onSuccess={() => {
            setIsAlarmModalOpen(false)
            loadTasks(filters)
          }} 
        />
      </Modal>

      <Modal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        title="Share Task" 
        size="md"
      >
        <ShareModal 
          task={selectedTask} 
          onClose={() => setIsShareModalOpen(false)} 
          onSuccess={() => {
            setIsShareModalOpen(false)
            loadTasks(filters)
          }} 
        />
      </Modal>

    </div>
  )
}

export default Tasks

