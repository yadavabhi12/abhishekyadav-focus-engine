import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  CheckSquare,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  MessageCircle,
  X,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Overview of your productivity' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, description: 'Manage your tasks and to-dos' },
  { name: 'Calendar', href: '/calendar', icon: Calendar, description: 'View your schedule' },
  { name: 'Focus', href: '/focus', icon: Clock, description: 'Pomodoro timer and focus sessions' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, description: 'Track your progress' },
  { name: 'Profile', href: '/profile', icon: Settings, description: 'Manage your account' },
  { name: 'Chat', href: '/chat', icon: MessageCircle, description: 'Team collaboration' },
]

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()

  return (
    <>
      {/* Mobile Sidebar with animations */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-r border-gray-200/50 dark:border-gray-700/50 z-50 lg:hidden shadow-xl"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Productivity Pro
                      </h1>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Task Manager</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center p-4 rounded-2xl transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-200/50 dark:border-blue-700/30 shadow-md'
                            : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50 border border-transparent'
                        }`
                      }
                    >
                      <div className={`p-3 rounded-xl ${
                        location.pathname === item.href 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                      } transition-all duration-200`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <p className={`font-medium ${
                          location.pathname === item.href 
                            ? 'text-blue-700 dark:text-blue-300' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    </NavLink>
                  ))}
                </nav>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Made with ❤️ for productivity
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Fixed position but doesn't cover content */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 flex flex-col bg-gradient-to-b from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm border-r border-gray-200/50 dark:border-gray-700/50">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Productivity Pro
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Task Manager</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-200/50 dark:border-blue-700/30 shadow-lg'
                      : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50 border border-transparent'
                  }`
                }
              >
                <div className={`p-3 rounded-xl ${
                  location.pathname === item.href 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                } transition-all duration-200`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className={`font-medium ${
                    location.pathname === item.href 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Stay productive! 🚀
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar