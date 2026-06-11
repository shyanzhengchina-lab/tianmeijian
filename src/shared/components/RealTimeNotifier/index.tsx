/**
 * 实时通知组件
 * 提供实时消息推送、在线状态显示、数据更新通知等功能
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Badge,
  Dropdown,
  Menu,
  Button,
  Space,
  Tag,
  Tooltip,
  List,
  Empty,
  Divider,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  BellOutlined,
  WifiOutlined,
  DisconnectOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useWebSocket, useNotifications } from '@/shared/hooks/useWebSocket';
import type { NotificationMessage } from '@/shared/services/websocket';
import { message } from 'antd';
import './styles.css';

const { Text, Paragraph } = Typography;

/**
 * 实时通知组件Props
 */
export interface RealTimeNotifierProps {
  /**
   * 是否自动连接
   */
  autoConnect?: boolean;

  /**
   * WebSocket URL
   */
  wsUrl?: string;

  /**
   * 最大通知数量
   */
  maxNotifications?: number;

  /**
   * 通知点击回调
   */
  onNotificationClick?: (notification: NotificationMessage) => void;

  /**
   * 连接状态变化回调
   */
  onConnectionChange?: (connected: boolean) => void;

  /**
   * 自定义样式
   */
  className?: string;
}

/**
 * 实时通知组件
 */
const RealTimeNotifier: React.FC<RealTimeNotifierProps> = ({
  autoConnect = true,
  wsUrl,
  maxNotifications = 50,
  onNotificationClick,
  onConnectionChange,
  className,
}) => {
  const {
    connected,
    connecting,
    error,
    send,
    disconnect,
  } = useWebSocket({
    autoConnect,
    url: wsUrl,
  });

  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    clearNotifications,
  } = useNotifications();

  const [notificationMenuVisible, setNotificationMenuVisible] = useState(false);
  const connectionStatusRef = useRef(connected);

  /**
   * 监听连接状态变化
   */
  useEffect(() => {
    if (connectionStatusRef.current !== connected) {
      onConnectionChange?.(connected);
      connectionStatusRef.current = connected;

      if (connected) {
        message.success('实时连接已建立');
      } else if (error) {
        message.error('实时连接已断开');
      }
    }
  }, [connected, error, onConnectionChange]);

  /**
   * 处理通知点击
   */
  const handleNotificationClick = useCallback((notification: NotificationMessage) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    onNotificationClick?.(notification);

    // 关闭菜单
    setNotificationMenuVisible(false);
  }, [markAsRead, onNotificationClick]);

  /**
   * 标记所有通知为已读
   */
  const handleMarkAllRead = useCallback(() => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
    });
    message.success('已标记所有通知为已读');
  }, [notifications, markAsRead]);

  /**
   * 清除所有通知
   */
  const handleClearAll = useCallback(() => {
    clearNotifications();
    message.success('已清除所有通知');
  }, [clearNotifications]);

  /**
   * 获取通知图标
   */
  const getNotificationIcon = (type: NotificationMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'info':
      default:
        return <InfoCircleOutlined style={{ color: '#1677ff' }} />;
    }
  };

  /**
   * 获取通知颜色
   */
  const getNotificationColor = (type: NotificationMessage['type']) => {
    switch (type) {
      case 'success':
        return '#f6ffed';
      case 'warning':
        return '#fffbe6';
      case 'error':
        return '#fff1f0';
      case 'info':
      default:
        return '#e6f7ff';
    }
  };

  /**
   * 格式化时间
   */
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return new Date(timestamp).toLocaleDateString('zh-CN');
    }
  };

  /**
   * 连接状态指示器
   */
  const ConnectionStatus: React.FC = () => {
    if (connecting) {
      return (
        <Tooltip title="正在连接...">
          <SyncOutlined spin style={{ color: '#1677ff' }} />
        </Tooltip>
      );
    }

    if (connected) {
      return (
        <Tooltip title="已连接">
          <WifiOutlined style={{ color: '#52c41a' }} />
        </Tooltip>
      );
    }

    return (
      <Tooltip title="已断开连接">
        <DisconnectOutlined style={{ color: '#ff4d4f' }} />
      </Tooltip>
    );
  };

  /**
   * 通知菜单内容
   */
  const notificationMenuContent = (
    <div className="notification-dropdown-menu" style={{ width: 400, maxHeight: 500 }}>
      <div className="notification-header">
        <Space>
          <Text strong>通知中心</Text>
          <Tag color="blue">{unreadCount} 未读</Tag>
        </Space>
        <Space>
          {unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              onClick={handleMarkAllRead}
            >
              全部已读
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              type="link"
              size="small"
              danger
              onClick={handleClearAll}
            >
              清空
            </Button>
          )}
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {notifications.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无通知"
          style={{ padding: '40px 0' }}
        />
      ) : (
        <List
          className="notification-list"
          dataSource={notifications.slice(0, maxNotifications)}
          renderItem={(notification) => (
            <List.Item
              key={notification.id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              style={{
                backgroundColor: getNotificationColor(notification.type),
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <List.Item.Meta
                avatar={getNotificationIcon(notification.type)}
                title={
                  <Space>
                    <Text strong={!notification.read}>
                      {notification.title}
                    </Text>
                    {!notification.read && (
                      <Tag color="red">新</Tag>
                    )}
                  </Space>
                }
                description={
                  <div>
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      style={{ marginBottom: 4 }}
                    >
                      {notification.message}
                    </Paragraph>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatTime(notification.timestamp)}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <div className={`real-time-notifier ${className || ''}`}>
      <Space>
        {/* 连接状态 */}
        <Tooltip title={`连接状态: ${connected ? '已连接' : '已断开'}`}>
          <Button
            type="text"
            icon={<ConnectionStatus />}
            onClick={() => {
              if (connected) {
                disconnect();
              } else {
                message.info('正在重新连接...');
              }
            }}
          />
        </Tooltip>

        {/* 通知中心 */}
        <Dropdown
          menu={{ items: [] }}
          dropdownRender={() => notificationMenuContent}
          placement="bottomRight"
          open={notificationMenuVisible}
          onOpenChange={setNotificationMenuVisible}
          trigger={['click']}
        >
          <Badge count={unreadCount} overflowCount={99} offset={[-5, 5]}>
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: 18 }} />}
              className="notification-button"
            />
          </Badge>
        </Dropdown>
      </Space>
    </div>
  );
};

/**
 * 在线状态指示器组件
 */
export const OnlineStatusIndicator: React.FC<{
  userId: string;
  userName: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
  lastSeen?: number;
}> = ({ userId, userName, status = 'online', lastSeen }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return '#52c41a';
      case 'offline':
        return '#bfbfbf';
      case 'busy':
        return '#ff4d4f';
      case 'away':
        return '#faad14';
      default:
        return '#bfbfbf';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return '在线';
      case 'offline':
        return '离线';
      case 'busy':
        return '忙碌';
      case 'away':
        return '离开';
      default:
        return '未知';
    }
  };

  return (
    <div className="online-status-indicator">
      <div
        className="status-dot"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: getStatusColor(),
          display: 'inline-block',
          marginRight: 8,
        }}
      />
      <Text>{userName}</Text>
      <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
        {getStatusText()}
      </Text>
      {lastSeen && status === 'offline' && (
        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
          ({new Date(lastSeen).toLocaleTimeString()})
        </Text>
      )}
    </div>
  );
};

