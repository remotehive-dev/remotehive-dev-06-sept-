import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export interface RealTimeNotification {
  id: string;
  title: string;
  message: string;
  type: 'new_user_registration' | 'new_lead' | 'system_alert' | 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: Record<string, unknown>;
  created_at: string;
  read: boolean;
  target_audience?: string;
}

export interface UserRegistrationPayload {
  notification_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  user_data: {
    user_id: string;
    email: string;
    full_name: string;
    role: 'employer' | 'job_seeker';
  };
  timestamp: string;
}

interface UseRealTimeNotificationsReturn {
  notifications: RealTimeNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isConnected: boolean;
}

export function useRealTimeNotifications(): UseRealTimeNotificationsReturn {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Fetch initial notifications
    fetchNotifications();
    setIsConnected(true);

    // Set up polling for new notifications (replace real-time subscription)
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error fetching notifications:', response.statusText);
        return;
      }

      const data = await response.json();
      const notificationsData = data.data || [];
      
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter((n: RealTimeNotification) => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };



  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: [notificationId],
          read: true
        })
      });

      if (!response.ok) {
        console.error('Error marking notification as read:', response.statusText);
        return;
      }

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: unreadIds,
          read: true
        })
      });

      if (!response.ok) {
        console.error('Error marking all notifications as read:', response.statusText);
        return;
      }

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected
  };
}