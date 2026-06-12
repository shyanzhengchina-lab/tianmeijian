/**
 * 插单管理页面 — 天美健MES
 * PRD M01: 计划管理 / 插单规则
 * 功能：
 *   - P0-P5优先级体系（P0=紧急插单、P5=普通计划）
 *   - 插单申请提交、QA/生管审批工作流
 *   - 插单对现有排程影响分析
 *   - 电商爆款/渠道紧急订单处理
 */
import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker,
  Space, Alert, Badge, Row, Col, Statistic, Descriptions, Steps,
  InputNumber, message, Tooltip, Divider, Timeline,
} from 'antd';
import {
  ThunderboltOutlined, PlusOutlined, CheckCircleOutlined,
  CloseCircleOutlined, EyeOutlined, SendOutlined, WarningOutlined,
  ClockCircleOutlined, FileTextOutlined, EditOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

// ─── API instance ─────────────────────────────────────────────────────
const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('mes_token') || localStorage.getItem('auth_token') || '';
  if (t) cfg.headers!['Authorization'] = `Bearer ${t}`;
  return cfg;
});

// ─── Priority Types ───────────────────────────────────────────────────
type UrgentPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
type UrgentStatus   = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'PRODUCING' | 'DONE';

const PRIORITY_CONFIG: Record<UrgentPriority, {
  label: string; color: string; bg: string;
  sla: string; desc: string; autoApprove: boolean;
}> = {
  P0: { label: 'P0-紧急',  color: '#ff4d4f', bg: '#fff2f0', sla: '4小时内排程', desc: '产线停工/客户停产/法规批件紧急 — 立即处理，越级报批', autoApprove: false },
  P1: { label: 'P1-高优',  color: '#fa541c', bg: '#fff2e8', sla: '8小时内排程', desc: '电商爆款缺货/头部KA客户紧急补货',                       autoApprove: false },
  P2: { label: 'P2-加急',  color: '#fa8c16', bg: '#fffbe6', sla: '24小时内排程', desc: '促销前备货/出口订单',                                   autoApprove: false },
  P3: { label: 'P3-优先',  color: '#faad14', bg: '#fffbe6', sla: '48小时内排程', desc: '重要客户插单，不影响其他在产工单',                        autoApprove: false },
  P4: { label: 'P4-普通',  color: '#1677ff', bg: '#eff6ff', sla: '72小时内排程', desc: '常规加急订单，需调整原排程',                              autoApprove: true  },
  P5: { label: 'P5-计划',  color: '#52c41a', bg: '#f6ffed', sla: '按正常计划',  desc: '正常计划内订单（参考基准）',                               autoApprove: true  },
};

const STATUS_LABEL: Record<UrgentStatus, string> = {
  PENDING: '待审批', REVIEWING: '审批中', APPROVED: '已批准', REJECTED: '已拒绝', PRODUCING: '生产中', DONE: '已完成',
};
const STATUS_COLOR: Record<UrgentStatus, 'default' | 'processing' | 'success' | 'error' | 'warning'> = {
  PENDING: 'default', REVIEWING: 'processing', APPROVED: 'success',
  REJECTED: 'error', PRODUCING: 'processing', DONE: 'success',
};

