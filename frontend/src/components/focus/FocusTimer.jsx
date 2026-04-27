import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Target, Coffee, BarChart3, Clock, Calendar, AlertCircle } from 'lucide-react';
import { useTasks } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { focusService } from '../../services/focus';
import { taskService } from '../../services/tasks';
import { userService } from '../../services/users';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Modal from '../ui/Modal';

const FocusTimer = () => {
  const { tasks, loadTasks, updateTask } = useTasks();
  const { user } = useAuth();

  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [sessionType, setSessionType] = useState('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [focusStats, setFocusStats] = useState({ 
    totalFocusMinutes: 0, 
    completedSessions: 0,
    distractions: 0
  });
  const [loading, setLoading] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [categoryStats, setCategoryStats] = useState({});
  const [distractions, setDistractions] = useState([]);
  const [showDistractionModal, setShowDistractionModal] = useState(false);
  const [newDistraction, setNewDistraction] = useState({ type: '', description: '' });
  const intervalRef = useRef(null);

  const sessionTimes = {
    work: user?.settings?.focusMode?.pomodoro?.workTime || 25,
    break: user?.settings?.focusMode?.pomodoro?.breakTime || 5,
    longBreak: user?.settings?.focusMode?.pomodoro?.longBreakTime || 15,
  };

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  useEffect(() => { 
    loadFocusStats(); 
    loadCategoryStats();
    // Load tasks if not already loaded
    if (tasks.length === 0) {
      loadTasks();
    }
  }, []);

  // Update task options when tasks change
  useEffect(() => {
    if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0]._id);
    }
  }, [tasks]);

  useEffect(() => {
    if (selectedTaskId && tasks.length > 0) {
      const task = tasks.find(t => t._id === selectedTaskId);
      setCurrentTask(task || null);
    } else {
      setCurrentTask(null);
    }
  }, [selectedTaskId, tasks]);

  const loadFocusStats = async () => {
    try {
      setLoading(true);
      const stats = await focusService.getTodayStats();
      setFocusStats({
        totalFocusMinutes: stats.totalFocusMinutes || 0,
        completedSessions: stats.completedSessions || 0,
        distractions: stats.distractions || 0
      });
    } catch (error) {
      console.error('Error loading focus stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryStats = async () => {
    try {
      const response = await userService.getCategoryStats();
      setCategoryStats(response.categoryStats || {});
    } catch (error) {
      console.error('Error loading category stats:', error);
    }
  };

  const startSession = async () => {
    try {
      setLoading(true);
      const startTime = new Date();
      setSessionStartTime(startTime);
      setIsActive(true);
      setDistractions([]);
      
      if (selectedTaskId && currentTask) {
        // Create a proper focus session object with all required fields
        const focusSession = {
          startTime: startTime,
          endTime: startTime,
          duration: 0,
          type: sessionType,
          completed: false,
          distractions: []
        };
        
        await updateTask(selectedTaskId, {
          status: 'in_progress',
          focusSessions: [...(currentTask.focusSessions || []), focusSession]
        });
      }
      
      toast.success('Session started 🚀');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    } finally { 
      setLoading(false); 
    }
  };

  const pauseSession = () => { 
    setIsActive(false); 
  };

  const resumeSession = () => {
    setIsActive(true);
  };

  const resetSession = () => {
    clearInterval(intervalRef.current);
    setIsActive(false);
    setTimeLeft(sessionTimes[sessionType] * 60);
    setSessionStartTime(null);
    setDistractions([]);
  };

  const addDistraction = async () => {
    if (!newDistraction.type) {
      toast.error('Please select a distraction type');
      return;
    }

    try {
      const distraction = {
        type: newDistraction.type,
        description: newDistraction.description,
        time: new Date()
      };

      setDistractions(prev => [...prev, distraction]);
      
      if (selectedTaskId) {
        await focusService.addDistraction(newDistraction.type, newDistraction.description);
      }

      setNewDistraction({ type: '', description: '' });
      setShowDistractionModal(false);
      toast.success('Distraction logged');
    } catch (error) {
      console.error('Error adding distraction:', error);
      toast.error('Failed to log distraction');
    }
  };

  const completeSession = async () => {
    clearInterval(intervalRef.current);
    setIsActive(false);
    const endTime = new Date();
    const actualMinutes = Math.max(1, Math.round((endTime - sessionStartTime) / 60000));
    
    try {
      // Update user focus stats
      await userService.updateFocusStats(new Date().toISOString().split('T')[0], {
        totalFocusMinutes: actualMinutes,
        completedSessions: sessionType === 'work' ? 1 : 0,
        distractions: distractions.length
      });
      
      // Update category time if task has a category
      if (currentTask && currentTask.category) {
        const categoryId = currentTask.category._id || currentTask.category;
        await userService.updateCategoryTime(categoryId, actualMinutes);
      }
      
      // Only update the task if we have a selected task
      if (selectedTaskId && currentTask) {
        try {
          // Create a complete focus session object
          const completedSession = {
            startTime: sessionStartTime,
            endTime: endTime,
            duration: actualMinutes,
            type: sessionType,
            completed: true,
            distractions: distractions
          };
          
          // Update the task
          await updateTask(selectedTaskId, {
            actualMinutes: (currentTask.actualMinutes || 0) + actualMinutes,
            focusSessions: [
              ...(currentTask.focusSessions || []).filter(s => !s.completed),
              completedSession
            ]
          });
        } catch (taskError) {
          console.error('Error updating task (non-critical):', taskError);
          // This is non-critical - the stats are already updated
        }
      }
      
      await loadFocusStats();
      await loadCategoryStats();
      toast.success(`Session complete: ${actualMinutes} min`);
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHoursMinutes = (mins) => {
    if (!mins || isNaN(mins)) return '0h 0m';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  const progress = ((sessionTimes[sessionType] * 60 - timeLeft) / (sessionTimes[sessionType] * 60)) * 100;
  
  const taskOptions = [
    { value: '', label: 'No Task' }, 
    ...tasks.filter(t => !t.completed).map(t => ({ 
      value: t._id, 
      label: t.title 
    }))
  ];

  // Get current category time
  const getCategoryTime = () => {
    if (!currentTask || !currentTask.category) return 0;
    
    const categoryId = currentTask.category._id || currentTask.category;
    return categoryStats[categoryId]?.totalMinutes || 0;
  };

  const distractionTypes = [
    { value: 'phone', label: 'Phone' },
    { value: 'email', label: 'Email' },
    { value: 'social', label: 'Social Media' },
    { value: 'noise', label: 'Noise' },
    { value: 'people', label: 'People' },
    { value: 'other', label: 'Other' }
  ];

  // Calculate average minutes per session
  const avgSessionMinutes = focusStats.completedSessions > 0 
    ? Math.round(focusStats.totalFocusMinutes / focusStats.completedSessions)
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
        Focus Timer
      </h2>
      
      {/* Timer Type Switch */}
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={() => { setSessionType('work'); resetSession(); }} 
          disabled={isActive}
          variant={sessionType === 'work' ? 'primary' : 'secondary'}
          className="flex items-center"
        > 
          <Target className="h-4 w-4 mr-2" /> Work ({sessionTimes.work}m)
        </Button>
        <Button 
          onClick={() => { setSessionType('break'); resetSession(); }} 
          disabled={isActive}
          variant={sessionType === 'break' ? 'primary' : 'secondary'}
          className="flex items-center"
        > 
          <Coffee className="h-4 w-4 mr-2" /> Break ({sessionTimes.break}m)
        </Button>
        <Button 
          onClick={() => { setSessionType('longBreak'); resetSession(); }} 
          disabled={isActive}
          variant={sessionType === 'longBreak' ? 'primary' : 'secondary'}
          className="flex items-center"
        > 
          <Coffee className="h-4 w-4 mr-2" /> Long Break ({sessionTimes.longBreak}m)
        </Button>
      </div>

      {/* Task Select */}
      <div className="max-w-md mx-auto">
        <Select
          label="Select Task"
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          options={taskOptions}
          disabled={isActive || tasks.length === 0}
        />
        {tasks.length === 0 && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            No tasks available. Create some tasks first.
          </p>
        )}
      </div>

      {/* Display selected task title */}
      {currentTask && (
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Current Task: {currentTask.title}
          </h3>
          {currentTask.category && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Category: {currentTask.category.name}
            </p>
          )}
          {currentTask.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {currentTask.description}
            </p>
          )}
        </div>
      )}

      {/* Timer Circle */}
      <div className="relative mx-auto w-64 h-64 text-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="8" fill="none"/>
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            stroke={sessionType === 'work' ? '#3B82F6' : sessionType === 'break' ? '#10B981' : '#F59E0B'} 
            strokeWidth="8" 
            strokeDasharray={`${progress} 100`} 
            fill="none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-gray-900 dark:text-white">{formatTime(timeLeft)}</div>
          <div className="text-sm text-gray-500 mt-1">
            {sessionType === 'work' ? 'Focus Time' : sessionType === 'break' ? 'Short Break' : 'Long Break'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-3">
        {!isActive ? (
          <Button onClick={startSession} disabled={loading || tasks.length === 0} className="flex items-center">
            <Play className="h-4 w-4 mr-2"/> Start
          </Button>
        ) : (
          <Button onClick={pauseSession} className="flex items-center">
            <Pause className="h-4 w-4 mr-2"/> Pause
          </Button>
        )}
        <Button onClick={resetSession} disabled={isActive} variant="secondary" className="flex items-center">
          <RotateCcw className="h-4 w-4 mr-2"/> Reset
        </Button>
        {isActive && (
          <Button onClick={() => setShowDistractionModal(true)} variant="outline" className="flex items-center">
            <span className="text-sm">+ Distraction</span>
          </Button>
        )}
      </div>

      {/* Distraction Counter */}
      {distractions.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Distractions: {distractions.length}
          </p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-xl font-bold dark:text-gray-300">
            {formatHoursMinutes(focusStats.totalFocusMinutes)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Focus</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold dark:text-gray-300">{focusStats.completedSessions}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold dark:text-gray-300">{focusStats.distractions}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Distractions</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold dark:text-gray-300">
            {formatHoursMinutes(avgSessionMinutes)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg/Session</div>
        </div>
      </div>

      {/* Category Time Display */}
      {currentTask && currentTask.category && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {formatHoursMinutes(getCategoryTime())}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Total time in {currentTask.category.name}
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      <Button 
        variant="outline" 
        onClick={() => setShowStats(true)} 
        className="mx-auto flex items-center"
      >
        <BarChart3 className="h-4 w-4 mr-2"/> View Stats
      </Button>
      
      {/* Stats Modal */}
      <Modal isOpen={showStats} onClose={() => setShowStats(false)} title="Focus Stats">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <div className="text-2xl font-bold">{formatHoursMinutes(focusStats.totalFocusMinutes)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Focus Time</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Target className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <div className="text-2xl font-bold">{focusStats.completedSessions}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed Sessions</div>
            </div>
          </div>
          
          {currentTask && currentTask.category && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {formatHoursMinutes(getCategoryTime())}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Time in {currentTask.category.name}
                </div>
              </div>
            </div>
          )}
          
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                {focusStats.distractions}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                Total Distractions
              </div>
            </div>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {formatHoursMinutes(avgSessionMinutes)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                Average per Session
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Distraction Modal */}
      <Modal isOpen={showDistractionModal} onClose={() => setShowDistractionModal(false)} title="Log Distraction">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Distraction Type
            </label>
            <Select
              value={newDistraction.type}
              onChange={(e) => setNewDistraction({...newDistraction, type: e.target.value})}
              options={[
                { value: '', label: 'Select type' },
                ...distractionTypes
              ]}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={newDistraction.description}
              onChange={(e) => setNewDistraction({...newDistraction, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="What distracted you?"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowDistractionModal(false)}>
              Cancel
            </Button>
            <Button onClick={addDistraction} disabled={!newDistraction.type}>
              Add Distraction
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FocusTimer;





