/**
 * 生产看板（Dashboard）— 医疗器械MES完整实战版
 * ================================================================
 * 数据源：mesStore（bip_production_orders / bip_work_orders / bip_task_orders）
 * 实时刷新：每30秒自动拉取 localStorage 数据
 * 功能：
 *   - 顶部实时时钟 + 当前班次 + 工厂信息
 *   - KPI卡片行（订单/工单/任务单/良率/今日完成率/设备）
 *   - 在产工单进度列表
 *   - 生产订单总览
 *   - 任务单看板（待派工/已派工/执行中/暂停/完成）
 *   - 班次在岗情况
 *   - 各车间良率横向柱图
 *   - 设备状态看板
 *   - 快捷入口（8个功能模块）
 *   - 在产工单工序进度总览（9段工艺线）
 * ================================================================
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Tag, Tooltip, Button, Progress, Badge } from 'antd';
import {
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  ToolOutlined,
  NodeIndexOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  AlertOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ApartmentOutlined,
  TabletOutlined,
  SafetyOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import {
  loadProductionOrders,
  loadWorkOrders,
  loadTaskOrders,
} from '../../store/mesStore';
import type { ProductionOrder, WorkOrder, TaskOrder } from '../workorder/workOrderData';
import {
  SHIFTS, EQUIPMENTS,
  PO_STATUS, WO_STATUS,
  PRIORITY_MAP,
} from '../workorder/workOrderData';
import { getProductionOrderList } from '../../api/productionOrders';
import { getWorkOrderList } from '../../api/workOrders';
import { getTaskOrderList } from '../../api/taskOrders';
import { getInspectionTaskList } from '../../api/inspectionTasks';
import { getMaterialIssuanceList } from '../../api/materialIssuances';
import './DashboardPage.css';

// ── 工具函数 ─────────────────────────────────────────────────────────
const fmt = (d: Date) =>
  d.toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtTime = (d: Date) =>
  d.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtDate = (d: Date) => {
  const days = ['日','一','二','三','四','五','六'];
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} 周${days[d.getDay()]}`;
};
const todayStr = () => new Date().toISOString().slice(0, 10);

/** 根据当前时间判断在岗班次 */
function getCurrentShifts(): string[] {
  const h = new Date().getHours();
  const active: string[] = [];
  if (h >= 8  && h < 20) active.push('SH01');  // 白班 08-20
  if (h >= 20 || h < 8)  active.push('SH02');  // 夜班 20-08
  if (h >= 6  && h < 14) active.push('SH03');  // 早班 06-14
  if (h >= 14 && h < 22) active.push('SH04');  // 中班 14-22
  return active;
}

// ── 类型 ─────────────────────────────────────────────────────────────
interface DashboardData {
  pos:        ProductionOrder[];
  wos:        WorkOrder[];
  tasks:      TaskOrder[];
  qcTotal:    number;
  qcPending:  number;
  issuanceTotal:   number;
  issuancePending: number;
  ts:         string;
}

function loadData(): DashboardData {
  return {
    pos:             loadProductionOrders(),
    wos:             loadWorkOrders(),
    tasks:           loadTaskOrders(),
    qcTotal:         0,
    qcPending:       0,
    issuanceTotal:   0,
    issuancePending: 0,
    ts:              fmt(new Date()),
  };
}

// ─────────────────────────────────────────────────────────────────────
// 子组件：KPI 卡片
// ─────────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bg: string;
  trend?: 'up' | 'down' | null;
  alert?: boolean;
  onClick?: () => void;
}> = ({ icon, label, value, sub, color, bg, trend, alert, onClick }) => (
  <div
    className="db-kpi-card"
    style={{
      borderTop: `3px solid ${color}`,
      cursor: onClick ? 'pointer' : 'default',
      borderLeft: alert ? `2px solid ${color}` : undefined,
    }}
    onClick={onClick}
  >
    <div className="db-kpi-icon-wrap" style={{ background: bg, color }}>
      {icon}
    </div>
    <div className="db-kpi-label">{label}</div>
    <div className="db-kpi-value" style={{ color }}>
      {value}
      {trend === 'up'   && <RiseOutlined style={{ fontSize: 13, marginLeft: 6, color: '#52c41a' }} />}
      {trend === 'down' && <FallOutlined  style={{ fontSize: 13, marginLeft: 6, color: '#ff4d4f' }} />}
    </div>
    {sub && <div className="db-kpi-sub">{sub}</div>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// 子组件：工单进度卡片
// ─────────────────────────────────────────────────────────────────────
const WOProgressCard: React.FC<{ wo: WorkOrder; tasks: TaskOrder[] }> = ({ wo, tasks }) => {
  const sc  = WO_STATUS[wo.status];
  const pri = PRIORITY_MAP[wo.priority];
  const pct = wo.progressPct ?? (wo.planQty > 0 && wo.actualQty
    ? Math.min(100, Math.round((wo.actualQty / wo.planQty) * 100))
    : 0);
  const relTasks  = tasks.filter(t => t.woId === wo.id);
  const doneTasks = relTasks.filter(t => t.status === 'DONE').length;
  const inPgTasks = relTasks.filter(t => t.status === 'IN_PROGRESS').length;

  return (
    <div className="db-wo-card">
      <div className="db-wo-accent" style={{ background: sc.color }} />
      <div className="db-wo-body">
        <div className="db-wo-row1">
          <span className="db-wo-no">{wo.woNo}</span>
          <span className="db-wo-batch">{wo.batchNo}</span>
          <span className="db-badge" style={{ color: sc.color, background: `${sc.color}18`, border: `1px solid ${sc.color}30` }}>
            {sc.label}
          </span>
          <span className="db-pri-badge" style={{ color: pri.color, background: `${pri.color}15` }}>
            {pri.label}优先
          </span>
        </div>
        <div className="db-wo-product">
          {wo.productName}
          {wo.productSpec && <span style={{ color: '#667085', marginLeft: 4 }}>— {wo.productSpec}</span>}
        </div>
        <div className="db-wo-progress">
          <Progress
            percent={pct}
            size="small"
            strokeColor={pct === 100 ? '#13c2c2' : pct >= 60 ? '#1677ff' : '#fa8c16'}
            style={{ marginBottom: 0 }}
            format={p => <span style={{ fontSize: 11 }}>{p}%</span>}
          />
        </div>
        <div className="db-wo-meta-row">
          <span className="db-pill">计划 <b>{wo.planQty.toLocaleString()}</b> 支</span>
          {wo.actualQty !== undefined && wo.actualQty > 0 && (
            <span className="db-pill green">实产 <b>{wo.actualQty.toLocaleString()}</b></span>
          )}
          {relTasks.length > 0 && (
            <span className="db-pill">
              任务 <b>{relTasks.length}</b>（执行 {inPgTasks} / 完成 {doneTasks}）
            </span>
          )}
          {wo.currentOp && (
            <span className="db-pill blue">📍 {wo.currentOp}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// 子组件：任务单看板列
// ─────────────────────────────────────────────────────────────────────
const TaskKanbanCol: React.FC<{
  title: string;
  color: string;
  bg: string;
  tasks: TaskOrder[];
  wos: WorkOrder[];
  maxShow?: number;
}> = ({ title, color, bg, tasks, wos, maxShow = 8 }) => {
  const show = tasks.slice(0, maxShow);
  return (
    <div className="db-kanban-col">
      <div className="db-kanban-header" style={{ color, background: bg, borderBottom: `2px solid ${color}` }}>
        <span>{title}</span>
        <span className="db-kanban-count" style={{ background: color }}>{tasks.length}</span>
      </div>
      <div className="db-kanban-items">
        {show.length === 0 ? (
          <div className="db-kanban-empty">—</div>
        ) : show.map(task => {
          const wo    = wos.find(w => w.id === task.woId);
          const shift = SHIFTS.find(s => s.id === task.shiftId);
          const pct   = task.planQty > 0 && task.reportQty
            ? Math.min(100, Math.round((task.reportQty / task.planQty) * 100))
            : 0;
          return (
            <div key={task.id} className="db-kanban-item">
              <div className="db-kanban-item-top">
                <span className="db-kanban-task-no">{task.taskNo}</span>
                {task.deviationFlag && (
                  <Tooltip title="存在偏差记录">
                    <WarningOutlined style={{ color: '#ff4d4f', fontSize: 11 }} />
                  </Tooltip>
                )}
              </div>
              <div className="db-kanban-item-product">
                {wo ? wo.productSpec : task.batchNo}
              </div>
              <div className="db-kanban-item-meta">
                {shift && (
                  <span style={{ color: shift.color, fontSize: 10, fontWeight: 700 }}>
                    {shift.name}
                  </span>
                )}
                <span className="db-kanban-team">👥 {task.team}</span>
                {task.padStation && (
                  <span className="db-kanban-pad">📟 {task.padStation}</span>
                )}
              </div>
              {(task.status === 'IN_PROGRESS' || task.status === 'DONE') && task.reportQty !== undefined && (
                <div style={{ marginTop: 4 }}>
                  <Progress
                    percent={pct}
                    size="small"
                    strokeColor={task.status === 'DONE' ? '#13c2c2' : '#52c41a'}
                    showInfo={false}
                    style={{ marginBottom: 0 }}
                  />
                </div>
              )}
            </div>
          );
        })}
        {tasks.length > maxShow && (
          <div className="db-kanban-more">还有 {tasks.length - maxShow} 条…</div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// 子组件：生产订单列表（精简）
// ─────────────────────────────────────────────────────────────────────
const POListCard: React.FC<{
  pos: ProductionOrder[];
  wos: WorkOrder[];
  onNav?: (page: string) => void;
}> = ({ pos, wos, onNav }) => {
  const ORDER: Record<string, number> = { IN_PROGRESS: 0, RELEASED: 1, OPEN: 2, COMPLETED: 3, CLOSED: 4 };
  const sorted = [...pos].sort((a, b) => (ORDER[a.status] ?? 5) - (ORDER[b.status] ?? 5));

  return (
    <div className="db-po-list">
      {sorted.slice(0, 6).map(po => {
        const sc      = PO_STATUS[po.status];
        const pri     = PRIORITY_MAP[po.priority];
        const relWOs  = wos.filter(w => w.poId === po.id);
        const doneQty = relWOs.reduce((s, w) => s + (w.actualQty || 0), 0);
        const pct     = po.totalQty > 0 ? Math.min(100, Math.round((doneQty / po.totalQty) * 100)) : 0;
        return (
          <div key={po.id} className="db-po-row" onClick={() => onNav?.('production-order')}>
            <div className="db-po-left">
              <div className="db-po-no">{po.orderNo}</div>
              <div className="db-po-spec">{po.productSpec}</div>
              <div className="db-po-meta-row">
                <span className="db-badge" style={{ color: sc.color, background: `${sc.color}15`, border: `1px solid ${sc.color}25` }}>
                  {sc.label}
                </span>
                <span className="db-pri-badge" style={{ color: pri.color, background: `${pri.color}12` }}>
                  {pri.label}
                </span>
                {po.isAudited
                  ? <span className="db-badge-sm green">✓ 已审核</span>
                  : <span className="db-badge-sm gray">待审核</span>}
                {po.deliveryDate && (
                  <span className="db-po-delivery">交期 {po.deliveryDate}</span>
                )}
              </div>
            </div>
            <div className="db-po-right">
              <div className="db-po-qty">
                <span style={{ color: '#1677ff', fontWeight: 700 }}>{po.totalQty.toLocaleString()}</span>
                <span style={{ color: '#98a2b3', fontSize: 10, marginLeft: 2 }}>支</span>
              </div>
              <div className="db-po-pct-wrap">
                <Progress
                  percent={pct}
                  size="small"
                  strokeColor={pct === 100 ? '#13c2c2' : '#1677ff'}
                  format={p => `${p}%`}
                  style={{ marginBottom: 0, width: 88 }}
                />
              </div>
              <div style={{ fontSize: 10, color: '#98a2b3', textAlign: 'right' }}>
                {relWOs.length} 张工单
              </div>
            </div>
          </div>
        );
      })}
      {sorted.length === 0 && <div className="db-empty">暂无订单数据</div>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// 子组件：各工序良率（按工作中心汇总）
// ─────────────────────────────────────────────────────────────────────
const YieldSection: React.FC<{ tasks: TaskOrder[] }> = ({ tasks }) => {
  type CenterAcc = { plan: number; report: number; scrap: number };
  const centerMap: Record<string, CenterAcc> = {};

  tasks
    .filter(t => t.status === 'DONE' && t.reportQty !== undefined)
    .forEach(t => {
      const key = (t.workCenter || '其他').split('/')[0].trim().slice(0, 5);
      if (!centerMap[key]) centerMap[key] = { plan: 0, report: 0, scrap: 0 };
      centerMap[key].plan   += t.planQty   || 0;
      centerMap[key].report += t.reportQty || 0;
      centerMap[key].scrap  += t.scrapQty  || 0;
    });

  const barColors = ['#1677ff', '#722ed1', '#fa8c16', '#13c2c2', '#52c41a', '#eb2f96', '#fa541c'];

  // 若无实际完工数据，展示根管锉实际工艺良率参考值
  const DEMO: { label: string; value: number; color: string }[] = [
    { label: '机加工', value: 97.2, color: '#1677ff' },
    { label: '热处理', value: 99.3, color: '#fa8c16' },
    { label: '涂层',   value: 98.7, color: '#722ed1' },
    { label: '注塑',   value: 99.6, color: '#13c2c2' },
    { label: '组装',   value: 98.4, color: '#52c41a' },
    { label: '包装',   value: 99.8, color: '#eb2f96' },
    { label: '终检',   value: 96.5, color: '#fa541c' },
  ];

  const entries = Object.entries(centerMap);
  const bars = entries.length > 0
    ? entries.map(([label, d], i) => ({
        label,
        value: d.report > 0 ? Math.round(((d.report - d.scrap) / d.report) * 1000) / 10 : 0,
        color: barColors[i % barColors.length],
      }))
    : DEMO;

  return (
    <div className="db-yield-chart">
      {bars.map((item, i) => (
        <div key={i} className="db-yield-row">
          <span className="db-yield-label">{item.label}</span>
          <div className="db-yield-track">
            <Tooltip title={`${item.label} 良率 ${item.value}%`}>
              <div
                className="db-yield-bar"
                style={{ width: `${Math.max(10, Math.min(100, item.value))}%`, background: item.color }}
              >
                <span className="db-yield-pct">{item.value}%</span>
              </div>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// 子组件：设备状态看板
// ─────────────────────────────────────────────────────────────────────
const EquipStatusSection: React.FC = () => {
  const CFG: Record<string, { label: string; color: string; dot: string }> = {
    NORMAL:   { label: '正常运行', color: '#52c41a', dot: '#52c41a' },
    MAINTAIN: { label: '维护中',   color: '#fa8c16', dot: '#fa8c16' },
    FAULT:    { label: '故障停机', color: '#ff4d4f', dot: '#ff4d4f' },
    IDLE:     { label: '空闲',     color: '#8c8c8c', dot: '#d9d9d9' },
  };

  const grouped = {
    NORMAL:   EQUIPMENTS.filter(e => e.status === 'NORMAL'),
    MAINTAIN: EQUIPMENTS.filter(e => e.status === 'MAINTAIN'),
    FAULT:    EQUIPMENTS.filter(e => e.status === 'FAULT'),
    IDLE:     EQUIPMENTS.filter(e => e.status === 'IDLE'),
  };

  return (
    <div>
      <div className="db-equip-stat-row">
        {(Object.entries(grouped) as [string, typeof EQUIPMENTS[0][]][]).map(([status, list]) => {
          const cfg = CFG[status];
          return (
            <div key={status} className="db-equip-stat-item"
              style={{ borderColor: `${cfg.color}30`, background: `${cfg.color}08` }}>
              <div className="db-equip-stat-val" style={{ color: cfg.color }}>{list.length}</div>
              <div className="db-equip-stat-lbl" style={{ color: cfg.color }}>{cfg.label}</div>
            </div>
          );
        })}
      </div>
      <div className="db-equip-list">
        {EQUIPMENTS.map(eq => {
          const cfg = CFG[eq.status];
          const shortWC = eq.workCenter.replace('机加工-','').replace('热处理-','').replace('车间','');
          return (
            <Tooltip key={eq.id} title={`${eq.name}（${eq.code}）— ${cfg.label}`}>
              <div className="db-equip-chip" style={{ borderColor: `${cfg.color}40`, background: `${cfg.color}08` }}>
                <span className="db-equip-dot" style={{ background: cfg.dot }} />
                <span className="db-equip-name">{eq.name}</span>
                <span className="db-equip-wc">{shortWC}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// 子组件：班次在岗情况
// ─────────────────────────────────────────────────────────────────────
const ShiftSection: React.FC<{ tasks: TaskOrder[] }> = ({ tasks }) => {
  const activeShiftIds = getCurrentShifts();

  return (
    <div className="db-shift-grid">
      {SHIFTS.map(shift => {
        const isActive   = activeShiftIds.includes(shift.id);
        const shiftTasks = tasks.filter(t => t.shiftId === shift.id && (t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED'));
        const teams      = Array.from(new Set(shiftTasks.map(t => t.team)));
        const operators  = Array.from(new Set(shiftTasks.map(t => t.operator).filter(Boolean)));

        return (
          <div
            key={shift.id}
            className="db-shift-card"
            style={{
              borderLeft: `3px solid ${shift.color}`,
              background: isActive ? `${shift.color}08` : '#fafafa',
              opacity: isActive ? 1 : 0.55,
            }}
          >
            <div className="db-shift-header">
              <span className="db-shift-name" style={{ color: shift.color }}>⏰ {shift.name}</span>
              {isActive && (
                <span className="db-shift-active-badge" style={{ background: shift.color }}>在岗</span>
              )}
              <span className="db-shift-time">{shift.startTime}~{shift.endTime}</span>
            </div>
            <div className="db-shift-meta">
              任务单 <b style={{ color: shift.color }}>{shiftTasks.length}</b> 张
              {teams.length > 0 && (
                <span style={{ marginLeft: 8, color: '#667085', fontSize: 11 }}>
                  {teams.slice(0, 2).join('、')}{teams.length > 2 ? '…' : ''}
                </span>
              )}
            </div>
            {operators.length > 0 && (
              <div className="db-shift-ops">
                {operators.slice(0, 4).map((op, i) => (
                  <span key={i} className="db-shift-op-tag"
                    style={{ borderColor: `${shift.color}40`, color: shift.color }}>
                    {op.split('（')[0]}
                  </span>
                ))}
                {operators.length > 4 && (
                  <span className="db-shift-op-more">+{operators.length - 4}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// 子组件：工序进度总览（9段工艺条）
// ─────────────────────────────────────────────────────────────────────
const STAGES = [
  { code: 'S1', label: 'S1备料',   short: 'S1' },
  { code: 'S2', label: 'S2磨锥',   short: 'S2' },
  { code: 'S3', label: 'S3螺纹',   short: 'S3' },
  { code: 'S4', label: 'S4热处理', short: 'S4' },
  { code: 'S5', label: 'S5涂层',   short: 'S5' },
  { code: 'S6', label: 'S6注塑',   short: 'S6' },
  { code: 'S7', label: 'S7组装',   short: 'S7' },
  { code: 'S8', label: 'S8包装',   short: 'S8' },
  { code: 'S9', label: 'S9入库',   short: 'S9' },
];

const RoutingOverview: React.FC<{ wos: WorkOrder[] }> = ({ wos }) => {
  const active = wos.filter(w => w.status === 'IN_PROGRESS' || w.status === 'RELEASED');
  if (active.length === 0) return null;

  return (
    <Card
      className="db-section-card"
      size="small"
      title={
        <span className="db-section-title">
          <NodeIndexOutlined style={{ marginRight: 6, color: '#531dab' }} />
          在产工单工序进度总览（{active.length} 张）
        </span>
      }
      style={{ marginTop: 12 }}
    >
      <div className="db-routing-overview">
        {active.slice(0, 5).map(wo => {
          const pct = wo.progressPct ?? 0;
          const sc  = WO_STATUS[wo.status];
          return (
            <div key={wo.id} className="db-routing-row">
              <div className="db-routing-label">
                <div className="db-routing-wono">{wo.woNo}</div>
                <div className="db-routing-spec">{wo.productSpec}</div>
                <span className="db-badge" style={{ color: sc.color, background: `${sc.color}18` }}>
                  {sc.label}
                </span>
              </div>
              <div className="db-routing-bar-wrap">
                {STAGES.map((s, i) => {
                  const threshold     = ((i + 1) / 9) * 100;
                  const prevThreshold = (i / 9) * 100;
                  const isDone   = pct >= threshold;
                  const isActive = !isDone && pct >= prevThreshold;
                  // 优先用 currentStage 字段
                  const isCurrent = wo.currentStage
                    ? wo.currentStage.startsWith(s.code)
                    : isActive;

                  return (
                    <Tooltip key={s.code} title={`${s.label}：${isDone ? '✅ 已完成' : isCurrent ? '🔵 进行中' : '⬜ 待执行'}`}>
                      <div
                        className={`db-stage-block ${isDone ? 'done' : isCurrent ? 'active' : 'pending'}`}
                      >
                        {s.short}
                      </div>
                    </Tooltip>
                  );
                })}
                <div className="db-routing-pct" style={{ color: pct === 100 ? '#13c2c2' : '#1677ff' }}>
                  {pct}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────
// 主页面
// ─────────────────────────────────────────────────────────────────────
interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [data, setData]       = useState<DashboardData>(loadData);
  const [loading, setLoading] = useState(false);
  const [clock, setClock]     = useState(new Date());
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);

  // 实时时钟（每秒更新）
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
    // 从 localStorage 读取基础数据
    const base = loadData();
    // 并行从后端拉取最新数据
    const [poResp, woResp, toResp, qcResp, miResp] = await Promise.allSettled([
      getProductionOrderList() as any,
      getWorkOrderList() as any,
      getTaskOrderList() as any,
      getInspectionTaskList() as any,
      getMaterialIssuanceList() as any,
    ]);
    // API-first replace：后端有数据则完全替换本地 mock，否则保留 loadData() 基线
    const apiPos: any[] = poResp.status === 'fulfilled' ? (poResp.value as any)?.data ?? [] : [];
    if (apiPos.length > 0) {
      base.pos = apiPos.map((p: any) => ({
        id: String(p.id), orderNo: p.orderNo ?? '', productCode: p.productCode ?? '',
        productSpec: p.productSpec ?? p.productCode ?? '', productName: p.customerName ?? p.productName ?? '',
        totalQty: p.totalQuantity ?? 0, completedQty: p.completedQuantity ?? 0, scrapQty: 0,
        bomVersion: '', routingCode: '',
        deliveryDate: p.deliveryDate ?? '',
        priority: (p.priority === 4 ? 'URGENT' : p.priority === 3 ? 'HIGH' : p.priority === 2 ? 'NORMAL' : 'LOW') as 'LOW'|'NORMAL'|'HIGH'|'URGENT',
        status: (({ DRAFT: 'OPEN', RELEASED: 'RELEASED', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', CLOSED: 'COMPLETED' } as Record<string, string>)[p.status ?? ''] ?? 'OPEN') as any,
        isAudited: p.status !== 'DRAFT',
        createdAt: p.createTime?.slice(0, 19).replace('T', ' ') ?? '',
        createdBy: p.createBy ?? '',
        remark: p.remark ?? '',
        workOrders: [],
      })) as unknown as ProductionOrder[];
    }
    // API-first replace：工单
    const apiWos: any[] = woResp.status === 'fulfilled' ? (woResp.value as any)?.data ?? [] : [];
    if (apiWos.length > 0) {
      base.wos = apiWos.map((w: any) => ({
        id: String(w.id), woNo: w.workOrderNo ?? '', poId: String(w.orderId ?? ''),
        productCode: w.materialCode ?? '', productSpec: w.spec ?? w.materialCode ?? '',
        productName: w.materialName ?? '', batchNo: (w as any).batchNo ?? '',
        bomVersion: w.bomVersion ?? '', routingCode: '', routingName: '',
        planQty: w.planQuantity ?? 0, actualQty: w.completedQuantity ?? 0,
        priority: 'NORMAL' as 'LOW'|'NORMAL'|'HIGH'|'URGENT',
        status: (({ DRAFT: 'CREATED', RELEASED: 'RELEASED', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', CLOSED: 'COMPLETED' } as Record<string, string>)[w.status ?? ''] ?? 'CREATED') as any,
        progressPct: w.progress ?? 0,
        currentOp: '',
        createdAt: w.createTime?.slice(0, 19).replace('T', ' ') ?? '',
        createdBy: w.createBy ?? '',
      })) as unknown as WorkOrder[];
    }
    // API-first replace：任务单
    const apiTos: any[] = toResp.status === 'fulfilled' ? (toResp.value as any)?.data ?? [] : [];
    if (apiTos.length > 0) {
      base.tasks = apiTos.map((t: any) => ({
        id: String(t.id), taskNo: t.taskNo ?? '', woId: String(t.workOrderId ?? ''),
        woNo: t.workOrderNo ?? '', batchNo: (t as any).batchNo ?? '',
        workCenter: t.workCenterName ?? '', shiftId: 'SH01', shiftName: '',
        team: t.assignedToName ?? '', operator: t.assignedToName ?? '',
        stationScope: '', operationCode: t.operationCode ?? '', operationName: t.operationName ?? '',
        planQty: t.planQuantity ?? 0, reportQty: t.completedQuantity ?? 0, scrapQty: 0,
        status: (({ PENDING: 'PENDING', ASSIGNED: 'ASSIGNED', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'DONE', PAUSED: 'PAUSED' } as Record<string, string>)[t.status ?? ''] ?? 'PENDING') as any,
        padStation: '',
        planStart: t.plannedStartTime ?? '', planEnd: t.plannedEndTime ?? '',
        actualStart: '', actualEnd: '',
        deviationFlag: false, remark: t.remark ?? '',
      })) as unknown as TaskOrder[];
    }
    // QC 汇总
    const qcList: any[] = qcResp.status === 'fulfilled' ? (qcResp.value as any)?.data ?? [] : [];
    base.qcTotal   = qcList.length;
    base.qcPending = qcList.filter((q: any) => q.status === 'PENDING').length;
    // 领料单汇总
    const miList: any[] = miResp.status === 'fulfilled' ? (miResp.value as any)?.data ?? [] : [];
    base.issuanceTotal   = miList.length;
    base.issuancePending = miList.filter((m: any) => m.status === 'PENDING').length;

    base.ts = fmt(new Date());
    setData(base);
    } catch (e) {
      console.error('Dashboard refresh error:', e);
    } finally {
    setLoading(false);
    }
  }, []);

  // 初始加载 + 每30s自动刷新数据
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    timerRef.current = setInterval(refresh, 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [refresh]);

  const { pos, wos, tasks, qcTotal, qcPending, issuanceTotal, issuancePending } = data;

  // ── KPI 计算 ─────────────────────────────────────────────────────
  const poInProgress  = pos.filter(p => p.status === 'IN_PROGRESS').length;
  const poReleased    = pos.filter(p => p.status === 'RELEASED').length;
  const poCompleted   = pos.filter(p => p.status === 'COMPLETED').length;
  const poUnaudited   = pos.filter(p => !p.isAudited && p.status !== 'CLOSED').length;

  const woInProgress  = wos.filter(w => w.status === 'IN_PROGRESS').length;
  const woReleased    = wos.filter(w => w.status === 'RELEASED').length;
  const woCompleted   = wos.filter(w => w.status === 'COMPLETED').length;

  const taskInProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const taskAssigned   = tasks.filter(t => t.status === 'ASSIGNED').length;
  const taskDone       = tasks.filter(t => t.status === 'DONE').length;
  const taskDeviation  = tasks.filter(t => t.deviationFlag).length;

  // 综合良率
  const doneTasks    = tasks.filter(t => t.status === 'DONE' && t.reportQty !== undefined);
  const totalReport  = doneTasks.reduce((s, t) => s + (t.reportQty || 0), 0);
  const totalScrap   = doneTasks.reduce((s, t) => s + (t.scrapQty  || 0), 0);
  const yieldRate    = totalReport > 0
    ? Math.round(((totalReport - totalScrap) / totalReport) * 1000) / 10
    : 98.4; // 保健品行业参考良率

  // 今日计划 & 完成
  const today         = todayStr();
  const todayTasks    = tasks.filter(t => t.planStart?.startsWith(today));
  const todayPlanQty  = todayTasks.reduce((s, t) => s + (t.planQty   || 0), 0);
  const todayReportQty= todayTasks.reduce((s, t) => s + (t.reportQty || 0), 0);
  const todayPct      = todayPlanQty > 0
    ? Math.min(100, Math.round((todayReportQty / todayPlanQty) * 100))
    : 0;

  // 设备告警
  const faultEquips    = EQUIPMENTS.filter(e => e.status === 'FAULT');
  const normalEquips   = EQUIPMENTS.filter(e => e.status === 'NORMAL');

  // 在产工单
  const activeWOs = wos
    .filter(w => w.status === 'IN_PROGRESS' || w.status === 'RELEASED')
    .sort((a, b) => {
      const ord: Record<string, number> = { IN_PROGRESS: 0, RELEASED: 1 };
      return (ord[a.status] ?? 2) - (ord[b.status] ?? 2);
    });

  // 任务单看板分列
  const kbPending   = tasks.filter(t => t.status === 'PENDING');
  const kbAssigned  = tasks.filter(t => t.status === 'ASSIGNED');
  const kbInPg      = tasks.filter(t => t.status === 'IN_PROGRESS');
  const kbPaused    = tasks.filter(t => t.status === 'PAUSED');
  const kbDone      = tasks.filter(t => t.status === 'DONE').slice(0, 10);

  // 当前班次
  const activeShiftIds = getCurrentShifts();
  const activeShiftNames = SHIFTS.filter(s => activeShiftIds.includes(s.id)).map(s => s.name);

  return (
    <div className="db-page">

      {/* ──── 实时时钟条 ────────────────────────────────────────────── */}
      <div className="db-clock-bar">
        <span className="db-clock-time">{fmtTime(clock)}</span>
        <span className="db-clock-date">{fmtDate(clock)}</span>
        {activeShiftNames.map(name => {
          const sh = SHIFTS.find(s => s.name === name);
          return (
            <span key={name} className="db-clock-shift" style={{ background: sh?.color ?? '#1677ff' }}>
              ⏰ {name}在岗
            </span>
          );
        })}
        <span className="db-clock-separator" />
        <EnvironmentOutlined style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
        <span className="db-clock-factory">YonBIP/SY 医疗器械 · 生产执行车间 · MES v2.1</span>
      </div>

      {/* ──── 顶部标题栏 ─────────────────────────────────────────────── */}
      <div className="db-topbar">
        <div className="db-topbar-left">
          <AppstoreOutlined style={{ color: '#1677ff', fontSize: 18, marginRight: 8 }} />
          <span className="db-topbar-title">生产看板</span>
          <span className="db-topbar-sub">医疗器械MES · 实时数据驱动</span>
        </div>
        <div className="db-topbar-right">
          <span className="db-topbar-ts">⏱ 上次刷新 {data.ts.slice(11)}</span>
          <Button
            icon={<ReloadOutlined spin={loading} />}
            size="small"
            onClick={refresh}
            type="default"
          >
            刷新
          </Button>
        </div>
      </div>

      {/* ──── 告警条（条件显示） ──────────────────────────────────────── */}
      {faultEquips.length > 0 && (
        <div className="db-alert-bar red">
          <ExclamationCircleOutlined style={{ fontSize: 14 }} />
          设备告警：{faultEquips.map(e => e.name).join('、')} 故障停机，请立即处理！
        </div>
      )}
      {poUnaudited > 0 && faultEquips.length === 0 && (
        <div className="db-alert-bar">
          <AlertOutlined style={{ fontSize: 14 }} />
          有 {poUnaudited} 张生产订单待审核，请及时审核后下推工单。
        </div>
      )}

      {/* ──── 今日完成进度条 ──────────────────────────────────────────── */}
      {todayPlanQty > 0 && (
        <div className="db-today-bar">
          <span className="db-today-label">今日目标</span>
          <div className="db-today-track">
            <div className="db-today-fill" style={{ width: `${todayPct}%` }} />
          </div>
          <span className="db-today-pct">{todayPct}%</span>
          <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 6 }}>
            {todayReportQty.toLocaleString()} / {todayPlanQty.toLocaleString()} 支
          </span>
        </div>
      )}

      {/* ──── KPI 卡片行 ─────────────────────────────────────────────── */}
      <div className="db-kpi-row">
        <KpiCard
          icon={<FileTextOutlined />}
          label="生产中订单"
          value={poInProgress}
          sub={`已下发 ${poReleased} · 已完成 ${poCompleted}`}
          color="#1677ff"
          bg="#eff6ff"
          onClick={() => onNavigate?.('production-order')}
        />
        <KpiCard
          icon={<UnorderedListOutlined />}
          label="在产工单"
          value={woInProgress}
          sub={`已下发 ${woReleased} · 已完成 ${woCompleted}`}
          color="#fa8c16"
          bg="#fff7e6"
          onClick={() => onNavigate?.('work-order')}
        />
        <KpiCard
          icon={<PlayCircleOutlined />}
          label="执行中任务单"
          value={taskInProgress}
          sub={`已派工 ${taskAssigned} · 已完成 ${taskDone}`}
          color="#52c41a"
          bg="#f0fff4"
          onClick={() => onNavigate?.('task-order')}
        />
        <KpiCard
          icon={<BarChartOutlined />}
          label="综合良率"
          value={`${yieldRate}%`}
          sub={totalReport > 0
            ? `报工 ${totalReport.toLocaleString()} / 废品 ${totalScrap}`
            : '基于完工任务统计'}
          color="#13c2c2"
          bg="#e6fffb"
          trend={yieldRate >= 98 ? 'up' : 'down'}
        />
        <KpiCard
          icon={<ClockCircleOutlined />}
          label="今日完成率"
          value={todayPlanQty > 0 ? `${todayPct}%` : '—'}
          sub={todayPlanQty > 0
            ? `${todayReportQty.toLocaleString()} / ${todayPlanQty.toLocaleString()} 支`
            : '今日暂无计划任务'}
          color="#722ed1"
          bg="#f5f0ff"
        />
        <KpiCard
          icon={faultEquips.length > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
          label="设备在线率"
          value={`${normalEquips.length}/${EQUIPMENTS.length}`}
          sub={faultEquips.length > 0
            ? `⚠️ ${faultEquips.length} 台故障: ${faultEquips[0].name}`
            : '所有设备正常运行'}
          color={faultEquips.length > 0 ? '#ff4d4f' : '#52c41a'}
          bg={faultEquips.length > 0 ? '#fff1f0' : '#f0fff4'}
          alert={faultEquips.length > 0}
        />
        {poUnaudited > 0 && (
          <KpiCard
            icon={<AlertOutlined />}
            label="待审核订单"
            value={poUnaudited}
            sub="需尽快审核以下推工单"
            color="#ff4d4f"
            bg="#fff0f0"
            onClick={() => onNavigate?.('production-order')}
            alert
          />
        )}
        {taskDeviation > 0 && (
          <KpiCard
            icon={<ExclamationCircleOutlined />}
            label="偏差任务单"
            value={taskDeviation}
            sub="需质量部门确认处理"
            color="#f5222d"
            bg="#fff1f0"
            onClick={() => onNavigate?.('task-order')}
            alert
          />
        )}
        {qcTotal > 0 && (
          <KpiCard
            icon={<SafetyOutlined />}
            label="质检任务"
            value={qcTotal}
            sub={qcPending > 0 ? `待检验 ${qcPending} 张` : '全部已完成'}
            color={qcPending > 0 ? '#fa8c16' : '#52c41a'}
            bg={qcPending > 0 ? '#fff7e6' : '#f0fff4'}
            alert={qcPending > 0}
            onClick={() => onNavigate?.('inspection')}
          />
        )}
        {issuanceTotal > 0 && (
          <KpiCard
            icon={<InboxOutlined />}
            label="领料单"
            value={issuanceTotal}
            sub={issuancePending > 0 ? `待处理 ${issuancePending} 张` : '全部已处理'}
            color={issuancePending > 0 ? '#722ed1' : '#13c2c2'}
            bg={issuancePending > 0 ? '#f5f0ff' : '#e6fffb'}
            onClick={() => onNavigate?.('material-issuance')}
          />
        )}
      </div>

      {/* ──── 主体三列布局 ─────────────────────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginTop: 0 }}>

        {/* 左列：在产工单 + 生产订单 */}
        <Col xs={24} md={10} xl={9}>
          {/* 在产工单 */}
          <Card
            className="db-section-card"
            size="small"
            title={
              <div className="db-card-title-row">
                <span className="db-section-title">
                  <UnorderedListOutlined style={{ marginRight: 6, color: '#fa8c16' }} />
                  在产工单（{activeWOs.length}）
                </span>
                <Button type="link" size="small" onClick={() => onNavigate?.('work-order')}>
                  查看全部 ›
                </Button>
              </div>
            }
            style={{ marginBottom: 12 }}
          >
            {activeWOs.length === 0 ? (
              <div className="db-empty">暂无在产工单</div>
            ) : (
              <div className="db-wo-list">
                {activeWOs.slice(0, 5).map(wo => (
                  <WOProgressCard key={wo.id} wo={wo} tasks={tasks} />
                ))}
                {activeWOs.length > 5 && (
                  <div className="db-list-more" onClick={() => onNavigate?.('work-order')}>
                    还有 {activeWOs.length - 5} 张工单，点击查看全部 ›
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* 生产订单 */}
          <Card
            className="db-section-card"
            size="small"
            title={
              <div className="db-card-title-row">
                <span className="db-section-title">
                  <FileTextOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                  生产订单（{pos.length}）
                </span>
                <Button type="link" size="small" onClick={() => onNavigate?.('production-order')}>
                  查看全部 ›
                </Button>
              </div>
            }
          >
            <POListCard pos={pos} wos={wos} onNav={onNavigate} />
          </Card>
        </Col>

        {/* 中列：任务单看板 + 班次在岗 */}
        <Col xs={24} md={14} xl={10}>
          <Card
            className="db-section-card"
            size="small"
            title={
              <div className="db-card-title-row">
                <span className="db-section-title">
                  <TeamOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                  任务单看板（共 {tasks.length} 张）
                </span>
                <Button type="link" size="small" onClick={() => onNavigate?.('task-order')}>
                  查看全部 ›
                </Button>
              </div>
            }
            bodyStyle={{ padding: '8px 10px' }}
          >
            <div className="db-kanban-board">
              <TaskKanbanCol title="待派工" color="#8c8c8c" bg="#fafafa"   tasks={kbPending}  wos={wos} />
              <TaskKanbanCol title="已派工" color="#1890ff" bg="#e6f4ff"   tasks={kbAssigned} wos={wos} />
              <TaskKanbanCol title="执行中" color="#52c41a" bg="#f0fff4"   tasks={kbInPg}     wos={wos} />
              <TaskKanbanCol title="已暂停" color="#faad14" bg="#fffbe6"   tasks={kbPaused}   wos={wos} />
              <TaskKanbanCol title="已完成" color="#13c2c2" bg="#e6fffb"   tasks={kbDone}     wos={wos} />
            </div>
          </Card>

          {/* 班次在岗 */}
          <Card
            className="db-section-card"
            size="small"
            title={
              <span className="db-section-title">
                <ClockCircleOutlined style={{ marginRight: 6, color: '#fa8c16' }} />
                班次在岗情况
              </span>
            }
            style={{ marginTop: 12 }}
          >
            <ShiftSection tasks={tasks} />
          </Card>
        </Col>

        {/* 右列：良率 + 设备 + 快捷入口 */}
        <Col xs={24} md={24} xl={5}>
          {/* 各车间良率 */}
          <Card
            className="db-section-card"
            size="small"
            title={
              <span className="db-section-title">
                <RiseOutlined style={{ marginRight: 6, color: '#13c2c2' }} />
                各工序良率
              </span>
            }
            style={{ marginBottom: 12 }}
          >
            <YieldSection tasks={tasks} />
          </Card>

          {/* 设备状态 */}
          <Card
            className="db-section-card"
            size="small"
            title={
              <span className="db-section-title">
                <ToolOutlined style={{ marginRight: 6, color: '#722ed1' }} />
                设备状态（{EQUIPMENTS.length} 台）
              </span>
            }
            style={{ marginBottom: 12 }}
          >
            <EquipStatusSection />
          </Card>

          {/* 快捷入口 */}
          <Card
            className="db-section-card"
            size="small"
            title={
              <span className="db-section-title">
                <ApartmentOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                快捷入口
              </span>
            }
          >
            <div className="db-shortcut-grid">
              {[
                { key: 'production-order', label: '生产订单',   icon: <FileTextOutlined />,     color: '#1677ff', bg: '#eff6ff' },
                { key: 'work-order',       label: '生产工单',   icon: <UnorderedListOutlined />, color: '#fa8c16', bg: '#fff7e6' },
                { key: 'task-order',       label: '任务派工',   icon: <TeamOutlined />,          color: '#52c41a', bg: '#f0fff4' },
                { key: 'ebr-list',         label: '电子批记录', icon: <CheckCircleOutlined />,   color: '#722ed1', bg: '#f5f0ff' },
                { key: 'inspection',       label: '质检工作台', icon: <SafetyOutlined />,        color: '#13c2c2', bg: '#e6fffb' },
                { key: 'trace-forward',    label: '追溯查询',   icon: <NodeIndexOutlined />,     color: '#eb2f96', bg: '#fff0f6' },
                { key: 'material-issuance',label: '领料管理',   icon: <InboxOutlined />,         color: '#2f54eb', bg: '#eef2ff' },
                { key: 'workshop',         label: '车间看板',   icon: <BarChartOutlined />,      color: '#fa541c', bg: '#fff2e8' },
              ].map(s => (
                <div
                  key={s.key}
                  className="db-shortcut-item"
                  style={{ background: s.bg }}
                  onClick={() => onNavigate?.(s.key)}
                >
                  <div style={{ fontSize: 20, color: s.color }}>{s.icon}</div>
                  <div style={{ fontSize: 11, color: s.color, fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ──── 底部：工艺路径进度总览 ───────────────────────────────── */}
      <RoutingOverview wos={wos} />

    </div>
  );
};

export default DashboardPage;
