export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface NotificationData {
  type?: string;
  orderId?: number;
  restaurantId?: number;
  url?: string;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface VapidKeyResponse {
  publicKey: string;
}

export interface NotificationPermissionState {
  isSubscribed: boolean;
  isSupported: boolean;
  permission: NotificationPermission;
}

export type NotificationType = 
  | 'ORDER_PLACED'
  | 'ORDER_ACCEPTED'
  | 'ORDER_REJECTED'
  | 'ORDER_MODIFIED'
  | 'ORDER_CANCELLED'
  | 'ORDER_EXPIRED'
  | 'PAYMENT_REQUIRED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_EXPIRED'
  | 'ORDER_PREPARING'
  | 'ORDER_READY'
  | 'ORDER_COMPLETED'
  | 'SETTLEMENT_PROCESSED';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  unreadCount: number;
}