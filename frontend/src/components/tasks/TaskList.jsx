import React from 'react'
import TaskItem from './TaskItem'
import { motion, AnimatePresence } from 'framer-motion'

const TaskList = ({ 
  tasks, 
  showDate = true, 
  onEditTask, 
  onDeleteTask, 
  onSetAlarm,
  onShareTask,
  viewMode = 'list' 
}) => {
  if (tasks.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No tasks found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            {showDate ? "You're all caught up for now! Enjoy your free time." : "Try adjusting your filters or create something new."}
          </p>
        </div>
      </motion.div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={viewMode === 'grid' ? 
          'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 
          'space-y-3'
        }
      >
        {tasks.map((task) => (
          <motion.div
            key={task._id}
            variants={itemVariants}
            layout
            transition={{ duration: 0.2 }}
          >
            <TaskItem 
              task={task} 
              showDate={showDate}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onSetAlarm={onSetAlarm}
              onShare={onShareTask}
            />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}

export default TaskList
