/**
 * 通用状态标签组件
 * 显示各种状态，保持与现有状态标签完全一致的样式
 * 确保UI/UX零变化
 */
import React from 'react';
import { Tag } from 'antd';

export interface StatusBadgeProps {
  status: string | number;
  statusMap: Record<string, { label: string; color: string; bg?: string; border?: string }>;
  size?: 'small' | 'default' | 'large';
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * StatusBadge组件
 * 根据状态映射显示对应的标签样式
 * 完全兼容现有页面的状态显示方式
 */
export const StatusBadge = ({
  status,
  statusMap,
  size = 'default',
  style,
  onClick,
}: StatusBadgeProps) => {
  // 获取状态配置
  const statusConfig = statusMap[status];

  // 如果没有找到状态配置，使用默认样式
  const label = statusConfig?.label || String(status);
  const color = statusConfig?.color || 'default';
  const backgroundColor = statusConfig?.bg;
  const borderColor = statusConfig?.border;

  // 渲染标签
  return (
    <Tag
      color={color}
      style={{
        backgroundColor,
        borderColor,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onClick={onClick}
    >
      {label}
    </Tag>
  );
};

/**
 * 预定义的状态映射（常用状态）
 */
export const COMMON_STATUS_MAP = {
  // 通用启用/禁用状态
  active: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  inactive: { label: '禁用', color: '#cf1322', bg: '#fff1f0', border: '#ffa39e' },
  enabled: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  disabled: { label: '禁用', color: '#cf1322', bg: '#fff1f0', border: '#ffa39e' },

  // 流程状态
  pending: { label: '待处理', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  processing: { label: '处理中', color: '#1677ff', bg: '#e6f4ff', border: '#91caff' },
  completed: { label: '已完成', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  failed: { label: '失败', color: '#cf1322', bg: '#fff1f0', border: '#ffa39e' },

  // 文档状态
  draft: { label: '草稿', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  audited: { label: '已审核', color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' },
  approved: { label: '已批准', color: '#1677FF', bg: '#e6f4ff', border: '#91caff' },
  rejected: { label: '已拒绝', color: '#cf1322', bg: '#fff1f0', border: '#ffa39e' },

  // 任务状态
  todo: { label: '待办', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  doing: { label: '进行中', color: '#1677ff', bg: '#e6f4ff', border: '#91caff' },
  done: { label: '已完成', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  cancelled: { label: '已取消', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 简化的状态标签组件（使用常用状态映射）
 */
export const SimpleStatusBadge = ({
  status,
  size = 'default',
  style,
  onClick,
}: Omit<StatusBadgeProps, 'statusMap'>) => {
  return (
    <StatusBadge
      status={status}
      statusMap={COMMON_STATUS_MAP}
      size={size}
      style={style}
      onClick={onClick}
    />
  );
};

export default StatusBadge;