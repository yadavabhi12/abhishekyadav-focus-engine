import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext' // Import from context
import { WebSocketProvider } from './contexts/WebSocketContext'
import { TaskProvider } from './contexts/TaskContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ChatProvider } from './contexts/ChatContext'
import { AlarmProvider } from './contexts/AlarmContext'
import Layout from './components/layout/Layout'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import Analytics from './pages/Analytics'
import FocusMode from './pages/FocusMode'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import PrivateRoute from './components/PrivateRoute'
import NotificationHandler from './components/NotificationHandler'
import AlarmManager from './components/alarms/AlarmManager'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  useEffect(() => {
    // Check and request notification permission more gracefully
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // Silent catch - user might have blocked notifications
        console.log('Notification permission not granted');
      });
    }
    
    const isDarkMode = localStorage.getItem('darkMode') === 'true'
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <WebSocketProvider>
          <TaskProvider>
            <NotificationProvider>
              <ChatProvider>
                <AlarmProvider>
                  <Router>
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={
                          <PrivateRoute>
                            <Layout />
                          </PrivateRoute>
                        }>
                          <Route index element={<Navigate to="/dashboard" replace />} />
                          <Route path="dashboard" element={<Dashboard />} />
                          <Route path="tasks" element={<Tasks />} />
                          <Route path="calendar" element={<Calendar />} />
                          <Route path="analytics" element={<Analytics />} />
                          <Route path="focus" element={<FocusMode />} />
                          <Route path="profile" element={<Profile />} />
                          <Route path="chat" element={<Chat />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                      <Toaster 
                        position="top-right"
                        toastOptions={{
                          duration: 4000,
                          style: { 
                            background: '#363636', 
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '12px 16px'
                          },
                          success: { 
                            duration: 3000, 
                            iconTheme: { 
                              primary: '#10B981', 
                              secondary: '#fff' 
                            } 
                          },
                          error: {
                            duration: 4000,
                            iconTheme: {
                              primary: '#EF4444',
                              secondary: '#fff'
                            }
                          }
                        }}
                      />
                      <NotificationHandler />
                      <AlarmManager />
                    </div>
                  </Router>
                </AlarmProvider>
              </ChatProvider>
            </NotificationProvider>
          </TaskProvider>
        </WebSocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App


