/**
 * WebSocket React Hook
 * 提供便捷的WebSocket连接和消息处理功能
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { message } from 'antd';
import WebSocketService, { WebSocketMessageType } from '@/shared/services/websocket';
import type {
  DeviceStatusMessage,
  ProductionProgressMessage,
  NotificationMessage,
  SystemMessage,
} from '@/shared/services/websocket';

/**
 * WebSocket Hook返回值
 */
export interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  send: (type: string, data: any) => void;
  disconnect: () => void;
}

/**
 * WebSocket状态
 */
export interface WebSocketState {
  deviceStatus: Record<string, DeviceStatusMessage>;
  productionProgress: Record<string, ProductionProgressMessage>;
  notifications: NotificationMessage[];
  systemMessages: SystemMessage[];
}

/**
 * WebSocket Hook
 */
export function useWebSocket(config?: {
  autoConnect?: boolean;
  url?: string;
}): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const webSocketServiceRef = useRef<WebSocketService | null>(null);
  const unSubscribeRef = useRef<(() => void) | null>(null);

  // 创建WebSocket服务实例
  const createWebSocketService = useCallback((): WebSocketService => {
    if (!webSocketServiceRef.current) {
      const wsConfig = {
        url: config?.url || 'ws://localhost:8080/ws',
        protocols: ['mqtt'],
        reconnect: true,
        heartbeatInterval: 30000, // 30秒心跳
      };

      webSocketServiceRef.current = WebSocketService.getInstance(wsConfig);
      console.log('WebSocket服务已创建');
    }
    return webSocketServiceRef.current!;
  }, [config?.url]);

  // 连接处理
  const connect = useCallback(async () => {
    if (!webSocketServiceRef.current) {
      createWebSocketService();
    }

    try {
      await webSocketServiceRef.current!.connect();
      message.success('WebSocket连接成功');
    } catch (err) {
      console.error('WebSocket连接失败:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      message.error('WebSocket连接失败');
    }
  }, []);

  // 断开连接处理
  const disconnect = useCallback(() => {
    if (webSocketServiceRef.current) {
      webSocketServiceRef.current.disconnect();
      setConnected(false);
      message.info('WebSocket已断开');
    }
  }, []);

  // 发送消息处理
  const send = useCallback((type: string, data: any): void => {
    if (webSocketServiceRef.current) {
      const success = webSocketServiceRef.current.send(type, data);
      if (!success) {
        message.warning('消息发送失败：WebSocket未连接');
      }
    }
  }, []);

  // 连接状态更新
  const updateConnectionStatus = useCallback(() => {
    if (!webSocketServiceRef.current) return;

    const status = webSocketServiceRef.current.getConnectionStatus();

    setConnecting(status === 'connecting');
    setConnected(status === 'connected');
    setError(status === 'error' ? new Error('WebSocket connection error') : null);
  }, []);

  // 自动连接处理
  useEffect(() => {
    const service = createWebSocketService();

    // 订阅连接状态更新
    const statusHandler = () => {
      updateConnectionStatus();
    };

    // 订阅设备状态
    const deviceHandler = (data: DeviceStatusMessage) => {
      console.log('收到设备状态更新:', data);
      // 可以在这里更新本地状态或触发重新加载
    };

    // 订阅生产进度
    const progressHandler = (data: ProductionProgressMessage) => {
      console.log('收到生产进度更新:', data);
      // 可以在这里更新进度显示
      message.info(`工单 ${data.workOrderId} 生产进度更新：${data.progress}%`);
    };

    // 订阅通知
    const notificationHandler = (data: NotificationMessage) => {
      console.log('收到通知:', data);
      // 显示通知
      if (data.type === 'error') {
        message.error(`${data.title}：${data.message}`);
      } else if (data.type === 'warning') {
        message.warning(`${data.title}：${data.message}`);
      } else if (data.type === 'success') {
        message.success(`${data.title}：${data.message}`);
      } else {
        message.info(data.title);
      }

      // 如果未读，可以显示角标
      if (!data.read) {
        // TODO: 更新未读通知数量
      }
    };

    // 订阅系统消息
    const systemMessageHandler = (data: SystemMessage) => {
      console.log('收到系统消息:', data);
      // 显示系统消息
      if (data.type === 'error') {
        message.error(data.message, 3000);
      } else if (data.type === 'warning') {
        message.warning(data.message, 3000);
      } else {
        message.info(data.message, 3000);
      }
    };

    // 订阅所有消息
    unSubscribeRef.current = service.subscribeAll({
      [WebSocketMessageType.DEVICE_STATUS_UPDATE]: deviceHandler,
      [WebSocketMessageType.PRODUCTION_PROGRESS]: progressHandler,
      [WebSocketMessageType.NOTIFICATION]: notificationHandler,
      [WebSocketMessageType.SYSTEM_MESSAGE]: systemMessageHandler,
    });

    // 自动连接
    if (config?.autoConnect !== false) {
      connect();
    }

    // 清理函数
    return () => {
      if (unSubscribeRef.current) {
        unSubscribeRef.current();
        unSubscribeRef.current = null;
      }

      if (webSocketServiceRef.current) {
        webSocketServiceRef.current.disconnect();
        webSocketServiceRef.current = null;
      }

      console.log('WebSocket Hook已清理');
    };
  }, [connect, disconnect, createWebSocketService, updateConnectionStatus, config?.autoConnect]);

  return {
    connected,
    connecting,
    error,
    send,
    disconnect,
  };
}

/**
 * 设备状态Hook
 */
export function useDeviceStatus() {
  const [deviceStatus, setDeviceStatus] = useState<Record<string, DeviceStatusMessage>>({});

  const updateDeviceStatus = useCallback((deviceId: string, status: DeviceStatusMessage) => {
    setDeviceStatus(prev => ({
      ...prev,
      [deviceId]: status,
    }));
  }, []);

  return {
    deviceStatus,
    updateDeviceStatus,
  };
}

/**
 * 生产进度Hook
 */
export function useProductionProgress() {
  const [progress, setProgress] = useState<Record<string, ProductionProgressMessage>>({});

  const updateProgress = useCallback((workOrderId: string, progress: number) => {
    setProgress(prev => ({
      ...prev,
      [workOrderId]: { ...prev[workOrderId], progress },
    }));
  }, []);

  return {
    progress,
    updateProgress,
  };
}

/**
 * 通知Hook
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: NotificationMessage) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }

    // 显示新通知
    if (notification.type === 'error') {
      message.error(`${notification.title}：${notification.message}`);
    } else if (notification.type === 'warning') {
      message.warning(`${notification.title}：${notification.message}`);
    } else if (notification.type === 'success') {
      message.success(`${notification.title}：${notification.message}`);
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    clearNotifications,
  };
}

export default useWebSocket;