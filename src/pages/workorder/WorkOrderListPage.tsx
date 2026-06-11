/**
 * 生产工单页面（L2）
 * 功能：查看工单列表 / 独立新建工单 / 从生产订单下推分批 / 下发工单 / 查看详情 / 按工序生成任务单
 * - 生产工单可单独新建，也可由生产订单下推并分批产生
 * - 工单决定工艺路径和批号
 * - 任务单决定班组/设备/班次执行哪些工序
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  Button, Input, Select, Drawer, message, Modal, Form,
  Tooltip, Tag, InputNumber, Alert, Divider, DatePicker, Radio, Spin,
} from 'antd';
import { getWorkOrderList, createWorkOrder as apiCreateWorkOrder, updateWorkOrder as apiUpdateWorkOrder, batchDeleteWorkOrders } from '../../api/workOrders';
import { getTaskOrderList, createTaskOrder as apiCreateTaskOrder, batchDeleteTaskOrders } from '../../api/taskOrders';
import { batchCreateFloatTickets } from '../../api/floatTickets';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  SearchOutlined, ReloadOutlined, EyeOutlined, SendOutlined,
  TeamOutlined, PrinterOutlined, UnorderedListOutlined,
  ClockCircleOutlined, PlusOutlined, NodeIndexOutlined,
  DownloadOutlined, CheckCircleOutlined, TagsOutlined,
} from '@ant-design/icons';

import {
  WorkOrder, TaskOrder, FloatTicketV2, ProductionOrder,
  WO_STATUS, TASK_STATUS, FT_STATUS, WOStatus, FTStatus, TaskStatus,
  PRIORITY_MAP, ROUTING_MASTERS, ROUTING_STEPS,
  WORK_CENTERS, SHIFTS, TEAMS, OPERATORS, PAD_STATIONS, EQUIPMENTS,
  FINISHED_GOODS, FinishedGood,
  mockWorkOrders, mockTaskOrders, mockFloatTicketsV2,
  genWONo, genTaskNo,
} from './workOrderData';
import { STORE_KEYS, syncWoProgressFromTasks, syncPoProgressFromWos, loadProductionOrders, loadFloatTickets, saveFloatTickets, clearProductionData, isUserCleared, setUserCleared } from '../../store/mesStore';
import { batchDeleteProductionOrders, getProductionOrderList } from '../../api/productionOrders';


import { batchDeleteFloatTickets, getFloatTicketList } from '../../api/floatTickets';
import { mockRoutingMasters } from '../pro/seriesData';
import type { RoutingMaster as RMFull, RMOpStep } from '../pro/seriesData';
import './WorkOrderPage.css';

const { Option } = Select;

const genId    = (p: string) => `${p}${Date.now()}${Math.floor(Math.random() * 100)}`;
const todayFmt = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const nowStr   = () => new Date().toLocaleString('zh-CN');

/** 根据成品物料获取适用的已启用工艺路径（与 ProductionOrderPage 同逻辑） */
function getApplicableRoutings(fg: FinishedGood | null): RMFull[] {
  let all: RMFull[] = mockRoutingMasters;
  try {
    const stored = localStorage.getItem('bip_routings');
    if (stored) all = JSON.parse(stored) as RMFull[];
  } catch { /* ignore */ }
  const enabled = all.filter(r => r.status === 'ENABLED');
  if (!fg) return enabled;
  const bound = enabled.filter(r => r.bindMaterialCodes && r.bindMaterialCodes.includes(fg.code));
  const sameSeries = enabled.filter(r =>
    r.seriesCode === fg.seriesCode &&
    !(r.bindMaterialCodes && r.bindMaterialCodes.length > 0)
  );
  const result = [...bound, ...sameSeries];
  return result.length > 0 ? result : enabled;
}

