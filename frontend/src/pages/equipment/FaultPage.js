import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  message, Popconfirm, Row, Col, Typography, Alert
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  WarningOutlined, CheckOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { equipmentApi } from '../../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

const severityMap = {
  minor:    { color: 'default', text: '轻微' },
  moderate: { color: 'warning', text: '一般' },
  major:    { color: 'error',   text: '严重' },
  critical: { color: 'volcano', text: '危急' },
};

const statusMap = {
  open:       { color: 'error',      text: '未处理' },
  processing: { color: 'processing', text: '处理中' },
  resolved:   { color: 'success',    text: '已解决' },
  closed:     { color: 'default',    text: '已关闭' },
};

const FaultPage = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [resolveVisible, setResolveVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  const [form] = Form.useForm();
  const [resolveForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [openCount, setOpenCount] = useState(0);

  const fetchList = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await equipmentApi.getFaultRecords({ page: p, pageSize, ...s });
      if (res.data.code === 0) {
        const l = res.data.data.list || [];
        setList(l);
        setTotal(res.data.data.total || 0);
        setOpenCount(l.filter(r => r.status === 'open' || r.status === 'processing').length);
      }
    } catch { message.error('获取故障记录失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleSearch = (vals) => { setSearch(vals); setPage(1); fetchList(1, vals); };

  const openAdd = () => { setEditRecord(null); form.resetFields(); setModalVisible(true); };
  const openEdit = (r) => { setEditRecord(r); form.setFieldsValue({ ...r }); setModalVisible(true); };

  const handleSave = async (values) => {
    try {
      if (editRecord) {
        await equipmentApi.updateFaultRecord(editRecord.id, values);
        message.success('故障记录已更新');
      } else {
        await equipmentApi.createFaultRecord(values);
        message.success('故障记录已提交');
      }
      setModalVisible(false);
      fetchList();
    } catch { message.error('提交失败'); }
  };

  const handleResolve = async (values) => {
    try {
      await equipmentApi.resolveFaultRecord(currentId, values);
      message.success('故障已标记为解决');
      setResolveVisible(false);
      resolveForm.resetFields();
      fetchList();
    } catch { message.error('操作失败'); }
  };

  const handleDelete = async (id) => {
    try {
      await equipmentApi.deleteFaultRecord(id);
      message.success('删除成功');
      fetchList();
    } catch { message.error('删除失败'); }
  };

  const columns = [
    { title: '故障单号', dataIndex: 'fault_no', key: 'fault_no', width: 140,
      render: v => <Text code>{v}</Text> },
    { title: '设备名称', dataIndex: 'equipment_name', key: 'equipment_name', width: 140 },
    { title: '故障类型', dataIndex: 'fault_type', key: 'fault_type', width: 110 },
    { title: '故障描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 180 },
    { title: '严重程度', dataIndex: 'severity', key: 'severity', width: 90,
      render: v => <Tag color={severityMap[v]?.color}>{severityMap[v]?.text || v}</Tag> },
    { title: '发生时间', dataIndex: 'occurred_at', key: 'occurred_at', width: 160,
      render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '报告人', dataIndex: 'reporter', key: 'reporter', width: 90 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag> },
    { title: '解决时间', dataIndex: 'resolved_at', key: 'resolved_at', width: 160,
      render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '操作', key: 'action', fixed: 'right', width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          {(record.status === 'open' || record.status === 'processing') && (
            <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }}
              onClick={() => { setCurrentId(record.id); setResolveVisible(true); }}>
              解决
            </Button>
          )}
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" icon={<DeleteOutlined />} danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      {openCount > 0 && (
        <Alert
          message={`当前有 ${openCount} 条未处理故障记录，请及时处理！`}
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
          action={<Button size="small" type="link" onClick={() => {
            searchForm.setFieldsValue({ status: 'open' });
            handleSearch({ status: 'open' });
          }}>查看</Button>}
        />
      )}

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" form={searchForm} onFinish={handleSearch}>
          <Form.Item name="equipment_name" label="设备名称">
            <Input placeholder="设备名称" allowClear />
          </Form.Item>
          <Form.Item name="severity" label="严重程度">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              {Object.entries(severityMap).map(([k, v]) => <Option key={k} value={k}>{v.text}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              {Object.entries(statusMap).map(([k, v]) => <Option key={k} value={k}>{v.text}</Option>)}
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
        title={<><WarningOutlined style={{ color: '#ff4d4f' }} /> 设备故障记录</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd} danger>上报故障</Button>}
      >
        <Table
          columns={columns} dataSource={list} rowKey="id" loading={loading} scroll={{ x: 1300 }}
          rowClassName={record => (record.status === 'open' && record.severity === 'critical') ? 'ant-table-row-error' : ''}
          pagination={{
            current: page, pageSize, total,
            onChange: p => { setPage(p); fetchList(p); },
            showTotal: t => `共 ${t} 条`
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editRecord ? '编辑故障记录' : '上报设备故障'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="equipment_code" label="设备编码" rules={[{ required: true }]}>
                <Input placeholder="设备编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fault_type" label="故障类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="mechanical">机械故障</Option>
                  <Option value="electrical">电气故障</Option>
                  <Option value="software">软件故障</Option>
                  <Option value="hydraulic">液压故障</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="severity" label="严重程度" rules={[{ required: true }]} initialValue="moderate">
                <Select>
                  {Object.entries(severityMap).map(([k, v]) => <Option key={k} value={k}>{v.text}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reporter" label="报告人" rules={[{ required: true }]}>
                <Input placeholder="报告人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="occurred_at" label="发生时间" rules={[{ required: true }]}>
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="open">
                <Select>
                  {Object.entries(statusMap).map(([k, v]) => <Option key={k} value={k}>{v.text}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="故障描述" rules={[{ required: true }]}>
                <Input.TextArea rows={3} placeholder="详细描述故障现象" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Resolve Modal */}
      <Modal
        title="故障解决确认"
        open={resolveVisible}
        onCancel={() => { setResolveVisible(false); resolveForm.resetFields(); }}
        onOk={() => resolveForm.submit()}
        okText="确认解决"
        okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
      >
        <Form form={resolveForm} layout="vertical" onFinish={handleResolve}>
          <Form.Item name="solution" label="解决措施" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="描述如何解决了此故障" />
          </Form.Item>
          <Form.Item name="resolved_by" label="解决人" rules={[{ required: true }]}>
            <Input placeholder="维修人员姓名" />
          </Form.Item>
          <Form.Item name="downtime_hours" label="停机时长(h)">
            <Input type="number" min={0} step={0.5} placeholder="停机小时数" />
          </Form.Item>
          <Form.Item name="root_cause" label="根本原因">
            <Input.TextArea rows={2} placeholder="故障根本原因分析" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FaultPage;
