/**
 * 系统权限详情组件
 */

import React from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Button,
  Card,
  message,
  Tree,
  Divider,
} from 'antd';
import {
  KeyOutlined,
  LockOutlined,
  UnlockOutlined,
  EditOutlined,
  UserOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { usePermissionStore } from '../store';
import type { SystemPermission, Role } from '../types';
import {
  PERMISSION_TYPE_MAP,
  PERMISSION_STATUS_MAP,
} from '../types';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

interface PermissionDetailProps {
  visible: boolean;
  onClose: () => void;
  record: SystemPermission | Role | null;
  detailType: 'permission' | 'role';
}

/**
 * 系统权限详情组件
 */
export const PermissionDetail: React.FC<PermissionDetailProps> = ({
  visible,
  onClose,
  record,
  detailType,
}) => {
  const { permissions, updatePermissionStatus, updateRoleStatus, loading } = usePermissionStore();

  if (!record) return null;

  /**
   * 更新状态
   */
  const handleUpdateStatus = async (status: 'ACTIVE' | 'INACTIVE') => {
    if (detailType === 'permission') {
      await updatePermissionStatus([(record as SystemPermission).id], status);
    } else {
      await updateRoleStatus([(record as Role).id], status);
    }
  };

  /**
   * 获取权限树数据（仅用于角色详情）
   */
  const getPermissionTreeData = () => {
    const rolePermissions = (record as Role).permissions || [];

    const groupedPermissions: Record<string, any[]> = {};

    permissions.forEach(permission => {
      if (!groupedPermissions[permission.module]) {
        groupedPermissions[permission.module] = [];
      }

      const isChecked = rolePermissions.includes(permission.id);
      groupedPermissions[permission.module].push({
        title: (
          <Space>
            <span>{PERMISSION_TYPE_MAP[permission.permissionType]?.icon ?? '?'}</span>
            <span>{permission.permissionName}</span>
            <span style={{ color: '#999', fontSize: 12 }}>({permission.permissionKey})</span>
          </Space>
        ),
        key: permission.id,
        isLeaf: true,
        disabled: true,
        checked: isChecked,
      });
    });

    return Object.keys(groupedPermissions).map(module => ({
      title: module,
      key: `module-${module}`,
      disabled: true,
      children: groupedPermissions[module],
    }));
  };

  return (
    <Drawer
      title={
        detailType === 'permission' ? '权限详情' : '角色详情'
      }
      width={700}
      open={visible}
      onClose={onClose}
      destroyOnClose
      footer={
        <Space style={{ textAlign: 'right', width: '100%' }}>
          {(detailType === 'permission'
            ? (record as SystemPermission).status === 'ACTIVE'
            : (record as Role).status === 'ACTIVE') && (
            <Button
              icon={<LockOutlined />}
              danger
              onClick={() => handleUpdateStatus('INACTIVE')}
            >
              禁用
            </Button>
          )}
          {(detailType === 'permission'
            ? (record as SystemPermission).status === 'INACTIVE'
            : (record as Role).status === 'INACTIVE') && (
            <Button
              icon={<UnlockOutlined />}
              type="primary"
              onClick={() => handleUpdateStatus('ACTIVE')}
            >
              启用
            </Button>
          )}
          <Button
            icon={<EditOutlined />}
            onClick={() => message.info('编辑功能开发中')}
          >
            编辑
          </Button>
          <Button onClick={onClose}>关闭</Button>
        </Space>
      }
    >
      {detailType === 'permission' ? (
        <>
          {/* 基本信息 */}
          <Card
            title={
              <Space>
                <InfoCircleOutlined />
                基本信息
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={1} bordered>
              <Descriptions.Item label="权限键">
                <KeyOutlined /> {(record as SystemPermission).permissionKey}
              </Descriptions.Item>
              <Descriptions.Item label="权限名称">
                {(record as SystemPermission).permissionName}
              </Descriptions.Item>
              <Descriptions.Item label="权限类型">
                <Tag color={PERMISSION_TYPE_MAP[(record as SystemPermission).permissionType]?.color ?? 'default'}>
                  {PERMISSION_TYPE_MAP[(record as SystemPermission).permissionType]?.icon ?? ''}{' '}
                  {PERMISSION_TYPE_MAP[(record as SystemPermission).permissionType]?.label ?? String((record as SystemPermission).permissionType ?? '-')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="所属模块">
                {(record as SystemPermission).module}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <StatusBadge
                  status={(record as SystemPermission).status}
                  statusMap={PERMISSION_STATUS_MAP}
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 描述信息 */}
          <Card
            title={
              <Space>
                <FileTextOutlined />
                描述信息
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={1} bordered>
              <Descriptions.Item label="描述">
                {(record as SystemPermission).description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注">
                {(record as SystemPermission).remark || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 系统信息 */}
          <Card
            title={
              <Space>
                <SettingOutlined />
                系统信息
              </Space>
            }
          >
            <Descriptions column={2} bordered>
              <Descriptions.Item label="创建人">
                {(record as SystemPermission).createdBy}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {(record as SystemPermission).createdAt}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间" span={2}>
                {(record as SystemPermission).updatedAt}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      ) : (
        <>
          {/* 基本信息 */}
          <Card
            title={
              <Space>
                <UserOutlined />
                基本信息
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={1} bordered>
              <Descriptions.Item label="角色编码">
                <KeyOutlined /> {(record as Role).roleCode}
              </Descriptions.Item>
              <Descriptions.Item label="角色名称">
                {(record as Role).roleName}
              </Descriptions.Item>
              <Descriptions.Item label="权限数量">
                <Tag icon={<SafetyOutlined />} color="blue">
                  {(record as Role).permissionCount} 个权限
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <StatusBadge
                  status={(record as Role).status}
                  statusMap={PERMISSION_STATUS_MAP}
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 权限列表 */}
          <Card
            title={
              <Space>
                <SafetyOutlined />
                权限列表
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Tree
              checkable
              checkedKeys={(record as Role).permissions}
              treeData={getPermissionTreeData()}
              style={{ maxHeight: 400, overflow: 'auto' }}
              disabled
            />
          </Card>

          {/* 描述信息 */}
          <Card
            title={
              <Space>
                <FileTextOutlined />
                描述信息
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={1} bordered>
              <Descriptions.Item label="描述">
                {(record as Role).description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注">
                {(record as Role).remark || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 系统信息 */}
          <Card
            title={
              <Space>
                <SettingOutlined />
                系统信息
              </Space>
            }
          >
            <Descriptions column={2} bordered>
              <Descriptions.Item label="创建人">
                {(record as Role).createdBy}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {(record as Role).createdAt}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间" span={2}>
                {(record as Role).updatedAt}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      )}
    </Drawer>
  );
};

export default PermissionDetail;
