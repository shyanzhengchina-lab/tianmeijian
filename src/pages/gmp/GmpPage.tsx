/**
 * GMP合规管理页面
 * 包含：偏差处理、CAPA管理、卫生管理记录
 */
import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, Select,
  DatePicker, Space, Statistic, Alert, Tabs, Badge, Divider, Timeline,
  Descriptions, message, Empty, Progress
} from 'antd';
import {
  WarningOutlined, CheckCircleOutlined, AuditOutlined,
  ExperimentOutlined, PlusOutlined, SafetyCertificateOutlined,
  CloseCircleOutlined, SyncOutlined, FileTextOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const GmpPage: React.FC<{ subPage?: string }> = ({ subPage = 'gmp-deviation' }) => {
  const [activeTab, setActiveTab] = useState(
    subPage === 'gmp-capa' ? 'capa' : subPage === 'gmp-hygiene' ? 'hygiene' : 'deviation'
  );
  const token = localStorage.getItem('mes_token') || localStorage.getItem('auth_token') || '';
  const headers = { Authorization: `Bearer ${token}` };

  return (
    <div style={{ padding: 16 }}>
      <Card bordered={false}
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#722ed1' }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>GMP合规管理</span>
            <Tag color="purple">符合《保健食品良好生产规范》</Tag>
          </Space>
        }
      >
        <GmpKpiBar headers={headers} />
        <Divider style={{ margin: '12px 0' }} />
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'deviation',
              label: <><WarningOutlined />偏差处理</>,
              children: <DeviationTab headers={headers} />
            },
            {
              key: 'capa',
              label: <><AuditOutlined />CAPA管理</>,
              children: <CapaTab headers={headers} />
            },
            {
              key: 'hygiene',
              label: <><ExperimentOutlined />卫生管理记录</>,
              children: <HygieneTab headers={headers} />
            },
            {
              key: 'nc',
              label: <><CloseCircleOutlined />不合格品处置</>,
              children: <NcTab headers={headers} />
            },
          ]}
        />
      </Card>
    </div>
  );
};

/** GMP KPI汇总栏 */
const GmpKpiBar: React.FC<{ headers: any }> = ({ headers }) => {
  const [stats, setStats] = useState<any>({});
  useEffect(() => {
    // Mock stats since backend GMP-specific endpoints may not be fully implemented
    setStats({
      openDeviations: 3, closedDeviations: 12,
      openCapa: 2, overdueCapa: 1,
      ncPending: 1, monthlyInspections: 47,
    });
  }, []);

  return (
    <Row gutter={16}>
      <Col span={4}>
        <Card size="small" bordered style={{ borderTop: '3px solid #fa8c16' }}>
          <Statistic title="未关闭偏差" value={stats.openDeviations || 0} valueStyle={{ color: '#fa8c16' }}
            prefix={<WarningOutlined />} />
        </Card>
      </Col>
      <Col span={4}>
        <Card size="small" bordered style={{ borderTop: '3px solid #52c41a' }}>
          <Statistic title="已关闭偏差" value={stats.closedDeviations || 0} valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />} />
        </Card>
      </Col>
      <Col span={4}>
        <Card size="small" bordered style={{ borderTop: '3px solid #1677ff' }}>
          <Statistic title="进行中CAPA" value={stats.openCapa || 0} valueStyle={{ color: '#1677ff' }}
            prefix={<AuditOutlined />} />
        </Card>
      </Col>
      <Col span={4}>
        <Card size="small" bordered style={{ borderTop: '3px solid #ff4d4f' }}>
          <Statistic title="逾期CAPA" value={stats.overdueCapa || 0} valueStyle={{ color: '#ff4d4f' }}
            prefix={<CloseCircleOutlined />} />
        </Card>
      </Col>
      <Col span={4}>
        <Card size="small" bordered style={{ borderTop: '3px solid #722ed1' }}>
          <Statistic title="待处置不合格品" value={stats.ncPending || 0} valueStyle={{ color: '#722ed1' }}
            prefix={<ExperimentOutlined />} />
        </Card>
      </Col>
      <Col span={4}>
        <Card size="small" bordered style={{ borderTop: '3px solid #13c2c2' }}>
          <Statistic title="本月检验次数" value={stats.monthlyInspections || 0} valueStyle={{ color: '#13c2c2' }}
            prefix={<FileTextOutlined />} />
        </Card>
      </Col>
    </Row>
  );
};

