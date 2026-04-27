import React, { useState, useEffect, useCallback } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  AreaChart, Area, ComposedChart, Scatter
} from 'recharts'
import { analyticsService } from '../services/analytics'
import StatsCard from '../components/analytics/StatsCard'
import { 
  CheckCircle, Clock, TrendingUp, Target, Download, Calendar,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Award, Trophy, Zap, Activity, Target as TargetIcon, Star,
  Users, Brain, Crown, TrendingUp as TrendingUpIcon,
  Rocket, Lightbulb, Medal, FileText, RefreshCw,
  Eye, Filter, ArrowUpRight, ArrowDownRight,
  Sparkles, Timer, Calendar as CalendarIcon
} from 'lucide-react'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import { toast } from 'react-hot-toast'
import { useWebSocket } from '../contexts/WebSocketContext'

const COLORS = [
  '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', 
  '#EC4899', '#84CC16', '#06B6D4', '#F97316', '#6366F1',
  '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'
]

const Analytics = () => {
  const [summary, setSummary] = useState(null)
  const [trends, setTrends] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [categoryTimeData, setCategoryTimeData] = useState([])
  const [productivityData, setProductivityData] = useState([])
  const [timeAnalysis, setTimeAnalysis] = useState([])
  const [forecast, setForecast] = useState({ historical: [], forecast: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRange, setSelectedRange] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')
  const [exportLoading, setExportLoading] = useState(false)
  const { socket, isConnected } = useWebSocket()

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      const [
        summaryData,
        trendsData,
        categoryData,
        categoryTimeData,
        timeAnalysisData,
        forecastData
      ] = await Promise.all([
        analyticsService.getSummary(selectedRange),
        analyticsService.getTrends(selectedRange),
        analyticsService.getCategoryDistribution(selectedRange),
        analyticsService.getCategoryTime(selectedRange),
        analyticsService.getTimeAnalysis(selectedRange),
        analyticsService.getForecast('productiveHours', '7')
      ])

      setSummary(summaryData.summary)
      setTrends(trendsData.trends || [])
      setCategoryData(categoryData.distribution || [])
      setCategoryTimeData(categoryTimeData.categoryTime || [])
      setTimeAnalysis(timeAnalysisData.analysis || [])
      setForecast(forecastData)
      
      // Generate productivity data from trends
      if (trendsData.trends) {
        setProductivityData(trendsData.trends.map(trend => ({
          date: trend.date,
          productiveHours: trend.productiveHours || 0,
          tasksCompleted: trend.completed || 0,
          completionRate: trend.completionRate || 0
        })))
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedRange])

  useEffect(() => {
    loadAnalyticsData()
    
    // Listen for task completion events
    if (socket && isConnected) {
      const handleTaskUpdated = (data) => {
        if (data.type === 'TASK_UPDATED' || data.type === 'TASK_COMPLETED') {
          refreshAnalyticsData()
        }
      }

      socket.on('task_updated', handleTaskUpdated)
      socket.on('task_completed', handleTaskUpdated)

      return () => {
        socket.off('task_updated', handleTaskUpdated)
        socket.off('task_completed', handleTaskUpdated)
      }
    }
  }, [loadAnalyticsData, socket, isConnected])

  const refreshAnalyticsData = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    toast.success('Analytics data refreshed! 🎉')
  }

  const handleExport = async (format) => {
    try {
      setExportLoading(true)
      await analyticsService.exportData(format, selectedRange)
      toast.success(`Report exported successfully as ${format.toUpperCase()}! 📊`)
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    } finally {
      setExportLoading(false)
    }
  }

  const formatHoursMinutes = (mins) => {
    if (!mins || isNaN(mins)) return '0h 0m'
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    return `${hours}h ${minutes}m`
  }

  const getTrendIcon = (current, previous) => {
    if (current > previous) return <ArrowUpRight className="h-4 w-4 text-green-500" />
    if (current < previous) return <ArrowDownRight className="h-4 w-4 text-red-500" />
    return <TrendingUpIcon className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = (current, previous) => {
    if (current > previous) return 'text-green-600'
    if (current < previous) return 'text-red-600'
    return 'text-gray-600'
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'productiveHours' && ' hours'}
              {entry.dataKey === 'completionRate' && '%'}
              {entry.dataKey === 'tasksCompleted' && ' tasks'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <Sparkles className="w-6 h-6 text-blue-600 animate-pulse absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Crunching your productivity numbers...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">This will just take a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Productivity Analytics
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                    Track your performance and optimize your workflow like a pro 🚀
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <Select
                    value={selectedRange}
                    onChange={(e) => setSelectedRange(e.target.value)}
                    options={[
                      { value: '7', label: '📅 Last 7 days' },
                      { value: '30', label: '📊 Last 30 days' },
                      { value: '90', label: '📈 Last 90 days' }
                    ]}
                    className="w-full sm:w-48 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={refreshAnalyticsData}
                    disabled={refreshing}
                    size="sm"
                    className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600 transition-all duration-200"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <div className="relative group">
                    <Button
                      variant="primary"
                      onClick={() => handleExport('pdf')}
                      size="sm"
                      disabled={exportLoading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {exportLoading ? 'Exporting...' : 'Export Report'}
                    </Button>
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      Download PDF Report
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 mb-8 border border-white/20 shadow-lg">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'trends', label: 'Trends', icon: LineChartIcon },
              { id: 'categories', label: 'Categories', icon: PieChartIcon },
              { id: 'categoryTime', label: 'Time Analysis', icon: Timer },
              { id: 'performance', label: 'Performance', icon: Activity },
              { id: 'forecast', label: 'Forecast', icon: TrendingUpIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-w-max ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && summary && (
          <div className="space-y-6">
            {/* Enhanced Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Completion Rate"
                value={`${summary.completionRate}%`}
                icon={CheckCircle}
                subtitle={`${summary.completedTasks}/${summary.totalTasks} tasks`}
                trend={summary.completionRate > 70 ? 'up' : 'down'}
                trendValue="12%"
                gradient="from-green-500 to-emerald-600"
              />
              <StatsCard
                title="Productive Hours"
                value={summary.productiveHours}
                icon={Clock}
                subtitle="Total focused work time"
                trend="up"
                trendValue="8%"
                gradient="from-blue-500 to-cyan-600"
              />
              <StatsCard
                title="Focus Score"
                value={`${summary.focusScore}/100`}
                icon={Zap}
                subtitle="Concentration level"
                trend={summary.focusScore > 75 ? 'up' : 'down'}
                trendValue="5%"
                gradient="from-purple-500 to-pink-600"
              />
              <StatsCard
                title="Current Streak"
                value={summary.streak}
                icon={Target}
                subtitle="Days in a row"
                trend="up"
                trendValue="3 days"
                gradient="from-orange-500 to-red-600"
              />
            </div>

            {/* Enhanced Productivity Chart */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  📈 Daily Productivity Overview
                </h3>
                <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15% this week
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={productivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tick={{ fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="tasksCompleted" 
                    fill="#10B981" 
                    name="Tasks Completed"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    name="Completion Rate %"
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Best Day</p>
                    <p className="text-2xl font-bold mt-1">Monday</p>
                    <p className="text-blue-200 text-sm mt-2">+25% productivity</p>
                  </div>
                  <Trophy className="h-12 w-12 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Peak Hours</p>
                    <p className="text-2xl font-bold mt-1">9AM - 12PM</p>
                    <p className="text-green-200 text-sm mt-2">Most productive</p>
                  </div>
                  <Zap className="h-12 w-12 text-green-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Focus Sessions</p>
                    <p className="text-2xl font-bold mt-1">{summary.focusScore / 10}</p>
                    <p className="text-purple-200 text-sm mt-2">Completed today</p>
                  </div>
                  <Brain className="h-12 w-12 text-purple-200" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Time Tab */}
        {activeTab === 'categoryTime' && categoryTimeData.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                ⏱️ Time Investment by Category
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280' }}
                    tickFormatter={(value) => `${value}m`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} minutes`, 'Time Spent']}
                    labelFormatter={(name) => `Category: ${name}`}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="totalMinutes" 
                    name="Time Spent (minutes)"
                    radius={[4, 4, 0, 0]}
                  >
                    {categoryTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryTimeData.map((category, index) => (
                <StatsCard
                  key={index}
                  title={category.name}
                  value={formatHoursMinutes(category.totalMinutes)}
                  icon={Clock}
                  subtitle={`${category.tasksCompleted} tasks completed`}
                  color={COLORS[index % COLORS.length]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && categoryData.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                🎯 Task Distribution by Category
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Category Breakdown</h4>
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-white">{category.count} tasks</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{category.hours}h total</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && trends.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  📊 Completion Rate Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6B7280' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280' }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Completion Rate']}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completionRate" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      name="Completion Rate %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  ⚡ Productivity Hours Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6B7280' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="productiveHours" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.3}
                      strokeWidth={2}
                      name="Productive Hours"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && timeAnalysis.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                🎯 Time Estimation Accuracy
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={timeAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="estimated" 
                    name="Estimated Hours"
                    unit="h"
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    dataKey="actual" 
                    name="Actual Hours"
                    unit="h"
                    tick={{ fill: '#6B7280' }}
                  />
                  <ZAxis range={[100, 100]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Scatter name="Tasks" data={timeAnalysis} fill="#3B82F6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && forecast.historical.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                🔮 Productivity Forecast
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={[...forecast.historical, ...forecast.forecast]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    dataKey="value" 
                    fill="#3B82F6" 
                    stroke="#3B82F6" 
                    fillOpacity={0.3}
                    name="Historical"
                  />
                  <Line 
                    dataKey="predicted" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Forecast"
                    dot={false}
                  />
                  <Legend />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!summary || categoryTimeData.length === 0) && (
          <div className="text-center py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl inline-block mb-6">
                <BarChart3 className="h-16 w-16 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                No analytics data yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                Complete some tasks to unlock powerful insights about your productivity journey
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={refreshAnalyticsData}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
                <Button variant="secondary">
                  <Rocket className="h-4 w-4 mr-2" />
                  Get Started Guide
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Last updated: {new Date().toLocaleString()} • 
            <span className="text-green-500 ml-1">●</span> Live updates enabled
          </p>
        </div>
      </div>
    </div>
  )
}

export default Analytics









