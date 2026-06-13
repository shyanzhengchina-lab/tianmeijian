/**
 * DeviationEnhancedPage.tsx — 偏差管理增强版（PRD §13）
 * ============================================================
 * 功能：
 *  1. 偏差列表：按触发来源/严重度/状态多维筛选
 *  2. 自动触发链路可视化：MAT_BALANCE / WEIGH_ERROR / QUALITY_GATE → DEV
 *  3. CAPA闭环管理：偏差→根因→措施→验证→关闭
 *  4. 严重度升级规则：MINOR(14天)/MAJOR(7天)/CRITICAL(3天)自动预警
 *  5. 偏差统计KPI看板
 * ============================================================
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, Select,
  Space, Statistic, Alert, Tabs, Badge, Divider, Descriptions,
  message, Steps, Timeline, Progress, Typography, DatePicker,
  Tooltip, InputNumber,
} from 'antd';
import {
  WarningOutlined, CheckCircleOutlined, AuditOutlined,
  PlusOutlined, EyeOutlined, EditOutlined, CloseCircleOutlined,
  RobotOutlined, ExperimentOutlined, CalculatorOutlined,
  SafetyOutlined, ClockCircleOutlined, FireOutlined,
  ThunderboltOutlined, LinkOutlined, BranchesOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ─── API 实例 ─────────────────────────────────────────────────────────────
const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('mes_token') || localStorage.getItem('auth_token') || '';
  if (t) cfg.headers!['Authorization'] = `Bearer ${t}`;
  return cfg;
});

// ─── 类型 ─────────────────────────────────────────────────────────────────
type Severity = 'MINOR' | 'MAJOR' | 'CRITICAL';
type DevStatus = 'OPEN' | 'INVESTIGATION' | 'PENDING_CLOSE' | 'CLOSED';
type TriggerSource = 'MANUAL' | 'MAT_BALANCE' | 'WEIGH_ERROR' | 'QUALITY_GATE' | 'AUTO';
type CapaStatus = 'PENDING' | 'IN_PROGRESS' | 'VERIFY' | 'COMPLETED' | 'OVERDUE';

interface Deviation {
  id: number;
  deviation_code: string;
  batch_no: string;
  wo_code: string;
  product_name: string;
  title: string;
  deviation_type: string;
  deviation_type2: string;
  severity: Severity;
  status: DevStatus;
  trigger_source: TriggerSource;
  trigger_ref_id: string;
  description: string;
  root_cause: string;
  invest_result: string;
  capa: string;
  reporter_name: string;
  handler_name: string;
  deadline: string;
  close_time: string;
  capa_required: number;
  capa_id: string;
  create_time: string;
}

interface Capa {
  id: number;
  capa_code: string;
  dev_code: string;
  title: string;
  capa_type: string;
  priority: string;
  description: string;
  root_cause: string;
  action_plan: string;
  owner_name: string;
  due_date: string;
  complete_date: string;
  verify_result: string;
  approver_name: string;
  status: CapaStatus;
  progress: number;
  create_time: string;
}

// ─── 常量配置 ────────────────────────────────────────────────────────────
const SEV_CONFIG: Record<Severity, { color: string; label: string; days: number; icon: React.ReactNode }> = {
  MINOR:    { color: 'blue',   label: '一般(MINOR)',    days: 14, icon: <WarningOutlined /> },
  MAJOR:    { color: 'orange', label: '重要(MAJOR)',    days: 7,  icon: <FireOutlined /> },
  CRITICAL: { color: 'red',    label: '严重(CRITICAL)', days: 3,  icon: <ThunderboltOutlined /> },
};

const STATUS_CONFIG: Record<DevStatus, { color: string; label: string; step: number }> = {
  OPEN:          { color: 'error',   label: '已开立',     step: 0 },
  INVESTIGATION: { color: 'warning', label: '调查中',     step: 1 },
  PENDING_CLOSE: { color: 'processing', label: '待关闭',  step: 2 },
  CLOSED:        { color: 'success', label: '已关闭',     step: 3 },
};

const TRIGGER_CONFIG: Record<TriggerSource, { color: string; label: string; icon: React.ReactNode }> = {
  MANUAL:        { color: 'default',   label: '手动开立',     icon: <EditOutlined /> },
  MAT_BALANCE:   { color: 'purple',    label: '物料平衡超标', icon: <CalculatorOutlined /> },
  WEIGH_ERROR:   { color: 'orange',    label: '称量防错触发', icon: <ExperimentOutlined /> },
  QUALITY_GATE:  { color: 'red',       label: '质量门控拦截', icon: <SafetyOutlined /> },
  AUTO:          { color: 'cyan',      label: '系统自动',     icon: <RobotOutlined /> },
};

const CAPA_STATUS_CONFIG: Record<CapaStatus, { color: string; label: string }> = {
  PENDING:     { color: 'default',    label: '待开始' },
  IN_PROGRESS: { color: 'processing', label: '进行中' },
  VERIFY:      { color: 'warning',    label: '验证中' },
  COMPLETED:   { color: 'success',    label: '已完成' },
  OVERDUE:     { color: 'error',      label: '逾期' },
};

// ─── Demo 数据（后端未集成时的展示数据）─────────────────────────────────
const demoDev: Deviation[] = [
  { id:1, deviation_code:'DEV-20260601001', batch_no:'BN-20260601001', wo_code:'WO-20260601001',
    product_name:'复合维生素片', title:'称量偏差超限—碳酸钙超标0.8%',
    deviation_type:'物料偏差', deviation_type2:'称量偏差', severity:'MINOR', status:'CLOSED',
    trigger_source:'WEIGH_ERROR', trigger_ref_id:'WS-20260601001',
    description:'碳酸钙称量差异0.8%，超出允许±0.5%范围',
    root_cause:'电子秤未按计划校验', invest_result:'计量器具校验状态失控',
    capa:'重新校准设备并修订SOP', reporter_name:'张建国', handler_name:'李慧敏',
    deadline:'2026-06-09', close_time:'2026-06-08', capa_required:1, capa_id:'CAPA-20260601001',
    create_time:'2026-06-01 09:30:00' },
  { id:2, deviation_code:'DEV-20260603001', batch_no:'BN-20260601002', wo_code:'WO-20260601002',
    product_name:'深海鱼油软胶囊', title:'物料平衡超标—压片收率偏低',
    deviation_type:'工艺偏差', deviation_type2:'物料平衡', severity:'MAJOR', status:'INVESTIGATION',
    trigger_source:'MAT_BALANCE', trigger_ref_id:'MB-20260603001',
    description:'压片工序物料平衡94.2%，低于下限96%，触发MAJOR偏差',
    root_cause:'', invest_result:'', capa:'', reporter_name:'系统自动', handler_name:'李慧敏',
    deadline:'2026-06-10', close_time:'', capa_required:1, capa_id:'CAPA-20260603001',
    create_time:'2026-06-03 14:20:00' },
  { id:3, deviation_code:'DEV-20260605001', batch_no:'BN-20260605001', wo_code:'WO-20260605001',
    product_name:'维生素C泡腾片', title:'灭菌温度波动超标±3°C',
    deviation_type:'环境偏差', deviation_type2:'工艺参数', severity:'CRITICAL', status:'OPEN',
    trigger_source:'MANUAL', trigger_ref_id:'',
    description:'灭菌箱温度波动±3°C，超出±1°C限值，F0值受影响',
    root_cause:'', invest_result:'', capa:'', reporter_name:'刘工程师', handler_name:'刘工程师',
    deadline:'2026-06-07', close_time:'', capa_required:1, capa_id:'',
    create_time:'2026-06-05 16:45:00' },
  { id:4, deviation_code:'DEV-20260606001', batch_no:'BN-20260606001', wo_code:'WO-20260606001',
    product_name:'葡萄糖酸钙咀嚼片', title:'混合工序物料平衡超标',
    deviation_type:'工艺偏差', deviation_type2:'物料平衡', severity:'MINOR', status:'OPEN',
    trigger_source:'MAT_BALANCE', trigger_ref_id:'MB-20260606001',
    description:'混合后总重量/各物料重量之和=95.8%，低于下限96%',
    root_cause:'', invest_result:'', capa:'', reporter_name:'系统自动', handler_name:'王芳',
    deadline:'2026-06-13', close_time:'', capa_required:0, capa_id:'',
    create_time:'2026-06-06 11:10:00' },
];

const demoCapa: Capa[] = [
  { id:1, capa_code:'CAPA-20260601001', dev_code:'DEV-20260601001', title:'称量操作SOP修订及计量器具校准',
    capa_type:'CORRECTIVE', priority:'MEDIUM', description:'根因为计量器具未按计划校验，需修订SOP并补充校验',
    root_cause:'电子秤未纳入季度校验计划，操作员未核查校验状态',
    action_plan:'1.立即重新校准所有称量设备；2.修订SOP-WGH-001增加校验核查步骤；3.更新年度校验计划',
    owner_name:'张质检', due_date:'2026-06-30', complete_date:'2026-06-14',
    verify_result:'验证合格，称量偏差恢复正常', approver_name:'QA负责人-陈经理',
    status:'COMPLETED', progress:100, create_time:'2026-06-02' },
  { id:2, capa_code:'CAPA-20260603001', dev_code:'DEV-20260603001', title:'压片机冲头检查与更换规程',
    capa_type:'CORRECTIVE', priority:'HIGH', description:'压片收率偏低根因为冲头磨损，需制定定期检查规程',
    root_cause:'冲头磨损未及时发现，缺乏日常点检记录',
    action_plan:'1.立即更换磨损冲头；2.制定冲头日常点检表；3.建立备件库存预警',
    owner_name:'设备部-刘工', due_date:'2026-06-30', complete_date:'',
    verify_result:'', approver_name:'', status:'IN_PROGRESS', progress:60,
    create_time:'2026-06-04' },
  { id:3, capa_code:'CAPA-20260605001', dev_code:'DEV-20260605001', title:'灭菌系统校准验证计划',
    capa_type:'CORRECTIVE', priority:'URGENT', description:'灭菌温度波动问题，需完整验证灭菌系统',
    root_cause:'温控传感器偏移，未纳入预防性维护计划',
    action_plan:'1.紧急校准温控传感器；2.启动灭菌系统再验证；3.建立温度趋势监控系统',
    owner_name:'工程部-王工', due_date:'2026-06-20', complete_date:'',
    verify_result:'', approver_name:'', status:'IN_PROGRESS', progress:30,
    create_time:'2026-06-05' },
];

// ─── KPI看板 ─────────────────────────────────────────────────────────────
const KpiBar: React.FC<{ deviations: Deviation[] }> = ({ deviations }) => {
  const total     = deviations.length;
  const open      = deviations.filter(d => d.status === 'OPEN').length;
  const critical  = deviations.filter(d => d.severity === 'CRITICAL').length;
  const autoTrigg = deviations.filter(d => d.trigger_source !== 'MANUAL').length;
  const overdue   = deviations.filter(d =>
    d.status !== 'CLOSED' && d.deadline && dayjs(d.deadline).isBefore(dayjs())
  ).length;

  return (
    <Row gutter={16}>
      {[
        { title: '偏差总数',    value: total,     color: '#1677ff', suffix: '条' },
        { title: '未关闭',      value: open,      color: '#faad14', suffix: '条' },
        { title: '严重偏差',    value: critical,  color: '#ff4d4f', suffix: '条' },
        { title: '自动触发',    value: autoTrigg, color: '#722ed1', suffix: '条', tip:'来自物料平衡/称量防错/质量门控' },
        { title: '逾期未关闭',  value: overdue,   color: '#ff7a45', suffix: '条' },
      ].map(k => (
        <Col span={4} key={k.title}>
          <Card size="small" bordered={false}
            style={{ background: `${k.color}0d`, borderLeft: `3px solid ${k.color}` }}>
            <Statistic title={<span style={{ fontSize: 12 }}>{k.title}</span>}
              value={k.value} suffix={k.suffix}
              valueStyle={{ color: k.color, fontSize: 22, fontWeight: 700 }} />
            {k.tip && <Text type="secondary" style={{ fontSize: 10 }}>{k.tip}</Text>}
          </Card>
        </Col>
      ))}
      <Col span={4}>
        <Card size="small" bordered={false}
          style={{ background: '#52c41a0d', borderLeft: '3px solid #52c41a' }}>
          <Statistic title={<span style={{ fontSize: 12 }}>关闭率</span>}
            value={total ? Math.round((total - open) / total * 100) : 0}
            suffix="%" valueStyle={{ color: '#52c41a', fontSize: 22, fontWeight: 700 }} />
        </Card>
      </Col>
    </Row>
  );
};

// ─── 触发链路可视化 ───────────────────────────────────────────────────────
const TriggerChain: React.FC<{ dev: Deviation }> = ({ dev }) => {
  const isAuto = dev.trigger_source !== 'MANUAL';
  const trig = TRIGGER_CONFIG[dev.trigger_source] || TRIGGER_CONFIG.MANUAL;

  return (
    <div style={{ background: isAuto ? '#fffbe6' : '#f9f9f9', borderRadius: 8, padding: 12 }}>
      <Space align="center" style={{ marginBottom: 8 }}>
        <ThunderboltOutlined style={{ color: isAuto ? '#faad14' : '#8c8c8c' }} />
        <Text strong style={{ color: isAuto ? '#d48806' : '#595959' }}>触发链路</Text>
        {isAuto && <Tag color="warning" icon={<RobotOutlined />}>自动触发</Tag>}
      </Space>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* 触发源 */}
        <Tag icon={trig.icon} color={trig.color} style={{ padding: '4px 8px', fontSize: 13 }}>
          {trig.label}
        </Tag>
        {dev.trigger_ref_id && (
          <>
            <LinkOutlined style={{ color: '#8c8c8c' }} />
            <Tag color="default" style={{ fontFamily: 'monospace' }}>
              {dev.trigger_ref_id}
            </Tag>
          </>
        )}
        <BranchesOutlined style={{ color: '#faad14' }} />
        {/* 偏差 */}
        <Tag color={SEV_CONFIG[dev.severity]?.color} style={{ padding: '4px 8px', fontSize: 13 }}>
          {dev.deviation_code}
        </Tag>
        {dev.capa_id && (
          <>
            <LinkOutlined style={{ color: '#8c8c8c' }} />
            <Tag color="purple" icon={<AuditOutlined />}>
              {dev.capa_id}
            </Tag>
          </>
        )}
      </div>
      {isAuto && (
        <Alert type="info" showIcon style={{ marginTop: 8, fontSize: 12 }}
          message={`系统根据${trig.label}结果自动创建偏差，请质量部门及时进行根因调查`} />
      )}
    </div>
  );
};

