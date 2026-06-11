import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  message, Popconfirm, Descriptions, Row, Col, Typography, Badge
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  ToolOutlined, CheckOutlined, CalendarOutlined
} from '@ant-design/icons';
import { equipmentApi } from '../../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

const statusMap = {
  planned:    { color: 'default',    text: '计划中' },
  in_progress:{ color: 'processing', text: '执行中' },
  completed:  { color: 'success',    text: '已完成' },
  overdue:    { color: 'error',      text: '已逾期' },
};

const typeMap = {
  preventive: '预防性维保',
  corrective: '纠正性维修',
  calibration:'设备校准',
  inspection: '例行检查',
};

const MaintPlanPage = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [completeVisible, setCompleteVisible] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchList = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await equipmentApi.getMaintPlans({ page: p, pageSize, ...s });
      if (res.data.code === 0) {
        setList(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch { message.error('获取维保计划失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleSearch = (vals) => { setSearch(vals); setPage(1); fetchList(1, vals); };

  const openAdd = () => { setEditRecord(null); form.resetFields(); setModalVisible(true); };
  const openEdit = (r) => { setEditRecord(r); form.setFieldsValue({ ...r }); setModalVisible(true); };

  const handleSave = async (values) => {
    try {
      if (editRecord) {
        await equipmentApi.updateMaintPlan(editRecord.id, values);
        message.success('更新成功');
      } else {
        await equipmentApi.createMaintPlan(values);
        message.success('维保计划已创建');
      }
      setModalVisible(false);
      fetchList();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id) => {
    try {
      await equipmentApi.deleteMaintPlan(id);
      message.success('删除成功');
      fetchList();
    } catch { message.error('删除失败'); }
  };

  const handleComplete = async (values) => {
    try {
      await equipmentApi.completeMaintPlan(currentId, values);
      message.success('维保完成确认成功');
      setCompleteVisible(false);
      completeForm.resetFields();
      fetchList();
    } catch { message.error('确认失败'); }
  };

  const columns = [
    { title: '计划单号', dataIndex: 'plan_no', key: 'plan_no', width: 140,
      render: v => <Text code>{v}</Text> },
    { title: '设备名称', dataIndex: 'equipment_name', key: 'equipment_name', width: 140 },
    { title: '设备编码', dataIndex: 'equipment_code', key: 'equipment_code', width: 110 },
    { title: '维保类型', dataIndex: 'maint_type', key: 'maint_type', width: 120,
      render: v => typeMap[v] || v },
    { title: '计划日期', dataIndex: 'plan_date', key: 'plan_date', width: 120,
      render: v => {
        const overdue = dayjs(v).isBefore(dayjs(), 'day');
        return <Text type={overdue ? 'danger' : 'default'}>{dayjs(v).format('YYYY-MM-DD')}</Text>;
      }},
    { title: '负责人', dataIndex: 'maintainer', key: 'maintainer', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: v => <Badge status={v === 'in_progress' ? 'processing' : v === 'completed' ? 'success' : v === 'overdue' ? 'error' : 'default'}
        text={<Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag>} /> },
    { title: '实际完成日期', dataIndex: 'actual_date', key: 'actual_date', width: 130,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    {
      title: '操作', key: 'action', fixed: 'right', width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          {(record.status === 'planned' || record.status === 'in_progress') && (
            <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }}
              onClick={() => { setCurrentId(record.id); setCompleteVisible(true); }}>
              完成
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
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" form={searchForm} onFinish={handleSearch}>
          <Form.Item name="equipment_name" label="设备名称">
            <Input placeholder="设备名称" allowClear />
          </Form.Item>
          <Form.Item name="maint_type" label="维保类型">
            <Select placeholder="全部" allowClear style={{ width: 130 }}>
              {Object.entries(typeMap).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
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
        title={<><CalendarOutlined /> 维保计划管理</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增维保计划</Button>}
      >
        <Table
          columns={columns} dataSource={list} rowKey="id" loading={loading} scroll={{ x: 1200 }}
          pagination={{
            current: page, pageSize, total,
            onChange: p => { setPage(p); fetchList(p); },
            showTotal: t => `共 ${t} 条`
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editRecord ? '编辑维保计划' : '新增维保计划'}
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
              <Form.Item name="maint_type" label="维保类型" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(typeMap).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plan_date" label="计划日期" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maintainer" label="负责人" rules={[{ required: true }]}>
                <Input placeholder="维保人员" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="planned">
                <Select>
                  {Object.entries(statusMap).map(([k, v]) => <Option key={k} value={k}>{v.text}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="estimated_duration" label="预计工时(h)">
                <Input type="number" min={0} placeholder="小时" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="维保内容">
                <Input.TextArea rows={3} placeholder="详细维保内容" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Complete Modal */}
      <Modal
        title="维保完成确认"
        open={completeVisible}
        onCancel={() => { setCompleteVisible(false); completeForm.resetFields(); }}
        onOk={() => completeForm.submit()}
        okText="确认完成"
      >
        <Form form={completeForm} layout="vertical" onFinish={handleComplete}>
          <Form.Item name="actual_date" label="实际完成日期" rules={[{ required: true }]}
            initialValue={dayjs().format('YYYY-MM-DD')}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="actual_duration" label="实际工时(h)">
            <Input type="number" min={0} placeholder="实际工时" />
          </Form.Item>
          <Form.Item name="result" label="维保结果" rules={[{ required: true }]}>
            <Select>
              <Option value="normal">正常完成</Option>
              <Option value="partial">部分完成</Option>
              <Option value="failed">未完成</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="维保情况说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaintPlanPage;
