// lib/notification/client.ts
// CLIENT-SIDE ONLY notification utilities for Next.js 15

'use client';

import type { 
  PushSubscriptionData, 
  VapidKeyResponse, 
  ApiResponse 
} from './notification.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    console.log('✅ Notification permission granted');
    return true;
  } else {
    console.log('❌ Notification permission denied');
    return false;
  }
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker registered');

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (confirm('New version available! Reload?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

export const subscribeToPushNotifications = async (accessToken: string): Promise<PushSubscription> => {
  try {
    console.log('🔔 Starting push subscription...');

    // 1. Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      throw new Error('Notification permission denied');
    }

    // 2. Register service worker
    let registration = await navigator.serviceWorker.ready;
    if (!registration) {
      const reg = await registerServiceWorker();
      if (!reg) {
        throw new Error('Service Worker registration failed');
      }
      registration = await navigator.serviceWorker.ready;
    }

    // 3. Get VAPID public key from backend
    const keyResponse = await fetch(`${API_BASE_URL}/api/client/notifications/vapid-public-key`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!keyResponse.ok) {
      throw new Error('Failed to fetch VAPID public key');
    }

    const keyData: ApiResponse<VapidKeyResponse> = await keyResponse.json();
    const vapidPublicKey = keyData.data.publicKey;

    // 4. Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Already subscribed, resubscribing...');
      await subscription.unsubscribe();
    }

    // 5. Subscribe to push
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey
    });

    console.log('Push subscription created');

    // 6. Send subscription to backend
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!)
      }
    };

    const subscribeResponse = await fetch(`${API_BASE_URL}/api/client/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ subscription: subscriptionData })
    });

    if (!subscribeResponse.ok) {
      throw new Error('Failed to save subscription on server');
    }

    console.log('✅ Successfully subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('❌ Push subscription error:', error);
    throw error;
  }
};

export const unsubscribeFromPushNotifications = async (accessToken: string): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      await fetch(`${API_BASE_URL}/api/client/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      console.log('✅ Unsubscribed from push notifications');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Unsubscribe error:', error);
    throw error;
  }
};

export const checkPushSubscription = async (): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};