/**
 * 实时统计卡片组件
 */
export const RealTimeStatsCard: React.FC<{
  title: string;
  value: number;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  loading?: boolean;
}> = ({ title, value, prefix, suffix, trend, loading }) => {
  return (
    <Card loading={loading}>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color: trend?.isUp ? '#52c41a' : '#ff4d4f' }}
      />
      {trend && (
        <div style={{ marginTop: 8 }}>
          <Text
            type={trend.isUp ? 'success' : 'danger'}
            style={{ fontSize: 14 }}
          >
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Text>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            较上期
          </Text>
        </div>
      )}
    </Card>
  );
};

/**
 * 实时数据更新指示器
 */
export const RealTimeUpdateIndicator: React.FC<{
  lastUpdateTime: number;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onRefreshNow: () => void;
}> = ({ lastUpdateTime, autoRefresh, onToggleAutoRefresh, onRefreshNow }) => {
  return (
    <div className="realtime-update-indicator">
      <Space>
        <Button
          type="text"
          icon={<SyncOutlined spin={autoRefresh} />}
          onClick={onToggleAutoRefresh}
        >
          {autoRefresh ? '自动刷新中' : '开启自动刷新'}
        </Button>
        <Button
          type="text"
          size="small"
          onClick={onRefreshNow}
        >
          立即刷新
        </Button>
        <Text type="secondary" style={{ fontSize: 12 }}>
          最后更新: {new Date(lastUpdateTime).toLocaleTimeString()}
        </Text>
      </Space>
    </div>
  );
};

export default RealTimeNotifier;
