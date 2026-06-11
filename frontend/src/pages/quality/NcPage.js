import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Card, Typography, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { qualityApi } from '../../api';
const { Title, Text } = Typography;
export default function NcPage() {
  const [list, setList] = useState([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false); const [form] = Form.useForm();
  const [filter, setFilter] = useState({ pageNum: 1, pageSize: 20 });
  const load = async () => { setLoading(true); try { const r = await qualityApi.getNonconformances(filter); if (r.code === 200) { setList(r.data.list); setTotal(r.data.total); } } finally { setLoading(false); } };
  useEffect(() => { load(); }, [filter]);
  const handleAdd = async () => { const vals = await form.validateFields(); const r = await qualityApi.createNc(vals); if (r.code === 200) { message.success('记录成功'); setAddModal(false); form.resetFields(); load(); } };
  const cols = [
    { title: 'NC编号', dataIndex: 'nc_code', width: 160, render: v => <Text code style={{fontSize:12}}>{v}</Text> },
    { title: '批号', dataIndex: 'batch_no', width: 110 }, { title: '物料名称', dataIndex: 'material_name', ellipsis: true },
    { title: '不合格数量', dataIndex: 'nc_qty', width: 100, align: 'right' },
    { title: '不合格原因', dataIndex: 'nc_reason', ellipsis: true },
    { title: '处置方式', dataIndex: 'disposition', width: 90 },
    { title: '状态', dataIndex: 'status', width: 80, render: v => <Tag color={v === 'OPEN' ? 'red' : 'green'}>{v === 'OPEN' ? '待处置' : '已关闭'}</Tag> },
    { title: '创建时间', dataIndex: 'create_time', width: 130, render: v => v?.slice(0,16) },
  ];
  return (
    <div className="page-container">
      <Card bordered={false} title={<Title level={5} style={{margin:0}}>不合格品记录 <Text type="secondary" style={{fontSize:13}}>共 {total} 条</Text></Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setAddModal(true); }}>新增</Button>}>
        <Table columns={cols} dataSource={list} rowKey="id" loading={loading} size="small" pagination={{ total, current: filter.pageNum, pageSize: filter.pageSize, onChange: (p,s) => setFilter(f => ({...f,pageNum:p,pageSize:s})) }} />
      </Card>
      <Modal title="记录不合格品" open={addModal} onOk={handleAdd} onCancel={() => setAddModal(false)} destroyOnClose>
        <Form form={form} layout="vertical" style={{marginTop:16}}>
          <Form.Item label="批号" name="batchNo"><Input /></Form.Item>
          <Form.Item label="物料名称" name="materialName"><Input /></Form.Item>
          <Form.Item label="不合格数量" name="ncQty" rules={[{required:true}]}><Input type="number" /></Form.Item>
          <Form.Item label="不合格原因" name="ncReason" rules={[{required:true}]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="处置方式" name="disposition">
            <Select><Select.Option value="返工">返工</Select.Option><Select.Option value="报废">报废</Select.Option><Select.Option value="让步">让步放行</Select.Option></Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
