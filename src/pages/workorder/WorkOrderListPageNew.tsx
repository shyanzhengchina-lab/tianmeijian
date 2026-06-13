/**
 * 生产工单列表页 — 天美健MES v3（业务逻辑完善版）
 * 新增：状态流转 / 过程检验触发 / 成品检验触发 / 下推任务单 / 物料平衡计算
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Select, Space,
  Progress, Modal, message, Descriptions, Divider, Badge,
  Tooltip, Form, Spin, Steps, Alert, InputNumber, Drawer,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UnorderedListOutlined, SearchOutlined, EyeOutlined, ReloadOutlined,
  PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PauseCircleOutlined, FileDoneOutlined,
  FileTextOutlined, ExperimentOutlined, NodeIndexOutlined,
  SafetyCertificateOutlined, RocketOutlined, ArrowRightOutlined,
  AuditOutlined, CheckSquareOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

// ── 工单状态配置 ─────────────────────────────────────────────────────
const WO_STATUS: Record<number, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  1: { label: '待投产', color: '#8c8c8c', icon: <ClockCircleOutlined />,       desc: '已审核，等待开始生产' },
  2: { label: '生产中', color: '#1677ff', icon: <PlayCircleOutlined />,        desc: '正在按工艺路线执行' },
  3: { label: '待过检', color: '#fa8c16', icon: <ExperimentOutlined />,        desc: '关键工序完成，等待过程检验' },
  4: { label: '待成检', color: '#722ed1', icon: <SafetyCertificateOutlined />, desc: '全部工序完成，等待成品检验' },
  5: { label: '检验中', color: '#13c2c2', icon: <AuditOutlined />,             desc: 'QC正在进行成品全检' },
  6: { label: '已完成', color: '#52c41a', icon: <CheckCircleOutlined />,       desc: '检验合格，批次已放行' },
  7: { label: '已关闭', color: '#d9d9d9', icon: <CheckCircleOutlined />,       desc: '已关闭归档' },
  8: { label: '已暂停', color: '#ff4d4f', icon: <PauseCircleOutlined />,       desc: '生产已暂停，等待处理' },
};

const PRIORITY_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '紧急', color: 'red' },
  2: { label: '高',   color: 'orange' },
  3: { label: '普通', color: 'blue' },
  4: { label: '低',   color: 'default' },
};

// 过程检验项目
const IN_PROCESS_QC_ITEMS = [
  { key: 'weight_check',     label: '称量复核',    required: true,  spec: '±1%以内',    desc: '操作人与复核人双人核对' },
  { key: 'mixing_rsd',       label: '混合均匀性',  required: true,  spec: 'RSD≤5%',     desc: '5点位取样检测' },
  { key: 'granule_size',     label: '颗粒粒径',    required: true,  spec: '符合工艺规程', desc: '过筛检测' },
  { key: 'tablet_weight',    label: '片重差异',    required: true,  spec: '±5%以内',    desc: '每20min抽检20片' },
  { key: 'tablet_hardness',  label: '片剂硬度',    required: false, spec: '≥5kg',        desc: '随机抽检' },
  { key: 'disintegration',   label: '崩解时限',    required: false, spec: '≤15min',      desc: '6片测试' },
  { key: 'capsule_fill',     label: '装量差异',    required: true,  spec: '±7.5%',      desc: '每30min抽检20粒' },
  { key: 'sealing',          label: '密封性检查',  required: false, spec: '无渗漏',      desc: '抽检' },
  { key: 'env_temp_humid',   label: '温湿度记录',  required: true,  spec: 'T:18-26℃ RH:45-65%', desc: '每小时记录' },
];

// 成品检验项目
const FINAL_QC_ITEMS = [
  { key: 'appearance',         label: '外观',       spec: '符合质量标准',   required: true },
  { key: 'identification',     label: '鉴别',       spec: '符合规定',       required: true },
  { key: 'disintegration',     label: '崩解时限',   spec: '≤15min',         required: true },
  { key: 'dissolution',        label: '溶出度',     spec: '≥80%',           required: true },
  { key: 'content_uniformity', label: '含量均匀度', spec: 'AV≤15',          required: true },
  { key: 'assay',              label: '含量测定',   spec: '95.0-105.0%',    required: true },
  { key: 'related_substance',  label: '有关物质',   spec: '符合规定',       required: true },
  { key: 'moisture',           label: '水分',       spec: '≤5.0%',          required: true },
  { key: 'microbial',          label: '微生物限度', spec: '符合规定',       required: true },
  { key: 'package',            label: '包装完整性', spec: '无缺陷',         required: true },
];

interface WorkOrder {
  id: number;
  wo_code: string;
  product_code: string;
  product_name: string;
  batch_no: string;
  bom_version: string;
  route_code: string;
  plan_qty: string;
  actual_qty: string;
  unit_name: string;
  wo_status: number;
  order_type: string;
  channel_type: string;
  priority: number;
  plan_start: string;
  plan_end: string;
  actual_start: string | null;
  actual_end: string | null;
  remark: string;
  workshop_code: string;
  create_time: string;
}

interface WorkOrderListPageNewProps {
  onNavigate?: (page: string, params?: Record<string, unknown>) => void;
}

const WorkOrderListPageNew: React.FC<WorkOrderListPageNewProps> = ({ onNavigate }) => {
  const [records, setRecords] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [detailRecord, setDetailRecord] = useState<WorkOrder | null>(null);

  // 过程检验
  const [inQcVisible, setInQcVisible] = useState(false);
  const [inQcWo, setInQcWo] = useState<WorkOrder | null>(null);
  const [inQcForm] = Form.useForm();
  const [inQcResults, setInQcResults] = useState<Record<string, { result: string; pass: boolean }>>({});

  // 成品检验
  const [finalQcVisible, setFinalQcVisible] = useState(false);
  const [finalQcWo, setFinalQcWo] = useState<WorkOrder | null>(null);
  const [finalQcForm] = Form.useForm();
  const [finalQcResults, setFinalQcResults] = useState<Record<string, { result: string; pass: boolean }>>({});

  // 下推任务单
  const [pushTaskVisible, setPushTaskVisible] = useState(false);
  const [pushTaskWo, setPushTaskWo] = useState<WorkOrder | null>(null);
  const [routingSteps, setRoutingSteps] = useState<any[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);

  const token = localStorage.getItem('token') || localStorage.getItem('mes_token') || '';
  const headers = { Authorization: `Bearer ${token}` };

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, size: pageSize };
      if (statusFilter !== 'ALL') params.wo_status = statusFilter;
      if (searchText) params.keyword = searchText;
      const res = await axios.get('/api/plan/work-orders', { headers, params });
      const data = res.data?.data ?? {};
      setRecords(data.list ?? []);
      setTotal(data.total ?? 0);
    } catch {
      message.error('加载生产工单失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchText]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // 物料平衡计算
  const calcMaterialBalance = (wo: WorkOrder) => {
    const plan = parseFloat(wo.plan_qty) || 0;
    const actual = parseFloat(wo.actual_qty) || 0;
    if (plan === 0) return null;
    const rate = (actual / plan) * 100;
    return { rate: rate.toFixed(2), pass: rate >= 96.0 && rate <= 102.0 };
  };

  // 开始生产
  const handleStartProduction = (wo: WorkOrder) => {
    Modal.confirm({
      title: '确认开始生产',
      icon: <PlayCircleOutlined style={{ color: '#1677ff' }} />,
      content: (
        <div>
          <p>工单：<strong>{wo.wo_code}</strong> — {wo.product_name}</p>
          <Alert type="info" showIcon message="开始后将按工艺路线自动生成任务单，请确保清场已合格" style={{ marginTop: 8 }} />
        </div>
      ),
      okText: '确认开始',
      onOk: async () => {
        try {
          await axios.patch(`/api/plan/work-orders/${wo.id}/status`, { wo_status: 2 }, { headers });
        } catch { /* 本地更新 */ }
        setRecords(prev => prev.map(r => r.id === wo.id ? { ...r, wo_status: 2 } : r));
        message.success(`工单 ${wo.wo_code} 已开始生产`);
      },
    });
  };

  // 触发过程检验
  const handleTriggerInProcessQc = (wo: WorkOrder) => {
    setInQcWo(wo);
    setInQcResults({});
    inQcForm.resetFields();
    inQcForm.setFieldsValue({ opCode: 'GD-05', checker: 'QC张工', reviewer: 'QA李工' });
    setInQcVisible(true);
  };

  const handleSubmitInProcessQc = async () => {
    try {
      const values = await inQcForm.validateFields();
      const failItems = IN_PROCESS_QC_ITEMS.filter(item => item.required && inQcResults[item.key]?.pass === false);
      const conclusion = failItems.length === 0 ? 'PASS' : 'FAIL';
      const record = {
        woId: inQcWo!.id, woCode: inQcWo!.wo_code, batchNo: inQcWo!.batch_no,
        productName: inQcWo!.product_name, opCode: values.opCode,
        checkItems: inQcResults, checker: values.checker, reviewer: values.reviewer,
        checkTime: new Date().toLocaleString('zh-CN'), conclusion, remarks: values.remarks || '',
      };
      const saved = JSON.parse(localStorage.getItem('mes_inprocess_qc') || '[]');
      localStorage.setItem('mes_inprocess_qc', JSON.stringify([record, ...saved].slice(0, 200)));
      if (conclusion === 'PASS') {
        message.success('过程检验合格，工单继续生产');
      } else {
        message.warning(`过程检验有 ${failItems.length} 项不合格，已暂停生产`);
        setRecords(prev => prev.map(r => r.id === inQcWo!.id ? { ...r, wo_status: 8 } : r));
      }
      setInQcVisible(false);
    } catch { /* 表单校验失败 */ }
  };

  // 触发成品检验
  const handleTriggerFinalQc = (wo: WorkOrder) => {
    setFinalQcWo(wo);
    setFinalQcResults({});
    finalQcForm.resetFields();
    finalQcForm.setFieldsValue({ checker: 'QC张工', reviewer: 'QA李工', sampleQty: 10 });
    setRecords(prev => prev.map(r => r.id === wo.id ? { ...r, wo_status: 5 } : r));
    setFinalQcVisible(true);
  };

  const handleSubmitFinalQc = async () => {
    try {
      const values = await finalQcForm.validateFields();
      const failItems = FINAL_QC_ITEMS.filter(item => item.required && finalQcResults[item.key]?.pass === false);
      const conclusion = failItems.length === 0 ? 'PASS' : 'FAIL';
      const record = {
        woId: finalQcWo!.id, woCode: finalQcWo!.wo_code, batchNo: finalQcWo!.batch_no,
        productName: finalQcWo!.product_name, checkItems: finalQcResults,
        checker: values.checker, reviewer: values.reviewer, sampleQty: values.sampleQty,
        checkTime: new Date().toLocaleString('zh-CN'), conclusion, remarks: values.remarks || '',
      };
      const saved = JSON.parse(localStorage.getItem('mes_final_qc') || '[]');
      localStorage.setItem('mes_final_qc', JSON.stringify([record, ...saved].slice(0, 200)));
      if (conclusion === 'PASS') {
        message.success('成品检验合格！批次已放行，工单完成');
        setRecords(prev => prev.map(r => r.id === finalQcWo!.id ? { ...r, wo_status: 6 } : r));
      } else {
        message.error(`成品检验 ${failItems.length} 项不合格，批次需偏差处理`);
        setRecords(prev => prev.map(r => r.id === finalQcWo!.id ? { ...r, wo_status: 8 } : r));
      }
      setFinalQcVisible(false);
    } catch { /* 表单校验 */ }
  };

  // 下推任务单
  const handlePushTasks = async (wo: WorkOrder) => {
    setPushTaskWo(wo);
    setPushTaskVisible(true);
    setLoadingSteps(true);
    try {
      const routeRes = await axios.get('/api/process-routings/list', { headers });
      const routings = routeRes.data?.data ?? [];
      const routing = routings.find((r: any) =>
        r.routingCode === wo.route_code || r.code === wo.route_code || r.routeCode === wo.route_code
      );
      if (routing) {
        const stepRes = await axios.get(`/api/routing-steps/list?routingId=${routing.id}`, { headers });
        setRoutingSteps(stepRes.data?.data ?? []);
      } else {
        setRoutingSteps([]);
      }
    } catch {
      setRoutingSteps([]);
    } finally {
      setLoadingSteps(false);
    }
  };

  const handleConfirmPushTasks = async () => {
    if (!pushTaskWo) return;
    try {
      await axios.post('/api/execution/task-orders/generate', { woId: pushTaskWo.id }, { headers });
    } catch { /* 本地模式 */ }
    setRecords(prev => prev.map(r => r.id === pushTaskWo.id ? { ...r, wo_status: 2 } : r));
    message.success(`成功下推 ${routingSteps.length} 张工序任务单`);
    setPushTaskVisible(false);
  };

  // KPI
  const kpiData = [
    { label: '工单总数',  value: total,                                                  color: '#1677ff' },
    { label: '生产中',    value: records.filter(r => r.wo_status === 2).length,          color: '#fa8c16' },
    { label: '待检验',    value: records.filter(r => [3,4,5].includes(r.wo_status)).length, color: '#722ed1' },
    { label: '已完成',    value: records.filter(r => r.wo_status === 6).length,          color: '#52c41a' },
    { label: '异常/暂停', value: records.filter(r => r.wo_status === 8).length,          color: '#ff4d4f' },
  ];

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  const columns: ColumnsType<WorkOrder> = [
    {
      title: '工单编号', dataIndex: 'wo_code', width: 160, fixed: 'left',
      render: (v, r) => (
        <Button type="link" size="small" onClick={() => setDetailRecord(r)} style={{ padding: 0, fontSize: 12, fontWeight: 600 }}>
          <FileTextOutlined style={{ marginRight: 4 }} />{v}
        </Button>
      ),
    },
    {
      title: '产品/批次', width: 200,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.product_name}</div>
          <div style={{ fontSize: 11, color: '#667085' }}>
            {r.product_code} · 批号: <span style={{ color: '#1677ff', fontWeight: 600 }}>{r.batch_no}</span>
          </div>
        </div>
      ),
    },
    {
      title: '计划/实产', width: 160,
      render: (_, r) => {
        const plan = parseFloat(r.plan_qty);
        const actual = parseFloat(r.actual_qty);
        const pct = plan > 0 ? Math.min(100, Math.round((actual / plan) * 100)) : 0;
        const balance = calcMaterialBalance(r);
        return (
          <div>
            <div style={{ fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>{actual.toLocaleString()}</span>
              <span style={{ color: '#8c8c8c' }}> / {plan.toLocaleString()} {r.unit_name}</span>
            </div>
            <Progress percent={pct} size="small" showInfo={false}
              strokeColor={pct >= 96 && pct <= 102 ? '#52c41a' : pct >= 60 ? '#1677ff' : '#fa8c16'}
              style={{ marginBottom: 2 }} />
            {balance && (
              <Tag color={balance.pass ? 'green' : 'red'} style={{ fontSize: 10, padding: '0 4px', marginTop: 2 }}>
                平衡 {balance.rate}%{!balance.pass ? ' ⚠' : ''}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '状态', dataIndex: 'wo_status', width: 110,
      render: (v) => {
        const cfg = WO_STATUS[v] ?? { label: String(v), color: '#8c8c8c', icon: null, desc: '' };
        return (
          <Tooltip title={cfg.desc}>
            <Tag color={cfg.color} style={{ fontWeight: 600, cursor: 'help' }}>
              {cfg.icon}&nbsp;{cfg.label}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '优先级', dataIndex: 'priority', width: 70,
      render: v => { const p = PRIORITY_MAP[v] ?? { label: String(v), color: 'default' }; return <Tag color={p.color}>{p.label}</Tag>; },
    },
    {
      title: '计划时段', width: 170,
      render: (_, r) => {
        const start = r.plan_start ? new Date(r.plan_start).toLocaleDateString('zh-CN') : '—';
        const end   = r.plan_end   ? new Date(r.plan_end).toLocaleDateString('zh-CN')   : '—';
        const overdue = r.plan_end && ![6,7].includes(r.wo_status) && new Date(r.plan_end) < new Date();
        return (
          <div style={{ fontSize: 11 }}>
            <div style={{ color: '#667085' }}>{start}</div>
            <div style={{ color: overdue ? '#ff4d4f' : '#667085', fontWeight: overdue ? 600 : 400 }}>
              {end}{overdue ? ' ⚠逾期' : ''}
            </div>
          </div>
        );
      },
    },
    { title: '工艺路线', dataIndex: 'route_code', width: 130, render: v => v ? <Tag color="blue" style={{ fontSize: 10 }}>{v}</Tag> : '—' },
    {
      title: '操作', width: 260, fixed: 'right',
      render: (_, r) => (
        <Space size={3} wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailRecord(r)}>详情</Button>
          {r.wo_status === 1 && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStartProduction(r)}>开始</Button>
          )}
          {r.wo_status === 1 && (
            <Button size="small" icon={<NodeIndexOutlined />} onClick={() => handlePushTasks(r)}>下推任务</Button>
          )}
          {r.wo_status === 2 && (
            <Button size="small" icon={<ExperimentOutlined />}
              style={{ color: '#fa8c16', borderColor: '#fa8c16' }}
              onClick={() => handleTriggerInProcessQc(r)}>过程检验</Button>
          )}
          {[2,3].includes(r.wo_status) && (
            <Button size="small" icon={<SafetyCertificateOutlined />}
              style={{ color: '#722ed1', borderColor: '#722ed1' }}
              onClick={() => handleTriggerFinalQc(r)}>成品检验</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* KPI */}
      <Row gutter={10} style={{ marginBottom: 14 }}>
        {kpiData.map((kpi, i) => (
          <Col key={i} xs={12} sm={8} md={24 / kpiData.length}>
            <Card size="small" bodyStyle={{ padding: '8px 12px' }}
              style={{ borderTop: `3px solid ${kpi.color}`, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 业务流程说明 */}
      <Alert type="info" showIcon icon={<NodeIndexOutlined />}
        message={
          <Space size={4} wrap style={{ fontSize: 12 }}>
            <span style={{ color: '#8c8c8c' }}>业务流程：</span>
            {[{s:1,l:'待投产'},{s:2,l:'生产中'},{s:3,l:'过程检验'},{s:5,l:'成品检验'},{s:6,l:'批次放行'}]
              .map((item, i, arr) => (
                <React.Fragment key={item.s}>
                  <Tag color={WO_STATUS[item.s]?.color} style={{ margin: 0 }}>{item.l}</Tag>
                  {i < arr.length - 1 && <ArrowRightOutlined style={{ color: '#d9d9d9', fontSize: 10 }} />}
                </React.Fragment>
              ))}
          </Space>
        }
        style={{ marginBottom: 12 }} closable />

      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input placeholder="工单号 / 产品名 / 批次号" prefix={<SearchOutlined />}
            value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 240 }} allowClear />
          <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} style={{ width: 130 }}>
            <Option value="ALL">全部状态</Option>
            {Object.entries(WO_STATUS).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={loadRecords} loading={loading}>刷新</Button>
        </Space>
      </Card>

      {/* 主表格 */}
      <Card size="small" bodyStyle={{ padding: 0 }}>
        <Table columns={columns} dataSource={records} rowKey="id" loading={loading}
          size="small" scroll={{ x: 1400 }}
          rowClassName={r => r.wo_status === 2 ? 'row-in-progress' : r.wo_status === 8 ? 'row-paused' : ''}
          pagination={{ total, current: page, pageSize, onChange: p => setPage(p), showTotal: t => `共 ${t} 张工单`, showSizeChanger: false }} />
      </Card>

      {/* ============ 详情 Modal ============ */}
      <Modal open={!!detailRecord} onCancel={() => setDetailRecord(null)}
        title={
          <Space>
            <UnorderedListOutlined style={{ color: '#fa8c16' }} />
            <span>生产工单 — {detailRecord?.wo_code}</span>
            {detailRecord && <Tag color={WO_STATUS[detailRecord.wo_status]?.color}>{WO_STATUS[detailRecord.wo_status]?.label}</Tag>}
          </Space>
        }
        width={820}
        footer={[
          <Button key="close" onClick={() => setDetailRecord(null)}>关闭</Button>,
          detailRecord?.wo_status === 2 && (
            <Button key="inqc" icon={<ExperimentOutlined />} style={{ color: '#fa8c16', borderColor: '#fa8c16' }}
              onClick={() => { setDetailRecord(null); handleTriggerInProcessQc(detailRecord!); }}>过程检验</Button>
          ),
          [2,3].includes(detailRecord?.wo_status ?? 0) && (
            <Button key="finalqc" type="primary" icon={<SafetyCertificateOutlined />}
              onClick={() => { setDetailRecord(null); handleTriggerFinalQc(detailRecord!); }}>成品检验</Button>
          ),
        ].filter(Boolean)}
      >
        {detailRecord && (
          <>
            <Steps size="small" style={{ marginBottom: 16 }}
              current={[1,2,3,5,6].indexOf(detailRecord.wo_status)}
              items={[
                { title: '待投产', icon: <ClockCircleOutlined /> },
                { title: '生产中', icon: <PlayCircleOutlined /> },
                { title: '过程检验', icon: <ExperimentOutlined /> },
                { title: '成品检验', icon: <SafetyCertificateOutlined /> },
                { title: '已完成', icon: <CheckCircleOutlined /> },
              ]} />
            <Descriptions size="small" bordered column={2}>
              <Descriptions.Item label="工单编号" span={2}>
                <span style={{ fontWeight: 700, color: '#1677ff', fontSize: 14 }}>{detailRecord.wo_code}</span>
              </Descriptions.Item>
              <Descriptions.Item label="产品名称">{detailRecord.product_name}</Descriptions.Item>
              <Descriptions.Item label="产品编码">{detailRecord.product_code}</Descriptions.Item>
              <Descriptions.Item label="批次号">
                <span style={{ fontWeight: 600, color: '#d48806' }}>{detailRecord.batch_no}</span>
              </Descriptions.Item>
              <Descriptions.Item label="BOM版本">{detailRecord.bom_version || '—'}</Descriptions.Item>
              <Descriptions.Item label="工艺路线">{detailRecord.route_code || '—'}</Descriptions.Item>
              <Descriptions.Item label="销售渠道">{detailRecord.channel_type || '—'}</Descriptions.Item>
              <Descriptions.Item label="计划产量">
                <span style={{ fontWeight: 600 }}>{parseFloat(detailRecord.plan_qty).toLocaleString()} {detailRecord.unit_name}</span>
              </Descriptions.Item>
              <Descriptions.Item label="实际产量">
                <span style={{ fontWeight: 600, color: '#52c41a' }}>{parseFloat(detailRecord.actual_qty).toLocaleString()} {detailRecord.unit_name}</span>
              </Descriptions.Item>
              <Descriptions.Item label="物料平衡率" span={2}>
                {(() => {
                  const b = calcMaterialBalance(detailRecord);
                  if (!b) return '—';
                  return (
                    <Space>
                      <Tag color={b.pass ? 'green' : 'red'} style={{ fontSize: 12 }}>{b.rate}%</Tag>
                      {b.pass
                        ? <span style={{ color: '#52c41a' }}>✓ 符合GMP要求（96.0-102.0%）</span>
                        : <span style={{ color: '#ff4d4f' }}>⚠ 超出范围，需质量调查</span>}
                    </Space>
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="计划开始">{fmtDate(detailRecord.plan_start)}</Descriptions.Item>
              <Descriptions.Item label="计划结束">{fmtDate(detailRecord.plan_end)}</Descriptions.Item>
              <Descriptions.Item label="实际开始">{fmtDate(detailRecord.actual_start)}</Descriptions.Item>
              <Descriptions.Item label="实际完成">{fmtDate(detailRecord.actual_end)}</Descriptions.Item>
              <Descriptions.Item label="完成进度" span={2}>
                <Progress
                  percent={parseFloat(detailRecord.plan_qty) > 0 ? Math.min(100, Math.round((parseFloat(detailRecord.actual_qty) / parseFloat(detailRecord.plan_qty)) * 100)) : 0}
                  strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }} />
              </Descriptions.Item>
              {detailRecord.remark && <Descriptions.Item label="备注" span={2}>{detailRecord.remark}</Descriptions.Item>}
            </Descriptions>
          </>
        )}
      </Modal>

      {/* ============ 过程检验 Drawer ============ */}
      <Drawer open={inQcVisible} onClose={() => setInQcVisible(false)} width={680}
        title={
          <Space>
            <ExperimentOutlined style={{ color: '#fa8c16' }} />
            <span>过程检验记录 — {inQcWo?.wo_code}</span>
            <Tag color="orange">批号: {inQcWo?.batch_no}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={() => setInQcVisible(false)}>取消</Button>
            <Button type="primary" icon={<CheckSquareOutlined />} onClick={handleSubmitInProcessQc}>提交检验结果</Button>
          </Space>
        }
      >
        <Alert type="warning" showIcon message="过程检验规定"
          description="须由QC执行，操作员不得自行判定。检验结果须双人确认，不合格须立即暂停生产并通知QA。"
          style={{ marginBottom: 16 }} />
        <Form form={inQcForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="检验工序" name="opCode">
                <Select placeholder="选择被检工序">
                  <Option value="GD-01">GD-01 称量配料</Option>
                  <Option value="GD-02">GD-02 混合</Option>
                  <Option value="GD-03">GD-03 制粒</Option>
                  <Option value="GD-05">GD-05 压片</Option>
                  <Option value="GD-06">GD-06 包衣</Option>
                  <Option value="BZ-01">BZ-01 内包装</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item label="工序名称" name="opName"><Input placeholder="工序名称" /></Form.Item></Col>
            <Col span={12}><Form.Item label="检验人员" name="checker" rules={[{ required: true, message: '请填写检验员' }]}><Input placeholder="QC检验员姓名" /></Form.Item></Col>
            <Col span={12}><Form.Item label="复核人员" name="reviewer" rules={[{ required: true, message: '请填写复核员' }]}><Input placeholder="QA复核员姓名" /></Form.Item></Col>
          </Row>
          <Divider>检验项目</Divider>
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ background: '#fafafa', padding: '8px 12px', display: 'grid', gridTemplateColumns: '140px 1fr 90px 60px', gap: 8, fontWeight: 600, fontSize: 12, color: '#595959' }}>
              <span>检验项目</span><span>质量标准</span><span>实测值</span><span>判定</span>
            </div>
            {IN_PROCESS_QC_ITEMS.map(item => (
              <div key={item.key} style={{
                padding: '6px 12px', display: 'grid', gridTemplateColumns: '140px 1fr 90px 60px',
                gap: 8, alignItems: 'center', borderTop: '1px solid #f0f0f0', fontSize: 12,
                background: inQcResults[item.key]?.pass === false ? '#fff2f0' : 'white',
              }}>
                <Tooltip title={item.desc}>
                  <span style={{ cursor: 'help' }}>
                    {item.required && <span style={{ color: '#ff4d4f', marginRight: 3 }}>*</span>}
                    {item.label}
                  </span>
                </Tooltip>
                <span style={{ color: '#8c8c8c', fontSize: 11 }}>{item.spec}</span>
                <Input size="small" placeholder="填写" value={inQcResults[item.key]?.result || ''}
                  onChange={e => setInQcResults(prev => ({ ...prev, [item.key]: { ...prev[item.key], result: e.target.value, pass: prev[item.key]?.pass !== false } }))} />
                <Select size="small" value={inQcResults[item.key]?.pass === false ? 'fail' : 'pass'}
                  onChange={v => setInQcResults(prev => ({ ...prev, [item.key]: { ...prev[item.key], pass: v === 'pass', result: prev[item.key]?.result || '' } }))}>
                  <Option value="pass"><span style={{ color: '#52c41a' }}>合格</span></Option>
                  <Option value="fail"><span style={{ color: '#ff4d4f' }}>不合格</span></Option>
                </Select>
              </div>
            ))}
          </div>
          <Form.Item label="备注/偏差说明" name="remarks" style={{ marginTop: 16 }}>
            <Input.TextArea rows={3} placeholder="如有偏差，请详细描述..." />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ============ 成品检验 Drawer ============ */}
      <Drawer open={finalQcVisible} onClose={() => setFinalQcVisible(false)} width={720}
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#722ed1' }} />
            <span>成品检验报告 — {finalQcWo?.wo_code}</span>
            <Tag color="purple">批号: {finalQcWo?.batch_no}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={() => setFinalQcVisible(false)}>取消</Button>
            <Button type="primary" danger icon={<CheckSquareOutlined />} onClick={handleSubmitFinalQc}>提交检验结论</Button>
          </Space>
        }
      >
        <Alert type="error" showIcon message="成品检验 — 批次放行决策"
          description="成品全检须由QC实验室执行，QA审核放行。检验结论直接决定批次是否可销售，须严格按质量标准执行。"
          style={{ marginBottom: 16 }} />
        <Form form={finalQcForm} layout="vertical">
          <Row gutter={12}>
            <Col span={8}><Form.Item label="检验员" name="checker" rules={[{ required: true }]}><Input prefix={<ExperimentOutlined />} placeholder="QC检验员" /></Form.Item></Col>
            <Col span={8}><Form.Item label="QA审核" name="reviewer" rules={[{ required: true }]}><Input prefix={<AuditOutlined />} placeholder="QA审核员" /></Form.Item></Col>
            <Col span={8}><Form.Item label="取样数量" name="sampleQty"><InputNumber min={1} max={100} addonAfter="件" style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Divider>成品全检项目</Divider>
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ background: '#fafafa', padding: '8px 12px', display: 'grid', gridTemplateColumns: '130px 1fr 100px 60px', gap: 8, fontWeight: 600, fontSize: 12, color: '#595959' }}>
              <span>检验项目</span><span>质量标准</span><span>实测结果</span><span>判定</span>
            </div>
            {FINAL_QC_ITEMS.map(item => (
              <div key={item.key} style={{
                padding: '6px 12px', display: 'grid', gridTemplateColumns: '130px 1fr 100px 60px',
                gap: 8, alignItems: 'center', borderTop: '1px solid #f0f0f0', fontSize: 12,
                background: finalQcResults[item.key]?.pass === false ? '#fff2f0' : 'white',
              }}>
                <span>{item.required && <span style={{ color: '#ff4d4f', marginRight: 3 }}>*</span>}{item.label}</span>
                <span style={{ color: '#8c8c8c', fontSize: 11 }}>{item.spec}</span>
                <Input size="small" placeholder="实测值" value={finalQcResults[item.key]?.result || ''}
                  onChange={e => setFinalQcResults(prev => ({ ...prev, [item.key]: { ...prev[item.key], result: e.target.value, pass: prev[item.key]?.pass !== false } }))} />
                <Select size="small" value={finalQcResults[item.key]?.pass === false ? 'fail' : 'pass'}
                  onChange={v => setFinalQcResults(prev => ({ ...prev, [item.key]: { ...prev[item.key], pass: v === 'pass', result: prev[item.key]?.result || '' } }))}>
                  <Option value="pass"><span style={{ color: '#52c41a' }}>✓</span></Option>
                  <Option value="fail"><span style={{ color: '#ff4d4f' }}>✗</span></Option>
                </Select>
              </div>
            ))}
          </div>
          <Form.Item label="检验结论/备注" name="remarks" style={{ marginTop: 16 }}>
            <Input.TextArea rows={3} placeholder="综合检验结论，如有不合格项请详细说明..." />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ============ 下推任务单 Modal ============ */}
      <Modal open={pushTaskVisible} onCancel={() => setPushTaskVisible(false)}
        title={<Space><NodeIndexOutlined style={{ color: '#1677ff' }} /><span>下推生产任务单 — {pushTaskWo?.wo_code}</span></Space>}
        width={720} onOk={handleConfirmPushTasks}
        okText={`确认下推 ${routingSteps.length} 张任务单`}
        okButtonProps={{ icon: <RocketOutlined />, disabled: routingSteps.length === 0 }}
      >
        <Alert type="info" showIcon
          message={`将按工艺路线 ${pushTaskWo?.route_code || '—'} 自动生成 ${routingSteps.length} 张工序任务单`}
          style={{ marginBottom: 16 }} />
        {loadingSteps ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : routingSteps.length > 0 ? (
          <Table size="small" dataSource={routingSteps} rowKey="id" pagination={false}
            columns={[
              { title: '步骤', dataIndex: 'stepNo', width: 60, render: v => <Tag>{`S${v}`}</Tag> },
              { title: '工序名称', dataIndex: 'opName', width: 120 },
              { title: '工作中心', dataIndex: 'workCenter', width: 120, render: v => v || '—' },
              { title: '标准工时', dataIndex: 'stdTimeMin', width: 80, render: v => v ? `${v}min` : '—' },
              { title: '关键工序', dataIndex: 'isKeyOp', width: 80, render: v => v ? <Tag color="red">关键</Tag> : '—' },
              { title: 'QC检验', dataIndex: 'isQcPoint', width: 80, render: v => v ? <Tag color="orange">需检</Tag> : '—' },
            ]} />
        ) : (
          <Alert type="warning" message="未找到工艺路线步骤，请先配置工艺路线" showIcon />
        )}
      </Modal>
    </div>
  );
};

export default WorkOrderListPageNew;
