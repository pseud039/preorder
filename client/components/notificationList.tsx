'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Clock, Package, CreditCard, XCircle } from 'lucide-react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notification/notification.api';
import type { Notification } from '@/lib/notification/notification.types';

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('Please login to view notifications');
        setLoading(false);
        return;
      }

      const data = await getNotifications(accessToken, { limit: 50 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      await markNotificationAsRead(accessToken, notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      await markAllNotificationsAsRead(accessToken);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_ACCEPTED':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'ORDER_REJECTED':
      case 'ORDER_EXPIRED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'ORDER_PREPARING':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'ORDER_READY':
        return <Bell className="w-5 h-5 text-orange-600" />;
      case 'ORDER_COMPLETED':
        return <CheckCheck className="w-5 h-5 text-green-700" />;
      case 'PAYMENT_REQUIRED':
        return <CreditCard className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_ACCEPTED':
        return 'bg-green-50 border-green-200';
      case 'ORDER_REJECTED':
      case 'ORDER_EXPIRED':
        return 'bg-red-50 border-red-200';
      case 'ORDER_PREPARING':
        return 'bg-blue-50 border-blue-200';
      case 'ORDER_READY':
        return 'bg-orange-50 border-orange-200';
      case 'ORDER_COMPLETED':
        return 'bg-green-100 border-green-300';
      case 'PAYMENT_REQUIRED':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No notifications yet</p>
          <p className="text-gray-400 text-sm mt-2">
            You'll see order updates and important messages here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const data = notification.data ? JSON.parse(notification.data) : {};
            
            return (
              <div
                key={notification.id}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                className={`border rounded-lg p-4 transition-all cursor-pointer ${
                  getNotificationColor(notification.type)
                } ${
                  !notification.isRead
                    ? 'shadow-md border-l-4'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2 ml-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {notification.message}
                    </p>
                    {data.orderId && (
                      <a
                        href={`/orders/${data.orderId}`}
                        className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Order #{data.orderId} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
