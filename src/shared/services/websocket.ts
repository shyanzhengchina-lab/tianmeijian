/**
 * WebSocket实时通信服务
 * 提供实时通知、设备状态监控、生产进度跟踪等功能
 */

class WebSocketService {
  private static instance: WebSocketService | null = null;

  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3秒重连间隔

  // 连接状态
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

  // 消息处理器
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  // 连接配置
  private config: {
    url: string;
    protocols?: string[];
    reconnect?: boolean;
    heartbeatInterval?: number;
  };

  // 心跳定时器
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeatTime: number = 0;

  /**
   * 获取单例实例
   */
  static getInstance(config: any): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService(config);
    }
    return WebSocketService.instance;
  }

  /**
   * 构造函数
   */
  private constructor(config: any) {
    this.config = config;
    this.connectionStatus = 'disconnected';
    this.lastHeartbeatTime = Date.now();
  }

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.connectionStatus === 'connected' || this.connectionStatus === 'connecting') {
          resolve();
          return;
        }

        this.connectionStatus = 'connecting';
        console.log('正在连接WebSocket:', this.config.url);

        this.socket = new WebSocket(this.config.url, this.config.protocols);

        this.socket.onopen = () => {
          console.log('WebSocket连接成功');
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.socket.onmessage = (event: MessageEvent) => {
          this.handleMessage(event.data);
        };

        this.socket.onerror = (error: Event) => {
          console.error('WebSocket错误:', error);
          this.connectionStatus = 'error';
          this.cleanup();
          reject(error);
        };

        this.socket.onclose = (event: CloseEvent) => {
          console.log('WebSocket连接关闭:', event.code, event.reason);
          this.connectionStatus = 'disconnected';
          this.cleanup();

          // 如果不是主动关闭，尝试重连
          if (this.config.reconnect !== false && event.code !== 1000) {
            this.scheduleReconnect();
          }
        };

        // 连接超时处理
        setTimeout(() => {
          if (this.connectionStatus === 'connecting') {
            console.error('WebSocket连接超时');
            this.connectionStatus = 'error';
            this.cleanup();
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10秒超时
      } catch (error: any) {
        console.error('创建WebSocket连接失败:', error);
        this.connectionStatus = 'error';
        reject(error);
      }
    });
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    if (this.socket && this.connectionStatus === 'connected') {
      console.log('主动断开WebSocket连接');

      // 清空重连计数器
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // 关闭Socket
      this.socket.close(1000, '主动断开');
      this.connectionStatus = 'disconnected';
      this.cleanup();
    }
  }

  /**
   * 发送消息
   */
  send(type: string, data: any): boolean {
    if (this.connectionStatus !== 'connected') {
      console.warn('WebSocket未连接，无法发送消息');
      return false;
    }

    try {
      const message = {
        type,
        data,
        timestamp: Date.now(),
      };

      this.socket!.send(JSON.stringify(message));
      return true;
    } catch (error: any) {
      console.error('发送WebSocket消息失败:', error);
      return false;
    }
  }

  /**
   * 订阅消息
   */
  subscribe(type: string, handler: (data: any) => void): () => void {
    const key = `handler_${type}`;
    this.messageHandlers.set(key, handler);

    // 返回取消订阅的函数
    return () => {
      this.messageHandlers.delete(key);
    };
  }

  /**
   * 批量订阅
   */
  subscribeAll(handlers: Record<string, (data: any) => void>): () => void {
    const unsubscribers: (() => void)[] = [];

    Object.entries(handlers).forEach(([type, handler]) => {
      const unsubscribe = this.subscribe(type, handler);
      unsubscribers.push(unsubscribe);
    });

    // 返回取消所有订阅的函数
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string): void {
    try {
      let message: any;

      // 尝试解析JSON
      if (typeof data === 'string') {
        message = JSON.parse(data);
      } else {
        message = data;
      }

      console.log('收到WebSocket消息:', message);

      const { type, data: messageData } = message;

      // 根据消息类型分发到不同的处理器
      const handlerKey = `handler_${type}`;
      const handler = this.messageHandlers.get(handlerKey);

      if (handler && typeof handler === 'function') {
        handler(messageData);
      } else {
        console.warn(`未找到消息类型 ${type} 的处理器`);
      }

      // 更新心跳时间
      if (type === 'pong') {
        this.lastHeartbeatTime = Date.now();
      }

    } catch (error: any) {
      console.error('处理WebSocket消息失败:', error);
    }
  }

  /**
   * 启动心跳机制
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    if (!this.config.heartbeatInterval) {
      return; // 不需要心跳
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.connectionStatus === 'connected') {
        this.send('ping', {});
      } else {
        this.stopHeartbeat();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * 停止心跳机制
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 检查连接状态
   */
  checkHeartbeat(): void {
    const now = Date.now();
    const timeout = 30000; // 30秒无心跳则认为断开

    if (now - this.lastHeartbeatTime > timeout) {
      console.warn('心跳超时，认为连接已断开');
      this.connectionStatus = 'error';
      this.cleanup();

      // 尝试重连
      this.scheduleReconnect();
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('已达到最大重连次数，停止重连');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000); // 最大30秒

    console.log(`准备第 ${this.reconnectAttempts} 次重连，延迟 ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        console.log('重连失败，将在下次尝试');
      });
    }, delay);
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      this.socket = null;
    }

    this.connectionStatus = 'disconnected';
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' | 'error' {
    return this.connectionStatus;
  }

  /**
   * 检查是否连接
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }
}

/**
 * WebSocket消息类型定义
 */
export enum WebSocketMessageType {
  // 设备状态消息
  DEVICE_STATUS_UPDATE = 'device_status_update',

  // 生产进度消息
  PRODUCTION_PROGRESS = 'production_progress',

  // 工单状态变更
  WORK_ORDER_STATUS_CHANGE = 'work_order_status_change',

  // 任务单状态变更
  TASK_ORDER_STATUS_CHANGE = 'task_order_status_change',

  // 通知消息
  NOTIFICATION = 'notification',

  // 系统消息
  SYSTEM_MESSAGE = 'system_message',

  // 心跳
  PING = 'ping',
  PONG = 'pong',
}

/**
 * 设备状态数据
 */
export interface DeviceStatusMessage {
  deviceId: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  lastSeen: number;
  parameters: Record<string, any>;
}

/**
 * 生产进度数据
 */
export interface ProductionProgressMessage {
  workOrderId: string;
  progress: number;
  completedQty: number;
  totalQty: number;
  eta?: string;
  issues?: string[];
}

/**
 * 通知消息数据
 */
export interface NotificationMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: any;
  timestamp: number;
  read?: boolean;
}

/**
 * 系统消息数据
 */
export interface SystemMessage {
  type: 'info' | 'warning' | 'error';
  message: string;
  code?: string;
  timestamp: number;
}

export default WebSocketService;