// src/components/alarms/AlarmModal.jsx
import { useState, useEffect } from 'react'
import { useAlarms } from '../../contexts/AlarmContext'
import { useTasks } from '../../contexts/TaskContext'
import { toast } from 'react-hot-toast'
import { Bell, Clock, X, Calendar } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Checkbox from '../ui/Checkbox'

const AlarmModal = ({ task, onClose, onSuccess }) => {
  const { setAlarm } = useAlarms()
  const { updateTask } = useTasks()
  const [loading, setLoading] = useState(false)
  const [alarmData, setAlarmData] = useState({
    enabled: task?.alarm?.enabled || false,
    time: task?.alarm?.time || '',
    sound: task?.alarm?.sound || 'default',
    vibration: task?.alarm?.vibration !== undefined ? task.alarm.vibration : true,
    repeat: {
      enabled: task?.alarm?.repeat?.enabled || false,
      days: task?.alarm?.repeat?.days || []
    }
  })

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ]

  const soundOptions = [
    { value: 'default', label: 'Default' },
    { value: 'gentle', label: 'Gentle' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'melodic', label: 'Melodic' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!alarmData.time) {
      toast.error('Please set alarm time')
      return
    }

    setLoading(true)
    try {
      if (task) {
        await setAlarm(task._id, alarmData)
        toast.success('Alarm set successfully')
        onSuccess()
      }
    } catch (error) {
      console.error('Error setting alarm:', error)
      toast.error('Failed to set alarm')
    } finally {
      setLoading(false)
    }
  }

  const handleDayToggle = (day) => {
    setAlarmData(prev => ({
      ...prev,
      repeat: {
        ...prev.repeat,
        days: prev.repeat.days.includes(day)
          ? prev.repeat.days.filter(d => d !== day)
          : [...prev.repeat.days, day]
      }
    }))
  }

  const handleRemoveAlarm = async () => {
    setLoading(true)
    try {
      await updateTask(task._id, {
        alarm: {
          enabled: false,
          time: '',
          repeat: { enabled: false, days: [] }
        }
      })
      toast.success('Alarm removed successfully')
      onSuccess()
    } catch (error) {
      console.error('Error removing alarm:', error)
      toast.error('Failed to remove alarm')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Set Alarm for Task
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {task?.title}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Checkbox
            label="Enable Alarm"
            checked={alarmData.enabled}
            onChange={(e) => setAlarmData(prev => ({ ...prev, enabled: e.target.checked }))}
            className="rounded-lg"
          />

          {alarmData.enabled && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Alarm Time
                </label>
                <Input
                  type="time"
                  value={alarmData.time}
                  onChange={(e) => setAlarmData(prev => ({ ...prev, time: e.target.value }))}
                  required
                  className="w-full rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sound
                </label>
                <Select
                  value={alarmData.sound}
                  onChange={(e) => setAlarmData(prev => ({ ...prev, sound: e.target.value }))}
                  options={soundOptions}
                  className="rounded-xl"
                />
              </div>

              <Checkbox
                label="Vibration"
                checked={alarmData.vibration}
                onChange={(e) => setAlarmData(prev => ({ ...prev, vibration: e.target.checked }))}
                className="rounded-lg"
              />

              <div className="space-y-3">
                <Checkbox
                  label="Repeat Alarm"
                  checked={alarmData.repeat.enabled}
                  onChange={(e) => setAlarmData(prev => ({
                    ...prev,
                    repeat: { ...prev.repeat, enabled: e.target.checked }
                  }))}
                  className="rounded-lg"
                />

                {alarmData.repeat.enabled && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Repeat on Days
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {daysOfWeek.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleDayToggle(day.value)}
                          className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                            alarmData.repeat.days.includes(day.value)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {day.label.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          {task?.alarm?.enabled && (
            <Button
              type="button"
              variant="danger"
              onClick={handleRemoveAlarm}
              disabled={loading}
              className="flex-1 rounded-xl py-3"
            >
              <X className="h-4 w-4 mr-2" />
              Remove Alarm
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || (alarmData.enabled && !alarmData.time)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl py-3"
          >
            <Bell className="h-4 w-4 mr-2" />
            {task?.alarm?.enabled ? 'Update Alarm' : 'Set Alarm'}
          </Button>
        </div>
      </form>

      {alarmData.enabled && alarmData.time && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              Alarm set for {alarmData.time}
              {alarmData.repeat.enabled && alarmData.repeat.days.length > 0 && (
                <span className="ml-1">
                  on {alarmData.repeat.days.map(day => daysOfWeek.find(d => d.value === day)?.label.slice(0, 3)).join(', ')}
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlarmModal





