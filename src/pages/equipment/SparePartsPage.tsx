/**
 * SparePartsPage.tsx — 备件管理
 * 天美健保健品MES 设备管理模块 - 备件库存子页
 *
 * 增强功能：
 *   1. 汇总卡片可点击快速过滤库存状态
 *   2. 备件台账报表（总库存价值、出入库统计、备件健康度）
 *   3. 每个备件的出入库明细记录（流水账）
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, message, Badge,
  Row, Col, Modal, Form, Drawer, Descriptions, Alert, Progress,
  Tooltip, Tabs, Statistic, Divider, Timeline,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined,
  WarningOutlined, InboxOutlined, MinusCircleOutlined,
  ArrowUpOutlined, ArrowDownOutlined, BarChartOutlined,
  FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import {
  SparePartRecord, SpareStatus,
  mockSpareparts, mockEquipRecords,
} from './equipmentData';
import { getSparePartList, createSparePart, updateSparePart } from '../../api/equipmentSub';
import type { SparePartRecord as SparePartApiRecord } from '../../api/equipmentSub';

const { Option } = Select;
const { TextArea } = Input;

const genId = () => `sp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const genTxId = () => `TX-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

// ══════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════
type TxType = 'IN' | 'OUT' | 'ADJUST' | 'SCRAP';

interface StockTransaction {
  id: string;
  txNo: string;
  partId: string;
  partCode: string;
  partName: string;
  txType: TxType;
  qty: number;
  unit: string;
  unitCost: number;          // 单价
  totalCost: number;         // 金额
  stockBefore: number;       // 前库存
  stockAfter: number;        // 后库存
  relatedEquip?: string;     // 关联设备编码
  relatedFault?: string;     // 关联故障单
  operator: string;
  remark?: string;
  txDate: string;            // 交易日期
  createdAt: string;
}

const TX_TYPE_MAP: Record<TxType, { label: string; color: string; icon: React.ReactNode; sign: string }> = {
  IN:     { label: '入库', color: '#52C41A', icon: <ArrowUpOutlined />,   sign: '+' },
  OUT:    { label: '出库', color: '#1677FF', icon: <ArrowDownOutlined />, sign: '-' },
  ADJUST: { label: '调整', color: '#FAAD14', icon: <CheckCircleOutlined />, sign: '±' },
  SCRAP:  { label: '报废', color: '#FF4D4F', icon: <MinusCircleOutlined />, sign: '-' },
};

const SPARE_STATUS_MAP: Record<SpareStatus, { label: string; color: string; badge: any; filterKey?: string }> = {
  NORMAL:       { label: '正常',    color: '#52C41A', badge: 'success',   filterKey: 'NORMAL' },
  LOW_STOCK:    { label: '库存偏低', color: '#FAAD14', badge: 'warning',  filterKey: 'LOW_STOCK' },
  OUT_OF_STOCK: { label: '缺货',    color: '#FF4D4F', badge: 'error',     filterKey: 'OUT_OF_STOCK' },
};

// ══════════════════════════════════════════════════════════════
// Mock 出入库流水数据
// ══════════════════════════════════════════════════════════════
const initTransactions: StockTransaction[] = [
  {
    id: 'tx-001', txNo: 'TX-20260510-001',
    partId: 'sp-001', partCode: 'SP-GRAN-001', partName: '湿法制粒机密封圈套装',
    txType: 'OUT', qty: 1, unit: '套', unitCost: 180, totalCost: 180,
    stockBefore: 6, stockAfter: 5,
    relatedEquip: 'EQ-GRAN-001', operator: '张师傅', remark: '月度维保更换密封圈', txDate: '2026-05-10', createdAt: '2026-05-10',
  },
  {
    id: 'tx-002', txNo: 'TX-20260425-001',
    partId: 'sp-001', partCode: 'SP-GRAN-001', partName: '湿法制粒机密封圈套装',
    txType: 'IN', qty: 3, unit: '套', unitCost: 180, totalCost: 540,
    stockBefore: 3, stockAfter: 6,
    operator: '张仓管', remark: '定期备件采购补库', txDate: '2026-04-25', createdAt: '2026-04-25',
  },
  {
    id: 'tx-003', txNo: 'TX-20260605-001',
    partId: 'sp-002', partCode: 'SP-FLUID-001', partName: '流化床过滤袋（F7级）',
    txType: 'OUT', qty: 1, unit: '套', unitCost: 320, totalCost: 320,
    stockBefore: 7, stockAfter: 6,
    relatedEquip: 'EQ-FLUID-001', operator: '张师傅', remark: '月度维保更换过滤袋', txDate: '2026-06-05', createdAt: '2026-06-05',
  },
  {
    id: 'tx-004', txNo: 'TX-20260501-001',
    partId: 'sp-002', partCode: 'SP-FLUID-001', partName: '流化床过滤袋（F7级）',
    txType: 'IN', qty: 4, unit: '套', unitCost: 320, totalCost: 1280,
    stockBefore: 3, stockAfter: 7,
    operator: '张仓管', remark: '季度采购批量补库', txDate: '2026-05-01', createdAt: '2026-05-01',
  },
  {
    id: 'tx-005', txNo: 'TX-20260520-001',
    partId: 'sp-003', partCode: 'SP-PRESS-001', partName: 'ZP-35压片机冲模套装',
    txType: 'OUT', qty: 1, unit: '套', unitCost: 8500, totalCost: 8500,
    stockBefore: 3, stockAfter: 2,
    relatedEquip: 'EQ-PRESS-001', operator: '王师傅', remark: '月度维保：主压力轮磨损更换冲模套装', txDate: '2026-05-15', createdAt: '2026-05-15',
  },
  {
    id: 'tx-006', txNo: 'TX-20260401-001',
    partId: 'sp-003', partCode: 'SP-PRESS-001', partName: 'ZP-35压片机冲模套装',
    txType: 'IN', qty: 1, unit: '套', unitCost: 8500, totalCost: 8500,
    stockBefore: 2, stockAfter: 3,
    operator: '张仓管', remark: '备用冲模采购，维持2套安全库存', txDate: '2026-04-01', createdAt: '2026-04-01',
  },
  {
    id: 'tx-007', txNo: 'TX-20260528-001',
    partId: 'sp-006', partCode: 'SP-CAPS-001', partName: '胶囊充填机计量盘套装',
    txType: 'OUT', qty: 1, unit: '套', unitCost: 12000, totalCost: 12000,
    stockBefore: 2, stockAfter: 1,
    relatedEquip: 'EQ-CAPS-001', relatedFault: 'FT-20260528-001',
    operator: '李维修员', remark: '故障维修：计量盘碎屑清理后复用（未消耗），记录出库后入库核销', txDate: '2026-05-28', createdAt: '2026-05-28',
  },
  {
    id: 'tx-008', txNo: 'TX-20260510-002',
    partId: 'sp-007', partCode: 'SP-COLD-001', partName: '冷链柜温度传感器（PT100）',
    txType: 'OUT', qty: 1, unit: '支', unitCost: 280, totalCost: 280,
    stockBefore: 6, stockAfter: 5,
    relatedEquip: 'EQ-COLDCHAIN-001', relatedFault: 'FT-20260510-001',
    operator: '李维修员', remark: '冷链超温故障维修：更换门磁感应器兼换温度传感器', txDate: '2026-05-10', createdAt: '2026-05-10',
  },
  {
    id: 'tx-009', txNo: 'TX-20260601-001',
    partId: 'sp-008', partCode: 'SP-HPLC-001', partName: 'HPLC色谱柱（C18反相）',
    txType: 'OUT', qty: 1, unit: '支', unitCost: 2800, totalCost: 2800,
    stockBefore: 3, stockAfter: 2,
    relatedEquip: 'EQ-HPLC-001',
    operator: '陈检验员', remark: '色谱柱使用达500次更换，保留旧柱备用', txDate: '2026-06-01', createdAt: '2026-06-01',
  },
  {
    id: 'tx-010', txNo: 'TX-20260601-002',
    partId: 'sp-008', partCode: 'SP-HPLC-001', partName: 'HPLC色谱柱（C18反相）',
    txType: 'IN', qty: 1, unit: '支', unitCost: 2800, totalCost: 2800,
    stockBefore: 2, stockAfter: 3,
    operator: '张仓管', remark: '采购补库，维持2支安全库存', txDate: '2026-06-01', createdAt: '2026-06-01',
  },
];

// ══════════════════════════════════════════════════════════════
// 备件台账报表子组件
// ══════════════════════════════════════════════════════════════
interface LedgerPageProps {
  parts: SparePartRecord[];
  transactions: StockTransaction[];
}

const LedgerPage: React.FC<LedgerPageProps> = ({ parts, transactions }) => {
  const [filterPartId, setFilterPartId] = useState<string | undefined>();
  const [filterTxType, setFilterTxType] = useState<string | undefined>();

  const totalValue    = useMemo(() => parts.reduce((s, p) => s + p.currentStock * p.unitCost, 0), [parts]);
  const totalInCost   = useMemo(() => transactions.filter(t => t.txType === 'IN').reduce((s, t) => s + t.totalCost, 0), [transactions]);
  const totalOutCost  = useMemo(() => transactions.filter(t => t.txType === 'OUT' || t.txType === 'SCRAP').reduce((s, t) => s + t.totalCost, 0), [transactions]);
  const outOfStock    = useMemo(() => parts.filter(p => p.status === 'OUT_OF_STOCK').length, [parts]);
  const lowStock      = useMemo(() => parts.filter(p => p.status === 'LOW_STOCK').length, [parts]);

  const filteredTx = useMemo(() => transactions.filter(t =>
    (!filterPartId || t.partId === filterPartId) &&
    (!filterTxType || t.txType === filterTxType)
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [transactions, filterPartId, filterTxType]);

  const txColumns: ColumnsType<StockTransaction> = [
    {
      title: '交易单号', dataIndex: 'txNo', width: 180,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#555', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: '日期', dataIndex: 'txDate', width: 100,
      render: (v: string) => <span style={{ fontSize: 12, color: '#555' }}>{v}</span>,
    },
    {
      title: '备件', dataIndex: 'partCode', width: 190,
      render: (v: string, r: StockTransaction) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>{v}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{r.partName}</div>
        </div>
      ),
    },
    {
      title: '类型', dataIndex: 'txType', width: 80, align: 'center',
      render: (v: TxType) => (
        <Tag color={(TX_TYPE_MAP[v] ?? { color: 'default' }).color} style={{ fontSize: 11 }}>
          {(TX_TYPE_MAP[v] ?? { icon: '' }).icon} {(TX_TYPE_MAP[v] ?? { label: v ?? '-' }).label}
        </Tag>
      ),
    },
    {
      title: '数量', dataIndex: 'qty', width: 90, align: 'center',
      render: (v: number, r: StockTransaction) => (
        <span style={{ fontWeight: 700, color: (TX_TYPE_MAP[r.txType] ?? { color: '#888' }).color, fontSize: 13 }}>
          {(TX_TYPE_MAP[r.txType] ?? { sign: '' }).sign}{v} {r.unit}
        </span>
      ),
    },
    {
      title: '库存变化', width: 120, align: 'center',
      render: (_: any, r: StockTransaction) => (
        <span style={{ fontSize: 12 }}>
          {r.stockBefore} → <b style={{ color: r.stockAfter > r.stockBefore ? '#52C41A' : '#FF4D4F' }}>{r.stockAfter}</b>
        </span>
      ),
    },
    {
      title: '金额', dataIndex: 'totalCost', width: 90, align: 'right',
      render: (v: number, r: StockTransaction) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: (TX_TYPE_MAP[r.txType] ?? { color: '#888' }).color, fontWeight: 600 }}>
          {(TX_TYPE_MAP[r.txType] ?? { sign: '' }).sign}¥{v.toFixed(2)}
        </span>
      ),
    },
    {
      title: '关联设备', dataIndex: 'relatedEquip', width: 130,
      render: (v?: string) => v ? <Tag style={{ fontFamily: 'monospace', fontSize: 10 }}>{v}</Tag> : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: '操作人', dataIndex: 'operator', width: 90,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: '备注', dataIndex: 'remark', width: 180,
      render: (v?: string) => <span style={{ fontSize: 11, color: '#888' }}>{v || '—'}</span>,
    },
  ];

  return (
    <div>
      {/* KPI 统计 */}
      <Row gutter={12} style={{ marginBottom: 14 }}>
        {[
          { title: '当前库存总值', value: `¥${totalValue.toFixed(2)}`, color: '#1677FF', icon: <InboxOutlined />, sub: `${parts.length}种备件` },
          { title: '期间累计入库', value: `¥${totalInCost.toFixed(2)}`, color: '#52C41A', icon: <ArrowUpOutlined />, sub: `${transactions.filter(t => t.txType === 'IN').length}笔入库` },
          { title: '期间累计出库', value: `¥${totalOutCost.toFixed(2)}`, color: '#1677FF', icon: <ArrowDownOutlined />, sub: `${transactions.filter(t => t.txType === 'OUT' || t.txType === 'SCRAP').length}笔出库` },
          { title: '缺货品种', value: `${outOfStock}种`, color: outOfStock > 0 ? '#FF4D4F' : '#52C41A', icon: <WarningOutlined />, sub: `偏低${lowStock}种`, warning: outOfStock > 0 },
        ].map(c => (
          <Col key={c.title} flex="1">
            <div style={{
              background: c.warning ? '#fff1f0' : '#fff',
              border: `1px solid ${c.warning ? '#ffccc7' : '#f0f0f0'}`,
              borderRadius: 10, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: c.color, flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{c.title}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
                  {c.sub && <div style={{ fontSize: 11, color: '#aaa' }}>{c.sub}</div>}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* 备件库存明细表 */}
      <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChartOutlined style={{ color: '#1677FF' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>备件库存台账</span>
        </div>
        <Table
          rowKey="id"
          dataSource={parts}
          size="small"
          pagination={false}
          columns={[
            { title: '备件编码', dataIndex: 'partCode', width: 140,
              render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{v}</span> },
            { title: '备件名称', dataIndex: 'partName', width: 150 },
            { title: '规格', dataIndex: 'partSpec', width: 200, render: (v: string) => <span style={{ fontSize: 11, color: '#666' }}>{v}</span> },
            { title: '单位', dataIndex: 'unit', width: 60, align: 'center' },
            { title: '当前库存', dataIndex: 'currentStock', width: 90, align: 'center',
              render: (v: number, r: SparePartRecord) => (
                <span style={{ fontWeight: 700, fontSize: 14, color: v <= 0 ? '#FF4D4F' : v <= r.safetyStock ? '#FAAD14' : '#52C41A' }}>{v}</span>
              ) },
            { title: '安全库存', dataIndex: 'safetyStock', width: 90, align: 'center',
              render: (v: number) => <span style={{ color: '#888' }}>{v}</span> },
            { title: '单价', dataIndex: 'unitCost', width: 80, align: 'right',
              render: (v: number) => <span style={{ fontFamily: 'monospace' }}>¥{v}</span> },
            { title: '库存价值', width: 100, align: 'right',
              render: (_: any, r: SparePartRecord) => (
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1677FF' }}>¥{(r.currentStock * r.unitCost).toFixed(2)}</span>
              ) },
            { title: '状态', dataIndex: 'status', width: 100, align: 'center',
              render: (v: SpareStatus) => (
                <Badge status={(SPARE_STATUS_MAP[v] ?? { badge: 'default' as any }).badge} text={<span style={{ fontSize: 11, color: (SPARE_STATUS_MAP[v] ?? { color: '#888' }).color, fontWeight: 600 }}>{(SPARE_STATUS_MAP[v] ?? { label: String(v ?? '-') }).label}</span>} />
              ) },
            { title: '库存健康', width: 120,
              render: (_: any, r: SparePartRecord) => {
                const pct = r.safetyStock > 0 ? Math.min(100, (r.currentStock / (r.safetyStock * 2)) * 100) : 100;
                return <Progress percent={Math.round(pct)} size="small" showInfo={false}
                  strokeColor={r.currentStock <= 0 ? '#FF4D4F' : r.currentStock <= r.safetyStock ? '#FAAD14' : '#52C41A'} />;
              } },
            { title: '最后领用', dataIndex: 'lastUsedDate', width: 100,
              render: (v?: string) => <span style={{ fontSize: 11, color: '#888' }}>{v || '—'}</span> },
          ]}
        />
      </div>

      {/* 出入库流水明细 */}
      <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileTextOutlined style={{ color: '#52C41A' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>出入库明细流水</span>
          <Tag style={{ marginLeft: 4 }}>{filteredTx.length} 条</Tag>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Select placeholder="选择备件" value={filterPartId} onChange={setFilterPartId} allowClear style={{ width: 200 }} size="small">
              {parts.map(p => <Option key={p.id} value={p.id}>{p.partCode} — {p.partName}</Option>)}
            </Select>
            <Select placeholder="交易类型" value={filterTxType} onChange={setFilterTxType} allowClear style={{ width: 100 }} size="small">
              {Object.entries(TX_TYPE_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => { setFilterPartId(undefined); setFilterTxType(undefined); }}>重置</Button>
          </div>
        </div>
        <Table
          rowKey="id"
          dataSource={filteredTx}
          columns={txColumns}
          size="small"
          scroll={{ x: 1300, y: 'calc(100vh - 560px)' }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条`, size: 'small' }}
          rowClassName={(r) => r.txType === 'OUT' || r.txType === 'SCRAP' ? '' : ''}
        />
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════
export type SpareCardFilter = 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | undefined;

interface SparePartsPageProps {
  initialCardFilter?: SpareCardFilter;
}

const SparePartsPage: React.FC<SparePartsPageProps> = ({ initialCardFilter }) => {
  const [list, setList] = useState<SparePartRecord[]>(mockSpareparts);

  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getSparePartList() as any;
      const apiList: SparePartApiRecord[] = resp?.data ?? [];
      if (apiList.length > 0) {
        setList(apiList.map(item => ({
          id: String(item.id ?? ''),
          partCode: item.partCode ?? '',
          partName: item.partName ?? '',
          partSpec: item.partSpec ?? '',
          applicableEquips: item.applicableEquips
            ? item.applicableEquips.split(',').filter(Boolean)
            : [],
          unit: item.unit ?? '个',
          currentStock: Number(item.currentStock ?? 0),
          safetyStock: Number(item.safetyStock ?? 0),
          unitCost: Number(item.unitCost ?? 0),
          supplier: item.supplier ?? undefined,
          leadTime: item.leadTime ?? undefined,
          location: item.location ?? undefined,
          status: (item.status ?? 'NORMAL') as SpareStatus,
          lastUsedDate: item.lastUsedDate ?? undefined,
          remark: item.remark ?? '',
        } as unknown as SparePartRecord)));
      }
    } catch { /* 后端不可用时保留 mock */ }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);
  const [transactions, setTransactions] = useState<StockTransaction[]>(initTransactions);
  const [searchText, setSearchText] = useState('');
  // 支持从总览页传入初始卡片过滤
  const [filterStatus, setFilterStatus] = useState<string | undefined>(initialCardFilter);
  const [activeTab, setActiveTab] = useState('inventory');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SparePartRecord | null>(null);
  const [form] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<SparePartRecord | null>(null);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveItem, setReceiveItem] = useState<SparePartRecord | null>(null);
  const [receiveForm] = Form.useForm();

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueItem, setIssueItem] = useState<SparePartRecord | null>(null);
  const [issueForm] = Form.useForm();

  const filtered = useMemo(() => list.filter(s => {
    const t = searchText.toLowerCase();
    return (!t || s.partCode.toLowerCase().includes(t) || s.partName.includes(t) || s.partSpec.includes(t) || (s.supplier || '').includes(t))
      && (!filterStatus || s.status === filterStatus);
  }), [list, searchText, filterStatus]);

  const summary = useMemo(() => ({
    total:      list.length,
    normal:     list.filter(s => s.status === 'NORMAL').length,
    lowStock:   list.filter(s => s.status === 'LOW_STOCK').length,
    outOfStock: list.filter(s => s.status === 'OUT_OF_STOCK').length,
  }), [list]);

  const calcStatus = (current: number, safety: number): SpareStatus => {
    if (current <= 0) return 'OUT_OF_STOCK';
    if (current <= safety) return 'LOW_STOCK';
    return 'NORMAL';
  };

  // 汇总卡片点击过滤逻辑
  const handleCardClick = (key: string | undefined) => {
    setFilterStatus(prev => prev === key ? undefined : key);
    setActiveTab('inventory'); // 切换到库存 Tab
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'NORMAL', unit: '件', safetyStock: 2 });
    setModalOpen(true);
  };

  const handleEdit = (r: SparePartRecord) => {
    setEditing(r);
    form.setFieldsValue({ ...r });
    setModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then(async vals => {
      const status = calcStatus(vals.currentStock, vals.safetyStock);
      const payload: SparePartApiRecord = {
        partCode: vals.partCode || `SP-${Date.now().toString().slice(-6)}`,
        partName: vals.partName, partSpec: vals.spec, unit: vals.unit,
        currentStock: vals.currentStock, safetyStock: vals.safetyStock, unitCost: vals.unitCost,
        supplier: vals.supplier, applicableEquips: vals.equipId, status: status,
      };
      try {
        if (editing) {
          const numId = Number(editing.id);
          if (!isNaN(numId) && numId > 0) await updateSparePart(numId, payload);
          setList(prev => prev.map(s => s.id === editing.id ? { ...s, ...vals, status } : s));
          message.success('备件信息修改成功');
        } else {
          const resp = await createSparePart(payload) as any;
          const newId = String(resp?.data?.id ?? genId());
          setList(prev => [{ ...vals, status, id: newId, partCode: resp?.data?.partCode ?? payload.partCode }, ...prev]);
          message.success('新增备件成功');
        }
      } catch (err: any) { message.error('保存失败：' + (err?.message ?? '')); return; }
      setModalOpen(false);
    }).catch(() => {});
  };

  const handleReceive = (r: SparePartRecord) => {
    setReceiveItem(r);
    receiveForm.resetFields();
    setReceiveOpen(true);
  };

  const handleSaveReceive = () => {
    receiveForm.validateFields().then(vals => {
      const qty = Number(vals.qty);
      const part = receiveItem!;
      const stockBefore = part.currentStock;
      const stockAfter  = stockBefore + qty;
      setList(prev => prev.map(s => {
        if (s.id !== part.id) return s;
        return { ...s, currentStock: stockAfter, status: calcStatus(stockAfter, s.safetyStock) };
      }));
      // 记录流水
      const tx: StockTransaction = {
        id: genId(), txNo: genTxId(),
        partId: part.id, partCode: part.partCode, partName: part.partName,
        txType: 'IN', qty, unit: part.unit,
        unitCost: part.unitCost, totalCost: qty * part.unitCost,
        stockBefore, stockAfter,
        operator: '当前操作员',
        remark: vals.remark,
        txDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setTransactions(prev => [tx, ...prev]);
      message.success(`入库成功：${part.partName} ×${qty} ${part.unit}`);
      setReceiveOpen(false);
    }).catch(() => {});
  };

  const handleIssue = (r: SparePartRecord) => {
    setIssueItem(r);
    issueForm.resetFields();
    setIssueOpen(true);
  };

  const handleSaveIssue = () => {
    issueForm.validateFields().then(vals => {
      const qty = Number(vals.qty);
      const part = issueItem!;
      if (qty > part.currentStock) {
        message.error('出库数量超出当前库存！');
        return;
      }
      const stockBefore = part.currentStock;
      const stockAfter  = stockBefore - qty;
      setList(prev => prev.map(s => {
        if (s.id !== part.id) return s;
        return { ...s, currentStock: stockAfter, status: calcStatus(stockAfter, s.safetyStock), lastUsedDate: new Date().toISOString().slice(0, 10) };
      }));
      // 记录流水
      const tx: StockTransaction = {
        id: genId(), txNo: genTxId(),
        partId: part.id, partCode: part.partCode, partName: part.partName,
        txType: 'OUT', qty, unit: part.unit,
        unitCost: part.unitCost, totalCost: qty * part.unitCost,
        stockBefore, stockAfter,
        relatedEquip: vals.equipCode,
        operator: '当前操作员',
        remark: vals.remark,
        txDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setTransactions(prev => [tx, ...prev]);
      message.success(`出库成功：${part.partName} ×${qty} ${part.unit}`);
      setIssueOpen(false);
    }).catch(() => {});
  };

  // 获取指定备件的出入库流水
  const getPartTransactions = (partId: string) =>
    transactions.filter(t => t.partId === partId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const columns: ColumnsType<SparePartRecord> = [
    {
      title: '备件编码', dataIndex: 'partCode', width: 140,
      render: (v: string, r: SparePartRecord) => (
        <span style={{ color: '#1677FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}
          onClick={() => { setDetailItem(r); setDetailOpen(true); }}>
          {v}
        </span>
      ),
    },
    {
      title: '备件名称', dataIndex: 'partName', width: 150,
      render: (v: string) => <span style={{ fontWeight: 500, fontSize: 13 }}>{v}</span>,
    },
    {
      title: '规格型号', dataIndex: 'partSpec', width: 200,
      render: (v: string) => <span style={{ fontSize: 12, color: '#555' }}>{v}</span>,
    },
    {
      title: '适用设备', dataIndex: 'applicableEquips', width: 200,
      render: (ids: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {ids.slice(0, 2).map(id => {
            const eq = mockEquipRecords.find(e => e.id === id);
            return eq ? <Tag key={id} style={{ fontFamily: 'monospace', fontSize: 10 }}>{eq.equipCode}</Tag> : null;
          })}
          {ids.length > 2 && <Tag style={{ fontSize: 10 }}>+{ids.length - 2}</Tag>}
        </div>
      ),
    },
    {
      title: '库存/安全库存', dataIndex: 'currentStock', width: 140, align: 'center',
      render: (v: number, r: SparePartRecord) => {
        const pct = r.safetyStock > 0 ? Math.min(100, (v / (r.safetyStock * 2)) * 100) : 100;
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: v <= 0 ? '#FF4D4F' : v <= r.safetyStock ? '#FAAD14' : '#52C41A' }}>{v}</span>
              <span style={{ color: '#aaa', fontSize: 11 }}>/ {r.safetyStock}</span>
              <span style={{ fontSize: 11, color: '#888' }}>{r.unit}</span>
            </div>
            <Progress percent={pct} showInfo={false} size="small"
              strokeColor={v <= 0 ? '#FF4D4F' : v <= r.safetyStock ? '#FAAD14' : '#52C41A'} style={{ marginTop: 2 }} />
          </div>
        );
      },
    },
    {
      title: '单价', dataIndex: 'unitCost', width: 80, align: 'right',
      render: (v: number) => <span style={{ fontSize: 12, fontFamily: 'monospace' }}>¥{v}</span>,
    },
    {
      title: '供应商', dataIndex: 'supplier', width: 140,
      render: (v?: string) => v ? <span style={{ fontSize: 12 }}>{v}</span> : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: '采购周期', dataIndex: 'leadTime', width: 80, align: 'center',
      render: (v?: number) => v ? <span style={{ fontSize: 12 }}>{v}天</span> : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: '状态', dataIndex: 'status', width: 90, align: 'center',
      render: (v: SpareStatus) => {
        const m = SPARE_STATUS_MAP[v];
        return <Badge status={m.badge} text={<span style={{ fontSize: 12 }}>{m.label}</span>} />;
      },
    },
    {
      title: '操作', width: 220, fixed: 'right',
      render: (_: any, r: SparePartRecord) => (
        <Space size={0} split={<span style={{ color: '#e8e8e8', margin: '0 1px' }}>|</span>}>
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: '0 4px', fontSize: 12 }}
            onClick={() => { setDetailItem(r); setDetailOpen(true); }}>详情</Button>
          <Button type="link" size="small" icon={<ArrowUpOutlined />} style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }} onClick={() => handleReceive(r)}>入库</Button>
          <Button type="link" size="small" icon={<ArrowDownOutlined />} style={{ padding: '0 4px', fontSize: 12, color: '#1677FF' }} onClick={() => handleIssue(r)} disabled={r.currentStock <= 0}>出库</Button>
          <Button type="link" size="small" style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleEdit(r)}>编辑</Button>
        </Space>
      ),
    },
  ];

  // 汇总卡片数据
  const summaryCards = [
    { key: undefined,       label: '备件种类', value: summary.total,      color: '#1677FF' },
    { key: 'NORMAL',        label: '正常',     value: summary.normal,     color: '#52C41A' },
    { key: 'LOW_STOCK',     label: '库存偏低', value: summary.lowStock,   color: '#FAAD14' },
    { key: 'OUT_OF_STOCK',  label: '缺货',     value: summary.outOfStock, color: '#FF4D4F' },
  ];

  const tabItems = [
    {
      key: 'inventory',
      label: <span><InboxOutlined />库存管理</span>,
      children: (
        <div>
          {(summary.lowStock > 0 || summary.outOfStock > 0) && (
            <Alert type={summary.outOfStock > 0 ? 'error' : 'warning'} showIcon banner
              message={`${summary.outOfStock > 0 ? `${summary.outOfStock}种备件已缺货；` : ''}${summary.lowStock > 0 ? `${summary.lowStock}种备件库存偏低，请及时补货。` : ''}`}
              style={{ marginBottom: 10, borderRadius: 8 }} />
          )}
          {/* 搜索栏 */}
          <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 10, border: '1px solid #f0f0f0' }}>
            <Row gutter={10} align="middle">
              <Col flex="none">
                <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="备件编码/名称/规格/供应商"
                  value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 240 }} allowClear />
              </Col>
              <Col flex="none">
                <Select placeholder="库存状态" value={filterStatus} onChange={v => setFilterStatus(v)} allowClear style={{ width: 120 }}>
                  {Object.entries(SPARE_STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
                </Select>
              </Col>
              <Col flex="none">
                <Button icon={<ReloadOutlined />} onClick={() => { setSearchText(''); setFilterStatus(undefined); }}>重置</Button>
              </Col>
              <Col flex="auto" style={{ textAlign: 'right' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增备件</Button>
              </Col>
            </Row>
          </div>
          {/* 表格 */}
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
              <InboxOutlined style={{ color: '#1677FF' }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>备件库存</span>
              <Tag style={{ marginLeft: 4 }}>{filtered.length} 种</Tag>
              {filterStatus && <Tag color={SPARE_STATUS_MAP[filterStatus as SpareStatus]?.color}>已筛选：{SPARE_STATUS_MAP[filterStatus as SpareStatus]?.label}</Tag>}
            </div>
            <Table rowKey="id" dataSource={filtered} columns={columns} size="small"
              scroll={{ x: 1400, y: 'calc(100vh - 430px)' }}
              pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 种`, size: 'small' }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'ledger',
      label: <span><BarChartOutlined />台账报表</span>,
      children: <LedgerPage parts={list} transactions={transactions} />,
    },
  ];

  return (
    <div>
      {/* 汇总卡片（可点击过滤） */}
      <Row gutter={10} style={{ marginBottom: 12 }}>
        {summaryCards.map(c => {
          const isActive = filterStatus === c.key;
          return (
            <Col key={c.label} flex="1">
              <Tooltip title={c.key ? `点击筛选"${c.label}"状态` : '点击查看全部'}>
                <div
                  onClick={() => handleCardClick(c.key)}
                  style={{
                    background: isActive ? `${c.color}12` : '#fff',
                    border: `1px solid ${isActive ? c.color : (c.value > 0 && c.label !== '正常' && c.label !== '备件种类' ? c.color + '60' : '#f0f0f0')}`,
                    borderRadius: 8, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isActive ? `0 0 0 2px ${c.color}30` : '0 1px 4px rgba(0,0,0,.04)',
                  }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: c.color }}>
                    <InboxOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
                    <div style={{ fontSize: 11, color: isActive ? c.color : '#888' }}>{c.label}</div>
                  </div>
                  {isActive && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: c.color }} />}
                </div>
              </Tooltip>
            </Col>
          );
        })}
      </Row>

      {/* Tab 子页 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="middle"
        style={{ background: 'transparent' }}
        tabBarStyle={{ background: '#fff', borderRadius: '8px 8px 0 0', paddingLeft: 12, marginBottom: 0 }}
      />

      {/* 新增/编辑 Modal */}
      <Modal title={editing ? '编辑备件' : '新增备件'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        okText="保存" cancelText="取消" width={640} destroyOnClose>
        <Form form={form} layout="vertical" size="middle" style={{ marginTop: 12 }}>
          <Row gutter={14}>
            <Col span={12}><Form.Item name="partCode" label="备件编码"><Input placeholder="SP-GRIND-001" /></Form.Item></Col>
            <Col span={12}><Form.Item name="partName" label="备件名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="partSpec" label="规格型号" rules={[{ required: true }]}><Input placeholder="详细规格，包括材质、尺寸等" /></Form.Item></Col>
            <Col span={8}><Form.Item name="unit" label="单位"><Input placeholder="件/套/L" /></Form.Item></Col>
            <Col span={8}><Form.Item name="currentStock" label="当前库存" rules={[{ required: true }]}><Input type="number" min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item name="safetyStock" label="安全库存" rules={[{ required: true }]}><Input type="number" min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item name="unitCost" label="单价(¥)"><Input type="number" min={0} step={0.01} /></Form.Item></Col>
            <Col span={8}><Form.Item name="supplier" label="供应商"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="leadTime" label="采购周期(天)"><Input type="number" min={1} /></Form.Item></Col>
            <Col span={12}><Form.Item name="location" label="存放位置"><Input placeholder="辅料库A区-001" /></Form.Item></Col>
            <Col span={24}><Form.Item name="remark" label="备注"><TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* 入库 Modal */}
      <Modal title={<Space><ArrowUpOutlined style={{ color: '#52C41A' }} /><span>备件入库 — {receiveItem?.partName}</span></Space>}
        open={receiveOpen} onOk={handleSaveReceive} onCancel={() => setReceiveOpen(false)}
        okText="确认入库" okButtonProps={{ style: { background: '#52C41A', border: 'none' } }} cancelText="取消" width={420} destroyOnClose>
        {receiveItem && (
          <div style={{ background: '#f6f6f6', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 12 }}>
            当前库存：<b style={{ color: '#1677FF' }}>{receiveItem.currentStock} {receiveItem.unit}</b>
            　安全库存：{receiveItem.safetyStock} {receiveItem.unit}
            　单价：¥{receiveItem.unitCost}
          </div>
        )}
        <Form form={receiveForm} layout="vertical" size="middle" style={{ marginTop: 12 }}>
          <Form.Item name="qty" label="入库数量" rules={[{ required: true, message: '请填写数量' }]}>
            <Input type="number" min={1} addonAfter={receiveItem?.unit} />
          </Form.Item>
          <Form.Item name="remark" label="备注/来源">
            <Input placeholder="采购入库/退料入库等" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 出库 Modal */}
      <Modal title={<Space><ArrowDownOutlined style={{ color: '#1677FF' }} /><span>备件出库 — {issueItem?.partName}</span></Space>}
        open={issueOpen} onOk={handleSaveIssue} onCancel={() => setIssueOpen(false)}
        okText="确认出库" cancelText="取消" width={420} destroyOnClose>
        {issueItem && <div style={{ background: '#f6f6f6', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 12 }}>
          当前库存：<b style={{ color: issueItem.currentStock <= issueItem.safetyStock ? '#FAAD14' : '#1677FF' }}>{issueItem.currentStock} {issueItem.unit}</b>
          　安全库存：{issueItem.safetyStock} {issueItem.unit}
        </div>}
        <Form form={issueForm} layout="vertical" size="middle">
          <Form.Item name="qty" label="出库数量" rules={[{ required: true }]}>
            <Input type="number" min={1} max={issueItem?.currentStock} addonAfter={issueItem?.unit} />
          </Form.Item>
          <Form.Item name="equipCode" label="领用设备编码">
            <Input placeholder="EQ-GRAN-001" />
          </Form.Item>
          <Form.Item name="remark" label="用途/备注">
            <Input placeholder="设备维修/保养使用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情 Drawer（含出入库明细） */}
      <Drawer
        title={<Space><InboxOutlined style={{ color: '#1677FF' }} /><span>备件详情 — {detailItem?.partCode}</span></Space>}
        open={detailOpen} onClose={() => setDetailOpen(false)} width={600}
        extra={
          <Space>
            <Button icon={<ArrowUpOutlined />} style={{ color: '#52C41A', borderColor: '#52C41A' }}
              onClick={() => { setDetailOpen(false); if (detailItem) handleReceive(detailItem); }}>入库</Button>
            <Button icon={<ArrowDownOutlined />} disabled={!detailItem || detailItem.currentStock <= 0}
              onClick={() => { setDetailOpen(false); if (detailItem) handleIssue(detailItem); }}>出库</Button>
          </Space>
        }>
        {detailItem && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Badge status={(SPARE_STATUS_MAP[detailItem.status] ?? { badge: 'default' as any }).badge}
                text={<span style={{ fontWeight: 600, color: (SPARE_STATUS_MAP[detailItem.status] ?? { color: '#888' }).color, fontSize: 14 }}>{(SPARE_STATUS_MAP[detailItem.status] ?? { label: String(detailItem.status ?? '-') }).label}</span>} />
            </div>
            <Descriptions bordered size="small" column={2} labelStyle={{ width: 110, fontWeight: 500 }}>
              <Descriptions.Item label="备件编码"><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{detailItem.partCode}</span></Descriptions.Item>
              <Descriptions.Item label="备件名称">{detailItem.partName}</Descriptions.Item>
              <Descriptions.Item label="规格型号" span={2}>{detailItem.partSpec}</Descriptions.Item>
              <Descriptions.Item label="当前库存">
                <span style={{ fontWeight: 700, fontSize: 16, color: detailItem.currentStock <= 0 ? '#FF4D4F' : detailItem.currentStock <= detailItem.safetyStock ? '#FAAD14' : '#52C41A' }}>
                  {detailItem.currentStock} {detailItem.unit}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="安全库存">{detailItem.safetyStock} {detailItem.unit}</Descriptions.Item>
              <Descriptions.Item label="单价">¥{detailItem.unitCost}</Descriptions.Item>
              <Descriptions.Item label="库存价值">
                <span style={{ fontWeight: 700, color: '#1677FF' }}>¥{(detailItem.currentStock * detailItem.unitCost).toFixed(2)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="供应商">{detailItem.supplier || '—'}</Descriptions.Item>
              <Descriptions.Item label="采购周期">{detailItem.leadTime ? `${detailItem.leadTime}天` : '—'}</Descriptions.Item>
              <Descriptions.Item label="存放位置" span={2}>{detailItem.location || '—'}</Descriptions.Item>
              <Descriptions.Item label="适用设备" span={2}>
                {detailItem.applicableEquips.map(id => {
                  const eq = mockEquipRecords.find(e => e.id === id);
                  return eq ? <Tag key={id} style={{ fontFamily: 'monospace', fontSize: 11, marginBottom: 3 }}>{eq.equipCode} {eq.equipName}</Tag> : null;
                })}
              </Descriptions.Item>
              <Descriptions.Item label="最后领用">{detailItem.lastUsedDate || '—'}</Descriptions.Item>
              {detailItem.remark && <Descriptions.Item label="备注" span={2}>{detailItem.remark}</Descriptions.Item>}
            </Descriptions>

            {/* 出入库明细流水 */}
            <Divider style={{ margin: '16px 0 8px' }}>
              <span style={{ fontSize: 12, color: '#888' }}>
                <FileTextOutlined style={{ marginRight: 4 }} />出入库明细记录
              </span>
            </Divider>
            {(() => {
              const txList = getPartTransactions(detailItem.id);
              if (txList.length === 0) return (
                <div style={{ textAlign: 'center', color: '#ccc', padding: '12px 0', fontSize: 12 }}>暂无出入库记录</div>
              );
              return (
                <Timeline style={{ marginTop: 8 }}>
                  {txList.map(tx => (
                    <Timeline.Item
                      key={tx.id}
                      color={(TX_TYPE_MAP[tx.txType] ?? { color: '#888' }).color}
                      dot={<div style={{ width: 16, height: 16, borderRadius: '50%', background: (TX_TYPE_MAP[tx.txType] ?? { color: '#888' }).color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9 }}>{(TX_TYPE_MAP[tx.txType] ?? { sign: '' }).sign}</div>}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '2px 0 8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <Tag color={(TX_TYPE_MAP[tx.txType] ?? { color: '#888' }).color} style={{ fontSize: 11 }}>{(TX_TYPE_MAP[tx.txType] ?? { label: tx.txType ?? '-' }).label}</Tag>
                            <span style={{ fontWeight: 700, fontSize: 13, color: (TX_TYPE_MAP[tx.txType] ?? { color: '#888' }).color }}>
                              {(TX_TYPE_MAP[tx.txType] ?? { sign: '' }).sign}{tx.qty} {tx.unit}
                            </span>
                            <span style={{ color: '#888', fontSize: 11 }}>{tx.stockBefore} → {tx.stockAfter}</span>
                            <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 11, color: (TX_TYPE_MAP[tx.txType] ?? { color: '#888' }).color, fontWeight: 600 }}>
                              {(TX_TYPE_MAP[tx.txType] ?? { sign: '' }).sign}¥{tx.totalCost.toFixed(2)}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: '#888' }}>
                            <ClockCircleOutlined style={{ marginRight: 3 }} />{tx.txDate}
                            　操作人：{tx.operator}
                            {tx.relatedEquip && <span>　设备：<Tag style={{ fontFamily: 'monospace', fontSize: 10 }}>{tx.relatedEquip}</Tag></span>}
                          </div>
                          {tx.remark && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{tx.remark}</div>}
                          <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#ccc', marginTop: 2 }}>{tx.txNo}</div>
                        </div>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              );
            })()}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SparePartsPage;
