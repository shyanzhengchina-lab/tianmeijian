import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, Typography, Card, message, Badge } from 'antd';
import { SearchOutlined, UserAddOutlined, CheckOutlined } from '@ant-design/icons';
import { executionApi } from '../../api';

const { Title, Text } = Typography;
const TASK_STATUS = { 1: ['待分配', 'default'], 2: ['进行中', 'processing'], 3: ['已完成', 'success'], 4: ['异常', 'error'] };

export default function TaskOrderPage() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [current, setCurrent] = useState(null);
  const [form] = Form.useForm();
  const [reportForm] = Form.useForm();
  const [filter, setFilter] = useState({ pageNum: 1, pageSize: 20 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await executionApi.getTaskOrders(filter);
      if (res.code === 200) { setList(res.data.list); setTotal(res.data.total); }
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [filter]);

  const handleAssign = async () => {
    const vals = await form.validateFields();
    await executionApi.assignTask(current.id, vals);
    message.success('分配成功'); setAssignModal(false); load();
  };

  const handleReport = async () => {
    const vals = await reportForm.validateFields();
    await executionApi.submitReport({ taskId: current.id, woId: current.wo_id, woCode: current.wo_code, opCode: current.op_code, opName: current.op_name, ...vals });
    message.success('报工成功'); setReportModal(false); reportForm.resetFields(); load();
  };

  const handleComplete = async (id) => {
    await executionApi.completeTask(id);
    message.success('任务已完成'); load();
  };

  const columns = [
    { title: '任务单号', dataIndex: 'task_code', width: 160, render: v => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: '工单号', dataIndex: 'wo_code', width: 140 },
    { title: '产品名称', dataIndex: 'product_name', ellipsis: true },
    { title: '批号', dataIndex: 'batch_no', width: 110 },
    { title: '工序', dataIndex: 'op_name', width: 100 },
    { title: '步骤', dataIndex: 'step_no', width: 60, align: 'center' },
    { title: '计划量', dataIndex: 'plan_qty', width: 80, align: 'right' },
    { title: '实际量', dataIndex: 'actual_qty', width: 80, align: 'right', render: v => v > 0 ? <Text style={{ color: '#52c41a' }}>{v}</Text> : '-' },
    { title: '操作员', dataIndex: 'operator_name', width: 90 },
    { title: '状态', dataIndex: 'task_status', width: 90, render: v => { const [l, c] = TASK_STATUS[v] || ['未知', 'default']; return <Badge status={c} text={l} />; } },
    {
      title: '操作', width: 180,
      render: (_, r) => (
        <Space size={4}>
          {r.task_status === 1 && <Button size="small" type="primary" icon={<UserAddOutlined />} onClick={() => { setCurrent(r); form.resetFields(); setAssignModal(true); }}>分配</Button>}
          {r.task_status === 2 && <Button size="small" onClick={() => { setCurrent(r); reportForm.resetFields(); setReportModal(true); }}>报工</Button>}
          {r.task_status === 2 && <Button size="small" icon={<CheckOutlined />} onClick={() => handleComplete(r.id)}>完成</Button>}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <Card bordered={false} style={{ marginBottom: 12 }}>
        <Form layout="inline">
          <Form.Item><Input placeholder="工单号" onChange={e => setFilter(f => ({ ...f, woCode: e.target.value, pageNum: 1 }))} /></Form.Item>
          <Form.Item>
            <Select placeholder="状态" style={{ width: 120 }} allowClear onChange={v => setFilter(f => ({ ...f, taskStatus: v, pageNum: 1 }))}>
              {Object.entries(TASK_STATUS).map(([k, [l]]) => <Select.Option key={k} value={+k}>{l}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Card>
      <Card bordered={false} title={<Title level={5} style={{ margin: 0 }}>工序任务单 <Text type="secondary" style={{ fontSize: 13 }}>共 {total} 条</Text></Title>}>
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading} size="small" scroll={{ x: 1100 }}
          pagination={{ total, current: filter.pageNum, pageSize: filter.pageSize, onChange: (p, s) => setFilter(f => ({ ...f, pageNum: p, pageSize: s })) }} />
      </Card>

      <Modal title="分配任务" open={assignModal} onOk={handleAssign} onCancel={() => setAssignModal(false)} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="操作员姓名" name="operatorName" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="班组ID" name="teamId"><Input placeholder="可选" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="报工" open={reportModal} onOk={handleReport} onCancel={() => setReportModal(false)} destroyOnClose>
        <Form form={reportForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="报工数量" name="reportQty" rules={[{ required: true }]}><Input type="number" /></Form.Item>
          <Form.Item label="报废数量" name="scrapQty" initialValue={0}><Input type="number" /></Form.Item>
          <Form.Item label="操作员" name="operatorName"><Input placeholder="操作员姓名" /></Form.Item>
          <Form.Item label="扫描码" name="scanCode"><Input placeholder="扫描条码（可选）" /></Form.Item>
          <Form.Item label="备注" name="remark"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