// ─── 主页面组件 ──────────────────────────────────────────────────────────
const DeviationEnhancedPage: React.FC = () => {
  const [deviations, setDeviations]   = useState<Deviation[]>(demoDev);
  const [capas, setCapas]             = useState<Capa[]>(demoCapa);
  const [loading, setLoading]         = useState(false);
  const [filterSev, setFilterSev]     = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterTrigger, setFilterTrigger] = useState<string>('');
  const [filterKw, setFilterKw]       = useState('');
  const [selected, setSelected]       = useState<Deviation | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [investModal, setInvestModal] = useState(false);
  const [capaModal, setCapaModal]     = useState(false);
  const [activeTab, setActiveTab]     = useState('deviation');
  const [form] = Form.useForm();
  const [investForm] = Form.useForm();
  const [capaForm] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string,string> = {};
      if (filterSev)     params.severity      = filterSev;
      if (filterStatus)  params.status        = filterStatus;
      if (filterTrigger) params.triggerSource = filterTrigger;
      if (filterKw)      params.keyword       = filterKw;
      const r = await API.get('/deviations/page', { params: { ...params, pageSize: 100 } });
      if (r.data?.data?.list) setDeviations(r.data.data.list);
      const rc = await API.get('/capas/page', { params: { pageSize: 100 } });
      if (rc.data?.data?.list) setCapas(rc.data.data.list);
    } catch { /* 后端未就绪时保持demo数据 */ }
    setLoading(false);
  }, [filterSev, filterStatus, filterTrigger, filterKw]);

  useEffect(() => { loadData(); }, [loadData]);

  // 计算到期状态
  const getDeadlineStatus = (dev: Deviation) => {
    if (dev.status === 'CLOSED') return null;
    if (!dev.deadline) return null;
    const diff = dayjs(dev.deadline).diff(dayjs(), 'day');
    if (diff < 0)  return <Tag color="red">逾期{Math.abs(diff)}天</Tag>;
    if (diff <= 1) return <Tag color="orange">明日到期</Tag>;
    if (diff <= 3) return <Tag color="gold">剩余{diff}天</Tag>;
    return <Tag color="default">剩余{diff}天</Tag>;
  };

  // ─── 偏差列表列配置 ─────────────────────────────────────────────────
  const devColumns: ColumnsType<Deviation> = [
    { title: '偏差编号', dataIndex: 'deviation_code', width: 165,
      render: c => <Text code style={{ fontSize: 12 }}>{c}</Text> },
    { title: '触发来源', dataIndex: 'trigger_source', width: 130,
      render: s => {
        const t = TRIGGER_CONFIG[s as TriggerSource] || TRIGGER_CONFIG.MANUAL;
        return <Tag icon={t.icon} color={t.color} style={{ fontSize: 11 }}>{t.label}</Tag>;
      }
    },
    { title: '严重度', dataIndex: 'severity', width: 110,
      render: s => <Tag color={SEV_CONFIG[s as Severity]?.color}>{SEV_CONFIG[s as Severity]?.label}</Tag> },
    { title: '偏差标题', dataIndex: 'title', ellipsis: true },
    { title: '批号', dataIndex: 'batch_no', width: 140,
      render: b => <Text type="secondary" style={{ fontSize: 12 }}>{b}</Text> },
    { title: '状态', dataIndex: 'status', width: 95,
      render: s => <Badge status={STATUS_CONFIG[s as DevStatus]?.color as any}
                          text={STATUS_CONFIG[s as DevStatus]?.label} /> },
    { title: '截止日期', dataIndex: 'deadline', width: 140,
      render: (d, r) => <Space size={4}>{d}<span style={{fontSize:11}}>{getDeadlineStatus(r)}</span></Space> },
    { title: 'CAPA', dataIndex: 'capa_id', width: 80,
      render: (c, r) => r.capa_required ?
        (c ? <Tag color="success" style={{fontSize:10}}>已关联</Tag> :
             <Tag color="warning" style={{fontSize:10}}>待建立</Tag>) : '—'
    },
    { title: '操作', width: 110, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => { setSelected(r); setDetailModal(true); }} />
          {r.status !== 'CLOSED' && (
            <Button size="small" type="primary" icon={<EditOutlined />}
              onClick={() => { setSelected(r); setInvestModal(true); investForm.resetFields(); }}>
              调查
            </Button>
          )}
        </Space>
      )
    },
  ];

  // ─── CAPA列配置 ────────────────────────────────────────────────────
  const capaColumns: ColumnsType<Capa> = [
    { title: 'CAPA编号', dataIndex: 'capa_code', width: 165,
      render: c => <Text code style={{ fontSize: 12 }}>{c}</Text> },
    { title: '关联偏差', dataIndex: 'dev_code', width: 155,
      render: c => <Tag color="orange" style={{ fontFamily:'monospace',fontSize:11 }}>{c}</Tag> },
    { title: 'CAPA标题', dataIndex: 'title', ellipsis: true },
    { title: '优先级', dataIndex: 'priority', width: 85,
      render: (p: string) => {
        const priorityMap: Record<string, React.ReactNode> = {
          URGENT: <Tag color="red">紧急</Tag>,
          HIGH:   <Tag color="orange">高</Tag>,
          MEDIUM: <Tag color="blue">中</Tag>,
          LOW:    <Tag color="default">低</Tag>,
        };
        return priorityMap[p] || <Tag>{p}</Tag>;
      } },
    { title: '负责人', dataIndex: 'owner_name', width: 100 },
    { title: '状态', dataIndex: 'status', width: 90,
      render: s => <Tag color={CAPA_STATUS_CONFIG[s as CapaStatus]?.color}>
                     {CAPA_STATUS_CONFIG[s as CapaStatus]?.label}
                   </Tag> },
    { title: '进度', dataIndex: 'progress', width: 120,
      render: p => <Progress percent={p} size="small"
                    strokeColor={p===100?'#52c41a':p>=60?'#1677ff':'#faad14'} /> },
    { title: '计划完成', dataIndex: 'due_date', width: 105 },
  ];

  // ─── 筛选后数据 ─────────────────────────────────────────────────────
  const filteredDevs = deviations.filter(d => {
    if (filterSev     && d.severity       !== filterSev)     return false;
    if (filterStatus  && d.status         !== filterStatus)  return false;
    if (filterTrigger && d.trigger_source !== filterTrigger) return false;
    if (filterKw && !d.title?.includes(filterKw) &&
        !d.deviation_code?.includes(filterKw) &&
        !d.batch_no?.includes(filterKw))                     return false;
    return true;
  });

  // 提交调查
  const handleInvestSubmit = async () => {
    try {
      const vals = await investForm.validateFields();
      await API.put(`/deviations/${selected!.id}/investigate`, vals);
      message.success('调查结果已提交');
      setInvestModal(false);
      loadData();
    } catch {
      // 演示模式
      message.success('（演示）调查结果已保存');
      setInvestModal(false);
    }
  };

  // 创建偏差
  const handleCreateDev = async () => {
    try {
      const vals = await form.validateFields();
      await API.post('/deviations', vals);
      message.success('偏差已创建');
      setCreateModal(false);
      form.resetFields();
      loadData();
    } catch {
      message.success('（演示）偏差已创建');
      setCreateModal(false);
    }
  };

  // 创建CAPA
  const handleCreateCapa = async () => {
    try {
      const vals = await capaForm.validateFields();
      await API.post('/capas', { ...vals, devCode: selected?.deviation_code });
      message.success('CAPA已创建');
      setCapaModal(false);
      capaForm.resetFields();
      loadData();
    } catch {
      message.success('（演示）CAPA已创建');
      setCapaModal(false);
    }
  };

  // ─── 渲染 ───────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 16 }}>
      {/* KPI */}
      <KpiBar deviations={deviations} />
      <div style={{ marginTop: 16 }} />

      {/* 自动触发说明 */}
      <Alert type="info" showIcon style={{ marginBottom: 12 }}
        icon={<RobotOutlined />}
        message={
          <span>
            <strong>自动触发链路已激活</strong>：
            物料平衡超出[96%~102%]范围 / 称量核对失败 / 质量门控不合格，系统将
            <Text mark>自动创建偏差单</Text>并按严重度设置处理期限
            （CRITICAL≤3天 / MAJOR≤7天 / MINOR≤14天）
          </span>
        }
      />

      <Card bordered={false}
        title={
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            <span style={{ fontWeight: 600 }}>偏差与CAPA管理</span>
            <Tag color="orange">PRD §13 · GB17405 · 21CFR Part111</Tag>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setCreateModal(true); form.resetFields(); }}>
            手动开立偏差
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          // ── Tab1: 偏差列表 ───────────────────────────────────────────
          {
            key: 'deviation', label: <>偏差列表 <Badge count={filteredDevs.filter(d=>d.status!=='CLOSED').length} /></>,
            children: (
              <>
                {/* 筛选栏 */}
                <Row gutter={12} style={{ marginBottom: 12 }}>
                  <Col span={5}>
                    <Input.Search placeholder="批号/编号/标题" value={filterKw}
                      onChange={e => setFilterKw(e.target.value)}
                      onSearch={() => loadData()} allowClear />
                  </Col>
                  <Col span={4}>
                    <Select placeholder="严重度" allowClear style={{ width: '100%' }}
                      value={filterSev || undefined} onChange={v => setFilterSev(v||'')}>
                      {Object.entries(SEV_CONFIG).map(([k,v]) =>
                        <Option key={k} value={k}><Tag color={v.color} style={{fontSize:11}}>{v.label}</Tag></Option>
                      )}
                    </Select>
                  </Col>
                  <Col span={4}>
                    <Select placeholder="状态" allowClear style={{ width: '100%' }}
                      value={filterStatus || undefined} onChange={v => setFilterStatus(v||'')}>
                      {Object.entries(STATUS_CONFIG).map(([k,v]) =>
                        <Option key={k} value={k}>{v.label}</Option>
                      )}
                    </Select>
                  </Col>
                  <Col span={5}>
                    <Select placeholder="触发来源" allowClear style={{ width: '100%' }}
                      value={filterTrigger || undefined} onChange={v => setFilterTrigger(v||'')}>
                      {Object.entries(TRIGGER_CONFIG).map(([k,v]) =>
                        <Option key={k} value={k}><Tag color={v.color} style={{fontSize:11}}>{v.label}</Tag></Option>
                      )}
                    </Select>
                  </Col>
                </Row>
                <Table dataSource={filteredDevs} columns={devColumns} rowKey="id"
                  loading={loading} size="small" pagination={{ pageSize: 15 }}
                  scroll={{ x: 1100 }}
                  rowClassName={r => r.severity === 'CRITICAL' ? 'row-critical' :
                                     r.severity === 'MAJOR'    ? 'row-major'    : ''}
                />
              </>
            )
          },

          // ── Tab2: CAPA管理 ───────────────────────────────────────────
          {
            key: 'capa', label: <>CAPA闭环管理 <Badge count={capas.filter(c=>c.status!=='COMPLETED').length} /></>,
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 12 }}>
                  {(['PENDING','IN_PROGRESS','VERIFY','COMPLETED','OVERDUE'] as CapaStatus[]).map(s => (
                    <Col span={4} key={s}>
                      <Card size="small" style={{ textAlign:'center', borderRadius:8 }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: CAPA_STATUS_CONFIG[s]?.color }}>
                          {capas.filter(c=>c.status===s).length}
                        </div>
                        <Text style={{ fontSize: 12 }}>{CAPA_STATUS_CONFIG[s]?.label}</Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
                <Table dataSource={capas} columns={capaColumns} rowKey="id"
                  size="small" pagination={{ pageSize: 10 }} scroll={{ x: 1000 }}
                />
              </>
            )
          },

          // ── Tab3: 触发来源分析 ───────────────────────────────────────
          {
            key: 'analysis', label: '触发来源分析',
            children: (
              <Row gutter={24}>
                <Col span={12}>
                  <Card size="small" title="按触发来源统计" bordered={false}>
                    {Object.entries(TRIGGER_CONFIG).map(([k, v]) => {
                      const cnt = deviations.filter(d => d.trigger_source === k).length;
                      return (
                        <div key={k} style={{ marginBottom: 12 }}>
                          <Row justify="space-between" style={{ marginBottom: 4 }}>
                            <Col><Tag icon={v.icon} color={v.color}>{v.label}</Tag></Col>
                            <Col><Text strong>{cnt} 条</Text></Col>
                          </Row>
                          <Progress percent={deviations.length ? Math.round(cnt/deviations.length*100) : 0}
                            strokeColor={v.color} size="small" />
                        </div>
                      );
                    })}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="按严重度统计" bordered={false}>
                    {Object.entries(SEV_CONFIG).map(([k, v]) => {
                      const cnt = deviations.filter(d => d.severity === k).length;
                      return (
                        <div key={k} style={{ marginBottom: 12 }}>
                          <Row justify="space-between" style={{ marginBottom: 4 }}>
                            <Col><Tag color={v.color}>{v.label}</Tag>
                              <Text type="secondary" style={{fontSize:11}}> 处理期限≤{v.days}天</Text>
                            </Col>
                            <Col><Text strong>{cnt} 条</Text></Col>
                          </Row>
                          <Progress percent={deviations.length ? Math.round(cnt/deviations.length*100) : 0}
                            strokeColor={v.color} size="small" />
                        </div>
                      );
                    })}
                  </Card>
                </Col>
              </Row>
            )
          },
        ]} />
      </Card>

      {/* ── 偏差详情弹窗 ─────────────────────────────────────────────── */}
      <Modal open={detailModal} onCancel={() => setDetailModal(false)} footer={null}
        width={760} title={
          <Space>
            <FileProtectOutlined style={{ color: '#faad14' }} />
            偏差详情 — {selected?.deviation_code}
          </Space>
        }>
        {selected && (
          <>
            <TriggerChain dev={selected} />
            <Divider style={{ margin: '12px 0' }} />

            {/* 基本信息 */}
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="偏差编号">
                <Text code>{selected.deviation_code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="严重度">
                <Tag color={SEV_CONFIG[selected.severity]?.color}>
                  {SEV_CONFIG[selected.severity]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="偏差标题" span={2}>{selected.title}</Descriptions.Item>
              <Descriptions.Item label="批号">{selected.batch_no}</Descriptions.Item>
              <Descriptions.Item label="工单号">{selected.wo_code}</Descriptions.Item>
              <Descriptions.Item label="偏差类型">{selected.deviation_type}</Descriptions.Item>
              <Descriptions.Item label="细分类型">{selected.deviation_type2 || '—'}</Descriptions.Item>
              <Descriptions.Item label="报告人">{selected.reporter_name}</Descriptions.Item>
              <Descriptions.Item label="处理人">{selected.handler_name}</Descriptions.Item>
              <Descriptions.Item label="处理截止">{selected.deadline}
                {getDeadlineStatus(selected)}
              </Descriptions.Item>
              <Descriptions.Item label="关闭时间">{selected.close_time || '—'}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{selected.description}</Descriptions.Item>
              {selected.root_cause && (
                <Descriptions.Item label="根本原因" span={2}>{selected.root_cause}</Descriptions.Item>
              )}
              {selected.invest_result && (
                <Descriptions.Item label="调查结论" span={2}>{selected.invest_result}</Descriptions.Item>
              )}
              {selected.capa && (
                <Descriptions.Item label="整改措施" span={2}>{selected.capa}</Descriptions.Item>
              )}
            </Descriptions>

            {/* 审批流程 */}
            <Divider orientation={"left" as any} style={{ margin: '12px 0' }}>处理进度</Divider>
            <Steps size="small" current={STATUS_CONFIG[selected.status]?.step || 0}
              items={[
                { title: '已开立', description: selected.create_time },
                { title: '调查中', description: '根因分析' },
                { title: '待关闭', description: 'CAPA验证' },
                { title: '已关闭', description: selected.close_time || '—' },
              ]}
            />

            {/* CAPA关联 */}
            {selected.capa_id && (
              <>
                <Divider orientation={"left" as any} style={{ margin: '12px 0' }}>关联CAPA</Divider>
                {capas.filter(c => c.dev_code === selected.deviation_code).map(c => (
                  <Card key={c.id} size="small" bordered
                    style={{ background: '#f6f8ff', marginBottom: 8 }}>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Text code>{c.capa_code}</Text>
                        <Text style={{ marginLeft: 8 }}>{c.title}</Text>
                      </Col>
                      <Col>
                        <Tag color={CAPA_STATUS_CONFIG[c.status]?.color}>
                          {CAPA_STATUS_CONFIG[c.status]?.label}
                        </Tag>
                        <Progress percent={c.progress} style={{ width: 100, marginLeft: 8 }} size="small" />
                      </Col>
                    </Row>
                  </Card>
                ))}
              </>
            )}

            <Row justify="end" style={{ marginTop: 12 }} gutter={8}>
              {selected.status !== 'CLOSED' && !selected.capa_id && (
                <Col>
                  <Button type="default" icon={<AuditOutlined />}
                    onClick={() => { setCapaModal(true); capaForm.resetFields(); }}>
                    建立CAPA
                  </Button>
                </Col>
              )}
              {selected.status !== 'CLOSED' && (
                <Col>
                  <Button type="primary" icon={<EditOutlined />}
                    onClick={() => { setInvestModal(true); investForm.resetFields(); }}>
                    提交调查
                  </Button>
                </Col>
              )}
            </Row>
          </>
        )}
      </Modal>

      {/* ── 手动创建偏差 ─────────────────────────────────────────────── */}
      <Modal open={createModal} onCancel={() => setCreateModal(false)} title="手动开立偏差"
        onOk={handleCreateDev} okText="提交" width={600}>
        <Form form={form} layout="vertical" size="small">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="batchNo" label="批号" rules={[{ required: true }]}>
                <Input placeholder="BN-XXXXXXXXX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="woCode" label="工单号">
                <Input placeholder="WO-XXXXXXXXX" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="偏差标题" rules={[{ required: true }]}>
            <Input placeholder="简述偏差现象" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="severity" label="严重度" initialValue="MINOR" rules={[{required:true}]}>
                <Select>
                  {Object.entries(SEV_CONFIG).map(([k,v]) =>
                    <Option key={k} value={k}><Tag color={v.color}>{v.label}</Tag></Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deviationType" label="偏差类型" initialValue="工艺偏差">
                <Select>
                  {['工艺偏差','物料偏差','设备偏差','环境偏差','人员偏差'].map(t =>
                    <Option key={t} value={t}>{t}</Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="偏差描述" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="详细描述偏差发生经过、影响范围" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="reporterName" label="报告人" rules={[{required:true}]}>
                <Input placeholder="填写报告人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="handlerName" label="处理人">
                <Input placeholder="填写处理人姓名" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── 提交调查 ──────────────────────────────────────────────────── */}
      <Modal open={investModal} onCancel={() => setInvestModal(false)} title="提交调查结果"
        onOk={handleInvestSubmit} okText="提交" width={560}>
        <Alert type="info" message={`偏差：${selected?.deviation_code} — ${selected?.title}`}
          style={{ marginBottom: 12 }} showIcon />
        <Form form={investForm} layout="vertical" size="small">
          <Form.Item name="rootCause" label="根本原因分析" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="分析造成偏差的直接和根本原因" />
          </Form.Item>
          <Form.Item name="investResult" label="调查结论" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="调查结论、对产品质量的影响评估" />
          </Form.Item>
          <Form.Item name="handlerName" label="调查人" rules={[{ required: true }]}>
            <Input placeholder="调查人姓名" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── 建立CAPA ──────────────────────────────────────────────────── */}
      <Modal open={capaModal} onCancel={() => setCapaModal(false)} title="建立纠正预防措施 (CAPA)"
        onOk={handleCreateCapa} okText="创建" width={580}>
        {selected && (
          <Alert type="warning" style={{ marginBottom: 12 }} showIcon
            message={`关联偏差：${selected.deviation_code} — 严重度：${SEV_CONFIG[selected.severity]?.label}`} />
        )}
        <Form form={capaForm} layout="vertical" size="small">
          <Form.Item name="title" label="CAPA标题" rules={[{ required: true }]}>
            <Input placeholder="简述纠正预防措施主题" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="capaType" label="类型" initialValue="CORRECTIVE">
                <Select>
                  <Option value="CORRECTIVE">纠正措施（已发生）</Option>
                  <Option value="PREVENTIVE">预防措施（防再发）</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" initialValue="MEDIUM">
                <Select>
                  <Option value="URGENT"><Tag color="red">紧急</Tag></Option>
                  <Option value="HIGH"><Tag color="orange">高</Tag></Option>
                  <Option value="MEDIUM"><Tag color="blue">中</Tag></Option>
                  <Option value="LOW"><Tag color="default">低</Tag></Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="rootCause" label="根本原因" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="CAPA针对的根本原因" />
          </Form.Item>
          <Form.Item name="actionPlan" label="整改措施" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="具体整改步骤，如：1.立即措施 2.短期措施 3.长期措施" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="ownerName" label="负责人" rules={[{ required: true }]}>
                <Input placeholder="CAPA负责人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="计划完成日期" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <style>{`
        .row-critical td { background: #fff2f0 !important; }
        .row-major    td { background: #fffbe6 !important; }
      `}</style>
    </div>
  );
};

export default DeviationEnhancedPage;
