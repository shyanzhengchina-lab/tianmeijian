import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Tag, Modal, Form, Input, Select, DatePicker, InputNumber,
  Typography, Tooltip, Badge, message, Popconfirm, Row, Col, Card
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, CheckOutlined, PauseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { planApi, baseApi } from '../../api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const WO_STATUS = { 1: ['待执行', 'default'], 2: ['执行中', 'processing'], 3: ['待检验', 'warning'], 4: ['检验中', 'orange'], 5: ['已完成', 'success'], 6: ['已关闭', 'default'], 7: ['已暂停', 'error'] };
const ORDER_TYPE = { NORMAL: '正常', URGENT: '紧急', RD: '研发' };
const CHANNEL = { EC: '电商', OFFLINE: '线下', OEM: 'OEM', CLINIC: '诊所', RD: '研发' };
const PRIORITY_OPTIONS = [0, 1, 2, 3, 4, 5].map(p => ({ value: p, label: `P${p}-${['紧急电商', '普通电商', '线下', '诊所', 'OEM', '研发'][p]}` }));

export default function WorkOrderPage() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form] = Form.useForm();
  const [filter, setFilter] = useState({ pageNum: 1, pageSize: 20 });
  const [searchForm] = Form.useForm();

  const loadData = useCallback(async (params = filter) => {
    setLoading(true);
    try {
      const res = await planApi.getWorkOrders(params);
      if (res.code === 200) {
        setList(res.data.list);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadData(); }, [filter]);

  const handleSearch = () => {
    const vals = searchForm.getFieldsValue();
    const newFilter = { ...filter, pageNum: 1, ...vals };
    if (vals.dateRange) {
      newFilter.startDate = vals.dateRange[0]?.format('YYYY-MM-DD');
      newFilter.endDate = vals.dateRange[1]?.format('YYYY-MM-DD');
      delete newFilter.dateRange;
    }
    setFilter(newFilter);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setFilter({ pageNum: 1, pageSize: 20 });
  };

  const handleSubmit = async () => {
    const vals = await form.validateFields();
    if (vals.planDateRange) {
      vals.planStart = vals.planDateRange[0]?.format('YYYY-MM-DD HH:mm:ss');
      vals.planEnd = vals.planDateRange[1]?.format('YYYY-MM-DD HH:mm:ss');
      delete vals.planDateRange;
    }
    try {
      if (editRecord) {
        await planApi.updateWorkOrder(editRecord.id, vals);
        message.success('更新成功');
      } else {
        const res = await planApi.createWorkOrder(vals);
        if (res.code === 200) message.success(`工单创建成功：${res.data.woCode}`);
        else message.error(res.msg);
      }
      setModalOpen(false);
      form.resetFields();
      loadData();
    } catch (e) { message.error(e.message); }
  };

  const handleStatusChange = async (id, status) => {
    await planApi.updateWorkOrderStatus(id, status);
    message.success('状态更新成功');
    loadData();
  };

  const handleDelete = async (id) => {
    await planApi.deleteWorkOrder(id);
    message.success('删除成功');
    loadData();
  };

  const openCreate = () => { setEditRecord(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (r) => {
    setEditRecord(r);
    form.setFieldsValue({
      ...r,
      planDateRange: r.plan_start ? [dayjs(r.plan_start), dayjs(r.plan_end)] : undefined
    });
    setModalOpen(true);
  };

  const columns = [
    { title: '工单号', dataIndex: 'wo_code', width: 145, fixed: 'left', render: v => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: '产品名称', dataIndex: 'product_name', ellipsis: true, width: 160 },
    { title: '生产批号', dataIndex: 'batch_no', width: 120 },
    { title: '工厂', dataIndex: 'factory_code', width: 70, render: v => <Tag>{v === 'NJ' ? '南京' : '溧水'}</Tag> },
    {
      title: '优先级', dataIndex: 'priority', width: 80, align: 'center',
      render: v => <Tag color={v <= 1 ? 'red' : v <= 2 ? 'orange' : 'blue'}>P{v}</Tag>
    },
    { title: '计划数量', dataIndex: 'plan_qty', width: 90, align: 'right', render: (v, r) => `${v} ${r.unit_name || ''}` },
    { title: '实际数量', dataIndex: 'actual_qty', width: 90, align: 'right', render: (v, r) => v > 0 ? `${v} ${r.unit_name || ''}` : '-' },
    {
      title: '进度', width: 100,
      render: (_, r) => {
        const pct = r.plan_qty > 0 ? Math.min(100, ((r.actual_qty || 0) / r.plan_qty * 100).toFixed(0)) : 0;
        return <Text style={{ color: pct >= 100 ? '#52c41a' : '#1677ff' }}>{pct}%</Text>;
      }
    },
    {
      title: '状态', dataIndex: 'wo_status', width: 90,
      render: v => { const [label, color] = WO_STATUS[v] || ['未知', 'default']; return <Badge status={color} text={label} />; }
    },
    {
      title: '计划日期', width: 200,
      render: (_, r) => (
        <Text style={{ fontSize: 12 }}>
          {r.plan_start?.slice(0, 10) || '-'} → {r.plan_end?.slice(0, 10) || '-'}
        </Text>
      )
    },
    {
      title: '操作', fixed: 'right', width: 200,
      render: (_, r) => (
        <Space size={4}>
          {r.wo_status === 1 && <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStatusChange(r.id, 2)}>开始</Button>}
          {r.wo_status === 2 && <Button size="small" icon={<PauseOutlined />} onClick={() => handleStatusChange(r.id, 7)}>暂停</Button>}
          {r.wo_status === 7 && <Button size="small" type="primary" onClick={() => handleStatusChange(r.id, 2)}>恢复</Button>}
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          {r.wo_status <= 1 && (
            <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <Card bordered={false} style={{ marginBottom: 12 }}>
        <Form form={searchForm} layout="inline">
          <Form.Item name="woCode"><Input placeholder="工单号" prefix={<SearchOutlined />} style={{ width: 140 }} /></Form.Item>
          <Form.Item name="productName"><Input placeholder="产品名称" style={{ width: 160 }} /></Form.Item>
          <Form.Item name="batchNo"><Input placeholder="批号" style={{ width: 130 }} /></Form.Item>
          <Form.Item name="woStatus">
            <Select placeholder="工单状态" style={{ width: 110 }} allowClear>
              {Object.entries(WO_STATUS).map(([k, [l]]) => <Select.Option key={k} value={+k}>{l}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="factoryCode">
            <Select placeholder="工厂" style={{ width: 120 }} allowClear>
              <Select.Option value="NJ">南京工厂</Select.Option>
              <Select.Option value="LS">溧水工厂</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        bordered={false}
        title={<Title level={5} style={{ margin: 0 }}>生产工单管理 <Text type="secondary" style={{ fontSize: 13 }}>共 {total} 条</Text></Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建工单</Button>}
      >
        <Table
          columns={columns} dataSource={list} rowKey="id" loading={loading}
          size="small" scroll={{ x: 1400 }}
          pagination={{ total, current: filter.pageNum, pageSize: filter.pageSize, showSizeChanger: true, showTotal: t => `共 ${t} 条`, onChange: (p, s) => setFilter(f => ({ ...f, pageNum: p, pageSize: s })) }}
          rowClassName={() => 'clickable-row'}
        />
      </Card>

      <Modal title={editRecord ? '编辑工单' : '新建生产工单'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={700} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="工厂" name="factoryCode" rules={[{ required: true }]}>
                <Select placeholder="选择工厂">
                  <Select.Option value="NJ">南京天美健工厂</Select.Option>
                  <Select.Option value="LS">溧水每日营养工厂</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="产品编码" name="productCode" rules={[{ required: true, message: '请输入产品编码' }]}>
                <Input placeholder="如：TMJ-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="产品名称" name="productName" rules={[{ required: true }]}>
                <Input placeholder="产品名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="生产批号" name="batchNo" rules={[{ required: true, message: '请输入批号' }]}>
                <Input placeholder="如：2026061101" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="计划数量" name="planQty" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} placeholder="生产数量" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="单位" name="unitName">
                <Input placeholder="如：粒、瓶、盒" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="订单类型" name="orderType" initialValue="NORMAL">
                <Select>{Object.entries(ORDER_TYPE).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="渠道类型" name="channelType">
                <Select allowClear placeholder="选择渠道">
                  {Object.entries(CHANNEL).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="优先级" name="priority" initialValue={3}>
                <Select options={PRIORITY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="车间" name="workshopCode">
                <Input placeholder="车间编码" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="计划日期" name="planDateRange">
                <RangePicker style={{ width: '100%' }} showTime />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="备注" name="remark">
                <Input.TextArea rows={2} placeholder="备注信息" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
