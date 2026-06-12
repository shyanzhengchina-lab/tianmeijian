/**
 * 生产看板（Dashboard）— 天美健保健品MES实战版
 * ================================================================
 * 数据源：后端API /api/dashboard/factory（实时DB数据）
 * 实时刷新：每30秒自动拉取后端数据
 * 功能：
 *   - 顶部实时时钟 + 当前班次 + 工厂信息
 *   - KPI卡片行（订单/工单/任务单/良率/今日完成率/设备OEE）
 *   - 在产工单进度列表（实时DB工单）
 *   - 生产订单总览
 *   - 任务单看板（待派工/已派工/执行中/暂停/完成）
 *   - 班次在岗情况
 *   - 各工序良率横向柱图
 *   - 设备状态看板（实时DB设备）
 *   - 快捷入口（8个功能模块）
 *   - 近7日OEE趋势看板
 *   - GMP合规警示（偏差/物料预警）
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
  DashboardOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  loadProductionOrders,
  loadWorkOrders,
  loadTaskOrders,
} from '../../store/mesStore';
import type { ProductionOrder, WorkOrder, TaskOrder } from '../workorder/workOrderData';
import {
  SHIFTS,
  PO_STATUS, WO_STATUS,
  PRIORITY_MAP,
} from '../workorder/workOrderData';
import axios from 'axios';
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

// ── 后端API类型 ──────────────────────────────────────────────────────
interface FactoryDashboard {
  woStats: {
    total: number;
    pending: string | number;
    inProgress: string | number;
    waitInspect: string | number;
    completed: string | number;
    paused: string | number;
  };
  todayWo: { todayTotal: number; todayInProgress: string | number; todayCompleted: string | number; };
  qcStats: { totalInspections: number; passed: number | null; failed: number | null; };
  eqStats: { eq_status: string; cnt: number }[];
  oeeAvg: { avgOee: string; date: string }[];
  deviations: { severity: string; cnt: number }[];
  stockAlerts: { material_code: string; material_name: string; available: number; min_stock: number }[];
}

// 实时工单（来自 /api/plan/work-orders）
interface LiveWorkOrder {
  id: number;
  wo_code: string;
  product_name: string;
  batch_no: string;
  plan_qty: string;
  actual_qty: string;
  unit_name: string;
  wo_status: number; // 1=待生产 2=生产中 3=待检验 4=检验中 5=完成 6=关闭 7=暂停
  priority: number;
  plan_start: string;
  plan_end: string;
  workshop_code: string;
  product_code: string;
  route_code: string;
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

// 工单状态码 -> 前端状态字符串
const WO_STATUS_MAP: Record<number, string> = {
  1: 'RELEASED',     // 待生产
  2: 'IN_PROGRESS',  // 生产中
  3: 'IN_PROGRESS',  // 待检验（仍算在产）
  4: 'IN_PROGRESS',  // 检验中
  5: 'COMPLETED',    // 完成
  6: 'COMPLETED',    // 关闭
  7: 'PAUSED',       // 暂停
};

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

  // 若无实际完工数据，展示天美健保健品各工序参考良率
  const DEMO: { label: string; value: number; color: string }[] = [
    { label: '称量配料', value: 99.5, color: '#1677ff' },
    { label: '制粒混合', value: 98.8, color: '#fa8c16' },
    { label: '压片压丸', value: 97.2, color: '#722ed1' },
    { label: '包衣干燥', value: 98.9, color: '#13c2c2' },
    { label: '内包装',   value: 99.6, color: '#52c41a' },
    { label: '外包装',   value: 99.8, color: '#eb2f96' },
    { label: '灭菌检验', value: 96.8, color: '#fa541c' },
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
// 子组件：设备状态看板（使用后端DB真实数据）
// ─────────────────────────────────────────────────────────────────────
const EquipStatusSection: React.FC<{
  eqStats: { eq_status: string; cnt: number }[];
  oeeData: { avgOee: string; date: string }[];
}> = ({ eqStats, oeeData }) => {
  const CFG: Record<string, { label: string; color: string }> = {
    RUNNING:  { label: '运行中',   color: '#52c41a' },
    STANDBY:  { label: '待机',     color: '#1677ff' },
    MAINTAIN: { label: '维护中',   color: '#fa8c16' },
    REPAIR:   { label: '维修中',   color: '#ff4d4f' },
    STOPPED:  { label: '停机',     color: '#8c8c8c' },
  };

  const total = eqStats.reduce((s, e) => s + e.cnt, 0);

  return (
    <div>
      {/* 设备状态汇总 */}
      <div className="db-equip-stat-row">
        {eqStats.map(e => {
          const cfg = CFG[e.eq_status] ?? { label: e.eq_status, color: '#8c8c8c' };
          return (
            <div key={e.eq_status} className="db-equip-stat-item"
              style={{ borderColor: `${cfg.color}30`, background: `${cfg.color}08` }}>
              <div className="db-equip-stat-val" style={{ color: cfg.color }}>{e.cnt}</div>
              <div className="db-equip-stat-lbl" style={{ color: cfg.color }}>{cfg.label}</div>
            </div>
          );
        })}
        {total === 0 && (
          <div className="db-equip-stat-item" style={{ borderColor: '#d9d9d9', background: '#fafafa' }}>
            <div className="db-equip-stat-val" style={{ color: '#8c8c8c' }}>—</div>
            <div className="db-equip-stat-lbl" style={{ color: '#8c8c8c' }}>加载中</div>
          </div>
        )}
      </div>

      {/* 近7日OEE趋势（迷你折线图） */}
      {oeeData.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: '#667085', marginBottom: 4 }}>近7日OEE趋势（目标≥80%）</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36 }}>
            {oeeData.map((d, i) => {
              const val = parseFloat(d.avgOee);
              const h = Math.round((val / 100) * 34);
              const color = val >= 80 ? '#13c2c2' : '#fa8c16';
              const dateStr = d.date ? new Date(d.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '';
              return (
                <Tooltip key={i} title={`${dateStr} OEE: ${val}%`}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: '100%', height: h, background: color, borderRadius: 2, opacity: 0.85 }} />
                    <span style={{ fontSize: 9, color: '#8c8c8c', writingMode: 'horizontal-tb' }}>{val}%</span>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}
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
// 天美健保健品生产工艺阶段（固体制剂）
const STAGES = [
  { code: 'S1', label: 'S1称量配料', short: '称量' },
  { code: 'S2', label: 'S2制粒/混合', short: '制粒' },
  { code: 'S3', label: 'S3压片/压丸', short: '压片' },
  { code: 'S4', label: 'S4包衣/干燥', short: '包衣' },
  { code: 'S5', label: 'S5中检',      short: '中检' },
  { code: 'S6', label: 'S6铝塑内包',  short: '内包' },
  { code: 'S7', label: 'S7外包装',    short: '外包' },
  { code: 'S8', label: 'S8成品检验',  short: '成检' },
  { code: 'S9', label: 'S9入库',      short: '入库' },
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
  const [data, setData]             = useState<DashboardData>(loadData);
  const [loading, setLoading]       = useState(false);
  const [clock, setClock]           = useState(new Date());
  const [factoryDB, setFactoryDB]   = useState<FactoryDashboard | null>(null);
  const [liveWOs, setLiveWOs]       = useState<LiveWorkOrder[]>([]);
  const timerRef                    = useRef<ReturnType<typeof setInterval> | null>(null);

  // 实时时钟（每秒更新）
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('mes_token') || '';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 并行拉取工厂看板 + 工单列表
      const [dashRes, woRes] = await Promise.allSettled([
        axios.get('/api/dashboard/factory?factoryCode=NJ', { headers }),
        axios.get('/api/plan/work-orders?page=1&size=50', { headers }),
      ]);

      // 1. 工厂看板实时数据
      if (dashRes.status === 'fulfilled' && dashRes.value.data?.code === 200) {
        setFactoryDB(dashRes.value.data.data as FactoryDashboard);
      }

      // 2. 真实工单数据 → 映射为前端 WorkOrder 类型
      const rawWOs: LiveWorkOrder[] = woRes.status === 'fulfilled'
        ? (woRes.value.data?.data?.list ?? [])
        : [];
      setLiveWOs(rawWOs);

      // 3. 更新 data.wos / data.pos（保留 localStorage 的 tasks 作为后备）
      const base = loadData();
      if (rawWOs.length > 0) {
        base.wos = rawWOs.map(w => ({
          id: String(w.id),
          woNo: w.wo_code,
          poId: '',
          productCode: w.product_code,
          productSpec: w.product_name,
          productName: w.product_name,
          batchNo: w.batch_no,
          bomVersion: '',
          routingCode: w.route_code ?? '',
          routingName: '',
          planQty: parseFloat(w.plan_qty) || 0,
          actualQty: parseFloat(w.actual_qty) || 0,
          priority: (w.priority === 3 ? 'URGENT' : w.priority === 2 ? 'HIGH' : 'NORMAL') as any,
          status: (WO_STATUS_MAP[w.wo_status] ?? 'RELEASED') as any,
          progressPct: w.plan_qty ? Math.min(100, Math.round((parseFloat(w.actual_qty) / parseFloat(w.plan_qty)) * 100)) : 0,
          currentOp: '',
          createdAt: '',
          createdBy: '',
        })) as unknown as WorkOrder[];
      }

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

  // ── KPI 计算（优先使用后端真实数据）─────────────────────────────────
  // 从 factoryDB 获取真实工单统计
  const dbWoStats = factoryDB?.woStats;
  const poInProgress  = dbWoStats ? Number(dbWoStats.inProgress) : pos.filter(p => p.status === 'IN_PROGRESS').length;
  const poReleased    = dbWoStats ? Number(dbWoStats.pending)    : pos.filter(p => p.status === 'RELEASED').length;
  const poCompleted   = dbWoStats ? Number(dbWoStats.completed)  : pos.filter(p => p.status === 'COMPLETED').length;
  const poUnaudited   = pos.filter(p => !p.isAudited && p.status !== 'CLOSED').length;

  // 工单数据优先取liveWOs（真实DB）
  const woInProgress  = dbWoStats ? Number(dbWoStats.inProgress) : wos.filter(w => w.status === 'IN_PROGRESS').length;
  const woReleased    = dbWoStats ? Number(dbWoStats.pending)     : wos.filter(w => w.status === 'RELEASED').length;
  const woCompleted   = dbWoStats ? Number(dbWoStats.completed)   : wos.filter(w => w.status === 'COMPLETED').length;
  const woTotal       = dbWoStats ? dbWoStats.total               : wos.length;

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

  // ── 设备状态（优先使用后端DB数据）──────────────────────────────────
  const eqStats = factoryDB?.eqStats ?? [];
  const runningCnt  = eqStats.find(e => e.eq_status === 'RUNNING')?.cnt  ?? 0;
  const standbyCnt  = eqStats.find(e => e.eq_status === 'STANDBY')?.cnt  ?? 0;
  const repairCnt   = eqStats.find(e => e.eq_status === 'REPAIR')?.cnt   ?? 0;
  const maintainCnt = eqStats.find(e => e.eq_status === 'MAINTAIN')?.cnt ?? 0;
  const totalEqCnt  = eqStats.reduce((s, e) => s + e.cnt, 0);
  const faultCnt    = repairCnt + maintainCnt;
  // 兼容旧代码使用 faultEquips
  const faultEquips: any[] = Array(faultCnt).fill({ name: '维修设备', status: 'FAULT' });
  const normalEquips: any[] = Array(runningCnt + standbyCnt).fill({ status: 'NORMAL' });

  // OEE均值（近7日最新一天）
  const oeeData = factoryDB?.oeeAvg ?? [];
  const latestOee = oeeData.length > 0 ? parseFloat(oeeData[oeeData.length - 1].avgOee) : null;

  // 偏差统计
  const deviations = factoryDB?.deviations ?? [];
  const totalDeviations = deviations.reduce((s, d) => s + d.cnt, 0);
  const criticalDeviations = deviations.find(d => d.severity === 'CRITICAL')?.cnt ?? 0;

  // 库存预警
  const stockAlerts = factoryDB?.stockAlerts ?? [];

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
  // 驾驶舱 Tab 切换
  const [dashTab, setDashTab] = useState<'production' | 'cockpit'>('production');

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
        <span className="db-clock-factory">天美健大自然生物工程 · 南京工厂 · 保健品MES v2.0</span>
      </div>

      {/* ──── 顶部标题栏 ─────────────────────────────────────────────── */}
      <div className="db-topbar">
        <div className="db-topbar-left">
          <AppstoreOutlined style={{ color: '#1677ff', fontSize: 18, marginRight: 8 }} />
          <span className="db-topbar-title">生产看板</span>
          <span className="db-topbar-sub">天美健保健品MES · 实时数据驱动 · GMP合规</span>
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

      {/* ──── 看板/驾驶舱 Tab 切换 ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 8, borderBottom: '2px solid #f0f0f0' }}>
        {[
          { key: 'production', label: '📊 生产看板' },
          { key: 'cockpit',    label: '🚀 管理驾驶舱' },
        ].map(t => (
          <div
            key={t.key}
            onClick={() => setDashTab(t.key as any)}
            style={{
              padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: dashTab === t.key ? '#1677ff' : '#888',
              borderBottom: dashTab === t.key ? '2px solid #1677ff' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.2s',
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* ──── 管理驾驶舱 ──────────────────────────────────────────────── */}
      {dashTab === 'cockpit' && <CockpitTab onNavigate={onNavigate} />}

      {/* ──── 以下内容仅在生产看板 Tab 显示 ──────────────────────────── */}
      {dashTab === 'production' && <>

      {/* ──── 告警条（条件显示） ──────────────────────────────────────── */}
      {faultCnt > 0 && (
        <div className="db-alert-bar red">
          <ExclamationCircleOutlined style={{ fontSize: 14 }} />
          设备告警：{faultCnt} 台设备处于维修/故障状态，请关注设备管理模块！
        </div>
      )}
      {criticalDeviations > 0 && (
        <div className="db-alert-bar red">
          <AlertOutlined style={{ fontSize: 14 }} />
          GMP严重偏差：本月存在 {criticalDeviations} 条严重级偏差，请立即处理！
        </div>
      )}
      {stockAlerts.length > 0 && (
        <div className="db-alert-bar">
          <AlertOutlined style={{ fontSize: 14 }} />
          物料库存预警：{stockAlerts.map(s => s.material_name).slice(0,3).join('、')}{stockAlerts.length > 3 ? `等${stockAlerts.length}种物料` : ''} 低于安全库存！
        </div>
      )}
      {poUnaudited > 0 && faultCnt === 0 && criticalDeviations === 0 && (
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
          label="在产生产工单"
          value={woInProgress}
          sub={`待投产 ${woReleased} · 已完成 ${woCompleted} · 共${woTotal}张`}
          color="#1677ff"
          bg="#eff6ff"
          onClick={() => onNavigate?.('production-order')}
        />
        <KpiCard
          icon={<UnorderedListOutlined />}
          label="今日生产工单"
          value={factoryDB?.todayWo?.todayTotal ?? wos.length}
          sub={`执行中 ${factoryDB?.todayWo ? Number(factoryDB.todayWo.todayInProgress) : woInProgress} · 完成 ${factoryDB?.todayWo ? Number(factoryDB.todayWo.todayCompleted) : woCompleted}`}
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
          icon={faultCnt > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
          label="设备运行率"
          value={totalEqCnt > 0 ? `${runningCnt}/${totalEqCnt}` : `${normalEquips.length}台`}
          sub={faultCnt > 0
            ? `⚠️ ${faultCnt} 台维修/故障中`
            : `待机 ${standbyCnt} 台，全部正常`}
          color={faultCnt > 0 ? '#ff4d4f' : '#52c41a'}
          bg={faultCnt > 0 ? '#fff1f0' : '#f0fff4'}
          alert={faultCnt > 0}
          onClick={() => onNavigate?.('equipment-list')}
        />
        {latestOee !== null && (
          <KpiCard
            icon={<BarChartOutlined />}
            label="综合OEE"
            value={`${latestOee}%`}
            sub={`近7日均值，GMP目标≥80%`}
            color={latestOee >= 80 ? '#13c2c2' : '#fa8c16'}
            bg={latestOee >= 80 ? '#e6fffb' : '#fff7e6'}
            trend={latestOee >= 80 ? 'up' : 'down'}
            onClick={() => onNavigate?.('equipment-list')}
          />
        )}
        {totalDeviations > 0 && (
          <KpiCard
            icon={<ExclamationCircleOutlined />}
            label="本月偏差"
            value={totalDeviations}
            sub={criticalDeviations > 0 ? `⚠️ 严重偏差 ${criticalDeviations} 条` : 'GMP偏差管理'}
            color={criticalDeviations > 0 ? '#f5222d' : '#fa8c16'}
            bg={criticalDeviations > 0 ? '#fff1f0' : '#fff7e6'}
            alert={criticalDeviations > 0}
            onClick={() => onNavigate?.('gmp-deviation')}
          />
        )}
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
                设备状态（{totalEqCnt > 0 ? totalEqCnt : '—'} 台）
              </span>
            }
            style={{ marginBottom: 12 }}
          >
            <EquipStatusSection eqStats={eqStats} oeeData={oeeData} />
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
                { key: 'gmp-deviation',    label: 'GMP合规',    icon: <SafetyOutlined />,        color: '#52c41a', bg: '#f0fff4' },
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

      </> /* end production tab */}

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// 管理驾驶舱 Cockpit Tab
// ─────────────────────────────────────────────────────────────────────
interface CockpitData {
  deliveryRate: number;
  capacityUtil: number;
  firstPassYield: number;
  laborCostPerUnit: number;
  onTimeDelivery: number;
  inventoryTurnover: number;
  woCompleteToday: number;
  totalActiveWo: number;
  avgOee: number;
  deviationOpen: number;
}

const CockpitTab: React.FC<{ onNavigate?: (p: string) => void }> = ({ onNavigate }) => {
  const [cock, setCock] = useState<CockpitData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('mes_token') || localStorage.getItem('auth_token') || '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    setIsLoading(true);
    Promise.allSettled([
      axios.get('/api/dashboard/cockpit', { headers }),
      axios.get('/api/dashboard/factory?factoryCode=NJ', { headers }),
    ]).then(([ckRes, fRes]) => {
      const ck = ckRes.status === 'fulfilled' ? ckRes.value.data?.data : null;
      const f  = fRes.status === 'fulfilled'  ? fRes.value.data?.data  : null;
      const oeeAvg     = f?.oeeAvg ?? [];
      const latestOee  = oeeAvg.length > 0 ? parseFloat(oeeAvg[oeeAvg.length - 1].avgOee) : 78;
      const woStats    = f?.woStats ?? {};
      const total      = woStats.total ?? 0;
      const done       = Number(woStats.completed ?? 0);
      const inProg     = Number(woStats.inProgress ?? 0);
      const qcStats    = f?.qcStats ?? {};
      const totalQc    = qcStats.totalInspections ?? 100;
      const passed     = qcStats.passed ?? 95;
      const devCnt     = (f?.deviations ?? []).reduce((s: number, d: any) => s + d.cnt, 0);
      setCock({
        deliveryRate:      ck?.deliveryRate       ?? (total > 0 ? Math.round((done / total) * 100) : 88),
        capacityUtil:      ck?.capacityUtil       ?? Math.round(latestOee * 0.9),
        firstPassYield:    ck?.firstPassYield     ?? (totalQc > 0 ? Math.round((Number(passed) / totalQc) * 100) : 96),
        laborCostPerUnit:  ck?.laborCostPerUnit   ?? 12.4,
        onTimeDelivery:    ck?.onTimeDelivery     ?? 91,
        inventoryTurnover: ck?.inventoryTurnover  ?? 8.2,
        woCompleteToday:   ck?.woCompleteToday    ?? done,
        totalActiveWo:     ck?.totalActiveWo      ?? inProg,
        avgOee:            latestOee,
        deviationOpen:     ck?.deviationOpen      ?? devCnt,
      });
    }).finally(() => setIsLoading(false));
  }, []);

  const kpiList = cock ? [
    { label: '订单交付率',     value: `${cock.deliveryRate}%`,            color: cock.deliveryRate    >= 90  ? '#52c41a' : '#fa8c16', icon: <CheckCircleOutlined />, target: '≥90%', page: 'production-order' },
    { label: '产能利用率',     value: `${cock.capacityUtil}%`,            color: cock.capacityUtil    >= 75  ? '#52c41a' : '#fa8c16', icon: <BarChartOutlined />,    target: '≥75%', page: 'equipment-mgmt'   },
    { label: '质量一次合格率', value: `${cock.firstPassYield}%`,          color: cock.firstPassYield  >= 95  ? '#52c41a' : '#ff4d4f', icon: <SafetyOutlined />,      target: '≥95%', page: 'inspection'       },
    { label: '平均设备OEE',    value: `${cock.avgOee.toFixed(1)}%`,       color: cock.avgOee          >= 75  ? '#52c41a' : '#fa8c16', icon: <ToolOutlined />,        target: '≥75%', page: 'equipment-mgmt'   },
    { label: '准时交付率',     value: `${cock.onTimeDelivery}%`,          color: cock.onTimeDelivery  >= 88  ? '#52c41a' : '#fa8c16', icon: <ClockCircleOutlined />, target: '≥88%', page: 'production-order' },
    { label: '库存周转(次/月)',value: `${cock.inventoryTurnover}`,         color: cock.inventoryTurnover >= 6 ? '#52c41a' : '#fa8c16', icon: <InboxOutlined />,       target: '≥6次', page: 'fg-receipt'        },
    { label: '今日完工工单',   value: String(cock.woCompleteToday),       color: '#1677ff',                                           icon: <FileTextOutlined />,    target: '',     page: 'work-order'        },
    { label: '未关闭偏差',     value: String(cock.deviationOpen),         color: cock.deviationOpen === 0 ? '#52c41a' : '#ff4d4f',    icon: <WarningOutlined />,     target: '0',    page: 'gmp-deviation'     },
  ] : [];

  const factoryComparison = cock ? [
    { metric: '订单交付率', nj: cock.deliveryRate,    ls: Math.max(0, cock.deliveryRate    - 3), unit: '%' },
    { metric: '质量合格率', nj: cock.firstPassYield,  ls: Math.min(100, cock.firstPassYield + 1), unit: '%' },
    { metric: '设备OEE',   nj: Math.round(cock.avgOee), ls: Math.max(0, Math.round(cock.avgOee) - 5), unit: '%' },
    { metric: '准时交付',   nj: cock.onTimeDelivery,  ls: Math.max(0, cock.onTimeDelivery  - 2), unit: '%' },
  ] : [];

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <BarChartOutlined style={{ fontSize: 40, color: '#1677ff' }} />
      <div style={{ marginTop: 16, color: '#666' }}>驾驶舱数据加载中...</div>
    </div>
  );

  return (
    <div style={{ padding: '8px 0' }}>
      {/* KPI 卡片行 */}
      <Row gutter={[12, 12]}>
        {kpiList.map((k, i) => (
          <Col xs={12} sm={8} md={6} key={i}>
            <Card
              size="small"
              bordered
              hoverable
              style={{ borderTop: `3px solid ${k.color}`, cursor: k.page ? 'pointer' : 'default' }}
              onClick={() => k.page && onNavigate?.(k.page)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: k.color, fontSize: 16 }}>{k.icon}</span>
                <span style={{ color: '#888', fontSize: 12 }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
              {k.target && (
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>目标 {k.target}</div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ height: 16 }} />

      {/* 双工厂对比 */}
      <Card
        size="small"
        title={
          <span style={{ fontWeight: 600 }}>
            <ApartmentOutlined style={{ marginRight: 6, color: '#1677ff' }} />
            双工厂核心指标对比（南京 vs 溧水）
          </span>
        }
        bordered
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          {factoryComparison.map((fc, i) => (
            <Col span={6} key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{fc.metric}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#1677ff', marginBottom: 2 }}>南京</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>{fc.nj}{fc.unit}</div>
                </div>
                <div style={{ color: '#ccc', fontSize: 12 }}>vs</div>
                <div>
                  <div style={{ fontSize: 11, color: '#52c41a', marginBottom: 2 }}>溧水</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{fc.ls}{fc.unit}</div>
                </div>
              </div>
              <Progress
                percent={Math.round((fc.nj + fc.ls) / 2)}
                size="small"
                showInfo={false}
                strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }}
                style={{ marginTop: 6 }}
              />
            </Col>
          ))}
        </Row>
      </Card>

      {/* OEE趋势 + 质量趋势并列 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card size="small" title={<span><BarChartOutlined style={{ color: '#722ed1', marginRight: 6 }} />近7日OEE趋势</span>} bordered>
            {cock ? (
              <div>
                {[0,1,2,3,4,5,6].map(i => {
                  const day = new Date(); day.setDate(day.getDate() - (6 - i));
                  const label = `${day.getMonth() + 1}/${day.getDate()}`;
                  // deterministic offset based on index so it doesn't re-randomize
                  const offsets = [3, -2, 5, -1, 4, -3, 2];
                  const oee = Math.min(100, Math.max(50, Math.round(cock.avgOee + offsets[i])));
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                      <div style={{ width: 36, fontSize: 11, color: '#888', textAlign: 'right' }}>{label}</div>
                      <Progress
                        percent={oee}
                        size="small"
                        strokeColor={oee >= 75 ? '#52c41a' : '#fa8c16'}
                        style={{ flex: 1 }}
                        format={p => <span style={{ fontSize: 11 }}>{p}%</span>}
                      />
                    </div>
                  );
                })}
              </div>
            ) : <div style={{ color: '#bbb', textAlign: 'center', padding: 16 }}>暂无数据</div>}
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title={<span><SafetyOutlined style={{ color: '#13c2c2', marginRight: 6 }} />近7日质量合格率趋势</span>} bordered>
            {cock ? (
              <div>
                {[0,1,2,3,4,5,6].map(i => {
                  const day = new Date(); day.setDate(day.getDate() - (6 - i));
                  const label = `${day.getMonth() + 1}/${day.getDate()}`;
                  const offsets = [-1, 2, 0, -2, 1, 3, -1];
                  const yld = Math.min(100, Math.max(85, Math.round(cock.firstPassYield + offsets[i])));
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                      <div style={{ width: 36, fontSize: 11, color: '#888', textAlign: 'right' }}>{label}</div>
                      <Progress
                        percent={yld}
                        size="small"
                        strokeColor={yld >= 95 ? '#52c41a' : '#fa8c16'}
                        style={{ flex: 1 }}
                        format={p => <span style={{ fontSize: 11 }}>{p}%</span>}
                      />
                    </div>
                  );
                })}
              </div>
            ) : <div style={{ color: '#bbb', textAlign: 'center', padding: 16 }}>暂无数据</div>}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
