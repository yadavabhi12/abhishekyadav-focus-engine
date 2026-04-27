import React, { useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotifications } from '../contexts/NotificationContext';
import { toast } from 'react-hot-toast';

const NotificationHandler = () => {
  const { socket, isConnected } = useWebSocket();
  const { addNotification, loadUnreadCount } = useNotifications();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (data) => {
      console.log('New notification received:', data);
      
      if (data.type === 'NOTIFICATION' && data.notification) {
        addNotification(data.notification);
        
        // Show toast notification
        showToastNotification(data.notification);
      }
      
      // Refresh unread count
      loadUnreadCount();
    };

    const handleAlarmNotification = (data) => {
      console.log('Alarm notification received:', data);
      
      if (data.type === 'ALARM_NOTIFICATION' && data.notification) {
        addNotification(data.notification);
        
        // Show special alarm toast
        showAlarmToast(data.notification);
      }
      
      // Refresh unread count
      loadUnreadCount();
    };

    socket.on('notification', handleNewNotification);
    socket.on('alarm_notification', handleAlarmNotification);

    return () => {
      socket.off('notification', handleNewNotification);
      socket.off('alarm_notification', handleAlarmNotification);
    };
  }, [socket, isConnected, addNotification, loadUnreadCount]);

  const showToastNotification = (notification) => {
    toast(notification.message, { 
      icon: '💬',
      position: 'top-right',
      duration: 4000
    });
  };

  const showAlarmToast = (notification) => {
    toast.success(notification.message, { 
      duration: 5000, 
      icon: '🔔',
      position: 'top-right'
    });
  };

  return null;
};

export default NotificationHandler;





