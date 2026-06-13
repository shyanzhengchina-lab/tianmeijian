/**
 * WeighingAntiErrorPage.tsx — 称量配料防错模块
 * ================================================================
 * PRD §8 完整实现：
 *   - 物料四重核对（品名/批号/规格/数量）
 *   - 称量偏差 ±0.5% 实时预警
 *   - 双人复核（操作员+复核员）
 *   - 近效期预警（<30天黄色警告）
 *   - 称量记录列表 + 历史查询
 * ================================================================
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, InputNumber,
  Select, Space, Statistic, Alert, Descriptions, Steps, Typography,
  Badge, Progress, message, Divider, Tooltip, Timeline, List,
  DatePicker, Tabs,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ExperimentOutlined, CheckCircleOutlined, WarningOutlined,
  ExclamationCircleOutlined, ScanOutlined, ScissorOutlined,
  SafetyOutlined, UserOutlined, ClockCircleOutlined,
  PlayCircleOutlined, ThunderboltOutlined, BarsOutlined,
  SearchOutlined, AuditOutlined, ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// ── 类型定义 ──────────────────────────────────────────────────
type VerifyResult = 'PASS' | 'FAIL' | 'PENDING' | 'WARNING';
type WeighStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

interface MaterialItem {
  code: string;
  name: string;
  batchNo: string;
  spec: string;
  requiredQty: number;
  unit: string;
  tolerance: number; // 允许偏差 %
  expiryDate: string;
  supplier: string;
  // 来自BOM
  bomRequired: boolean;
}

interface WeighRecord {
  id: string;
  seq: number;
  batchNo: string;
  productName: string;
  materialCode: string;
  materialName: string;
  materialBatchNo: string;
  spec: string;
  requiredQty: number;
  actualQty: number;
  unit: string;
  tolerance: number;
  deviationPct: number;
  // 四重核对结果
  nameVerify: VerifyResult;
  batchVerify: VerifyResult;
  specVerify: VerifyResult;
  weightVerify: VerifyResult;
  overallResult: VerifyResult;
  // 有效期
  expiryDate: string;
  expiryWarning: boolean; // 距到期<30天
  // 人员
  operator: string;
  reviewer: string | null;
  weighTime: string;
  reviewTime: string | null;
  status: WeighStatus;
}

// ── BOM 物料清单演示数据 ────────────────────────────────────────
const BOM_MATERIALS: Record<string, MaterialItem[]> = {
  'B20260601001': [
    { code: 'AUX-VC-001', name: '维生素C粉末', batchNo: 'VC20260401', spec: '25kg/桶，药用级', requiredQty: 25.00, unit: 'kg', tolerance: 0.5, expiryDate: '2027-04-01', supplier: '南京化工', bomRequired: true },
    { code: 'AUX-MCC-001', name: '微晶纤维素(MCC)', batchNo: 'MCC20260501', spec: '20kg/袋，药用级', requiredQty: 15.00, unit: 'kg', tolerance: 0.5, expiryDate: '2028-05-01', supplier: '山东欣和', bomRequired: true },
    { code: 'AUX-PVPK30', name: 'PVP K30', batchNo: 'PVP20260520', spec: '10kg/袋，药用级', requiredQty: 3.50, unit: 'kg', tolerance: 0.5, expiryDate: '2027-05-20', supplier: '上海贝夫', bomRequired: true },
    { code: 'AUX-MGST-001', name: '硬脂酸镁', batchNo: 'MG20260510', spec: '5kg/袋，药用级', requiredQty: 0.50, unit: 'kg', tolerance: 0.5, expiryDate: '2028-05-10', supplier: '上海贝夫', bomRequired: true },
    { code: 'AUX-TAL-001', name: '滑石粉', batchNo: 'TAL20260505', spec: '10kg/袋，药用级', requiredQty: 1.50, unit: 'kg', tolerance: 0.5, expiryDate: dayjs().add(20, 'day').format('YYYY-MM-DD'), supplier: '南京粉体', bomRequired: true },
    { code: 'AUX-SIO2-001', name: '二氧化硅', batchNo: 'SIO20260601', spec: '5kg/袋，药用级', requiredQty: 0.25, unit: 'kg', tolerance: 0.5, expiryDate: '2028-06-01', supplier: '南京粉体', bomRequired: true },
  ],
};

// ── 已完成称量记录演示数据 ───────────────────────────────────
const DEMO_WEIGH_RECORDS: WeighRecord[] = [
  {
    id: 'W001', seq: 1, batchNo: 'B20260601001', productName: '维生素C片 500mg',
    materialCode: 'AUX-VC-001', materialName: '维生素C粉末', materialBatchNo: 'VC20260401',
    spec: '25kg/桶，药用级', requiredQty: 25.00, actualQty: 24.98, unit: 'kg', tolerance: 0.5,
    deviationPct: -0.08, nameVerify: 'PASS', batchVerify: 'PASS', specVerify: 'PASS', weightVerify: 'PASS',
    overallResult: 'PASS', expiryDate: '2027-04-01', expiryWarning: false,
    operator: '张建国', reviewer: '李慧敏', weighTime: '2026-06-01 08:15', reviewTime: '2026-06-01 08:20', status: 'COMPLETED',
  },
  {
    id: 'W002', seq: 2, batchNo: 'B20260601001', productName: '维生素C片 500mg',
    materialCode: 'AUX-MCC-001', materialName: '微晶纤维素(MCC)', materialBatchNo: 'MCC20260501',
    spec: '20kg/袋，药用级', requiredQty: 15.00, actualQty: 15.01, unit: 'kg', tolerance: 0.5,
    deviationPct: 0.07, nameVerify: 'PASS', batchVerify: 'PASS', specVerify: 'PASS', weightVerify: 'PASS',
    overallResult: 'PASS', expiryDate: '2028-05-01', expiryWarning: false,
    operator: '张建国', reviewer: '李慧敏', weighTime: '2026-06-01 08:22', reviewTime: '2026-06-01 08:28', status: 'COMPLETED',
  },
  {
    id: 'W003', seq: 3, batchNo: 'B20260601001', productName: '维生素C片 500mg',
    materialCode: 'AUX-PVPK30', materialName: 'PVP K30', materialBatchNo: 'PVP20260520',
    spec: '10kg/袋，药用级', requiredQty: 3.50, actualQty: 3.52, unit: 'kg', tolerance: 0.5,
    deviationPct: 0.57, nameVerify: 'PASS', batchVerify: 'PASS', specVerify: 'PASS', weightVerify: 'FAIL',
    overallResult: 'FAIL', expiryDate: '2027-05-20', expiryWarning: false,
    operator: '张建国', reviewer: null, weighTime: '2026-06-01 08:33', reviewTime: null, status: 'FAILED',
  },
  {
    id: 'W004', seq: 4, batchNo: 'B20260601001', productName: '维生素C片 500mg',
    materialCode: 'AUX-TAL-001', materialName: '滑石粉', materialBatchNo: 'TAL20260505',
    spec: '10kg/袋，药用级', requiredQty: 1.50, actualQty: 1.50, unit: 'kg', tolerance: 0.5,
    deviationPct: 0.0, nameVerify: 'PASS', batchVerify: 'WARNING', specVerify: 'PASS', weightVerify: 'PASS',
    overallResult: 'WARNING', expiryDate: dayjs().add(20, 'day').format('YYYY-MM-DD'), expiryWarning: true,
    operator: '张建国', reviewer: null, weighTime: '2026-06-01 08:40', reviewTime: null, status: 'IN_PROGRESS',
  },
];

// ── 辅助组件 ─────────────────────────────────────────────────
const VerifyBadge: React.FC<{ result: VerifyResult; label: string }> = ({ result, label }) => {
  const cfg = {
    PASS:    { color: '#52c41a', bg: '#f6ffed', icon: '✅', text: '通过' },
    FAIL:    { color: '#ff4d4f', bg: '#fff2f0', icon: '❌', text: '不通过' },
    WARNING: { color: '#faad14', bg: '#fffbe6', icon: '⚠️', text: '警告' },
    PENDING: { color: '#aaa',    bg: '#fafafa', icon: '⏳', text: '待核对' },
  }[result];
  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: 6, padding: '6px 10px', textAlign: 'center', minWidth: 90 }}>
      <div style={{ fontSize: 16 }}>{cfg.icon}</div>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.text}</div>
    </div>
  );
};

// ── 主组件 ────────────────────────────────────────────────────
const WeighingAntiErrorPage: React.FC = () => {
  const [weighRecords, setWeighRecords] = useState<WeighRecord[]>(DEMO_WEIGH_RECORDS);
  const [simulateVisible, setSimulateVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selected, setSelected] = useState<WeighRecord | null>(null);
  const [simStep, setSimStep] = useState(0);
  const [simBatch, setSimBatch] = useState('B20260601001');
  const [simMat, setSimMat] = useState<MaterialItem | null>(null);
  const [simScanned, setSimScanned] = useState({ name: false, batch: false, spec: false });
  const [simWeight, setSimWeight] = useState<number>(0);
  const [activeTab, setActiveTab] = useState('records');
  const [form] = Form.useForm();

  const bomMaterials = BOM_MATERIALS[simBatch] || [];
  const pending = bomMaterials.filter(m => !weighRecords.find(r => r.materialCode === m.code && r.batchNo === simBatch && r.status === 'COMPLETED'));

  // ── 统计 ──
  const stats = useMemo(() => {
    const total = weighRecords.length;
    const pass = weighRecords.filter(r => r.overallResult === 'PASS').length;
    const fail = weighRecords.filter(r => r.overallResult === 'FAIL').length;
    const warn = weighRecords.filter(r => r.overallResult === 'WARNING').length;
    const expiryWarn = weighRecords.filter(r => r.expiryWarning).length;
    return { total, pass, fail, warn, expiryWarn };
  }, [weighRecords]);

  // ── 模拟称量步骤 ──
  const doScan = (field: 'name' | 'batch' | 'spec') => {
    setSimScanned(prev => ({ ...prev, [field]: true }));
    message.success(`扫码核对：${field === 'name' ? '品名' : field === 'batch' ? '批号' : '规格'} ✅`);
  };

  const doSimWeigh = () => {
    if (!simMat) return;
    // 模拟电子秤采集
    const offset = (Math.random() - 0.5) * 0.008; // ±0.4%随机偏差
    const actual = parseFloat((simMat.requiredQty * (1 + offset)).toFixed(3));
    setSimWeight(actual);
    const devPct = ((actual - simMat.requiredQty) / simMat.requiredQty) * 100;
    if (Math.abs(devPct) > simMat.tolerance) {
      message.error(`称量偏差 ${devPct.toFixed(2)}% 超出允许范围 ±${simMat.tolerance}%，禁止确认！`);
    } else {
      message.success(`称量稳定：${actual} kg，偏差 ${devPct.toFixed(2)}%，合格 ✅`);
    }
  };

  const doConfirmWeigh = () => {
    if (!simMat || simWeight === 0) return;
    const devPct = ((simWeight - simMat.requiredQty) / simMat.requiredQty) * 100;
    const weightVerify: VerifyResult = Math.abs(devPct) > simMat.tolerance ? 'FAIL' : 'PASS';
    const expiryWarning = dayjs(simMat.expiryDate).diff(dayjs(), 'day') < 30;
    const batchVerify: VerifyResult = expiryWarning ? 'WARNING' : 'PASS';
    const overall: VerifyResult = weightVerify === 'FAIL' ? 'FAIL' : batchVerify === 'WARNING' ? 'WARNING' : 'PASS';

    const newRec: WeighRecord = {
      id: `W${Date.now()}`, seq: weighRecords.length + 1, batchNo: simBatch,
      productName: '维生素C片 500mg', materialCode: simMat.code, materialName: simMat.name,
      materialBatchNo: simMat.batchNo, spec: simMat.spec, requiredQty: simMat.requiredQty,
      actualQty: simWeight, unit: simMat.unit, tolerance: simMat.tolerance, deviationPct: parseFloat(devPct.toFixed(2)),
      nameVerify: simScanned.name ? 'PASS' : 'PENDING',
      batchVerify, specVerify: simScanned.spec ? 'PASS' : 'PENDING', weightVerify,
      overallResult: overall, expiryDate: simMat.expiryDate, expiryWarning,
      operator: '模拟操作员', reviewer: null, weighTime: dayjs().format('YYYY-MM-DD HH:mm'), reviewTime: null,
      status: overall === 'FAIL' ? 'FAILED' : 'IN_PROGRESS',
    };
    setWeighRecords(prev => [...prev, newRec]);
    setSimulateVisible(false);
    setSimStep(0);
    setSimMat(null);
    setSimWeight(0);
    setSimScanned({ name: false, batch: false, spec: false });
    message.success('称量记录已保存');
  };

  // ── 复核操作 ──
  const handleReview = (record: WeighRecord) => {
    Modal.confirm({
      title: '复核确认',
      content: (
        <div>
          <p>物料：<strong>{record.materialName}</strong></p>
          <p>目标重量：{record.requiredQty} {record.unit}　实际：{record.actualQty} {record.unit}</p>
          <p>偏差：<strong style={{ color: Math.abs(record.deviationPct) > record.tolerance ? '#ff4d4f' : '#52c41a' }}>{record.deviationPct}%</strong></p>
          <Input placeholder="复核员姓名" id="reviewer-name" style={{ marginTop: 8 }} />
        </div>
      ),
      okText: '确认复核通过',
      onOk: () => {
        const name = (document.getElementById('reviewer-name') as HTMLInputElement)?.value || '复核员';
        setWeighRecords(prev => prev.map(r => r.id === record.id ? { ...r, reviewer: name, reviewTime: dayjs().format('YYYY-MM-DD HH:mm'), status: 'COMPLETED' } : r));
        message.success('复核完成 ✅');
      },
    });
  };

  // ── 表格列 ──
  const columns: ColumnsType<WeighRecord> = [
    { title: '序', dataIndex: 'seq', width: 45 },
    { title: '批号', dataIndex: 'batchNo', width: 120, render: v => <Tag color="blue">{v}</Tag> },
    { title: '物料名称', dataIndex: 'materialName', width: 140 },
    { title: '物料批号', dataIndex: 'materialBatchNo', width: 110, render: v => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: '目标量', width: 90, render: (_, r) => <Text strong>{r.requiredQty} {r.unit}</Text> },
    { title: '实际量', width: 90, render: (_, r) => (
      <Text strong style={{ color: Math.abs(r.deviationPct) > r.tolerance ? '#ff4d4f' : '#52c41a' }}>
        {r.actualQty} {r.unit}
      </Text>
    )},
    { title: '偏差', width: 90, render: (_, r) => (
      <Text style={{ color: Math.abs(r.deviationPct) > r.tolerance ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
        {r.deviationPct > 0 ? '+' : ''}{r.deviationPct}%
      </Text>
    )},
    { title: '四重核对', width: 110, render: (_, r) => {
      const all = [r.nameVerify, r.batchVerify, r.specVerify, r.weightVerify];
      if (all.every(v => v === 'PASS')) return <Tag color="green">✅ 全部通过</Tag>;
      if (all.some(v => v === 'FAIL')) return <Tag color="red">❌ 核对失败</Tag>;
      if (all.some(v => v === 'WARNING')) return <Tag color="orange">⚠️ 有警告</Tag>;
      return <Tag>待核对</Tag>;
    }},
    { title: '有效期预警', dataIndex: 'expiryWarning', width: 90, render: v => v ? (
      <Tooltip title="距有效期不足30天"><Tag color="orange">⚠️ 近效期</Tag></Tooltip>
    ) : <Tag color="green">正常</Tag> },
    { title: '称量人', dataIndex: 'operator', width: 80 },
    { title: '复核人', dataIndex: 'reviewer', width: 80, render: v => v ? <Tag color="purple">{v}</Tag> : <Text type="secondary">待复核</Text> },
    { title: '称量时间', dataIndex: 'weighTime', width: 130 },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: WeighStatus) => {
      const m = { PENDING: ['待称量', 'default'], IN_PROGRESS: ['待复核', 'processing'], COMPLETED: ['已完成', 'success'], FAILED: ['称量失败', 'error'] } as const;
      const [label, color] = m[v] || ['未知', 'default'];
      return <Badge status={color as any} text={label} />;
    }},
    { title: '操作', width: 120, fixed: 'right', render: (_, r) => (
      <Space size={4}>
        <Button size="small" type="link" onClick={() => { setSelected(r); setDetailVisible(true); }}>详情</Button>
        {r.status === 'IN_PROGRESS' && r.overallResult !== 'FAIL' && (
          <Button size="small" type="primary" onClick={() => handleReview(r)}>复核</Button>
        )}
      </Space>
    )},
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <ExperimentOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
          称量配料防错模块（四重核对）
        </Title>
        <Space>
          <Button icon={<PlayCircleOutlined />} type="primary" onClick={() => {
            setSimStep(0); setSimMat(null); setSimWeight(0); setSimScanned({ name: false, batch: false, spec: false });
            setSimulateVisible(true);
          }}>
            模拟称量操作
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { label: '称量记录', value: stats.total, color: '#1677ff', icon: <BarsOutlined /> },
          { label: '全部通过', value: stats.pass, color: '#52c41a', icon: <CheckCircleOutlined /> },
          { label: '核对失败', value: stats.fail, color: '#ff4d4f', icon: <ExclamationCircleOutlined /> },
          { label: '有警告', value: stats.warn, color: '#fa8c16', icon: <WarningOutlined /> },
          { label: '近效期预警', value: stats.expiryWarn, color: '#faad14', icon: <ClockCircleOutlined /> },
        ].map((s, i) => (
          <Col span={i < 3 ? 5 : 4} key={i}>
            <Card size="small" style={{ borderLeft: `3px solid ${s.color}` }}>
              <Statistic title={s.label} value={s.value} valueStyle={{ color: s.color, fontSize: 20 }} prefix={s.icon} />
            </Card>
          </Col>
        ))}
      </Row>

      {stats.fail > 0 && (
        <Alert type="error" showIcon style={{ marginBottom: 12 }}
          message={`❌ 有 ${stats.fail} 条称量记录四重核对不通过，已禁止确认，需重新称量！`}
        />
      )}
      {stats.expiryWarn > 0 && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }}
          message={`⚠️ 有 ${stats.expiryWarn} 种物料距有效期不足30天，请关注是否影响本批次质量！`}
        />
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        <Tabs.TabPane tab={<span><BarsOutlined />称量记录</span>} key="records">
          <Table columns={columns} dataSource={weighRecords} rowKey="id" size="small" scroll={{ x: 1500 }}
            rowClassName={r => r.overallResult === 'FAIL' ? 'ant-table-row-error' : ''}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span><AuditOutlined />四重核对规则</span>} key="rules">
          <Row gutter={12}>
            {[
              { icon: '📛', title: '第一重：品名核对', desc: '扫描物料标签条码，比对BOM中的物料名称', action: '声光报警 + 锁定操作', color: '#1677ff' },
              { icon: '🔢', title: '第二重：批号核对', desc: '比对物料批号是否在BOM允许批次内，同时检查有效期', action: '近效期(≤30天)黄色警告，过期禁止使用', color: '#fa8c16' },
              { icon: '📐', title: '第三重：规格核对', desc: '比对物料规格（如25kg/桶，药用级）是否与BOM一致', action: '规格不符声光报警 + 锁定操作', color: '#52c41a' },
              { icon: '⚖️', title: '第四重：数量核对', desc: '电子秤实时采集称量重量，与BOM目标量比对', action: '超出±0.5%偏差范围时，红色警告 + 禁止确认', color: '#722ed1' },
            ].map((r, i) => (
              <Col span={6} key={i}>
                <Card size="small" style={{ borderTop: `3px solid ${r.color}`, height: '100%' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{r.icon}</div>
                  <Text strong style={{ color: r.color }}>{r.title}</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Text style={{ fontSize: 12 }}>{r.desc}</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ background: '#fafafa', borderRadius: 4, padding: '4px 8px' }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>不通过处理：</Text><br />
                    <Text style={{ fontSize: 11, color: r.color }}>{r.action}</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          <Card size="small" style={{ marginTop: 12 }}>
            <Title level={5} style={{ margin: '0 0 8px' }}>称量操作流程（PRD §8.1）</Title>
            <Steps size="small" direction="horizontal" items={[
              { title: '加载BOM', description: 'PDA扫描工单条码→显示物料清单' },
              { title: '选择物料', description: '选当前称量品→显示目标重量' },
              { title: '扫码核对', description: '扫物料标签→自动比对品/批/规格' },
              { title: '上秤称量', description: '电子秤自动传输重量→实时显示偏差' },
              { title: '操作员确认', description: '全部通过→操作员签名确认' },
              { title: '复核签名', description: '复核员逐项复核→电子签名' },
            ]} />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span><SearchOutlined />BOM物料清单</span>} key="bom">
          <div style={{ marginBottom: 8 }}>
            <Select value={simBatch} onChange={setSimBatch} style={{ width: 200 }}>
              {Object.keys(BOM_MATERIALS).map(k => <Option key={k} value={k}>{k}</Option>)}
            </Select>
          </div>
          <Table
            dataSource={bomMaterials} rowKey="code" size="small"
            columns={[
              { title: '物料编码', dataIndex: 'code', width: 120, render: v => <Text code>{v}</Text> },
              { title: '物料名称', dataIndex: 'name', width: 160 },
              { title: '批号', dataIndex: 'batchNo', width: 110 },
              { title: '规格', dataIndex: 'spec', width: 180 },
              { title: '目标用量', dataIndex: 'requiredQty', width: 90, render: (v, r) => `${v} ${r.unit}` },
              { title: '允许偏差', dataIndex: 'tolerance', width: 90, render: v => `±${v}%` },
              { title: '有效期至', dataIndex: 'expiryDate', width: 110, render: (v) => {
                const daysLeft = dayjs(v).diff(dayjs(), 'day');
                return <Tag color={daysLeft < 30 ? 'orange' : daysLeft < 90 ? 'yellow' : 'green'}>{v} {daysLeft < 30 && '⚠️'}</Tag>;
              }},
              { title: '供应商', dataIndex: 'supplier', width: 100 },
              { title: '称量状态', width: 100, render: (_, r) => {
                const done = weighRecords.find(wr => wr.materialCode === r.code && wr.batchNo === simBatch && wr.status === 'COMPLETED');
                return done ? <Tag color="green">✅ 已完成</Tag> : <Tag color="default">待称量</Tag>;
              }},
            ] as ColumnsType<MaterialItem>}
          />
        </Tabs.TabPane>
      </Tabs>

      {/* 详情弹窗 */}
      <Modal title="称量记录详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={620}>
        {selected && (
          <>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="物料名称" span={2}><Text strong>{selected.materialName}</Text></Descriptions.Item>
              <Descriptions.Item label="物料批号"><Text code>{selected.materialBatchNo}</Text></Descriptions.Item>
              <Descriptions.Item label="规格">{selected.spec}</Descriptions.Item>
              <Descriptions.Item label="目标重量"><Text strong>{selected.requiredQty} {selected.unit}</Text></Descriptions.Item>
              <Descriptions.Item label="实际重量">
                <Text strong style={{ color: Math.abs(selected.deviationPct) > selected.tolerance ? '#ff4d4f' : '#52c41a', fontSize: 16 }}>
                  {selected.actualQty} {selected.unit}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="偏差">
                <Text strong style={{ color: Math.abs(selected.deviationPct) > selected.tolerance ? '#ff4d4f' : '#52c41a' }}>
                  {selected.deviationPct > 0 ? '+' : ''}{selected.deviationPct}% (允许±{selected.tolerance}%)
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="有效期至">
                <Tag color={selected.expiryWarning ? 'orange' : 'green'}>{selected.expiryDate} {selected.expiryWarning && '⚠️近效期'}</Tag>
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation={"left" as any}>四重核对结果</Divider>
            <Row gutter={8}>
              <Col span={6}><VerifyBadge result={selected.nameVerify} label="品名核对" /></Col>
              <Col span={6}><VerifyBadge result={selected.batchVerify} label="批号核对" /></Col>
              <Col span={6}><VerifyBadge result={selected.specVerify} label="规格核对" /></Col>
              <Col span={6}><VerifyBadge result={selected.weightVerify} label="数量核对" /></Col>
            </Row>
            <Divider orientation={"left" as any}>人员记录</Divider>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="操作员">{selected.operator}</Descriptions.Item>
              <Descriptions.Item label="称量时间">{selected.weighTime}</Descriptions.Item>
              <Descriptions.Item label="复核员">{selected.reviewer || <Text type="secondary">待复核</Text>}</Descriptions.Item>
              <Descriptions.Item label="复核时间">{selected.reviewTime || '—'}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      {/* 模拟称量操作弹窗 */}
      <Modal title={<Space><ExperimentOutlined style={{ color: '#fa8c16' }} />称量配料防错演示</Space>}
        open={simulateVisible} onCancel={() => setSimulateVisible(false)}
        footer={null} width={680}
      >
        <Steps current={simStep} size="small" style={{ marginBottom: 16 }} items={[
          { title: '选择物料' },
          { title: '扫码核对' },
          { title: '称重' },
          { title: '确认' },
        ]} />

        {simStep === 0 && (
          <div>
            <Alert type="info" message="请从BOM清单中选择当前需要称量的物料" style={{ marginBottom: 12 }} />
            <List
              dataSource={pending.slice(0, 6)}
              renderItem={m => (
                <List.Item
                  actions={[<Button type="primary" size="small" onClick={() => { setSimMat(m); setSimStep(1); }}>选择称量</Button>]}
                >
                  <List.Item.Meta
                    title={<Space><Text strong>{m.name}</Text><Tag color="blue">{m.batchNo}</Tag>{dayjs(m.expiryDate).diff(dayjs(), 'day') < 30 && <Tag color="orange">⚠️近效期</Tag>}</Space>}
                    description={<Text type="secondary">{m.code} · 目标：{m.requiredQty} {m.unit} · 允许偏差 ±{m.tolerance}%</Text>}
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        {simStep === 1 && simMat && (
          <div>
            <Alert type="info" showIcon message={`当前称量：${simMat.name}，目标：${simMat.requiredQty} ${simMat.unit}`} style={{ marginBottom: 16 }} />
            <Row gutter={12}>
              {[
                { key: 'name', label: '扫码核对品名', icon: '📛', done: simScanned.name },
                { key: 'batch', label: '扫码核对批号', icon: '🔢', done: simScanned.batch },
                { key: 'spec', label: '扫码核对规格', icon: '📐', done: simScanned.spec },
              ].map(item => (
                <Col span={8} key={item.key}>
                  <Card size="small" style={{ textAlign: 'center', background: item.done ? '#f6ffed' : '#fff', borderColor: item.done ? '#b7eb8f' : '#d9d9d9' }}>
                    <div style={{ fontSize: 20 }}>{item.icon}</div>
                    <div style={{ fontSize: 12, margin: '6px 0' }}>{item.label}</div>
                    {item.done ? (
                      <Tag color="green">✅ 已通过</Tag>
                    ) : (
                      <Button size="small" icon={<ScanOutlined />} onClick={() => doScan(item.key as any)}>模拟扫码</Button>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setSimStep(0)}>上一步</Button>
              <Button type="primary" disabled={!simScanned.name || !simScanned.batch || !simScanned.spec}
                onClick={() => setSimStep(2)}>三项核对通过，进行称重 →</Button>
            </div>
          </div>
        )}

        {simStep === 2 && simMat && (
          <div>
            <Alert type="info" showIcon message={`目标：${simMat.requiredQty} ${simMat.unit}　允许范围：${(simMat.requiredQty * (1 - simMat.tolerance / 100)).toFixed(3)}~${(simMat.requiredQty * (1 + simMat.tolerance / 100)).toFixed(3)} ${simMat.unit}`} style={{ marginBottom: 16 }} />
            <Card style={{ background: '#f0f8ff', border: '1px solid #91d5ff', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>⚖️ 电子秤实时读数</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: simWeight > 0 ? (Math.abs((simWeight - simMat.requiredQty) / simMat.requiredQty * 100) > simMat.tolerance ? '#ff4d4f' : '#52c41a') : '#1677ff', fontFamily: 'monospace' }}>
                {simWeight > 0 ? `${simWeight.toFixed(3)} ${simMat.unit}` : '-- kg'}
              </div>
              {simWeight > 0 && (
                <Text style={{ color: Math.abs((simWeight - simMat.requiredQty) / simMat.requiredQty * 100) > simMat.tolerance ? '#ff4d4f' : '#52c41a' }}>
                  偏差：{(((simWeight - simMat.requiredQty) / simMat.requiredQty) * 100).toFixed(2)}%
                  {Math.abs((simWeight - simMat.requiredQty) / simMat.requiredQty * 100) > simMat.tolerance ? ' ❌ 超出范围' : ' ✅ 合格'}
                </Text>
              )}
              <div style={{ marginTop: 16 }}>
                <Button icon={<ReloadOutlined />} type="primary" onClick={doSimWeigh}>模拟电子秤采集</Button>
              </div>
            </Card>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setSimStep(1)}>上一步</Button>
              <Button type="primary" disabled={simWeight === 0} onClick={() => setSimStep(3)}>重量确认，进入签名 →</Button>
            </div>
          </div>
        )}

        {simStep === 3 && simMat && (
          <div>
            <Alert type="success" showIcon message="四重核对完成！请操作员确认并电子签名" style={{ marginBottom: 16 }} />
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="物料名称">{simMat.name}</Descriptions.Item>
              <Descriptions.Item label="批号">{simMat.batchNo}</Descriptions.Item>
              <Descriptions.Item label="目标重量">{simMat.requiredQty} {simMat.unit}</Descriptions.Item>
              <Descriptions.Item label="实际重量">
                <Text strong style={{ color: '#52c41a' }}>{simWeight} {simMat.unit}</Text>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ margin: '16px 0', display: 'flex', gap: 8 }}>
              <VerifyBadge result="PASS" label="品名" />
              <VerifyBadge result="PASS" label="批号" />
              <VerifyBadge result="PASS" label="规格" />
              <VerifyBadge result={Math.abs((simWeight - simMat.requiredQty) / simMat.requiredQty * 100) > simMat.tolerance ? 'FAIL' : 'PASS'} label="数量" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setSimStep(2)}>上一步</Button>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={doConfirmWeigh}>确认称量 + 电子签名</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WeighingAntiErrorPage;
