import React, { createContext, useContext, useReducer, useRef, useCallback } from 'react'
import { taskService } from '../services/tasks'
import { userService } from '../services/users'
import { toast } from 'react-hot-toast'
import { useAuth } from './AuthContext'
import { useWebSocket } from './WebSocketContext'

export const TaskContext = createContext()

const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false }
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task._id === action.payload._id ? action.payload : task
        ),
      }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task._id !== action.payload),
      }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } }
    case 'CLEAR_FILTERS':
      return { 
        ...state, 
        filters: {
          date: null,
          range: '7',
          category: '',
          search: '',
          completed: undefined,
          priority: '',
          assignedToMe: false,
        }
      }
    default:
      return state
  }
}

const initialState = {
  tasks: [],
  loading: false,
  filters: {
    date: null,
    range: '7',
    category: '',
    search: '',
    completed: undefined,
    priority: '',
    assignedToMe: false,
  },
}

export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState)
  const loadTasksTimeoutRef = useRef(null)
  const { user } = useAuth()
  const { socket, isConnected } = useWebSocket()

  const loadTasks = useCallback(async (filters = {}) => {
    try {
      if (loadTasksTimeoutRef.current) {
        clearTimeout(loadTasksTimeoutRef.current);
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      
      loadTasksTimeoutRef.current = setTimeout(async () => {
        try {
          const { tasks } = await taskService.getTasks(filters);
          dispatch({ type: 'SET_TASKS', payload: tasks });
          return tasks;
        } catch (error) {
          console.error('Error loading tasks:', error);
          if (error.response?.status !== 429) {
            toast.error('Failed to load tasks');
          }
          dispatch({ type: 'SET_LOADING', payload: false });
          return [];
        }
      }, 300);
    } catch (error) {
      console.error('Error in loadTasks:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      return [];
    }
  }, []);

  const createTask = async (taskData) => {
    try {
      const response = await taskService.createTask(taskData)
      dispatch({ type: 'ADD_TASK', payload: response.task })
      
      // Emit WebSocket event for task creation
      if (socket && isConnected) {
        socket.emit('task_updated', {
          type: 'TASK_CREATED',
          taskId: response.task._id,
          task: response.task
        });
      }
      
      toast.success('Task created successfully')
      return response.task
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
      throw error
    }
  }

  const updateTask = async (id, taskData) => {
    try {
      const response = await taskService.updateTask(id, taskData)
      dispatch({ type: 'UPDATE_TASK', payload: response.task })
      
      // Emit WebSocket event for task update
      if (socket && isConnected) {
        socket.emit('task_updated', {
          type: 'TASK_UPDATED',
          taskId: id,
          task: response.task
        });
      }
      
      toast.success('Task updated successfully')
      return response.task
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
      throw error
    }
  }

  const deleteTask = async (id) => {
    try {
      await taskService.deleteTask(id)
      dispatch({ type: 'DELETE_TASK', payload: id })
      
      // Emit WebSocket event for task deletion
      if (socket && isConnected) {
        socket.emit('task_updated', {
          type: 'TASK_DELETED',
          taskId: id
        });
      }
      
      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
      throw error
    }
  }

  const toggleComplete = async (id) => {
    try {
      // Get the task from state.tasks
      const task = state.tasks.find(t => t._id === id);
      if (!task) {
        throw new Error('Task not found');
      }
      
      const response = await taskService.toggleComplete(id);
      
      // Calculate time spent based on start and end times if available
      let minutesSpent = 0;
      if (response.completed && task.startTime && task.endTime) {
        // Parse time strings to calculate duration
        const [startHours, startMinutes] = task.startTime.split(':').map(Number);
        const [endHours, endMinutes] = task.endTime.split(':').map(Number);
        
        let totalStartMinutes = startHours * 60 + startMinutes;
        let totalEndMinutes = endHours * 60 + endMinutes;
        
        // Handle cases where end time might be on the next day
        if (totalEndMinutes < totalStartMinutes) {
          totalEndMinutes += 24 * 60; // Add 24 hours
        }
        
        minutesSpent = totalEndMinutes - totalStartMinutes;
      }
      
      // If task was completed, update category time
      if (response.completed && task.category && minutesSpent > 0) {
        const categoryId = task.category._id || task.category;
        await userService.updateCategoryTime(categoryId, minutesSpent);
        toast.success(`Added ${minutesSpent} minutes to ${task.category.name || 'category'}`);
      }
      // If task was uncompleted, remove category time
      else if (!response.completed && task.category && task.actualMinutes > 0) {
        const categoryId = task.category._id || task.category;
        await userService.removeCategoryTime(categoryId, task.actualMinutes);
        toast.success(`Removed ${task.actualMinutes} minutes from ${task.category.name || 'category'}`);
      }
      
      dispatch({ type: 'UPDATE_TASK', payload: response.task });
      
      // Emit WebSocket event for task completion
      if (socket && isConnected) {
        socket.emit('task_updated', {
          type: 'TASK_COMPLETED',
          taskId: id,
          completed: response.completed,
          task: response.task
        });
      }
      
      toast.success(response.completed ? 'Task completed!' : 'Task marked as incomplete');
      return response.task;
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast.error('Failed to update task');
      throw error;
    }
  };

  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' })
  }

  const value = {
    tasks: state.tasks,
    loading: state.loading,
    filters: state.filters,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    setFilters,
    clearFilters,
  }

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export const useTasks = () => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider')
  }
  return context
}










