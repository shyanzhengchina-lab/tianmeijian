import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input,
  message, Popconfirm, Descriptions, Typography, Row, Col, Steps
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, DeploymentUnitOutlined } from '@ant-design/icons';
import { baseApi } from '../../api';

const { Text } = Typography;

const RoutingPage = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [routingSteps, setRoutingSteps] = useState([]);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchList = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await baseApi.getRoutings({ page: p, pageSize, ...s });
      if (res.data.code === 0) {
        setList(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch { message.error('获取工艺路线失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleSearch = (vals) => { setSearch(vals); setPage(1); fetchList(1, vals); };

  const openAdd = () => { setEditRecord(null); form.resetFields(); setModalVisible(true); };
  const openEdit = (r) => { setEditRecord(r); form.setFieldsValue({ ...r }); setModalVisible(true); };

  const openDetail = async (record) => {
    setDetailRecord(record);
    setDetailVisible(true);
    try {
      const res = await baseApi.getRoutingSteps(record.id);
      if (res.data.code === 0) setRoutingSteps(res.data.data || []);
    } catch { setRoutingSteps([]); }
  };

  const handleSave = async (values) => {
    try {
      if (editRecord) {
        await baseApi.updateRouting(editRecord.id, values);
        message.success('工艺路线已更新');
      } else {
        await baseApi.createRouting(values);
        message.success('工艺路线已创建');
      }
      setModalVisible(false);
      fetchList();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id) => {
    try {
      await baseApi.deleteRouting(id);
      message.success('删除成功');
      fetchList();
    } catch { message.error('删除失败'); }
  };

  const columns = [
    { title: '路线编码', dataIndex: 'routing_code', key: 'routing_code', width: 130, render: v => <Text code>{v}</Text> },
    { title: '路线名称', dataIndex: 'routing_name', key: 'routing_name', width: 160 },
    { title: '关联产品', dataIndex: 'product_name', key: 'product_name', width: 150 },
    { title: '工序数', dataIndex: 'step_count', key: 'step_count', width: 80,
      render: v => <Tag color="blue">{v || 0} 道</Tag> },
    { title: '标准工时(h)', dataIndex: 'standard_hours', key: 'standard_hours', width: 110 },
    { title: '版本', dataIndex: 'version', key: 'version', width: 80, render: v => <Tag>{v || 'V1.0'}</Tag> },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? '启用' : '停用'}</Tag> },
    {
      title: '操作', key: 'action', width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>工序</Button>
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
          <Form.Item name="routing_code" label="路线编码"><Input placeholder="路线编码" allowClear /></Form.Item>
          <Form.Item name="routing_name" label="路线名称"><Input placeholder="名称" allowClear /></Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
              <Button onClick={() => { searchForm.resetFields(); handleSearch({}); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={<><DeploymentUnitOutlined /> 工艺路线管理</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新建工艺路线</Button>}
      >
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading}
          pagination={{ current: page, pageSize, total, onChange: p => { setPage(p); fetchList(p); }, showTotal: t => `共 ${t} 条` }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editRecord ? '编辑工艺路线' : '新建工艺路线'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="routing_code" label="路线编码" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="routing_name" label="路线名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="product_code" label="产品编码"><Input placeholder="关联产品编码" /></Form.Item></Col>
            <Col span={12}><Form.Item name="standard_hours" label="标准工时(h)"><Input type="number" min={0} step={0.5} /></Form.Item></Col>
            <Col span={12}><Form.Item name="version" label="版本号" initialValue="V1.0"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="is_active" label="状态" initialValue={1}>
              <select style={{ width: '100%', height: 32, border: '1px solid #d9d9d9', borderRadius: 6, padding: '0 8px' }}>
                <option value={1}>启用</option>
                <option value={0}>停用</option>
              </select>
            </Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Detail Modal - routing steps */}
      <Modal
        title={`工序步骤 — ${detailRecord?.routing_name}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        width={720}
      >
        {routingSteps.length > 0 ? (
          <Steps direction="vertical" size="small" current={routingSteps.length}>
            {routingSteps.sort((a, b) => a.step_no - b.step_no).map(step => (
              <Steps.Step
                key={step.id}
                title={`步骤 ${step.step_no}：${step.operation_name}`}
                description={
                  <Descriptions size="small" column={3}>
                    {step.work_center_name && <Descriptions.Item label="工作中心">{step.work_center_name}</Descriptions.Item>}
                    {step.std_time && <Descriptions.Item label="标准工时">{step.std_time}h</Descriptions.Item>}
                    {step.description && <Descriptions.Item label="说明">{step.description}</Descriptions.Item>}
                  </Descriptions>
                }
              />
            ))}
          </Steps>
        ) : (
          <Text type="secondary">暂无工序步骤，请在路线中配置工序</Text>
        )}
      </Modal>
    </div>
  );
};

export default RoutingPage;
