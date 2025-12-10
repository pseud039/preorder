// lib/api/notification.api.ts
import type { 
  ApiResponse, 
  NotificationResponse, 
  Notification 
} from '@/lib/notification/notification.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Get user's notifications
 */
export const getNotifications = async (
  accessToken: string,
  params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }
): Promise<NotificationResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.unreadOnly) queryParams.set('unreadOnly', 'true');

  const response = await fetch(
    `${API_BASE_URL}/api/client/notifications?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  const result: ApiResponse<NotificationResponse> = await response.json();
  return result.data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  accessToken: string,
  notificationId: number
): Promise<Notification> => {
  const response = await fetch(
    `${API_BASE_URL}/api/client/notifications/${notificationId}/read`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }

  const result: ApiResponse<{ notification: Notification }> = await response.json();
  return result.data.notification;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (
  accessToken: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/client/notifications/read-all`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }
};

/**
 * Test notification (development only)
 */
export const sendTestNotification = async (
  accessToken: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/client/notifications/test`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to send test notification');
  }
};