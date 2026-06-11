import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  InputNumber, message, Popconfirm, Descriptions, Row, Col, Divider, Typography
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, CheckOutlined,
  MinusCircleOutlined, SendOutlined
} from '@ant-design/icons';
import { warehouseApi } from '../../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

const statusMap = {
  draft:     { color: 'default',   text: '草稿' },
  pending:   { color: 'processing', text: '待发料' },
  issued:    { color: 'success',   text: '已发料' },
  cancelled: { color: 'default',   text: '已取消' },
};

const IssuancePage = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [detailLines, setDetailLines] = useState([]);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchList = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await warehouseApi.getIssuances({ page: p, pageSize, ...s });
      if (res.data.code === 0) {
        setList(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch { message.error('获取发料单失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleSearch = (vals) => {
    setSearch(vals);
    setPage(1);
    fetchList(1, vals);
  };

  const openDetail = async (record) => {
    setDetailRecord(record);
    setDetailVisible(true);
    try {
      const res = await warehouseApi.getIssuanceDetail(record.id);
      if (res.data.code === 0) setDetailLines(res.data.data || []);
    } catch { setDetailLines([]); }
  };

  const handleCreate = async (values) => {
    try {
      const payload = {
        work_order_no: values.work_order_no,
        applicant: values.applicant,
        remarks: values.remarks,
        details: values.details || [],
      };
      await warehouseApi.createIssuance(payload);
      message.success('发料单创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchList();
    } catch { message.error('创建失败'); }
  };

  const handleConfirm = async (id) => {
    try {
      await warehouseApi.confirmIssuance(id);
      message.success('发料确认成功，库存已扣减');
      fetchList();
    } catch { message.error('确认失败'); }
  };

  const columns = [
    { title: '发料单号', dataIndex: 'issuance_no', key: 'issuance_no', width: 160,
      render: v => <Text code>{v}</Text> },
    { title: '关联工单', dataIndex: 'work_order_no', key: 'work_order_no', width: 140 },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100 },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag> },
    { title: '发料时间', dataIndex: 'issued_at', key: 'issued_at', width: 160,
      render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '备注', dataIndex: 'remarks', key: 'remarks', ellipsis: true },
    {
      title: '操作', key: 'action', fixed: 'right', width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
            明细
          </Button>
          {record.status === 'pending' && (
            <Popconfirm title="确认发料？库存将立即扣减。" onConfirm={() => handleConfirm(record.id)}>
              <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }}>
                确认发料
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" form={searchForm} onFinish={handleSearch}>
          <Form.Item name="issuance_no" label="发料单号">
            <Input placeholder="发料单号" allowClear />
          </Form.Item>
          <Form.Item name="work_order_no" label="工单号">
            <Input placeholder="关联工单号" allowClear />
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
        title={<><SendOutlined /> 发料管理</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
          新建发料单
        </Button>}
      >
        <Table
          columns={columns} dataSource={list} rowKey="id" loading={loading} scroll={{ x: 1100 }}
          pagination={{
            current: page, pageSize, total,
            onChange: (p) => { setPage(p); fetchList(p); },
            showTotal: t => `共 ${t} 条`
          }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="新建发料单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={720}
        okText="提交发料申请"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="work_order_no" label="关联工单号" rules={[{ required: true }]}>
                <Input placeholder="请输入工单号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="applicant" label="申请人" rules={[{ required: true }]}>
                <Input placeholder="申请人姓名" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remarks" label="备注">
                <Input.TextArea rows={2} placeholder="发料说明" />
              </Form.Item>
            </Col>
          </Row>
          <Divider>发料明细</Divider>
          <Form.List name="details" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Row gutter={8} key={key} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={6}>
                      <Form.Item name={[name, 'lot_no']} rules={[{ required: true, message: '请输入批次号' }]} noStyle>
                        <Input placeholder="物料批次号" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name={[name, 'material_name']} noStyle>
                        <Input placeholder="物料名称" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name={[name, 'planned_qty']} rules={[{ required: true, message: '请填写数量' }]} noStyle>
                        <InputNumber min={0.01} precision={2} placeholder="发料数量" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[name, 'unit_name']} noStyle>
                        <Input placeholder="单位" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)}>
                        删除
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加物料行
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={`发料单明细 — ${detailRecord?.issuance_no}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          detailRecord?.status === 'pending' && (
            <Popconfirm key="confirm" title="确认发料？库存将立即扣减。"
              onConfirm={() => { handleConfirm(detailRecord.id); setDetailVisible(false); }}>
              <Button type="primary" icon={<CheckOutlined />}>确认发料</Button>
            </Popconfirm>
          ),
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ].filter(Boolean)}
        width={720}
      >
        {detailRecord && (
          <>
            <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="发料单号"><Text code>{detailRecord.issuance_no}</Text></Descriptions.Item>
              <Descriptions.Item label="关联工单">{detailRecord.work_order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[detailRecord.status]?.color}>{statusMap[detailRecord.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请人">{detailRecord.applicant}</Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {dayjs(detailRecord.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="发料时间">
                {detailRecord.issued_at ? dayjs(detailRecord.issued_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>
            <Table
              dataSource={detailLines}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '物料批次号', dataIndex: 'lot_no', render: v => <Text code>{v}</Text> },
                { title: '物料名称', dataIndex: 'material_name' },
                { title: '计划数量', dataIndex: 'planned_qty', render: (v, r) => `${v} ${r.unit_name || ''}` },
                { title: '实发数量', dataIndex: 'actual_qty', render: v => v || '-' },
                { title: '备注', dataIndex: 'remarks' },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default IssuancePage;
