/**
 * 通用操作栏组件
 * 显示表格上方的标题和操作按钮
 * 支持单个操作和批量操作
 * 确保UI/UX零变化
 */
import React from 'react';
import { Space, Button, Typography, Divider, Badge } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ActionItem } from '../../types/common';
export type { ActionItem };

const { Text } = Typography;

export interface ActionBarProps {
  title: string;
  actions?: ActionItem[];
  batchActions?: ActionItem[];
  selectedCount?: number;
  extra?: React.ReactNode;
  showSelectionInfo?: boolean;
}

/**
 * ActionBar组件
 * 显示标题、操作按钮和批量操作
 * 完全兼容现有页面的样式
 */
export const ActionBar = ({
  title,
  actions = [],
  batchActions = [],
  selectedCount = 0,
  extra,
  showSelectionInfo = false,
}: ActionBarProps) => {
  /**
   * 渲染操作按钮
   */
  const renderActions = (items: ActionItem[], showBadge = false) => {
    return (
      <Space size="small">
        {items.map(action => {
          const ButtonComponent = (
            <Button
              key={action.key}
              type={action.type || 'default'}
              danger={action.danger}
              icon={action.icon}
              onClick={action.onClick}
              disabled={action.disabled}
              loading={action.loading}
              size="small"
            >
              {action.label}
            </Button>
          );

          if (showBadge && selectedCount > 0) {
            return (
              <Badge
                key={action.key}
                count={selectedCount}
                size="small"
                offset={[10, 0]}
                style={{ backgroundColor: '#52c41a' }}
              >
                {ButtonComponent}
              </Badge>
            );
          }

          return ButtonComponent;
        })}
      </Space>
    );
  };

  /**
   * 渲染选择信息
   */
  const renderSelectionInfo = () => {
    if (!showSelectionInfo && selectedCount === 0) {
      return null;
    }

    return (
      <Space size="small">
        <Text type="secondary">
          已选择 <Text strong style={{ color: '#1677ff' }}>{selectedCount}</Text> 项
        </Text>
        <Divider type="vertical" />
      </Space>
    );
  };

  /**
   * 渲染默认操作（如果没有提供actions）
   */
  const renderDefaultActions = () => {
    if (actions.length === 0) {
      return (
        <Space size="small">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
          >
            新增
          </Button>
          <Button
            icon={<ReloadOutlined />}
            size="small"
          >
            刷新
          </Button>
        </Space>
      );
    }
    return null;
  };

  return (
    <div className="action-bar-container" style={{
      padding: '12px 16px',
      background: '#fff',
      borderBottom: '1px solid #e8ecf0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '8px'
    }}>
      {/* 左侧：标题和操作 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 auto' }}>
        <Text strong style={{ fontSize: '15px', color: '#1d2939' }}>
          {title}
        </Text>
        <Divider type="vertical" />
        {renderSelectionInfo()}
        {renderActions(actions)}
        {renderDefaultActions()}
      </div>

      {/* 右侧：批量操作和额外内容 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 0 auto' }}>
        {batchActions.length > 0 && selectedCount > 0 && (
          <>
            {renderActions(batchActions, true)}
            <Divider type="vertical" />
          </>
        )}
        {extra}
      </div>
    </div>
  );
};

export default ActionBar;