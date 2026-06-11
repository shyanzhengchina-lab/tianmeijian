/**
 * 生产订单页面（L1）
 * 功能：新增（多规格明细行）/ 修改 / 删除 / 审核 / 反审核 / 下推生产工单
 * ================================================================
 * 多物料生产订单：
 *   - 一张订单可包含多行不同规格的产品
 *   - 每行选择成品物料（从FINISHED_GOODS目录选择），填写计划数量
 *   - 下推时按行分别生成工单（每行按GMP单批≤5000支自动拆批）
 * ================================================================
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getProductionOrderList, createProductionOrder, updateProductionOrder, deleteProductionOrder, batchDeleteProductionOrders } from '../../api/productionOrders';
import { getWorkOrderList, createWorkOrder, batchDeleteWorkOrders } from '../../api/workOrders';
import { batchDeleteTaskOrders, getTaskOrderList } from '../../api/taskOrders';
import { batchDeleteFloatTickets, getFloatTicketList } from '../../api/floatTickets';
import { batchDeleteInspectionTasks, getInspectionTaskList } from '../../api/inspectionTasks';
import type { WorkOrderRecord } from '../../api/workOrders';
import { getMaterialList } from '../../api/materials';
import type { MaterialRecord } from '../../api/materials';
import {
  Button, Input, Select, Drawer, message, Modal, Form,
  InputNumber, Tag, Popconfirm, Tooltip, Alert, Table,
  Divider, Badge, DatePicker, Spin,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  SearchOutlined, PlusOutlined, ReloadOutlined, EyeOutlined,
  EditOutlined, DeleteOutlined, CheckOutlined, RollbackOutlined,
  DownloadOutlined, FileTextOutlined, NodeIndexOutlined,
  MinusCircleOutlined, AppstoreAddOutlined, InfoCircleOutlined,
  QrcodeOutlined, PrinterOutlined, CopyOutlined,
} from '@ant-design/icons';
import {
  getUdiList, createUdiRecord, updateUdiRecord, printUdiRecord,
} from '../../api/udi';
import type { UdiRecord } from '../../api/udi';
import {
  getMaterialDiByMaterialId,
} from '../../api/udi';
import {
  loadPiRule, loadDiMap, loadUdiRecords, saveUdiRecords,
  generateUdiRecord, getUdiByOrderNo, buildUdiString,
} from '../udi/udiUtils';
import {
  ProductionOrder, WorkOrder, POLineItem,
  PO_STATUS, WO_STATUS, POStatus,
  PRIORITY_MAP,
  ROUTING_MASTERS,
  FINISHED_GOODS, FinishedGood,
  mockProductionOrders, mockWorkOrders,
  genWONo,
} from './workOrderData';
import { STORE_KEYS, saveWorkOrders, clearProductionData, isUserCleared, setUserCleared } from '../../store/mesStore';
import { mockRoutingMasters } from '../pro/seriesData';
import type { RoutingMaster as RMFull } from '../pro/seriesData';
import './WorkOrderPage.css';

const { Option } = Select;
const { TextArea } = Input;

const genId    = (p: string) => `${p}${Date.now()}${Math.floor(Math.random() * 100)}`;
const todayFmt = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const nowStr   = () => new Date().toLocaleString('zh-CN');
const genMONo  = () => `MO-${todayFmt()}-${String(Math.floor(Math.random() * 900) + 100)}`;

/**
 * 根据成品物料获取适用工艺路径列表（从 seriesData 读取已启用路径）
 * 匹配优先级：
 *   1. bindMaterialCodes 精确绑定该物料编码的路径（客户定制/特殊变体）
 *   2. 相同 seriesCode 的路径（系列通用路径）
 *   3. 兜底：全部已启用路径
 * 只返回 status === 'ENABLED' 的路径，并将精确绑定项排在前面。
 */
function getApplicableRoutings(fg: FinishedGood | null): RMFull[] {
  // 读取 localStorage 中可能被用户修改过的路径，否则用 mock 数据
  let all: RMFull[] = mockRoutingMasters;
  try {
    const stored = localStorage.getItem('bip_routings');
    if (stored) all = JSON.parse(stored) as RMFull[];
  } catch { /* ignore */ }

  const enabled = all.filter(r => r.status === 'ENABLED');
  if (!fg) return enabled;

  // 1. 精确绑定该物料的路径
  const bound = enabled.filter(r =>
    r.bindMaterialCodes && r.bindMaterialCodes.includes(fg.code)
  );
  // 2. 同产品系列的路径（排除已计入 bound 的）
  const sameSeries = enabled.filter(r =>
    r.seriesCode === fg.seriesCode &&
    !(r.bindMaterialCodes && r.bindMaterialCodes.length > 0)
  );
  // 3. 若前两类都为空则兜底返回全部已启用
  const result = [...bound, ...sameSeries];
  return result.length > 0 ? result : enabled;
}

/** 按路径编码查找路径记录，兼容新旧两套编码体系（RT-RKQ-* 和 YS-RKQ-*）。 */
interface RoutingDisplay {
  name: string;
  version: string;
  code: string;
  applicableSpec: string;
  stepCount: number;
}
function findRoutingByCode(code: string): RoutingDisplay | null {
  if (!code) return null;
  let all: RMFull[] = mockRoutingMasters;
  try {
    const stored = localStorage.getItem('bip_routings');
    if (stored) all = JSON.parse(stored) as RMFull[];
  } catch { /* ignore */ }
  const rm = all.find(r => r.routingCode === code);
  if (rm) return {
    name: rm.routingName,
    version: rm.version,
    code: rm.routingCode,
    applicableSpec: rm.specRangeExpr || '',
    stepCount: rm.opCount ?? (rm.groups ? rm.groups.reduce((s: number, g: { steps?: unknown[] }) => s + (g.steps?.length || 0), 0) : 0),
  };
  const old = ROUTING_MASTERS.find(r => r.code === code);
  if (old) return {
    name: old.name,
    version: old.version,
    code: old.code,
    applicableSpec: old.applicableSpec,
    stepCount: old.steps.length,
  };
  return null;
}