// ─── Demo data ─────────────────────────────────────────────────────────
const demoOrders = [
  {
    id: 1, order_no: 'UO-2026060001', priority: 'P1' as UrgentPriority,
    product_name: '天美健钙咀嚼片（60粒/瓶）', qty: 5000, unit: '瓶',
    customer: '天猫旗舰店', channel: '电商',
    required_date: '2026-06-15', apply_date: '2026-06-05',
    applicant: '销售-王经理', reason: '618大促爆款缺货，客服已超200人催货',
    status: 'APPROVED' as UrgentStatus,
    impact: '需推迟WO-20260603005（普通订单）2天',
    approver: '生管-赵总', approve_time: '2026-06-05 14:30', approve_remark: '已协调，批准',
    wo_code: 'WO-20260605001',
  },
  {
    id: 2, order_no: 'UO-2026060002', priority: 'P0' as UrgentPriority,
    product_name: '天美健维生素C软糖（30粒/袋）', qty: 2000, unit: '袋',
    customer: '连锁药店全国急单', channel: '线下KA',
    required_date: '2026-06-08', apply_date: '2026-06-06',
    applicant: '销售-李主任', reason: '药监局GMP现场审计来临，需补交验证批次',
    status: 'REVIEWING' as UrgentStatus,
    impact: '占用灌装线4小时，当前无在产工单冲突',
    approver: '', approve_time: '', approve_remark: '',
    wo_code: '',
  },
  {
    id: 3, order_no: 'UO-2026060003', priority: 'P2' as UrgentPriority,
    product_name: '天美健褪黑素睡眠软糖（60粒）', qty: 8000, unit: '粒',
    customer: '抖音直播间', channel: '直播电商',
    required_date: '2026-06-20', apply_date: '2026-06-07',
    applicant: '直播运营-陈小姐', reason: '头部主播直播日期确定，预备库存',
    status: 'PENDING' as UrgentStatus,
    impact: '需新开工单，已有原材料备料',
    approver: '', approve_time: '', approve_remark: '',
    wo_code: '',
  },
  {
    id: 4, order_no: 'UO-2026060004', priority: 'P3' as UrgentPriority,
    product_name: '天美健VC锌片（100片/瓶）', qty: 3000, unit: '瓶',
    customer: '华润万家连锁', channel: '线下KA',
    required_date: '2026-06-25', apply_date: '2026-06-06',
    applicant: '渠道-张BD', reason: '节假日门店促销提前备货',
    status: 'APPROVED' as UrgentStatus,
    impact: '不影响现有排程，利用空余产能',
    approver: '生管-赵总', approve_time: '2026-06-06 09:15', approve_remark: '批准',
    wo_code: 'WO-20260607002',
  },
  {
    id: 5, order_no: 'UO-2026060005', priority: 'P1' as UrgentPriority,
    product_name: '天美健鱼油Omega-3（60粒/瓶）', qty: 1000, unit: '瓶',
    customer: '京东自营旗舰店', channel: '电商',
    required_date: '2026-06-10', apply_date: '2026-06-07',
    applicant: '电商运营-周总监', reason: 'PLUS会员日活动，库存见底',
    status: 'REJECTED' as UrgentStatus,
    impact: '当前原材料不足，无法在截止日前完成',
    approver: '生管-赵总', approve_time: '2026-06-07 11:00', approve_remark: '原材料缺货，需10天到货，无法满足日期，已告知客户',
    wo_code: '',
  },
];

