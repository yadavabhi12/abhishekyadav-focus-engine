// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useTasks } from '../contexts/TaskContext'
import useAuth from '../hooks/useAuth'
import { analyticsService } from '../services/analytics'
import { quoteService } from '../services/quotes'
import { format } from 'date-fns'
import { CheckCircle, Clock, TrendingUp, Target, Plus, Edit3, Trash2 } from 'lucide-react'
import TaskList from '../components/tasks/TaskList'
import StatsCard from '../components/analytics/StatsCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { toast } from 'react-hot-toast' // ✅ Toast import करें

const Dashboard = () => {
  const { tasks, loadTasks } = useTasks()
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [quotes, setQuotes] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddQuote, setShowAddQuote] = useState(false)
  const [newQuote, setNewQuote] = useState({ text: '', author: '' })
  const [editingQuote, setEditingQuote] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    await loadTasks({
      date: format(selectedDate, 'yyyy-MM-dd'),
      range: '1'
    })
    
    const summaryData = await analyticsService.getSummary('7')
    setSummary(summaryData.summary)
    
    loadQuotes()
  }

  const loadQuotes = async () => {
    try {
      const quotesData = await quoteService.getQuotes()
      setQuotes(quotesData.quotes || [])
    } catch (error) {
      console.error('Error loading quotes:', error)
      toast.error('Failed to load quotes')
    }
  }

  const handleAddQuote = async (e) => {
    e.preventDefault()
    try {
      if (editingQuote) {
        await quoteService.updateQuote(editingQuote._id, newQuote)
        toast.success('Quote updated successfully!')
      } else {
        await quoteService.createQuote(newQuote)
        toast.success('Quote added successfully!')
      }
      setNewQuote({ text: '', author: '' })
      setEditingQuote(null)
      setShowAddQuote(false)
      loadQuotes() // Reload quotes
    } catch (error) {
      console.error('Error saving quote:', error)
      toast.error('Failed to save quote')
    }
  }

  const handleEditQuote = (quote) => {
    setEditingQuote(quote)
    setNewQuote({ text: quote.text, author: quote.author })
    setShowAddQuote(true)
  }

  const handleDeleteQuote = async (id) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await quoteService.deleteQuote(id)
        toast.success('Quote deleted successfully!')
        loadQuotes() // Reload quotes
      } catch (error) {
        console.error('Error deleting quote:', error)
        toast.error('Failed to delete quote')
      }
    }
  }

  const todayTasks = tasks.filter(task => task.date === format(selectedDate, 'yyyy-MM-dd'))
  const completedTasks = todayTasks.filter(task => task.completed)
  const pendingTasks = todayTasks.filter(task => !task.completed)

  const randomQuote = quotes.length > 0 ? quotes[Math.floor(Math.random() * quotes.length)] : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>
    

      {/* Motivational Quote */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200">Daily Motivation</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            icon={Plus}
            onClick={() => setShowAddQuote(!showAddQuote)}
          >
            {showAddQuote ? 'Cancel' : 'Add Quote'}
          </Button>
        </div>

        {showAddQuote ? (
          <form onSubmit={handleAddQuote} className="space-y-3 mb-4">
            <Input
              placeholder="Quote text"
              value={newQuote.text}
              onChange={(e) => setNewQuote({...newQuote, text: e.target.value})}
              required
            />
            <Input
              placeholder="Author"
              value={newQuote.author}
              onChange={(e) => setNewQuote({...newQuote, author: e.target.value})}
            />
            <div className="flex space-x-2">
              <Button type="submit">
                {editingQuote ? 'Update Quote' : 'Add Quote'}
              </Button>
              {editingQuote && (
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setEditingQuote(null)
                    setNewQuote({ text: '', author: '' })
                    setShowAddQuote(false)
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        ) : null}

        {randomQuote ? (
          <>
            <p className="text-blue-800 dark:text-blue-200 text-lg italic">
              "{randomQuote.text}"
            </p>
            <div className="flex justify-between items-center mt-2">
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                - {randomQuote.author}
              </p>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEditQuote(randomQuote)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteQuote(randomQuote._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-blue-600 dark:text-blue-400">No quotes available. Add one above!</p>
        )}
      </div>

      {/* Stats Overview */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Completion Rate"
            value={`${summary.completionRate}%`}
            icon={CheckCircle}
            trend={summary.completionRate > 80 ? 'up' : 'down'}
          />
          <StatsCard
            title="Productive Hours"
            value={summary.productiveHours}
            icon={Clock}
            subtitle="this week"
          />
          <StatsCard
            title="Focus Score"
            value={`${summary.focusScore}/100`}
            icon={TrendingUp}
          />
          <StatsCard
            title="Current Streak"
            value={summary.streak}
            icon={Target}
            subtitle="days"
          />
        </div>
      )}

      {/* Today's Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Today's Tasks ({todayTasks.length})
          </h2>
          <TaskList tasks={todayTasks} showDate={false} />
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Task Completion
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600 dark:text-green-400">
                  Completed: {completedTasks.length}
                </span>
                <span className="text-orange-600 dark:text-orange-400">
                  Pending: {pendingTasks.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(completedTasks.length / Math.max(todayTasks.length, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                Add new task
              </button>
              <button className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                Start focus session
              </button>
              <button className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                View analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard




