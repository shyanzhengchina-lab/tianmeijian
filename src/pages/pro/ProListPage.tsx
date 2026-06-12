import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, Popconfirm, message,
  Row, Col, Modal, Form, Tooltip, Badge, Divider, Tabs, Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined,
  SearchOutlined, ReloadOutlined, EditOutlined, CopyOutlined,
  ApartmentOutlined, ExclamationCircleOutlined, EyeOutlined,
  AuditOutlined, RollbackOutlined, PlayCircleOutlined,
  ClockCircleOutlined, BranchesOutlined, SafetyCertificateOutlined,
  ThunderboltOutlined, InfoCircleOutlined, AimOutlined,
  PartitionOutlined,
} from '@ant-design/icons';
import {
  ProcessRouting, RoutingStatus, ROUTING_STATUS_MAP,
  calcTotalTime, countAllSteps, canAudit, canUnaudit, canActivate,
  canDisable, canEnable, canObsolete, canEdit, canDelete,
} from './proData';
import {
  ProcessRoutingRecord,
  getProcessRoutingList,
  createProcessRouting,
  updateProcessRouting,
  deleteProcessRouting,
  batchDeleteProcessRoutings,
  getRoutingStepList,
} from '../../api/processRoutings';
import { getMaterialList } from '../../api/materials';
import './ProPage.css';

interface ProListPageProps {
  onViewDetail: (routing: ProcessRouting) => void;
}

// ── 工厂/车间维度配置 ─────────────────────────────────────────────────
const FACTORY_OPTIONS = [
  { key: 'ALL',  label: '全部工厂',    color: '#1677FF' },
  { key: 'NJ',   label: '南京工厂',    color: '#C8000A', sub: '天美健' },
  { key: 'LS',   label: '溧水工厂',    color: '#7B3FA0', sub: '每日营养' },
];

const WORKSHOP_OPTIONS = [
  { key: 'ALL', label: '全部车间', icon: '🏭' },
  { key: 'GD',  label: '固体车间', icon: '💊', color: '#1677FF',   dosage: '片剂/粉剂' },
  { key: 'RN',  label: '软胶囊车间', icon: '🔵', color: '#722ED1', dosage: '软胶囊' },
  { key: 'YQ',  label: '液体车间', icon: '🧪', color: '#13C2C2',   dosage: '口服液' },
  { key: 'WB',  label: '外包车间', icon: '📦', color: '#FA8C16',   dosage: '赋码包装' },
];

// ── 编码规则参考数据 ──────────────────────────────────────────────────
const ENCODING_RULES = {
  factory:  [
    { code: 'NJ', name: '南京工厂',   fullName: '天美健大自然生物工程（南京）' },
    { code: 'LS', name: '溧水工厂',   fullName: '每日营养（溧水）' },
  ],
  workshop: [
    { code: 'GD', name: '固体车间',   dosage: 'TAB/PWD',   color: '#1677FF' },
    { code: 'RN', name: '软胶囊车间', dosage: 'SGC',        color: '#722ED1' },
    { code: 'YQ', name: '液体车间',   dosage: 'LIQ',        color: '#13C2C2' },
    { code: 'WB', name: '外包车间',   dosage: '—',          color: '#FA8C16' },
  ],
  dosage: [
    { code: 'TAB', name: '片剂',   eg: 'NJ-GD-TAB-001' },
    { code: 'SGC', name: '软胶囊', eg: 'NJ-RN-SGC-001' },
    { code: 'PWD', name: '粉剂',   eg: 'LS-GD-PWD-001' },
    { code: 'LIQ', name: '口服液', eg: 'LS-YQ-LIQ-001' },
  ],
  ops: [
    { code: 'GD-01', name: '称量配料', workshop: '固体车间' },
    { code: 'GD-02', name: '混合',     workshop: '固体车间' },
    { code: 'GD-03', name: '制粒',     workshop: '固体车间' },
    { code: 'GD-04', name: '干燥',     workshop: '固体车间' },
    { code: 'GD-05', name: '压片',     workshop: '固体车间' },
    { code: 'GD-06', name: '铝塑包装', workshop: '固体车间' },
    { code: 'RN-01', name: '化胶',     workshop: '软胶囊车间' },
    { code: 'RN-03', name: '压丸',     workshop: '软胶囊车间' },
    { code: 'YQ-03', name: '灌装',     workshop: '液体车间' },
    { code: 'YQ-04', name: '灭菌',     workshop: '液体车间' },
    { code: 'WB-03', name: '赋码关联', workshop: '外包车间' },
  ],
};

// ── GMP关键控制点说明 ─────────────────────────────────────────────────
const GMP_NOTES = [
  { icon: '🔑', text: 'F0值≥8min（口服液灭菌强制控制点，低于下限强制报废不得返工）', color: '#FF4D4F' },
  { icon: '⚡', text: '瓶颈工序（压片/压丸/灌装）：OPC UA / Modbus TCP 实时采集，不可跳过', color: '#FA8C16' },
  { icon: '📊', text: '物料平衡率标准：96.0~102.0%（全工序必须在EBR中计算并电子签名）', color: '#1677FF' },
  { icon: '✍️', text: 'ALCOA+合规：原始数据不可修改，全流程审计追踪，支持偏差溯源', color: '#52C41A' },
];

// ── 从路径编码解析工厂/车间 ──────────────────────────────────────────
function parseRoutingCode(code: string): { factory: string; workshop: string; dosage: string } {
  const parts = code.split('-');
  return {
    factory:  parts[0] ?? '',
    workshop: parts[1] ?? '',
    dosage:   parts[2] ?? '',
  };
}

// ── 统计路径中QC点和瓶颈工序数量 ─────────────────────────────────────
function countQcAndKeyOps(routing: ProcessRouting): { qc: number; key: number } {
  let qc = 0; let key = 0;
  routing.groups.forEach(g => g.steps.forEach(s => {
    if (s.isQcPoint) qc++;
    if (s.isKeyOp)   key++;
  }));
  return { qc, key };
}

// ── 将后端 ProcessRoutingRecord 映射为前端 ProcessRouting ──────────────
function mapApiToRouting(r: ProcessRoutingRecord): ProcessRouting {
  return {
    id:           String(r.id ?? ''),
    routingCode:  r.routingCode  ?? '',
    routingName:  r.routingName  ?? '',
    productCode:  r.productCode  ?? '',
    productName:  r.productName  ?? '',
    productModel: r.productModel ?? '',
    version:      r.version      ?? 'V1.0',
    isDefault:    (r.isDefault ?? 0) === 1,
    status:       (r.status ?? 'DRAFT') as RoutingStatus,
    remark:       r.description  ?? '',
    createdBy:    r.createBy     ?? '',
    createdAt:    r.createTime   ? r.createTime.slice(0, 10) : '',
    updatedAt:    r.updateTime   ? r.updateTime.slice(0, 10) : '',
    groups:       [],  // 步骤在详情页按需加载
  };
}

// ── 将后端 RoutingStep 列表转为 groups（每步一个 serialGroup）─────────
function buildGroupsFromSteps(steps: any[]): ProcessRouting['groups'] {
  if (!steps || steps.length === 0) return [];
  const sorted = [...steps].sort((a, b) => (a.stepNo ?? 0) - (b.stepNo ?? 0));
  return sorted.map((s, idx) => ({
    id: `G${s.id}`,
    seq: (idx + 1) * 10,
    steps: [{
      id:            `S${s.id}`,
      opId:          `op-${s.id}`,
      opCode:        s.stepCode  ?? `STEP-${s.stepNo ?? idx + 1}`,
      opName:        s.stepName  ?? '',
      opShort:       s.stepName  ?? '',
      workCenter:    '',
      stdTimeMin:    0,
      isKeyOp:       s.stepType === 'KEY',
      isQcPoint:     s.stepType === 'QC',
      isReportPoint: (s.reportPoint ?? 0) === 1,
      phaseCount:    0,
      remark:        s.description ?? '',
    }],
  }));
}

