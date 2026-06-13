/**
 * QualityGatePage.tsx — 质量门控（PRD §11）
 * ============================================================
 * 功能：
 *  1. 工序间放行检查单（来源工序→目标工序）
 *  2. 门控项检查：物料平衡率/清场合格证/QC检验/设备状态/人员资质
 *  3. 不合格→自动拦截+自动创建偏差
 *  4. 放行历史追踪
 * ============================================================
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, Select,
  Space, Statistic, Alert, Badge, Divider, Descriptions, message,
  Steps, Checkbox, Typography, Tooltip, Progress,
} from 'antd';
import {
  SafetyOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, PlusOutlined, EyeOutlined, AuditOutlined,
  BranchesOutlined, ThunderboltOutlined, LockOutlined, UnlockOutlined,
  RightCircleOutlined, StopOutlined, FileProtectOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ─── API ───────────────────────────────────────────────────────────────
const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('mes_token') || localStorage.getItem('auth_token') || '';
  if (t) cfg.headers!['Authorization'] = `Bearer ${t}`;
  return cfg;
});

// ─── 类型 ─────────────────────────────────────────────────────────────
type GateStatus = 'PENDING' | 'PASSED' | 'BLOCKED' | 'DEVIATION';

interface GateItem {
  key: string;
  label: string;
  category: 'QUALITY' | 'PROCESS' | 'ENV' | 'EQUIP' | 'DOC';
  required: boolean;
  passed: boolean | null;
  value?: string;
  remark?: string;
}

interface QualityGate {
  id: number;
  gate_no: string;
  wo_code: string;
  batch_no: string;
  product_name: string;
  from_op_code: string;
  from_op_name: string;
  to_op_code: string;
  to_op_name: string;
  gate_items: string;  // JSON
  all_passed: number;
  gate_status: GateStatus;
  block_reason: string;
  inspector_name: string;
  inspect_time: string;
  deviation_code: string;
  create_time: string;
}

// ─── 常量 ──────────────────────────────────────────────────────────────
const STATUS_CFG: Record<GateStatus, { color: string; label: string; icon: React.ReactNode }> = {
  PENDING:   { color: 'default',    label: '待检查',  icon: <AuditOutlined /> },
  PASSED:    { color: 'success',    label: '放行通过', icon: <CheckCircleOutlined /> },
  BLOCKED:   { color: 'error',      label: '拦截',    icon: <StopOutlined /> },
  DEVIATION: { color: 'warning',    label: '偏差处理', icon: <WarningOutlined /> },
};

const CATEGORY_CFG: Record<string, { color: string; label: string }> = {
  QUALITY: { color: 'blue',    label: '质量' },
  PROCESS: { color: 'green',   label: '工艺' },
  ENV:     { color: 'cyan',    label: '环境' },
  EQUIP:   { color: 'purple',  label: '设备' },
  DOC:     { color: 'orange',  label: '文件' },
};

// ─── 标准门控项模板（按工序类型） ────────────────────────────────────
const GATE_TEMPLATES: Record<string, GateItem[]> = {
  'GD-04→GD-05': [  // 制粒→压片
    { key:'g1', label:'制粒收率（≥95%）',             category:'QUALITY', required:true,  passed:null },
    { key:'g2', label:'颗粒水分检测（≤3.5%）',         category:'QUALITY', required:true,  passed:null },
    { key:'g3', label:'颗粒粒径分布（目数：20~60目）',  category:'QUALITY', required:true,  passed:null },
    { key:'g4', label:'物料平衡率（≥96%）',            category:'QUALITY', required:true,  passed:null },
    { key:'g5', label:'压片机冲头状态检查',             category:'EQUIP',   required:true,  passed:null },
    { key:'g6', label:'清场合格证有效性',               category:'DOC',     required:true,  passed:null },
    { key:'g7', label:'生产批指令完整性',               category:'DOC',     required:true,  passed:null },
    { key:'g8', label:'环境温湿度（18-26°C，≤65%RH）',  category:'ENV',     required:false, passed:null },
  ],
  'GD-05→GD-07': [  // 压片→包衣
    { key:'g1', label:'片重差异（±5%）',               category:'QUALITY', required:true,  passed:null },
    { key:'g2', label:'硬度（≥40N）',                  category:'QUALITY', required:true,  passed:null },
    { key:'g3', label:'脆碎度（≤0.5%）',               category:'QUALITY', required:true,  passed:null },
    { key:'g4', label:'崩解时限（≤15min）',             category:'QUALITY', required:true,  passed:null },
    { key:'g5', label:'外观检查（无裂片/缺损）',         category:'QUALITY', required:true,  passed:null },
    { key:'g6', label:'物料平衡率（≥97%）',             category:'QUALITY', required:true,  passed:null },
    { key:'g7', label:'清场合格证有效性',               category:'DOC',     required:true,  passed:null },
  ],
  'YQ-02→YQ-03': [  // 压丸→选丸
    { key:'g1', label:'丸重差异（±5%）',               category:'QUALITY', required:true,  passed:null },
    { key:'g2', label:'外观（球形、光泽度）',            category:'QUALITY', required:true,  passed:null },
    { key:'g3', label:'内容物含量初测',                 category:'QUALITY', required:false, passed:null },
    { key:'g4', label:'丸重收率（≥95%）',               category:'QUALITY', required:true,  passed:null },
    { key:'g5', label:'清场合格证有效性',               category:'DOC',     required:true,  passed:null },
  ],
  'DEFAULT': [
    { key:'g1', label:'物料平衡率达标',                 category:'QUALITY', required:true,  passed:null },
    { key:'g2', label:'上道工序QC检验合格',             category:'QUALITY', required:true,  passed:null },
    { key:'g3', label:'清场合格证有效',                 category:'DOC',     required:true,  passed:null },
    { key:'g4', label:'工序记录完整',                   category:'DOC',     required:true,  passed:null },
    { key:'g5', label:'操作人员资质确认',               category:'PROCESS', required:false, passed:null },
  ],
};

// ─── Demo 数据 ─────────────────────────────────────────────────────────
const demoGates: QualityGate[] = [
  { id:1, gate_no:'QG-20260601001', wo_code:'WO-20260601001', batch_no:'BN-20260601001',
    product_name:'复合维生素片', from_op_code:'GD-04', from_op_name:'制粒',
    to_op_code:'GD-05', to_op_name:'压片', gate_items:'[]',
    all_passed:1, gate_status:'PASSED', block_reason:'', inspector_name:'李慧敏',
    inspect_time:'2026-06-01 14:00:00', deviation_code:'', create_time:'2026-06-01 13:30:00' },
  { id:2, gate_no:'QG-20260601002', wo_code:'WO-20260601001', batch_no:'BN-20260601001',
    product_name:'复合维生素片', from_op_code:'GD-05', from_op_name:'压片',
    to_op_code:'GD-07', to_op_name:'包衣', gate_items:'[]',
    all_passed:1, gate_status:'PASSED', block_reason:'', inspector_name:'李慧敏',
    inspect_time:'2026-06-02 10:00:00', deviation_code:'', create_time:'2026-06-02 09:30:00' },
  { id:3, gate_no:'QG-20260603001', wo_code:'WO-20260601002', batch_no:'BN-20260601002',
    product_name:'深海鱼油软胶囊', from_op_code:'YQ-02', from_op_name:'压丸',
    to_op_code:'YQ-03', to_op_name:'选丸', gate_items:'[]',
    all_passed:0, gate_status:'BLOCKED', block_reason:'丸重收率仅91.2%，未达到≥95%要求，物料平衡超标',
    inspector_name:'王芳', inspect_time:'2026-06-03 15:30:00',
    deviation_code:'DEV-20260603002', create_time:'2026-06-03 15:00:00' },
  { id:4, gate_no:'QG-20260611001', wo_code:'WO-20260611001', batch_no:'BN-20260611001',
    product_name:'葡萄糖酸钙咀嚼片', from_op_code:'GD-02', from_op_name:'混合',
    to_op_code:'GD-04', to_op_name:'制粒', gate_items:'[]',
    all_passed:0, gate_status:'PENDING', block_reason:'', inspector_name:'',
    inspect_time:'', deviation_code:'', create_time:'2026-06-11 16:00:00' },
];

// ─── 主页面 ───────────────────────────────────────────────────────────
const QualityGatePage: React.FC = () => {
  const [gates, setGates]           = useState<QualityGate[]>(demoGates);
  const [loading, setLoading]       = useState(false);
  const [inspectModal, setInspectModal] = useState(false);
  const [detailModal, setDetailModal]   = useState(false);
  const [createModal, setCreateModal]   = useState(false);
  const [selected, setSelected]     = useState<QualityGate | null>(null);
  const [checkItems, setCheckItems] = useState<GateItem[]>([]);
  const [inspector, setInspector]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await API.get('/quality-gates/page', { params: { pageSize: 100, ...(filterStatus?{gateStatus:filterStatus}:{}) } });
      if (r.data?.data?.list) setGates(r.data.data.list);
    } catch { /* demo */ }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  // 开始检查 → 加载对应模板
  const openInspect = (gate: QualityGate) => {
    setSelected(gate);
    const key = `${gate.from_op_code}→${gate.to_op_code}`;
    const tpl = GATE_TEMPLATES[key] || GATE_TEMPLATES['DEFAULT'];
    setCheckItems(tpl.map(item => ({ ...item, passed: null })));
    setInspector('');
    setInspectModal(true);
  };

  const toggleItem = (key: string, passed: boolean) => {
    setCheckItems(prev => prev.map(item => item.key === key ? { ...item, passed } : item));
  };

  const handleSubmitInspect = async () => {
    if (!inspector.trim()) { message.warning('请填写检查人姓名'); return; }
    const failed  = checkItems.filter(i => i.required && i.passed !== true);
    const allPass = failed.length === 0;
    const blockReason = allPass ? '' :
      `以下必检项未通过：${failed.map(f => f.label).join('；')}`;

    try {
      const r = await API.put(`/quality-gates/${selected!.id}/inspect`, {
        allPassed: allPass, gateItems: checkItems,
        inspectorName: inspector, blockReason,
      });
      if (allPass) {
        message.success('质量门控通过，工序流转放行 ✓');
      } else {
        const devCode = r.data?.data?.devCode || '';
        Modal.error({
          title: '质量门控拦截 — 工序流转被阻止',
          content: (
            <div>
              <Alert type="error" showIcon message={blockReason} style={{ marginBottom: 8 }} />
              {devCode && <Alert type="warning" showIcon
                message={`已自动创建偏差：${devCode}，请质量部门及时处理`} />}
            </div>
          ),
          okText: '知道了',
        });
      }
      setInspectModal(false);
      loadData();
    } catch {
      // demo
      if (failed.length === 0) {
        message.success('（演示）质量门控通过 ✓');
      } else {
        Modal.error({
          title: '质量门控拦截 — 工序流转被阻止',
          content: (
            <Alert type="error" showIcon
              message={`${failed.length}项必检项未通过：${failed.map(f=>f.label).join('；')}`} />
          ),
          okText: '知道了',
        });
      }
      setInspectModal(false);
    }
  };

  const handleCreate = async () => {
    try {
      const vals = await form.validateFields();
      await API.post('/quality-gates', vals);
      message.success('质量门控检查单已创建');
      setCreateModal(false); form.resetFields(); loadData();
    } catch {
      message.success('（演示）检查单已创建');
      setCreateModal(false);
    }
  };

  // KPI
  const passed  = gates.filter(g => g.gate_status === 'PASSED').length;
  const blocked = gates.filter(g => g.gate_status === 'BLOCKED').length;
  const pending = gates.filter(g => g.gate_status === 'PENDING').length;
  const passRate = gates.length > 0 ? Math.round(passed / gates.length * 100) : 0;

  const columns: ColumnsType<QualityGate> = [
    { title: '门控单号', dataIndex: 'gate_no', width: 160,
      render: c => <Text code style={{ fontSize: 12 }}>{c}</Text> },
    { title: '工序流转', width: 200,
      render: (_, r) => (
        <Space>
          <Tag color="blue" style={{fontSize:11}}>{r.from_op_name}</Tag>
          <RightCircleOutlined style={{ color: '#8c8c8c' }} />
          <Tag color="green" style={{fontSize:11}}>{r.to_op_name}</Tag>
        </Space>
      )
    },
    { title: '批号', dataIndex: 'batch_no', width: 140,
      render: b => <Text type="secondary" style={{ fontSize: 12 }}>{b}</Text> },
    { title: '产品', dataIndex: 'product_name', ellipsis: true },
    { title: '状态', dataIndex: 'gate_status', width: 110,
      render: s => {
        const c = STATUS_CFG[s as GateStatus];
        return <Space size={4}>{c.icon}<Tag color={c.color}>{c.label}</Tag></Space>;
      }
    },
    { title: '检查人', dataIndex: 'inspector_name', width: 90,
      render: n => n || <Text type="secondary">—</Text> },
    { title: '检查时间', dataIndex: 'inspect_time', width: 155,
      render: t => <Text style={{ fontSize: 12 }}>{t || '—'}</Text> },
    { title: '关联偏差', dataIndex: 'deviation_code', width: 155,
      render: d => d ? <Tag color="orange" style={{fontSize:11,fontFamily:'monospace'}}>{d}</Tag> : '—'
    },
    { title: '操作', width: 120, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => { setSelected(r); setDetailModal(true); }} />
          {r.gate_status === 'PENDING' && (
            <Button size="small" type="primary" icon={<SafetyOutlined />}
              onClick={() => openInspect(r)}>检查</Button>
          )}
        </Space>
      )
    },
  ];

  const filteredGates = gates.filter(g => !filterStatus || g.gate_status === filterStatus);

  return (
    <div style={{ padding: 16 }}>
      {/* KPI */}
      <Row gutter={16} style={{ marginBottom: 12 }}>
        {[
          { title:'总检查次数', value:gates.length,  color:'#1677ff' },
          { title:'待检查',     value:pending,        color:'#faad14' },
          { title:'放行通过',   value:passed,         color:'#52c41a' },
          { title:'拦截次数',   value:blocked,        color:'#ff4d4f', tip:'自动创建偏差' },
          { title:'通过率',     value:passRate,       color:'#13c2c2', suffix:'%' },
        ].map(k => (
          <Col span={4} key={k.title}>
            <Card size="small" bordered={false}
              style={{ background: `${k.color}0d`, borderLeft: `3px solid ${k.color}` }}>
              <Statistic title={<span style={{fontSize:12}}>{k.title}</span>}
                value={k.value} suffix={k.suffix||'次'}
                valueStyle={{ color: k.color, fontSize: 22, fontWeight: 700 }} />
              {k.tip && <Text type="secondary" style={{fontSize:10}}>{k.tip}</Text>}
            </Card>
          </Col>
        ))}
        <Col span={4}>
          <Card size="small" bordered={false}
            style={{ background: '#722ed10d', borderLeft: '3px solid #722ed1' }}>
            <Statistic title={<span style={{fontSize:12}}>本月偏差触发</span>}
              value={gates.filter(g=>g.deviation_code).length}
              suffix="条" valueStyle={{ color: '#722ed1', fontSize: 22, fontWeight: 700 }} />
          </Card>
        </Col>
      </Row>

      {/* 说明 */}
      <Alert type="info" showIcon style={{ marginBottom: 12 }}
        message={
          <Space wrap>
            <strong>质量门控机制</strong>
            <span>工序流转前必须完成门控检查。不合格项将</span>
            <Tag color="error" icon={<StopOutlined />}>拦截工序流转</Tag>
            <span>并</span>
            <Tag color="warning" icon={<ThunderboltOutlined />}>自动创建MAJOR偏差</Tag>
          </Space>
        }
      />

      <Card bordered={false}
        title={
          <Space>
            <SafetyOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 600 }}>质量门控管理</span>
            <Tag color="blue">PRD §11</Tag>
          </Space>
        }
        extra={
          <Space>
            <Select placeholder="状态筛选" allowClear style={{ width: 130 }}
              value={filterStatus || undefined} onChange={v => setFilterStatus(v||'')}>
              {Object.entries(STATUS_CFG).map(([k,v]) =>
                <Option key={k} value={k}><Tag color={v.color} style={{fontSize:11}}>{v.label}</Tag></Option>
              )}
            </Select>
            <Button type="primary" icon={<PlusOutlined />}
              onClick={() => { setCreateModal(true); form.resetFields(); }}>
              新建门控单
            </Button>
          </Space>
        }
      >
        <Table dataSource={filteredGates} columns={columns} rowKey="id"
          loading={loading} size="small" pagination={{ pageSize: 15 }}
          scroll={{ x: 1100 }}
          rowClassName={r => r.gate_status === 'BLOCKED' ? 'row-blocked' : ''} />
      </Card>

      {/* ── 检查执行弹窗 ─────────────────────────────────────────────── */}
      <Modal open={inspectModal} onCancel={() => setInspectModal(false)}
        width={700} title={
          <Space>
            <SafetyOutlined style={{ color: '#1677ff' }} />
            质量门控检查 — {selected?.gate_no}
          </Space>
        }
        footer={[
          <Button key="cancel" onClick={() => setInspectModal(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitInspect}
            icon={<CheckCircleOutlined />}>
            提交检查结果
          </Button>,
        ]}
      >
        {selected && (
          <>
            {/* 工序流转信息 */}
            <div style={{ background: '#f0f5ff', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <Row justify="space-around" align="middle">
                <Col style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#8c8c8c' }}>来源工序</div>
                  <Tag color="blue" style={{ fontSize: 15, padding: '4px 12px', margin: '4px 0' }}>
                    {selected.from_op_code} · {selected.from_op_name}
                  </Tag>
                </Col>
                <Col style={{ fontSize: 24, color: '#1677ff' }}>→</Col>
                <Col style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#8c8c8c' }}>目标工序</div>
                  <Tag color="green" style={{ fontSize: 15, padding: '4px 12px', margin: '4px 0' }}>
                    {selected.to_op_code} · {selected.to_op_name}
                  </Tag>
                </Col>
              </Row>
              <Row justify="center" style={{ marginTop: 8 }}>
                <Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>批号：{selected.batch_no}</Text>
                  <Divider type="vertical" />
                  <Text type="secondary" style={{ fontSize: 12 }}>{selected.product_name}</Text>
                </Space>
              </Row>
            </div>

            {/* 门控清单 */}
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ fontSize: 14 }}>
                门控检查项 — 共{checkItems.length}项（必检{checkItems.filter(i=>i.required).length}项）
              </Text>
            </div>
            {checkItems.map(item => (
              <div key={item.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', marginBottom: 4, borderRadius: 6, border: '1px solid',
                borderColor: item.passed === true ? '#b7eb8f' : item.passed === false ? '#ffa39e' : '#d9d9d9',
                background: item.passed === true ? '#f6ffed' : item.passed === false ? '#fff2f0' : '#fafafa',
              }}>
                <Space>
                  <Tag color={CATEGORY_CFG[item.category]?.color} style={{ fontSize: 10, minWidth: 36 }}>
                    {CATEGORY_CFG[item.category]?.label}
                  </Tag>
                  <span style={{ fontSize: 13 }}>{item.label}</span>
                  {item.required && <Tag color="error" style={{ fontSize: 10 }}>必检</Tag>}
                </Space>
                <Space>
                  <Button size="small" type={item.passed===true?'primary':'default'}
                    style={{ borderColor: item.passed===true?'#52c41a':'', color: item.passed===true?'#52c41a':'' }}
                    onClick={() => toggleItem(item.key, true)}
                    icon={<CheckCircleOutlined />}>通过</Button>
                  <Button size="small" danger={item.passed===false}
                    type={item.passed===false?'primary':'default'}
                    onClick={() => toggleItem(item.key, false)}
                    icon={<CloseCircleOutlined />}>不通过</Button>
                </Space>
              </div>
            ))}

            {/* 统计预览 */}
            <Row justify="space-between" style={{ marginTop: 12, padding: '8px 12px',
              background: '#f9f9f9', borderRadius: 6 }}>
              <Col>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text>通过：{checkItems.filter(i=>i.passed===true).length} 项</Text>
                  <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />
                  <Text>不通过：{checkItems.filter(i=>i.passed===false).length} 项</Text>
                  <WarningOutlined style={{ color: '#faad14', marginLeft: 8 }} />
                  <Text>未检：{checkItems.filter(i=>i.passed===null).length} 项</Text>
                </Space>
              </Col>
              <Col>
                {checkItems.filter(i=>i.required && i.passed===false).length > 0 &&
                  <Tag color="error" icon={<StopOutlined />}>
                    {checkItems.filter(i=>i.required && i.passed===false).length}项必检不通过 → 将触发拦截+偏差
                  </Tag>
                }
                {checkItems.filter(i=>i.required && i.passed===null).length === 0 &&
                 checkItems.filter(i=>i.required && i.passed===false).length === 0 &&
                  <Tag color="success" icon={<UnlockOutlined />}>全部通过 → 可放行</Tag>
                }
              </Col>
            </Row>

            {/* 检查人 */}
            <Divider style={{ margin: '12px 0' }} />
            <Space>
              <Text>检查人：</Text>
              <Input value={inspector} onChange={e => setInspector(e.target.value)}
                placeholder="请输入检查人姓名" style={{ width: 180 }} />
            </Space>
          </>
        )}
      </Modal>

      {/* ── 详情弹窗 ─────────────────────────────────────────────────── */}
      <Modal open={detailModal} onCancel={() => setDetailModal(false)} footer={null}
        width={580} title="质量门控详情">
        {selected && (
          <>
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="门控单号" span={2}>
                <Text code>{selected.gate_no}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="来源工序">
                <Tag color="blue">{selected.from_op_code} · {selected.from_op_name}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="目标工序">
                <Tag color="green">{selected.to_op_code} · {selected.to_op_name}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="批号">{selected.batch_no}</Descriptions.Item>
              <Descriptions.Item label="工单号">{selected.wo_code}</Descriptions.Item>
              <Descriptions.Item label="产品" span={2}>{selected.product_name}</Descriptions.Item>
              <Descriptions.Item label="检查状态">
                <Space>{STATUS_CFG[selected.gate_status]?.icon}
                  <Tag color={STATUS_CFG[selected.gate_status]?.color}>
                    {STATUS_CFG[selected.gate_status]?.label}
                  </Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="检查人">{selected.inspector_name || '—'}</Descriptions.Item>
              <Descriptions.Item label="检查时间" span={2}>{selected.inspect_time || '—'}</Descriptions.Item>
              {selected.block_reason && (
                <Descriptions.Item label="拦截原因" span={2}>
                  <Text type="danger">{selected.block_reason}</Text>
                </Descriptions.Item>
              )}
              {selected.deviation_code && (
                <Descriptions.Item label="关联偏差" span={2}>
                  <Tag color="orange" icon={<ThunderboltOutlined />}
                    style={{ fontFamily: 'monospace' }}>{selected.deviation_code}</Tag>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                    系统自动创建
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {selected.gate_status === 'BLOCKED' && (
              <Alert type="error" showIcon style={{ marginTop: 12 }}
                icon={<LockOutlined />}
                message="工序流转已被拦截"
                description="请处理关联偏差后，由QA重新评估是否可继续生产或进行产品处置。" />
            )}
          </>
        )}
      </Modal>

      {/* ── 新建检查单 ──────────────────────────────────────────────── */}
      <Modal open={createModal} onCancel={() => setCreateModal(false)}
        title="新建质量门控检查单" onOk={handleCreate} okText="创建" width={540}>
        <Form form={form} layout="vertical" size="small">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="woCode" label="工单号" rules={[{required:true}]}>
                <Input placeholder="WO-XXXXXXXXX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="batchNo" label="批号" rules={[{required:true}]}>
                <Input placeholder="BN-XXXXXXXXX" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="productName" label="产品名称" rules={[{required:true}]}>
            <Input placeholder="产品名称" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="fromOpCode" label="来源工序代码" rules={[{required:true}]}>
                <Select placeholder="选择工序">
                  {['GD-01','GD-02','GD-04','GD-05','GD-07','YQ-01','YQ-02','YQ-03'].map(c =>
                    <Option key={c} value={c}>{c}</Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="toOpCode" label="目标工序代码" rules={[{required:true}]}>
                <Select placeholder="选择工序">
                  {['GD-04','GD-05','GD-07','GD-08','YQ-03','YQ-04','YQ-05'].map(c =>
                    <Option key={c} value={c}>{c}</Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <style>{`
        .row-blocked td { background: #fff2f0 !important; }
      `}</style>
    </div>
  );
};

export default QualityGatePage;
