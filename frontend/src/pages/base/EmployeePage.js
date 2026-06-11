import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  message, Popconfirm, Row, Col, Typography, Avatar
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { baseApi } from '../../api';

const { Text } = Typography;
const { Option } = Select;

const positionMap = {
  operator: '操作员', team_leader: '班组长', supervisor: '车间主任',
  quality_inspector: '质检员', maintenance: '维修工', other: '其他'
};

const EmployeePage = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [search, setSearch] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchList = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await baseApi.getEmployees({ page: p, pageSize, ...s });
      if (res.data.code === 0) {
        setList(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch { message.error('获取员工列表失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleSearch = (vals) => { setSearch(vals); setPage(1); fetchList(1, vals); };

  const openAdd = () => { setEditRecord(null); form.resetFields(); setModalVisible(true); };
  const openEdit = (r) => { setEditRecord(r); form.setFieldsValue({ ...r }); setModalVisible(true); };

  const handleSave = async (values) => {
    try {
      if (editRecord) {
        await baseApi.updateEmployee(editRecord.id, values);
        message.success('员工信息已更新');
      } else {
        await baseApi.createEmployee(values);
        message.success('员工已添加');
      }
      setModalVisible(false);
      fetchList();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id) => {
    try {
      await baseApi.deleteEmployee(id);
      message.success('删除成功');
      fetchList();
    } catch { message.error('删除失败'); }
  };

  const columns = [
    { title: '工号', dataIndex: 'employee_code', key: 'employee_code', width: 100, render: v => <Text code>{v}</Text> },
    { title: '姓名', dataIndex: 'employee_name', key: 'employee_name', width: 100,
      render: (v) => (
        <Space><Avatar size="small" icon={<UserOutlined />} style={{ background: '#1677ff' }} />{v}</Space>
      )},
    { title: '所属班组', dataIndex: 'team_name', key: 'team_name', width: 110 },
    { title: '所属车间', dataIndex: 'workshop_name', key: 'workshop_name', width: 110 },
    { title: '岗位', dataIndex: 'position', key: 'position', width: 100,
      render: v => <Tag color="blue">{positionMap[v] || v}</Tag> },
    { title: '联系方式', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? '在职' : '离职'}</Tag> },
    {
      title: '操作', key: 'action', width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" icon={<DeleteOutlined />} danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" form={searchForm} onFinish={handleSearch}>
          <Form.Item name="employee_code" label="工号"><Input placeholder="工号" allowClear /></Form.Item>
          <Form.Item name="employee_name" label="姓名"><Input placeholder="姓名" allowClear /></Form.Item>
          <Form.Item name="position" label="岗位">
            <Select placeholder="全部" allowClear style={{ width: 110 }}>
              {Object.entries(positionMap).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
              <Button onClick={() => { searchForm.resetFields(); handleSearch({}); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={<><TeamOutlined /> 员工档案</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增员工</Button>}
      >
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading}
          pagination={{ current: page, pageSize, total, onChange: p => { setPage(p); fetchList(p); }, showTotal: t => `共 ${t} 条` }}
        />
      </Card>

      <Modal
        title={editRecord ? '编辑员工' : '新增员工'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="employee_code" label="工号" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="employee_name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="position" label="岗位" rules={[{ required: true }]} initialValue="operator">
                <Select>
                  {Object.entries(positionMap).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="phone" label="联系方式"><Input placeholder="手机号" /></Form.Item></Col>
            <Col span={12}><Form.Item name="workshop_id" label="所属车间"><Input placeholder="车间ID" /></Form.Item></Col>
            <Col span={12}><Form.Item name="team_id" label="所属班组"><Input placeholder="班组ID" /></Form.Item></Col>
            <Col span={12}><Form.Item name="hire_date" label="入职日期"><Input type="date" /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="is_active" label="状态" initialValue={1}>
                <Select><Option value={1}>在职</Option><Option value={0}>离职</Option></Select>
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="remarks" label="备注"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeePage;
