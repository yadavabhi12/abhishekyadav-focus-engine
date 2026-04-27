// src/components/ui/Select.jsx
import React from 'react'
import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'

const Select = ({ 
  label, 
  error, 
  options = [], 
  className, 
  icon: Icon,
  renderOption, // Remove this prop from being passed to DOM
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <select
          className={clsx(
            'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl',
            'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-all duration-200 appearance-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500',
            Icon && 'pl-10',
            className
          )}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  )
}

export default Select