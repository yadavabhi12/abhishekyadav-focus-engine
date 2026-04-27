import React, { useState, useEffect } from 'react'
import { 
  Filter, 
  Calendar, 
  Tag, 
  Flag, 
  CheckCircle, 
  Circle, 
  User,
  RotateCcw,
  Search
} from 'lucide-react'
import { useTasks } from '../../contexts/TaskContext'
import { categoryService } from '../../services/categories'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Checkbox from '../ui/Checkbox'
import Badge from '../ui/Badge'

const TaskFilters = ({ onClose }) => {
  const { filters, setFilters, clearFilters } = useTasks()
  const [categories, setCategories] = useState([])
  const [localFilters, setLocalFilters] = useState({
    date: filters.date || '',
    range: filters.range || '7',
    category: filters.category || '',
    search: filters.search || '',
    completed: filters.completed !== undefined ? String(filters.completed) : '',
    priority: filters.priority || '',
    assignedToMe: filters.assignedToMe || false,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const { categories } = await categoryService.getCategories()
      setCategories(categories)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    const appliedFilters = {
      ...localFilters,
      completed: localFilters.completed === '' ? undefined : localFilters.completed === 'true'
    }
    setFilters(appliedFilters)
    onClose()
  }

  const handleResetFilters = () => {
    clearFilters()
    setLocalFilters({
      date: '',
      range: '7',
      category: '',
      search: '',
      completed: '',
      priority: '',
      assignedToMe: false,
    })
  }

  const handleChange = (name, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (localFilters.search) count++
    if (localFilters.range && localFilters.range !== '7') count++
    if (localFilters.category) count++
    if (localFilters.priority) count++
    if (localFilters.completed !== '') count++
    if (localFilters.assignedToMe) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
            <Filter className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Tasks</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Refine your task view</p>
          </div>
        </div>
        {activeFilterCount > 0 && <Badge variant="primary" className="animate-pulse">{activeFilterCount} active</Badge>}
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
            <Search className="h-4 w-4 mr-2 text-blue-500" />
            Search Tasks
          </label>
          <Input 
            value={localFilters.search} 
            onChange={(e) => handleChange('search', e.target.value)} 
            placeholder="Search by title, description, or tags..." 
            className="w-full rounded-xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
            <Calendar className="h-4 w-4 mr-2 text-purple-500" />
            Date Range
          </label>
          <Select
            value={localFilters.range}
            onChange={(e) => handleChange('range', e.target.value)}
            options={[
              { value: '1', label: '📅 Today' },
              { value: '7', label: '📆 This Week' },
              {value: '30', label: '📅 This Month' },
              { value: '365', label: '📊 This Year' }
            ]}
            className="rounded-xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
            <Tag className="h-4 w-4 mr-2 text-green-500" />
            Category
          </label>
          <Select
            value={localFilters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={[
              { value: '', label: '🏷️ All Categories' },
              ...categories.map(cat => ({ value: cat._id, label: `${cat.name}` }))
            ]}
            disabled={loading}
            className="rounded-xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500"
          />
          {loading && <p className="text-xs text-gray-500 dark:text-gray-400">Loading categories...</p>}
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
            <Flag className="h-4 w-4 mr-2 text-red-500" />
            Priority
          </label>
          <Select
            value={localFilters.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            options={[
              { value: '', label: '🎯 All Priorities' },
              { value: 'urgent', label: '🔥 Urgent' },
              { value: 'high', label: '⚠️ High' },
              { value: 'medium', label: '📌 Medium' },
              { value: 'low', label: '📋 Low' }
            ]}
            className="rounded-xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
            <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
            Status
          </label>
          <Select
            value={localFilters.completed}
            onChange={(e) => handleChange('completed', e.target.value)}
            options={[
              { value: '', label: '📊 All Tasks' },
              { value: 'true', label: '✅ Completed' },
              { value: 'false', label: '⏳ Pending' }
            ]}
            className="rounded-xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
            <User className="h-4 w-4 mr-2 text-indigo-500" />
            Assignment
          </label>
          <Checkbox
            label="Only tasks assigned to me"
            checked={localFilters.assignedToMe}
            onChange={(e) => handleChange('assignedToMe', e.target.checked)}
            className="rounded-lg border-gray-300 dark:border-gray-600 checked:bg-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick Filters
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={localFilters.completed === 'false' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleChange('completed', 'false')}
              className="rounded-xl text-xs py-2"
            >
              <Circle className="h-3 w-3 mr-1" />
              Pending
            </Button>
            <Button
              variant={localFilters.completed === 'true' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleChange('completed', 'true')}
              className="rounded-xl text-xs py-2"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Button>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="secondary"
          onClick={handleResetFilters}
          disabled={activeFilterCount === 0}
          className="flex-1 rounded-xl py-3"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All
        </Button>
        <Button
          onClick={handleApplyFilters}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl py-3"
        >
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      </div>

      {activeFilterCount > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Active Filters:
          </h4>
          <div className="flex flex-wrap gap-2">
            {localFilters.search && (
              <Badge variant="blue" className="text-xs">
                Search: "{localFilters.search}"
              </Badge>
            )}
            {localFilters.range && localFilters.range !== '7' && (
              <Badge variant="purple" className="text-xs">
                {localFilters.range === '1' ? 'Today' : 
                 localFilters.range === '7' ? 'This Week' : 
                 localFilters.range === '30' ? 'This Month' : 'This Year'}
              </Badge>
            )}
            {localFilters.category && (
              <Badge variant="green" className="text-xs">
                Category: {categories.find(c => c._id === localFilters.category)?.name}
              </Badge>
            )}
            {localFilters.priority && (
              <Badge variant="red" className="text-xs">
                {localFilters.priority.charAt(0).toUpperCase() + localFilters.priority.slice(1)} Priority
              </Badge>
            )}
            {localFilters.completed !== '' && (
              <Badge variant="blue" className="text-xs">
                {localFilters.completed === 'true' ? 'Completed' : 'Pending'}
              </Badge>
            )}
            {localFilters.assignedToMe && (
              <Badge variant="indigo" className="text-xs">
                Assigned to Me
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskFilters


