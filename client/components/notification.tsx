import React, { useState, useEffect } from 'react';
import { 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  checkPushSubscription 
} from '@/lib/notification/client';

interface NotificationPermissionProps {
  className?: string;
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({ className = '' }) => {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setIsSupported(false);
      return;
    }

    // Check current subscription status
    checkPushSubscription().then(setIsSubscribed).catch(err => {
      console.error('Error checking subscription:', err);
    });
  }, []);

  const handleSubscribe = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('Please login first');
        return;
      }

      await subscribeToPushNotifications(accessToken);
      setIsSubscribed(true);
      alert('🔔 Notifications enabled! You will receive order updates.');
    } catch (err) {
      console.error('Subscription error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to enable notifications: ${errorMessage}`);
      alert(`Failed to enable notifications: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('Please login first');
        return;
      }

      await unsubscribeFromPushNotifications(accessToken);
      setIsSubscribed(false);
      alert('🔕 Notifications disabled.');
    } catch (err) {
      console.error('Unsubscribe error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to disable notifications: ${errorMessage}`);
      alert(`Failed to disable notifications: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className={`bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded ${className}`}>
        <p className="font-medium">⚠️ Browser Not Supported</p>
        <p className="text-sm">
          Your browser doesn't support push notifications. Please use Chrome, Firefox, or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="text-4xl">
          {isSubscribed ? '🔔' : '🔕'}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            Order Notifications
          </h3>
          <p className="text-gray-600 mb-4">
            {isSubscribed 
              ? '✅ You will receive notifications about your orders' 
              : 'Enable notifications to get real-time order updates on this device'}
          </p>
          <button
            onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isSubscribed 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : isSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
          </button>

          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>

      {Notification.permission === 'denied' && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">❌ Notifications Blocked</p>
          <p className="text-sm mt-1">
            You have blocked notifications. To enable them:
            <br />• Chrome: Click the lock icon in address bar → Notifications → Allow
            <br />• Firefox: Click the shield icon → Permissions → Notifications → Allow
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationPermission;