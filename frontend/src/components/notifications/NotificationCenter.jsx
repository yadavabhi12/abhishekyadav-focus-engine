import React, { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle, X, CheckCheck, Trash2, Clock, AlertCircle, MailOpen, Mail } from 'lucide-react'
import { useNotifications } from '../../contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import Button from '../ui/Button'

const NotificationCenter = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotifications()
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const ref = useRef()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleDeleteAll = async () => {
    setIsDeleting(true)
    try {
      await deleteAllNotifications()
    } catch (error) {
      console.error('Error deleting all notifications:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification._id)
      }
      
      // Handle navigation based on notification type
      if (notification.taskId) {
        console.log('Navigate to task:', notification.taskId)
        // Implement navigation logic here
      }
      
      onClose();
    } catch (error) {
      console.error('Error handling notification click:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alarm': return <Bell className="h-4 w-4 text-yellow-600" />
      case 'comment': return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'assignment': return <CheckCheck className="h-4 w-4 text-green-600" />
      case 'focus': return <Clock className="h-4 w-4 text-purple-600" />
      case 'motivation': return <AlertCircle className="h-4 w-4 text-pink-600" />
      default: return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'alarm': return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
      case 'comment': return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
      case 'assignment': return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
      case 'focus': return 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500'
      case 'motivation': return 'bg-pink-50 dark:bg-pink-900/20 border-l-4 border-pink-500'
      default: return 'bg-gray-50 dark:bg-gray-800 border-l-4 border-gray-500'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') return !notification.read
    return true
  })

  if (!isOpen) return null

  return (
    <div ref={ref} className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <button onClick={handleDeleteAll} disabled={isDeleting} className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Clear all notifications">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex space-x-1">
          <button onClick={() => setActiveTab('all')} className={`px-3 py-1 text-sm rounded-full transition-colors ${activeTab === 'all' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            All ({notifications.length})
          </button>
          <button onClick={() => setActiveTab('unread')} className={`px-3 py-1 text-sm rounded-full transition-colors ${activeTab === 'unread' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filteredNotifications.length} {activeTab === 'unread' ? 'unread' : 'total'} notifications
            </span>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  Mark all read
                </button>
              )}
              <button onClick={handleDeleteAll} className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30" disabled={isDeleting}>
                {isDeleting ? 'Clearing...' : 'Clear all'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700">
              {activeTab === 'unread' ? <MailOpen className="h-6 w-6 text-gray-400" /> : <Mail className="h-6 w-6 text-gray-400" />}
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {activeTab === 'unread' ? "You're all caught up! New notifications will appear here." : 'Notifications will appear here when you receive them.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <div key={notification._id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 ${getNotificationColor(notification.type)} ${!notification.read ? 'ring-1 ring-blue-500/20' : ''}`} onClick={() => handleNotificationClick(notification)}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-500">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</p>
                      <div className="flex items-center space-x-2">
                        {!notification.read && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">New</span>}
                        <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title="Delete notification">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">{notifications.length} total notifications</span>
            <Button onClick={handleDeleteAll} variant="ghost" size="sm" disabled={isDeleting} className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
              {isDeleting ? 'Clearing...' : 'Clear all'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter




// // src/components/notifications/NotificationCenter.jsx
// import React, { useEffect, useRef, useState } from 'react';
// import { Bell, CheckCircle, X, CheckCheck, Trash2, Clock, AlertCircle } from 'lucide-react';
// import { useNotifications } from '../../contexts/NotificationContext';
// import { formatDistanceToNow } from 'date-fns';

// const NotificationCenter = ({ isOpen, onClose }) => {
//   const { 
//     notifications, 
//     unreadCount, 
//     markAsRead, 
//     markAllAsRead, 
//     deleteNotification,
//     deleteAllNotifications,
//     loading 
//   } = useNotifications();
  
//   const [selectedNotification, setSelectedNotification] = useState(null);
//   const ref = useRef();

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (ref.current && !ref.current.contains(event.target)) {
//         onClose();
//       }
//     };

//     if (isOpen) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [isOpen, onClose]);

//   const getNotificationIcon = (type) => {
//     switch (type) {
//       case 'alarm':
//         return <Bell className="h-4 w-4 text-yellow-600" />;
//       case 'comment':
//         return <CheckCircle className="h-4 w-4 text-blue-600" />;
//       case 'assignment':
//         return <CheckCheck className="h-4 w-4 text-green-600" />;
//       case 'focus':
//         return <Clock className="h-4 w-4 text-purple-600" />;
//       default:
//         return <AlertCircle className="h-4 w-4 text-gray-600" />;
//     }
//   };

//   const handleNotificationClick = (notification) => {
//     if (!notification.read) {
//       markAsRead(notification._id);
//     }
//     setSelectedNotification(notification);
//   };

//   const handleDelete = async (notificationId, e) => {
//     e.stopPropagation();
//     await deleteNotification(notificationId);
//     if (selectedNotification && selectedNotification._id === notificationId) {
//       setSelectedNotification(null);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex justify-end pt-16">
//       <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
      
//       <div
//         ref={ref}
//         className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 mt-2 h-[calc(100vh-5rem)] flex flex-col"
//       >
//         {/* Header */}
//         <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900">
//           <div className="flex items-center justify-between">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
//               <Bell className="h-5 w-5 mr-2" />
//               Notifications
//               {unreadCount > 0 && (
//                 <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
//                   {unreadCount} unread
//                 </span>
//               )}
//             </h3>
//             <div className="flex items-center space-x-2">
//               {unreadCount > 0 && (
//                 <button
//                   onClick={markAllAsRead}
//                   className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-gray-700"
//                   title="Mark all as read"
//                 >
//                   <CheckCircle className="h-4 w-4" />
//                 </button>
//               )}
//               {notifications.length > 0 && (
//                 <button
//                   onClick={deleteAllNotifications}
//                   className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-gray-700"
//                   title="Clear all notifications"
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </button>
//               )}
//               <button 
//                 onClick={onClose}
//                 className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
//               >
//                 <X className="h-4 w-4" />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex-1 flex overflow-hidden">
//           {/* Notification List */}
//           <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
//             {loading ? (
//               <div className="p-4 text-center">
//                 <div className="animate-pulse flex flex-col space-y-3">
//                   {[1, 2, 3].map(i => (
//                     <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded"></div>
//                   ))}
//                 </div>
//               </div>
//             ) : notifications.length === 0 ? (
//               <div className="p-8 text-center">
//                 <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
//                 <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
//                 <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
//                   You'll see notifications here when you get them
//                 </p>
//               </div>
//             ) : (
//               <div className="divide-y divide-gray-100 dark:divide-gray-700">
//                 {notifications.map((notification) => (
//                   <div
//                     key={notification._id}
//                     className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
//                       !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
//                     } ${selectedNotification?._id === notification._id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
//                     onClick={() => handleNotificationClick(notification)}
//                   >
//                     <div className="flex items-start space-x-3">
//                       <div className="flex-shrink-0 mt-1">
//                         {getNotificationIcon(notification.type)}
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
//                           {notification.title}
//                         </p>
//                         <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
//                           {notification.message}
//                         </p>
//                         <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
//                           {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
//                         </p>
//                       </div>
//                       <div className="flex flex-col items-end space-y-1">
//                         {!notification.read && (
//                           <div className="h-2 w-2 bg-blue-600 rounded-full" />
//                         )}
//                         <button
//                           onClick={(e) => handleDelete(notification._id, e)}
//                           className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded"
//                         >
//                           <X className="h-3 w-3" />
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Notification Detail */}
//           <div className="w-1/2 p-4 overflow-y-auto">
//             {selectedNotification ? (
//               <div className="space-y-4">
//                 <div className="flex items-center space-x-2">
//                   {getNotificationIcon(selectedNotification.type)}
//                   <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
//                     {selectedNotification.title}
//                   </h4>
//                 </div>
                
//                 <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
//                   <p className="text-sm text-gray-700 dark:text-gray-300">
//                     {selectedNotification.message}
//                   </p>
//                 </div>

//                 <div className="text-sm text-gray-500 dark:text-gray-400">
//                   <p>Received: {formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}</p>
//                   <p>Type: {selectedNotification.type}</p>
//                   {selectedNotification.taskId && (
//                     <p>Related to task: {selectedNotification.taskId}</p>
//                   )}
//                 </div>

//                 {!selectedNotification.read && (
//                   <button
//                     onClick={() => markAsRead(selectedNotification._id)}
//                     className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
//                   >
//                     Mark as Read
//                   </button>
//                 )}

//                 <button
//                   onClick={() => deleteNotification(selectedNotification._id)}
//                   className="w-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
//                 >
//                   <Trash2 className="h-4 w-4 mr-2" />
//                   Delete Notification
//                 </button>
//               </div>
//             ) : (
//               <div className="h-full flex items-center justify-center">
//                 <div className="text-center">
//                   <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
//                   <p className="text-gray-500 dark:text-gray-400">Select a notification to view details</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NotificationCenter;


// // src/components/notifications/NotificationCenter.jsx
// import React, { useEffect, useRef } from 'react'
// import { Bell, CheckCircle, X, CheckCheck } from 'lucide-react'
// import { useNotifications } from '../../contexts/NotificationContext'
// import { formatDistanceToNow } from 'date-fns'

// const NotificationCenter = ({ isOpen, onClose }) => {
//   const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
//   const ref = useRef()

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (ref.current && !ref.current.contains(event.target)) {
//         onClose()
//       }
//     }

//     if (isOpen) {
//       document.addEventListener('mousedown', handleClickOutside)
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside)
//     }
//   }, [isOpen, onClose])

//   if (!isOpen) return null

//   const getNotificationIcon = (type) => {
//     switch (type) {
//       case 'alarm':
//         return <Bell className="h-4 w-4 text-yellow-600" />
//       case 'comment':
//         return <CheckCircle className="h-4 w-4 text-blue-600" />
//       case 'assignment':
//         return <CheckCheck className="h-4 w-4 text-green-600" />
//       default:
//         return <Bell className="h-4 w-4 text-gray-600" />
//     }
//   }

//   return (
//     <div
//       ref={ref}
//       className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
//     >
//       <div className="p-4 border-b border-gray-200 dark:border-gray-700">
//         <div className="flex items-center justify-between">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
//             Notifications
//             {unreadCount > 0 && (
//               <span className="ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
//                 {unreadCount}
//               </span>
//             )}
//           </h3>
//           <div className="flex items-center space-x-2">
//             {unreadCount > 0 && (
//               <button
//                 onClick={markAllAsRead}
//                 className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
//               >
//                 Mark all read
//               </button>
//             )}
//             <button 
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
//             >
//               <X className="h-4 w-4" />
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="max-h-96 overflow-y-auto">
//         {notifications.length === 0 ? (
//           <div className="p-4 text-center text-gray-500 dark:text-gray-400">
//             No notifications
//           </div>
//         ) : (
//           <div className="divide-y divide-gray-100 dark:divide-gray-700">
//             {notifications.map((notification) => (
//               <div
//                 key={notification._id}
//                 className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
//                   !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
//                 }`}
//                 onClick={() => markAsRead(notification._id)}
//               >
//                 <div className="flex items-start space-x-3">
//                   <div className="flex-shrink-0">
//                     {getNotificationIcon(notification.type)}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-medium text-gray-900 dark:text-white">
//                       {notification.title}
//                     </p>
//                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
//                       {notification.message}
//                     </p>
//                     <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
//                       {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
//                     </p>
//                   </div>
//                   {!notification.read && (
//                     <div className="flex-shrink-0">
//                       <div className="h-2 w-2 bg-blue-600 rounded-full" />
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default NotificationCenter

