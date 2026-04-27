import React from 'react'
import { clsx } from 'clsx'
import { Check } from 'lucide-react'

const Checkbox = ({ 
  label, 
  checked, 
  onChange, 
  className, 
  disabled = false,
  error,
  ...props 
}) => {
  return (
    <div className="w-full">
      <label className={clsx(
        'flex items-center space-x-3 cursor-pointer group',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}>
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div className={clsx(
            'w-5 h-5 border-2 rounded-lg transition-all duration-200 flex items-center justify-center',
            checked 
              ? 'bg-blue-600 border-blue-600 group-hover:bg-blue-700 group-hover:border-blue-700' 
              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500',
            disabled && 'group-hover:border-gray-300 dark:group-hover:border-gray-600'
          )}>
            {checked && (
              <Check className="h-3.5 w-3.5 text-white" />
            )}
          </div>
        </div>
        {label && (
          <span className={clsx(
            'text-sm transition-colors duration-200',
            checked 
              ? 'text-gray-900 dark:text-white font-medium' 
              : 'text-gray-700 dark:text-gray-300',
            disabled && 'text-gray-500 dark:text-gray-400'
          )}>
            {label}
          </span>
        )}
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  )
}

export default Checkbox