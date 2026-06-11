import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  message, Popconfirm, Row, Col, Typography, Statistic
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, HomeOutlined, ShopOutlined } from '@ant-design/icons';
import { baseApi } from '../../api';

const { Text } = Typography;
const { Option } = Select;

const WorkshopPage = () => {
  const [workshops, setWorkshops] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loadingW, setLoadingW] = useState(false);
  const [loadingT, setLoadingT] = useState(false);
  const [wModal, setWModal] = useState(false);
  const [tModal, setTModal] = useState(false);
  const [editW, setEditW] = useState(null);
  const [editT, setEditT] = useState(null);
  const [wForm] = Form.useForm();
  const [tForm] = Form.useForm();
  const [searchW] = Form.useForm();
  const [searchT] = Form.useForm();
  const [wPage, setWPage] = useState(1);
  const [tPage, setTPage] = useState(1);
  const [wTotal, setWTotal] = useState(0);
  const [tTotal, setTTotal] = useState(0);

  const fetchWorkshops = async (p = 1, s = {}) => {
    setLoadingW(true);
    try {
      const res = await baseApi.getWorkshops({ page: p, pageSize: 10, ...s });
      if (res.data.code === 0) {
        setWorkshops(res.data.data.list || []);
        setWTotal(res.data.data.total || 0);
      }
    } catch { message.error('获取车间列表失败'); }
    finally { setLoadingW(false); }
  };

  const fetchTeams = async (p = 1, s = {}) => {
    setLoadingT(true);
    try {
      const res = await baseApi.getTeams({ page: p, pageSize: 10, ...s });
      if (res.data.code === 0) {
        setTeams(res.data.data.list || []);
        setTTotal(res.data.data.total || 0);
      }
    } catch { message.error('获取班组列表失败'); }
    finally { setLoadingT(false); }
  };

  useEffect(() => { fetchWorkshops(); fetchTeams(); }, []);

  // Workshop handlers
  const openAddW = () => { setEditW(null); wForm.resetFields(); setWModal(true); };
  const openEditW = (r) => { setEditW(r); wForm.setFieldsValue({ ...r }); setWModal(true); };
  const saveW = async (values) => {
    try {
      if (editW) {
        await baseApi.updateWorkshop(editW.id, values);
      } else {
        await baseApi.createWorkshop(values);
      }
      message.success('保存成功');
      setWModal(false);
      fetchWorkshops();
    } catch { message.error('保存失败'); }
  };
  const deleteW = async (id) => {
    try { await baseApi.deleteWorkshop(id); message.success('删除成功'); fetchWorkshops(); }
    catch { message.error('删除失败'); }
  };

  // Team handlers
  const openAddT = () => { setEditT(null); tForm.resetFields(); setTModal(true); };
  const openEditT = (r) => { setEditT(r); tForm.setFieldsValue({ ...r }); setTModal(true); };
  const saveT = async (values) => {
    try {
      if (editT) {
        await baseApi.updateTeam(editT.id, values);
      } else {
        await baseApi.createTeam(values);
      }
      message.success('保存成功');
      setTModal(false);
      fetchTeams();
    } catch { message.error('保存失败'); }
  };
  const deleteT = async (id) => {
    try { await baseApi.deleteTeam(id); message.success('删除成功'); fetchTeams(); }
    catch { message.error('删除失败'); }
  };

  const workshopColumns = [
    { title: '车间编码', dataIndex: 'workshop_code', width: 120, render: v => <Text code>{v}</Text> },
    { title: '车间名称', dataIndex: 'workshop_name', width: 150 },
    { title: '所属工厂', dataIndex: 'factory_code', width: 100 },
    { title: '负责人', dataIndex: 'manager_name', width: 100 },
    { title: '状态', dataIndex: 'is_active', width: 80,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? '启用' : '停用'}</Tag> },
    {
      title: '操作', key: 'action', width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditW(record)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => deleteW(record.id)}>
            <Button type="link" size="small" icon={<DeleteOutlined />} danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const teamColumns = [
    { title: '班组编码', dataIndex: 'team_code', width: 110, render: v => <Text code>{v}</Text> },
    { title: '班组名称', dataIndex: 'team_name', width: 150 },
    { title: '所属车间', dataIndex: 'workshop_name', width: 120 },
    { title: '班次', dataIndex: 'shift', width: 90,
      render: v => ({ morning: '白班', evening: '中班', night: '夜班' }[v] || v) },
    { title: '状态', dataIndex: 'is_active', width: 80,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? '启用' : '停用'}</Tag> },
    {
      title: '操作', key: 'action', width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditT(record)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => deleteT(record.id)}>
            <Button type="link" size="small" icon={<DeleteOutlined />} danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card
            title={<><HomeOutlined /> 车间管理</>}
            extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={openAddW}>新增车间</Button>}
          >
            <Form layout="inline" form={searchW} onFinish={v => fetchWorkshops(1, v)} style={{ marginBottom: 12 }}>
              <Form.Item name="workshop_name"><Input placeholder="车间名称" allowClear size="small" /></Form.Item>
              <Form.Item><Button type="primary" size="small" icon={<SearchOutlined />} htmlType="submit">查询</Button></Form.Item>
            </Form>
            <Table columns={workshopColumns} dataSource={workshops} rowKey="id" size="small"
              loading={loadingW}
              pagination={{ current: wPage, pageSize: 10, total: wTotal, size: 'small',
                onChange: p => { setWPage(p); fetchWorkshops(p); } }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={<><ShopOutlined /> 班组管理</>}
            extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={openAddT}>新增班组</Button>}
          >
            <Form layout="inline" form={searchT} onFinish={v => fetchTeams(1, v)} style={{ marginBottom: 12 }}>
              <Form.Item name="team_name"><Input placeholder="班组名称" allowClear size="small" /></Form.Item>
              <Form.Item><Button type="primary" size="small" icon={<SearchOutlined />} htmlType="submit">查询</Button></Form.Item>
            </Form>
            <Table columns={teamColumns} dataSource={teams} rowKey="id" size="small"
              loading={loadingT}
              pagination={{ current: tPage, pageSize: 10, total: tTotal, size: 'small',
                onChange: p => { setTPage(p); fetchTeams(p); } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Workshop Modal */}
      <Modal title={editW ? '编辑车间' : '新增车间'} open={wModal}
        onCancel={() => setWModal(false)} onOk={() => wForm.submit()}>
        <Form form={wForm} layout="vertical" onFinish={saveW}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="workshop_code" label="车间编码" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="workshop_name" label="车间名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="factory_code" label="工厂编码"><Input placeholder="NJ/LS" /></Form.Item></Col>
            <Col span={12}><Form.Item name="manager_name" label="负责人"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="is_active" label="状态" initialValue={1}>
              <Select><Option value={1}>启用</Option><Option value={0}>停用</Option></Select>
            </Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Team Modal */}
      <Modal title={editT ? '编辑班组' : '新增班组'} open={tModal}
        onCancel={() => setTModal(false)} onOk={() => tForm.submit()}>
        <Form form={tForm} layout="vertical" onFinish={saveT}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="team_code" label="班组编码" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="team_name" label="班组名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="workshop_id" label="所属车间"><Input placeholder="车间ID" /></Form.Item></Col>
            <Col span={12}><Form.Item name="shift" label="班次">
              <Select><Option value="morning">白班</Option><Option value="evening">中班</Option><Option value="night">夜班</Option></Select>
            </Form.Item></Col>
            <Col span={12}><Form.Item name="is_active" label="状态" initialValue={1}>
              <Select><Option value={1}>启用</Option><Option value={0}>停用</Option></Select>
            </Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkshopPage;
