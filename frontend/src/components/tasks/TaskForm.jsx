







import { useState, useEffect } from 'react'
import { useTasks } from '../../contexts/TaskContext'
import { categoryService } from '../../services/categories'
import { taskService } from '../../services/tasks'
import { toast } from 'react-hot-toast'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Checkbox from '../ui/Checkbox'
import Modal from '../ui/Modal'
import { Plus, Edit2, Trash2, Bell, AlertCircle, FileText, X, Check, RefreshCw } from 'lucide-react'

const TaskForm = ({ task, onSuccess, onCancel }) => {
  const { createTask, updateTask, tasks, loadTasks } = useTasks()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [formErrors, setFormErrors] = useState({})
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [editingCategory, setEditingCategory] = useState(null)
  const [showAlarmPicker, setShowAlarmPicker] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [tasksUsingCategory, setTasksUsingCategory] = useState([])
  const [showTaskResolutionModal, setShowTaskResolutionModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [reassignCategory, setReassignCategory] = useState('')
  const [resolving, setResolving] = useState(false)

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category?._id || task?.category || '',
    date: task?.date || new Date().toISOString().split('T')[0],
    startTime: task?.startTime || '',
    endTime: task?.endTime || '',
    priority: task?.priority || 'medium',
    estimatedMinutes: task?.estimatedMinutes || 0,
    tags: task?.tags?.join(', ') || '',
    alarm: task?.alarm ? {
      enabled: task.alarm.enabled,
      time: task.alarm.time || '09:00',
      sound: task.alarm.sound || 'default',
      vibration: task.alarm.vibration !== undefined ? task.alarm.vibration : true
    } : {
      enabled: false,
      time: '09:00',
      sound: 'default',
      vibration: true
    }
  })

  useEffect(() => {
    loadCategories()
    if (task?.alarm?.enabled) {
      setShowAlarmPicker(true)
    }
  }, [])

  const loadCategories = async () => {
    try {
      const { categories } = await categoryService.getCategories()
      setCategories(categories)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const getTasksUsingCategory = async (categoryId) => {
    try {
      // Get fresh tasks data to ensure we have the latest state
      await loadTasks();
      
      // Filter tasks that use this category
      const tasksWithCategory = tasks.filter(task => 
        task.category && (task.category._id === categoryId || task.category === categoryId)
      )
      setTasksUsingCategory(tasksWithCategory)
      return tasksWithCategory
    } catch (error) {
      console.error('Error fetching tasks for category:', error)
      return []
    }
  }

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      const { category } = await categoryService.createCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor
      })
      
      setCategories(prev => [...prev, category])
      setFormData(prev => ({ ...prev, category: category._id }))
      setNewCategoryName('')
      setNewCategoryColor('#3B82F6')
      setShowCategoryManager(false)
      toast.success('Category created successfully')
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error(error.response?.data?.error || 'Failed to create category')
    }
  }

  const updateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return

    try {
      const { category } = await categoryService.updateCategory(editingCategory._id, {
        name: newCategoryName.trim(),
        color: newCategoryColor
      })
      
      setCategories(prev => prev.map(cat => 
        cat._id === category._id ? category : cat
      ))
      setEditingCategory(null)
      setNewCategoryName('')
      setNewCategoryColor('#3B82F6')
      toast.success('Category updated successfully')
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error(error.response?.data?.error || 'Failed to update category')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    setCategoryToDelete(categoryId)
    setDeleteError('')
    
    // Check if category is being used
    const tasksUsingCat = await getTasksUsingCategory(categoryId)
    
    if (tasksUsingCat.length > 0) {
      setShowTaskResolutionModal(true)
    } else {
      // If no tasks use this category, delete it directly
      performCategoryDeletion(categoryId)
    }
  }

  const performCategoryDeletion = async (categoryId) => {
    try {
      await categoryService.deleteCategory(categoryId)
      setCategories(prev => prev.filter(cat => cat._id !== categoryId))
      
      if (formData.category === categoryId) {
        setFormData(prev => ({ ...prev, category: '' }))
      }
      
      setDeleteError('')
      setShowTaskResolutionModal(false)
      setCategoryToDelete(null)
      toast.success('Category deleted successfully')
      
      // Reload categories to ensure we have the latest state
      await loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      const errorMessage = error.response?.data?.error || 'Failed to delete category'
      setDeleteError(errorMessage)
      toast.error(errorMessage)
      
      // If deletion failed, refresh the tasks list to check current usage
      if (categoryToDelete) {
        await getTasksUsingCategory(categoryToDelete)
      }
    }
  }

  const reassignTasksToNewCategory = async () => {
    if (!reassignCategory) {
      toast.error('Please select a category to reassign tasks to')
      return
    }

    setResolving(true)
    try {
      // Reassign all tasks using the old category to the new category
      const updatePromises = tasksUsingCategory.map(task => 
        taskService.updateTask(task._id, { 
          category: reassignCategory,
          __v: task.__v // Include version to prevent conflicts
        })
      )
      
      await Promise.all(updatePromises)
      toast.success(`Reassigned ${tasksUsingCategory.length} tasks successfully`)
      
      // Refresh tasks to ensure we have the latest state
      await loadTasks()
      
      // Check if category is still in use
      const updatedTasksUsingCategory = await getTasksUsingCategory(categoryToDelete)
      
      if (updatedTasksUsingCategory.length === 0) {
        // Now delete the category
        await performCategoryDeletion(categoryToDelete)
      } else {
        toast.error('Some tasks still use this category. Please try again.')
        setTasksUsingCategory(updatedTasksUsingCategory)
      }
    } catch (error) {
      console.error('Error reassigning tasks:', error)
      toast.error('Failed to reassign tasks')
    } finally {
      setResolving(false)
    }
  }

  const deleteTasksWithCategory = async () => {
    if (!window.confirm(`Are you sure you want to delete ${tasksUsingCategory.length} tasks? This action cannot be undone.`)) {
      return
    }

    setResolving(true)
    try {
      // Delete all tasks using this category
      const deletePromises = tasksUsingCategory.map(task => 
        taskService.deleteTask(task._id)
      )
      
      await Promise.all(deletePromises)
      toast.success(`Deleted ${tasksUsingCategory.length} tasks successfully`)
      
      // Refresh tasks to ensure we have the latest state
      await loadTasks()
      
      // Check if category is still in use
      const updatedTasksUsingCategory = await getTasksUsingCategory(categoryToDelete)
      
      if (updatedTasksUsingCategory.length === 0) {
        // Now delete the category
        await performCategoryDeletion(categoryToDelete)
      } else {
        toast.error('Some tasks still use this category. Please try again.')
        setTasksUsingCategory(updatedTasksUsingCategory)
      }
    } catch (error) {
      console.error('Error deleting tasks:', error)
      toast.error('Failed to delete tasks')
    } finally {
      setResolving(false)
    }
  }

  const handleAlarmToggle = (enabled) => {
    setFormData(prev => ({
      ...prev,
      alarm: {
        ...prev.alarm,
        enabled
      }
    }))
    
    if (enabled && !showAlarmPicker) {
      setShowAlarmPicker(true)
    }
  }

  const handleAlarmTimeChange = (time) => {
    setFormData(prev => ({
      ...prev,
      alarm: {
        ...prev.alarm,
        time
      }
    }))
  }

  const handleAlarmSoundChange = (sound) => {
    setFormData(prev => ({
      ...prev,
      alarm: {
        ...prev.alarm,
        sound
      }
    }))
  }

  const handleVibrationToggle = (vibration) => {
    setFormData(prev => ({
      ...prev,
      alarm: {
        ...prev.alarm,
        vibration
      }
    }))
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }
    
    if (formData.date && new Date(formData.date) < new Date().setHours(0, 0, 0, 0)) {
      errors.date = 'Date cannot be in the past'
    }
    
    if (formData.alarm.enabled && !formData.alarm.time) {
      errors.alarm = 'Alarm time is required when alarm is enabled'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    setLoading(true)

    try {
      const submitData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        estimatedMinutes: parseInt(formData.estimatedMinutes) || 0,
        category: formData.category || undefined
      }

      if (!formData.alarm.enabled) {
        delete submitData.alarm
      }

      if (task) {
        // Include version for update to prevent conflicts
        submitData.__v = task.__v
        await updateTask(task._id, submitData)
      } else {
        await createTask(submitData)
      }

      toast.success(task ? 'Task updated successfully' : 'Task created successfully')
      onSuccess()
    } catch (error) {
      console.error('Error saving task:', error)
      if (error.response?.data?.error) {
        toast.error(error.response.data.error)
      } else if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors)
      } else {
        toast.error('Failed to save task')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ]

  const presetColors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
    '#EC4899', '#6B7280', '#84CC16', '#06B6D4', '#F97316'
  ]

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-h-96 overflow-y-auto pr-2">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {task ? 'Update your task details' : 'Add a new task to your schedule'}
          </p>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <Input
              label="Title *"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter task title"
              disabled={loading}
              error={formErrors.title}
              className="text-lg font-medium"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                placeholder="Describe your task..."
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date *"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={loading}
                error={formErrors.date}
              />

              <Input
                label="Estimated Minutes"
                name="estimatedMinutes"
                type="number"
                value={formData.estimatedMinutes}
                onChange={handleChange}
                min="0"
                placeholder="0"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                disabled={loading}
              />

              <Input
                label="End Time"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryManager(true)
                    setDeleteError('')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Manage Categories
                </button>
              </div>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={[
                  { value: '', label: 'No category', color: 'text-gray-400' },
                  ...categories.map(cat => ({
                    value: cat._id,
                    label: cat.name,
                    color: `text-[${cat.color}]`
                  }))
                ]}
                disabled={loading}
                error={formErrors.category}
                renderOption={(option) => (
                  <div className="flex items-center">
                    {option.value && (
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: option.color.replace('text-', '').replace('[', '').replace(']', '') }}
                      />
                    )}
                    {option.label}
                  </div>
                )}
              />
            </div>

            <Select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={priorityOptions}
              disabled={loading}
              renderOption={(option) => (
                <span className={option.color}>{option.label}</span>
              )}
            />

            <Input
              label="Tags (comma separated)"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="work, urgent, project"
              disabled={loading}
            />

            {/* Alarm Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Bell className="h-5 w-5 mr-2 text-blue-600" />
                  Set Alarm
                </label>
                <Checkbox
                  checked={formData.alarm.enabled}
                  onChange={(e) => handleAlarmToggle(e.target.checked)}
                  label={formData.alarm.enabled ? 'Enabled' : 'Disabled'}
                />
              </div>

              {formData.alarm.enabled && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Alarm Time
                    </label>
                    <Input
                      type="time"
                      value={formData.alarm.time}
                      onChange={(e) => handleAlarmTimeChange(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Sound
                    </label>
                    <Select
                      value={formData.alarm.sound}
                      onChange={(e) => handleAlarmSoundChange(e.target.value)}
                      options={[
                        { value: 'default', label: 'Default' },
                        { value: 'gentle', label: 'Gentle' },
                        { value: 'urgent', label: 'Urgent' },
                        { value: 'melodic', label: 'Melodic' }
                      ]}
                      className="w-full text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Vibration
                    </label>
                    <Checkbox
                      checked={formData.alarm.vibration}
                      onChange={(e) => handleVibrationToggle(e.target.checked)}
                    />
                  </div>

                  {formErrors.alarm && (
                    <p className="text-red-500 text-xs">{formErrors.alarm}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="min-w-[120px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="spinner mr-2"></div>
                {task ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              task ? 'Update Task' : 'Create Task'
            )}
          </Button>
        </div>
      </form>

      {/* Category Manager Modal */}
      <Modal
        isOpen={showCategoryManager}
        onClose={() => {
          setShowCategoryManager(false)
          setEditingCategory(null)
          setNewCategoryName('')
          setNewCategoryColor('#3B82F6')
          setDeleteError('')
        }}
        title={editingCategory ? 'Edit Category' : 'Manage Categories'}
        size="md"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-sm text-red-600 dark:text-red-400">{deleteError}</span>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <div className="space-y-3">
              <Input
                label="Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newCategoryColor === color ? 'border-gray-800 dark:border-white ring-2 ring-offset-1' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <Button
                onClick={editingCategory ? updateCategory : createCategory}
                disabled={!newCategoryName.trim()}
                className="w-full"
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Your Categories
            </h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map(category => (
                <div
                  key={category._id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {category.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingCategory(category)
                        setNewCategoryName(category.name)
                        setNewCategoryColor(category.color)
                        setDeleteError('')
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {categories.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No categories yet. Create your first one!
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Task Resolution Modal */}
      <Modal
        isOpen={showTaskResolutionModal}
        onClose={() => {
          setShowTaskResolutionModal(false)
          setCategoryToDelete(null)
          setReassignCategory('')
          setResolving(false)
        }}
        title="Category In Use"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                This category is being used by {tasksUsingCategory.length} task(s). You need to resolve this before deleting the category.
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tasks using this category:
            </h4>
            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {tasksUsingCategory.map(task => (
                <div key={task._id} className="flex items-center p-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                  <FileText className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{task.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Resolution Options:
            </h4>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reassign tasks to another category
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Select
                  value={reassignCategory}
                  onChange={(e) => setReassignCategory(e.target.value)}
                  options={[
                    { value: '', label: 'Select a category' },
                    ...categories
                      .filter(cat => cat._id !== categoryToDelete)
                      .map(cat => ({
                        value: cat._id,
                        label: cat.name
                      }))
                  ]}
                  className="flex-1"
                />
                <Button
                  onClick={reassignTasksToNewCategory}
                  disabled={!reassignCategory || resolving}
                  size="sm"
                >
                  {resolving ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Reassign'}
                </Button>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <X className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Delete all tasks using this category
                </span>
              </div>
              <Button
                onClick={deleteTasksWithCategory}
                variant="danger"
                size="sm"
                className="mt-2"
                disabled={resolving}
              >
                {resolving ? <RefreshCw className="h-4 w-4 animate-spin" /> : `Delete ${tasksUsingCategory.length} Task(s)`}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => {
                setShowTaskResolutionModal(false)
                setCategoryToDelete(null)
                setReassignCategory('')
                setResolving(false)
              }}
              disabled={resolving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default TaskForm







