// src/components/ui/Button.jsx
import React from 'react'
import { clsx } from 'clsx'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:scale-105',
    secondary: 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-gray-500 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-500 shadow-lg hover:shadow-xl',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 focus:ring-green-500 shadow-lg hover:shadow-xl'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  }

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className={clsx('animate-spin -ml-1 mr-2', iconSizeClasses[size])} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={clsx(iconSizeClasses[size], 'mr-2')} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={clsx(iconSizeClasses[size], 'ml-2')} />
      )}
    </button>
  )
}

export default Button




// import React from 'react'
// import { clsx } from 'clsx'

// const Button = ({ 
//   children, 
//   variant = 'primary', 
//   size = 'md', 
//   icon: Icon,
//   iconPosition = 'left',
//   loading = false,
//   disabled = false,
//   className,
//   ...props 
// }) => {
//   const baseClasses = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
//   const variantClasses = {
//     primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:scale-105',
//     secondary: 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-gray-500 shadow-sm hover:shadow-md',
//     ghost: 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
//     danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-500 shadow-lg hover:shadow-xl',
//     success: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 focus:ring-green-500 shadow-lg hover:shadow-xl'
//   }
  
//   const sizeClasses = {
//     sm: 'px-3 py-2 text-sm',
//     md: 'px-4 py-2.5 text-sm',
//     lg: 'px-6 py-3 text-base',
//     xl: 'px-8 py-4 text-lg'
//   }

//   const iconSizeClasses = {
//     sm: 'h-4 w-4',
//     md: 'h-4 w-4',
//     lg: 'h-5 w-5',
//     xl: 'h-6 w-6'
//   }

//   return (
//     <button
//       className={clsx(
//         baseClasses,
//         variantClasses[variant],
//         sizeClasses[size],
//         className
//       )}
//       disabled={disabled || loading}
//       {...props}
//     >
//       {loading && (
//         <svg className={clsx('animate-spin -ml-1 mr-2', iconSizeClasses[size])} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//         </svg>
//       )}
//       {!loading && Icon && iconPosition === 'left' && (
//         <Icon className={clsx(iconSizeClasses[size], 'mr-2')} />
//       )}
//       {children}
//       {!loading && Icon && iconPosition === 'right' && (
//         <Icon className={clsx(iconSizeClasses[size], 'ml-2')} />
//       )}
//     </button>
//   )
// }

// export default Button