// ── 订单卡片 ──────────────────────────────────────────────────────
const POCard: React.FC<{
  po: ProductionOrder;
  wos: WorkOrder[];
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAudit: () => void;
  onUnaudit: () => void;
  onPushWO: () => void;
  onUdi: () => void;
}> = ({ po, wos, onClick, onEdit, onDelete, onAudit, onUnaudit, onPushWO, onUdi }) => {
  const sc      = PO_STATUS[po.status];
  const pri     = PRIORITY_MAP[po.priority];
  const relWOs  = wos.filter(w => w.poId === po.id);
  const done    = relWOs.filter(w => w.status === 'COMPLETED').length;
  const doneQty = relWOs.reduce((s, w) => s + (w.actualQty || 0), 0);
  const pct     = po.totalQty > 0 ? Math.round((doneQty / po.totalQty) * 100) : 0;
  const isMultiLine = po.lineItems && po.lineItems.length > 1;

  return (
    <div className="wo-card" onClick={onClick}>
      <div className="wo-card-accent" style={{ background: sc.color }} />
      <div className="wo-card-body">
        <div className="wo-row1">
          <span className="wo-no">{po.orderNo}</span>
          {po.soNo && <span className="wo-ref">销售单: {po.soNo}</span>}
          <span className="wo-status-badge" style={{ color: sc.color, background: sc.bg }}>
            {sc.label}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: pri.color, background: `${pri.color}18`, padding: '1px 6px', borderRadius: 8, border: `1px solid ${pri.color}40` }}>
            {pri.label}
          </span>
          {isMultiLine && (
            <Tag color="blue" style={{ fontSize: 10, padding: '0 5px' }}>
              多规格 {po.lineItems!.length}行
            </Tag>
          )}
          {po.isAudited
            ? <Tag color="green"   style={{ fontSize: 10, padding: '0 5px' }}>已审核</Tag>
            : <Tag color="default" style={{ fontSize: 10, padding: '0 5px' }}>待审核</Tag>}
        </div>

        {/* 单规格订单：显示产品规格 */}
        {!isMultiLine && (
          <div className="wo-row2">
            <span className="wo-product">{po.productName} — {po.productSpec}</span>
          </div>
        )}

        {/* 多规格订单：折叠展示每行规格 */}
        {isMultiLine && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '4px 0 6px' }}>
            {po.lineItems!.map((item, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '1px 8px', borderRadius: 10,
                background: '#f0f7ff', border: '1px solid #bae0ff', color: '#0958d9',
              }}>
                行{item.lineNo}：{item.productSpec}
                <span style={{ color: '#98a2b3', marginLeft: 4 }}>
                  {item.planQty.toLocaleString()}支
                </span>
              </span>
            ))}
          </div>
        )}

        <div className="wo-row3">
          <span className="wo-pill">总量 <b>{po.totalQty.toLocaleString()} 支</b></span>
          <span className="wo-pill">交期 <b>{po.deliveryDate}</b></span>
          <span className="wo-pill">工单 <b>{relWOs.length}</b> 张（完成 {done}）</span>
          {pct > 0 && <span className="wo-pill green">完成率 <b>{pct}%</b></span>}
          {!isMultiLine && (() => {
            const routing = findRoutingByCode(po.routingCode);
            return routing ? (
              <span className="wo-pill" style={{ color: '#531dab', borderColor: '#d3adf7' }}>
                <NodeIndexOutlined style={{ marginRight: 3 }} />{routing.name} {routing.version}
              </span>
            ) : null;
          })()}
        </div>
        {pct > 0 && (
          <div className="wo-progress-row">
            <div className="wo-progress-track">
              <div className="wo-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="wo-progress-pct">{pct}%</span>
          </div>
        )}
        <div className="wo-row4">
          <span className="wo-meta">🕒 {po.createdAt}</span>
          <span className="wo-meta">👤 {po.createdBy}</span>
          {po.remark && (
            <span className="wo-meta" style={{ color: '#faad14' }}>
              📝 {po.remark.slice(0, 30)}{po.remark.length > 30 ? '…' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="wo-card-actions" onClick={e => e.stopPropagation()}>
        <Tooltip title="查看详情">
          <Button size="small" type="text" icon={<EyeOutlined />} onClick={onClick} />
        </Tooltip>
        {po.status === 'OPEN' && !po.isAudited && (
          <Tooltip title="编辑">
            <Button size="small" type="text" icon={<EditOutlined />} onClick={onEdit} />
          </Tooltip>
        )}
        {!po.isAudited && (
          <Tooltip title="审核">
            <Button size="small" type="text" icon={<CheckOutlined />} style={{ color: '#52c41a' }} onClick={onAudit} />
          </Tooltip>
        )}
        {po.isAudited && po.status === 'OPEN' && (
          <Tooltip title="反审核">
            <Button size="small" type="text" icon={<RollbackOutlined />} style={{ color: '#faad14' }} onClick={onUnaudit} />
          </Tooltip>
        )}
        {po.isAudited && (po.status === 'OPEN' || po.status === 'RELEASED' || po.status === 'IN_PROGRESS') && (
          <Tooltip title="下推工单">
            <Button size="small" type="text" icon={<DownloadOutlined />} style={{ color: '#1677ff' }} onClick={onPushWO} />
          </Tooltip>
        )}
        {po.isAudited && (
          <Tooltip title="生成/打印UDI">
            <Button size="small" type="text" icon={<QrcodeOutlined />} style={{ color: '#722ed1' }} onClick={onUdi} />
          </Tooltip>
        )}
        {po.status === 'OPEN' && !po.isAudited && (
          <Tooltip title="删除">
            <Popconfirm
              title="确认删除此生产订单？"
              description="删除后无法恢复"
              onConfirm={onDelete}
              okText="确认删除" cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" type="text" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

// ── 订单详情抽屉 ──────────────────────────────────────────────────
const PODetailDrawer: React.FC<{
  po: ProductionOrder | null;
  wos: WorkOrder[];
  open: boolean;
  onClose: () => void;
  onNavigateToWO?: (woId: string) => void;
}> = ({ po, wos, open, onClose, onNavigateToWO }) => {
  if (!po) return null;
  const sc      = PO_STATUS[po.status];
  const relWOs  = wos.filter(w => w.poId === po.id);
  const doneQty = relWOs.reduce((s, w) => s + (w.actualQty || 0), 0);
  const pct     = po.totalQty > 0 ? Math.round((doneQty / po.totalQty) * 100) : 0;
  const isMulti = po.lineItems && po.lineItems.length > 0;

  return (
    <Drawer
      open={open} onClose={onClose} width={500}
      title={<span><FileTextOutlined style={{ marginRight: 6, color: '#1677ff' }} />生产订单详情</span>}
      styles={{ header: { background: '#fff', borderBottom: '1px solid #e8ecf0' }, body: { background: '#f5f7fa', padding: 16 } }}
    >
      <div className="wd-section">
        <div className="wd-title">
          📋 基本信息
          <span style={{ color: sc.color, marginLeft: 8, fontSize: 12 }}>{sc.label}</span>
          {po.isAudited
            ? <Tag color="green"   style={{ marginLeft: 8, fontSize: 10 }}>已审核</Tag>
            : <Tag color="default" style={{ marginLeft: 8, fontSize: 10 }}>待审核</Tag>}
          {isMulti && <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>多规格订单</Tag>}
        </div>
        {([
          ['订单号',   po.orderNo],
          ['销售订单', po.soNo || '-'],
          ['总计划量', `${po.totalQty.toLocaleString()} 支`],
          ['交货日期', po.deliveryDate],
          ['优先级',   PRIORITY_MAP[po.priority]?.label || '-'],
          ['备注',     po.remark || '-'],
          ['创建人',   po.createdBy],
          ['创建时间', po.createdAt],
        ] as [string, string][]).map(([l, v]) => (
          <div key={l} className="wd-row">
            <span className="wd-label">{l}</span>
            <span className="wd-val">{v}</span>
          </div>
        ))}
      </div>

      {/* 多规格明细行 */}
      {isMulti ? (
        <div className="wd-section">
          <div className="wd-title"><AppstoreAddOutlined style={{ marginRight: 4 }} />产品明细（{po.lineItems!.length} 行）</div>
          {po.lineItems!.map((item, i) => {
            const routing = findRoutingByCode(item.routingCode);
            return (
              <div key={i} style={{
                background: '#fff', borderRadius: 7, padding: '10px 12px',
                marginBottom: 8, border: '1px solid #e8ecf0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Badge count={item.lineNo} style={{ background: '#1677ff' }} />
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{item.productSpec}</span>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>{item.productCode}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 12 }}>
                  <div><span style={{ color: '#98a2b3' }}>计划量：</span><b style={{ color: '#1677ff' }}>{item.planQty.toLocaleString()}</b></div>
                  <div><span style={{ color: '#98a2b3' }}>BOM：</span>{item.bomVersion}</div>
                  <div><span style={{ color: '#98a2b3' }}>工艺：</span><span style={{ color: '#531dab' }}>{routing?.version || item.routingCode}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 单规格订单 */
        <div className="wd-section">
          <div className="wd-title">🏭 产品信息</div>
          {([
            ['产品名称', po.productName],
            ['产品规格', po.productSpec],
            ['产品编码', po.productCode],
            ['BOM版本',  po.bomVersion],
          ] as [string, string][]).map(([l, v]) => (
            <div key={l} className="wd-row">
              <span className="wd-label">{l}</span>
              <span className="wd-val">{v}</span>
            </div>
          ))}
          {(() => {
            const routing = findRoutingByCode(po.routingCode);
            return routing ? (
              <div className="wd-section" style={{ marginTop: 8 }}>
                <div className="wd-title"><NodeIndexOutlined style={{ marginRight: 4 }} />工艺路径</div>
                <div className="wd-row"><span className="wd-label">名称</span><span className="wd-val">{routing.name} {routing.version}</span></div>
                <div className="wd-row"><span className="wd-label">适用规格</span><span className="wd-val">{routing.applicableSpec}</span></div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      <div className="wd-section">
        <div className="wd-title">📊 工单执行进度</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div className="wd-qty-card">
            <div className="wd-qty-val">{relWOs.length}</div>
            <div className="wd-qty-label">总工单</div>
          </div>
          <div className="wd-qty-card wd-qty-green">
            <div className="wd-qty-val">{relWOs.filter(w => w.status === 'COMPLETED').length}</div>
            <div className="wd-qty-label">已完成</div>
          </div>
          <div className="wd-qty-card">
            <div className="wd-qty-val">{doneQty.toLocaleString()}</div>
            <div className="wd-qty-label">已产出(支)</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#98a2b3', marginBottom: 4 }}>
          <span>整体完成率</span>
          <span style={{ color: '#389e0d', fontWeight: 600 }}>{pct}%</span>
        </div>
        <div style={{ height: 8, background: '#f0f2f5', borderRadius: 4 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#52c41a', borderRadius: 4, transition: 'width 0.5s' }} />
        </div>
      </div>

      <div className="wd-section">
        <div className="wd-title">⚙️ 关联工单（{relWOs.length} 张）— 点击跳转到工单页面</div>
        {relWOs.length === 0
          ? <div style={{ color: '#98a2b3', fontSize: 12, padding: '8px 0' }}>暂无工单，审核后可下推拆批</div>
          : relWOs.map(w => {
              const ws = WO_STATUS[w.status];
              return (
                <div
                  key={w.id}
                  onClick={() => { onClose(); onNavigateToWO?.(w.id); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderBottom: '1px solid #f0f2f5', cursor: 'pointer', borderRadius: 6, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ fontSize: 12, color: '#1677ff', fontWeight: 600 }}>🔗 {w.woNo}</div>
                    <div style={{ fontSize: 11, color: '#98a2b3' }}>
                      {w.productSpec} · 批号: {w.batchNo} · 计划 {w.planQty.toLocaleString()} 支
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: ws.color, background: ws.bg, padding: '2px 8px', borderRadius: 10 }}>{ws.label}</span>
                    <span style={{ fontSize: 11, color: '#1677ff' }}>跳转 →</span>
                  </div>
                </div>
              );
            })
        }
      </div>
    </Drawer>
  );
};

// ── 多规格行编辑组件 ──────────────────────────────────────────────
interface LineItemRow extends POLineItem {
  _key: string;  // 行唯一key
}

const emptyLine = (lineNo: number): LineItemRow => ({
  _key: `L${Date.now()}${lineNo}`,
  lineNo,
  productCode: '',
  productName: '机用根管锉',
  productSpec: '',
  routingCode: 'RT-RKQ-STD-001',  // 对应 seriesData 中已启用的标准工艺路径
  bomVersion: '2.1',
  planQty: 5000,
  completedQty: 0,
  scrapQty: 0,
  remark: '',
});

// ── 将 MaterialRecord 转换为 FinishedGood 兼容对象 ────────────────
function materialToFG(m: MaterialRecord): FinishedGood {
  return {
    code:           m.code ?? '',
    name:           m.name ?? '',
    spec:           m.spec ?? m.name ?? '',
    seriesCode:     'RT-RKQ',
    defaultRouting: 'RT-RKQ-STD-001',
    defaultBom:     '2.1',
    unit:           m.unitName ?? '根',
    handleColor:    '',
    price:          m.price ?? 0,
  };
}

// ── 成品物料选择弹窗 ──────────────────────────────────────────────
const ProductPickerModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSelect: (fg: FinishedGood) => void;
}> = ({ open, onClose, onSelect }) => {
  const [search,   setSearch]   = useState('');
  const [apiGoods, setApiGoods] = useState<FinishedGood[]>([]);
  const [loading,  setLoading]  = useState(false);
  const fetchedRef = useRef(false);

  // 弹窗打开时从 API 加载成品物料（只加载一次）
  useEffect(() => {
    if (!open) return;
    if (fetchedRef.current && apiGoods.length > 0) return;
    setLoading(true);
    getMaterialList({ status: 1 })
      .then((resp: any) => {
        const list: MaterialRecord[] = resp?.data ?? [];
        // 过滤 type 包含"成品"字样的物料
        const fgList = list
          .filter(m => m.type && (
            m.type.includes('成品') ||
            m.type === '1' ||
            m.type.toLowerCase() === 'fg' ||
            m.type.toLowerCase() === 'finished'
          ))
          .map(materialToFG);
        if (fgList.length > 0) {
          setApiGoods(fgList);
        } else {
          // 后端未区分类型 → 显示全部物料
          const allMapped = list.map(materialToFG);
          setApiGoods(allMapped.length > 0 ? allMapped : FINISHED_GOODS);
        }
        fetchedRef.current = true;
      })
      .catch(() => {
        // API 失败时降级为本地 mock 数据
        setApiGoods(FINISHED_GOODS);
        fetchedRef.current = true;
      })
      .finally(() => setLoading(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => { setSearch(''); onClose(); };

  const displayGoods = apiGoods.length > 0 ? apiGoods : FINISHED_GOODS;
  const filtered = displayGoods.filter(fg =>
    (fg.spec  || '').includes(search) ||
    (fg.code  || '').toLowerCase().includes(search.toLowerCase()) ||
    (fg.name  || '').includes(search) ||
    (fg.handleColor || '').includes(search)
  );

  // 柄色 → 背景色映射（无柄色字段时用默认蓝色系）
  const colorMap: Record<string, string> = {
    '黄色': '#fffbe6', '绿色': '#f6ffed', '黑色': '#f0f0f0',
    '红色': '#fff1f0', '白色': '#fafafa', '蓝色': '#e6f4ff', '': '#f0f7ff',
  };
  const borderMap: Record<string, string> = {
    '黄色': '#ffe58f', '绿色': '#b7eb8f', '黑色': '#d9d9d9',
    '红色': '#ffa39e', '白色': '#d9d9d9', '蓝色': '#91caff', '': '#bae0ff',
  };

  return (
    <Modal
      open={open}
      title={<span><AppstoreAddOutlined style={{ marginRight: 6, color: '#1677ff' }} />选择成品物料</span>}
      onCancel={handleClose}
      footer={null}
      width={720}
      centered
      destroyOnClose
    >
      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索规格、编码、名称…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
        allowClear
      />
      <Spin spinning={loading} tip="加载成品物料…">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxHeight: 440, overflowY: 'auto' }}>
          {filtered.map(fg => (
            <div
              key={fg.code}
              onClick={() => { onSelect(fg); setSearch(''); onClose(); }}
              style={{
                padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                background: colorMap[fg.handleColor ?? ''] ?? '#f0f7ff',
                border: `1.5px solid ${borderMap[fg.handleColor ?? ''] ?? '#bae0ff'}`,
                transition: 'all 0.15s',
                userSelect: 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
                {fg.spec || fg.name}
              </div>
              <div style={{ fontSize: 11, color: '#667085', marginBottom: 6 }}>{fg.code}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {fg.name && fg.name !== fg.spec && (
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.7)', padding: '1px 7px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)' }}>
                    {fg.name}
                  </span>
                )}
                {fg.handleColor && (
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.7)', padding: '1px 7px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)' }}>
                    {fg.handleColor}柄
                  </span>
                )}
                {fg.price > 0 && (
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.7)', padding: '1px 7px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', color: '#389e0d' }}>
                    ¥{fg.price}/{fg.unit || '根'}
                  </span>
                )}
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.7)', padding: '1px 7px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', color: '#531dab' }}>
                  {findRoutingByCode(fg.defaultRouting)?.version || fg.defaultRouting}
                </span>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', color: '#98a2b3', padding: '40px 0' }}>
              未找到匹配的成品物料
            </div>
          )}
        </div>
      </Spin>
    </Modal>
  );
};

// ── 新建/编辑弹窗（支持多规格明细行） ────────────────────────────
const POFormModal: React.FC<{
  open: boolean;
  editData: ProductionOrder | null;
  onClose: () => void;
  onSaved: (po: ProductionOrder) => void;
}> = ({ open, editData, onClose, onSaved }) => {
  const [form]      = Form.useForm();
  const [lines, setLines] = useState<LineItemRow[]>([emptyLine(1)]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerIdx,  setPickerIdx]  = useState<number>(0);
  const [previewNo,  setPreviewNo]  = useState<string>('');
  const isEdit      = !!editData;

  // 每次弹窗打开时初始化
  useEffect(() => {
    if (!open) return;
    if (isEdit && editData) {
      const no = editData.orderNo || genMONo();
      setPreviewNo(no);
      form.setFieldsValue({
        orderNo:      no,
        soNo:         editData.soNo,
        deliveryDate: editData.deliveryDate,
        priority:     editData.priority,
        remark:       editData.remark,
      });
      // 恢复明细行
      if (editData.lineItems && editData.lineItems.length > 0) {
        setLines(editData.lineItems.map(l => ({ ...l, _key: `L${l.lineNo}` })));
      } else {
        // 兼容单规格旧数据
        setLines([{
          _key: 'L1', lineNo: 1,
          productCode: editData.productCode,
          productName: editData.productName,
          productSpec: editData.productSpec,
          routingCode: editData.routingCode,
          bomVersion:  editData.bomVersion,
          planQty:     editData.totalQty,
          completedQty: editData.completedQty,
          scrapQty:    editData.scrapQty,
        }]);
      }
    } else {
      const no = genMONo();
      setPreviewNo(no);
      form.resetFields();
      form.setFieldsValue({ orderNo: no, priority: 'NORMAL' });
      setLines([emptyLine(1)]);
    }
  }, [open, editData, isEdit, form]);

  // 打开物料选择器
  const openPicker = (idx: number) => { setPickerIdx(idx); setPickerOpen(true); };

  // 选择成品物料自动填充
  const handleSelectProduct = (fg: FinishedGood) => {
    setLines(prev => prev.map((l, i) => i === pickerIdx ? {
      ...l,
      productCode:  fg.code,
      productName:  fg.name,
      productSpec:  fg.spec,
      routingCode:  fg.defaultRouting,
      bomVersion:   fg.defaultBom,
    } : l));
  };

  const addLine = () => {
    setLines(prev => [...prev, emptyLine(prev.length + 1)]);
  };

  const removeLine = (idx: number) => {
    if (lines.length === 1) { message.warning('至少保留1行产品明细'); return; }
    setLines(prev => prev.filter((_, i) => i !== idx).map((l, i) => ({ ...l, lineNo: i + 1 })));
  };

  const updateLine = (idx: number, field: keyof LineItemRow, value: unknown) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const totalQty = lines.reduce((s, l) => s + (Number(l.planQty) || 0), 0);

  const handleOk = () => {
    form.validateFields()
      .then(vals => {
      // 验证明细行
      const validLines = lines.filter(l => l.productCode && l.planQty > 0);
      if (validLines.length === 0) {
        message.error('请至少添加一行有效的产品明细（需选择产品并填写数量）');
        return;
      }
      const invalidLine = lines.find(l => !l.productCode);
      if (invalidLine) {
        message.error(`第 ${invalidLine.lineNo} 行未选择产品，请选择或删除该行`);
        return;
      }

      // 计算主产品（取第1行）
      const firstLine = validLines[0];
      // 使用表单中的订单号（允许用户修改或使用预生成值）
      const finalOrderNo = (vals.orderNo as string | undefined)?.trim() || previewNo || genMONo();

      if (isEdit && editData) {
        const updated: ProductionOrder = {
          ...editData,
          orderNo:      finalOrderNo,
          soNo:         vals.soNo,
          deliveryDate: vals.deliveryDate,
          priority:     vals.priority,
          remark:       vals.remark,
          totalQty:     totalQty,
          productCode:  firstLine.productCode,
          productName:  firstLine.productName,
          productSpec:  validLines.length > 1
            ? `${firstLine.productSpec} 等${validLines.length}个规格`
            : firstLine.productSpec,
          bomVersion:   firstLine.bomVersion,
          routingCode:  firstLine.routingCode,
          lineItems:    validLines.map(({ _key, ...l }) => l),
        };
        onSaved(updated);
        message.success(`订单 ${finalOrderNo} 已修改`);
      } else {
        const no = finalOrderNo;
        const po: ProductionOrder = {
          id:           genId('PO'),
          orderNo:      no,
          status:       'OPEN',
          isAudited:    false,
          createdAt:    nowStr(),
          createdBy:    '当前用户',
          workOrders:   [],
          soNo:         vals.soNo,
          deliveryDate: vals.deliveryDate,
          priority:     vals.priority || 'NORMAL',
          remark:       vals.remark,
          totalQty:     totalQty,
          completedQty: 0,
          scrapQty:     0,
          // 主产品信息（用于兼容旧版及单规格显示）
          productCode:  firstLine.productCode,
          productName:  firstLine.productName,
          productSpec:  validLines.length > 1
            ? `${firstLine.productSpec} 等${validLines.length}个规格`
            : firstLine.productSpec,
          bomVersion:   firstLine.bomVersion,
          routingCode:  firstLine.routingCode,
          // 多规格明细行
          lineItems:    validLines.map(({ _key, ...l }) => l),
        };
        onSaved(po);
        message.success(`订单 ${no} 创建成功，共 ${validLines.length} 种规格，合计 ${totalQty.toLocaleString()} 支`);
      }
      onClose();
    }).catch(() => { /* 表单校验失败， antd 内部已高亮字段，无需额外处理 */ });
  };

  return (
    <Modal
      open={open}
      title={
        <span>
          {isEdit ? <EditOutlined style={{ marginRight: 6, color: '#fa8c16' }} /> : <PlusOutlined style={{ marginRight: 6, color: '#1677ff' }} />}
          {isEdit ? '编辑生产订单' : '新建生产订单'}
        </span>
      }
      onCancel={() => { onClose(); }}
      onOk={handleOk}
      okText={isEdit ? '保存修改' : '创建订单'}
      cancelText="取消"
      width="min(1100px, 96vw)"
      style={{ top: 24 }}
      styles={{ body: { maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', padding: '16px 28px' } }}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 4 }}>
        {/* 订单头部信息 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
          <Form.Item
            name="orderNo"
            label="生产订单编号"
            rules={[{ required: true, message: '请填写生产订单编号' }]}
          >
            <Input
              placeholder="自动生成，可修改"
              addonAfter={
                <span
                  style={{ cursor: 'pointer', color: '#1677ff', fontSize: 12, userSelect: 'none' }}
                  onClick={() => {
                    const no = genMONo();
                    setPreviewNo(no);
                    form.setFieldValue('orderNo', no);
                  }}
                >
                  重新生成
                </span>
              }
            />
          </Form.Item>
          <Form.Item name="soNo" label="销售订单号（选填）">
            <Input placeholder="如 SO-20260420-088" />
          </Form.Item>
          <Form.Item
            name="deliveryDate"
            label="交货日期"
            rules={[{ required: true, message: '请选择交货日期' }]}
            getValueFromEvent={(date: Dayjs | null) => date ? date.format('YYYY-MM-DD') : ''}
            getValueProps={(value: string) => ({ value: value ? dayjs(value) : undefined })}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="选择交货日期"
              disabledDate={d => d && d.isBefore(dayjs().startOf('day'))}
            />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="NORMAL">
            <Select>
              {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                <Option key={k} value={k}>
                  <span style={{ color: v.color }}>●</span> {v.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        {/* 产品明细行 */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>
              <AppstoreAddOutlined style={{ marginRight: 6, color: '#1677ff' }} />
              产品明细（{lines.length} 行，合计 <span style={{ color: '#1677ff' }}>{totalQty.toLocaleString()}</span> 支）
            </div>
            <Button
              type="dashed" size="small" icon={<PlusOutlined />}
              onClick={addLine}
            >
              添加规格行
            </Button>
          </div>

          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message="从成品物料目录选择产品后自动填写工艺路径和BOM版本，也可手动修改。GMP规定：每批次≤5000支（下推时自动拆批）。"
            style={{ marginBottom: 10, fontSize: 12, padding: '6px 12px' }}
          />

          {/* 表头 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '38px 2fr 2fr 80px 110px 1fr 36px',
            gap: '0 10px',
            padding: '7px 12px',
            background: '#f5f7fa',
            borderRadius: '6px 6px 0 0',
            border: '1px solid #e8ecf0',
            borderBottom: 'none',
            fontSize: 12,
            color: '#667085',
            fontWeight: 700,
          }}>
            <div style={{ textAlign: 'center' }}>行</div>
            <div>成品物料（从目录选择）</div>
            <div>工艺路径</div>
            <div>BOM版本</div>
            <div>计划数量（支）</div>
            <div>行备注</div>
            <div />
          </div>

          {/* 明细行 */}
          <div style={{ border: '1px solid #e8ecf0', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
            {lines.map((line, idx) => (
              <div
                key={line._key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '38px 2fr 2fr 80px 110px 1fr 36px',
                  gap: '0 10px',
                  padding: '10px 12px',
                  background: idx % 2 === 0 ? '#fff' : '#fafcff',
                  borderBottom: idx < lines.length - 1 ? '1px solid #f0f0f0' : 'none',
                  alignItems: 'center',
                }}
              >
                {/* 行号 */}
                <div style={{ textAlign: 'center', fontSize: 13, color: '#1677ff', fontWeight: 800 }}>
                  {line.lineNo}
                </div>

                {/* 产品选择（点击弹窗选择物料） */}
                <div>
                  <div
                    onClick={() => openPicker(idx)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                      border: line.productCode ? '1.5px solid #1677ff' : '1.5px dashed #d9d9d9',
                      background: line.productCode ? '#f0f7ff' : '#fafafa',
                      minHeight: 38, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1677ff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = line.productCode ? '#1677ff' : '#d9d9d9'; }}
                  >
                    {line.productCode ? (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {line.productSpec}
                        </div>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>{line.productCode}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#bfbfbf', fontSize: 13 }}>点击选择成品物料…</span>
                    )}
                    <span style={{ color: '#1677ff', fontSize: 12, marginLeft: 6, flexShrink: 0 }}>
                      {line.productCode ? '更换' : '选择 ›'}
                    </span>
                  </div>
                </div>

                {/* 工艺路径 — 根据已选物料过滤可用的已启用路径 */}
                <div>
                  {(() => {
                    const fg = FINISHED_GOODS.find(f => f.code === line.productCode) || null;
                    const routings = getApplicableRoutings(fg);
                    const boundCodes = routings
                      .filter(r => r.bindMaterialCodes && r.bindMaterialCodes.length > 0)
                      .map(r => r.routingCode);
                    return (
                      <Select
                        value={line.routingCode || undefined}
                        style={{ width: '100%' }}
                        onChange={v => updateLine(idx, 'routingCode', v)}
                        placeholder="选择工艺路径"
                        popupMatchSelectWidth={400}
                        optionLabelProp="label"
                        notFoundContent={<span style={{ color: '#aaa', fontSize: 12 }}>暂无已启用工艺路径</span>}
                      >
                        {routings.map(r => {
                          const isBound = boundCodes.includes(r.routingCode);
                          return (
                            <Option key={r.routingCode} value={r.routingCode} label={
                              <span>
                                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#8c8c8c', marginRight: 4 }}>{r.routingCode}</span>
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{r.routingName.replace('机用根管锉', '')}</span>
                                <span style={{ color: '#1677ff', marginLeft: 4 }}>{r.version}</span>
                              </span>
                            }>
                              <div style={{ lineHeight: 1.5, padding: '3px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1d2939' }}>
                                    {r.routingName.replace('机用根管锉', '')}
                                  </span>
                                  <span style={{ color: '#1677ff', fontSize: 12, fontWeight: 700 }}>{r.version}</span>
                                  {r.isDefault && (
                                    <span style={{ fontSize: 10, color: '#1677ff', background: '#e6f4ff',
                                      border: '1px solid #91caff', borderRadius: 4, padding: '0 4px' }}>默认</span>
                                  )}
                                  {isBound && (
                                    <span style={{ fontSize: 10, color: '#722ed1', background: '#f9f0ff',
                                      border: '1px solid #d3adf7', borderRadius: 4, padding: '0 4px' }}>专属绑定</span>
                                  )}
                                </div>
                                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#8c8c8c', marginTop: 1 }}>{r.routingCode}</div>
                                {r.specRangeExpr && (
                                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>
                                    适用：{r.specRangeExpr}
                                  </div>
                                )}
                              </div>
                            </Option>
                          );
                        })}
                      </Select>
                    );
                  })()}
                </div>

                {/* BOM版本 */}
                <div>
                  <Input
                    value={line.bomVersion}
                    placeholder="2.1"
                    onChange={e => updateLine(idx, 'bomVersion', e.target.value)}
                  />
                </div>

                {/* 计划数量 */}
                <div>
                  <InputNumber
                    value={line.planQty}
                    min={1}
                    style={{ width: '100%' }}
                    placeholder="≤5000"
                    addonAfter="支"
                    onChange={v => updateLine(idx, 'planQty', Number(v) || 0)}
                  />
                </div>

                {/* 备注 */}
                <div>
                  <Input
                    value={line.remark}
                    placeholder="可选"
                    onChange={e => updateLine(idx, 'remark', e.target.value)}
                  />
                </div>

                {/* 删除 */}
                <div style={{ textAlign: 'center' }}>
                  <Tooltip title="删除此行">
                    <MinusCircleOutlined
                      style={{ color: lines.length > 1 ? '#ff4d4f' : '#d9d9d9', fontSize: 18, cursor: lines.length > 1 ? 'pointer' : 'not-allowed' }}
                      onClick={() => removeLine(idx)}
                    />
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>

          {/* 合计行 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 16, padding: '8px 10px',
            background: '#f0f7ff', border: '1px solid #bae0ff', borderTop: 'none',
            borderRadius: '0 0 6px 6px', fontSize: 12,
          }}>
            <span style={{ color: '#667085' }}>合计数量：</span>
            <span style={{ fontWeight: 800, color: '#1677ff', fontSize: 15 }}>
              {totalQty.toLocaleString()} 支
            </span>
            <span style={{ color: '#8c8c8c' }}>
              预计需拆 {lines.reduce((s, l) => s + Math.ceil((l.planQty || 0) / 5000), 0)} 批次
            </span>
          </div>
        </div>

        {/* 备注 */}
        <Form.Item name="remark" label="订单备注（选填）" style={{ marginBottom: 0 }}>
          <TextArea rows={2} placeholder="客户特殊要求、出口合规说明、质量要求等…" />
        </Form.Item>
      </Form>

      {/* 物料选择弹窗 */}
      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectProduct}
      />
    </Modal>
  );
};

// ── 下推工单弹窗（支持多规格明细行拆批） ─────────────────────────
const PushWOModal: React.FC<{
  open: boolean;
  po: ProductionOrder | null;
  existingWOCount: number;
  onClose: () => void;
  onPushed: (wos: WorkOrder[]) => void;
}> = ({ open, po, existingWOCount, onClose, onPushed }) => {
  const [form]      = Form.useForm();
  const [batchSize, setBatchSize] = useState(5000);

  const isMulti   = po?.lineItems && po.lineItems.length > 1;
  const dateStr   = todayFmt();

  // 计算预览：每行拆成几批
  const lineItems = po?.lineItems && po.lineItems.length > 0
    ? po.lineItems
    : po ? [{ lineNo: 1, productCode: po.productCode, productName: po.productName, productSpec: po.productSpec, routingCode: po.routingCode, bomVersion: po.bomVersion, planQty: po.totalQty, completedQty: 0, scrapQty: 0 }]
    : [];

  const totalBatches = lineItems.reduce((s, l) => s + Math.ceil(l.planQty / batchSize), 0);

  useEffect(() => {
    if (open && po) {
      form.setFieldsValue({ batchSize: 5000 });
      setBatchSize(5000);
    }
  }, [open, po, form]);

  const handleOk = () => {
    form.validateFields()
      .then(vals => {
      if (!po) return;
      const sz = vals.batchSize;
      const newWOs: WorkOrder[] = [];
      let globalSeq = existingWOCount;

      lineItems.forEach(item => {
        const cnt     = Math.ceil(item.planQty / sz);
        const routing = findRoutingByCode(item.routingCode);
        for (let i = 0; i < cnt; i++) {
          const qty     = i < cnt - 1 ? sz : item.planQty - sz * (cnt - 1);
          globalSeq++;
          const batchNo = `YS-RKQ-${dateStr}-${String(globalSeq).padStart(3, '0')}`;
          newWOs.push({
            id:          genId('WO'),
            woNo:        genWONo(dateStr, newWOs.length + existingWOCount + 1),
            poId:        po.id,
            poNo:        po.orderNo,
            batchNo,
            productCode: item.productCode,
            productName: item.productName,
            productSpec: item.productSpec,
            bomVersion:  item.bomVersion,
            planQty:     qty,
            routingCode: item.routingCode,
            routingName: routing ? `${routing.name} ${routing.version}` : item.routingCode,
            priority:    po.priority || 'NORMAL',
            status:      'RELEASED' as const,
            releaseTime: nowStr(),
            planStart:   vals.planStart ? (vals.planStart as Dayjs).format('YYYY-MM-DD HH:mm') : nowStr(),
            planEnd:     vals.planEnd   ? (vals.planEnd as Dayjs).format('YYYY-MM-DD HH:mm') : '',
            createdAt:   nowStr(),
            createdBy:   '当前用户',
            remark:      vals.remark || item.remark,
            progressPct: 0,
          });
        }
      });

      onPushed(newWOs);
      message.success(
        isMulti
          ? `已下推 ${newWOs.length} 张工单（${lineItems.length} 种规格 × 拆批），每批 ${sz} 支`
          : `已下推 ${newWOs.length} 张工单，每批 ${sz} 支`
      );
      onClose();
    }).catch(() => { /* 表单校验失败 */ });
  };

  return (
    <Modal
      open={open}
      title={`⬇️ 下推生产工单 — ${po?.orderNo || ''}`}
      onCancel={onClose}
      onOk={handleOk}
      okText="确认下推"
      cancelText="取消"
      width={580}
    >
      {/* 订单摘要 */}
      <div style={{ marginBottom: 14, padding: '10px 14px', background: '#f0f7ff', borderRadius: 8, border: '1px solid #bae0ff', fontSize: 13 }}>
        <div>
          <b>订单：</b>{po?.orderNo}
          <span style={{ marginLeft: 12, color: '#8c8c8c', fontSize: 12 }}>总量 {po?.totalQty.toLocaleString()} 支</span>
          {isMulti && <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>多规格 {lineItems.length} 行</Tag>}
        </div>
        {isMulti && (
          <div style={{ marginTop: 8 }}>
            {lineItems.map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: '#444', padding: '2px 0' }}>
                行{item.lineNo}：<b>{item.productSpec}</b>
                <span style={{ color: '#1677ff', marginLeft: 6 }}>{item.planQty.toLocaleString()} 支</span>
                <span style={{ color: '#8c8c8c', marginLeft: 6 }}>
                  → 拆 {Math.ceil(item.planQty / batchSize)} 批
                </span>
              </div>
            ))}
          </div>
        )}
        {!isMulti && lineItems[0] && (
          <div><b>产品：</b>{lineItems[0].productSpec}</div>
        )}
        <div style={{ color: '#888', marginTop: 6, fontSize: 11 }}>
          ⚠️ 医疗器械GMP规定：单批≤5000支，系统自动按批次拆分
        </div>
      </div>

      <Form form={form} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="batchSize" label="每批数量（支）" rules={[{ required: true }]}>
            <InputNumber
              min={1} max={5000}
              style={{ width: '100%' }}
              onChange={v => setBatchSize(Number(v) || 1)}
            />
          </Form.Item>
          <Form.Item name="planStart" label="计划开始时间">
            <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="选择开始时间" />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="planEnd" label="计划结束时间">
            <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="选择结束时间" />
          </Form.Item>
          <Form.Item name="remark" label="备注（选填）">
            <Input placeholder="如：出口单批，优先排产" />
          </Form.Item>
        </div>

        {/* 下推预览 */}
        <div style={{ padding: '10px 14px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, fontSize: 13 }}>
          将自动生成 <b style={{ color: '#389e0d', fontSize: 16 }}>{totalBatches}</b> 张工单
          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
            批号：YS-RKQ-{dateStr}-{String(existingWOCount + 1).padStart(3,'0')} ～ YS-RKQ-{dateStr}-{String(existingWOCount + totalBatches).padStart(3,'0')}
          </div>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>
            工单号：WO-{dateStr}-{String(existingWOCount + 1).padStart(3,'0')} ～ WO-{dateStr}-{String(existingWOCount + totalBatches).padStart(3,'0')}
          </div>
        </div>
      </Form>
    </Modal>
  );
};

// ── 全局可变引用（供跨页面同步用）────────────────────────────────
export let globalPOs: ProductionOrder[] = [...mockProductionOrders];
export let globalWOs: WorkOrder[]        = [...mockWorkOrders];
export const poListeners: Array<() => void> = [];
export const woListeners: Array<() => void> = [];

// ── UDI 打印弹窗 ────────────────────────────────────────────────────
const UdiPrintModal: React.FC<{
  po: ProductionOrder | null;
  open: boolean;
  onClose: () => void;
}> = ({ po, open, onClose }) => {
  const [generating, setGenerating] = useState(false);
  const [udiRecord, setUdiRecord] = useState<UdiRecord | null>(null);
  const [existingUdis, setExistingUdis] = useState<UdiRecord[]>([]);

  useEffect(() => {
    if (!open || !po) return;
    const orderNo = po.orderNo ?? '';
    const existing = getUdiByOrderNo(orderNo);
    setExistingUdis(existing);
    if (existing.length > 0) setUdiRecord(existing[existing.length - 1]);
    else setUdiRecord(null);
  }, [open, po]);

  const handleGenerate = async () => {
    if (!po) return;
    setGenerating(true);
    try {
      const rule = loadPiRule();
      const diMap = loadDiMap();

      // Try to find DI by product code in diMap
      const matchedDi = Object.values(diMap).find(d => d.materialCode === po.productCode);
      const materialId = matchedDi?.materialId ?? 0;
      let di = matchedDi ?? null;

      if (!di && materialId) {
        try {
          const resp = await getMaterialDiByMaterialId(materialId);
          if (resp?.data) di = resp.data;
        } catch { /* fallback */ }
      }

      // If no DI configured, create a placeholder DI from the PO product code
      if (!di) {
        di = {
          materialId: materialId || 0,
          materialCode: po.productCode ?? '',
          materialName: po.productName ?? '',
          gtin: '00000000000000',
          diCode: po.productCode ?? 'UNKNOWN',
          issuer: 'GS1',
        };
        message.warning('该成品暂未配置DI/GTIN，已使用默认值，建议在物料档案中配置GTIN');
      }

      // ProductionOrder has no plannedStart or batchNo; derive from deliveryDate or now
      const prodDate = po.deliveryDate ? new Date(po.deliveryDate) : new Date();
      const newRecord = generateUdiRecord({
        di,
        rule,
        batchNo: po.orderNo ?? '',
        qty: po.totalQty ?? 1,
        productionDate: prodDate,
        productionOrderNo: po.orderNo,
        productionOrderId: Number(po.id) || undefined,
        materialCode: po.productCode ?? di.materialCode,
        materialName: po.productName ?? di.materialName,
      });

      // Save locally first
      const allUdis = loadUdiRecords();
      const merged = [...allUdis, newRecord];
      saveUdiRecords(merged);
      setUdiRecord(newRecord);
      setExistingUdis(merged.filter(u => u.productionOrderNo === po.orderNo));

      // Try API
      try {
        await createUdiRecord(newRecord);
      } catch { /* localStorage only */ }

      message.success('UDI码已生成');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!udiRecord) return;
    window.print();
    // Update print count
    const allUdis = loadUdiRecords();
    const updated = allUdis.map(u =>
      u.udiString === udiRecord.udiString
        ? { ...u, status: 'PRINTED' as const, printCount: (u.printCount ?? 0) + 1 }
        : u,
    );
    saveUdiRecords(updated);
    setUdiRecord(prev => prev ? { ...prev, status: 'PRINTED', printCount: (prev.printCount ?? 0) + 1 } : prev);
    if (udiRecord.id) {
      printUdiRecord(udiRecord.id).catch(() => {});
    }
    message.success('已发送至打印机');
  };

  const handleCopy = () => {
    if (!udiRecord?.udiString) return;
    navigator.clipboard.writeText(udiRecord.udiString);
    message.success('UDI码已复制');
  };

  if (!po) return null;

  return (
    <Modal
      title={
        <span>
          <QrcodeOutlined style={{ color: '#722ed1', marginRight: 8 }} />
          UDI码管理 — {po.orderNo}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
    >
      <div style={{ padding: '8px 0' }}>
        {/* PO Info */}
        <div style={{
          background: '#f5f0ff', borderRadius: 6, padding: '10px 14px',
          marginBottom: 16, fontSize: 13,
        }}>
          <span style={{ color: '#666' }}>生产订单：</span>
          <span style={{ fontWeight: 600 }}>{po.orderNo}</span>
          <span style={{ color: '#666', marginLeft: 16 }}>产品：</span>
          <span>{po.productName}</span>
          <span style={{ color: '#666', marginLeft: 16 }}>数量：</span>
          <span>{po.totalQty?.toLocaleString()}</span>
        </div>

        {/* UDI Display */}
        {udiRecord ? (
          <div className="udi-print-area" style={{
            border: '2px solid #722ed1', borderRadius: 8, padding: 16,
            marginBottom: 16, background: '#fafafa',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              {/* Simulated QR placeholder */}
              <div style={{
                width: 80, height: 80, background: '#fff',
                border: '1px solid #d9d9d9', borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <QrcodeOutlined style={{ fontSize: 48, color: '#722ed1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>UDI码（GS1格式）</div>
                <div style={{
                  fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all',
                  background: '#fff', padding: '6px 8px', borderRadius: 4,
                  border: '1px solid #e8e8e8',
                }}>
                  {udiRecord.udiString}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
                  <span style={{ marginRight: 12 }}>批号: <b>{udiRecord.batchNo}</b></span>
                  <span style={{ marginRight: 12 }}>生产日期: <b>{udiRecord.productionDate}</b></span>
                  <span>有效期: <b>{udiRecord.expiryDate}</b></span>
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#555' }}>
                  <span style={{ marginRight: 12 }}>GTIN: <b>{udiRecord.gtin}</b></span>
                  <span>数量: <b>{udiRecord.qty}</b></span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
              <Button icon={<CopyOutlined />} onClick={handleCopy}>复制UDI</Button>
              <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}
                style={{ background: '#722ed1', borderColor: '#722ed1' }}>
                打印UDI标签
              </Button>
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '24px 0', border: '1px dashed #d9d9d9',
            borderRadius: 8, marginBottom: 16, color: '#999',
          }}>
            <QrcodeOutlined style={{ fontSize: 32, color: '#d9d9d9', display: 'block', marginBottom: 8 }} />
            尚未生成UDI码，点击下方「生成UDI」按钮
          </div>
        )}

        {/* Existing UDIs count */}
        {existingUdis.length > 1 && (
          <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
            历史已生成 {existingUdis.length} 条UDI记录，显示最新一条
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Button onClick={onClose}>关闭</Button>
          <Button
            type="primary"
            icon={<QrcodeOutlined />}
            loading={generating}
            onClick={handleGenerate}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            {udiRecord ? '重新生成UDI' : '生成UDI'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface ProductionOrderPageProps {
  onNavigateToWO?: (woId: string) => void;  // 跳转到生产工单页并打开指定工单
}

const ProductionOrderPage: React.FC<ProductionOrderPageProps> = ({ onNavigateToWO }) => {
  const [pos, setPos] = useLocalStorage<ProductionOrder[]>(STORE_KEYS.PRODUCTION_ORDERS, []);
  const [wos, setWos] = useLocalStorage<WorkOrder[]>(STORE_KEYS.WORK_ORDERS, []);
  const [apiLoading, setApiLoading] = useState(false);

  // ── 从后端加载生产订单 ─────────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      const [poResp, woResp] = await Promise.all([
        getProductionOrderList() as any,
        getWorkOrderList() as any,
      ]);
      const apiPos: any[] = poResp.data ?? [];
      const apiWos: any[] = woResp.data ?? [];
      if (apiPos.length > 0) {
        // compat路由返回: orderNo(=wo_code), productCode, productName, totalQuantity(=plan_qty),
        // completedQuantity(=actual_qty), batchNo, priority(数字1-4), status(字符串OPEN/IN_PROGRESS...)
        const statusMap: Record<string, ProductionOrder['status']> = {
          OPEN: 'OPEN', DRAFT: 'OPEN', RELEASED: 'RELEASED',
          IN_PROGRESS: 'IN_PROGRESS', PAUSED: 'IN_PROGRESS',
          COMPLETED: 'COMPLETED', CLOSED: 'CLOSED', CANCELLED: 'CLOSED',
        };
        const priorityMap: Record<number, ProductionOrder['priority']> = {
          1:'URGENT', 2:'HIGH', 3:'NORMAL', 4:'LOW',
        };
        const mapped: ProductionOrder[] = apiPos.map((item: any) => ({
          id: String(item.id ?? item.orderNo),
          orderNo: item.orderNo ?? item.woCode ?? item.wo_code ?? '',
          soNo: item.batchNo ?? '',
          productCode: item.productCode ?? item.customerCode ?? 'FG001',
          productName: item.productName ?? item.customerName ?? '',
          productSpec: item.spec ?? '',
          bomVersion: item.bomVersion ?? '',
          routingCode: item.routeCode ?? '',
          totalQty: Number(item.totalQuantity ?? item.planQty ?? 0),
          completedQty: Number(item.completedQuantity ?? item.actualQty ?? 0),
          scrapQty: 0,
          deliveryDate: item.deliveryDate ?? item.planEnd ?? '',
          priority: priorityMap[item.priority] ?? 'NORMAL',
          status: statusMap[item.status] ?? 'OPEN',
          isAudited: ['RELEASED','IN_PROGRESS','COMPLETED'].includes(item.status ?? ''),
          remark: item.remark ?? '',
          createdAt: (item.createTime ?? item.create_time ?? '').slice(0, 10),
          createdBy: item.createBy ?? item.create_by ?? 'admin',
        }));
        setPos(mapped);
      }
      if (apiWos.length > 0) {
        // compat路由返回: workOrderNo(=wo_code), planQuantity(=plan_qty), completedQuantity(=actual_qty),
        // materialCode(=product_code), materialName, progress
        const woStatusMap: Record<string, WorkOrder['status']> = {
          OPEN: 'CREATED', DRAFT: 'CREATED', RELEASED: 'RELEASED',
          IN_PROGRESS: 'IN_PROGRESS', PAUSED: 'IN_PROGRESS',
          COMPLETED: 'COMPLETED', CLOSED: 'CLOSED',
        };
        const mappedWos: WorkOrder[] = apiWos.map((item: any) => ({
          id: String(item.id ?? item.workOrderNo),
          woNo: item.workOrderNo ?? item.woCode ?? item.wo_code ?? '',
          poId: String(item.orderId ?? item.id ?? ''),
          poNo: item.orderNo ?? item.workOrderNo ?? '',
          batchNo: item.batchNo ?? item.batch_no ?? item.workOrderNo ?? '',
          productCode: item.materialCode ?? item.productCode ?? '',
          productName: item.materialName ?? item.productName ?? '',
          productSpec: item.spec ?? '',
          bomVersion: item.bomVersion ?? '',
          routingCode: item.routeCode ?? '',
          routingName: '',
          planQty: Number(item.planQuantity ?? item.planQty ?? 0),
          actualQty: Number(item.completedQuantity ?? item.actualQty ?? 0),
          scrapQty: Number(item.unqualifiedQuantity ?? 0),
          status: woStatusMap[item.status] ?? 'CREATED',
          priority: 'NORMAL',
          progressPct: Number(item.progress ?? 0),
          createdAt: (item.createTime ?? item.create_time ?? '').slice(0, 10),
          createdBy: item.createBy ?? item.create_by ?? 'admin',
        }));
        setWos(mappedWos);
      }
    } catch { /* graceful fallback to mock */ } finally {
      setApiLoading(false);
    }
  }, [setPos, setWos]);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // 保持 globalPOs / globalWOs 与 localStorage 同步
  useEffect(() => { globalPOs.length = 0; globalPOs.push(...pos); }, [pos]);
  useEffect(() => { globalWOs.length = 0; globalWOs.push(...wos); }, [wos]);

  const [searchText,    setSearchText]   = useState('');
  const [filterStatus,  setFilterStatus] = useState('ALL');
  const [detailOpen,    setDetailOpen]   = useState(false);
  const [selectedPO,    setSelectedPO]   = useState<ProductionOrder | null>(null);
  const [formOpen,      setFormOpen]     = useState(false);
  const [editingPO,     setEditingPO]    = useState<ProductionOrder | null>(null);
  const [pushOpen,      setPushOpen]     = useState(false);
  const [pushingPO,     setPushingPO]    = useState<ProductionOrder | null>(null);
  const [udiOpen,       setUdiOpen]      = useState(false);
  const [udiPO,         setUdiPO]        = useState<ProductionOrder | null>(null);

  const syncPos = (next: ProductionOrder[]) => setPos(next);
  const syncWos = (next: WorkOrder[])        => setWos(next);

  const filtered = pos.filter(p => {
    const mt = !searchText ||
      p.orderNo.includes(searchText) ||
      p.productName.includes(searchText) ||
      (p.soNo || '').includes(searchText) ||
      p.productSpec.includes(searchText) ||
      (p.lineItems || []).some(l => l.productSpec.includes(searchText));
    const ms = filterStatus === 'ALL'
      ? true
      : filterStatus === 'UNAUDITED'
        ? !p.isAudited
        : p.status === filterStatus;
    return mt && ms;
  });

  const summary = {
    open:       pos.filter(p => p.status === 'OPEN').length,
    released:   pos.filter(p => p.status === 'RELEASED').length,
    inProgress: pos.filter(p => p.status === 'IN_PROGRESS').length,
    completed:  pos.filter(p => p.status === 'COMPLETED').length,
    total:      pos.length,
    unaudited:  pos.filter(p => !p.isAudited).length,
  };

  const handleSave = async (po: ProductionOrder) => {
    setApiLoading(true);
    // 用户新建/编辑订单时，解除「已清空」标志，允许 API 数据重新加载
    setUserCleared(false);
    try {
      const numId = Number(po.id);
      const isEdit = !isNaN(numId) && numId > 0;
      const priorityMap: Record<string, number> = { LOW: 1, NORMAL: 2, HIGH: 3, URGENT: 4 };
      const statusMap: Record<string, string> = { OPEN: 'DRAFT', RELEASED: 'RELEASED', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', CLOSED: 'CLOSED' };
      const payload = {
        orderNo: po.orderNo,
        customerName: po.productName,
        totalQuantity: po.totalQty,
        deliveryDate: po.deliveryDate,
        priority: priorityMap[po.priority] ?? 2,
        status: statusMap[po.status] ?? 'DRAFT',
        remark: po.remark,
      };
      if (isEdit) await updateProductionOrder(numId, payload);
      else await createProductionOrder(payload);
      await loadFromApi();
      message.success(isEdit ? `订单 ${po.orderNo} 已更新` : `订单 ${po.orderNo} 已创建`);
    } catch {
      // fallback: optimistic update
      syncPos(pos.some(p => p.id === po.id) ? pos.map(p => p.id === po.id ? po : p) : [po, ...pos]);
    } finally {
      setApiLoading(false);
    }
  };

  const handleDelete = async (po: ProductionOrder) => {
    const numId = Number(po.id);
    if (!isNaN(numId) && numId > 0) {
      setApiLoading(true);
      try {
        await deleteProductionOrder(numId);
        await loadFromApi();
        message.success(`订单 ${po.orderNo} 已删除`);
      } catch {
        syncPos(pos.filter(p => p.id !== po.id));
        message.success(`订单 ${po.orderNo} 已删除`);
      } finally {
        setApiLoading(false);
      }
    } else {
      syncPos(pos.filter(p => p.id !== po.id));
      message.success(`订单 ${po.orderNo} 已删除`);
    }
  };

  const handleAudit = async (po: ProductionOrder) => {
    const numId = Number(po.id);
    if (!isNaN(numId) && numId > 0) {
      setApiLoading(true);
      try {
        await updateProductionOrder(numId, { status: 'RELEASED' });
        await loadFromApi();
        message.success(`订单 ${po.orderNo} 审核通过，现可下推工单`);
      } catch {
        syncPos(pos.map(p => p.id === po.id
          ? { ...p, isAudited: true, auditedBy: '当前用户', auditedAt: nowStr() }
          : p));
        message.success(`订单 ${po.orderNo} 审核通过，现可下推工单`);
      } finally {
        setApiLoading(false);
      }
    } else {
      syncPos(pos.map(p => p.id === po.id
        ? { ...p, isAudited: true, auditedBy: '当前用户', auditedAt: nowStr() }
        : p));
      message.success(`订单 ${po.orderNo} 审核通过，现可下推工单`);
    }
  };

  const handleUnaudit = async (po: ProductionOrder) => {
    const relWOs = wos.filter(w => w.poId === po.id);
    if (relWOs.length > 0) {
      message.warning('该订单已有关联工单，无法反审核');
      return;
    }
    const numId = Number(po.id);
    if (!isNaN(numId) && numId > 0) {
      setApiLoading(true);
      try {
        await updateProductionOrder(numId, { status: 'DRAFT' });
        await loadFromApi();
        message.warning(`订单 ${po.orderNo} 已反审核`);
      } catch {
        syncPos(pos.map(p => p.id === po.id ? { ...p, isAudited: false } : p));
        message.warning(`订单 ${po.orderNo} 已反审核`);
      } finally {
        setApiLoading(false);
      }
    } else {
      syncPos(pos.map(p => p.id === po.id ? { ...p, isAudited: false } : p));
      message.warning(`订单 ${po.orderNo} 已反审核`);
    }
  };

  const handlePushed = async (newWOs: WorkOrder[]) => {
    // 1. 乐观更新本地 state — 用户立刻看到工单
    const merged = [...newWOs, ...wos];
    syncWos(merged);
    // 2. 同步写入 mesStore localStorage — WorkOrderListPage 切换过去时能读到
    saveWorkOrders(merged);
    // 3. 更新生产订单状态
    if (pushingPO) {
      syncPos(pos.map(p => p.id === pushingPO.id
        ? { ...p, status: 'RELEASED' as POStatus, workOrders: [...(p.workOrders || []), ...newWOs.map(w => w.woNo)] }
        : p));
    }
    // 4. 逐条调用后端 createWorkOrder API，用真实 ID 替换临时 ID
    setApiLoading(true);
    try {
      const savedWOs: WorkOrder[] = [];
      for (const wo of newWOs) {
        try {
          const poNumId = pushingPO ? Number(pushingPO.id) : NaN;
          const payload: WorkOrderRecord = {
            workOrderNo:   wo.woNo,
            orderId:       !isNaN(poNumId) && poNumId > 0 ? poNumId : undefined,
            orderNo:       wo.poNo,
            materialCode:  wo.productCode,
            materialName:  wo.productName,
            spec:          wo.productSpec,
            planQuantity:  wo.planQty,
            bomVersion:    wo.bomVersion,
            status:        'RELEASED',
            remark:        wo.batchNo,
          };
          const resp = await createWorkOrder(payload) as any;
          savedWOs.push({
            ...wo,
            id: resp?.data?.id ? String(resp.data.id) : wo.id,
          });
        } catch {
          savedWOs.push(wo); // 单条失败不阻断其余
        }
      }
      // 5. 用后端真实 ID 更新 state 和 localStorage
      const withRealIds = [...savedWOs, ...wos];
      syncWos(withRealIds);
      saveWorkOrders(withRealIds);
      // 6. 从后端全量刷新，确保一致
      await loadFromApi();
    } catch {
      // 网络全失败时保留乐观更新，工单已写入 localStorage
    } finally {
      setApiLoading(false);
    }
  };

  const getExistingWOCount = (po: ProductionOrder) => wos.filter(w => w.poId === po.id).length;

  return (
    <div className="wo-page">
      <div className="wo-page-header">
        <FileTextOutlined style={{ color: '#1677ff', marginRight: 8 }} />
        生产订单管理（L1）
        <span style={{ fontSize: 12, color: '#98a2b3', marginLeft: 12 }}>
          支持多规格物料 · 选物料目录 · 自动带入工艺路径 · 拆批下推工单
        </span>
      </div>

      {summary.unaudited > 0 && (
        <Alert
          type="warning"
          message={`有 ${summary.unaudited} 张生产订单待审核，审核后方可下推工单`}
          showIcon
          style={{ margin: '8px 16px 0', borderRadius: 6 }}
          closable
        />
      )}

      {/* KPI行 */}
      <div className="wo-kpi-row">
        {([
          { label: '待下发', val: summary.open,       color: '#faad14', status: 'OPEN'        },
          { label: '已下发', val: summary.released,   color: '#1890ff', status: 'RELEASED'    },
          { label: '生产中', val: summary.inProgress, color: '#52c41a', status: 'IN_PROGRESS' },
          { label: '已完成', val: summary.completed,  color: '#13c2c2', status: 'COMPLETED'   },
          { label: '合计',   val: summary.total,      color: '#1d2939', status: 'ALL'         },
          { label: '待审核', val: summary.unaudited,  color: '#cf1322', status: 'UNAUDITED'   },
        ] as { label: string; val: number; color: string; status: string }[]).map(k => {
          const isActive = filterStatus === k.status;
          return (
            <div
              key={k.label}
              className="wo-kpi"
              style={{
                cursor: 'pointer',
                background: isActive ? `${k.color}15` : undefined,
                border: isActive ? `1px solid ${k.color}` : undefined,
                borderRadius: 6, transition: 'all 0.15s', userSelect: 'none',
              }}
              onClick={() => setFilterStatus(prev => prev === k.status ? 'ALL' : k.status)}
            >
              <div className="wo-kpi-val" style={{ color: k.color }}>{k.val}</div>
              <div className="wo-kpi-label" style={{ color: isActive ? k.color : undefined, fontWeight: isActive ? 600 : undefined }}>
                {k.label}{isActive ? ' ✓' : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* 工具栏 */}
      <div className="wo-toolbar">
        <div style={{ display: 'flex', gap: 8, flex: 1 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#aaa' }} />}
            placeholder="搜索订单号 / 销售单 / 产品名称 / 规格…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 320 }}
            allowClear
          />
          <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 130 }}>
            <Option value="ALL">全部状态</Option>
            {Object.entries(PO_STATUS).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<ReloadOutlined />} loading={apiLoading} onClick={() => { setUserCleared(false); loadFromApi(); }}>刷新</Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '清空所有生产数据',
                content: '将清空生产订单、生产工单、任务单、浮票及PAD执行数据，此操作不可恢复，确认吗？',
                okText: '确认清空',
                cancelText: '取消',
                okButtonProps: { danger: true },
                onOk: async () => {
                  // ① 先清空后端数据库（四张表，按依赖顺序）
                  try {
                    const [toResp, ftResp, woResp, poResp, itResp] = await Promise.all([
                      getTaskOrderList() as any,
                      getFloatTicketList() as any,
                      getWorkOrderList() as any,
                      getProductionOrderList() as any,
                      getInspectionTaskList() as any,
                    ]);
                    const toIds: number[] = (toResp.data ?? []).map((x: any) => x.id).filter(Boolean);
                    const ftIds: number[] = (ftResp.data ?? []).map((x: any) => x.id).filter(Boolean);
                    const woIds: number[] = (woResp.data ?? []).map((x: any) => x.id).filter(Boolean);
                    const poIds: number[] = (poResp.data ?? []).map((x: any) => x.id).filter(Boolean);
                    const itIds: number[] = (itResp.data ?? []).map((x: any) => x.id).filter(Boolean);
                    if (toIds.length) await batchDeleteTaskOrders(toIds);
                    if (ftIds.length) await batchDeleteFloatTickets(ftIds);
                    if (woIds.length) await batchDeleteWorkOrders(woIds);
                    if (poIds.length) await batchDeleteProductionOrders(poIds);
                    if (itIds.length) await batchDeleteInspectionTasks(itIds);
                  } catch { /* 后端删除失败时不影响前端清空 */ }
                  // ② 清空前端 localStorage
                  clearProductionData();
                  setPos([]);
                  setWos([]);
                  message.success('数据库（含质检记录）& 本地数据已彻底清空');
                },
              });
            }}
          >清空数据</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingPO(null); setFormOpen(true); }}>
            新建订单
          </Button>
        </div>
      </div>

      {/* 订单列表 */}
      <Spin spinning={apiLoading}>
      <div className="wo-list">
        {filtered.length === 0
          ? (
            <div style={{ textAlign: 'center', color: '#98a2b3', padding: '48px 0', fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              暂无订单数据，点击"新建订单"创建
            </div>
          )
          : filtered.map(po => (
            <POCard
              key={po.id}
              po={po}
              wos={wos}
              onClick={() => { setSelectedPO(po); setDetailOpen(true); }}
              onEdit={() => { setEditingPO(po); setFormOpen(true); }}
              onDelete={() => handleDelete(po)}
              onAudit={() => handleAudit(po)}
              onUnaudit={() => handleUnaudit(po)}
              onPushWO={() => { setPushingPO(po); setPushOpen(true); }}
              onUdi={() => { setUdiPO(po); setUdiOpen(true); }}
            />
          ))
        }
      </div>
      </Spin>

      <PODetailDrawer po={selectedPO} wos={wos} open={detailOpen} onClose={() => setDetailOpen(false)} onNavigateToWO={onNavigateToWO} />
      <POFormModal open={formOpen} editData={editingPO} onClose={() => setFormOpen(false)} onSaved={handleSave} />
      <PushWOModal
        open={pushOpen}
        po={pushingPO}
        existingWOCount={pushingPO ? getExistingWOCount(pushingPO) : 0}
        onClose={() => setPushOpen(false)}
        onPushed={handlePushed}
      />
      <UdiPrintModal open={udiOpen} po={udiPO} onClose={() => setUdiOpen(false)} />
    </div>
  );
};

export default ProductionOrderPage;
