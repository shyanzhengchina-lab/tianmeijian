/**
 * 批量操作进度指示器组件
 * 提供实时的批量操作进度反馈，支持进度显示、错误处理和取消操作
 */

import React, { useEffect, useState } from 'react';
import { Modal, Progress, Button, Space, Typography, Alert, List, Tag } from 'antd';
import { CloseOutlined, CheckCircleOutlined, ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

/**
 * 批量操作项状态
 */
export type BatchItemStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';

/**
 * 批量操作项
 */
export interface BatchOperationItem {
  id: string;
  name: string;
  status: BatchItemStatus;
  error?: string;
}

/**
 * 批量操作进度状态
 */
export interface BatchProgressState {
  visible: boolean;
  title: string;
  operationType: string;
  total: number;
  processed: number;
  successCount: number;
  failedCount: number;
  items: BatchOperationItem[];
  isCancelled: boolean;
  isComplete: boolean;
}

/**
 * BatchProgressModal 组件属性
 */
export interface BatchProgressModalProps {
  progress: BatchProgressState;
  onCancel?: () => void;
  onClose?: () => void;
  showDetails?: boolean;
}

/**
 * 获取状态图标
 */
const getStatusIcon = (status: BatchItemStatus) => {
  switch (status) {
    case 'processing':
      return <LoadingOutlined style={{ color: '#1890ff' }} />;
    case 'success':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'failed':
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    case 'cancelled':
      return <CloseOutlined style={{ color: '#999' }} />;
    default:
      return null;
  }
};

/**
 * 获取状态标签颜色
 */
const getStatusColor = (status: BatchItemStatus) => {
  switch (status) {
    case 'processing':
      return 'blue';
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    case 'cancelled':
      return 'default';
    default:
      return 'default';
  }
};

/**
 * 获取状态文本
 */
const getStatusText = (status: BatchItemStatus) => {
  switch (status) {
    case 'pending':
      return '待处理';
    case 'processing':
      return '处理中';
    case 'success':
      return '成功';
    case 'failed':
      return '失败';
    case 'cancelled':
      return '已取消';
    default:
      return '';
  }
};

/**
 * BatchProgressModal 组件
 */
export const BatchProgressModal: React.FC<BatchProgressModalProps> = ({
  progress,
  onCancel,
  onClose,
  showDetails = true,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 计算进度百分比
  const progressPercent = progress.total > 0
    ? Math.round((progress.processed / progress.total) * 100)
    : 0;

  // 是否可以取消
  const canCancel = !progress.isComplete && !progress.isCancelled;

  // 获取失败的项
  const failedItems = progress.items.filter(item => item.status === 'failed');

  // 切换展开/收起
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <Modal
      title={progress.title}
      open={progress.visible}
      onCancel={onClose}
      footer={progress.isComplete ? [
        <Button key="close" type="primary" onClick={onClose}>
          关闭
        </Button>,
      ] : null}
      closable={progress.isComplete}
      maskClosable={false}
      width={600}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 操作类型和进度 */}
        <div>
          <Text strong style={{ fontSize: 16 }}>
            {progress.operationType}
          </Text>
          <div style={{ marginTop: 12 }}>
            <Progress
              percent={progressPercent}
              status={progress.isCancelled ? 'exception' : (progress.isComplete ? 'success' : 'active')}
              strokeColor={progress.isCancelled ? '#ff4d4f' : undefined}
              format={(percent) => `${progress.processed}/${progress.total} (${percent}%)`}
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
          <Text type="secondary">
            总计: {progress.total}
          </Text>
          <Text style={{ color: '#52c41a' }}>
            成功: {progress.successCount}
          </Text>
          <Text style={{ color: '#ff4d4f' }}>
            失败: {progress.failedCount}
          </Text>
          {progress.isCancelled && (
            <Text style={{ color: '#999' }}>
              已取消
            </Text>
          )}
        </div>

        {/* 失败提示 */}
        {failedItems.length > 0 && progress.isComplete && (
          <Alert
            message={`${failedItems.length} 个项目处理失败`}
            description="请查看下方详情了解具体错误信息"
            type="error"
            showIcon
          />
        )}

        {/* 取消按钮 */}
        {canCancel && (
          <div style={{ textAlign: 'right' }}>
            <Button
              danger
              onClick={onCancel}
              icon={<CloseOutlined />}
            >
              取消操作
            </Button>
          </div>
        )}

        {/* 详细信息列表 */}
        {showDetails && progress.items.length > 0 && (
          <div>
            <Text strong>处理详情</Text>
            <List
              size="small"
              style={{ marginTop: 8, maxHeight: 300, overflowY: 'auto' }}
              dataSource={progress.items.slice(0, 50)} // 最多显示50条
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  actions={[
                    item.status === 'failed' && item.error && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => toggleExpand(item.id)}
                      >
                        {expandedItems.has(item.id) ? '收起' : '查看详情'}
                      </Button>
                    ),
                  ]}
                >
                  <Space size="small">
                    {getStatusIcon(item.status)}
                    <Text
                      style={{
                        textDecoration: item.status === 'failed' ? 'line-through' : undefined,
                        opacity: item.status === 'cancelled' ? 0.5 : 1,
                      }}
                    >
                      {item.name}
                    </Text>
                    <Tag color={getStatusColor(item.status)} style={{ margin: 0 }}>
                      {getStatusText(item.status)}
                    </Tag>
                  </Space>
                  {item.status === 'failed' && item.error && expandedItems.has(item.id) && (
                    <div style={{ width: '100%', marginTop: 8 }}>
                      <Text type="danger" style={{ fontSize: 12 }}>
                        错误: {item.error}
                      </Text>
                    </div>
                  )}
                </List.Item>
              )}
            />
            {progress.items.length > 50 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                还有 {progress.items.length - 50} 项未显示...
              </Text>
            )}
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default BatchProgressModal;