// ── 编码规则展示面板 ──────────────────────────────────────────────────
const EncodingRulesPanel: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <Modal
    title={
      <span>
        <InfoCircleOutlined style={{ color: '#1677FF', marginRight: 8 }} />
        工艺路线编码规则 — 天美健双工厂
      </span>
    }
    open={visible}
    onCancel={onClose}
    footer={<Button onClick={onClose}>关闭</Button>}
    width={760}
  >
    {/* 编码结构 */}
    <div style={{ background: '#f6f8ff', borderRadius: 8, padding: '12px 16px', marginBottom: 16, border: '1px solid #d0e0ff' }}>
      <div style={{ fontWeight: 600, color: '#1677FF', marginBottom: 8, fontSize: 13 }}>
        📐 编码结构：[工厂]-[车间]-[剂型]-[流水号]
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 16, letterSpacing: 2, color: '#1a1a2e', marginBottom: 6 }}>
        <span style={{ background: '#C8000A', color: '#fff', borderRadius: 4, padding: '2px 8px', marginRight: 4 }}>NJ</span>
        <span style={{ color: '#aaa' }}>-</span>
        <span style={{ background: '#1677FF', color: '#fff', borderRadius: 4, padding: '2px 8px', margin: '0 4px' }}>GD</span>
        <span style={{ color: '#aaa' }}>-</span>
        <span style={{ background: '#52C41A', color: '#fff', borderRadius: 4, padding: '2px 8px', margin: '0 4px' }}>TAB</span>
        <span style={{ color: '#aaa' }}>-</span>
        <span style={{ background: '#FA8C16', color: '#fff', borderRadius: 4, padding: '2px 8px', margin: '0 4px' }}>001</span>
      </div>
      <div style={{ fontSize: 11, color: '#666' }}>示例：NJ-GD-TAB-001 = 南京工厂·固体车间·片剂·第1条路线</div>
    </div>

    <Row gutter={16}>
      {/* 工厂代码 */}
      <Col span={12}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>🏭 工厂代码</div>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ padding: '4px 8px', border: '1px solid #f0f0f0', textAlign: 'left' }}>代码</th>
              <th style={{ padding: '4px 8px', border: '1px solid #f0f0f0', textAlign: 'left' }}>工厂</th>
              <th style={{ padding: '4px 8px', border: '1px solid #f0f0f0', textAlign: 'left' }}>全称</th>
            </tr>
          </thead>
          <tbody>
            {ENCODING_RULES.factory.map(f => (
              <tr key={f.code}>
                <td style={{ padding: '4px 8px', border: '1px solid #f0f0f0' }}>
                  <Tag color={f.code === 'NJ' ? 'red' : 'purple'}>{f.code}</Tag>
                </td>
                <td style={{ padding: '4px 8px', border: '1px solid #f0f0f0' }}>{f.name}</td>
                <td style={{ padding: '4px 8px', border: '1px solid #f0f0f0', color: '#888' }}>{f.fullName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Col>
      {/* 车间代码 */}
      <Col span={12}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>🏗 车间代码</div>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ padding: '4px 8px', border: '1px solid #f0f0f0', textAlign: 'left' }}>代码</th>
              <th style={{ padding: '4px 8px', border: '1px solid #f0f0f0', textAlign: 'left' }}>车间</th>
              <th style={{ padding: '4px 8px', border: '1px solid #f0f0f0', textAlign: 'left' }}>剂型</th>
            </tr>
          </thead>
          <tbody>
            {ENCODING_RULES.workshop.map(w => (
              <tr key={w.code}>
                <td style={{ padding: '4px 8px', border: '1px solid #f0f0f0' }}>
                  <Tag color={w.code === 'GD' ? 'blue' : w.code === 'RN' ? 'purple' : w.code === 'YQ' ? 'cyan' : 'orange'}>{w.code}</Tag>
                </td>
                <td style={{ padding: '4px 8px', border: '1px solid #f0f0f0' }}>{w.name}</td>
                <td style={{ padding: '4px 8px', border: '1px solid #f0f0f0', color: '#888' }}>{w.dosage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Col>
    </Row>

    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>💊 剂型代码</div>
      <Row gutter={8}>
        {ENCODING_RULES.dosage.map(d => (
          <Col span={6} key={d.code}>
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: '8px 10px', background: '#fafafa' }}>
              <div style={{ fontWeight: 700, color: '#1677FF', fontFamily: 'monospace' }}>{d.code}</div>
              <div style={{ fontSize: 12, color: '#333' }}>{d.name}</div>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>例：{d.eg}</div>
            </div>
          </Col>
        ))}
      </Row>
    </div>

    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>🔧 工序编码（[车间代码]-[2位流水号]）</div>
      <Row gutter={8}>
        {ENCODING_RULES.ops.map(op => (
          <Col span={8} key={op.code}>
            <div style={{ fontSize: 12, padding: '3px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
              <Tag style={{ fontFamily: 'monospace', minWidth: 52, textAlign: 'center' }}>{op.code}</Tag>
              <span style={{ color: '#555' }}>{op.name}</span>
            </div>
          </Col>
        ))}
      </Row>
    </div>

    {/* GMP关键提示 */}
    <div style={{ marginTop: 16, background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ fontWeight: 600, color: '#FA8C16', marginBottom: 8 }}>⚠️ GMP关键控制要点</div>
      {GMP_NOTES.map((n, i) => (
        <div key={i} style={{ fontSize: 12, color: '#555', marginBottom: 4, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span>{n.icon}</span>
          <span>{n.text}</span>
        </div>
      ))}
    </div>
  </Modal>
);

// ── 工厂/车间快速过滤栏 ───────────────────────────────────────────────
const FactoryWorkshopFilter: React.FC<{
  factoryFilter: string;
  workshopFilter: string;
  onFactoryChange: (f: string) => void;
  onWorkshopChange: (w: string) => void;
  counts: Record<string, number>;
}> = ({ factoryFilter, workshopFilter, onFactoryChange, onWorkshopChange, counts }) => (
  <div style={{
    background: '#fff',
    borderBottom: '1px solid #f0f0f0',
    padding: '8px 16px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  }}>
    {/* 工厂 Tabs */}
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#aaa', marginRight: 4 }}>工厂：</span>
      {FACTORY_OPTIONS.map(f => {
        const active = factoryFilter === f.key;
        const cnt = counts[`factory_${f.key}`] ?? 0;
        return (
          <button
            key={f.key}
            onClick={() => onFactoryChange(f.key)}
            style={{
              border: `1px solid ${active ? f.color : '#d9d9d9'}`,
              borderRadius: 16,
              padding: '2px 10px',
              fontSize: 12,
              cursor: 'pointer',
              background: active ? f.color : '#fff',
              color: active ? '#fff' : '#555',
              fontWeight: active ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s',
            }}
          >
            {f.label}
            {f.key !== 'ALL' && (
              <span style={{
                background: active ? 'rgba(255,255,255,0.3)' : '#f0f0f0',
                borderRadius: 8,
                padding: '0 5px',
                fontSize: 10,
                minWidth: 16,
                textAlign: 'center',
              }}>{cnt}</span>
            )}
          </button>
        );
      })}
    </div>

    <div style={{ height: 20, width: 1, background: '#e8e8e8' }} />

    {/* 车间 Tabs */}
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, color: '#aaa', marginRight: 4 }}>车间：</span>
      {WORKSHOP_OPTIONS.map(w => {
        const active = workshopFilter === w.key;
        const cnt = counts[`ws_${w.key}`] ?? 0;
        return (
          <button
            key={w.key}
            onClick={() => onWorkshopChange(w.key)}
            style={{
              border: `1px solid ${active && w.color ? w.color : '#d9d9d9'}`,
              borderRadius: 16,
              padding: '2px 10px',
              fontSize: 12,
              cursor: 'pointer',
              background: active && w.color ? w.color : '#fff',
              color: active ? (w.color ? '#fff' : '#333') : '#555',
              fontWeight: active ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s',
            }}
          >
            {w.icon} {w.label}
            {w.key !== 'ALL' && (
              <span style={{
                background: active ? 'rgba(255,255,255,0.3)' : '#f0f0f0',
                borderRadius: 8,
                padding: '0 5px',
                fontSize: 10,
                minWidth: 16,
                textAlign: 'center',
              }}>{cnt}</span>
            )}
            {w.key !== 'ALL' && w.dosage && (
              <span style={{ fontSize: 10, opacity: 0.7 }}>({w.dosage})</span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

const ProListPage: React.FC<ProListPageProps> = ({ onViewDetail }) => {
  const [routings, setRoutings]             = useState<ProcessRouting[]>([]);
  const [apiLoading, setApiLoading]         = useState(false);
  const [searchCode, setSearchCode]         = useState('');
  const [searchName, setSearchName]         = useState('');
  const [filterStatus, setFilterStatus]     = useState<string | undefined>();
  const [factoryFilter, setFactoryFilter]   = useState<string>('ALL');
  const [workshopFilter, setWorkshopFilter] = useState<string>('ALL');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showEncodingRules, setShowEncodingRules] = useState(false);

  // 产品物料下拉（用于新建路径时选择关联产品）
  const [materials, setMaterials]           = useState<{ code: string; name: string; spec: string }[]>([]);

  // 新建/编辑弹窗
  const [modalOpen, setModalOpen]           = useState(false);
  const [editingRouting, setEditingRouting] = useState<ProcessRouting | null>(null);
  const [form]                              = Form.useForm();
  const [saving, setSaving]                 = useState(false);

  // 审核弹窗
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditTarget, setAuditTarget]       = useState<ProcessRouting | null>(null);
  const [auditForm]                         = Form.useForm();

  // 停用弹窗
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disableTarget, setDisableTarget]       = useState<ProcessRouting | null>(null);
  const [disableForm]                           = Form.useForm();

  // ── 从 API 加载列表 ─────────────────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      const resp = await getProcessRoutingList() as any;
      const records: ProcessRoutingRecord[] = resp?.data ?? resp ?? [];
      if (Array.isArray(records) && records.length > 0) {
        setRoutings(records.map(mapApiToRouting));
      }
    } catch {
      // graceful fallback: keep existing state (may be from prior load)
    } finally {
      setApiLoading(false);
    }
  }, []);

  // 加载物料列表（用于新建时选择产品）
  const loadMaterials = useCallback(async () => {
    try {
      const resp = await getMaterialList() as any;
      const list = resp?.data ?? resp ?? [];
      setMaterials(Array.isArray(list) ? list.map((m: any) => ({
        code: m.materialCode ?? m.code ?? '',
        name: m.materialName ?? m.name ?? '',
        spec: m.spec ?? m.model ?? '',
      })) : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadFromApi();
    loadMaterials();
  }, [loadFromApi, loadMaterials]);

  // ── 工厂/车间维度统计 ────────────────────────────────────────────────
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    routings.forEach(r => {
      const { factory, workshop } = parseRoutingCode(r.routingCode);
      counts[`factory_${factory}`] = (counts[`factory_${factory}`] ?? 0) + 1;
      counts[`ws_${workshop}`]     = (counts[`ws_${workshop}`]     ?? 0) + 1;
    });
    counts['factory_ALL'] = routings.length;
    counts['ws_ALL']      = routings.length;
    return counts;
  }, [routings]);

  // ── 综合过滤 ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return routings.filter(r => {
      const { factory, workshop } = parseRoutingCode(r.routingCode);
      const codeMatch     = !searchCode   || r.routingCode.toLowerCase().includes(searchCode.toLowerCase());
      const nameMatch     = !searchName   || r.routingName.includes(searchName) || r.productName.includes(searchName);
      const statusMatch   = !filterStatus || r.status === filterStatus;
      const factoryMatch  = factoryFilter  === 'ALL' || factory  === factoryFilter;
      const workshopMatch = workshopFilter === 'ALL' || workshop === workshopFilter;
      return codeMatch && nameMatch && statusMatch && factoryMatch && workshopMatch;
    });
  }, [routings, searchCode, searchName, filterStatus, factoryFilter, workshopFilter]);

  // ── 统计卡片 ────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    routings.length,
    active:   routings.filter(r => r.status === 'ACTIVE').length,
    pending:  routings.filter(r => r.status === 'PENDING').length,
    draft:    routings.filter(r => r.status === 'DRAFT').length,
    disabled: routings.filter(r => r.status === 'DISABLED').length,
  }), [routings]);

  // ── 新建 ────────────────────────────────────────────────────────────
  const handleAdd = () => {
    setEditingRouting(null);
    form.resetFields();
    form.setFieldsValue({ version: 'V1.0', status: 'DRAFT', isDefault: false });
    setModalOpen(true);
  };

  // ── 编辑 ────────────────────────────────────────────────────────────
  const handleEdit = (r: ProcessRouting) => {
    if (!canEdit(r.status)) {
      message.warning('仅草稿或已停用状态可编辑');
      return;
    }
    setEditingRouting(r);
    form.setFieldsValue({
      routingCode: r.routingCode,
      routingName: r.routingName,
      version:     r.version,
      productCode: r.productCode,
      productName: r.productName,
      productModel: r.productModel,
      workshop:    r.workshop,
      productLine: r.productLine,
      isDefault:   r.isDefault,
      applicableSpec: r.applicableSpec,
      remark:      r.remark,
    });
    setModalOpen(true);
  };

  // ── 复制（本地，新建草稿到后端）────────────────────────────────────
  const handleCopy = async (r: ProcessRouting) => {
    try {
      const payload: ProcessRoutingRecord = {
        routingCode:  r.routingCode + '-COPY',
        routingName:  r.routingName + '（复制）',
        productCode:  r.productCode,
        productName:  r.productName,
        productModel: r.productModel,
        version:      'V1.0',
        isDefault:    0,
        status:       'DRAFT',
        description:  r.remark,
        createBy:     'admin',
      };
      await createProcessRouting(payload);
      message.success('复制成功，新路径状态为草稿，请进入详情配置工序步骤');
      await loadFromApi();
    } catch {
      message.error('复制失败');
    }
  };

  // ── 删除 ────────────────────────────────────────────────────────────
  const handleDelete = async (ids: React.Key[]) => {
    const notDraft = routings.filter(r => ids.includes(r.id) && !canDelete(r.status));
    if (notDraft.length > 0) {
      message.error(`${notDraft.map(r => r.routingCode).join(', ')} 不是草稿状态，不可删除`);
      return;
    }
    try {
      const numIds = ids.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
      if (numIds.length > 0) {
        if (numIds.length === 1) {
          await deleteProcessRouting(numIds[0]);
        } else {
          await batchDeleteProcessRoutings(numIds);
        }
      }
      message.success(`已删除 ${ids.length} 条工艺路径`);
      setSelectedRowKeys([]);
      await loadFromApi();
    } catch {
      message.error('删除失败');
    }
  };

  // ── 保存新建/编辑 ────────────────────────────────────────────────────
  const handleSave = () => {
    form.validateFields().then(async values => {
      setSaving(true);
      try {
        const payload: ProcessRoutingRecord = {
          routingCode:  values.routingCode,
          routingName:  values.routingName,
          version:      values.version,
          productCode:  values.productCode,
          productName:  values.productName  ?? '',
          productModel: values.productModel ?? 'DEFAULT',
          status:       'DRAFT',
          isDefault:    values.isDefault ? 1 : 0,
          description:  values.remark ?? '',
          createBy:     'admin',
        };
        if (editingRouting) {
          await updateProcessRouting(Number(editingRouting.id), payload);
          message.success('修改成功');
        } else {
          await createProcessRouting(payload);
          message.success('新建成功，请进入详情配置工序步骤');
        }
        setModalOpen(false);
        await loadFromApi();
      } catch {
        message.error(editingRouting ? '修改失败' : '新建失败');
      } finally {
        setSaving(false);
      }
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 状态流转全部调用后端 updateProcessRouting
  const patchStatus = async (r: ProcessRouting, patch: Partial<ProcessRoutingRecord>) => {
    try {
      await updateProcessRouting(Number(r.id), patch);
      await loadFromApi();
    } catch {
      message.error('操作失败');
    }
  };

  // ── 提交审核 ─────────────────────────────────────────────────────────
  const handleSubmitAudit = async (r: ProcessRouting) => {
    if (r.groups.length === 0) {
      try {
        const resp = await getRoutingStepList({ routingId: Number(r.id) }) as any;
        const steps = resp?.data ?? resp ?? [];
        if (!Array.isArray(steps) || steps.length === 0) {
          message.error('工艺路径中没有配置工序，无法提交审核');
          return;
        }
      } catch { /* network error, allow submit */ }
    }
    await patchStatus(r, { status: 'PENDING' });
    message.success('已提交审核，等待质量工程师审核');
  };

  // ── 审核通过 ─────────────────────────────────────────────────────────
  const openAuditModal = (r: ProcessRouting) => {
    setAuditTarget(r);
    auditForm.resetFields();
    setAuditModalOpen(true);
  };

  const handleAuditPass = () => {
    auditForm.validateFields().then(async values => {
      await patchStatus(auditTarget!, {
        status:      'ACTIVE',
        description: auditTarget!.remark,
        createBy:    values.auditBy,
      });
      setAuditModalOpen(false);
      message.success('审核通过，工艺路径已生效');
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  const handleAuditReject = () => {
    auditForm.validateFields(['auditBy', 'auditRemark']).then(async values => {
      await patchStatus(auditTarget!, {
        status:      'DRAFT',
        description: `[驳回] ${values.auditRemark || ''}`,
        createBy:    values.auditBy,
      });
      setAuditModalOpen(false);
      message.warning('审核驳回，路径退回草稿状态');
    });
  };

  // ── 反审核 ───────────────────────────────────────────────────────────
  const handleUnaudit = async (r: ProcessRouting) => {
    await patchStatus(r, { status: 'DRAFT' });
    message.info('已反审核，路径退回草稿状态');
  };

  // ── 停用 ─────────────────────────────────────────────────────────────
  const openDisableModal = (r: ProcessRouting) => {
    setDisableTarget(r);
    disableForm.resetFields();
    setDisableModalOpen(true);
  };

  const handleDisable = () => {
    disableForm.validateFields().then(async values => {
      await patchStatus(disableTarget!, {
        status:      'DISABLED',
        description: values.reason,
      });
      setDisableModalOpen(false);
      message.success('已停用');
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 启用 ────────────────────────────────────────────────────────────
  const handleEnable = async (r: ProcessRouting) => {
    await patchStatus(r, { status: 'ACTIVE' });
    message.success('已启用，路径恢复生效状态');
  };

  // ── 废止 ────────────────────────────────────────────────────────────
  const handleObsolete = async (r: ProcessRouting) => {
    await patchStatus(r, { status: 'OBSOLETE' });
    message.warning('已废止，该版本路径不可再使用');
  };

  // ── 查看详情（先加载步骤，再打开详情页）────────────────────────────
  const handleViewDetail = async (r: ProcessRouting) => {
    try {
      const resp = await getRoutingStepList({ routingId: Number(r.id) }) as any;
      const steps = resp?.data ?? resp ?? [];
      const groups = buildGroupsFromSteps(Array.isArray(steps) ? steps : []);
      onViewDetail({ ...r, groups });
    } catch {
      onViewDetail(r); // fallback: open without steps
    }
  };

  const hasSelected = selectedRowKeys.length > 0;

  // ── 表格列 ──────────────────────────────────────────────────────────
  const columns: ColumnsType<ProcessRouting> = [
    {
      title: '序号', width: 50, align: 'center' as const,
      render: (_: any, __: any, i: number) => <span style={{ color: '#bbb', fontSize: 12 }}>{i + 1}</span>,
    },
    {
      title: '工艺路径编码', dataIndex: 'routingCode', width: 190,
      render: (v: string, r: ProcessRouting) => {
        const { factory, workshop } = parseRoutingCode(v);
        const factoryColor = factory === 'NJ' ? '#C8000A' : factory === 'LS' ? '#7B3FA0' : '#666';
        const wsOption = WORKSHOP_OPTIONS.find(w => w.key === workshop);
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                className="code-link"
                onClick={() => handleViewDetail(r)}
                style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}
              >
                <BranchesOutlined style={{ marginRight: 4, fontSize: 12 }} />{v}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
              {factory && (
                <span style={{
                  fontSize: 10, padding: '0 5px', borderRadius: 8,
                  background: factoryColor + '15', color: factoryColor,
                  border: `1px solid ${factoryColor}30`,
                }}>
                  {factory === 'NJ' ? '南京' : factory === 'LS' ? '溧水' : factory}
                </span>
              )}
              {wsOption && wsOption.key !== 'ALL' && (
                <span style={{
                  fontSize: 10, padding: '0 5px', borderRadius: 8,
                  background: (wsOption.color ?? '#666') + '15',
                  color: wsOption.color ?? '#666',
                  border: `1px solid ${wsOption.color ?? '#666'}30`,
                }}>
                  {wsOption.icon}{wsOption.label}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: '工艺路径名称 / 产品', dataIndex: 'routingName', width: 210,
      render: (v: string, r: ProcessRouting) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: '#1a1a2e' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>
            {r.productName} · {r.productModel}
          </div>
          {r.workshop && (
            <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>
              <PartitionOutlined style={{ fontSize: 10 }} /> {r.workshop}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '版本', dataIndex: 'version', width: 75, align: 'center' as const,
      render: (v: string, r: ProcessRouting) => (
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#1677FF', fontWeight: 700, fontSize: 13 }}>{v}</span>
          {r.isDefault && <div><Tag color="blue" style={{ fontSize: 10, padding: '0 3px', marginTop: 2 }}>默认</Tag></div>}
        </div>
      ),
    },
    {
      title: '状态', dataIndex: 'status', width: 100, align: 'center' as const,
      render: (v: RoutingStatus) => {
        const s = ROUTING_STATUS_MAP[v] ?? ROUTING_STATUS_MAP['DRAFT'];
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
            color: s.color, background: s.bg, border: `1px solid ${s.border}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            {s.label}
          </span>
        );
      },
    },
    {
      title: '工序 / QC / 瓶颈', width: 120, align: 'center' as const,
      render: (_: any, r: ProcessRouting) => {
        const total    = countAllSteps(r.groups);
        const parallel = r.groups.filter(g => g.steps.length > 1).length;
        const { qc, key } = countQcAndKeyOps(r);
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* 工序步骤数 */}
              <Tooltip title="工序步骤数">
                <span style={{
                  fontSize: 11, padding: '1px 6px', borderRadius: 8,
                  background: total > 0 ? '#e6f7ff' : '#f5f5f5',
                  color: total > 0 ? '#1677FF' : '#ccc',
                  border: '1px solid ' + (total > 0 ? '#91d5ff' : '#e8e8e8'),
                  fontWeight: 700,
                }}>
                  <ApartmentOutlined style={{ fontSize: 9, marginRight: 2 }} />
                  {total > 0 ? total : '—'}步
                </span>
              </Tooltip>

              {/* QC控制点数 */}
              {qc > 0 && (
                <Tooltip title={`${qc}个QC控制点`}>
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 8,
                    background: '#fff7e6', color: '#FA8C16',
                    border: '1px solid #ffd591', fontWeight: 700,
                  }}>
                    <SafetyCertificateOutlined style={{ fontSize: 9, marginRight: 2 }} />
                    {qc}QC
                  </span>
                </Tooltip>
              )}

              {/* 瓶颈工序 */}
              {key > 0 && (
                <Tooltip title={`${key}个瓶颈/关键工序`}>
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 8,
                    background: '#fff2f0', color: '#FF4D4F',
                    border: '1px solid #ffccc7', fontWeight: 700,
                  }}>
                    <ThunderboltOutlined style={{ fontSize: 9, marginRight: 2 }} />
                    {key}关键
                  </span>
                </Tooltip>
              )}
            </div>
            {parallel > 0 && (
              <div style={{ fontSize: 10, color: '#722ED1', marginTop: 2 }}>{parallel}组并行</div>
            )}
          </div>
        );
      },
    },
    {
      title: '总工时(分)', width: 90, align: 'center' as const,
      render: (_: any, r: ProcessRouting) => {
        const t = calcTotalTime(r.groups);
        if (t <= 0) return <span style={{ color: '#ccc' }}>—</span>;
        const hrs = Math.floor(t / 60);
        const mins = t % 60;
        return (
          <Tooltip title={hrs > 0 ? `约${hrs}h${mins > 0 ? mins + 'min' : ''}` : undefined}>
            <span style={{ color: '#333', fontWeight: 500 }}>{t.toFixed(0)}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '更新日期', dataIndex: 'updatedAt', width: 100,
      render: (v: string) => <span style={{ fontSize: 12, color: '#888' }}>{v || '—'}</span>,
    },
    {
      title: '操作', width: 260, fixed: 'right' as const,
      render: (_: any, r: ProcessRouting) => {
        const st = r.status;
        return (
          <Space size={0} wrap style={{ gap: '2px 0' }}>
            <Button type="link" size="small" icon={<EyeOutlined />}
              style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleViewDetail(r)}>
              查看
            </Button>

            {canEdit(st) && (
              <Button type="link" size="small" icon={<EditOutlined />}
                style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleEdit(r)}>
                编辑
              </Button>
            )}

            <Button type="link" size="small" icon={<CopyOutlined />}
              style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleCopy(r)}>
              复制
            </Button>

            <span style={{ color: '#f0f0f0', margin: '0 2px' }}>|</span>

            {st === 'DRAFT' && (
              <Tooltip title="提交给质量工程师审核">
                <Button type="link" size="small" icon={<AuditOutlined />}
                  style={{ padding: '0 4px', fontSize: 12, color: '#FA8C16' }}
                  onClick={() => handleSubmitAudit(r)}>
                  提交审核
                </Button>
              </Tooltip>
            )}

            {st === 'PENDING' && (
              <Tooltip title="审核此工艺路径">
                <Button type="link" size="small" icon={<AuditOutlined />}
                  style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }}
                  onClick={() => openAuditModal(r)}>
                  审核
                </Button>
              </Tooltip>
            )}

            {canUnaudit(st) && (
              <Tooltip title="撤回审核，退回草稿">
                <Button type="link" size="small" icon={<RollbackOutlined />}
                  style={{ padding: '0 4px', fontSize: 12, color: '#888' }}
                  onClick={() => handleUnaudit(r)}>
                  反审核
                </Button>
              </Tooltip>
            )}

            {canDisable(st) && (
              <Tooltip title="停用此工艺路径">
                <Button type="link" danger size="small" icon={<StopOutlined />}
                  style={{ padding: '0 4px', fontSize: 12 }}
                  onClick={() => openDisableModal(r)}>
                  停用
                </Button>
              </Tooltip>
            )}

            {canEnable(st) && (
              <Tooltip title="重新启用此工艺路径">
                <Button type="link" size="small" icon={<PlayCircleOutlined />}
                  style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }}
                  onClick={() => handleEnable(r)}>
                  启用
                </Button>
              </Tooltip>
            )}

            {canObsolete(st) && (
              <Popconfirm
                title="确认废止此工艺路径？"
                description="废止后不可恢复，不可再被生产订单引用"
                icon={<ExclamationCircleOutlined style={{ color: '#FF4D4F' }} />}
                okText="确认废止" cancelText="取消" okButtonProps={{ danger: true }}
                onConfirm={() => handleObsolete(r)}>
                <Button type="link" size="small"
                  style={{ padding: '0 4px', fontSize: 12, color: '#aaa' }}>
                  废止
                </Button>
              </Popconfirm>
            )}

            {canDelete(st) && (
              <Popconfirm
                title="确认删除此工艺路径？"
                icon={<ExclamationCircleOutlined style={{ color: '#E60012' }} />}
                okText="确认" cancelText="取消"
                onConfirm={() => handleDelete([r.id])}>
                <Button type="link" danger size="small" icon={<DeleteOutlined />}
                  style={{ padding: '0 4px', fontSize: 12 }}>
                  删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="pro-page">
      {/* ── 工厂/车间维度过滤栏 ── */}
      <FactoryWorkshopFilter
        factoryFilter={factoryFilter}
        workshopFilter={workshopFilter}
        onFactoryChange={f => { setFactoryFilter(f); setWorkshopFilter('ALL'); }}
        onWorkshopChange={setWorkshopFilter}
        counts={filterCounts}
      />

      {/* ── GMP关键提示横幅 ── */}
      <div style={{
        background: 'linear-gradient(90deg, #fff7e6 0%, #fff 100%)',
        borderBottom: '1px solid #ffd591',
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: '#FA8C16', fontWeight: 600, whiteSpace: 'nowrap' }}>
          ⚠️ GMP关键要点：
        </span>
        <span style={{ fontSize: 11, color: '#555' }}>
          🔑 液体车间：F0值≥8min为强制控制点，低于下限强制报废
        </span>
        <span style={{ fontSize: 11, color: '#555' }}>
          ⚡ 瓶颈工序（压片/压丸/灌装）实时OPC UA/Modbus采集
        </span>
        <span style={{ fontSize: 11, color: '#555' }}>
          📊 全工序物料平衡率标准：96.0~102.0%（EBR电子签名）
        </span>
        <Button
          type="link" size="small"
          icon={<InfoCircleOutlined />}
          style={{ fontSize: 11, padding: '0 4px', color: '#1677FF' }}
          onClick={() => setShowEncodingRules(true)}
        >
          查看编码规则
        </Button>
      </div>

      {/* ── 统计卡片 ── */}
      <div className="pro-stats-bar">
        <div
          className={`pro-stat-item pro-stat-clickable${!filterStatus ? ' pro-stat-active pro-stat-active--all' : ''}`}
          onClick={() => setFilterStatus(undefined)}
        >
          <span className="stat-num" style={{ color: '#1677FF' }}>{stats.total}</span>
          <span className="stat-label">全部路径</span>
        </div>
        <div className="pro-stat-divider" />
        <div
          className={`pro-stat-item pro-stat-clickable${filterStatus === 'ACTIVE' ? ' pro-stat-active pro-stat-active--active' : ''}`}
          onClick={() => setFilterStatus(prev => prev === 'ACTIVE' ? undefined : 'ACTIVE')}
        >
          <span className="stat-num" style={{ color: '#52C41A' }}>{stats.active}</span>
          <span className="stat-label">已生效</span>
        </div>
        <div className="pro-stat-divider" />
        <div
          className={`pro-stat-item pro-stat-clickable${filterStatus === 'PENDING' ? ' pro-stat-active pro-stat-active--pending' : ''}`}
          onClick={() => setFilterStatus(prev => prev === 'PENDING' ? undefined : 'PENDING')}
        >
          <span className="stat-num" style={{ color: '#FA8C16' }}>{stats.pending}</span>
          <span className="stat-label">待审核</span>
        </div>
        <div className="pro-stat-divider" />
        <div
          className={`pro-stat-item pro-stat-clickable${filterStatus === 'DRAFT' ? ' pro-stat-active pro-stat-active--draft' : ''}`}
          onClick={() => setFilterStatus(prev => prev === 'DRAFT' ? undefined : 'DRAFT')}
        >
          <span className="stat-num" style={{ color: '#8C8C8C' }}>{stats.draft}</span>
          <span className="stat-label">草稿</span>
        </div>
        <div className="pro-stat-divider" />
        <div
          className={`pro-stat-item pro-stat-clickable${filterStatus === 'DISABLED' ? ' pro-stat-active pro-stat-active--disabled' : ''}`}
          onClick={() => setFilterStatus(prev => prev === 'DISABLED' ? undefined : 'DISABLED')}
        >
          <span className="stat-num" style={{ color: '#FF4D4F' }}>{stats.disabled}</span>
          <span className="stat-label">已停用</span>
        </div>
        <div style={{ flex: 1 }} />
        <div className="pro-stat-flow">
          <span className="flow-step draft">草稿</span>
          <span className="flow-arrow">→</span>
          <span className="flow-step pending">待审核</span>
          <span className="flow-arrow">→</span>
          <span className="flow-step active">已生效</span>
          <span className="flow-arrow">↔</span>
          <span className="flow-step disabled">已停用</span>
        </div>
      </div>

      {/* ── 搜索栏 ── */}
      <div className="pro-search-bar">
        <Row gutter={8} align="middle" style={{ width: '100%' }}>
          <Col>
            <span className="search-label">编码</span>
            <Input size="small" style={{ width: 160 }} placeholder="工艺路径编码"
              value={searchCode} onChange={e => setSearchCode(e.target.value)} allowClear />
          </Col>
          <Col>
            <span className="search-label">名称/产品</span>
            <Input size="small" style={{ width: 160 }} placeholder="路径名称或产品名"
              value={searchName} onChange={e => setSearchName(e.target.value)} allowClear />
          </Col>
          <Col>
            <span className="search-label">状态</span>
            <Select size="small" style={{ width: 110 }} placeholder="全部" allowClear
              value={filterStatus} onChange={setFilterStatus}
              options={Object.entries(ROUTING_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Col>
          <Col>
            <Button type="primary" size="small" icon={<SearchOutlined />}
              style={{ background: '#C8000A', borderColor: '#C8000A' }}>查询</Button>
          </Col>
          <Col>
            <Button size="small" icon={<ReloadOutlined />} loading={apiLoading}
              onClick={() => {
                setSearchCode(''); setSearchName(''); setFilterStatus(undefined);
                setFactoryFilter('ALL'); setWorkshopFilter('ALL');
                loadFromApi();
              }}>
              刷新
            </Button>
          </Col>
          {(factoryFilter !== 'ALL' || workshopFilter !== 'ALL') && (
            <Col>
              <Tag
                closable
                onClose={() => { setFactoryFilter('ALL'); setWorkshopFilter('ALL'); }}
                color="blue"
                style={{ fontSize: 11 }}
              >
                {factoryFilter !== 'ALL' ? `工厂: ${factoryFilter}` : ''}
                {factoryFilter !== 'ALL' && workshopFilter !== 'ALL' ? ' · ' : ''}
                {workshopFilter !== 'ALL' ? `车间: ${workshopFilter}` : ''}
              </Tag>
            </Col>
          )}
        </Row>
      </div>

      {/* ── 工具栏 ── */}
      <div className="pro-toolbar">
        <div className="toolbar-btns">
          <Button type="primary" icon={<PlusOutlined />}
            className="btn-primary-red" onClick={handleAdd}>
            新建工艺路径
          </Button>
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条工艺路径？（仅草稿可删除）`}
            onConfirm={() => handleDelete(selectedRowKeys)}
            disabled={!hasSelected} okText="确认" cancelText="取消">
            <Button icon={<DeleteOutlined />} size="small" danger disabled={!hasSelected}>
              批量删除
            </Button>
          </Popconfirm>
          <Button
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => setShowEncodingRules(true)}
            style={{ color: '#1677FF', borderColor: '#1677FF' }}
          >
            编码规则参考
          </Button>
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>
          显示 <strong style={{ color: '#333' }}>{filtered.length}</strong> / {routings.length} 条
          {hasSelected && <span style={{ marginLeft: 8, color: '#1677FF' }}>已选 {selectedRowKeys.length} 条</span>}
        </div>
      </div>

      {/* ── 表格 ── */}
      <div className="pro-table-wrap">
        <Table
          rowKey="id"
          dataSource={filtered}
          columns={columns}
          className="pro-table"
          loading={apiLoading}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ pageSize: 20, showTotal: (t) => `共${t}条`, showSizeChanger: true, size: 'small' }}
          scroll={{ x: 1350 }}
          size="small"
          rowClassName={(r) => r.status === 'DISABLED' ? 'row-disabled' : r.status === 'OBSOLETE' ? 'row-obsolete' : ''}
        />
      </div>

      {/* ══ 编码规则参考弹窗 ══ */}
      <EncodingRulesPanel
        visible={showEncodingRules}
        onClose={() => setShowEncodingRules(false)}
      />

      {/* ══ 新建 / 编辑 弹窗 ══ */}
      <Modal
        title={
          <span>
            <span style={{ display: 'inline-block', width: 4, height: 16, background: '#C8000A', borderRadius: 2, marginRight: 8, verticalAlign: 'middle' }} />
            {editingRouting ? '编辑工艺路径基本信息' : '新建工艺路径'}
          </span>
        }
        open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        okText="保存" cancelText="取消" width={640}
        okButtonProps={{ style: { background: '#C8000A', borderColor: '#C8000A' }, loading: saving }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" size="middle" style={{ marginTop: 16 }}>
          {/* 编码规则提示 */}
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16, fontSize: 11 }}
            message={
              <span>
                编码规则：<strong>[工厂]-[车间]-[剂型]-[流水号]</strong>，
                如 <code>NJ-GD-TAB-001</code>（南京·固体车间·片剂·001）
                <Button type="link" size="small" style={{ fontSize: 11, padding: '0 4px' }}
                  onClick={() => setShowEncodingRules(true)}>
                  完整规则 →
                </Button>
              </span>
            }
          />
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="routingCode" label="工艺路径编码"
                rules={[{ required: true, message: '请输入编码' }]}>
                <Input placeholder="如：NJ-GD-TAB-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="version" label="版本号"
                rules={[{ required: true, message: '请输入版本号' }]}>
                <Input placeholder="如：V1.0" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="routingName" label="工艺路径名称"
                rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="如：南京固体车间-维C咀嚼片工艺路线" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="productCode" label="关联产品（物料档案-成品）"
                rules={[{ required: true, message: '请选择关联产品' }]}>
                <Select
                  showSearch placeholder="搜索或选择成品物料" optionFilterProp="label"
                  filterOption={(input, opt) => ((opt?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())}
                  onChange={(val: string) => {
                    const mat = materials.find(m => m.code === val);
                    if (mat) form.setFieldsValue({ productName: mat.name, productModel: mat.spec });
                  }}
                  options={materials.length > 0
                    ? materials.map(m => ({ value: m.code, label: `${m.code}  ${m.name}  ${m.spec}` }))
                    : [{ value: form.getFieldValue('productCode'), label: form.getFieldValue('productCode') }]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productName" label="产品名称">
                <Input readOnly style={{ background: '#fafafa', color: '#555' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productModel" label="产品型号/规格">
                <Input placeholder="如：0.5g×60片/瓶" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isDefault" label="是否默认版本">
                <Select options={[{ value: true, label: '是（默认版本）' }, { value: false, label: '否' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="applicableSpec" label="适用规格范围">
                <Input placeholder="如：片剂 0.5g×60片 | 瓶装" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="工艺路径说明、适用条件等" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ══ 审核弹窗 ══ */}
      <Modal
        title={
          <span>
            <AuditOutlined style={{ color: '#52C41A', marginRight: 8 }} />
            审核工艺路径 — {auditTarget?.routingCode}
          </span>
        }
        open={auditModalOpen}
        onCancel={() => setAuditModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setAuditModalOpen(false)}>取消</Button>,
          <Button key="reject" danger onClick={handleAuditReject} icon={<RollbackOutlined />}>
            驳回（退回草稿）
          </Button>,
          <Button key="pass" type="primary" onClick={handleAuditPass} icon={<CheckCircleOutlined />}
            style={{ background: '#52C41A', borderColor: '#52C41A' }}>
            审核通过（生效）
          </Button>,
        ]}
        width={500}
        destroyOnClose
      >
        {auditTarget && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
            <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{auditTarget.routingName}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {auditTarget.productName} · {auditTarget.productModel} · {auditTarget.version}
            </div>
          </div>
        )}
        <Form form={auditForm} layout="vertical">
          <Form.Item name="auditBy" label="审核人" rules={[{ required: true, message: '请输入审核人姓名' }]}>
            <Input placeholder="请输入审核人姓名" />
          </Form.Item>
          <Form.Item name="auditRemark" label="审核意见">
            <Input.TextArea rows={3} placeholder="通过原因或驳回说明（驳回时必填）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ══ 停用弹窗 ══ */}
      <Modal
        title={
          <span>
            <StopOutlined style={{ color: '#FF4D4F', marginRight: 8 }} />
            停用工艺路径 — {disableTarget?.routingCode}
          </span>
        }
        open={disableModalOpen}
        onOk={handleDisable}
        onCancel={() => setDisableModalOpen(false)}
        okText="确认停用" cancelText="取消"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fff2f0', borderRadius: 6, border: '1px solid #ffccc7' }}>
          <ExclamationCircleOutlined style={{ color: '#FF4D4F', marginRight: 6 }} />
          停用后，该工艺路径不可被新的生产订单引用（已下达订单不受影响）。
        </div>
        <Form form={disableForm} layout="vertical">
          <Form.Item name="reason" label="停用原因" rules={[{ required: true, message: '请输入停用原因' }]}>
            <Input.TextArea rows={3} placeholder="请说明停用原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProListPage;
