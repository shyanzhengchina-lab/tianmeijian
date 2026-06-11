import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  DatePicker, message, Popconfirm, Descriptions, Steps, Badge, Row, Col, Divider, Typography
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined,
  CheckCircleOutlined, FileDoneOutlined, AuditOutlined, LockOutlined
} from '@ant-design/icons';
import { ebrApi } from '../../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text, Title } = Typography;
const { Step } = Steps;

const statusMap = {
  draft:     { color: 'default',   text: '草稿' },
  in_progress: { color: 'processing', text: '执行中' },
  completed: { color: 'success',   text: '已完成' },
  reviewing: { color: 'warning',   text: '审核中' },
  archived:  { color: 'default',   text: '已归档' },
};

const EbrListPage = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [stepsData, setStepsData] = useState([]);
  const [signVisible, setSignVisible] = useState(false);
  const [signForm] = Form.useForm();

  const fetchList = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await ebrApi.getBatchRecords({ page: p, pageSize, ...s });
      if (res.data.code === 0) {
        setList(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch {
      message.error('获取电子批记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleSearch = (vals) => {
    setSearch(vals);
    setPage(1);
    fetchList(1, vals);
  };

  const openDetail = async (record) => {
    setCurrentRecord(record);
    setDetailVisible(true);
    try {
      const res = await ebrApi.getStepRecords(record.id);
      if (res.data.code === 0) setStepsData(res.data.data || []);
    } catch { setStepsData([]); }
  };

  const handleSign = async (values) => {
    try {
      await ebrApi.signBatchRecord(currentRecord.id, values);
      message.success('电子签名成功');
      signForm.resetFields();
      setSignVisible(false);
      fetchList();
      setDetailVisible(false);
    } catch {
      message.error('签名失败');
    }
  };

  const handleArchive = async (id) => {
    try {
      await ebrApi.archiveBatchRecord(id);
      message.success('已归档');
      fetchList();
    } catch {
      message.error('归档失败');
    }
  };

  const columns = [
    { title: '批记录编号', dataIndex: 'record_no', key: 'record_no', width: 160,
      render: v => <Text code>{v}</Text> },
    { title: '工单号', dataIndex: 'work_order_no', key: 'work_order_no', width: 140 },
    { title: '产品名称', dataIndex: 'product_name', key: 'product_name', width: 150 },
    { title: '批号', dataIndex: 'batch_no', key: 'batch_no', width: 120 },
    { title: '计划数量', dataIndex: 'planned_qty', key: 'planned_qty', width: 100,
      render: (v, r) => `${v} ${r.unit_name || ''}` },
    { title: '实际数量', dataIndex: 'actual_qty', key: 'actual_qty', width: 100,
      render: v => v || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag> },
    { title: '操作员', dataIndex: 'operator_name', key: 'operator_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action', fixed: 'right', width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
            查看
          </Button>
          {record.status === 'completed' && (
            <Button type="link" size="small" icon={<AuditOutlined />}
              onClick={() => { setCurrentRecord(record); setSignVisible(true); }}>
              签名
            </Button>
          )}
          {record.status === 'reviewing' && (
            <Popconfirm title="确认归档此批记录?" onConfirm={() => handleArchive(record.id)}>
              <Button type="link" size="small" icon={<FileDoneOutlined />} danger>归档</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="record_no" label="批记录编号">
            <Input placeholder="请输入批记录编号" allowClear />
          </Form.Item>
          <Form.Item name="batch_no" label="批号">
            <Input placeholder="批号" allowClear />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {Object.entries(statusMap).map(([k, v]) => (
                <Option key={k} value={k}>{v.text}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={<><FileDoneOutlined /> 电子批记录 (EBR)</>}
        extra={
          <Space>
            <Badge count={list.filter(r => r.status === 'completed').length} title="待签名">
              <Button icon={<AuditOutlined />}>待签名</Button>
            </Badge>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page, pageSize, total,
            onChange: (p) => { setPage(p); fetchList(p); },
            showTotal: t => `共 ${t} 条`
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={<><FileDoneOutlined /> 批记录详情 — {currentRecord?.record_no}</>}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          currentRecord?.status === 'completed' && (
            <Button key="sign" type="primary" icon={<AuditOutlined />}
              onClick={() => { setSignVisible(true); }}>
              电子签名
            </Button>
          ),
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ].filter(Boolean)}
        width={860}
      >
        {currentRecord && (
          <>
            <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="批记录编号" span={1}>
                <Text code>{currentRecord.record_no}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="批号">{currentRecord.batch_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentRecord.status]?.color}>
                  {statusMap[currentRecord.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="产品名称">{currentRecord.product_name}</Descriptions.Item>
              <Descriptions.Item label="计划数量">{currentRecord.planned_qty} {currentRecord.unit_name}</Descriptions.Item>
              <Descriptions.Item label="实际数量">{currentRecord.actual_qty || '-'}</Descriptions.Item>
              <Descriptions.Item label="操作员">{currentRecord.operator_name}</Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {currentRecord.start_time ? dayjs(currentRecord.start_time).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {currentRecord.end_time ? dayjs(currentRecord.end_time).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              {currentRecord.sign_user_name && (
                <Descriptions.Item label="签名人">{currentRecord.sign_user_name}</Descriptions.Item>
              )}
              {currentRecord.sign_time && (
                <Descriptions.Item label="签名时间">
                  {dayjs(currentRecord.sign_time).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              {currentRecord.remarks && (
                <Descriptions.Item label="备注" span={3}>{currentRecord.remarks}</Descriptions.Item>
              )}
            </Descriptions>

            <Divider>工序执行步骤</Divider>
            {stepsData.length > 0 ? (
              <Steps direction="vertical" size="small" current={stepsData.filter(s => s.status === 'done').length}>
                {stepsData.map((step, idx) => (
                  <Step
                    key={step.id}
                    title={`步骤 ${idx + 1}：${step.step_name}`}
                    status={step.status === 'done' ? 'finish' : step.status === 'skipped' ? 'error' : 'wait'}
                    description={
                      <Space direction="vertical" size={2}>
                        {step.actual_value && <Text type="secondary">实际值：{step.actual_value}</Text>}
                        {step.operator_name && <Text type="secondary">操作员：{step.operator_name}</Text>}
                        {step.done_time && (
                          <Text type="secondary">完成时间：{dayjs(step.done_time).format('YYYY-MM-DD HH:mm')}</Text>
                        )}
                        {step.remarks && <Text type="secondary">备注：{step.remarks}</Text>}
                      </Space>
                    }
                  />
                ))}
              </Steps>
            ) : (
              <Text type="secondary">暂无步骤记录</Text>
            )}
          </>
        )}
      </Modal>

      {/* Sign Modal */}
      <Modal
        title={<><LockOutlined /> 电子签名 — {currentRecord?.record_no}</>}
        open={signVisible}
        onCancel={() => { setSignVisible(false); signForm.resetFields(); }}
        onOk={() => signForm.submit()}
        okText="确认签名"
      >
        <div style={{ marginBottom: 16, padding: '8px 12px', background: '#fff7e6', borderRadius: 4 }}>
          <Text type="warning">⚠️ 电子签名符合 21 CFR Part 11 合规要求，签名后不可更改。请确认批记录信息无误后签名。</Text>
        </div>
        <Form form={signForm} layout="vertical" onFinish={handleSign}>
          <Form.Item name="password" label="操作员密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入您的系统密码" prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item name="sign_remarks" label="签名备注">
            <Input.TextArea rows={3} placeholder="可输入签名备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EbrListPage;
