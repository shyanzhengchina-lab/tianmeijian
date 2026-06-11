/**
 * 详情抽屉通用组件
 * 封装Ant Design Drawer，提供统一的详情显示功能
 */

import React from 'react';
import { Drawer, Descriptions, Button, Space, Divider } from 'antd';
import type { DrawerProps } from 'antd/es/drawer';
import type { DetailField } from '../../types/common';

/**
 * DetailDrawer操作按钮
 */
export interface DetailDrawerAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
}

/**
 * DetailDrawer组件Props
 */
export interface DetailDrawerProps<T extends Record<string, any> = Record<string, any>> extends Omit<DrawerProps, 'children'> {
  visible: boolean;
  title: string;
  fields?: DetailField[];
  data?: T | null;
  onClose: () => void;
  width?: number | string;
  loading?: boolean;
  extra?: React.ReactNode;
  showActions?: boolean;
  actions?: DetailDrawerAction[];
  onEdit?: () => void;
  onDelete?: () => void;
  drawerProps?: Omit<DrawerProps, 'visible' | 'title' | 'onClose'>;
  detailComponent?: React.ComponentType<any>;
  [key: string]: any; // allow extra props
}

/**
 * 简化版详情抽屉
 */
export interface SimpleDetailDrawerProps {
  visible: boolean;
  title: string;
  data?: Record<string, any>;
  onClose: () => void;
}

/**
 * 简化版详情抽屉组件
 */
export function SimpleDetailDrawer({
  visible,
  title,
  data = {},
  onClose,
}: SimpleDetailDrawerProps) {
  // 将数据转换为详情字段
  const fields: DetailField[] = Object.entries(data).map(([key, value]) => ({
    label: key,
    value,
    type: typeof value === 'number' ? 'number' : 'text',
  }));

  return (
    <DetailDrawer
      visible={visible}
      title={title}
      fields={fields}
      onClose={onClose}
      showActions={false}
    />
  );
}

/**
 * DetailDrawer组件
 */
function DetailDrawer<T extends Record<string, any>>({
  visible,
  title,
  fields,
  data: _data,
  onClose,
  loading = false,
  width = 600,
  extra,
  showActions = true,
  actions,
  onEdit,
  onDelete,
  drawerProps,
}: DetailDrawerProps<T>) {
  // 渲染字段
  const renderField = (field: DetailField) => {
    const content = field.render ? (
      field.render(field.value)
    ) : (
      <span>
        {field.value !== undefined && field.value !== null ? field.value.toString() : '-'}
      </span>
    );

    return (
      <Descriptions.Item label={field.label} span={field.span || 1}>
        {content}
      </Descriptions.Item>
    );
  };

  // 渲染操作按钮
  const renderActions = () => {
    if (!showActions) return null;

    // Support both custom actions array and default edit/delete
    if (actions && actions.length > 0) {
      return (
        <Space style={{ marginTop: 16 }}>
          {actions.map(action => (
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
          ))}
        </Space>
      );
    }

    return (
      <Space style={{ marginTop: 16 }}>
        {onEdit && (
          <Button type="primary" onClick={onEdit}>
            编辑
          </Button>
        )}
        {onDelete && (
          <Button danger onClick={onDelete}>
            删除
          </Button>
        )}
      </Space>
    );
  };

  return (
    <Drawer
      {...drawerProps}
      title={title}
      open={visible}
      onClose={onClose}
      width={width}
      footer={showActions ? renderActions() : undefined}
      loading={loading}
      destroyOnClose
    >
      <Descriptions
        bordered
        column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
        size="middle"
      >
        {(fields ?? []).map((field, index) => (
          <React.Fragment key={index}>
            {renderField(field)}
            {index < (fields ?? []).length - 1 && ((fields ?? [])[index + 1]?.span || 1) === 1 && (
              <Divider style={{ margin: '12px 0' }} />
            )}
          </React.Fragment>
        ))}
      </Descriptions>
      {extra && (
        <div style={{ marginTop: 24 }}>
          <Divider />
          {extra}
        </div>
      )}
    </Drawer>
  );
}

export default DetailDrawer;
