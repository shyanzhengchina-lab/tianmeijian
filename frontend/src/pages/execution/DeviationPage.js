import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, Typography, Card, message } from 'antd';
import { PlusOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { executionApi } from '../../api';

const { Title, Text } = Typography;
const SEVERITY = { MINOR: ['轻微', 'green'], MAJOR: ['重大', 'orange'], CRITICAL: ['严重', 'red'] };
const DEV_TYPE = ['设备', '物料', '工艺', '环境', '人员', '其他'];

export default function DeviationPage() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [current, setCurrent] = useState(null);
  const [form] = Form.useForm();
  const [closeForm] = Form.useForm();
  const [filter, setFilter] = useState({ pageNum: 1, pageSize: 20 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await executionApi.getDeviations(filter);
      if (res.code === 200) { setList(res.data.list); setTotal(res.data.total); }
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [filter]);

  const handleAdd = async () => {
    const vals = await form.validateFields();
    const res = await executionApi.createDeviation({ ...vals, reporterName: JSON.parse(localStorage.getItem('tmj_mes_user') || '{}')?.realName });
    if (res.code === 200) { message.success(`偏差记录创建：${res.data.deviationCode}`); setAddModal(false); form.resetFields(); load(); }
  };

  const handleClose = async () => {
    const vals = await closeForm.validateFields();
    await executionApi.closeDeviation(current.id, { ...vals, handlerName: JSON.parse(localStorage.getItem('tmj_mes_user') || '{}')?.realName });
    message.success('偏差已关闭'); setCloseModal(false); closeForm.resetFields(); load();
  };

  const columns = [
    { title: '偏差编号', dataIndex: 'deviation_code', width: 170, render: v => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: '批号', dataIndex: 'batch_no', width: 110 },
    { title: '类型', dataIndex: 'deviation_type', width: 80 },
    { title: '严重程度', dataIndex: 'severity', width: 90, render: v => { const [l, c] = SEVERITY[v] || ['未知', 'default']; return <Tag color={c}>{l}</Tag>; } },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 80, render: v => <Tag color={v === 'OPEN' ? 'red' : 'green'}>{v === 'OPEN' ? '待处理' : '已关闭'}</Tag> },
    { title: '报告人', dataIndex: 'reporter_name', width: 80 },
    { title: '创建时间', dataIndex: 'create_time', width: 130, render: v => v?.slice(0, 16) },
    {
      title: '操作', width: 100,
      render: (_, r) => r.status === 'OPEN' && (
        <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => { setCurrent(r); closeForm.resetFields(); setCloseModal(true); }}>关闭</Button>
      )
    }
  ];

  return (
    <div className="page-container">
      <Card bordered={false} title={<Title level={5} style={{ margin: 0 }}>偏差记录 <Text type="secondary" style={{ fontSize: 13 }}>共 {total} 条</Text></Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setAddModal(true); }}>记录偏差</Button>}>
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading} size="small" scroll={{ x: 900 }}
          pagination={{ total, current: filter.pageNum, pageSize: filter.pageSize, onChange: (p, s) => setFilter(f => ({ ...f, pageNum: p, pageSize: s })) }} />
      </Card>

      <Modal title="记录偏差" open={addModal} onOk={handleAdd} onCancel={() => setAddModal(false)} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="批号" name="batchNo"><Input /></Form.Item>
          <Form.Item label="偏差类型" name="deviationType" rules={[{ required: true }]}>
            <Select>{DEV_TYPE.map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item label="严重程度" name="severity" initialValue="MINOR" rules={[{ required: true }]}>
            <Select><Select.Option value="MINOR">轻微</Select.Option><Select.Option value="MAJOR">重大</Select.Option><Select.Option value="CRITICAL">严重</Select.Option></Select>
          </Form.Item>
          <Form.Item label="偏差描述" name="description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="关闭偏差" open={closeModal} onOk={handleClose} onCancel={() => setCloseModal(false)} destroyOnClose>
        <Form form={closeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="根本原因" name="rootCause" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="纠正预防措施(CAPA)" name="capa" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
