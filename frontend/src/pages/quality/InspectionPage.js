import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, Typography, Card, message, Badge } from 'antd';
import { PlusOutlined, FileSearchOutlined } from '@ant-design/icons';
import { qualityApi } from '../../api';

const { Title, Text } = Typography;
const IO_TYPE = { 1: '来料IQC', 2: '过程IPQC', 3: '成品FQC', 4: '在线', 5: '清洁' };
const IO_STATUS = { 1: ['待检验', 'default'], 2: ['检验中', 'processing'], 3: ['已完成', 'success'] };
const RESULT_COLOR = { PASS: 'green', FAIL: 'red', CONDITIONAL: 'orange' };

export default function InspectionPage() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [current, setCurrent] = useState(null);
  const [form] = Form.useForm();
  const [resultForm] = Form.useForm();
  const [filter, setFilter] = useState({ pageNum: 1, pageSize: 20 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await qualityApi.getInspections(filter);
      if (res.code === 200) { setList(res.data.list); setTotal(res.data.total); }
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [filter]);

  const handleAdd = async () => {
    const vals = await form.validateFields();
    const user = JSON.parse(localStorage.getItem('tmj_mes_user') || '{}');
    const res = await qualityApi.createInspection({ ...vals, inspectorName: user.realName });
    if (res.code === 200) { message.success(`检验单创建：${res.data.ioCode}`); setAddModal(false); form.resetFields(); load(); }
  };

  const handleSubmitResult = async () => {
    const vals = await resultForm.validateFields();
    const user = JSON.parse(localStorage.getItem('tmj_mes_user') || '{}');
    await qualityApi.submitResults(current.id, { ...vals, reviewerName: user.realName, results: [{ itemId: 1, itemName: '综合', actualValue: vals.actualValue, isPass: vals.overallResult === 'PASS' ? 1 : 0 }] });
    message.success('检验结果已提交'); setResultModal(false); resultForm.resetFields(); load();
  };

  const columns = [
    { title: '检验单号', dataIndex: 'io_code', width: 160, render: v => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: '检验类型', dataIndex: 'io_type', width: 100, render: v => <Tag color="blue">{IO_TYPE[v] || v}</Tag> },
    { title: '工单号', dataIndex: 'wo_code', width: 140 },
    { title: '批号', dataIndex: 'batch_no', width: 120 },
    { title: '物料名称', dataIndex: 'material_name', ellipsis: true },
    { title: '取样数量', dataIndex: 'sample_qty', width: 80, align: 'right' },
    { title: '检验结果', dataIndex: 'overall_result', width: 90, render: v => v ? <Tag color={RESULT_COLOR[v] || 'default'}>{v}</Tag> : '-' },
    { title: '状态', dataIndex: 'io_status', width: 90, render: v => { const [l, c] = IO_STATUS[v] || ['未知', 'default']; return <Badge status={c} text={l} />; } },
    { title: '检验人', dataIndex: 'inspector_name', width: 80 },
    { title: '创建时间', dataIndex: 'create_time', width: 130, render: v => v?.slice(0, 16) },
    {
      title: '操作', width: 130,
      render: (_, r) => (
        <Space size={4}>
          {r.io_status !== 3 && <Button size="small" type="primary" icon={<FileSearchOutlined />} onClick={() => { setCurrent(r); resultForm.resetFields(); setResultModal(true); }}>录入结果</Button>}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <Card bordered={false} style={{ marginBottom: 12 }}>
        <Form layout="inline">
          <Form.Item>
            <Select placeholder="检验类型" style={{ width: 130 }} allowClear onChange={v => setFilter(f => ({ ...f, ioType: v, pageNum: 1 }))}>
              {Object.entries(IO_TYPE).map(([k, v]) => <Select.Option key={k} value={+k}>{v}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item>
            <Select placeholder="状态" style={{ width: 110 }} allowClear onChange={v => setFilter(f => ({ ...f, ioStatus: v, pageNum: 1 }))}>
              {Object.entries(IO_STATUS).map(([k, [l]]) => <Select.Option key={k} value={+k}>{l}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item>
            <Input placeholder="工单号/批号" onChange={e => setFilter(f => ({ ...f, woCode: e.target.value, pageNum: 1 }))} />
          </Form.Item>
        </Form>
      </Card>
      <Card bordered={false} title={<Title level={5} style={{ margin: 0 }}>检验任务 <Text type="secondary" style={{ fontSize: 13 }}>共 {total} 条</Text></Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setAddModal(true); }}>新建检验</Button>}>
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading} size="small" scroll={{ x: 1000 }}
          pagination={{ total, current: filter.pageNum, pageSize: filter.pageSize, onChange: (p, s) => setFilter(f => ({ ...f, pageNum: p, pageSize: s })) }} />
      </Card>

      <Modal title="新建检验单" open={addModal} onOk={handleAdd} onCancel={() => setAddModal(false)} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="检验类型" name="ioType" rules={[{ required: true }]}>
            <Select>{Object.entries(IO_TYPE).map(([k, v]) => <Select.Option key={k} value={+k}>{v}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item label="关联工单号" name="woCode"><Input /></Form.Item>
          <Form.Item label="生产批号" name="batchNo"><Input /></Form.Item>
          <Form.Item label="物料名称" name="materialName"><Input /></Form.Item>
          <Form.Item label="取样数量" name="sampleQty" initialValue={1}><Input type="number" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="录入检验结果" open={resultModal} onOk={handleSubmitResult} onCancel={() => setResultModal(false)} destroyOnClose>
        <Form form={resultForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="实测值" name="actualValue"><Input placeholder="填写实测值" /></Form.Item>
          <Form.Item label="检验结论" name="overallResult" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="PASS">合格(PASS)</Select.Option>
              <Select.Option value="FAIL">不合格(FAIL)</Select.Option>
              <Select.Option value="CONDITIONAL">有条件通过</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="备注" name="remark"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
