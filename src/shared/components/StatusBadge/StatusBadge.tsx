/**
 * 状态标签通用组件
 * 提供统一的状态显示样式
 */

import React from 'react';
import { Tag } from 'antd';

/**
 * StatusBadge组件Props
 */
export interface StatusBadgeProps {
  status: string | number;
  statusMap?: Record<string, { label: string; color: string; bg: string; border: string }>;
  size?: 'small' | 'default' | 'large';
  text?: string;
}

/**
 * 常用状态映射
 */
export const COMMON_STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  inactive: { label: '禁用', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
  draft: { label: '草稿', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  running: { label: '运行中', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  stopped: { label: '已停止', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  pending: { label: '待处理', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  success: { label: '成功', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  error: { label: '失败', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
};

/**
 * 简化版状态标签组件
 */
export interface SimpleStatusBadgeProps {
  status: string;
  text?: string;
}

export function SimpleStatusBadge({ status, text }: SimpleStatusBadgeProps) {
  const statusConfig = COMMON_STATUS_MAP[status] || COMMON_STATUS_MAP.active;

  return (
    <Tag
      color={statusConfig.color}
      style={{
        backgroundColor: statusConfig.bg,
        borderColor: statusConfig.border,
        border: '1px solid',
      }}
    >
      {text || statusConfig.label}
    </Tag>
  );
}

/**
 * StatusBadge组件
 */
function StatusBadge({
  status,
  statusMap = COMMON_STATUS_MAP,
  size = 'default',
  text,
}: StatusBadgeProps) {
  const statusConfig = (statusMap && statusMap[status]) || COMMON_STATUS_MAP[status] || COMMON_STATUS_MAP.active;

  return (
    <Tag
      color={statusConfig.color}
      style={{
        backgroundColor: statusConfig.bg,
        borderColor: statusConfig.border,
        border: '1px solid',
      }}
      {...(size !== 'default' && { size })}
    >
      {text || statusConfig.label}
    </Tag>
  );
}

export default StatusBadge;
