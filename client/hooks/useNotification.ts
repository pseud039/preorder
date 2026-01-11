'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  checkPushSubscription, 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications 
} from '@/lib/notification/client';

interface NotificationState {
  isSubscribed: boolean;
  isSupported: boolean;
  permission: NotificationPermission;
}

export const useNotifications = (accessToken: string | null) => {
  const [state, setState] = useState<NotificationState>({
    isSubscribed: false,
    isSupported: true,
    permission: 'default'
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check browser support
    if (typeof window === 'undefined') return;
    
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      permission: Notification.permission 
    }));

    // Check current subscription
    checkPushSubscription().then(isSubscribed => {
      setState(prev => ({ ...prev, isSubscribed }));
    }).catch(err => {
      console.error('Error checking subscription:', err);
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!accessToken) {
      setError('Please login first');
      throw new Error('Authentication required');
    }

    setLoading(true);
    setError(null);

    try {
      await subscribeToPushNotifications(accessToken);
      setState(prev => ({ 
        ...prev, 
        isSubscribed: true,
        permission: Notification.permission 
      }));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const unsubscribe = useCallback(async () => {
    if (!accessToken) {
      setError('Please login first');
      throw new Error('Authentication required');
    }

    setLoading(true);
    setError(null);

    try {
      await unsubscribeFromPushNotifications(accessToken);
      setState(prev => ({ ...prev, isSubscribed: false }));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  return {
    ...state,
    loading,
    error,
    subscribe,
    unsubscribe
  };
};