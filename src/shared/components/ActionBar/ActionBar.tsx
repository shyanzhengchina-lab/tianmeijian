/**
 * 操作栏通用组件
 * 提供统一的操作栏布局
 */

import React from 'react';
import { Card, Space, Button, Tag, Dropdown, Badge } from 'antd';
import type { MenuProps } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

/**
 * 操作项
 */
export interface ActionItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
  showBadge?: boolean;
  badgeCount?: number;
  requirePermission?: string;
  confirm?: string;
}

/**
 * ActionBar组件Props
 */
export interface ActionBarProps {
  title: string;
  actions?: ActionItem[];
  selectedCount?: number;
  batchActions?: ActionItem[];
  extra?: React.ReactNode;
  cardProps?: React.ComponentProps<typeof Card>;
}

/**
 * ActionBar组件
 */
function ActionBar({
  title,
  actions = [],
  selectedCount = 0,
  batchActions = [],
  extra,
  cardProps,
}: ActionBarProps) {
  // 渲染单个操作
  const renderAction = (action: ActionItem) => {
    if (action.showBadge && action.badgeCount !== undefined) {
      return (
        <Badge count={action.badgeCount} size="small" offset={[10, 0]}>
          <Button
            key={action.key}
            type={action.danger ? 'primary' : 'default'}
            danger={action.danger}
            icon={action.icon}
            onClick={action.onClick}
            disabled={action.disabled}
            loading={action.loading}
          >
            {action.label}
          </Button>
        </Badge>
      );
    }

    return (
      <Button
        key={action.key}
        type={action.danger ? 'primary' : 'default'}
        danger={action.danger}
        icon={action.icon}
        onClick={action.onClick}
        disabled={action.disabled}
        loading={action.loading}
      >
        {action.label}
      </Button>
    );
  };

  // 渲染批量操作
  const renderBatchActions = () => {
    if (!batchActions || batchActions.length === 0) return null;

    const items: MenuProps['items'] = batchActions.map(action => ({
      key: action.key,
      label: action.label,
      icon: action.icon,
      onClick: action.onClick,
      danger: action.danger,
      disabled: action.disabled,
    }));

    return (
      <Dropdown menu={{ items }} trigger={['click']}>
        <Button
          icon={<MoreOutlined />}
          disabled={selectedCount === 0}
        >
          批量操作
        </Button>
      </Dropdown>
    );
  };

  // 渲染左侧操作区
  const renderLeftActions = () => {
    if (actions.length === 0) return null;

    return (
      <Space size="middle">
        {actions.map(action => renderAction(action))}
      </Space>
    );
  };

  // 渲染右侧操作区
  const renderRightActions = () => {
    return (
      <Space size="middle">
        {selectedCount > 0 && (
          <Tag color="blue" style={{ marginRight: 8 }}>
            已选 {selectedCount} 项
          </Tag>
        )}
        {renderBatchActions()}
        {extra}
      </Space>
    );
  };

  return (
    <Card
      {...cardProps}
      bordered={false}
      size="small"
      bodyStyle={{ padding: '12px 16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            {title}
          </span>
          {renderLeftActions()}
        </div>
        {renderRightActions()}
      </div>
    </Card>
  );
}

export default ActionBar;
