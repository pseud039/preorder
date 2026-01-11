'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNotificationSound } from '@/hooks/notificationSound';
import { Bell, ShoppingBag, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { io as socketIo, Socket } from 'socket.io-client';

interface User {
  id: number;
  role: string;
  name?: string;
}

interface NotificationData {
  id?: number;
  type: string;
  title: string;
  message: string;
  data?: {
    orderId?: number;
    orderTotal?: number;
    customerName?: string;
    restaurantStatus?: string;
  };
  createdAt?: string;
}

export function NotificationListener(){
  const { playSound } = useNotificationSound();

  useEffect(() => {
    // const user = 
    // if (!user) return;
    
    // // Only for admin and chef roles (NOT customer)
    // if (user.role == 'admin' && user.role !== 'chef') return;

    // // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    //   socket.emit('join', user.id);
    });

    socket.on('notification', (notification: NotificationData) => {
      console.log('Notification received:', notification);
      
      // Play sound FIRST (critical for attention)
      playSound(notification.type);

      // Get appropriate icon
      const getIcon = (type: string) => {
        switch(type) {
          case 'ORDER_PLACED': return ShoppingBag;
          case 'ORDER_ACCEPTED':
          case 'ORDER_COMPLETED':
          case 'PAYMENT_RECEIVED': return CheckCircle2;
          case 'ORDER_REJECTED':
          case 'ORDER_EXPIRED':
          case 'PAYMENT_EXPIRED': return XCircle;
          case 'ORDER_PREPARING':
          case 'ORDER_READY': return Clock;
          default: return Bell;
        }
      };

      const Icon = getIcon(notification.type);

      // Show toast based on notification type
      const isError = ['ORDER_REJECTED', 'ORDER_EXPIRED', 'PAYMENT_EXPIRED'].includes(notification.type);
      const isSuccess = ['ORDER_ACCEPTED', 'ORDER_COMPLETED', 'PAYMENT_RECEIVED'].includes(notification.type);
      const isWarning = ['PAYMENT_REQUIRED', 'ORDER_READY'].includes(notification.type);

      const toastOptions: any = {
        description: notification.message,
        duration: notification.type === 'ORDER_PLACED' ? 10000 : 5000,
        icon: <Icon className="w-5 h-5" />,
        action: notification.data?.orderId ? {
          label: 'View Order',
          onClick: () => {
            window.location.href = `/admin/orders/${notification.data!.orderId}`;
          }
        } : undefined,
        style: {
          border: '2px solid',
        }
      };

      // Add specific styling based on type
      if (notification.type === 'ORDER_PLACED') {
        toastOptions.style.borderColor = '#f59e0b'; 
        toastOptions.style.backgroundColor = '#fffbeb';
      }

      if (isError) {
        toast.error(notification.title, toastOptions);
      } else if (isSuccess) {
        toast.success(notification.title, toastOptions);
      } else if (isWarning) {
        toast.warning(notification.title, toastOptions);
      } else {
        toast.info(notification.title, toastOptions);
      }

      // Additional browser notification for critical events
      if (notification.type === 'ORDER_PLACED' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: `order-${notification.data?.orderId}`,
            requireInteraction: true // Keeps notification until user dismisses
          });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error:any) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socket.off('notification');
      socket.disconnect();
    };
  }, [playSound]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  return null; // This is a listener component, renders nothing
}
function io(url: string, options: { withCredentials: boolean; transports: string[]; }): Socket {
    return socketIo(url, options);
}

