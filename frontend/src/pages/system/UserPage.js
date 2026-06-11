import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  message, Popconfirm, Row, Col, Tabs, Typography, Avatar, Divider
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  UserOutlined, LockOutlined, SafetyOutlined, KeyOutlined
} from '@ant-design/icons';
import { systemApi } from '../../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;
const { TabPane } = Tabs;

const UserPage = () => {
  // ── Users state ──
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState({});
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [pwTargetId, setPwTargetId] = useState(null);
  const [userForm] = Form.useForm();
  const [pwForm] = Form.useForm();
  const [userSearchForm] = Form.useForm();

  // ── Roles state ──
  const [roles, setRoles] = useState([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [roleForm] = Form.useForm();

  const fetchUsers = async (p = userPage, s = userSearch) => {
    setUserLoading(true);
    try {
      const res = await systemApi.getUsers({ page: p, pageSize: 10, ...s });
      if (res.data.code === 0) {
        setUsers(res.data.data.list || []);
        setUserTotal(res.data.data.total || 0);
      }
    } catch { message.error('获取用户列表失败'); }
    finally { setUserLoading(false); }
  };

  const fetchRoles = async () => {
    setRoleLoading(true);
    try {
      const res = await systemApi.getRoles({ page: 1, pageSize: 50 });
      if (res.data.code === 0) setRoles(res.data.data.list || []);
    } catch {}
    finally { setRoleLoading(false); }
  };

  useEffect(() => { fetchUsers(); fetchRoles(); }, []);

  const handleUserSearch = (vals) => { setUserSearch(vals); setUserPage(1); fetchUsers(1, vals); };

  const openAddUser = () => { setEditUser(null); userForm.resetFields(); setUserModalVisible(true); };
  const openEditUser = (r) => {
    setEditUser(r);
    userForm.setFieldsValue({ ...r, password: '' });
    setUserModalVisible(true);
  };

  const handleSaveUser = async (values) => {
    try {
      if (editUser) {
        await systemApi.updateUser(editUser.id, values);
        message.success('用户信息已更新');
      } else {
        await systemApi.createUser(values);
        message.success('用户已创建');
      }
      setUserModalVisible(false);
      fetchUsers();
    } catch { message.error('保存失败'); }
  };

  const handleDeleteUser = async (id) => {
    try {
      await systemApi.deleteUser(id);
      message.success('用户已删除');
      fetchUsers();
    } catch { message.error('删除失败'); }
  };

  const handleResetPassword = async (values) => {
    try {
      await systemApi.resetPassword(pwTargetId, values.new_password);
      message.success('密码已重置');
      setPwModalVisible(false);
      pwForm.resetFields();
    } catch { message.error('密码重置失败'); }
  };

  // Role CRUD
  const openAddRole = () => { setEditRole(null); roleForm.resetFields(); setRoleModalVisible(true); };
  const openEditRole = (r) => { setEditRole(r); roleForm.setFieldsValue({ ...r }); setRoleModalVisible(true); };
  const handleSaveRole = async (values) => {
    try {
      if (editRole) {
        await systemApi.updateRole(editRole.id, values);
      } else {
        await systemApi.createRole(values);
      }
      message.success('保存成功');
      setRoleModalVisible(false);
      fetchRoles();
    } catch { message.error('保存失败'); }
  };
  const handleDeleteRole = async (id) => {
    try { await systemApi.deleteRole(id); message.success('角色已删除'); fetchRoles(); }
    catch { message.error('删除失败'); }
  };

  const userColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120,
      render: (v, r) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ background: r.is_active ? '#1677ff' : '#d9d9d9' }} />
          <Text strong>{v}</Text>
        </Space>
      )},
    { title: '姓名', dataIndex: 'real_name', key: 'real_name', width: 100 },
    { title: '角色', dataIndex: 'role_name', key: 'role_name', width: 120,
      render: v => <Tag color="blue" icon={<SafetyOutlined />}>{v}</Tag> },
    { title: '所属工厂', dataIndex: 'factory_code', key: 'factory_code', width: 100 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 180 },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? '启用' : '停用'}</Tag> },
    { title: '最后登录', dataIndex: 'last_login_at', key: 'last_login_at', width: 160,
      render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '从未登录' },
    {
      title: '操作', key: 'action', fixed: 'right', width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditUser(record)}>编辑</Button>
          <Button type="link" size="small" icon={<LockOutlined />}
            onClick={() => { setPwTargetId(record.id); setPwModalVisible(true); }}>
            重置密码
          </Button>
          <Popconfirm title="确认删除此用户?" onConfirm={() => handleDeleteUser(record.id)}>
            <Button type="link" size="small" icon={<DeleteOutlined />} danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const roleColumns = [
    { title: '角色编码', dataIndex: 'role_code', width: 120, render: v => <Text code>{v}</Text> },
    { title: '角色名称', dataIndex: 'role_name', width: 150 },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'is_active', width: 80,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? '启用' : '停用'}</Tag> },
    {
      title: '操作', key: 'action', width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditRole(record)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => handleDeleteRole(record.id)}>
            <Button type="link" size="small" icon={<DeleteOutlined />} danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Tabs defaultActiveKey="users" type="card">
        {/* Users Tab */}
        <TabPane tab={<Space><UserOutlined />用户管理</Space>} key="users">
          <Card style={{ marginBottom: 16 }}>
            <Form layout="inline" form={userSearchForm} onFinish={handleUserSearch}>
              <Form.Item name="username" label="用户名"><Input placeholder="用户名" allowClear /></Form.Item>
              <Form.Item name="real_name" label="姓名"><Input placeholder="姓名" allowClear /></Form.Item>
              <Form.Item name="is_active" label="状态">
                <Select placeholder="全部" allowClear style={{ width: 90 }}>
                  <Option value={1}>启用</Option>
                  <Option value={0}>停用</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
                  <Button onClick={() => { userSearchForm.resetFields(); handleUserSearch({}); }}>重置</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          <Card
            title={<><UserOutlined /> 系统用户</>}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAddUser}>新增用户</Button>}
          >
            <Table
              columns={userColumns} dataSource={users} rowKey="id" loading={userLoading} scroll={{ x: 1100 }}
              pagination={{
                current: userPage, pageSize: 10, total: userTotal,
                onChange: p => { setUserPage(p); fetchUsers(p); },
                showTotal: t => `共 ${t} 条`
              }}
            />
          </Card>
        </TabPane>

        {/* Roles Tab */}
        <TabPane tab={<Space><KeyOutlined />角色管理</Space>} key="roles">
          <Card
            title={<><SafetyOutlined /> 角色权限管理</>}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAddRole}>新增角色</Button>}
          >
            <Table
              columns={roleColumns} dataSource={roles} rowKey="id" loading={roleLoading}
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* User Add/Edit Modal */}
      <Modal
        title={editUser ? '编辑用户' : '新增用户'}
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        onOk={() => userForm.submit()}
        width={560}
      >
        <Form form={userForm} layout="vertical" onFinish={handleSaveUser}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input prefix={<UserOutlined />} /></Form.Item></Col>
            <Col span={12}><Form.Item name="real_name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item></Col>
            {!editUser && (
              <Col span={12}><Form.Item name="password" label="初始密码" rules={[{ required: true }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="至少8位" />
              </Form.Item></Col>
            )}
            <Col span={12}><Form.Item name="role_id" label="角色" rules={[{ required: true }]}>
              <Select placeholder="选择角色">
                {roles.map(r => <Option key={r.id} value={r.id}>{r.role_name}</Option>)}
              </Select>
            </Form.Item></Col>
            <Col span={12}><Form.Item name="factory_code" label="所属工厂">
              <Select placeholder="选择工厂" allowClear>
                <Option value="NJ">南京工厂</Option>
                <Option value="LS">溧水工厂</Option>
              </Select>
            </Form.Item></Col>
            <Col span={12}><Form.Item name="email" label="邮箱"><Input placeholder="邮箱地址" /></Form.Item></Col>
            <Col span={12}><Form.Item name="is_active" label="状态" initialValue={1}>
              <Select><Option value={1}>启用</Option><Option value={0}>停用</Option></Select>
            </Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        title={<><LockOutlined /> 重置用户密码</>}
        open={pwModalVisible}
        onCancel={() => { setPwModalVisible(false); pwForm.resetFields(); }}
        onOk={() => pwForm.submit()}
        okText="确认重置"
      >
        <Form form={pwForm} layout="vertical" onFinish={handleResetPassword}>
          <Form.Item name="new_password" label="新密码"
            rules={[{ required: true }, { min: 8, message: '密码至少8位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码（至少8位）" />
          </Form.Item>
          <Form.Item name="confirm_password" label="确认密码"
            dependencies={['new_password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次密码输入不一致'));
                }
              })
            ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Role Add/Edit Modal */}
      <Modal
        title={editRole ? '编辑角色' : '新增角色'}
        open={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        onOk={() => roleForm.submit()}
      >
        <Form form={roleForm} layout="vertical" onFinish={handleSaveRole}>
          <Form.Item name="role_code" label="角色编码" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="role_name" label="角色名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="is_active" label="状态" initialValue={1}>
            <Select><Option value={1}>启用</Option><Option value={0}>停用</Option></Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserPage;