// ─── Main Component ───────────────────────────────────────────────────
const UrgentOrderPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>(demoOrders);
  const [showAdd, setShowAdd] = useState(false);
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [filterPri, setFilterPri] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  // Load from API
  useEffect(() => {
    API.get('/production-orders/urgent').then(r => {
      const list = r.data?.data?.list ?? r.data?.data ?? [];
      if (list.length > 0) setOrders(list);
    }).catch(() => {});
  }, []);

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const pri = values.priority as UrgentPriority;
      const cfg = PRIORITY_CONFIG[pri];
      const newOrder = {
        id: orders.length + 1,
        order_no: `UO-${dayjs().format('YYYYMMDD')}${String(orders.length + 1).padStart(3, '0')}`,
        priority: pri,
        product_name: values.product_name,
        qty: values.qty, unit: values.unit ?? '件',
        customer: values.customer ?? '',
        channel: values.channel ?? '其他',
        required_date: dayjs(values.required_date).format('YYYY-MM-DD'),
        apply_date: dayjs().format('YYYY-MM-DD'),
        applicant: values.applicant ?? '当前用户',
        reason: values.reason,
        status: (cfg.autoApprove ? 'APPROVED' : 'PENDING') as UrgentStatus,
        impact: values.impact ?? '待生管评估',
        approver: cfg.autoApprove ? '系统自动批准' : '',
        approve_time: cfg.autoApprove ? dayjs().format('YYYY-MM-DD HH:mm') : '',
        approve_remark: cfg.autoApprove ? `${pri}优先级，自动批准` : '',
        wo_code: '',
      };
      setOrders(prev => [newOrder, ...prev]);
      message.success(
        cfg.autoApprove
          ? `插单已自动批准（${pri}优先级），请生管安排排程`
          : `插单申请已提交，等待生管审批（SLA: ${cfg.sla}）`
      );
      setShowAdd(false);
      form.resetFields();
    });
  };

  const handleReview = (approved: boolean) => {
    reviewForm.validateFields().then(values => {
      setOrders(prev => prev.map(o =>
        o.id === reviewOrder.id
          ? {
              ...o,
              status: (approved ? 'APPROVED' : 'REJECTED') as UrgentStatus,
              approver: values.approver ?? 'QA负责人',
              approve_time: dayjs().format('YYYY-MM-DD HH:mm'),
              approve_remark: values.remark ?? '',
            }
          : o
      ));
      message.success(approved ? '已批准插单，请安排工单排程' : '已驳回插单申请');
      setReviewOrder(null);
      reviewForm.resetFields();
    });
  };

  const filtered = orders.filter(o =>
    (filterPri === 'ALL' || o.priority === filterPri) &&
    (filterStatus === 'ALL' || o.status === filterStatus)
  );

  const kpiData = {
    total:    orders.length,
    pending:  orders.filter(o => o.status === 'PENDING' || o.status === 'REVIEWING').length,
    p0p1:     orders.filter(o => o.priority === 'P0' || o.priority === 'P1').length,
    approved: orders.filter(o => o.status === 'APPROVED' || o.status === 'PRODUCING').length,
    rejected: orders.filter(o => o.status === 'REJECTED').length,
  };

  return (
    <div style={{ padding: 16 }}>
      <Card bordered={false}
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#fa8c16' }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>插单管理</span>
            <Tag color="orange">P0-P5优先级体系</Tag>
          </Space>
        }
      >
        {/* KPI行 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {[
            { label: '本月插单总数', value: kpiData.total,    color: '#1677ff' },
            { label: '待审批',       value: kpiData.pending,  color: '#fa8c16' },
            { label: 'P0/P1紧急单', value: kpiData.p0p1,     color: '#ff4d4f' },
            { label: '已批准',       value: kpiData.approved, color: '#52c41a' },
            { label: '已驳回',       value: kpiData.rejected, color: '#8c8c8c' },
          ].map((k, i) => (
            <Col span={4} key={i}>
              <Card size="small" bordered style={{ borderTop: `3px solid ${k.color}` }}>
                <Statistic title={k.label} value={k.value} valueStyle={{ color: k.color }} />
              </Card>
            </Col>
          ))}
          <Col span={4}>
            <Alert
              message={<span style={{ fontSize: 11 }}>P0/P1优先级插单须在<strong>4-8小时</strong>内完成排程</span>}
              type="error" style={{ height: '100%', display: 'flex', alignItems: 'center' }}
            />
          </Col>
        </Row>

        {/* 优先级说明 */}
        <Alert
          message={
            <div>
              <span style={{ fontWeight: 600 }}>插单优先级规则：</span>
              <Space size={8} wrap style={{ marginTop: 4 }}>
                {(Object.entries(PRIORITY_CONFIG) as [UrgentPriority, any][]).map(([p, cfg]) => (
                  <Tooltip key={p} title={`${cfg.sla} | ${cfg.desc}`}>
                    <Tag color={cfg.color} style={{ cursor: 'default' }}>{cfg.label}</Tag>
                  </Tooltip>
                ))}
              </Space>
            </div>
          }
          type="info" style={{ marginBottom: 16 }}
        />

        {/* 过滤器 + 操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Space>
            <Select value={filterPri} onChange={setFilterPri} style={{ width: 130 }} size="small">
              <Option value="ALL">全部优先级</Option>
              {(Object.keys(PRIORITY_CONFIG) as UrgentPriority[]).map(p => (
                <Option key={p} value={p}><Tag color={PRIORITY_CONFIG[p].color}>{PRIORITY_CONFIG[p].label}</Tag></Option>
              ))}
            </Select>
            <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 120 }} size="small">
              <Option value="ALL">全部状态</Option>
              {(Object.keys(STATUS_LABEL) as UrgentStatus[]).map(s => (
                <Option key={s} value={s}>{STATUS_LABEL[s]}</Option>
              ))}
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>
            提交插单申请
          </Button>
        </div>

        {/* 主表格 */}
        <Table
          size="small"
          rowKey="id"
          dataSource={filtered}
          rowClassName={(r: any) => r.priority === 'P0' ? 'ant-table-row-urgent-p0' : ''}
          columns={[
            {
              title: '申请单号', dataIndex: 'order_no', width: 150,
              render: (v: string) => <code style={{ fontSize: 11 }}>{v}</code>,
            },
            {
              title: '优先级', dataIndex: 'priority', width: 110,
              render: (v: UrgentPriority) => {
                const cfg = PRIORITY_CONFIG[v];
                return (
                  <Tooltip title={cfg.desc}>
                    <Tag color={cfg.color} style={{ fontWeight: 700 }}>{cfg.label}</Tag>
                  </Tooltip>
                );
              },
            },
            { title: '产品名称', dataIndex: 'product_name', width: 200 },
            {
              title: '数量', dataIndex: 'qty', width: 90,
              render: (v: number, r: any) => `${v.toLocaleString()} ${r.unit}`,
            },
            { title: '客户/渠道', dataIndex: 'customer', width: 130 },
            {
              title: '渠道类型', dataIndex: 'channel', width: 90,
              render: (v: string) => {
                const color: Record<string, string> = { '电商': 'blue', '线下KA': 'green', '直播电商': 'purple', '出口': 'red' };
                return <Tag color={color[v] ?? 'default'}>{v}</Tag>;
              },
            },
            {
              title: '要求到货日', dataIndex: 'required_date', width: 110,
              render: (v: string) => {
                const urgent = dayjs(v).diff(dayjs(), 'day') <= 3;
                return <span style={{ color: urgent ? '#ff4d4f' : undefined, fontWeight: urgent ? 700 : undefined }}>{v}</span>;
              },
            },
            {
              title: '状态', dataIndex: 'status', width: 100,
              render: (v: UrgentStatus) => <Badge status={STATUS_COLOR[v]} text={STATUS_LABEL[v]} />,
            },
            { title: '申请人', dataIndex: 'applicant', width: 100 },
            { title: '关联工单', dataIndex: 'wo_code', width: 120, render: (v: string) => v ? <code style={{ fontSize: 11 }}>{v}</code> : '—' },
            {
              title: '操作', width: 150, fixed: 'right',
              render: (_: any, rec: any) => (
                <Space size={4}>
                  <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => setViewOrder(rec)}>详情</Button>
                  {(rec.status === 'PENDING' || rec.status === 'REVIEWING') && (
                    <Button size="small" type="link" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }} onClick={() => setReviewOrder(rec)}>
                      审批
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
          expandable={{
            expandedRowRender: (record: any) => (
              <div style={{ padding: '8px 16px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Descriptions size="small" column={1} bordered>
                      <Descriptions.Item label="插单原因">{record.reason}</Descriptions.Item>
                      <Descriptions.Item label="影响分析">{record.impact}</Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col span={12}>
                    <Descriptions size="small" column={1} bordered>
                      <Descriptions.Item label="审批人">{record.approver || '—'}</Descriptions.Item>
                      <Descriptions.Item label="审批时间">{record.approve_time || '—'}</Descriptions.Item>
                      <Descriptions.Item label="审批意见">{record.approve_remark || '—'}</Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>
              </div>
            ),
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* 新建插单 Modal */}
      <Modal
        title={<><ThunderboltOutlined style={{ color: '#fa8c16', marginRight: 8 }} />提交插单申请</>}
        open={showAdd}
        onCancel={() => { setShowAdd(false); form.resetFields(); }}
        onOk={handleSubmit}
        width={720}
      >
        <Alert
          message="提示：请根据客户紧急程度选择正确的优先级。错误评级可能导致正常生产计划被不当打乱。P0/P1级将触发紧急排程通知。"
          type="warning" showIcon style={{ marginBottom: 12 }}
        />
        <Form form={form} layout="vertical" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]} extra="请参考优先级说明谨慎选择">
                <Select>
                  {(Object.entries(PRIORITY_CONFIG) as [UrgentPriority, any][]).map(([p, cfg]) => (
                    <Option key={p} value={p}>
                      <Tag color={cfg.color}>{cfg.label}</Tag> — {cfg.sla}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="channel" label="渠道类型">
                <Select>
                  {['电商','线下KA','直播电商','出口','其他'].map(v => <Option key={v} value={v}>{v}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="product_name" label="产品名称" rules={[{ required: true }]}>
                <Input placeholder="如：天美健钙咀嚼片（60粒/瓶）" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="qty" label="需求数量" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} placeholder="数量" />
              </Form.Item>
            </Col>
            <Col span={4}><Form.Item name="unit" label="单位"><Input placeholder="瓶/箱" /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="required_date" label="要求到货日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} disabledDate={d => d && d.isBefore(dayjs(), 'day')} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="customer" label="客户/平台" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="applicant" label="申请人"><Input placeholder="姓名/工号" /></Form.Item></Col>
            <Col span={24}>
              <Form.Item name="reason" label="插单原因（必填）" rules={[{ required: true }]}>
                <TextArea rows={3} placeholder="请详细描述插单原因，包括客户背景、紧急程度等，供审批人评估" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="impact" label="预估影响分析">
                <TextArea rows={2} placeholder="如：可能影响的在产工单，原材料是否充足，产能是否有空余等" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 审批 Modal */}
      <Modal
        title={`插单审批 — ${reviewOrder?.order_no}`}
        open={!!reviewOrder}
        onCancel={() => { setReviewOrder(null); reviewForm.resetFields(); }}
        footer={
          <Space>
            <Button onClick={() => { setReviewOrder(null); reviewForm.resetFields(); }}>取消</Button>
            <Button danger icon={<CloseCircleOutlined />} onClick={() => handleReview(false)}>驳回</Button>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleReview(true)}>批准</Button>
          </Space>
        }
        width={600}
      >
        {reviewOrder && (
          <div>
            <Descriptions size="small" bordered column={2} style={{ marginBottom: 12 }}>
              <Descriptions.Item label="申请单号">{reviewOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={PRIORITY_CONFIG[reviewOrder.priority as UrgentPriority]?.color}>
                  {PRIORITY_CONFIG[reviewOrder.priority as UrgentPriority]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="产品">{reviewOrder.product_name}</Descriptions.Item>
              <Descriptions.Item label="数量">{reviewOrder.qty} {reviewOrder.unit}</Descriptions.Item>
              <Descriptions.Item label="客户">{reviewOrder.customer}</Descriptions.Item>
              <Descriptions.Item label="要求到货">{reviewOrder.required_date}</Descriptions.Item>
              <Descriptions.Item label="插单原因" span={2}>{reviewOrder.reason}</Descriptions.Item>
              <Descriptions.Item label="影响分析" span={2}>{reviewOrder.impact}</Descriptions.Item>
            </Descriptions>
            <Form form={reviewForm} layout="vertical" size="small">
              <Form.Item name="approver" label="审批人" rules={[{ required: true }]}><Input placeholder="姓名/工号" /></Form.Item>
              <Form.Item name="remark" label="审批意见"><TextArea rows={2} placeholder="请说明批准或驳回理由" /></Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* 详情查看 Modal */}
      <Modal
        title={`插单详情 — ${viewOrder?.order_no}`}
        open={!!viewOrder}
        onCancel={() => setViewOrder(null)}
        footer={<Button onClick={() => setViewOrder(null)}>关闭</Button>}
        width={680}
      >
        {viewOrder && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Tag color={PRIORITY_CONFIG[viewOrder.priority as UrgentPriority]?.color} style={{ fontSize: 14, padding: '2px 12px' }}>
                {PRIORITY_CONFIG[viewOrder.priority as UrgentPriority]?.label}
              </Tag>
              <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
                SLA要求：{PRIORITY_CONFIG[viewOrder.priority as UrgentPriority]?.sla}
              </span>
            </div>
            <Steps
              size="small"
              current={viewOrder.status === 'PENDING' ? 0 : viewOrder.status === 'REVIEWING' ? 1 : viewOrder.status === 'APPROVED' || viewOrder.status === 'REJECTED' ? 2 : viewOrder.status === 'PRODUCING' ? 3 : 4}
              style={{ marginBottom: 16 }}
              items={['申请提交','生管审批','批准/驳回','工单排程','完成交付'].map(s => ({ title: s }))}
            />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="产品名称" span={2}>{viewOrder.product_name}</Descriptions.Item>
              <Descriptions.Item label="数量">{viewOrder.qty} {viewOrder.unit}</Descriptions.Item>
              <Descriptions.Item label="要求到货">{viewOrder.required_date}</Descriptions.Item>
              <Descriptions.Item label="客户">{viewOrder.customer}</Descriptions.Item>
              <Descriptions.Item label="渠道">{viewOrder.channel}</Descriptions.Item>
              <Descriptions.Item label="申请原因" span={2}>{viewOrder.reason}</Descriptions.Item>
              <Descriptions.Item label="影响分析" span={2}>{viewOrder.impact}</Descriptions.Item>
              <Descriptions.Item label="审批人">{viewOrder.approver || '—'}</Descriptions.Item>
              <Descriptions.Item label="审批时间">{viewOrder.approve_time || '—'}</Descriptions.Item>
              <Descriptions.Item label="审批意见" span={2}>{viewOrder.approve_remark || '—'}</Descriptions.Item>
              {viewOrder.wo_code && (
                <Descriptions.Item label="关联工单" span={2}>
                  <code>{viewOrder.wo_code}</code>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UrgentOrderPage;