/** 按路径编码查找路径记录，返回统一的显示对象，兼容新旧两套编码体系。 */
interface RoutingDisplay {
  name: string;
  version: string;
  code: string;
  applicableSpec: string;
  stepCount: number;
}
function findRoutingByCode(code: string): RoutingDisplay | null {
  if (!code) return null;
  // 先从 seriesData（新路径库）查
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
  // 兜底从旧 workOrderData 路径库查
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

// ── 任务单行（工单详情内） ─────────────────────────────────────────────
const TaskRow: React.FC<{ task: TaskOrder; onClick?: () => void }> = ({ task, onClick }) => {
  const ts    = TASK_STATUS[task.status];
  const shift = SHIFTS.find(s => s.id === task.shiftId);
  return (
    <div className="task-row" onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
      <span className="task-icon">📋</span>
      <div className="task-body">
        <div className="task-row1">
          <span className="task-no">{task.taskNo}</span>
          <span className="task-status" style={{ color: ts.color }}>{ts.label}</span>
          {task.deviationFlag && <span style={{ color: '#f5222d', fontSize: 10 }}>⚠️偏差</span>}
        </div>
        <div className="task-row2">
          {shift && <span className="task-meta" style={{ color: shift.color, fontWeight: 600 }}>⏰ {shift.name}</span>}
          <span className="task-meta">🏭 {task.workCenter}</span>
          <span className="task-meta">👥 {task.team}</span>
          <span className="task-meta">👤 {task.operator}</span>
        </div>
        <div className="task-row3">
          <span className="task-scope">工序: {task.stationScope}</span>
        </div>
        <div className="task-row4">
          <span className="task-meta">
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {task.planStart} ~ {task.planEnd || '—'}
          </span>
          {task.reportQty !== undefined && (
            <span className="task-meta green">报工: {task.reportQty.toLocaleString()} 支</span>
          )}
          {task.padStation && <span className="task-meta">📟 {task.padStation}</span>}
        </div>
      </div>
    </div>
  );
};

// ── 浮票行 ─────────────────────────────────────────────────────────────
const FTRow: React.FC<{ ft: FloatTicketV2; wo?: WorkOrder }> = ({ ft, wo }) => {
  const fs = FT_STATUS[ft.status];
  const handleSinglePrint = () => {
    if (!wo) { message.warning('工单信息缺失，无法打印'); return; }
    printFloatTickets(wo, [ft]);
  };
  return (
    <div className="ft-row">
      <div className="ft-row-left">
        <span className="ft-row-no">{ft.ticketNo}</span>
        <span className="ft-row-status" style={{ color: fs.color }}>{fs.label}</span>
        {ft.currentOp && <span className="ft-row-op">📍 {ft.currentOp}</span>}
      </div>
      <div className="ft-row-right">
        <span className="ft-row-time">{ft.printTime}</span>
        <Button size="small" type="text" icon={<PrinterOutlined />}
          style={{ color: '#1677ff' }}
          onClick={handleSinglePrint} />
      </div>
    </div>
  );
};

// ── 工单卡片 ───────────────────────────────────────────────────────────
const WOCard: React.FC<{
  wo: WorkOrder;
  tasks: TaskOrder[];
  onClick: () => void;
  onRelease: () => void;
  onCreateTask: () => void;
}> = ({ wo, tasks, onClick, onRelease, onCreateTask }) => {
  const sc       = WO_STATUS[wo.status];
  const pri      = PRIORITY_MAP[wo.priority];
  const pct      = wo.planQty > 0 && wo.actualQty ? Math.round((wo.actualQty / wo.planQty) * 100) : (wo.progressPct || 0);
  const taskCount = tasks.filter(t => t.woId === wo.id).length;
  const routing  = findRoutingByCode(wo.routingCode);

  return (
    <div className="wo-card" onClick={onClick}>
      <div className="wo-card-accent" style={{ background: sc.color }} />
      <div className="wo-card-body">
        <div className="wo-row1">
          <span className="wo-no">{wo.woNo}</span>
          {wo.poNo
            ? <span className="wo-ref">← {wo.poNo}</span>
            : <span className="wo-ref" style={{ color: '#52c41a' }}>独立工单</span>}
          <span className="wo-batch-tag">{wo.batchNo}</span>
          <span className="wo-status-badge" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, color: pri.color,
            background: `${pri.color}18`, padding: '1px 6px', borderRadius: 8, border: `1px solid ${pri.color}40`,
          }}>
            {pri.label}
          </span>
        </div>
        <div className="wo-row2">
          <span className="wo-product">{wo.productName} — {wo.productSpec}</span>
        </div>
        <div className="wo-row3">
          <span className="wo-pill">计划 <b>{wo.planQty.toLocaleString()} 支</b></span>
          {wo.actualQty !== undefined && (
            <span className="wo-pill green">实产 <b>{wo.actualQty.toLocaleString()}</b></span>
          )}
          {wo.scrapQty !== undefined && wo.scrapQty > 0 && (
            <span className="wo-pill red">报废 <b>{wo.scrapQty}</b></span>
          )}
          <span className="wo-pill">任务单 <b>{taskCount}</b> 张</span>
          {routing && (
            <span className="wo-pill" style={{ color: '#531dab', borderColor: '#d3adf7' }}>
              <NodeIndexOutlined style={{ marginRight: 3 }} />{routing.name} {routing.version}
            </span>
          )}
        </div>
        {(wo.status === 'IN_PROGRESS' || pct > 0) && (
          <div className="wo-progress-row">
            <div className="wo-progress-track">
              <div className="wo-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="wo-progress-pct">{pct}%</span>
          </div>
        )}
        {wo.currentOp && (
          <div style={{ fontSize: 11, color: '#1677ff', padding: '2px 0' }}>
            📍 当前工序：{wo.currentOp}
          </div>
        )}
        <div className="wo-row4">
          <span className="wo-meta">📅 {wo.planStart || '-'} ~ {wo.planEnd || '-'}</span>
          <span className="wo-meta">👤 {wo.createdBy}</span>
        </div>
      </div>

      <div className="task-card-actions" onClick={e => e.stopPropagation()}>
        <Tooltip title="查看详情" placement="left">
          <button className="pad-action-btn pad-btn-detail" onClick={onClick}>
            <EyeOutlined />
            <span>详情</span>
          </button>
        </Tooltip>
        {wo.status === 'CREATED' && (
          <Tooltip title="下发工单" placement="left">
            <button className="pad-action-btn pad-btn-pause" onClick={onRelease}>
              <SendOutlined />
              <span>下发</span>
            </button>
          </Tooltip>
        )}
        {(wo.status === 'RELEASED' || wo.status === 'IN_PROGRESS') && (
          <Tooltip title="生成任务单（派工）" placement="left">
            <button className="pad-action-btn pad-btn-start" onClick={onCreateTask}>
              <TeamOutlined />
              <span>派工</span>
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

// ── 浮票打印辅助（批量清单模式） ──────────────────────────────────
function printFloatTickets(wo: WorkOrder, fts: FloatTicketV2[]) {
  const rows = fts.map(ft => `
    <tr>
      <td>${ft.ticketNo}</td>
      <td>${ft.qty.toLocaleString()}</td>
      <td>${ft.printTime}</td>
      <td>${FT_STATUS[ft.status]?.label || ft.status}</td>
      <td>${ft.currentOp || '-'}</td>
      <td>${ft.operatorName || '-'}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>生产浮票 — ${wo.batchNo}</title>
    <style>
      body{font-family:'Microsoft YaHei',sans-serif;padding:20px;font-size:13px;}
      h2{color:#1677ff;margin-bottom:4px;}
      .meta{color:#555;margin-bottom:16px;font-size:12px;}
      table{width:100%;border-collapse:collapse;}
      th{background:#1677ff;color:#fff;padding:8px 10px;text-align:left;font-size:12px;}
      td{padding:7px 10px;border-bottom:1px solid #e8ecf0;font-size:12px;}
      tr:nth-child(even) td{background:#f5f7fa;}
      .footer{margin-top:20px;font-size:11px;color:#aaa;text-align:right;}
      @media print{body{padding:0;}}
    </style>
  </head><body>
    <h2>🏷️ 生产浮票 — ${wo.batchNo}</h2>
    <div class="meta">
      工单号：${wo.woNo} &nbsp;|&nbsp; 产品：${wo.productName} ${wo.productSpec}
      &nbsp;|&nbsp; 计划数量：${wo.planQty.toLocaleString()} 支
      &nbsp;|&nbsp; 打印时间：${new Date().toLocaleString('zh-CN')}
    </div>
    <table>
      <thead><tr><th>浮票编号</th><th>数量(支)</th><th>打印时间</th><th>状态</th><th>当前工序</th><th>操作员</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">共 ${fts.length} 张浮票 — MES生产管理系统</div>
    <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`;
  const w = window.open('', '_blank', 'width=850,height=700');
  if (!w) { message.warning('请允许弹窗以进行打印'); return; }
  w.document.write(html);
  w.document.close();
}

// ── 浮票标签打印辅助（单张 / 实物标签样式） ─────────────────────
function printFloatTicketLabels(wo: WorkOrder, fts: FloatTicketV2[]) {
  const dateStr = new Date().toLocaleString('zh-CN');
  const cards = fts.map(ft => `
    <div class="label">
      <div class="label-header">
        <span class="label-type">🏷️ 生产随批浮票</span>
        <span class="label-status">${FT_STATUS[ft.status]?.label || ft.status}</span>
      </div>
      <div class="label-no">${ft.ticketNo}</div>
      <div class="label-grid">
        <div class="label-row"><span class="lk">工单号</span><span class="lv">${ft.woNo}</span></div>
        <div class="label-row"><span class="lk">批号</span><span class="lv bold blue">${ft.batchNo}</span></div>
        <div class="label-row"><span class="lk">产品</span><span class="lv">${wo.productName}</span></div>
        <div class="label-row"><span class="lk">规格</span><span class="lv">${wo.productSpec}</span></div>
        <div class="label-row"><span class="lk">本票数量</span><span class="lv bold">${ft.qty.toLocaleString()} 支</span></div>
        <div class="label-row"><span class="lk">打印时间</span><span class="lv">${ft.printTime}</span></div>
      </div>
      <div class="label-qr-area">
        <div class="label-qr-box">[QR]</div>
        <div class="label-qr-hint" style="font-size:9px;color:#888;margin-top:3px;">${ft.qrContent.slice(0,40)}…</div>
      </div>
      <div class="label-footer">MES生产管理系统 · 打印：${dateStr}</div>
    </div>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>浮票标签 — ${wo.batchNo}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Microsoft YaHei',sans-serif;background:#f0f0f0;padding:10px;}
      .labels{display:flex;flex-wrap:wrap;gap:10px;}
      .label{
        width:200px;background:#fff;border:1px solid #ccc;border-radius:6px;
        padding:10px;page-break-inside:avoid;
      }
      .label-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
      .label-type{font-size:10px;color:#666;}
      .label-status{font-size:10px;color:#1677ff;font-weight:600;
        background:#e6f4ff;border:1px solid #91caff;border-radius:3px;padding:1px 5px;}
      .label-no{font-size:13px;font-weight:700;color:#1d2939;letter-spacing:0.5px;
        border-bottom:1px dashed #e0e0e0;padding-bottom:5px;margin-bottom:6px;}
      .label-grid{font-size:11px;}
      .label-row{display:flex;margin-bottom:3px;}
      .lk{color:#888;width:60px;flex-shrink:0;}
      .lv{color:#344054;flex:1;word-break:break-all;}
      .bold{font-weight:700;}
      .blue{color:#1677ff;}
      .label-qr-area{margin-top:6px;display:flex;flex-direction:column;align-items:center;}
      .label-qr-box{width:60px;height:60px;background:#f5f5f5;border:1px solid #ddd;
        display:flex;align-items:center;justify-content:center;font-size:9px;color:#aaa;}
      .label-footer{margin-top:6px;font-size:9px;color:#aaa;text-align:center;
        border-top:1px solid #f0f0f0;padding-top:4px;}
      @media print{
        body{background:#fff;padding:0;}
        .label{border:1px solid #999;margin:5px;}
      }
    </style>
  </head><body>
    <div class="labels">${cards}</div>
    <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`;
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { message.warning('请允许弹窗以进行打印'); return; }
  w.document.write(html);
  w.document.close();
}

// ── 生成浮票弹窗 ──────────────────────────────────────────────────
const GenerateFloatTicketModal: React.FC<{
  open: boolean;
  wo: WorkOrder | null;
  existingFTs: FloatTicketV2[];
  onClose: () => void;
  onGenerated: (fts: FloatTicketV2[]) => void;
}> = ({ open, wo, existingFTs, onClose, onGenerated }) => {
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [splitMode, setSplitMode]     = useState<'equal' | 'manual'>('equal');
  const [qtyEach, setQtyEach]         = useState<number>(0);
  const [printAfter, setPrintAfter]   = useState(true);

  React.useEffect(() => {
    if (open && wo) {
      // 默认每张 = planQty（1张）
      setTicketCount(1);
      setQtyEach(wo.planQty);
      setSplitMode('equal');
      setPrintAfter(true);
    }
  }, [open, wo]);

  // 均分数量
  React.useEffect(() => {
    if (splitMode === 'equal' && wo && ticketCount > 0) {
      setQtyEach(Math.ceil(wo.planQty / ticketCount));
    }
  }, [splitMode, ticketCount, wo]);

  if (!wo) return null;

  const totalQty  = ticketCount * qtyEach;
  const overQty   = totalQty > wo.planQty * 1.1; // 超出 10% 警告
  const dateStr   = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nowStr2   = new Date().toLocaleString('zh-CN');
  const existSeq  = existingFTs.filter(f => f.woId === wo.id).length;

  const handleOk = () => {
    if (ticketCount < 1 || ticketCount > 200) { message.error('浮票张数须在 1~200 之间'); return; }
    if (qtyEach < 1) { message.error('每张数量须 ≥ 1'); return; }

    const newFTs: FloatTicketV2[] = Array.from({ length: ticketCount }, (_, i) => {
      const seq = existSeq + i + 1;
      const ticketNo = `FT-${dateStr}-${wo.woNo.replace(/WO-/, '').replace(/-/g, '')}-${String(seq).padStart(2, '0')}`;
      const qrObj = { v: 1, t: 'FT', bn: wo.batchNo, wo: wo.woNo, seq, qty: qtyEach };
      return {
        id:         genId('FT'),
        ticketNo,
        woId:       wo.id,
        woNo:       wo.woNo,
        batchNo:    wo.batchNo,
        qty:        qtyEach,
        printTime:  nowStr2,
        status:     'PRINTED' as FTStatus,
        qrContent:  JSON.stringify(qrObj),
      };
    });

    onGenerated(newFTs);
    message.success(`已生成 ${ticketCount} 张浮票，每张 ${qtyEach.toLocaleString()} 支`);

    if (printAfter) {
      setTimeout(() => printFloatTicketLabels(wo, newFTs), 300);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      title={<span><TagsOutlined style={{ marginRight: 6, color: '#fa8c16' }} />生成生产浮票 — {wo?.woNo}</span>}
      onCancel={onClose}
      onOk={handleOk}
      okText="生成浮票"
      okButtonProps={{ style: { background: '#fa8c16', borderColor: '#fa8c16' } }}
      cancelText="取消"
      width={480}
    >
      {/* 工单基本信息 */}
      <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f', fontSize: 13 }}>
        <div><b>工单：</b>{wo.woNo}&nbsp;&nbsp;<b>批号：</b><span style={{ color: '#1677ff', fontWeight: 600 }}>{wo.batchNo}</span></div>
        <div style={{ marginTop: 4 }}><b>产品：</b>{wo.productName} {wo.productSpec}</div>
        <div style={{ marginTop: 4 }}><b>计划数量：</b><span style={{ color: '#fa8c16', fontWeight: 700 }}>{wo.planQty.toLocaleString()} 支</span>
          {existSeq > 0 && <span style={{ marginLeft: 12, color: '#8c8c8c', fontSize: 12 }}>已有 {existSeq} 张浮票</span>}
        </div>
      </div>

      {/* 拆分方式 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#344054', fontWeight: 600, marginBottom: 6 }}>拆分方式</div>
        <Radio.Group value={splitMode} onChange={e => setSplitMode(e.target.value)} size="small">
          <Radio.Button value="equal">均分（自动计算每张数量）</Radio.Button>
          <Radio.Button value="manual">手动（指定每张数量）</Radio.Button>
        </Radio.Group>
      </div>

      {/* 参数设置 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>浮票张数</div>
          <InputNumber
            min={1} max={200} value={ticketCount}
            onChange={v => setTicketCount(v as number)}
            style={{ width: '100%' }}
            addonAfter="张"
          />
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>每张数量</div>
          <InputNumber
            min={1} value={qtyEach}
            onChange={v => setQtyEach(v as number)}
            style={{ width: '100%' }}
            disabled={splitMode === 'equal'}
            addonAfter="支"
          />
        </div>
      </div>

      {/* 汇总 */}
      <div style={{ padding: '8px 12px', background: overQty ? '#fff2f0' : '#f6ffed', border: `1px solid ${overQty ? '#ffccc7' : '#b7eb8f'}`, borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
        本次生成 <b style={{ color: '#fa8c16', fontSize: 15 }}>{ticketCount}</b> 张，
        每张 <b>{qtyEach.toLocaleString()}</b> 支，
        合计 <b style={{ color: overQty ? '#ff4d4f' : '#389e0d' }}>{(ticketCount * qtyEach).toLocaleString()}</b> 支
        {overQty && <span style={{ color: '#ff4d4f', marginLeft: 8, fontSize: 12 }}>⚠ 超出计划数量 10%，请确认</span>}
      </div>

      {/* 打印选项 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <input
          type="checkbox" id="printAfterGen"
          checked={printAfter}
          onChange={e => setPrintAfter(e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
        <label htmlFor="printAfterGen" style={{ cursor: 'pointer', color: '#344054' }}>
          生成后立即打印浮票标签（标签格式，每页 4 张）
        </label>
      </div>
    </Modal>
  );
};

// ── 工单详情抽屉 ───────────────────────────────────────────────────────
const WODetailDrawer: React.FC<{
  wo: WorkOrder | null;
  tasks: TaskOrder[];
  floatTickets: FloatTicketV2[];
  pos: ProductionOrder[];
  open: boolean;
  onClose: () => void;
  onRelease: (wo: WorkOrder) => void;
  onNavigateToRouting?: (routingCode: string) => void;
  onGenerateFT?: (wo: WorkOrder) => void;  // 打开生成浮票弹窗
}> = ({ wo, tasks, floatTickets, pos, open, onClose, onRelease, onNavigateToRouting, onGenerateFT }) => {
  const [poSubOpen, setPoSubOpen]       = useState(false);
  const [taskSubOpen, setTaskSubOpen]   = useState(false);
  const [subTask, setSubTask]           = useState<TaskOrder | null>(null);
  if (!wo) return null;
  const sc      = WO_STATUS[wo.status];
  const relTasks = tasks.filter(t => t.woId === wo.id);
  const relFTs   = floatTickets.filter(f => f.woId === wo.id);
  const pct      = wo.planQty > 0 && wo.actualQty ? Math.round((wo.actualQty / wo.planQty) * 100) : (wo.progressPct || 0);
  const routing  = findRoutingByCode(wo.routingCode);
  const sourcePO = wo.poId ? pos.find(p => p.id === wo.poId) : null;

  return (
    <Drawer
      open={open} onClose={onClose} width={480}
      title={<span><UnorderedListOutlined style={{ marginRight: 6, color: '#1677ff' }} />生产工单详情</span>}
      styles={{ header: { background: '#fff', borderBottom: '1px solid #e8ecf0' }, body: { background: '#f5f7fa', padding: 16 } }}
    >
      {/* 基本信息 */}
      <div className="wd-section">
        <div className="wd-title">
          📋 工单信息
          <span style={{ color: sc.color, marginLeft: 8, fontSize: 12 }}>{sc.label}</span>
          {!wo.poNo && <Tag color="green" style={{ marginLeft: 8, fontSize: 10 }}>独立工单</Tag>}
        </div>
        {([
          ['工单号',   wo.woNo],
          ['批号',     wo.batchNo],
          ['来源订单', ''],  // placeholder — rendered separately below
          ['产品名称', wo.productName],
          ['产品规格', wo.productSpec],
          ['产品编码', wo.productCode],
          ['计划数量', `${wo.planQty.toLocaleString()} 支`],
          ['实际数量', wo.actualQty ? `${wo.actualQty.toLocaleString()} 支` : '-'],
          ['报废数量', wo.scrapQty ? `${wo.scrapQty} 支` : '0'],
          ['计划开始', wo.planStart || '-'],
          ['计划结束', wo.planEnd   || '-'],
          ['实际开始', wo.actualStart || '-'],
          ['实际结束', wo.actualEnd   || '-'],
          ['创建人',   wo.createdBy],
          ['创建时间', wo.createdAt],
        ] as [string, string][]).map(([l, v]) => l === '来源订单' ? null : (
          <div key={l} className="wd-row">
            <span className="wd-label">{l}</span>
            <span className="wd-val" style={l === '批号' ? { color: '#1677ff', fontWeight: 600 } : {}}>{v}</span>
          </div>
        ))}
        {/* 来源订单 — 可点击反查 */}
        <div className="wd-row">
          <span className="wd-label">来源订单</span>
          <span className="wd-val">
            {sourcePO ? (
              <span
                style={{ color: '#1677ff', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                onClick={() => setPoSubOpen(true)}
              >
                🔗 {wo.poNo}
              </span>
            ) : (
              <span style={{ color: '#8c8c8c' }}>{wo.poNo || '（独立新建）'}</span>
            )}
          </span>
        </div>
        {wo.remark && (
          <div className="wd-row">
            <span className="wd-label">备注</span>
            <span className="wd-val" style={{ color: '#faad14' }}>{wo.remark}</span>
          </div>
        )}
      </div>

      {/* 工艺路径 */}
      {routing && (
        <div className="wd-section">
          <div className="wd-title"><NodeIndexOutlined style={{ marginRight: 4 }} />工艺路径（工单决定）</div>
          <div className="wd-row">
            <span className="wd-label">路径名称</span>
            {onNavigateToRouting ? (
              <span
                className="wd-val"
                style={{ color: '#531dab', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => { onClose(); onNavigateToRouting(routing.code); }}
                title="点击跳转到工艺路径基础资料"
              >
                <NodeIndexOutlined style={{ marginRight: 3 }} />{routing.name} {routing.version}
              </span>
            ) : (
              <span className="wd-val" style={{ color: '#531dab', fontWeight: 600 }}>{routing.name} {routing.version}</span>
            )}
          </div>
          <div className="wd-row">
            <span className="wd-label">路径编码</span>
            {onNavigateToRouting ? (
              <span
                className="wd-val"
                style={{ color: '#531dab', fontFamily: 'monospace', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => { onClose(); onNavigateToRouting(routing.code); }}
                title="点击跳转到工艺路径基础资料"
              >
                🔗 {routing.code}
              </span>
            ) : (
              <span className="wd-val" style={{ fontFamily: 'monospace' }}>{routing.code}</span>
            )}
          </div>
          <div className="wd-row"><span className="wd-label">适用规格</span><span className="wd-val">{routing.applicableSpec || wo.routingCode}</span></div>
          <div className="wd-row"><span className="wd-label">总工序数</span><span className="wd-val">{routing.stepCount} 道</span></div>
        </div>
      )}

      {/* 进度 */}
      {(wo.status === 'IN_PROGRESS' || pct > 0) && (
        <div className="wd-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#98a2b3', marginBottom: 6 }}>
            <span>生产进度</span>
            <span style={{ color: '#389e0d', fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: '#f0f2f5', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#52c41a', borderRadius: 4 }} />
          </div>
          {wo.currentOp && (
            <div style={{ fontSize: 11, color: '#1677ff', marginTop: 6 }}>📍 当前工序：{wo.currentOp}</div>
          )}
        </div>
      )}

      {/* 任务单 */}
      <div className="wd-section">
        <div className="wd-title">📌 关联任务单（L3 派工单）— {relTasks.length} 张</div>
        {relTasks.length === 0
          ? <div style={{ color: '#98a2b3', fontSize: 12, padding: '6px 0' }}>暂无任务单，可在工单卡片点击"生成任务单"按班次/班组派工</div>
          : relTasks.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              onClick={() => { setSubTask(t); setTaskSubOpen(true); }}
            />
          ))
        }
      </div>

      {/* 浮票 */}
      <div className="wd-section">
        <div className="wd-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>🏷️ 生产浮票（L4）— {relFTs.length} 张</span>
          {/* 已下发/生产中/已完成 才能生成浮票 */}
          {(wo.status === 'RELEASED' || wo.status === 'IN_PROGRESS' || wo.status === 'COMPLETED') && onGenerateFT && (
            <Button
              size="small"
              icon={<TagsOutlined />}
              style={{ background: '#fa8c16', color: '#fff', borderColor: '#fa8c16', fontSize: 11 }}
              onClick={() => onGenerateFT(wo)}
            >
              生成浮票
            </Button>
          )}
        </div>
        {wo.status === 'CREATED' && (
          <div style={{ color: '#faad14', fontSize: 12, padding: '4px 0 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
            ⚠ 工单尚未下发，请先下发工单后再生成浮票
          </div>
        )}
        {relFTs.length === 0
          ? <div style={{ color: '#98a2b3', fontSize: 12, padding: '6px 0' }}>暂无浮票{wo.status !== 'CREATED' ? '，可点击右上角「生成浮票」按钮创建' : ''}</div>
          : relFTs.map(f => <FTRow key={f.id} ft={f} wo={wo} />)
        }
        {wo.status !== 'CREATED' && relFTs.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <Button
              size="small" icon={<PrinterOutlined />}
              style={{ background: '#1677ff', color: '#fff', borderColor: '#1677ff' }}
              onClick={() => printFloatTickets(wo, relFTs)}
            >
              批量打印清单（{relFTs.length} 张）
            </Button>
            <Button
              size="small" icon={<PrinterOutlined />}
              onClick={() => printFloatTicketLabels(wo, relFTs)}
            >
              打印标签格式
            </Button>
          </div>
        )}
      </div>

      {wo.status === 'CREATED' && (
        <Button block type="primary" icon={<SendOutlined />} style={{ marginTop: 8 }}
          onClick={() => { onRelease(wo); onClose(); }}>
          下发工单到车间
        </Button>
      )}

      {/* 嵌套抽屉 — 反查生产订单 */}
      {sourcePO && (
        <Drawer
          open={poSubOpen} onClose={() => setPoSubOpen(false)} width={420}
          title={<span>📋 来源生产订单 — {sourcePO.orderNo}</span>}
          styles={{ header: { background: '#fff' }, body: { background: '#f5f7fa', padding: 16 } }}
        >
          {([
            ['订单号',   sourcePO.orderNo],
            ['关联销售订单', sourcePO.soNo || '-'],
            ['产品',     sourcePO.productName || (sourcePO.lineItems ? `${sourcePO.lineItems.length} 种规格` : '-')],
            ['规格',     sourcePO.productSpec || (sourcePO.lineItems ? sourcePO.lineItems.map(l => l.productSpec).join('、') : '-')],
            ['总计划量', `${sourcePO.totalQty.toLocaleString()} 支`],
            ['交货日期', sourcePO.deliveryDate],
            ['优先级',   PRIORITY_MAP[sourcePO.priority]?.label || '-'],
            ['状态',     (WO_STATUS as Record<string, {label:string;color:string}>)[sourcePO.status]?.label || sourcePO.status],
            ['创建人',   sourcePO.createdBy],
            ['创建时间', sourcePO.createdAt],
            ['备注',     sourcePO.remark || '-'],
          ] as [string, string][]).map(([l, v]) => (
            <div key={l} className="wd-row">
              <span className="wd-label">{l}</span>
              <span className="wd-val">{v}</span>
            </div>
          ))}
        </Drawer>
      )}

      {/* 嵌套抽屉 — 下查任务单详情 */}
      {subTask && (
        <Drawer
          open={taskSubOpen} onClose={() => setTaskSubOpen(false)} width={420}
          title={<span>📋 任务单详情 — {subTask.taskNo}</span>}
          styles={{ header: { background: '#fff' }, body: { background: '#f5f7fa', padding: 16 } }}
        >
          {(() => {
            const ts    = TASK_STATUS[subTask.status];
            const shift = SHIFTS.find(s => s.id === subTask.shiftId);
            const team  = TEAMS.find(t => t.id === subTask.teamId);
            return (
              <>
                <div className="wd-section">
                  <div className="wd-title">📋 任务单信息 <span style={{ color: ts.color, marginLeft: 8, fontSize: 11 }}>{ts.label}</span></div>
                  {([
                    ['任务单号', subTask.taskNo],
                    ['生产批号', subTask.batchNo],
                    ['工作中心', subTask.workCenter],
                    ['工序范围', subTask.stationScope],
                    ['计划数量', `${subTask.planQty.toLocaleString()} 支`],
                    ['报工数量', subTask.reportQty !== undefined ? `${subTask.reportQty.toLocaleString()} 支` : '-'],
                    ['废品数量', subTask.scrapQty  ? `${subTask.scrapQty} 支` : '-'],
                    ['计划开始', subTask.planStart],
                    ['计划结束', subTask.planEnd || '-'],
                    ['实际开始', subTask.actualStart || '-'],
                    ['实际结束', subTask.actualEnd   || '-'],
                  ] as [string, string][]).map(([l, v]) => (
                    <div key={l} className="wd-row">
                      <span className="wd-label">{l}</span>
                      <span className="wd-val" style={l === '生产批号' ? { color: '#1677ff', fontWeight: 600 } : {}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="wd-section">
                  <div className="wd-title">⏰ 班次 & 班组</div>
                  {shift && (
                    <div className="wd-row">
                      <span className="wd-label">班次</span>
                      <span className="wd-val" style={{ color: shift.color, fontWeight: 600 }}>⏰ {shift.name}（{shift.startTime}~{shift.endTime}）</span>
                    </div>
                  )}
                  <div className="wd-row"><span className="wd-label">执行班组</span><span className="wd-val"><b>{subTask.team}</b>{team ? ` · 组长: ${team.leader}` : ''}</span></div>
                  <div className="wd-row"><span className="wd-label">主操作工</span><span className="wd-val">{subTask.operator}</span></div>
                  {subTask.padStation && (
                    <div className="wd-row"><span className="wd-label">PAD工位</span><span className="wd-val" style={{ color: '#1677ff' }}>📟 {subTask.padStation}</span></div>
                  )}
                </div>
              </>
            );
          })()}
        </Drawer>
      )}
    </Drawer>
  );
};

// ── 独立新建工单弹窗（从成品物料目录选择产品）─────────────────────────
const CreateWOModal: React.FC<{
  open: boolean;
  existingWOCount: number;
  onClose: () => void;
  onCreated: (wo: WorkOrder) => void;
}> = ({ open, existingWOCount, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [previewBatch, setPreviewBatch] = useState('');
  const [selectedFG, setSelectedFG]     = useState<typeof FINISHED_GOODS[0] | null>(null);

  React.useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ priority: 'NORMAL' });
      const dateStr = todayFmt();
      const seq = existingWOCount + 1;
      setPreviewBatch(`YS-RKQ-${dateStr}-${String(seq).padStart(3, '0')}`);
      setSelectedFG(null);
    }
  }, [open, existingWOCount, form]);

  // 选择成品物料时自动填充工艺路径和BOM
  const handleSelectFG = (code: string) => {
    const fg = FINISHED_GOODS.find(g => g.code === code);
    if (!fg) return;
    setSelectedFG(fg);
    form.setFieldsValue({
      productCode:  fg.code,
      productName:  fg.name,
      productSpec:  fg.spec,
      routingCode:  fg.defaultRouting,
      bomVersion:   fg.defaultBom,
    });
  };

  const handleOk = () => {
    form.validateFields().then(vals => {
      const dateStr = todayFmt();
      const seq     = existingWOCount + 1;
      const batchNo = `YS-RKQ-${dateStr}-${String(seq).padStart(3, '0')}`;
      const woNo    = genWONo(dateStr, seq);
      const routing = findRoutingByCode(vals.routingCode);
      const wo: WorkOrder = {
        id:           genId('WO'),
        woNo,
        batchNo,
        productCode:  vals.productCode,
        productName:  vals.productName,
        productSpec:  vals.productSpec,
        bomVersion:   vals.bomVersion || '1.0',
        routingCode:  vals.routingCode,
        routingName:  routing ? `${routing.name} ${routing.version}` : vals.routingCode,
        planQty:      vals.planQty,
        priority:     vals.priority || 'NORMAL',
        status:       'CREATED',
        planStart:    vals.planStart ? (vals.planStart as Dayjs).format('YYYY-MM-DD HH:mm') : '',
        planEnd:      vals.planEnd   ? (vals.planEnd as Dayjs).format('YYYY-MM-DD HH:mm') : '',
        createdAt:    nowStr(),
        createdBy:    '当前用户',
        remark:       vals.remark,
        progressPct:  0,
      };
      onCreated(wo);
      message.success(`工单 ${woNo} 创建成功｜批号: ${batchNo}｜工艺: ${routing?.name || ''}`);
      onClose();
    }).catch(() => {});
  };

  return (
    <Modal
      open={open}
      title="➕ 独立新建生产工单"
      onCancel={() => { onClose(); form.resetFields(); }}
      onOk={handleOk}
      okText="创建工单"
      cancelText="取消"
      width={600}
    >
      <Alert
        type="info" showIcon
        message="独立工单不关联生产订单，适用于临时插单、样品生产等场景。从成品物料目录选择产品后自动填入工艺路径和BOM版本。"
        style={{ marginBottom: 14, borderRadius: 6, fontSize: 12 }}
      />
      {previewBatch && (
        <div style={{ marginBottom: 14, padding: '8px 12px', background: '#f0f7ff', borderRadius: 6, border: '1px solid #bae0ff', fontSize: 12 }}>
          预生成批号：<b style={{ color: '#1677ff', fontSize: 13 }}>{previewBatch}</b>
          &nbsp;&nbsp;工单号：<b style={{ color: '#531dab' }}>{genWONo(todayFmt(), existingWOCount + 1)}</b>
        </div>
      )}
      <Form form={form} layout="vertical">
        {/* 产品选择（从成品物料目录） */}
        <Form.Item
          label={
            <span style={{ fontWeight: 700 }}>
              选择成品物料
              <span style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 400, marginLeft: 6 }}>（从物料目录选择，自动填入工艺路径）</span>
            </span>
          }
          required
        >
          <Select
            showSearch
            placeholder="请选择成品物料规格…"
            style={{ width: '100%' }}
            filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            }
            onChange={code => handleSelectFG(code as string)}
            optionLabelProp="label"
          >
            {FINISHED_GOODS.map(fg => (
              <Option key={fg.code} value={fg.code} label={`${fg.spec}  ${fg.code}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 12, color: '#1a1a1a' }}>{fg.spec}</span>
                    <span style={{ fontSize: 10, color: '#8c8c8c', marginLeft: 8 }}>{fg.handleColor}柄</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#98a2b3' }}>{fg.code}</span>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 选中后展示物料详情 */}
        {selectedFG && (
          <div style={{
            marginBottom: 14, padding: '10px 14px', background: '#f0f7ff',
            borderRadius: 8, border: '1px solid #bae0ff', fontSize: 12,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 8px' }}>
              <div><span style={{ color: '#98a2b3' }}>编码：</span><b>{selectedFG.code}</b></div>
              <div><span style={{ color: '#98a2b3' }}>规格：</span><b style={{ color: '#1677ff' }}>{selectedFG.spec}</b></div>
              <div><span style={{ color: '#98a2b3' }}>柄色：</span>{selectedFG.handleColor}</div>
              <div><span style={{ color: '#98a2b3' }}>默认工艺：</span><span style={{ color: '#531dab' }}>{selectedFG.defaultRouting}</span></div>
              <div><span style={{ color: '#98a2b3' }}>BOM版本：</span>{selectedFG.defaultBom}</div>
              <div><span style={{ color: '#98a2b3' }}>参考单价：</span>¥{selectedFG.price}</div>
            </div>
          </div>
        )}

        {/* 隐藏字段（由选择成品物料自动填充，也可手动覆盖） */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="productCode" label="产品编码" rules={[{ required: true, message: '请选择成品物料或填写产品编码' }]}>
            <Input placeholder="选择物料后自动填写" />
          </Form.Item>
          <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
            <Input placeholder="机用根管锉" />
          </Form.Item>
        </div>
        <Form.Item name="productSpec" label="产品规格" rules={[{ required: true }]}>
          <Input placeholder="选择物料后自动填写，如 #25 / 04锥度 / 25mm" />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item
            name="routingCode"
            label="工艺路径（工单决定）"
            rules={[{ required: true, message: '请选择工艺路径' }]}
            extra="选择物料后自动填入，也可手动修改"
          >
            <Select
              placeholder="选择适用工艺路径"
              optionLabelProp="label"
              popupMatchSelectWidth={420}
              notFoundContent={<span style={{ color: '#aaa', fontSize: 12 }}>暂无已启用工艺路径</span>}
            >
              {(() => {
                const routings = getApplicableRoutings(selectedFG ?? null);
                const boundCodes = routings
                  .filter(r => r.bindMaterialCodes && r.bindMaterialCodes.length > 0)
                  .map(r => r.routingCode);
                return routings.map(r => {
                  const isBound = boundCodes.includes(r.routingCode);
                  return (
                    <Option key={r.routingCode} value={r.routingCode} label={
                      <span>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#8c8c8c', marginRight: 4 }}>{r.routingCode}</span>
                        <span style={{ fontWeight: 600, fontSize: 12 }}>{r.routingName.replace('机用根管锉', '')}</span>
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
                          <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>适用：{r.specRangeExpr}</div>
                        )}
                      </div>
                    </Option>
                  );
                });
              })()}
            </Select>
          </Form.Item>
          <Form.Item name="bomVersion" label="BOM版本">
            <Input placeholder="如 2.1" />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="planQty" label="计划数量（支）" rules={[{ required: true }]} extra="GMP规定单批≤5000支">
            <InputNumber min={1} max={5000} style={{ width: '100%' }} placeholder="≤5000" />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select>
              {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                <Option key={k} value={k}><span style={{ color: v.color }}>●</span> {v.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="planStart" label="计划开始">
            <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="选择开始时间" />
          </Form.Item>
          <Form.Item name="planEnd" label="计划结束">
            <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="选择结束时间" />
          </Form.Item>
        </div>
        <Form.Item name="remark" label="备注（选填）" style={{ marginBottom: 0 }}>
          <Input placeholder="临时插单、样品生产等说明" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ── 从生产订单下推弹窗（支持多规格明细行） ────────────────────────────
const PushFromPOModal: React.FC<{
  open: boolean;
  pos: ProductionOrder[];
  existingWOs: WorkOrder[];
  onClose: () => void;
  onPushed: (wos: WorkOrder[]) => void;
}> = ({ open, pos, existingWOs, onClose, onPushed }) => {
  const [form] = Form.useForm();
  const [selectedPOId, setSelectedPOId] = useState('');
  const [batchSize, setBatchSize] = useState(5000);

  const auditedPOs    = pos.filter(p => p.isAudited && (p.status === 'OPEN' || p.status === 'RELEASED' || p.status === 'IN_PROGRESS'));
  const selectedPO    = auditedPOs.find(p => p.id === selectedPOId);
  const existingCount = existingWOs.filter(w => w.poId === selectedPOId).length;
  const dateStr       = todayFmt();

  // 统一处理单规格和多规格：构建明细行列表
  const lineItems = selectedPO
    ? (selectedPO.lineItems && selectedPO.lineItems.length > 0
        ? selectedPO.lineItems
        : [{
            lineNo: 1,
            productCode: selectedPO.productCode,
            productName: selectedPO.productName,
            productSpec: selectedPO.productSpec,
            routingCode: selectedPO.routingCode,
            bomVersion:  selectedPO.bomVersion || '1.0',
            planQty:     selectedPO.totalQty,
            completedQty: 0, scrapQty: 0,
          }])
    : [];

  const isMultiLine   = lineItems.length > 1;
  const totalBatches  = lineItems.reduce((s, l) => s + Math.ceil(l.planQty / Math.max(batchSize, 1)), 0);

  React.useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedPOId('');
      setBatchSize(5000);
    }
  }, [open, form]);

  const handleOk = () => {
    form.validateFields().then(vals => {
      if (!selectedPO) { message.warning('请选择生产订单'); return; }
      const sz      = vals.batchSize;
      const newWOs: WorkOrder[] = [];
      let globalSeq = existingCount;

      // 逐行拆批，为每个规格行生成工单
      lineItems.forEach(item => {
        const cnt     = Math.ceil(item.planQty / sz);
        const routing = findRoutingByCode(item.routingCode || selectedPO.routingCode);
        for (let i = 0; i < cnt; i++) {
          const qty     = i < cnt - 1 ? sz : item.planQty - sz * (cnt - 1);
          globalSeq++;
          const batchNo = `YS-RKQ-${dateStr}-${String(globalSeq).padStart(3, '0')}`;
          newWOs.push({
            id:          genId('WO'),
            woNo:        genWONo(dateStr, existingWOs.length + newWOs.length + 1),
            poId:        selectedPO.id,
            poNo:        selectedPO.orderNo,
            batchNo,
            productCode: item.productCode,
            productName: item.productName,
            productSpec: item.productSpec,
            bomVersion:  item.bomVersion || selectedPO.bomVersion || '1.0',
            planQty:     qty,
            routingCode: item.routingCode || selectedPO.routingCode,
            routingName: routing ? `${routing.name} ${routing.version}` : '—',
            priority:    selectedPO.priority || 'NORMAL',
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
        isMultiLine
          ? `已下推 ${newWOs.length} 张工单（${lineItems.length} 种规格各自拆批），每批最多 ${sz} 支`
          : `已从 ${selectedPO.orderNo} 下推 ${newWOs.length} 张工单，每批 ${sz} 支`
      );
      onClose();
    }).catch(() => {});
  };

  return (
    <Modal
      open={open}
      title="⬇️ 从生产订单下推工单（分批）"
      onCancel={onClose}
      onOk={handleOk}
      okText="确认下推"
      cancelText="取消"
      width={600}
    >
      <Alert
        type="info" showIcon
        message="从已审核的生产订单下推工单，系统按批次数量自动拆批。多规格订单会为每个规格行分别生成工单，每批独立批号（YS-RKQ-YYYYMMDD-NNN）。"
        style={{ marginBottom: 14, borderRadius: 6, fontSize: 12 }}
      />
      <Form form={form} layout="vertical">
        <Form.Item name="poId" label="选择生产订单（已审核）" rules={[{ required: true }]}>
          <Select
            placeholder="选择已审核的生产订单"
            showSearch
            optionFilterProp="children"
            onChange={v => {
              setSelectedPOId(v as string);
              const po = auditedPOs.find(p => p.id === v);
              if (po) {
                form.setFieldsValue({ batchSize: 5000 });
                setBatchSize(5000);
              }
            }}
          >
            {auditedPOs.map(p => {
              const isMulti = p.lineItems && p.lineItems.length > 1;
              return (
                <Option key={p.id} value={p.id}>
                  <b>{p.orderNo}</b>
                  {isMulti
                    ? <span style={{ fontSize: 11, color: '#1677ff', marginLeft: 8 }}>多规格 {p.lineItems!.length}行 · {p.totalQty.toLocaleString()}支</span>
                    : <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 8 }}>{p.productSpec} · {p.totalQty.toLocaleString()}支</span>
                  }
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        {selectedPO && (
          <div style={{ marginBottom: 14, padding: '10px 14px', background: '#f0f7ff', borderRadius: 8, border: '1px solid #bae0ff', fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <b>{selectedPO.orderNo}</b>
              <span style={{ color: '#1677ff', fontWeight: 700 }}>{selectedPO.totalQty.toLocaleString()} 支</span>
              {isMultiLine && <span style={{ fontSize: 11, color: '#fff', background: '#1677ff', padding: '1px 7px', borderRadius: 8 }}>多规格 {lineItems.length} 行</span>}
              {existingCount > 0 && <span style={{ fontSize: 11, color: '#faad14' }}>⚠️ 已有 {existingCount} 张工单</span>}
            </div>
            {isMultiLine
              ? lineItems.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#444', padding: '2px 0', borderTop: i > 0 ? '1px dashed #dce1e8' : undefined, marginTop: i > 0 ? 4 : 0 }}>
                    <span style={{ color: '#8c8c8c', marginRight: 4 }}>行{item.lineNo}：</span>
                    <b>{item.productSpec}</b>
                    <span style={{ color: '#1677ff', marginLeft: 8 }}>{item.planQty.toLocaleString()} 支</span>
                    <span style={{ color: '#8c8c8c', marginLeft: 8 }}>→ 拆 {Math.ceil(item.planQty / batchSize)} 批</span>
                    {(() => {
                      const r = findRoutingByCode(item.routingCode);
                      return r ? <span style={{ color: '#531dab', marginLeft: 8, fontSize: 11 }}>{r.name} {r.version}</span> : null;
                    })()}
                  </div>
                ))
              : lineItems[0] && (() => {
                  const r = findRoutingByCode(lineItems[0].routingCode);
                  return (
                    <>
                      <div><b>产品：</b>{lineItems[0].productName}（{lineItems[0].productSpec}）</div>
                      {r && <div><b>工艺路径：</b><span style={{ color: '#531dab' }}>{r.name} {r.version}</span></div>}
                    </>
                  );
                })()
            }
            <div style={{ color: '#888', fontSize: 11, marginTop: 6 }}>⚠️ 医疗器械GMP规定：单批≤5000支，系统自动按批次拆分</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="batchSize" label="每批数量（支）" rules={[{ required: true }]} extra="GMP规定单批≤5000支">
            <InputNumber
              min={1} max={5000} style={{ width: '100%' }}
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

        {selectedPO && totalBatches > 0 && (
          <div style={{ padding: '10px 14px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, fontSize: 13 }}>
            将自动生成 <b style={{ color: '#389e0d', fontSize: 16 }}>{totalBatches}</b> 张工单
            {isMultiLine && <span style={{ fontSize: 12, color: '#667085', marginLeft: 8 }}>（{lineItems.length} 种规格各自拆批）</span>}
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
              批号范围：YS-RKQ-{dateStr}-{String(existingCount + 1).padStart(3, '0')} ～ YS-RKQ-{dateStr}-{String(existingCount + totalBatches).padStart(3, '0')}
            </div>
          </div>
        )}
      </Form>
    </Modal>
  );
};

// ── 生成任务单弹窗（含班次/员工/设备/PAD绑定） ────────────────────────
const CreateTaskModal: React.FC<{
  open: boolean;
  wo: WorkOrder | null;
  existingTasks: TaskOrder[];
  onClose: () => void;
  onCreated: (t: TaskOrder) => void;
}> = ({ open, wo, existingTasks, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [selectedSteps, setSelectedSteps]     = useState<string[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>('SH01');
  const [selectedTeamId, setSelectedTeamId]   = useState<string>('');

  const assignedStepIds = existingTasks
    .filter(t => t.woId === wo?.id)
    .flatMap(t => t.stepIds || []);

  // 优先从新工艺路径档案（mockRoutingMasters）获取工序列表
  const routingNew = wo ? (() => {
    const stored = localStorage.getItem('bip_routings');
    const all: RMFull[] = stored ? JSON.parse(stored) : mockRoutingMasters;
    return all.find(r => r.routingCode === wo.routingCode) || null;
  })() : null;

  // 从 groups 展开新工艺路径的所有工序步骤（按 seq 排序）
  const newSteps: RMOpStep[] = routingNew
    ? [...routingNew.groups]
        .sort((a, b) => a.seq - b.seq)
        .flatMap(g => g.steps)
    : [];

  // 如果新档案有工序，使用新工序；否则退化到旧 ROUTING_MASTERS/ROUTING_STEPS
  const routingOld     = !routingNew && wo ? ROUTING_MASTERS.find(r => r.code === wo.routingCode) : null;
  const routingStepIds = routingOld ? routingOld.steps : ROUTING_STEPS.map(s => s.id);
  const routing        = wo ? findRoutingByCode(wo.routingCode) : null;
  const useNewSteps    = newSteps.length > 0;
  // available 统一使用归一化的 UnifiedStep 类型
  type UnifiedStep = { id: string; opCode: string; name: string; isKeyOp: boolean; isQcPoint?: boolean };
  const available: UnifiedStep[] = useNewSteps
    ? newSteps
        .filter(s => !assignedStepIds.includes(s.id))
        .map(s => ({ id: s.id, opCode: s.opCode, name: s.opName, isKeyOp: s.isKeyOp, isQcPoint: s.isQcPoint }))
    : ROUTING_STEPS
        .filter(s => routingStepIds.includes(s.id) && !assignedStepIds.includes(s.id))
        .map(s => ({ id: s.id, opCode: s.opNo, name: s.name, isKeyOp: s.isKeyOp }));

  const filteredTeams  = TEAMS.filter(t => t.shiftId === selectedShiftId);
  const selectedTeam   = TEAMS.find(t => t.id === selectedTeamId);
  // 根据班组获取成员列表
  const teamMembers    = selectedTeam
    ? OPERATORS.filter(op => selectedTeam.members.includes(op.id))
    : [];
  const recommendedPads = selectedTeam
    ? PAD_STATIONS.filter(p => p.workCenter.includes(selectedTeam.workCenter.split('/')[0].trim()) && p.status === 'ONLINE')
    : PAD_STATIONS.filter(p => p.status === 'ONLINE');

  React.useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedSteps([]);
      setSelectedTeamId('');
      setSelectedShiftId('SH01');
      form.setFieldsValue({ shiftId: 'SH01' });
    }
  }, [open, form]);

  // 切换班组时，自动清空操作工
  const handleTeamChange = (v: string) => {
    setSelectedTeamId(v);
    form.setFieldsValue({ operatorId: undefined });
  };

  const handleOk = () => {
    form.validateFields().then(vals => {
      if (!wo) return;
      if (selectedSteps.length === 0) { message.warning('请至少选择一道工序'); return; }

      // 根据新旧工序来源拼接工序描述
      const stepDesc = useNewSteps
        ? newSteps.filter(s => selectedSteps.includes(s.id)).map(s => `${s.opCode}(${s.opName})`).join(' → ')
        : ROUTING_STEPS.filter(s => selectedSteps.includes(s.id)).map(s => `${s.opNo}(${s.name})`).join(' → ');
      const shift     = SHIFTS.find(s => s.id === vals.shiftId) || SHIFTS[0];
      const team      = TEAMS.find(t => t.id === vals.teamId);
      const operator  = OPERATORS.find(op => op.id === vals.operatorId);
      const taskSeq   = existingTasks.filter(t => t.woId === wo.id).length + 1;
      const taskNo    = genTaskNo(wo.woNo, shift.name, taskSeq);

      const task: TaskOrder = {
        id:           genId('TK'),
        taskNo,
        woId:         wo.id,
        woNo:         wo.woNo,
        batchNo:      wo.batchNo,
        workCenter:   vals.workCenter,
        shiftId:      vals.shiftId,
        shiftName:    shift.name,
        team:         team ? team.name : '',
        teamId:       vals.teamId,
        operator:     operator ? `${operator.name}（工号:${operator.id}）` : vals.operatorId || '',
        operatorId:   vals.operatorId,
        stationScope: stepDesc,
        stepIds:      selectedSteps,
        planQty:      wo.planQty,
        planStart:    vals.planStart ? (vals.planStart as Dayjs).format('YYYY-MM-DD HH:mm') : `${new Date().toISOString().slice(0, 10)} ${shift.startTime}`,
        planEnd:      vals.planEnd   ? (vals.planEnd as Dayjs).format('YYYY-MM-DD HH:mm') : `${new Date().toISOString().slice(0, 10)} ${shift.endTime}`,
        status:       'ASSIGNED',
        padStation:   vals.padStation,
        equipIds:     vals.equipIds || [],
        remark:       vals.remark,
      };
      onCreated(task);
      message.success(`派工单 ${task.taskNo} 已创建 → ${team?.name}（${shift.name}）`);
      onClose();
    }).catch(() => {});
  };

  return (
    <Modal
      open={open}
      title={<span><TeamOutlined style={{ marginRight: 6, color: '#1677ff' }} />按工序生成任务单（派工） — {wo?.woNo}</span>}
      onCancel={onClose}
      onOk={handleOk}
      okText="生成任务单"
      cancelText="取消"
      width={660}
    >
      {/* 工单信息预览 */}
      <div style={{ marginBottom: 14, padding: '10px 14px', background: '#f0f7ff', borderRadius: 8, border: '1px solid #bae0ff', fontSize: 13 }}>
        <div><b>工单：</b>{wo?.woNo}&nbsp;&nbsp;<b>批号：</b><span style={{ color: '#1677ff' }}>{wo?.batchNo}</span></div>
        <div><b>产品：</b>{wo?.productName} {wo?.productSpec}&nbsp;&nbsp;<b>数量：</b>{wo?.planQty.toLocaleString()} 支</div>
        {routingNew && (
          <div>
            <b>工艺路径：</b>
            <span style={{ color: '#531dab' }}>{routingNew.routingName} {routingNew.version}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#8c8c8c', marginLeft: 6 }}>{routingNew.routingCode}</span>
            <span style={{ fontSize: 11, color: '#667085', marginLeft: 4 }}>（{routingNew.opCount}道工序）</span>
          </div>
        )}
        {!routingNew && routing && <div><b>工艺路径：</b><span style={{ color: '#531dab' }}>{routing.name} {routing.version}（{routing.stepCount}道工序）</span></div>}
      </div>

      {/* 步骤一：选工序 */}
      <div style={{ fontSize: 12, color: '#344054', fontWeight: 600, marginBottom: 8 }}>
        ① 选择本次任务单负责的工序（可多选）
      </div>
      {available.length === 0 ? (
        <div style={{ color: '#389e0d', fontSize: 13, padding: '8px 0', marginBottom: 12 }}>
          <CheckCircleOutlined style={{ marginRight: 6 }} />所有工序已全部分配任务单
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {available.map(step => {
            const isSel = selectedSteps.includes(step.id);
            return (
              <div
                key={step.id}
                onClick={() => setSelectedSteps(prev =>
                  prev.includes(step.id) ? prev.filter(s => s !== step.id) : [...prev, step.id]
                )}
                style={{
                  padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                  border: `1px solid ${isSel ? '#1677ff' : '#d0d5dd'}`,
                  background: isSel ? '#e6f4ff' : '#f9fafb',
                  color: isSel ? '#1677ff' : '#344054',
                  fontWeight: isSel ? 600 : 400, transition: 'all 0.15s',
                }}
              >
                <span style={{ color: '#98a2b3', fontSize: 10, marginRight: 3 }}>{step.opCode}</span>
                {step.name}
                {step.isKeyOp && <span style={{ color: '#f5222d', marginLeft: 3, fontSize: 10 }}>★</span>}
                {step.isQcPoint && <span style={{ color: '#1677ff', marginLeft: 3, fontSize: 10 }}>QC</span>}
              </div>
            );
          })}
        </div>
      )}
      {assignedStepIds.length > 0 && (
        <div style={{ fontSize: 11, color: '#98a2b3', marginBottom: 12 }}>
          ✅ 已分配：{useNewSteps
            ? newSteps.filter(s => assignedStepIds.includes(s.id)).map(s => s.opName).join('、')
            : ROUTING_STEPS.filter(s => assignedStepIds.includes(s.id)).map(s => s.name).join('、')}
        </div>
      )}

      <Divider style={{ margin: '8px 0 14px' }} />

      {/* 步骤二：派工信息 */}
      <div style={{ fontSize: 12, color: '#344054', fontWeight: 600, marginBottom: 10 }}>
        ② 填写派工信息（班次 → 班组 → 操作工 → 设备）
      </div>
      <Form form={form} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="shiftId" label="班次" rules={[{ required: true }]}>
            <Select onChange={v => {
              setSelectedShiftId(v as string);
              setSelectedTeamId('');
              form.setFieldsValue({ teamId: undefined, operatorId: undefined });
            }}>
              {SHIFTS.map(s => (
                <Option key={s.id} value={s.id}>
                  <span style={{ color: s.color, fontWeight: 600 }}>⏰ {s.name}</span>
                  <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 6 }}>{s.startTime}~{s.endTime}</span>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="teamId" label="执行班组" rules={[{ required: true }]}>
            <Select placeholder="选择班组" onChange={handleTeamChange}>
              {filteredTeams.map(t => (
                <Option key={t.id} value={t.id}>
                  <b>{t.name}</b>
                  <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 6 }}>组长:{t.leader}</span>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="operatorId" label="主操作工" rules={[{ required: true }]}>
            <Select placeholder={selectedTeamId ? '选择本班组成员' : '请先选择班组'} showSearch optionFilterProp="children">
              {teamMembers.length > 0
                ? teamMembers.map(op => (
                    <Option key={op.id} value={op.id}>
                      <b style={{ color: op.role === '班组长' ? '#d46b08' : '#1d2939' }}>
                        {op.role === '班组长' ? '★ ' : ''}{op.name}
                      </b>
                      <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 6 }}>{op.id} · {op.role}</span>
                    </Option>
                  ))
                : OPERATORS.map(op => (
                    <Option key={op.id} value={op.id}>
                      {op.name}（{op.id}）
                    </Option>
                  ))
              }
            </Select>
          </Form.Item>
          <Form.Item name="workCenter" label="工作中心/车间" rules={[{ required: true }]}>
            <Select placeholder="选择车间" showSearch>
              {WORK_CENTERS.map(v => <Option key={v} value={v}>{v}</Option>)}
            </Select>
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="planStart" label="计划开始">
            <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="选择开始时间" />
          </Form.Item>
          <Form.Item name="planEnd" label="计划结束">
            <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="选择结束时间" />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="padStation" label="绑定PAD工位（可选）">
            <Select placeholder="选择PAD工位" allowClear>
              {recommendedPads.map(p => (
                <Option key={p.id} value={p.id}>
                  <b>{p.id}</b>
                  <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 6 }}>{p.location}</span>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="equipIds" label="绑定设备（可多选）">
            <Select mode="multiple" placeholder="选择设备" allowClear maxTagCount={2}>
              {EQUIPMENTS.filter(e => e.status === 'NORMAL').map(e => (
                <Option key={e.id} value={e.id}>{e.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </div>
        <Form.Item name="remark" label="派工说明（选填）">
          <Input placeholder="如：白班优先OP-25精磨锥，注意参数D1控制在0.252±0.005" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ── 主页面 ─────────────────────────────────────────────────────────────
interface WorkOrderListPageProps {
  initialOpenWoId?: string;  // 跳转时自动打开指定工单的详情抽屉
  onNavigateToRouting?: (routingCode: string) => void;  // 跳转到工艺路径基础资料
}

const WorkOrderListPage: React.FC<WorkOrderListPageProps> = ({ initialOpenWoId, onNavigateToRouting }) => {
  const [wos, setWos]    = useLocalStorage<WorkOrder[]>(STORE_KEYS.WORK_ORDERS, mockWorkOrders);
  const [tasks, setTasks]       = useLocalStorage<TaskOrder[]>(STORE_KEYS.TASK_ORDERS, mockTaskOrders);
  const [floatTickets, setFloatTickets] = useLocalStorage<FloatTicketV2[]>(STORE_KEYS.FLOAT_TICKETS, loadFloatTickets());
  // 实时从共享存储读取生产订单（与 ProductionOrderPage 共享）
  const [pos]                   = useLocalStorage<ProductionOrder[]>(STORE_KEYS.PRODUCTION_ORDERS, loadProductionOrders());

  const [apiLoading, setApiLoading] = useState(false);
  const loadFromApi = useCallback(async () => {
    // 用户已主动清空，跳过 API 加载
    if (isUserCleared()) return;
    setApiLoading(true);
    try {
      const [woResp, toResp] = await Promise.all([
        getWorkOrderList() as any,
        getTaskOrderList() as any,
      ]);
      const apiWos: any[] = woResp.data ?? [];
      const apiTasks: any[] = toResp.data ?? [];
      const woStatusMap: Record<string, WOStatus> = {
        DRAFT: 'CREATED', RELEASED: 'RELEASED', IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED', CLOSED: 'CLOSED',
      };
      if (apiWos.length > 0) {
        const mappedWos: WorkOrder[] = apiWos.map((item: any) => ({
          id: item.id?.toString() ?? item.workOrderNo,
          woNo: item.workOrderNo ?? '',
          poId: item.orderId?.toString() ?? '',
          poNo: item.orderNo ?? '',
          batchNo: item.workOrderNo ?? '',
          productCode: item.materialCode ?? '',
          productName: item.materialName ?? '',
          productSpec: item.spec ?? '',
          bomVersion: item.bomVersion ?? '',
          routingCode: item.routingId?.toString() ?? '',
          routingName: item.workCenterName ?? '',
          planQty: item.planQuantity ?? 0,
          actualQty: item.completedQuantity ?? 0,
          scrapQty: item.unqualifiedQuantity ?? 0,
          status: (woStatusMap[item.status] ?? 'CREATED') as WOStatus,
          priority: 'NORMAL' as const,
          planStart: item.startDate ?? '',
          planEnd: item.endDate ?? '',
          actualStart: item.actualStartTime ?? '',
          actualEnd: item.actualEndTime ?? '',
          progressPct: item.progress ? Number(item.progress) : 0,
          createdAt: item.createTime ? item.createTime.slice(0, 10) : '',
          createdBy: item.createBy ?? 'admin',
          remark: item.remark ?? '',
        }));
        // 合并：API 数据为主，但保留 localStorage 中存在而 API 未返回的本地工单
        // （防止下推后立即切换页面时工单丢失）
        setWos(prev => {
          const apiIdSet = new Set(mappedWos.map(w => w.id));
          const apiWoNoSet = new Set(mappedWos.map(w => w.woNo).filter(Boolean));
          // 保留本地临时 ID 工单（id 不是纯数字 → 是临时 genId 生成的，或 woNo 不在 API 里）
          const localOnly = prev.filter(w => {
            const numId = Number(w.id);
            const isTempId = isNaN(numId) || numId <= 0;
            return isTempId && !apiWoNoSet.has(w.woNo);
          });
          // 已在 API 中的：用 API 版本替换（以获得真实 ID）
          const alreadyInApi = prev.filter(w => apiIdSet.has(w.id));
          void alreadyInApi; // 用 mappedWos 覆盖即可
          return [...localOnly, ...mappedWos];
        });
      }
      const taskStatusMap: Record<string, TaskStatus> = {
        PENDING: 'PENDING', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'DONE', DONE: 'DONE',
      };
      if (apiTasks.length > 0) {
        const mappedTasks: TaskOrder[] = apiTasks.map((item: any) => ({
          id: item.id?.toString() ?? item.taskNo,
          taskNo: item.taskNo ?? '',
          woId: item.workOrderId?.toString() ?? '',
          woNo: item.workOrderNo ?? '',
          batchNo: item.workOrderNo ?? '',
          workCenter: item.workCenterName ?? '',
          shiftId: '',
          shiftName: '',
          team: '',
          operator: item.assignedToName ?? '',
          stationScope: item.operationName ?? '',
          stepIds: [],
          planQty: item.planQuantity ?? 0,
          reportQty: item.completedQuantity ?? 0,
          scrapQty: item.unqualifiedQuantity ?? 0,
          planStart: item.startTime ?? '',
          planEnd: item.endTime ?? '',
          actualStart: item.startTime ?? '',
          actualEnd: item.endTime ?? '',
          status: (taskStatusMap[item.status] ?? 'PENDING') as TaskStatus,
          remark: item.remark ?? '',
        }));
        setTasks(mappedTasks);
      }
    } catch { /* graceful fallback to mock/localStorage data */ }
    finally { setApiLoading(false); }
  }, [setWos, setTasks]);
  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  const [detailOpen, setDetailOpen]         = useState(false);
  const [selectedWO, setSelectedWO]         = useState<WorkOrder | null>(null);

  // 跳转时自动打开指定工单
  useEffect(() => {
    if (initialOpenWoId) {
      const wo = wos.find(w => w.id === initialOpenWoId);
      if (wo) { setSelectedWO(wo); setDetailOpen(true); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpenWoId]);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskTargetWO, setTaskTargetWO]     = useState<WorkOrder | null>(null);
  const [createWOOpen, setCreateWOOpen]     = useState(false);
  const [pushFromPOOpen, setPushFromPOOpen] = useState(false);
  // 生成浮票
  const [genFTOpen, setGenFTOpen]   = useState(false);
  const [genFTTargetWO, setGenFTTargetWO] = useState<WorkOrder | null>(null);

  const [searchText, setSearchText]     = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filtered = wos.filter(w => {
    const mt = !searchText
      || w.woNo.includes(searchText)
      || w.batchNo.includes(searchText)
      || w.productName.includes(searchText)
      || (w.poNo || '').includes(searchText)
      || w.productSpec.includes(searchText);
    const ms = filterStatus === 'ALL' || w.status === filterStatus;
    return mt && ms;
  });

  const summary = {
    created:    wos.filter(w => w.status === 'CREATED').length,
    released:   wos.filter(w => w.status === 'RELEASED').length,
    inProgress: wos.filter(w => w.status === 'IN_PROGRESS').length,
    completed:  wos.filter(w => w.status === 'COMPLETED').length,
    total:      wos.length,
  };

  const handleRelease = async (wo: WorkOrder) => {
    const numId = Number(wo.id);
    if (!isNaN(numId) && numId > 0) {
      setApiLoading(true);
      try {
        await apiUpdateWorkOrder(numId, { status: 'RELEASED' });
        await loadFromApi();
        message.success(`工单 ${wo.woNo} 已下发到车间`);
      } catch {
        setWos(prev => prev.map(w => w.id === wo.id
          ? { ...w, status: 'RELEASED' as WOStatus, releaseTime: nowStr() }
          : w));
        message.success(`工单 ${wo.woNo} 已下发到车间`);
      } finally {
        setApiLoading(false);
      }
    } else {
      setWos(prev => prev.map(w => w.id === wo.id
        ? { ...w, status: 'RELEASED' as WOStatus, releaseTime: nowStr() }
        : w));
      message.success(`工单 ${wo.woNo} 已下发到车间`);
    }
  };

  const handleCreateTask = async (task: TaskOrder) => {
    const woNumId = Number(task.woId);
    setApiLoading(true);
    try {
      await apiCreateTaskOrder({
        taskNo: task.taskNo,
        workOrderId: !isNaN(woNumId) && woNumId > 0 ? woNumId : undefined,
        workOrderNo: task.woNo,
        workCenterName: task.workCenter,
        assignedToName: task.operator,
        planQuantity: task.planQty,
        status: 'PENDING',
        remark: task.remark,
      });
      if (!isNaN(woNumId) && woNumId > 0) {
        await apiUpdateWorkOrder(woNumId, { status: 'IN_PROGRESS' });
      }
      await loadFromApi();
      // 触发跨层同步：工单→订单
      const wo = wos.find(w => w.id === task.woId);
      if (wo?.poId) setTimeout(() => syncPoProgressFromWos(wo.poId!), 50);
    } catch {
      setTasks(prev => [task, ...prev]);
      setWos(prev => prev.map(w => w.id === task.woId && (w.status === 'RELEASED' || w.status === 'CREATED')
        ? { ...w, status: 'IN_PROGRESS' as WOStatus }
        : w));
    } finally {
      setApiLoading(false);
    }
  };

  const handleWOCreated = async (wo: WorkOrder) => {
    setUserCleared(false); // 用户新建工单，解除清空标志
    setApiLoading(true);
    try {
      await apiCreateWorkOrder({
        workOrderNo: wo.woNo,
        materialCode: wo.productCode,
        materialName: wo.productName,
        spec: wo.productSpec,
        planQuantity: wo.planQty,
        bomVersion: wo.bomVersion,
        startDate: wo.planStart,
        endDate: wo.planEnd,
        status: 'DRAFT',
        remark: wo.remark,
      });
      await loadFromApi();
    } catch {
      setWos(prev => [wo, ...prev]);
    } finally {
      setApiLoading(false);
    }
  };

  const handlePushed = async (newWOs: WorkOrder[]) => {
    setApiLoading(true);
    try {
      // 并发创建所有下推工单，获取后端返回的真实 ID
      const results = await Promise.all(newWOs.map(wo => {
        const poNumId = Number(wo.poId);
        return (apiCreateWorkOrder({
          workOrderNo: wo.woNo,
          orderId: !isNaN(poNumId) && poNumId > 0 ? poNumId : undefined,
          orderNo: wo.poNo,
          materialCode: wo.productCode,
          materialName: wo.productName,
          spec: wo.productSpec,
          planQuantity: wo.planQty,
          bomVersion: wo.bomVersion,
          startDate: wo.planStart,
          endDate: wo.planEnd,
          status: 'DRAFT',
        }) as any);
      }));
      // 用后端返回的真实 ID 替换临时 ID
      const woWithRealIds = newWOs.map((wo, idx) => {
        const realId = results[idx]?.data?.id;
        return realId ? { ...wo, id: String(realId) } : wo;
      });
      // 刷新后端数据（确保 localStorage 与后端一致）
      await loadFromApi();
      // 若 loadFromApi 未返回新工单（后端延迟），fallback 写入真实 ID 的工单
      setWos(prev => {
        const existingIds = new Set(prev.map(w => w.id));
        const missing = woWithRealIds.filter(w => !existingIds.has(w.id));
        return missing.length > 0 ? [...missing, ...prev] : prev;
      });
    } catch {
      setWos(prev => [...newWOs, ...prev]);
    } finally {
      setApiLoading(false);
    }
  };

  // 生成浮票：持久化写入并同步外部浮票单页
  const handleGenerateFT = async (newFTs: FloatTicketV2[]) => {
    setApiLoading(true);
    try {
      const woNumId = newFTs.length > 0 ? Number(newFTs[0].woId) : NaN;
      await batchCreateFloatTickets(newFTs.map(ft => ({
        ticketNo: ft.ticketNo,
        workOrderId: !isNaN(woNumId) && woNumId > 0 ? woNumId : undefined,
        workOrderNo: ft.woNo,
        quantity: ft.qty,
        status: 'PRINTED',
        remark: ft.qrContent ?? ft.taskNo,
      })));
      await loadFromApi();
      // PAD 同步：将最新浮票写入 localStorage 供 PAD 读取
      setFloatTickets(prev => {
        const updated = [...prev, ...newFTs];
        saveFloatTickets(updated);
        return updated;
      });
    } catch {
      setFloatTickets(prev => {
        const updated = [...prev, ...newFTs];
        saveFloatTickets(updated);
        return updated;
      });
    } finally {
      setApiLoading(false);
    }
  };

  // 任务单完工后刷新工单进度
  const refreshWoFromTasks = (woId: string) => {
    syncWoProgressFromTasks(woId);
    // 重新从 localStorage 加载最新工单
    setWos(prev => {
      const latestWos = JSON.parse(localStorage.getItem(STORE_KEYS.WORK_ORDERS) || '[]') as WorkOrder[];
      if (latestWos.length > 0) return latestWos;
      return prev;
    });
  };

  return (
    <div className="wo-page">
      {/* 页头 */}
      <div className="wo-page-header">
        <UnorderedListOutlined style={{ color: '#1677ff', marginRight: 8 }} />
        生产工单管理（L2）
        <span style={{ fontSize: 12, color: '#98a2b3', marginLeft: 12 }}>
          生产订单拆批下推 / 独立新建 → 工单决定工艺路径+批号 → 按工序派工 → 任务单执行
        </span>
      </div>

      {/* KPI 统计卡片 */}
      <div className="wo-kpi-row">
        {[
          { label: '已创建', val: summary.created,    color: '#8c8c8c', status: 'CREATED' },
          { label: '已下发', val: summary.released,   color: '#faad14', status: 'RELEASED' },
          { label: '生产中', val: summary.inProgress, color: '#52c41a', status: 'IN_PROGRESS' },
          { label: '已完成', val: summary.completed,  color: '#13c2c2', status: 'COMPLETED' },
          { label: '合计',   val: summary.total,      color: '#1d2939', status: 'ALL' },
        ].map(k => (
          <div
            key={k.label}
            className="wo-kpi"
            style={{ cursor: 'pointer', background: filterStatus === k.status ? '#e6f4ff' : '' }}
            onClick={() => setFilterStatus(filterStatus === k.status ? 'ALL' : k.status)}
          >
            <div className="wo-kpi-val" style={{ color: k.color }}>{k.val}</div>
            <div className="wo-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* 工具栏 */}
      <div className="wo-toolbar">
        <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#aaa' }} />}
            placeholder="搜索工单号 / 批号 / 来源订单 / 产品..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 130 }}>
            <Option value="ALL">全部状态</Option>
            {Object.entries(WO_STATUS).map(([k, v]) => (
              <Option key={k} value={k}><span style={{ color: v.color }}>●</span> {v.label}</Option>
            ))}
          </Select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<ReloadOutlined />} loading={apiLoading} onClick={() => { setUserCleared(false); loadFromApi(); }}>刷新</Button>
          <Button onClick={() => { setSearchText(''); setFilterStatus('ALL'); }}>重置</Button>
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: '清空所有生产数据',
                content: '将清空生产订单、工单、任务单、浮票及PAD数据，此操作不可恢复，确认吗？',
                okText: '确认清空',
                cancelText: '取消',
                okButtonProps: { danger: true },
                onOk: async () => {
                  // ① 先清空后端数据库（四张表，按依赖顺序）
                  try {
                    const [toResp, ftResp, woResp, poResp] = await Promise.all([
                      getTaskOrderList() as any,
                      getFloatTicketList() as any,
                      getWorkOrderList() as any,
                      getProductionOrderList() as any,
                    ]);
                    const toIds: number[] = (toResp.data ?? []).map((x: any) => x.id).filter(Boolean);
                    const ftIds: number[] = (ftResp.data ?? []).map((x: any) => x.id).filter(Boolean);
                    const woIds: number[] = (woResp.data ?? []).map((x: any) => x.id).filter(Boolean);
                    const poIds: number[] = (poResp.data ?? []).map((x: any) => x.id).filter(Boolean);
                    if (toIds.length) await batchDeleteTaskOrders(toIds);
                    if (ftIds.length) await batchDeleteFloatTickets(ftIds);
                    if (woIds.length) await batchDeleteWorkOrders(woIds);
                    if (poIds.length) await batchDeleteProductionOrders(poIds);
                  } catch { /* 后端删除失败时不影响前端清空 */ }
                  // ② 清空前端 localStorage
                  clearProductionData();
                  setWos([]);
                  setTasks([]);
                  message.success('数据库 & 本地数据已彻底清空');
                },
              });
            }}
          >清空数据</Button>
          <Button icon={<DownloadOutlined />} onClick={() => setPushFromPOOpen(true)}>
            从订单下推
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateWOOpen(true)}>
            独立新建工单
          </Button>
        </div>
      </div>

      {/* 工单列表 */}
      <Spin spinning={apiLoading}>
      <div className="wo-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#98a2b3', padding: '48px 0', fontSize: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            暂无工单数据，可在"生产订单"页面审核后下推拆批，或点击"独立新建工单"
          </div>
        ) : (
          filtered.map(wo => (
            <WOCard
              key={wo.id}
              wo={wo}
              tasks={tasks}
              onClick={() => { setSelectedWO(wo); setDetailOpen(true); }}
              onRelease={() => handleRelease(wo)}
              onCreateTask={() => { setTaskTargetWO(wo); setCreateTaskOpen(true); }}
            />
          ))
        )}
      </div>
      </Spin>

      {/* 工单详情抽屉 */}
      <WODetailDrawer
        wo={selectedWO}
        tasks={tasks}
        floatTickets={floatTickets}
        pos={pos}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRelease={handleRelease}
        onNavigateToRouting={onNavigateToRouting}
        onGenerateFT={wo => { setGenFTTargetWO(wo); setGenFTOpen(true); }}
      />

      {/* 独立新建工单弹窗 */}
      <CreateWOModal
        open={createWOOpen}
        existingWOCount={wos.length}
        onClose={() => setCreateWOOpen(false)}
        onCreated={handleWOCreated}
      />

      {/* 从生产订单下推 */}
      <PushFromPOModal
        open={pushFromPOOpen}
        pos={pos}
        existingWOs={wos}
        onClose={() => setPushFromPOOpen(false)}
        onPushed={handlePushed}
      />

      {/* 生成任务单弹窗 */}
      <CreateTaskModal
        open={createTaskOpen}
        wo={taskTargetWO}
        existingTasks={tasks}
        onClose={() => setCreateTaskOpen(false)}
        onCreated={handleCreateTask}
      />

      {/* 生成浮票弹窗 */}
      <GenerateFloatTicketModal
        open={genFTOpen}
        wo={genFTTargetWO}
        existingFTs={floatTickets}
        onClose={() => setGenFTOpen(false)}
        onGenerated={handleGenerateFT}
      />
    </div>
  );
};

export default WorkOrderListPage;
