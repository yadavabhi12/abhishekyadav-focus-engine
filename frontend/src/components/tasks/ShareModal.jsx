import React, { useState } from 'react'
import { Share2, UserPlus, Mail, Users, Copy } from 'lucide-react'
import { taskService } from '../../services/tasks'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { toast } from 'react-hot-toast'

const ShareModal = ({ task, onClose, onSuccess }) => {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState('viewer')
  const [loading, setLoading] = useState(false)

  const handleShare = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    setLoading(true)
    try {
      await taskService.shareTask(task._id, email, permission)
      toast.success(`Task shared with ${email}`)
      setEmail('')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to share task')
      console.error('Error sharing task:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateShareLink = () => {
    // This would typically generate a secure share link
    const link = `${window.location.origin}/task/${task._id}`
    navigator.clipboard.writeText(link)
    toast.success('Share link copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Share2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Share this task with others</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleShare} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Share via Email
          </label>
          <div className="flex space-x-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="viewer">Viewer</option>
              <option value="commenter">Commenter</option>
              <option value="editor">Editor</option>
            </select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Share Task
        </Button>
      </form>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Currently Shared With
        </h4>
        
        {task.sharedWith?.length > 0 ? (
          <div className="space-y-2">
            {task.sharedWith.map((share) => (
              <div key={share._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {share.userId?.email || share.userId}
                </span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                  {share.permission}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            This task hasn't been shared with anyone yet.
          </p>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <Button
          onClick={generateShareLink}
          variant="secondary"
          className="w-full"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Shareable Link
        </Button>
      </div>
    </div>
  )
}

export default ShareModal