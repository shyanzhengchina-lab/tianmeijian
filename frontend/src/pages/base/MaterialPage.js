import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  InputNumber, message, Popconfirm, Row, Col, Typography
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from '@ant-design/icons';
import { baseApi } from '../../api';

const { Option } = Select;
const { Text } = Typography;

const MaterialPage = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [search, setSearch] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchList = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await baseApi.getMaterials({ page: p, pageSize, ...s });
      if (res.data.code === 0) {
        setList(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch { message.error('获取物料档案失败'); }
    finally { setLoading(false); }
  };

  const fetchCatsAndUnits = async () => {
    try {
      const [c, u] = await Promise.all([
        baseApi.getMaterialCategories({ page: 1, pageSize: 100 }),
        baseApi.getUnits({ page: 1, pageSize: 100 }),
      ]);
      if (c.data.code === 0) setCategories(c.data.data.list || []);
      if (u.data.code === 0) setUnits(u.data.data.list || []);
    } catch {}
  };

  useEffect(() => { fetchList(); fetchCatsAndUnits(); }, []);

  const handleSearch = (vals) => { setSearch(vals); setPage(1); fetchList(1, vals); };

  const openAdd = () => { setEditRecord(null); form.resetFields(); setModalVisible(true); };
  const openEdit = (r) => { setEditRecord(r); form.setFieldsValue({ ...r }); setModalVisible(true); };

  const handleSave = async (values) => {
    try {
      if (editRecord) {
        await baseApi.updateMaterial(editRecord.id, values);
        message.success('更新成功');
      } else {
        await baseApi.createMaterial(values);
        message.success('物料已添加');
      }
      setModalVisible(false);
      fetchList();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id) => {
    try {
      await baseApi.deleteMaterial(id);
      message.success('删除成功');
      fetchList();
    } catch { message.error('删除失败'); }
  };

  const typeColorMap = { raw: 'blue', semi: 'orange', finished: 'green', packaging: 'purple', auxiliary: 'cyan' };
  const typeTextMap = { raw: '原料', semi: '半成品', finished: '成品', packaging: '包材', auxiliary: '辅料' };

  const columns = [
    { title: '物料编码', dataIndex: 'material_code', key: 'material_code', width: 120,
      render: v => <Text code>{v}</Text> },
    { title: '物料名称', dataIndex: 'material_name', key: 'material_name', width: 150 },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 120 },
    { title: '类别', dataIndex: 'category_name', key: 'category_name', width: 100 },
    { title: '类型', dataIndex: 'material_type', key: 'material_type', width: 80,
      render: v => <Tag color={typeColorMap[v]}>{typeTextMap[v] || v}</Tag> },
    { title: '单位', dataIndex: 'unit_name', key: 'unit_name', width: 70 },
    { title: '安全库存', dataIndex: 'safety_stock', key: 'safety_stock', width: 90 },
    { title: '是否启用', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? '启用' : '停用'}</Tag> },
    {
      title: '操作', key: 'action', width: 140,
      render: (_, record) => (
        <Space>
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
          <Form.Item name="material_code" label="物料编码">
            <Input placeholder="编码" allowClear />
          </Form.Item>
          <Form.Item name="material_name" label="物料名称">
            <Input placeholder="名称" allowClear />
          </Form.Item>
          <Form.Item name="material_type" label="类型">
            <Select placeholder="全部" allowClear style={{ width: 90 }}>
              {Object.entries(typeTextMap).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
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
        title={<><AppstoreOutlined /> 物料档案</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增物料</Button>}
      >
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading}
          pagination={{ current: page, pageSize, total, onChange: p => { setPage(p); fetchList(p); }, showTotal: t => `共 ${t} 条` }}
        />
      </Card>

      <Modal
        title={editRecord ? '编辑物料' : '新增物料'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="material_code" label="物料编码" rules={[{ required: true }]}>
                <Input placeholder="物料编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="material_name" label="物料名称" rules={[{ required: true }]}>
                <Input placeholder="物料名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="material_type" label="类型" rules={[{ required: true }]} initialValue="raw">
                <Select>
                  {Object.entries(typeTextMap).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category_id" label="所属类别">
                <Select allowClear placeholder="选择类别">
                  {categories.map(c => <Option key={c.id} value={c.id}>{c.category_name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit_id" label="计量单位">
                <Select allowClear placeholder="选择单位">
                  {units.map(u => <Option key={u.id} value={u.id}>{u.unit_name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="specification" label="规格型号">
                <Input placeholder="规格" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="safety_stock" label="安全库存">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="是否启用" initialValue={1}>
                <Select>
                  <Option value={1}>启用</Option>
                  <Option value={0}>停用</Option>
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
    </div>
  );
};

export default MaterialPage;
