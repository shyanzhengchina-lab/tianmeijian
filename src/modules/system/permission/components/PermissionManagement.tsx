/**
 * RBAC权限管理系统
 * 提供菜单权限、按钮权限、数据权限的统一管理
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tree,
  Switch,
  message,
  Tabs,
  Divider,
  Tag,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TreeNode } from 'antd/es/tree-select';
import { usePermissionStore } from '../store';
import {
  SystemPermission,
  Role,
  UserRole,
  PermissionType,
  PermissionStatus,
  CreatePermissionDTO,
  CreateRoleDTO,
  PermissionQuery,
  RoleQuery,
} from '../types';

const { TabPane } = Tabs;
const { TextArea } = Input;

/**
 * 权限管理界面
 */
const PermissionManagement: React.FC = () => {
  const {
    permissions,
    roles,
    userRoles,
    loading,
    error,
    // Permissions actions
    loadPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    // Roles actions
    loadRoles,
    createRole,
    updateRole,
    deleteRole,
    // User roles actions
    loadUserRoles,
    assignRole,
    revokeRole,
  } = usePermissionStore();

  // UI状态
  const [activeTab, setActiveTab] = useState('permissions');
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [userRoleModalVisible, setUserRoleModalVisible] = useState(false);
  const [editingPermission, setEditingPermission] = useState<SystemPermission | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // 表单引用
  const [permissionForm] = Form.useForm<any>();
  const [roleForm] = Form.useForm<CreateRoleDTO>();
  const [userRoleForm] = Form.useForm();

  // 初始加载
  useEffect(() => {
    loadPermissions();
    loadRoles();
    // loadUserRoles requires userId - skip initial load
  }, []);

  /**
   * 处理权限操作
   */
  const handleCreatePermission = () => {
    setEditingPermission(null);
    permissionForm.resetFields();
    setPermissionModalVisible(true);
  };

  const handleEditPermission = (permission: SystemPermission) => {
    setEditingPermission(permission);
    permissionForm.setFieldsValue({
      permissionKey: permission.permissionKey,
      permissionName: permission.permissionName,
      permissionType: permission.permissionType,
      module: permission.module,
      description: permission.description,
      status: permission.status,
    });
    setPermissionModalVisible(true);
  };

  const handleDeletePermission = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此权限吗？',
      onOk: async () => {
        try {
          await deletePermission(id);
          message.success('删除成功');
          loadPermissions();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handlePermissionSubmit = async () => {
    try {
      const values = await permissionForm.validateFields();

      if (editingPermission) {
        await updatePermission({ ...values, id: editingPermission.id } as any);
        message.success('更新成功');
      } else {
        await createPermission(values as any);
        message.success('创建成功');
      }

      setPermissionModalVisible(false);
      permissionForm.resetFields();
      loadPermissions();
    } catch (error) {
      message.error('操作失败');
    }
  };

  /**
   * 处理角色操作
   */
  const handleCreateRole = () => {
    setEditingRole(null);
    roleForm.resetFields();
    setRoleModalVisible(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    roleForm.setFieldsValue({
      roleCode: role.roleCode,
      roleName: role.roleName,
      permissions: role.permissions,
      status: role.status,
      description: role.description,
    });
    setRoleModalVisible(true);
  };

  const handleDeleteRole = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此角色吗？',
      onOk: async () => {
        try {
          await deleteRole(id);
          message.success('删除成功');
          loadRoles();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleRoleSubmit = async () => {
    try {
      const values = await roleForm.validateFields();

      if (editingRole) {
        await updateRole({ ...values, id: editingRole.id });
        message.success('更新成功');
      } else {
        await createRole(values);
        message.success('创建成功');
      }

      setRoleModalVisible(false);
      roleForm.resetFields();
      loadRoles();
    } catch (error) {
      message.error('操作失败');
    }
  };

  /**
   * 处理用户角色分配
   */
  const handleAssignUserRole = () => {
    userRoleForm.resetFields();
    setUserRoleModalVisible(true);
  };

  const handleUserRoleSubmit = async () => {
    try {
      const values = await userRoleForm.validateFields();
      await assignRole(values.userId, values.roleId);
      message.success('角色分配成功');
      setUserRoleModalVisible(false);
      userRoleForm.resetFields();
      loadUserRoles(values.userId);
    } catch (error) {
      message.error('分配失败');
    }
  };

  /**
   * 权限表格列配置
   */
  const permissionColumns: ColumnsType<SystemPermission> = [
    {
      title: '权限键',
      dataIndex: 'permissionKey',
      key: 'permissionKey',
      width: 200,
      render: (text) => <code>{text}</code>,
    },
    {
      title: '权限名称',
      dataIndex: 'permissionName',
      key: 'permissionName',
      width: 180,
    },
    {
      title: '类型',
      dataIndex: 'permissionType',
      key: 'permissionType',
      width: 100,
      render: (type: PermissionType) => (
        <Tag color={type === 'MENU' ? 'blue' : type === 'BUTTON' ? 'green' : 'orange'}>
          {type === 'MENU' ? '菜单' : type === 'BUTTON' ? '按钮' : '接口'}
        </Tag>
      ),
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PermissionStatus) => (
        <Tag color={status === 'ACTIVE' ? 'success' : 'default'}>
          {status === 'ACTIVE' ? '生效' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditPermission(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePermission(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  /**
   * 角色表格列配置
   */
  const roleColumns: ColumnsType<Role> = [
    {
      title: '角色编码',
      dataIndex: 'roleCode',
      key: 'roleCode',
      width: 150,
      render: (text) => <code>{text}</code>,
    },
    {
      title: '角色名称',
      dataIndex: 'roleName',
      key: 'roleName',
      width: 180,
    },
    {
      title: '权限数量',
      dataIndex: 'permissionCount',
      key: 'permissionCount',
      width: 120,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PermissionStatus) => (
        <Tag color={status === 'ACTIVE' ? 'success' : 'default'}>
          {status === 'ACTIVE' ? '生效' : '停用'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRole(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRole(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  /**
   * 用户角色表格列配置
   */
  const userRoleColumns: ColumnsType<UserRole> = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 150,
    },
    {
      title: '用户名',
      dataIndex: 'userName',
      key: 'userName',
      width: 180,
    },
    {
      title: '角色ID',
      dataIndex: 'roleId',
      key: 'roleId',
      width: 150,
    },
    {
      title: '角色名称',
      dataIndex: 'roleName',
      key: 'roleName',
      width: 180,
    },
    {
      title: '分配日期',
      dataIndex: 'assignDate',
      key: 'assignDate',
      width: 160,
    },
    {
      title: '过期日期',
      dataIndex: 'expireDate',
      key: 'expireDate',
      width: 160,
      render: (date) => date || '永久',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          danger
          onClick={() => revokeRole(record.userId)}
        >
          撤销
        </Button>
      ),
    },
  ];

  /**
   * 权限树数据
   */
  const permissionTreeData: any[] = useMemo(() => {
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, SystemPermission[]>);

    return Object.entries(grouped).map(([module, perms]) => ({
      title: module,
      key: module,
      children: perms.map(perm => ({
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{perm.permissionName}</span>
            <Tag
              color={perm.permissionType === 'MENU' ? 'blue' : perm.permissionType === 'BUTTON' ? 'green' : 'orange'}
            >
              {perm.permissionType}
            </Tag>
          </div>
        ),
        key: perm.id,
      })),
    }));
  }, [permissions]);

  return (
    <div className="permission-management">
      <Card title="RBAC权限管理系统" className="mb-4">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 权限管理 */}
          <TabPane
            tab={
              <span>
                <SecurityScanOutlined />
                权限管理
              </span>
            }
            key="permissions"
          >
            <div className="mb-4 flex justify-between items-center">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreatePermission}
              >
                新建权限
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setActiveTab('tree')}
              >
                权限树视图
              </Button>
            </div>
            <Table
              columns={permissionColumns}
              dataSource={permissions}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </TabPane>

          {/* 权限树视图 */}
          <TabPane
            tab={
              <span>
                <SecurityScanOutlined />
                权限树
              </span>
            }
            key="tree"
          >
            <Card title="权限结构树" className="mb-4">
              <Tree
                showIcon
                defaultExpandAll
                treeData={permissionTreeData}
              />
            </Card>
          </TabPane>

          {/* 角色管理 */}
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                角色管理
              </span>
            }
            key="roles"
          >
            <div className="mb-4 flex justify-between items-center">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateRole}
              >
                新建角色
              </Button>
            </div>
            <Table
              columns={roleColumns}
              dataSource={roles}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </TabPane>

          {/* 用户角色分配 */}
          <TabPane
            tab={
              <span>
                <DatabaseOutlined />
                用户角色分配
              </span>
            }
            key="userRoles"
          >
            <div className="mb-4 flex justify-between items-center">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAssignUserRole}
              >
                分配角色
              </Button>
            </div>
            <Table
              columns={userRoleColumns}
              dataSource={userRoles}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1000 }}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 权限编辑弹窗 */}
      <Modal
        title={editingPermission ? '编辑权限' : '新建权限'}
        open={permissionModalVisible}
        onOk={handlePermissionSubmit}
        onCancel={() => {
          setPermissionModalVisible(false);
          permissionForm.resetFields();
        }}
        width={600}
        destroyOnClose
      >
        <Form
          form={permissionForm}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="permissionKey"
            label="权限键"
            rules={[
              { required: true, message: '请输入权限键' },
              { pattern: /^[a-z:_]+$/, message: '权限键只能包含小写字母、冒号和下划线' },
            ]}
          >
            <Input placeholder="如: material:view" />
          </Form.Item>

          <Form.Item
            name="permissionName"
            label="权限名称"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input placeholder="如: 查看物料" />
          </Form.Item>

          <Form.Item
            name="permissionType"
            label="权限类型"
            rules={[{ required: true, message: '请选择权限类型' }]}
          >
            <Select>
              <Select.Option value="MENU">菜单</Select.Option>
              <Select.Option value="BUTTON">按钮</Select.Option>
              <Select.Option value="API">接口</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="module"
            label="所属模块"
            rules={[{ required: true, message: '请输入所属模块' }]}
          >
            <Input placeholder="如: BASIC_DATA" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="权限描述" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue="ACTIVE"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="ACTIVE">生效</Select.Option>
              <Select.Option value="INACTIVE">停用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 角色编辑弹窗 */}
      <Modal
        title={editingRole ? '编辑角色' : '新建角色'}
        open={roleModalVisible}
        onOk={handleRoleSubmit}
        onCancel={() => {
          setRoleModalVisible(false);
          roleForm.resetFields();
        }}
        width={800}
        destroyOnClose
      >
        <Form
          form={roleForm}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="roleCode"
            label="角色编码"
            rules={[
              { required: true, message: '请输入角色编码' },
              { pattern: /^[A-Z_]+$/, message: '角色编码只能包含大写字母和下划线' },
            ]}
          >
            <Input placeholder="如: ADMIN" />
          </Form.Item>

          <Form.Item
            name="roleName"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="如: 管理员" />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="权限"
            rules={[{ required: true, message: '请选择权限' }]}
            tooltip="选择该角色拥有的权限"
          >
            <Select
              mode="multiple"
              placeholder="选择权限"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={permissions.map(p => ({
                label: `${p.permissionKey} - ${p.permissionName}`,
                value: p.permissionKey,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue="ACTIVE"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="ACTIVE">生效</Select.Option>
              <Select.Option value="INACTIVE">停用</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="角色描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户角色分配弹窗 */}
      <Modal
        title="分配角色"
        open={userRoleModalVisible}
        onOk={handleUserRoleSubmit}
        onCancel={() => {
          setUserRoleModalVisible(false);
          userRoleForm.resetFields();
        }}
        destroyOnClose
      >
        <Form
          form={userRoleForm}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="userId"
            label="用户ID"
            rules={[{ required: true, message: '请输入用户ID' }]}
          >
            <Input placeholder="用户ID" />
          </Form.Item>

          <Form.Item
            name="roleId"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              placeholder="选择角色"
              options={roles.map(r => ({
                label: `${r.roleName} (${r.roleCode})`,
                value: r.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PermissionManagement;
