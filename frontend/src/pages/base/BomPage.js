import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  InputNumber, message, Popconfirm, Descriptions, Typography, Row, Col, Divider
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, BranchesOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { baseApi } from '../../api';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Option } = Select;

const BomPage = () => {
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
  const [bomDetails, setBomDetails] = useState([]);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchList = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await baseApi.getBoms({ page: p, pageSize, ...s });
      if (res.data.code === 0) {
        setList(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch { message.error('获取BOM列表失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleSearch = (vals) => { setSearch(vals); setPage(1); fetchList(1, vals); };

  const openAdd = () => { setEditRecord(null); form.resetFields(); setModalVisible(true); };
  const openEdit = (r) => {
    setEditRecord(r);
    form.setFieldsValue({
      ...r,
      details: r.details || [],
    });
    setModalVisible(true);
  };

  const openDetail = async (record) => {
    setDetailRecord(record);
    setDetailVisible(true);
    try {
      const res = await baseApi.getBomDetail(record.id);
      if (res.data.code === 0) setBomDetails(res.data.data || []);
    } catch { setBomDetails([]); }
  };

  const handleSave = async (values) => {
    try {
      if (editRecord) {
        await baseApi.updateBom(editRecord.id, values);
        message.success('BOM已更新');
      } else {
        await baseApi.createBom(values);
        message.success('BOM已创建');
      }
      setModalVisible(false);
      fetchList();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id) => {
    try {
      await baseApi.deleteBom(id);
      message.success('删除成功');
      fetchList();
    } catch { message.error('删除失败'); }
  };

  const columns = [
    { title: 'BOM编码', dataIndex: 'bom_code', key: 'bom_code', width: 130, render: v => <Text code>{v}</Text> },
    { title: 'BOM名称', dataIndex: 'bom_name', key: 'bom_name', width: 160 },
    { title: '产品编码', dataIndex: 'product_code', key: 'product_code', width: 120 },
    { title: '产品名称', dataIndex: 'product_name', key: 'product_name', width: 150 },
    { title: '版本号', dataIndex: 'version', key: 'version', width: 80, render: v => <Tag>{v}</Tag> },
    { title: '标准产量', dataIndex: 'standard_qty', key: 'standard_qty', width: 100,
      render: (v, r) => `${v} ${r.unit_name || ''}` },
    { title: '是否启用', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? '启用' : '停用'}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 150,
      render: v => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '操作', key: 'action', width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>明细</Button>
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
          <Form.Item name="bom_code" label="BOM编码"><Input placeholder="BOM编码" allowClear /></Form.Item>
          <Form.Item name="product_name" label="产品名称"><Input placeholder="产品名称" allowClear /></Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
              <Button onClick={() => { searchForm.resetFields(); handleSearch({}); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={<><BranchesOutlined /> BOM管理</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新建BOM</Button>}
      >
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading}
          pagination={{ current: page, pageSize, total, onChange: p => { setPage(p); fetchList(p); }, showTotal: t => `共 ${t} 条` }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editRecord ? '编辑BOM' : '新建BOM'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={760}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="bom_code" label="BOM编码" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="bom_name" label="BOM名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="version" label="版本号" initialValue="V1.0"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="product_code" label="产品编码" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="standard_qty" label="标准产量"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="is_active" label="状态" initialValue={1}>
              <Select><Option value={1}>启用</Option><Option value={0}>停用</Option></Select>
            </Form.Item></Col>
          </Row>
          <Divider>BOM物料明细</Divider>
          <Form.List name="details" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Row gutter={8} key={key} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={6}><Form.Item name={[name, 'material_code']} noStyle rules={[{ required: true }]}><Input placeholder="物料编码" /></Form.Item></Col>
                    <Col span={6}><Form.Item name={[name, 'material_name']} noStyle><Input placeholder="物料名称" /></Form.Item></Col>
                    <Col span={4}><Form.Item name={[name, 'qty']} noStyle rules={[{ required: true }]}><InputNumber min={0} precision={4} placeholder="用量" style={{ width: '100%' }} /></Form.Item></Col>
                    <Col span={4}><Form.Item name={[name, 'unit_name']} noStyle><Input placeholder="单位" /></Form.Item></Col>
                    <Col span={4}><Button danger type="link" icon={<MinusCircleOutlined />} onClick={() => remove(name)}>删除</Button></Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加物料行</Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal title={`BOM明细 — ${detailRecord?.bom_name}`} open={detailVisible}
        onCancel={() => setDetailVisible(false)} footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>} width={680}>
        {detailRecord && (
          <>
            <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="BOM编码"><Text code>{detailRecord.bom_code}</Text></Descriptions.Item>
              <Descriptions.Item label="产品名称">{detailRecord.product_name}</Descriptions.Item>
              <Descriptions.Item label="版本"><Tag>{detailRecord.version}</Tag></Descriptions.Item>
              <Descriptions.Item label="标准产量">{detailRecord.standard_qty} {detailRecord.unit_name}</Descriptions.Item>
            </Descriptions>
            <Table size="small" dataSource={bomDetails} rowKey="id" pagination={false}
              columns={[
                { title: '物料编码', dataIndex: 'material_code', render: v => <Text code>{v}</Text> },
                { title: '物料名称', dataIndex: 'material_name' },
                { title: '用量', dataIndex: 'qty', render: (v, r) => `${v} ${r.unit_name || ''}` },
                { title: '损耗率', dataIndex: 'loss_rate', render: v => v ? `${v}%` : '-' },
                { title: '备注', dataIndex: 'remarks' },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default BomPage;
