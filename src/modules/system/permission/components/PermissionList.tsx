/**
 * 系统权限列表组件
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Space,
  Table,
  Tag,
  Form,
  Input,
  Select,
  Modal,
  message,
  Tabs,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
  SettingOutlined,
  UserOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { usePermissionStore } from '../store';
import type {
  SystemPermission,
  Role,
  PermissionType,
  PermissionStatus,
} from '../types';
import {
  PERMISSION_TYPE_MAP,
  PERMISSION_STATUS_MAP,
} from '../types';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

/**
 * 系统权限列表组件
 */
export const PermissionList: React.FC = () => {
  const {
    permissions,
    roles,
    total,
    loading,
    query,
    selectedIds,
    activeTab,

    setQuery,
    setSelectedIds,
    setActiveTab,

    loadPermissions,
    loadRoles,
    createPermission,
    updatePermission,
    deletePermissions,
    updatePermissionStatus,
    createRole,
    updateRole,
    deleteRoles,
    updateRoleStatus,
  } = usePermissionStore();

  const [searchForm] = Form.useForm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SystemPermission | Role | null>(null);

  useEffect(() => {
    if (activeTab === 'permissions') {
      loadPermissions();
    } else {
      loadRoles();
    }
  }, [query, activeTab]);

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setQuery(values);
  };

  /**
   * 重置搜索
   */
  const handleReset = () => {
    searchForm.resetFields();
    setQuery({ current: 1 });
  };

  /**
   * 分页处理
   */
  const handlePageChange = (page: number, pageSize: number) => {
    setQuery({ current: page, pageSize });
  };

  /**
   * 行选择处理
   */
  const handleRowSelection = (selectedRowKeys: React.Key[]) => {
    setSelectedIds(selectedRowKeys as string[]);
  };

  /**
   * 新增处理
   */
  const handleAdd = () => {
    setCurrentRecord(null);
    setShowCreateModal(true);
  };

  /**
   * 编辑处理
   */
  const handleEdit = (record: SystemPermission | Role) => {
    setCurrentRecord(record);
    setShowEditModal(true);
  };

  /**
   * 删除处理
   */
  const handleDelete = (ids: string[] | string) => {
    const deleteIds = Array.isArray(ids) ? ids : [ids];
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${deleteIds.length} 条记录吗？`,
      onOk: async () => {
        if (activeTab === 'permissions') {
          await deletePermissions(deleteIds);
        } else {
          await deleteRoles(deleteIds);
        }
      },
    });
  };

  /**
   * 更新状态
   */
  const handleUpdateStatus = async (id: string, status: PermissionStatus) => {
    if (activeTab === 'permissions') {
      await updatePermissionStatus([id], status);
    } else {
      await updateRoleStatus([id], status);
    }
  };

  /**
   * 权限表格列定义
   */
  const permissionColumns = [
    {
      title: '权限键',
      dataIndex: 'permissionKey',
      key: 'permissionKey',
      width: 200,
    },
    {
      title: '权限名称',
      dataIndex: 'permissionName',
      key: 'permissionName',
      width: 150,
    },
    {
      title: '权限类型',
      dataIndex: 'permissionType',
      key: 'permissionType',
      width: 100,
      render: (type: PermissionType) => (
        <Tag color={PERMISSION_TYPE_MAP[type]?.color ?? 'default'}>
          {PERMISSION_TYPE_MAP[type]?.icon ?? ''} {PERMISSION_TYPE_MAP[type]?.label ?? String(type ?? '-')}
        </Tag>
      ),
    },
    {
      title: '所属模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PermissionStatus) => (
        <StatusBadge status={status} statusMap={PERMISSION_STATUS_MAP} />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
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
      fixed: 'right' as const,
      render: (_: any, record: SystemPermission) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<LockOutlined />}
              onClick={() => handleUpdateStatus(record.id, 'INACTIVE')}
            >
              禁用
            </Button>
          )}
          {record.status === 'INACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<UnlockOutlined />}
              onClick={() => handleUpdateStatus(record.id, 'ACTIVE')}
            >
              启用
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  /**
   * 角色表格列定义
   */
  const roleColumns = [
    {
      title: '角色编码',
      dataIndex: 'roleCode',
      key: 'roleCode',
      width: 150,
    },
    {
      title: '角色名称',
      dataIndex: 'roleName',
      key: 'roleName',
      width: 150,
    },
    {
      title: '权限数量',
      dataIndex: 'permissionCount',
      key: 'permissionCount',
      width: 100,
      render: (count: number) => (
        <Tag icon={<KeyOutlined />} color="blue">
          {count} 个权限
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PermissionStatus) => (
        <StatusBadge status={status} statusMap={PERMISSION_STATUS_MAP} />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
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
      fixed: 'right' as const,
      render: (_: any, record: Role) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<LockOutlined />}
              onClick={() => handleUpdateStatus(record.id, 'INACTIVE')}
            >
              禁用
            </Button>
          )}
          {record.status === 'INACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<UnlockOutlined />}
              onClick={() => handleUpdateStatus(record.id, 'ACTIVE')}
            >
              启用
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'permissions',
              label: (
                <Space>
                  <KeyOutlined />
                  系统权限
                </Space>
              ),
              children: (
                <>
                  {/* 搜索表单 */}
                  <Form
                    form={searchForm}
                    layout="inline"
                    onFinish={handleSearch}
                    style={{ marginBottom: 16 }}
                  >
                    <Form.Item name="permissionKey">
                      <Search placeholder="权限键" allowClear style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item name="permissionName">
                      <Search placeholder="权限名称" allowClear style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item name="permissionType">
                      <Select placeholder="权限类型" allowClear style={{ width: 120 }}>
                        <Option value="MENU">菜单</Option>
                        <Option value="BUTTON">按钮</Option>
                        <Option value="API">接口</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="module">
                      <Input placeholder="所属模块" allowClear style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                          搜索
                        </Button>
                        <Button onClick={handleReset}>重置</Button>
                        <Button icon={<ReloadOutlined />} onClick={() => loadPermissions()}>
                          刷新
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>

                  {/* 操作栏 */}
                  <div style={{ marginBottom: 16 }}>
                    <Space>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        新增权限
                      </Button>
                      {selectedIds.length > 0 && (
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(selectedIds)}
                        >
                          批量删除 ({selectedIds.length})
                        </Button>
                      )}
                    </Space>
                  </div>

                  {/* 数据表格 */}
                  <Table
                    columns={permissionColumns}
                    dataSource={permissions}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                      current: query.current,
                      pageSize: query.pageSize,
                      total,
                      onChange: handlePageChange,
                    }}
                    rowSelection={{
                      selectedRowKeys: selectedIds,
                      onChange: handleRowSelection,
                    }}
                    scroll={{ x: 1200 }}
                  />
                </>
              ),
            },
            {
              key: 'roles',
              label: (
                <Space>
                  <UserOutlined />
                  角色管理
                </Space>
              ),
              children: (
                <>
                  {/* 搜索表单 */}
                  <Form
                    form={searchForm}
                    layout="inline"
                    onFinish={handleSearch}
                    style={{ marginBottom: 16 }}
                  >
                    <Form.Item name="roleCode">
                      <Search placeholder="角色编码" allowClear style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item name="roleName">
                      <Search placeholder="角色名称" allowClear style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                          搜索
                        </Button>
                        <Button onClick={handleReset}>重置</Button>
                        <Button icon={<ReloadOutlined />} onClick={() => loadRoles()}>
                          刷新
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>

                  {/* 操作栏 */}
                  <div style={{ marginBottom: 16 }}>
                    <Space>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        新增角色
                      </Button>
                      {selectedIds.length > 0 && (
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(selectedIds)}
                        >
                          批量删除 ({selectedIds.length})
                        </Button>
                      )}
                    </Space>
                  </div>

                  {/* 数据表格 */}
                  <Table
                    columns={roleColumns}
                    dataSource={roles}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                      current: query.current,
                      pageSize: query.pageSize,
                      total,
                      onChange: handlePageChange,
                    }}
                    rowSelection={{
                      selectedRowKeys: selectedIds,
                      onChange: handleRowSelection,
                    }}
                    scroll={{ x: 1200 }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      {/* TODO: 实现表单组件 */}
      <Modal
        title={currentRecord ? '编辑' : '新增'}
        open={showCreateModal || showEditModal}
        onOk={() => {
          // TODO: 实现表单提交
          setShowCreateModal(false);
          setShowEditModal(false);
        }}
        onCancel={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
        }}
      >
        <p>表单组件开发中...</p>
      </Modal>
    </div>
  );
};

export default PermissionList;
