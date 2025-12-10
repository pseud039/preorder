'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { useEffect, useState } from 'react';

export default function NotificationToggle() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { isSubscribed, isSupported, permission, loading, error, subscribe, unsubscribe } = useNotifications(accessToken);

  useEffect(() => {
    // Get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      setAccessToken(token);
    }
  }, []);

  if (!accessToken) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p className="font-medium">⚠️ Please login to enable notifications</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p className="font-medium">⚠️ Browser Not Supported</p>
        <p className="text-sm mt-1">
          Your browser doesn't support push notifications. Please use Chrome, Firefox, or Edge.
        </p>
      </div>
    );
  }

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        alert('🔕 Notifications disabled');
      } else {
        await subscribe();
        alert('🔔 Notifications enabled! You will receive order updates even when the app is closed.');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      alert('Failed to toggle notifications. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start space-x-4">
        <div className="text-4xl">
          {isSubscribed ? '🔔' : '🔕'}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            Real-Time Order Notifications
          </h3>
          <p className="text-gray-600 mb-4">
            {isSubscribed 
              ? '✅ You will receive notifications even when the app is closed or your phone is locked' 
              : 'Enable notifications to get instant updates about your orders'}
          </p>

          <div className="space-y-2 mb-4 text-sm text-gray-600">
            <p>📱 Get notified when:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Restaurant accepts/rejects your order</li>
              <li>Payment is required (10-minute timer)</li>
              <li>Your order is being prepared</li>
              <li>Your order is ready for pickup</li>
              <li>Order is completed</li>
            </ul>
          </div>

          <button
            onClick={handleToggle}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isSubscribed 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : isSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-600">
              ❌ {error}
            </p>
          )}
        </div>
      </div>

      {permission === 'denied' && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">❌ Notifications Blocked</p>
          <p className="text-sm mt-2">
            You have blocked notifications. To enable them:
          </p>
          <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
            <li><strong>Chrome:</strong> Click the lock icon in address bar → Site settings → Notifications → Allow</li>
            <li><strong>Firefox:</strong> Click the shield icon → Permissions → Notifications → Allow</li>
            <li><strong>Safari:</strong> Safari → Settings → Websites → Notifications → Allow</li>
          </ul>
        </div>
      )}

      <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
        <p className="font-medium">💡 Pro Tip</p>
        <p className="mt-1">
          Notifications work even when:
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
          <li>The browser tab is closed</li>
          <li>Your phone screen is locked</li>
          <li>You're using other apps</li>
        </ul>
        <p className="mt-2">
          This ensures you never miss important order updates!
        </p>
      </div>
    </div>
  );
}