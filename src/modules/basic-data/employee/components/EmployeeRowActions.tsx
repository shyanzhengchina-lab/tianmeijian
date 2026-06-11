/**
 * Employee Row Actions Component
 * Handles individual row action buttons for employee table
 */

import React from 'react';
import { Button, Space, Popconfirm, Dropdown } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { Employee } from '../types';

interface EmployeeRowActionsProps {
  employee: Employee;
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
  onView: (employee: Employee) => void;
  onUpdate: (employee: Employee) => void;
  onDelete: (ids: string[]) => void;
  onLeave: (employee: Employee) => void;
  onResign: (employee: Employee) => void;
  onActivate: (employee: Employee) => void;
}

export const EmployeeRowActions: React.FC<EmployeeRowActionsProps> = ({
  employee,
  canUpdate,
  canDelete,
  canManage,
  onView,
  onUpdate,
  onDelete,
  onLeave,
  onResign,
  onActivate,
}) => {
  const getActions = () => {
    const actions: any[] = [];

    // Always show view action
    actions.push({
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      onClick: () => onView(employee),
    });

    // Show edit action for active employees
    if (employee.status === 'ACTIVE' && canUpdate) {
      actions.push({
        key: 'edit',
        label: '编辑',
        icon: <EditOutlined />,
        onClick: () => onUpdate(employee),
      });
    }

    // Status management actions based on permissions
    if (canManage) {
      if (employee.status === 'ACTIVE') {
        actions.push({
          key: 'leave',
          label: '请假',
          icon: <ClockCircleOutlined />,
          onClick: () => onLeave(employee),
        });

        actions.push({
          key: 'resign',
          label: '离职',
          icon: <LogoutOutlined />,
          onClick: () => onResign(employee),
          danger: true,
        });
      } else if (employee.status === 'LEAVE' || employee.status === 'RESIGNED') {
        actions.push({
          key: 'activate',
          label: '恢复',
          icon: <CheckCircleOutlined />,
          onClick: () => onActivate(employee),
        });
      }
    }

    // Always show delete action
    if (canDelete) {
      actions.push({
        key: 'delete',
        label: '删除',
        icon: <DeleteOutlined />,
        onClick: () => onDelete([employee.id]),
        danger: true,
      });
    }

    return actions;
  };

  const actions = getActions();

  if (actions.length <= 3) {
    return (
      <Space size="small" wrap>
        {actions.map((action) => {
          if (action.danger) {
            return (
              <Popconfirm
                key={action.key}
                title="确认删除"
                description={`确定要删除员工「${employee.name}」吗？`}
                onConfirm={action.onClick}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  icon={action.icon}
                  danger
                >
                  {action.label}
                </Button>
              </Popconfirm>
            );
          }
          return (
            <Button
              key={action.key}
              type="link"
              size="small"
              icon={action.icon}
              onClick={action.onClick}
              danger={action.danger}
            >
              {action.label}
            </Button>
          );
        })}
      </Space>
    );
  }

  // Use dropdown for more than 3 actions
  const menuItems = actions.slice(2).map((action) => ({
    key: action.key,
    label: action.label,
    icon: action.icon,
    onClick: action.onClick,
    danger: action.danger,
  }));

  return (
    <Space size="small">
      {actions.slice(0, 2).map((action) => {
        if (action.danger) {
          return (
            <Popconfirm
              key={action.key}
              title="确认删除"
              description={`确定要删除员工「${employee.name}」吗？`}
              onConfirm={action.onClick}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                icon={action.icon}
                danger
              >
                {action.label}
              </Button>
            </Popconfirm>
          );
        }
        return (
          <Button
            key={action.key}
            type="link"
            size="small"
            icon={action.icon}
            onClick={action.onClick}
            danger={action.danger}
          >
            {action.label}
          </Button>
        );
      })}
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button type="link" size="small" icon={<MoreOutlined />}>
          更多
        </Button>
      </Dropdown>
    </Space>
  );
};