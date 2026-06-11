import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  InputNumber, message, Popconfirm, Descriptions, Row, Col, Statistic, Typography
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined,
  DeleteOutlined, InboxOutlined, StopOutlined, CheckOutlined
} from '@ant-design/icons';
import { warehouseApi } from '../../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

const statusMap = {
  available:    { color: 'success',   text: '可用' },
  quarantine:   { color: 'warning',   text: '待检' },
  rejected:     { color: 'error',     text: '不合格' },
  consumed:     { color: 'default',   text: '已消耗' },
  returned:     { color: 'purple',    text: '已退库' },
};

const LotPage = () => {
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
  const [warehouses, setWarehouses] = useState([]);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [stats, setStats] = useState({ total: 0, available: 0, quarantine: 0, rejected: 0 });

  const fetchList = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await warehouseApi.getLots({ page: p, pageSize, ...s });
      if (res.data.code === 0) {
        const data = res.data.data;
        setList(data.list || []);
        setTotal(data.total || 0);
        // compute stats
        const l = data.list || [];
        setStats({
          total: data.total || 0,
          available: l.filter(i => i.status === 'available').length,
          quarantine: l.filter(i => i.status === 'quarantine').length,
          rejected: l.filter(i => i.status === 'rejected').length,
        });
      }
    } catch { message.error('获取物料批次失败'); }
    finally { setLoading(false); }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await warehouseApi.getWarehouses({ page: 1, pageSize: 100 });
      if (res.data.code === 0) setWarehouses(res.data.data.list || []);
    } catch {}
  };

  useEffect(() => { fetchList(); fetchWarehouses(); }, []);

  const handleSearch = (vals) => {
    setSearch(vals);
    setPage(1);
    fetchList(1, vals);
  };

  const openAdd = () => { setEditRecord(null); form.resetFields(); setModalVisible(true); };
  const openEdit = (r) => { setEditRecord(r); form.setFieldsValue({ ...r }); setModalVisible(true); };

  const handleSave = async (values) => {
    try {
      if (editRecord) {
        await warehouseApi.updateLot(editRecord.id, values);
        message.success('更新成功');
      } else {
        await warehouseApi.createLot(values);
        message.success('入库成功');
      }
      setModalVisible(false);
      fetchList();
    } catch { message.error('操作失败'); }
  };

  const handleDelete = async (id) => {
    try {
      await warehouseApi.deleteLot(id);
      message.success('删除成功');
      fetchList();
    } catch { message.error('删除失败'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await warehouseApi.updateLotStatus(id, status);
      message.success('状态已更新');
      fetchList();
    } catch { message.error('状态更新失败'); }
  };

  const columns = [
    { title: '批次号', dataIndex: 'lot_no', key: 'lot_no', width: 150,
      render: v => <Text code>{v}</Text> },
    { title: '物料编码', dataIndex: 'material_code', key: 'material_code', width: 120 },
    { title: '物料名称', dataIndex: 'material_name', key: 'material_name', width: 150 },
    { title: '数量', dataIndex: 'qty', key: 'qty', width: 100,
      render: (v, r) => `${v} ${r.unit_name || ''}` },
    { title: '剩余量', dataIndex: 'remaining_qty', key: 'remaining_qty', width: 100,
      render: (v, r) => (
        <Text type={v <= 0 ? 'danger' : v < (r.qty * 0.1) ? 'warning' : 'success'}>
          {v ?? v} {r.unit_name || ''}
        </Text>
      )},
    { title: '仓库', dataIndex: 'warehouse_name', key: 'warehouse_name', width: 120 },
    { title: '库位', dataIndex: 'location_code', key: 'location_code', width: 100 },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name', width: 120 },
    { title: '入库日期', dataIndex: 'receive_date', key: 'receive_date', width: 120,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { title: '有效期至', dataIndex: 'expire_date', key: 'expire_date', width: 120,
      render: v => {
        if (!v) return '-';
        const expired = dayjs(v).isBefore(dayjs());
        return <Tag color={expired ? 'red' : 'green'}>{dayjs(v).format('YYYY-MM-DD')}</Tag>;
      }},
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag> },
    {
      title: '操作', key: 'action', fixed: 'right', width: 220,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}
            onClick={() => { setDetailRecord(record); setDetailVisible(true); }}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          {record.status === 'quarantine' && (
            <Button type="link" size="small" icon={<CheckOutlined />}
              onClick={() => handleStatusChange(record.id, 'available')}>
              放行
            </Button>
          )}
          {record.status === 'available' && (
            <Button type="link" size="small" icon={<StopOutlined />} danger
              onClick={() => handleStatusChange(record.id, 'quarantine')}>
              冻结
            </Button>
          )}
          <Popconfirm title="确认删除此批次?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" icon={<DeleteOutlined />} danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="总批次" value={stats.total} prefix={<InboxOutlined />} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="可用" value={stats.available} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="待检" value={stats.quarantine} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="不合格" value={stats.rejected} valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" form={searchForm} onFinish={handleSearch}>
          <Form.Item name="lot_no" label="批次号">
            <Input placeholder="批次号" allowClear />
          </Form.Item>
          <Form.Item name="material_name" label="物料名称">
            <Input placeholder="物料名称" allowClear />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              {Object.entries(statusMap).map(([k, v]) => (
                <Option key={k} value={k}>{v.text}</Option>
              ))}
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
        title={<><InboxOutlined /> 物料批次管理</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>物料入库</Button>}
      >
        <Table
          columns={columns} dataSource={list} rowKey="id" loading={loading} scroll={{ x: 1400 }}
          pagination={{
            current: page, pageSize, total,
            onChange: (p) => { setPage(p); fetchList(p); },
            showTotal: t => `共 ${t} 条`
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editRecord ? '编辑批次' : '物料入库'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={640}
        okText={editRecord ? '保存' : '入库'}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="lot_no" label="批次号" rules={[{ required: true }]}>
                <Input placeholder="自动生成或手动输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="material_code" label="物料编码" rules={[{ required: true }]}>
                <Input placeholder="物料编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="qty" label="入库数量" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="数量" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warehouse_id" label="仓库">
                <Select placeholder="选择仓库" allowClear>
                  {warehouses.map(w => <Option key={w.id} value={w.id}>{w.warehouse_name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location_code" label="库位">
                <Input placeholder="库位编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supplier_name" label="供应商">
                <Input placeholder="供应商名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="receive_date" label="入库日期">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expire_date" label="有效期至">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="quarantine">
                <Select>
                  {Object.entries(statusMap).map(([k, v]) => (
                    <Option key={k} value={k}>{v.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remarks" label="备注">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="批次详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        width={640}
      >
        {detailRecord && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="批次号" span={2}>
              <Text code>{detailRecord.lot_no}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="物料编码">{detailRecord.material_code}</Descriptions.Item>
            <Descriptions.Item label="物料名称">{detailRecord.material_name}</Descriptions.Item>
            <Descriptions.Item label="入库数量">{detailRecord.qty} {detailRecord.unit_name}</Descriptions.Item>
            <Descriptions.Item label="剩余数量">{detailRecord.remaining_qty} {detailRecord.unit_name}</Descriptions.Item>
            <Descriptions.Item label="仓库">{detailRecord.warehouse_name}</Descriptions.Item>
            <Descriptions.Item label="库位">{detailRecord.location_code || '-'}</Descriptions.Item>
            <Descriptions.Item label="供应商">{detailRecord.supplier_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[detailRecord.status]?.color}>{statusMap[detailRecord.status]?.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="入库日期">
              {detailRecord.receive_date ? dayjs(detailRecord.receive_date).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="有效期至">
              {detailRecord.expire_date ? dayjs(detailRecord.expire_date).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            {detailRecord.remarks && (
              <Descriptions.Item label="备注" span={2}>{detailRecord.remarks}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default LotPage;
