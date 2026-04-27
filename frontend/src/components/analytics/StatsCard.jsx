


import React from 'react'
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  trend, 
  trendValue, 
  gradient = 'from-blue-500 to-cyan-600',
  color 
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-green-500" />
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-500" />
    return <TrendingUp className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            </div>
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        
        {/* Progress bar for completion rate */}
        {title === 'Completion Rate' && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${parseInt(value)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StatsCard