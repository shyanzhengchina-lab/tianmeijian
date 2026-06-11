/**
 * 系统权限表单组件
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Row,
  Col,
  Tree,
  Space,
} from 'antd';
import { usePermissionStore } from '../store';
import type {
  CreatePermissionDTO,
  UpdatePermissionDTO,
  CreateRoleDTO,
  UpdateRoleDTO,
  PermissionType,
  PermissionStatus,
  SystemPermission,
  Role,
} from '../types';
import { PERMISSION_TYPE_MAP } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface PermissionFormProps {
  visible: boolean;
  onClose: () => void;
  record?: SystemPermission | Role | null;
  mode: 'create' | 'edit';
  formType: 'permission' | 'role';
}

/**
 * 系统权限表单组件
 */
export const PermissionForm: React.FC<PermissionFormProps> = ({
  visible,
  onClose,
  record,
  mode,
  formType,
}) => {
  const [form] = Form.useForm();
  const { permissions, createPermission, updatePermission, createRole, updateRole, loading } = usePermissionStore();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (visible && record && mode === 'edit') {
      form.setFieldsValue(record);
      if (formType === 'role') {
        setSelectedPermissions((record as Role).permissions || []);
      }
    } else if (visible && mode === 'create') {
      form.resetFields();
      setSelectedPermissions([]);
    }
  }, [visible, record, mode, formType, form]);

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (formType === 'permission') {
        const formData: CreatePermissionDTO | UpdatePermissionDTO = {
          permissionKey: values.permissionKey,
          permissionName: values.permissionName,
          permissionType: values.permissionType,
          module: values.module,
          description: values.description,
          remark: values.remark,
        };

        if (mode === 'create') {
          await createPermission(formData as CreatePermissionDTO);
        } else if (mode === 'edit' && record) {
          await updatePermission({
            id: (record as SystemPermission).id,
            ...formData,
          } as UpdatePermissionDTO);
        }
      } else if (formType === 'role') {
        const formData: CreateRoleDTO | UpdateRoleDTO = {
          roleCode: values.roleCode,
          roleName: values.roleName,
          permissions: selectedPermissions,
          status: values.status,
          description: values.description,
          remark: values.remark,
        };

        if (mode === 'create') {
          await createRole(formData as CreateRoleDTO);
        } else if (mode === 'edit' && record) {
          await updateRole({
            id: (record as Role).id,
            ...formData,
          } as UpdateRoleDTO);
        }
      }

      form.resetFields();
      setSelectedPermissions([]);
      onClose();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /**
   * 权限树数据
   */
  const getPermissionTreeData = () => {
    const groupedPermissions: Record<string, any[]> = {};

    permissions.forEach(permission => {
      if (!groupedPermissions[permission.module]) {
        groupedPermissions[permission.module] = [];
      }
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
      });
    });

    return Object.keys(groupedPermissions).map(module => ({
      title: module,
      key: `module-${module}`,
      children: groupedPermissions[module],
    }));
  };

  return (
    <Modal
      title={
        formType === 'permission'
          ? (mode === 'create' ? '新增系统权限' : '编辑系统权限')
          : (mode === 'create' ? '新增角色' : '编辑角色')
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      width={800}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          permissionType: 'BUTTON',
          status: 'ACTIVE',
        }}
      >
        {formType === 'permission' ? (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="permissionKey"
                  label="权限键"
                  rules={[{ required: true, message: '请输入权限键' }]}
                >
                  <Input placeholder="例如: user:create" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="permissionName"
                  label="权限名称"
                  rules={[{ required: true, message: '请输入权限名称' }]}
                >
                  <Input placeholder="例如: 新增用户" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="permissionType"
                  label="权限类型"
                  rules={[{ required: true, message: '请选择权限类型' }]}
                >
                  <Select placeholder="请选择权限类型">
                    {Object.entries(PERMISSION_TYPE_MAP).map(([key, value]) => (
                      <Option key={key} value={key}>
                        {value.icon} {value.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="module"
                  label="所属模块"
                  rules={[{ required: true, message: '请输入所属模块' }]}
                >
                  <Input placeholder="例如: user, order, product" />
                </Form.Item>
              </Col>
            </Row>
          </>
        ) : (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="roleCode"
                  label="角色编码"
                  rules={[{ required: true, message: '请输入角色编码' }]}
                >
                  <Input placeholder="例如: ROLE_ADMIN" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="roleName"
                  label="角色名称"
                  rules={[{ required: true, message: '请输入角色名称' }]}
                >
                  <Input placeholder="例如: 系统管理员" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="permissions"
              label="权限分配"
            >
              <Tree
                checkable
                checkedKeys={selectedPermissions}
                onCheck={(checkedKeys: any) => {
                  setSelectedPermissions(checkedKeys as string[]);
                }}
                treeData={getPermissionTreeData()}
                style={{ maxHeight: 300, overflow: 'auto' }}
              />
            </Form.Item>

            <Form.Item
              name="status"
              label="状态"
              valuePropName="checked"
            >
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </>
        )}

        <Form.Item name="description" label="描述">
          <TextArea rows={3} placeholder="请输入描述" />
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <TextArea rows={2} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PermissionForm;
