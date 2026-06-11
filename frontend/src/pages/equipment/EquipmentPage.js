import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  message, Popconfirm, Descriptions, Row, Col, Statistic, Progress, Typography
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined,
  DeleteOutlined, ToolOutlined, CheckCircleOutlined, StopOutlined
} from '@ant-design/icons';
import { equipmentApi } from '../../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

const statusMap = {
  normal:      { color: 'success',   text: '正常' },
  maintenance: { color: 'warning',   text: '维保中' },
  fault:       { color: 'error',     text: '故障' },
  idle:        { color: 'default',   text: '闲置' },
  scrapped:    { color: 'default',   text: '报废' },
};

const EquipmentPage = () => {
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
  const [oeeData, setOeeData] = useState(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [stats, setStats] = useState({ total: 0, normal: 0, maintenance: 0, fault: 0 });

  const fetchList = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await equipmentApi.getEquipments({ page: p, pageSize, ...s });
      if (res.data.code === 0) {
        const l = res.data.data.list || [];
        setList(l);
        setTotal(res.data.data.total || 0);
        setStats({
          total: res.data.data.total || 0,
          normal: l.filter(e => e.status === 'normal').length,
          maintenance: l.filter(e => e.status === 'maintenance').length,
          fault: l.filter(e => e.status === 'fault').length,
        });
      }
    } catch { message.error('获取设备列表失败'); }
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
      const res = await equipmentApi.getOeeData({ equipment_id: record.id, limit: 1 });
      if (res.data.code === 0 && res.data.data.list?.length) {
        setOeeData(res.data.data.list[0]);
      } else { setOeeData(null); }
    } catch { setOeeData(null); }
  };

  const handleSave = async (values) => {
    try {
      if (editRecord) {
        await equipmentApi.updateEquipment(editRecord.id, values);
        message.success('设备信息已更新');
      } else {
        await equipmentApi.createEquipment(values);
        message.success('设备已添加');
      }
      setModalVisible(false);
      fetchList();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id) => {
    try {
      await equipmentApi.deleteEquipment(id);
      message.success('删除成功');
      fetchList();
    } catch { message.error('删除失败'); }
  };

  const columns = [
    { title: '设备编码', dataIndex: 'equipment_code', key: 'equipment_code', width: 120,
      render: v => <Text code>{v}</Text> },
    { title: '设备名称', dataIndex: 'equipment_name', key: 'equipment_name', width: 150 },
    { title: '设备型号', dataIndex: 'model', key: 'model', width: 120 },
    { title: '所属车间', dataIndex: 'workshop_name', key: 'workshop_name', width: 120 },
    { title: '负责人', dataIndex: 'manager_name', key: 'manager_name', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag> },
    { title: '下次维保', dataIndex: 'next_maint_date', key: 'next_maint_date', width: 120,
      render: v => {
        if (!v) return '-';
        const overdue = dayjs(v).isBefore(dayjs());
        return <Tag color={overdue ? 'red' : 'blue'}>{dayjs(v).format('YYYY-MM-DD')}</Tag>;
      }},
    { title: '下次校准', dataIndex: 'next_calib_date', key: 'next_calib_date', width: 120,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    {
      title: '操作', key: 'action', fixed: 'right', width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>详情</Button>
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
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="设备总数" value={stats.total} prefix={<ToolOutlined />} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="正常运行" value={stats.normal} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="维保中" value={stats.maintenance} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="故障" value={stats.fault} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" form={searchForm} onFinish={handleSearch}>
          <Form.Item name="equipment_code" label="设备编码">
            <Input placeholder="设备编码" allowClear />
          </Form.Item>
          <Form.Item name="equipment_name" label="设备名称">
            <Input placeholder="设备名称" allowClear />
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
        title={<><ToolOutlined /> 设备台账</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增设备</Button>}
      >
        <Table
          columns={columns} dataSource={list} rowKey="id" loading={loading} scroll={{ x: 1200 }}
          pagination={{
            current: page, pageSize, total,
            onChange: (p) => { setPage(p); fetchList(p); },
            showTotal: t => `共 ${t} 条`
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editRecord ? '编辑设备' : '新增设备'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="equipment_code" label="设备编码" rules={[{ required: true }]}>
                <Input placeholder="设备编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="equipment_name" label="设备名称" rules={[{ required: true }]}>
                <Input placeholder="设备名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="型号规格">
                <Input placeholder="型号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="manufacturer" label="制造商">
                <Input placeholder="制造商" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="workshop_id" label="所属车间">
                <Input placeholder="车间ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="manager_name" label="负责人">
                <Input placeholder="负责人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="normal">
                <Select>
                  {Object.entries(statusMap).map(([k, v]) => (
                    <Option key={k} value={k}>{v.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purchase_date" label="购置日期">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="next_maint_date" label="下次维保日期">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="next_calib_date" label="下次校准日期">
                <Input type="date" />
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
        title={`设备详情 — ${detailRecord?.equipment_name}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        width={680}
      >
        {detailRecord && (
          <>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="设备编码"><Text code>{detailRecord.equipment_code}</Text></Descriptions.Item>
              <Descriptions.Item label="设备名称">{detailRecord.equipment_name}</Descriptions.Item>
              <Descriptions.Item label="型号规格">{detailRecord.model || '-'}</Descriptions.Item>
              <Descriptions.Item label="制造商">{detailRecord.manufacturer || '-'}</Descriptions.Item>
              <Descriptions.Item label="购置日期">
                {detailRecord.purchase_date ? dayjs(detailRecord.purchase_date).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[detailRecord.status]?.color}>{statusMap[detailRecord.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="负责人">{detailRecord.manager_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="下次维保">
                {detailRecord.next_maint_date ? dayjs(detailRecord.next_maint_date).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
            </Descriptions>

            {oeeData && (
              <div style={{ marginTop: 16 }}>
                <Text strong>最新OEE数据</Text>
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col span={8}>
                    <Text type="secondary">可用率</Text>
                    <Progress percent={Math.round((oeeData.availability || 0) * 100)} size="small" />
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">性能率</Text>
                    <Progress percent={Math.round((oeeData.performance || 0) * 100)} size="small" strokeColor="#faad14" />
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">质量率</Text>
                    <Progress percent={Math.round((oeeData.quality || 0) * 100)} size="small" strokeColor="#52c41a" />
                  </Col>
                </Row>
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Text strong>OEE综合效率: </Text>
                  <Text style={{ fontSize: 18, color: '#1677ff' }}>
                    {((oeeData.oee || 0) * 100).toFixed(1)}%
                  </Text>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default EquipmentPage;