/** 偏差处理 Tab */
const DeviationTab: React.FC<{ headers: any }> = ({ headers }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form] = Form.useForm();

  const deviationDemo = [
    { id: 1, dev_code: 'DEV-2026060001', wo_code: 'PO-20260601001', title: '称量偏差超限', type: '工艺偏差', severity: '一般', status: 'CLOSED', create_time: '2026-06-02', handler: '张质检', batch_no: 'BN-20260601001', desc: '碳酸钙称量差异0.8%，超出允许范围0.5%' },
    { id: 2, dev_code: 'DEV-2026060002', wo_code: 'PO-20260601002', title: '压片硬度异常', type: '设备偏差', severity: '重要', status: 'OPEN', create_time: '2026-06-03', handler: '李操作', batch_no: 'BN-20260601002', desc: '压片硬度低于标准值，怀疑冲头磨损' },
    { id: 3, dev_code: 'DEV-2026060003', wo_code: 'PO-20260601003', title: '胶囊规格偏差', type: '物料偏差', severity: '一般', status: 'CLOSED', create_time: '2026-06-04', handler: '王质检', batch_no: 'BN-20260601003', desc: '软胶囊壁厚偏差±0.05mm，超出GMP规范' },
    { id: 4, dev_code: 'DEV-2026060004', wo_code: 'PO-20260605001', title: '灭菌温度波动', type: '环境偏差', severity: '严重', status: 'OPEN', create_time: '2026-06-06', handler: '刘工程师', batch_no: 'BN-20260605001', desc: '灭菌箱温度波动±3°C，超出允许±1°C，F0值受影响' },
  ];

  useEffect(() => { setData(deviationDemo); }, []);

  const severityColor: Record<string, string> = { '一般': 'blue', '重要': 'orange', '严重': 'red' };
  const statusColor: Record<string, string> = { 'OPEN': 'processing', 'INVESTIGATION': 'warning', 'CLOSED': 'success', 'PENDING': 'default' };
  const statusText: Record<string, string> = { 'OPEN': '已开立', 'INVESTIGATION': '调查中', 'CLOSED': '已关闭', 'PENDING': '待处理' };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <Alert
          message="偏差处理要求：发现偏差后24小时内记录，重要/严重偏差须48小时内启动调查并实施CAPA。"
          type="warning" showIcon style={{ flex: 1, marginRight: 16 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>新建偏差单</Button>
      </div>
      <Table
        size="small"
        rowKey="id"
        dataSource={data}
        loading={loading}
        columns={[
          { title: '偏差单号', dataIndex: 'dev_code', width: 160, render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code> },
          { title: '偏差标题', dataIndex: 'title', width: 180 },
          { title: '关联工单', dataIndex: 'wo_code', width: 140 },
          { title: '批号', dataIndex: 'batch_no', width: 140 },
          { title: '偏差类型', dataIndex: 'type', width: 100 },
          {
            title: '严重程度', dataIndex: 'severity', width: 90,
            render: (v: string) => <Tag color={severityColor[v] || 'default'}>{v}</Tag>
          },
          {
            title: '状态', dataIndex: 'status', width: 90,
            render: (v: string) => <Badge status={v === 'OPEN' ? 'processing' : v === 'CLOSED' ? 'success' : 'warning'} text={statusText[v] || v} />
          },
          { title: '发现时间', dataIndex: 'create_time', width: 110 },
          { title: '处理人', dataIndex: 'handler', width: 90 },
          {
            title: '操作', width: 120,
            render: (_: any, record: any) => (
              <Space size="small">
                <Button size="small" type="link">查看</Button>
                {record.status === 'OPEN' && <Button size="small" type="link" danger>调查</Button>}
                {record.status === 'INVESTIGATION' && <Button size="small" type="link" style={{ color: '#52c41a' }}>关闭</Button>}
              </Space>
            )
          }
        ]}
        expandable={{
          expandedRowRender: (record: any) => (
            <Descriptions size="small" bordered column={2}>
              <Descriptions.Item label="偏差描述" span={2}>{record.desc}</Descriptions.Item>
            </Descriptions>
          )
        }}
      />

      <Modal title="新建偏差记录" open={showAdd} onCancel={() => setShowAdd(false)}
        onOk={() => { form.validateFields().then(() => { message.success('偏差单已创建'); setShowAdd(false); form.resetFields(); }); }}
        width={640}
      >
        <Form form={form} layout="vertical" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="wo_code" label="关联工单号"><Input placeholder="如 PO-20260601001" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="偏差类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="工艺偏差">工艺偏差</Option>
                  <Option value="设备偏差">设备偏差</Option>
                  <Option value="物料偏差">物料偏差</Option>
                  <Option value="环境偏差">环境偏差</Option>
                  <Option value="人员偏差">人员偏差</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="severity" label="严重程度" rules={[{ required: true }]}>
                <Select>
                  <Option value="一般">一般</Option>
                  <Option value="重要">重要</Option>
                  <Option value="严重">严重</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discover_time" label="发现时间"><DatePicker style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="title" label="偏差标题" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="desc" label="偏差描述" rules={[{ required: true }]}>
                <TextArea rows={3} placeholder="详细描述偏差情况、数据、现象等" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

/** CAPA管理 Tab */
const CapaTab: React.FC<{ headers: any }> = ({ headers }) => {
  const capaDemo = [
    { id: 1, capa_code: 'CAPA-2026060001', title: '压片机冲头更换计划', type: '纠正措施', source: 'DEV-2026060002', status: 'IN_PROGRESS', priority: '高', due_date: '2026-06-30', owner: '设备部-刘工', progress: 60 },
    { id: 2, capa_code: 'CAPA-2026060002', title: '称量操作SOP修订', type: '预防措施', source: 'DEV-2026060001', status: 'COMPLETED', priority: '中', due_date: '2026-06-15', owner: '质量部-张质检', progress: 100 },
    { id: 3, capa_code: 'CAPA-2026060003', title: '灭菌系统校准验证', type: '纠正措施', source: 'DEV-2026060004', status: 'PENDING', priority: '紧急', due_date: '2026-06-20', owner: '工程部-王工', progress: 10 },
  ];

  const priorityColor: Record<string, string> = { '紧急': 'red', '高': 'orange', '中': 'blue', '低': 'default' };
  const statusTag: Record<string, React.ReactNode> = {
    'PENDING': <Tag color="default">待启动</Tag>,
    'IN_PROGRESS': <Tag color="processing"><SyncOutlined spin />进行中</Tag>,
    'COMPLETED': <Tag color="success"><CheckCircleOutlined />已完成</Tag>,
    'OVERDUE': <Tag color="error">已逾期</Tag>,
  };

  return (
    <div>
      <Alert message="CAPA（纠正和预防措施）：针对偏差和不合格品制定整改措施，确保问题不再发生。" type="info" showIcon style={{ marginBottom: 12 }} />
      <Table
        size="small"
        rowKey="id"
        dataSource={capaDemo}
        columns={[
          { title: 'CAPA编号', dataIndex: 'capa_code', width: 160 },
          { title: '措施标题', dataIndex: 'title', width: 200 },
          { title: '来源偏差', dataIndex: 'source', width: 140 },
          { title: '措施类型', dataIndex: 'type', width: 100 },
          { title: '优先级', dataIndex: 'priority', width: 80, render: (v: string) => <Tag color={priorityColor[v] || 'default'}>{v}</Tag> },
          { title: '状态', dataIndex: 'status', width: 110, render: (v: string) => statusTag[v] || <Tag>{v}</Tag> },
          { title: '完成进度', dataIndex: 'progress', width: 140, render: (v: number) => <Progress percent={v} size="small" status={v === 100 ? 'success' : 'active'} /> },
          { title: '责任人', dataIndex: 'owner', width: 120 },
          { title: '截止日期', dataIndex: 'due_date', width: 110 },
          { title: '操作', width: 100, render: () => <Button size="small" type="link">详情</Button> }
        ]}
      />
    </div>
  );
};

/** 卫生管理记录 Tab */
const HygieneTab: React.FC<{ headers: any }> = ({ headers }) => {
  const hygieneDemo = [
    { id: 1, record_no: 'HYG-20260611-001', workshop: '固体车间', area: '称量间', record_date: '2026-06-11', shift: '白班', operator: '李操作', items: ['设备表面清洁', '地面清洁', '更衣室清洁', '空气消毒'], result: '合格', temp: 22.3, humidity: 48 },
    { id: 2, record_no: 'HYG-20260611-002', workshop: '固体车间', area: '压片间', record_date: '2026-06-11', shift: '白班', operator: '王芳', items: ['压片机清洁消毒', '模具清洗', '地面清洁'], result: '合格', temp: 23.1, humidity: 45 },
    { id: 3, record_no: 'HYG-20260610-001', workshop: '软胶囊车间', area: '灌装间', record_date: '2026-06-10', shift: '夜班', operator: '陈班长', items: ['软胶囊机清洁', '管道消毒', '操作台清洁'], result: '合格', temp: 21.8, humidity: 52 },
    { id: 4, record_no: 'HYG-20260610-002', workshop: '溧水液体车间', area: '灌装间', record_date: '2026-06-10', shift: '白班', operator: '刘操作', items: ['灌装机清洁', '灭菌锅清洁', '地面消毒'], result: '待复查', temp: 24.5, humidity: 58 },
  ];

  return (
    <div>
      <Alert message="卫生管理要求：每班生产前后必须完成清洁记录，GMP重点区域需记录温湿度。不合格需立即上报并整改。" type="info" showIcon style={{ marginBottom: 12 }} />
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />}>新增卫生记录</Button>
      </div>
      <Table
        size="small"
        rowKey="id"
        dataSource={hygieneDemo}
        columns={[
          { title: '记录编号', dataIndex: 'record_no', width: 170 },
          { title: '车间', dataIndex: 'workshop', width: 120 },
          { title: '区域', dataIndex: 'area', width: 100 },
          { title: '记录日期', dataIndex: 'record_date', width: 110 },
          { title: '班次', dataIndex: 'shift', width: 70 },
          { title: '操作人', dataIndex: 'operator', width: 90 },
          { title: '温度(°C)', dataIndex: 'temp', width: 90 },
          { title: '湿度(%)', dataIndex: 'humidity', width: 90 },
          {
            title: '清洁结果', dataIndex: 'result', width: 100,
            render: (v: string) => <Tag color={v === '合格' ? 'success' : v === '待复查' ? 'warning' : 'error'}>{v}</Tag>
          },
          {
            title: '清洁项目', dataIndex: 'items', width: 220,
            render: (v: string[]) => v.map((item, i) => <Tag key={i}>{item}</Tag>)
          },
          { title: '操作', width: 80, render: () => <Button size="small" type="link">查看</Button> }
        ]}
      />
    </div>
  );
};

/** 不合格品处置 Tab */
const NcTab: React.FC<{ headers: any }> = ({ headers }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const ncDemo = [
    { id: 1, nc_code: 'NC-2026060001', material_name: '天美健钙咀嚼片', batch_no: 'BN-20260601001', nc_type: '压片硬度不足', qty: 500, unit: '瓶', cause: '设备原因', disposition: '返工', status: 'CLOSED', qa: '张质检', create_time: '2026-06-03' },
    { id: 2, nc_code: 'NC-2026060002', material_name: '软胶囊原料', batch_no: 'LOT-M020101-260601', nc_type: '外观异常', qty: 5000, unit: 'g', cause: '物料原因', disposition: '退货', status: 'OPEN', qa: '李质检', create_time: '2026-06-05' },
  ];

  useEffect(() => { setData(ncDemo); }, []);

  return (
    <Table
      size="small"
      rowKey="id"
      dataSource={data}
      loading={loading}
      columns={[
        { title: '不合格品单号', dataIndex: 'nc_code', width: 160 },
        { title: '物料/产品名称', dataIndex: 'material_name', width: 180 },
        { title: '批号', dataIndex: 'batch_no', width: 150 },
        { title: '不合格类型', dataIndex: 'nc_type', width: 130 },
        { title: '数量', dataIndex: 'qty', width: 80, render: (v: any, r: any) => `${v} ${r.unit}` },
        { title: '原因分类', dataIndex: 'cause', width: 100 },
        { title: '处置方式', dataIndex: 'disposition', width: 100, render: (v: string) => <Tag color={v === '返工' ? 'blue' : v === '退货' ? 'orange' : 'red'}>{v}</Tag> },
        { title: 'QA签名', dataIndex: 'qa', width: 90 },
        { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={v === 'CLOSED' ? 'success' : 'warning'}>{v === 'CLOSED' ? '已处置' : '待处置'}</Tag> },
        { title: '登记时间', dataIndex: 'create_time', width: 110 },
        { title: '操作', width: 80, render: () => <Button size="small" type="link">查看</Button> }
      ]}
    />
  );
};

export default GmpPage;
