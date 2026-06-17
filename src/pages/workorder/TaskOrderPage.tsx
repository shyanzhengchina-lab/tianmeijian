/**
 * 生产任务单页面（L3）- PRD V1.0 对齐版
 * 功能：
 *  - 查看所有任务单列表（含班次/班组/操作工/工序/进度）
 *  - 新建独立派工单（关联已下发/生产中工单，选工序、班次、班组、操作工、设备、PAD）
 *  - 状态流转：待派工→已派工→执行中→已完成（含暂停/恢复）
 *  - 完成/报工弹窗：填写实际报工数量、废品数量、偏差说明
 *  - 任务详情抽屉：展示工序、班组、设备、PAD、EBR进度
 *  - 班次快速筛选条 + KPI汇总行 + 搜索/状态过滤
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  Button, Input, Select, Drawer, message, Tag, Tooltip,
  Modal, Form, Alert, Divider, InputNumber, Badge, Spin,
} from 'antd';
import { getTaskOrderList, createTaskOrder as apiCreateTaskOrder, updateTaskOrder as apiUpdateTaskOrder } from '../../api/taskOrders';
import { updateWorkOrder as apiUpdateWorkOrder, getWorkOrderList } from '../../api/workOrders';
import {
  SearchOutlined, ReloadOutlined, EyeOutlined,
  CheckCircleOutlined, PlayCircleOutlined,
  ClockCircleOutlined, UnorderedListOutlined,
  PlusOutlined, PauseCircleOutlined,
  DesktopOutlined, TeamOutlined, UserOutlined,
  WarningOutlined, BarChartOutlined, SendOutlined,
  TabletOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import {
  TaskOrder, WorkOrder,
  TASK_STATUS, WO_STATUS, TaskStatus,
  ROUTING_STEPS, ROUTING_MASTERS,
  SHIFTS, TEAMS, OPERATORS, EQUIPMENTS, PAD_STATIONS, WORK_CENTERS,
  mockTaskOrders, mockWorkOrders,
  genTaskNo,
} from './workOrderData';
import { STORE_KEYS, syncWoProgressFromTasks, syncPoProgressFromWos, loadWorkOrders, isUserCleared } from '../../store/mesStore';
import './WorkOrderPage.css';

const { Option } = Select;
const { TextArea } = Input;

const genId  = (p: string) => `${p}${Date.now()}${Math.floor(Math.random() * 100)}`;
const nowStr = () => new Date().toLocaleString('zh-CN');

// ─────────────────────────────────────────────────────────────────────────────
// 班次徽章
// ─────────────────────────────────────────────────────────────────────────────
const ShiftBadge: React.FC<{ shiftId: string; shiftName: string }> = ({ shiftId, shiftName }) => {
  const shift = SHIFTS.find(s => s.id === shiftId);
  const color = shift?.color || '#8c8c8c';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
      borderRadius: 10, fontSize: 11, fontWeight: 600,
      background: `${color}18`, color, border: `1px solid ${color}40`, marginRight: 6,
    }}>
      ⏰ {shiftName || shift?.name}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 任务单卡片
// ─────────────────────────────────────────────────────────────────────────────
const TaskCard: React.FC<{
  task: TaskOrder;
  wo: WorkOrder | undefined;
  onClick: () => void;
  onStart: () => void;
  onDone: () => void;
  onPause: () => void;
  onReport: () => void;
  onGoToPad?: () => void;
}> = ({ task, wo, onClick, onStart, onDone, onPause, onReport, onGoToPad }) => {
  const ts = TASK_STATUS[task.status];
  const ws = wo ? WO_STATUS[wo.status] : null;

  // 报工进度百分比
  const pct = task.planQty > 0 && task.reportQty
    ? Math.min(100, Math.round((task.reportQty / task.planQty) * 100))
    : 0;

  return (
    <div className="wo-card" onClick={onClick}>
      <div className="wo-card-accent" style={{ background: ts.color }} />
      <div className="wo-card-body">
        {/* 行1：单号 + 来源工单 + 批号 + 班次 + 状态 + 偏差 */}
        <div className="wo-row1">
          <span className="wo-no">{task.taskNo}</span>
          <span className="wo-ref">← {task.woNo}</span>
          <span className="wo-batch-tag">{task.batchNo}</span>
          <ShiftBadge shiftId={task.shiftId} shiftName={task.shiftName} />
          <span
            className="wo-status-badge"
            style={{
              color: ts.color, background: ts.bg,
              border: `1px solid ${task.status !== 'PENDING' ? ts.color + '30' : '#d0d5dd'}`,
            }}
          >
            {ts.label}
          </span>
          {task.deviationFlag && (
            <span style={{ fontSize: 11, color: '#f5222d', fontWeight: 600 }}>
              <WarningOutlined style={{ marginRight: 2 }} />偏差
            </span>
          )}
        </div>

        {/* 行2：产品名称 + 母工单状态 */}
        <div className="wo-row2">
          <span className="wo-product">
            {wo ? `${wo.productName} — ${wo.productSpec}` : '—'}
          </span>
          {ws && (
            <span style={{ fontSize: 11, color: ws.color, marginLeft: 8, background: ws.bg, padding: '1px 6px', borderRadius: 4, border: `1px solid ${ws.color}30` }}>
              母工单: {ws.label}
            </span>
          )}
        </div>

        {/* 行3：工作中心 + 班组 + 操作工 + PAD + 报工量 */}
        <div className="wo-row3">
          <span className="wo-pill">🏭 {task.workCenter}</span>
          <span className="wo-pill">
            <TeamOutlined style={{ marginRight: 3 }} />{task.team}
          </span>
          <span className="wo-pill">
            <UserOutlined style={{ marginRight: 3 }} />{task.operator}
          </span>
          {task.padStation && (
            <span className="wo-pill" style={{ color: '#1677ff', borderColor: '#bae0ff' }}>
              📟 {task.padStation}
            </span>
          )}
          {task.reportQty !== undefined && task.reportQty > 0 && (
            <span className="wo-pill green">
              报工 <b>{task.reportQty.toLocaleString()}</b> 支
            </span>
          )}
          {task.scrapQty !== undefined && task.scrapQty > 0 && (
            <span className="wo-pill red">废品 <b>{task.scrapQty}</b> 支</span>
          )}
        </div>

        {/* 报工进度条（执行中/已完成时显示） */}
        {(task.status === 'IN_PROGRESS' || task.status === 'DONE') && task.reportQty !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
            <div style={{ flex: 1, height: 4, background: '#f0f2f5', borderRadius: 2 }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: task.status === 'DONE' ? '#13c2c2' : '#52c41a',
                borderRadius: 2, transition: 'width 0.3s',
              }} />
            </div>
            <span style={{ fontSize: 11, color: '#667085', minWidth: 32 }}>{pct}%</span>
            <span style={{ fontSize: 11, color: '#98a2b3' }}>
              计划 {task.planQty.toLocaleString()} 支
            </span>
          </div>
        )}

        {/* 工序范围（简略显示前5道） */}
        <div style={{ padding: '3px 0', fontSize: 11, color: '#667085' }}>
          <span style={{ color: '#98a2b3', marginRight: 4 }}>工序:</span>
          {(task.stepIds || []).slice(0, 5).map(sid => {
            const step = ROUTING_STEPS.find(s => s.id === sid);
            return step ? (
              <span
                key={sid}
                style={{
                  display: 'inline-block', marginRight: 4,
                  color: step.isKeyOp ? '#d46b08' : '#667085',
                }}
              >
                {step.opNo}
                {step.isKeyOp && <span style={{ fontSize: 9, color: '#f5222d' }}>★</span>}
              </span>
            ) : null;
          })}
          {(task.stepIds || []).length > 5 && (
            <span style={{ color: '#98a2b3' }}>…+{task.stepIds.length - 5}</span>
          )}
        </div>

        {/* 行4：计划时间 + 实际时间 */}
        <div className="wo-row4">
          <span className="wo-meta">
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {task.planStart} ~ {task.planEnd || '—'}
          </span>
          {task.actualStart && (
            <span className="wo-meta green">实开: {task.actualStart}</span>
          )}
          {task.actualEnd && (
            <span className="wo-meta">实结: {task.actualEnd}</span>
          )}
        </div>
      </div>

      {/* 操作按钮区 ── PAD工业风格大按钮 */}
      <div className="task-card-actions" onClick={e => e.stopPropagation()}>
        <Tooltip title="查看详情" placement="left">
          <button className="pad-action-btn pad-btn-detail" onClick={onClick}>
            <EyeOutlined />
            <span>详情</span>
          </button>
        </Tooltip>
        {task.status === 'PENDING' && (
          <Tooltip title="派发任务" placement="left">
            <button className="pad-action-btn pad-btn-send" onClick={onStart}>
              <SendOutlined />
              <span>派发</span>
            </button>
          </Tooltip>
        )}
        {task.status === 'ASSIGNED' && (
          <Tooltip title="开始执行" placement="left">
            <button className="pad-action-btn pad-btn-start" onClick={onStart}>
              <PlayCircleOutlined />
              <span>开工</span>
            </button>
          </Tooltip>
        )}
        {task.status === 'IN_PROGRESS' && (
          <>
            <Tooltip title="报工" placement="left">
              <button className="pad-action-btn pad-btn-report" onClick={onReport}>
                <BarChartOutlined />
                <span>报工</span>
              </button>
            </Tooltip>
            <Tooltip title="暂停" placement="left">
              <button className="pad-action-btn pad-btn-pause" onClick={onPause}>
                <PauseCircleOutlined />
                <span>暂停</span>
              </button>
            </Tooltip>
            <Tooltip title="完工" placement="left">
              <button className="pad-action-btn pad-btn-done" onClick={onDone}>
                <CheckCircleOutlined />
                <span>完工</span>
              </button>
            </Tooltip>
          </>
        )}
        {task.status === 'PAUSED' && (
          <Tooltip title="恢复执行" placement="left">
            <button className="pad-action-btn pad-btn-start" onClick={onStart}>
              <PlayCircleOutlined />
              <span>恢复</span>
            </button>
          </Tooltip>
        )}
        {/* PAD执行入口：已派工/执行中/暂停时显示 */}
        {(task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS' || task.status === 'PAUSED') && onGoToPad && (
          <Tooltip title="前往PAD执行" placement="left">
            <button className="pad-action-btn pad-btn-pad" onClick={onGoToPad}>
              <TabletOutlined />
              <span>PAD</span>
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 报工/完工弹窗（PRD：完成时必须填写实际报工量和废品数，可填偏差说明）
// ─────────────────────────────────────────────────────────────────────────────
const ReportModal: React.FC<{
  open: boolean;
  task: TaskOrder | null;
  mode: 'report' | 'done'; // report=中途报工, done=完工
  onClose: () => void;
  onConfirm: (reportQty: number, scrapQty: number, deviation: boolean, remark: string) => void;
}> = ({ open, task, mode, onClose, onConfirm }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open && task) {
      form.resetFields();
      form.setFieldsValue({
        reportQty: task.planQty,
        scrapQty: 0,
        deviationFlag: false,
        remark: '',
      });
    }
  }, [open, task, form]);

  const handleOk = () => {
    form.validateFields().then(vals => {
      onConfirm(
        Number(vals.reportQty),
        Number(vals.scrapQty || 0),
        !!vals.deviationFlag,
        vals.remark || '',
      );
      onClose();
    }).catch(() => {});
  };

  if (!task) return null;
  const isDone = mode === 'done';

  return (
    <Modal
      open={open}
      title={isDone ? '✅ 完工报告' : '📊 中途报工'}
      onCancel={onClose}
      onOk={handleOk}
      okText={isDone ? '确认完工' : '提交报工'}
      cancelText="取消"
      width={460}
      okButtonProps={{ style: isDone ? { background: '#13c2c2', borderColor: '#13c2c2' } : {} }}
    >
      {/* 任务摘要 */}
      <div style={{
        background: '#f5f7fa', borderRadius: 8, padding: '10px 14px',
        marginBottom: 16, border: '1px solid #e8ecf0',
      }}>
        <div style={{ fontSize: 12, color: '#98a2b3', marginBottom: 4 }}>任务单</div>
        <div style={{ fontWeight: 700, color: '#1d2939', fontSize: 14 }}>{task.taskNo}</div>
        <div style={{ fontSize: 12, color: '#667085', marginTop: 2 }}>
          计划数量：<b style={{ color: '#1677ff' }}>{task.planQty.toLocaleString()} 支</b>
          &nbsp;|&nbsp;工作中心：{task.workCenter}
          &nbsp;|&nbsp;班组：{task.team}
        </div>
      </div>

      <Form form={form} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item
            name="reportQty"
            label={isDone ? '实际完工数量（支）' : '本次报工数量（支）'}
            rules={[
              { required: true, message: '请输入报工数量' },
              { type: 'number', min: 1, message: '数量必须≥1' },
            ]}
          >
            <InputNumber
              min={0} max={task.planQty} style={{ width: '100%' }}
              placeholder={`≤${task.planQty.toLocaleString()}`}
            />
          </Form.Item>
          <Form.Item
            name="scrapQty"
            label="废品数量（支）"
            rules={[{ type: 'number', min: 0, message: '不能为负数' }]}
          >
            <InputNumber min={0} max={task.planQty} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
        </div>

        <Form.Item name="deviationFlag" label="是否存在生产偏差">
          <Select>
            <Option value={false}><span style={{ color: '#52c41a' }}>● 无偏差，正常完工</span></Option>
            <Option value={true}><span style={{ color: '#f5222d' }}>⚠️ 存在偏差，需质量确认</span></Option>
          </Select>
        </Form.Item>

        <Form.Item name="remark" label={isDone ? '完工说明（选填）' : '报工说明（选填）'}>
          <TextArea
            rows={2}
            placeholder={isDone
              ? '如：全部完成，无异常；或 热处理炉温度偏低，已通知工程师'
              : '如：已完成粗磨工序，待进入精磨'}
          />
        </Form.Item>

        {isDone && (
          <Alert
            type="warning" showIcon
            message="完工后任务状态将变为「已完成」，报工数据将同步至工单进度。"
            style={{ borderRadius: 6 }}
          />
        )}
      </Form>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 任务单详情抽屉
// ─────────────────────────────────────────────────────────────────────────────
const TaskDetailDrawer: React.FC<{
  task: TaskOrder | null;
  wo: WorkOrder | undefined;
  open: boolean;
  onClose: () => void;
}> = ({ task, wo, open, onClose }) => {
  const [woSubOpen, setWoSubOpen] = useState(false);
  if (!task) return null;
  const ts      = TASK_STATUS[task.status];
  const shift   = SHIFTS.find(s => s.id === task.shiftId);
  const team    = TEAMS.find(t => t.id === task.teamId);
  const routing = wo ? ROUTING_MASTERS.find(r => r.code === wo.routingCode) : null;
  const operator = OPERATORS.find(op => op.id === task.operatorId);

  const pct = task.planQty > 0 && task.reportQty
    ? Math.min(100, Math.round((task.reportQty / task.planQty) * 100))
    : 0;

  return (
    <Drawer
      open={open} onClose={onClose} width={480}
      title={
        <span>
          <UnorderedListOutlined style={{ marginRight: 6, color: '#1677ff' }} />
          生产任务单详情
          <Badge
            count={ts.label}
            style={{ backgroundColor: ts.color, marginLeft: 10, fontSize: 11 }}
          />
        </span>
      }
      styles={{
        header: { background: '#fff', borderBottom: '1px solid #e8ecf0' },
        body:   { background: '#f5f7fa', padding: 16 },
      }}
    >
      {/* 基本信息 */}
      <div className="wd-section">
        <div className="wd-title">📋 任务单信息</div>
        {([
          ['任务单号', task.taskNo],
          ['来源工单', ''],  // rendered separately
          ['生产批号', task.batchNo],
          ['产品名称', wo?.productName || '-'],
          ['产品规格', wo?.productSpec || '-'],
          ['工艺路径', routing ? `${routing.name} ${routing.version}` : (wo?.routingName || '-')],
          ['工作中心', task.workCenter],
          ['工序范围', task.stationScope],
        ] as [string, string][]).map(([l, v]) => l === '来源工单' ? null : (
          <div key={l} className="wd-row">
            <span className="wd-label">{l}</span>
            <span className="wd-val" style={l === '生产批号' ? { color: '#1677ff', fontWeight: 600 } : {}}>{v}</span>
          </div>
        ))}
        {/* 来源工单 — 可点击上查 */}
        <div className="wd-row">
          <span className="wd-label">来源工单</span>
          <span className="wd-val">
            {wo ? (
              <span
                style={{ color: '#1677ff', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                onClick={() => setWoSubOpen(true)}
              >
                🔗 {task.woNo}
              </span>
            ) : (
              <span style={{ color: '#8c8c8c' }}>{task.woNo}</span>
            )}
          </span>
        </div>
      </div>

      {/* 班次 & 班组 & 操作工 */}
      <div className="wd-section">
        <div className="wd-title">⏰ 班次 & 班组派工</div>
        <div className="wd-row">
          <span className="wd-label">班次</span>
          <span className="wd-val">
            {shift && <span style={{ color: shift.color, fontWeight: 600 }}>⏰ {shift.name}</span>}
            {shift && <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 8 }}>{shift.startTime}~{shift.endTime}</span>}
          </span>
        </div>
        <div className="wd-row">
          <span className="wd-label">执行班组</span>
          <span className="wd-val">
            <b>{task.team}</b>
            {team && <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 8 }}>组长: {team.leader}</span>}
          </span>
        </div>
        <div className="wd-row">
          <span className="wd-label">主操作工</span>
          <span className="wd-val">
            <b>{operator?.name || task.operator}</b>
            {operator && (
              <Tag
                color={operator.role === '班组长' ? 'orange' : operator.role === 'QC' ? 'green' : 'blue'}
                style={{ marginLeft: 6, fontSize: 10 }}
              >
                {operator.role}
              </Tag>
            )}
            <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 4 }}>
              {task.operatorId}
            </span>
          </span>
        </div>
        {([
          ['计划开始', task.planStart],
          ['计划结束', task.planEnd || '-'],
          ['实际开始', task.actualStart || '-'],
          ['实际结束', task.actualEnd   || '-'],
        ] as [string, string][]).map(([l, v]) => (
          <div key={l} className="wd-row">
            <span className="wd-label">{l}</span>
            <span className="wd-val">{v}</span>
          </div>
        ))}
        {task.remark && (
          <div className="wd-row">
            <span className="wd-label">派工说明</span>
            <span className="wd-val" style={{ color: '#faad14' }}>{task.remark}</span>
          </div>
        )}
      </div>

      {/* 报工进度 */}
      {(task.status === 'IN_PROGRESS' || task.status === 'DONE' || task.status === 'PAUSED') && (
        <div className="wd-section">
          <div className="wd-title"><BarChartOutlined style={{ marginRight: 4 }} />报工进度</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#98a2b3', marginBottom: 6 }}>
            <span>报工进度</span>
            <span style={{ color: '#389e0d', fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: '#f0f2f5', borderRadius: 4, marginBottom: 8 }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: task.status === 'DONE' ? '#13c2c2' : '#52c41a',
              borderRadius: 4,
            }} />
          </div>
          <div className="wd-row">
            <span className="wd-label">计划数量</span>
            <span className="wd-val">{task.planQty.toLocaleString()} 支</span>
          </div>
          {task.reportQty !== undefined && (
            <div className="wd-row">
              <span className="wd-label">已报工数量</span>
              <span className="wd-val" style={{ color: '#52c41a', fontWeight: 600 }}>
                {task.reportQty.toLocaleString()} 支
              </span>
            </div>
          )}
          {task.scrapQty !== undefined && task.scrapQty > 0 && (
            <div className="wd-row">
              <span className="wd-label">废品数量</span>
              <span className="wd-val" style={{ color: '#f5222d' }}>{task.scrapQty} 支</span>
            </div>
          )}
          {task.deviationFlag && (
            <div className="wd-row">
              <span className="wd-label">偏差记录</span>
              <span className="wd-val" style={{ color: '#f5222d', fontWeight: 600 }}>
                <WarningOutlined style={{ marginRight: 4 }} />存在偏差，需质量确认
              </span>
            </div>
          )}
        </div>
      )}

      {/* 设备 & PAD工位 */}
      {(task.padStation || (task.equipIds && task.equipIds.length > 0)) && (
        <div className="wd-section">
          <div className="wd-title"><DesktopOutlined style={{ marginRight: 4 }} />设备 & PAD工位</div>
          {task.padStation && (
            <div className="wd-row">
              <span className="wd-label">PAD工位</span>
              <span className="wd-val" style={{ color: '#1677ff', fontWeight: 600 }}>📟 {task.padStation}</span>
            </div>
          )}
          {task.currentOpNo && (
            <div className="wd-row">
              <span className="wd-label">当前执行</span>
              <span className="wd-val" style={{ color: '#52c41a', fontWeight: 600 }}>
                📍 {task.currentOpNo}
              </span>
            </div>
          )}
          {task.equipIds && task.equipIds.length > 0 && (
            <div className="wd-row">
              <span className="wd-label">绑定设备</span>
              <span className="wd-val">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {task.equipIds.map(eid => {
                    const eq = EQUIPMENTS.find(e => e.id === eid);
                    return eq ? (
                      <Tag key={eid} color="blue" style={{ fontSize: 11 }}>{eq.name}</Tag>
                    ) : null;
                  })}
                </div>
              </span>
            </div>
          )}
        </div>
      )}

      {/* 负责工序 */}
      <div className="wd-section">
        <div className="wd-title">⚙️ 负责工序（{task.stepIds?.length || 0} 道）</div>
        {task.stepIds && task.stepIds.length > 0 ? (
          <div>
            {task.stepIds.map(sid => {
              const step = ROUTING_STEPS.find(s => s.id === sid);
              if (!step) return null;
              const isCurrent = task.currentOpNo === step.opNo;
              return (
                <div
                  key={sid}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderBottom: '1px solid #f0f2f5',
                    background: isCurrent ? '#f0f7ff' : 'transparent',
                    borderRadius: isCurrent ? 6 : 0,
                    marginBottom: isCurrent ? 2 : 0,
                  }}
                >
                  <div>
                    <span style={{
                      fontSize: 12,
                      color: isCurrent ? '#1677ff' : step.isKeyOp ? '#d46b08' : '#667085',
                      fontWeight: 600, marginRight: 8,
                    }}>
                      {isCurrent && '📍 '}{step.opNo}
                    </span>
                    <span style={{ fontSize: 13, color: '#1d2939' }}>{step.name}</span>
                    {step.isKeyOp && <Tag color="orange" style={{ marginLeft: 6, fontSize: 10 }}>关键工序</Tag>}
                    {step.mandatoryInspection && <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>强检</Tag>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#98a2b3' }}>{step.stage}</div>
                    <div style={{ fontSize: 11, color: '#98a2b3' }}>{step.standardTime}min/百支</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#98a2b3' }}>{task.stationScope}</div>
        )}
      </div>

      {/* 关联工单 */}
      {wo && (
        <div className="wd-section">
          <div className="wd-title">🔗 关联工单信息</div>
          {([
            ['工单号',   wo.woNo],
            ['批号',     wo.batchNo],
            ['计划数量', `${wo.planQty.toLocaleString()} 支`],
            ['实际数量', wo.actualQty ? `${wo.actualQty.toLocaleString()} 支` : '-'],
            ['工单状态', WO_STATUS[wo.status]?.label || wo.status],
            ['当前工序', wo.currentOp || '-'],
          ] as [string, string][]).map(([l, v]) => (
            <div key={l} className="wd-row">
              <span className="wd-label">{l}</span>
              <span className="wd-val">{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => setWoSubOpen(true)}>
              查看工单详情
            </Button>
          </div>
        </div>
      )}

      {/* 嵌套抽屉 — 工单详情（任务单上查） */}
      {wo && (
        <Drawer
          open={woSubOpen} onClose={() => setWoSubOpen(false)} width={420}
          title={<span>⚛️ 工单详情 — {wo.woNo}</span>}
          styles={{ header: { background: '#fff' }, body: { background: '#f5f7fa', padding: 16 } }}
        >
          {(() => {
            const ws      = WO_STATUS[wo.status];
            const routing = ROUTING_MASTERS.find(r => r.code === wo.routingCode);
            const pct     = wo.planQty > 0 && wo.actualQty ? Math.round((wo.actualQty / wo.planQty) * 100) : (wo.progressPct || 0);
            return (
              <>
                <div className="wd-section">
                  <div className="wd-title">📋 工单信息 <span style={{ color: ws.color, marginLeft: 8, fontSize: 11 }}>{ws.label}</span></div>
                  {([
                    ['工单号',   wo.woNo],
                    ['批号',     wo.batchNo],
                    ['来源订单', wo.poNo || '（独立新建）'],
                    ['产品名称', wo.productName],
                    ['产品规格', wo.productSpec],
                    ['工艺路径', routing ? `${routing.name} ${routing.version}` : (wo.routingName || wo.routingCode)],
                    ['计划数量', `${wo.planQty.toLocaleString()} 支`],
                    ['实际数量', wo.actualQty ? `${wo.actualQty.toLocaleString()} 支` : '-'],
                    ['工单状态', ws.label],
                    ['当前工序', wo.currentOp || '-'],
                    ['计划开始', wo.planStart || '-'],
                    ['计划结束', wo.planEnd   || '-'],
                    ['实际开始', wo.actualStart || '-'],
                    ['实际结束', wo.actualEnd   || '-'],
                    ['创建人',   wo.createdBy],
                    ['创建时间', wo.createdAt],
                  ] as [string, string][]).map(([l, v]) => (
                    <div key={l} className="wd-row">
                      <span className="wd-label">{l}</span>
                      <span className="wd-val" style={l === '批号' ? { color: '#1677ff', fontWeight: 600 } : {}}>{v}</span>
                    </div>
                  ))}
                  {pct > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#98a2b3' }}>
                        <span>生产进度</span><span style={{ color: '#389e0d' }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: '#f0f2f5', borderRadius: 4, marginTop: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#52c41a', borderRadius: 4 }} />
                      </div>
                    </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// 新建派工单弹窗（PRD对齐：工单→工序→班次→班组→操作工→工位→设备）
// ─────────────────────────────────────────────────────────────────────────────
const CreateTaskModal: React.FC<{
  open: boolean;
  wos: WorkOrder[];
  existingTasks: TaskOrder[];
  onClose: () => void;
  onCreated: (t: TaskOrder) => void;
}> = ({ open, wos, existingTasks, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [selectedWOId, setSelectedWOId]       = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('SH01');
  const [selectedTeamId, setSelectedTeamId]   = useState<string>('');
  const [selectedSteps, setSelectedSteps]     = useState<string[]>([]);

  const selectedWO      = wos.find(w => w.id === selectedWOId);
  const routing         = selectedWO ? ROUTING_MASTERS.find(r => r.code === selectedWO.routingCode) : null;
  const routingStepIds  = routing ? routing.steps : ROUTING_STEPS.map(s => s.id);

  const assignedStepIds = existingTasks
    .filter(t => t.woId === selectedWOId)
    .flatMap(t => t.stepIds || []);

  const available      = ROUTING_STEPS.filter(s =>
    routingStepIds.includes(s.id) && !assignedStepIds.includes(s.id)
  );
  const filteredTeams  = TEAMS.filter(t => t.shiftId === selectedShiftId);
  const selectedTeam   = TEAMS.find(t => t.id === selectedTeamId);

  // 根据班组获取成员列表（优先班组成员，退而全员）
  const teamMembers = selectedTeam
    ? OPERATORS.filter(op => selectedTeam.members.includes(op.id))
    : [];

  const recommendedPads = selectedTeam
    ? PAD_STATIONS.filter(p =>
        p.status === 'ONLINE' &&
        p.workCenter.split('/').some(wc =>
          selectedTeam.workCenter.split('/').some(twc => wc.trim().includes(twc.trim()) || twc.trim().includes(wc.trim()))
        )
      )
    : PAD_STATIONS.filter(p => p.status === 'ONLINE');

  // 可派工的工单：已下发或生产中
  const assignableWOs = wos.filter(w => w.status === 'RELEASED' || w.status === 'IN_PROGRESS');

  React.useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedWOId('');
      setSelectedSteps([]);
      setSelectedShiftId('SH01');
      setSelectedTeamId('');
      form.setFieldsValue({ shiftId: 'SH01' });
    }
  }, [open, form]);

  const handleTeamChange = (v: string) => {
    setSelectedTeamId(v);
    form.setFieldsValue({ operatorId: undefined, padStation: undefined });
  };

  const handleShiftChange = (v: string) => {
    setSelectedShiftId(v);
    setSelectedTeamId('');
    form.setFieldsValue({ teamId: undefined, operatorId: undefined, padStation: undefined });
  };

  const handleOk = () => {
    form.validateFields().then(vals => {
      if (!selectedWO) { message.warning('请选择关联工单'); return; }
      if (selectedSteps.length === 0) { message.warning('请至少选择一道工序'); return; }

      const steps    = ROUTING_STEPS.filter(s => selectedSteps.includes(s.id));
      const stepDesc = steps.map(s => `${s.opNo}(${s.name})`).join(' → ');
      const shift    = SHIFTS.find(s => s.id === vals.shiftId) || SHIFTS[0];
      const team     = TEAMS.find(t => t.id === vals.teamId);
      const operator = OPERATORS.find(op => op.id === vals.operatorId);
      const taskSeq  = existingTasks.filter(t => t.woId === selectedWOId).length + 1;
      const taskNo   = genTaskNo(selectedWO.woNo, shift.name, taskSeq);

      const task: TaskOrder = {
        id:           genId('TK'),
        taskNo,
        woId:         selectedWO.id,
        woNo:         selectedWO.woNo,
        batchNo:      selectedWO.batchNo,
        workCenter:   vals.workCenter,
        shiftId:      vals.shiftId,
        shiftName:    shift.name,
        team:         team ? team.name : '',
        teamId:       vals.teamId,
        operator:     operator ? `${operator.name}（工号:${operator.id}）` : (vals.operatorId || ''),
        operatorId:   vals.operatorId,
        stationScope: stepDesc,
        stepIds:      selectedSteps,
        planQty:      selectedWO.planQty,
        planStart:    vals.planStart || `${new Date().toISOString().slice(0, 10)} ${shift.startTime}`,
        planEnd:      vals.planEnd   || `${new Date().toISOString().slice(0, 10)} ${shift.endTime}`,
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
      title="➕ 新建生产任务单（派工单）"
      onCancel={() => { onClose(); form.resetFields(); }}
      onOk={handleOk}
      okText="创建派工单"
      cancelText="取消"
      width={700}
    >
      <Alert
        type="info" showIcon
        message="任务单决定由哪个班组、哪台设备、哪个班次执行工单中的哪些工序。派工路径：选工单 → 选工序 → 定班次/班组/操作工 → 绑定PAD工位/设备。"
        style={{ marginBottom: 16, borderRadius: 6 }}
      />

      <Form form={form} layout="vertical">
        {/* ① 选择关联工单 */}
        <div style={{ fontSize: 12, color: '#344054', fontWeight: 600, marginBottom: 8 }}>① 关联生产工单</div>
        <Form.Item name="woId" label="选择工单（已下发或生产中）" rules={[{ required: true }]}>
          <Select
            placeholder="选择已下发或生产中的工单"
            showSearch
            optionFilterProp="children"
            onChange={v => { setSelectedWOId(v as string); setSelectedSteps([]); }}
          >
            {assignableWOs.map(w => {
              const ws = WO_STATUS[w.status];
              return (
                <Option key={w.id} value={w.id}>
                  <span style={{ fontWeight: 600 }}>{w.woNo}</span>
                  <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 8 }}>
                    {w.productName} {w.productSpec}
                  </span>
                  <span style={{ fontSize: 11, color: ws.color, marginLeft: 8 }}>{ws.label}</span>
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        {selectedWO && (
          <div style={{
            marginBottom: 14, padding: '8px 12px', background: '#f0f7ff',
            borderRadius: 6, border: '1px solid #bae0ff', fontSize: 12,
          }}>
            <span><b>批号：</b><span style={{ color: '#1677ff' }}>{selectedWO.batchNo}</span></span>
            &nbsp;|&nbsp;<span><b>数量：</b>{selectedWO.planQty.toLocaleString()} 支</span>
            {routing && (
              <>&nbsp;|&nbsp;
                <span><b>工艺：</b>
                  <span style={{ color: '#531dab' }}>{routing.name} {routing.version}</span>
                </span>
              </>
            )}
          </div>
        )}

        {/* ② 选择工序 */}
        {selectedWO && (
          <>
            <div style={{ fontSize: 12, color: '#344054', fontWeight: 600, marginBottom: 8 }}>
              ② 选择负责工序（可多选）
            </div>
            <div style={{ marginBottom: 14 }}>
              {available.length === 0 ? (
                <div style={{ color: '#389e0d', fontSize: 13, padding: '6px 0' }}>
                  <CheckCircleOutlined style={{ marginRight: 6 }} />该工单所有工序已全部分配
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {available.map(step => {
                    const isSel = selectedSteps.includes(step.id);
                    return (
                      <div
                        key={step.id}
                        onClick={() => setSelectedSteps(prev =>
                          prev.includes(step.id)
                            ? prev.filter(s => s !== step.id)
                            : [...prev, step.id]
                        )}
                        style={{
                          padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                          border: `1px solid ${isSel ? '#1677ff' : '#d0d5dd'}`,
                          background: isSel ? '#e6f4ff' : '#f9fafb',
                          color: isSel ? '#1677ff' : '#344054',
                          fontWeight: isSel ? 600 : 400, transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ color: '#98a2b3', fontSize: 10, marginRight: 3 }}>{step.opNo}</span>
                        {step.name}
                        {step.isKeyOp && <span style={{ color: '#f5222d', marginLeft: 3, fontSize: 10 }}>★</span>}
                        {step.mandatoryInspection && <span style={{ color: '#f5222d', fontSize: 9, marginLeft: 1 }}>检</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              {assignedStepIds.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#98a2b3' }}>
                  已分配：{ROUTING_STEPS.filter(s => assignedStepIds.includes(s.id)).map(s => s.name).join('、')}
                </div>
              )}
              {selectedSteps.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#1677ff' }}>
                  已选 {selectedSteps.length} 道工序：{ROUTING_STEPS.filter(s => selectedSteps.includes(s.id)).map(s => s.name).join(' → ')}
                </div>
              )}
            </div>
          </>
        )}

        <Divider style={{ margin: '4px 0 14px' }} />

        {/* ③ 派工信息：班次→班组→操作工→工作中心 */}
        <div style={{ fontSize: 12, color: '#344054', fontWeight: 600, marginBottom: 10 }}>
          ③ 派工信息（班次 → 班组 → 操作工 → 工作中心）
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="shiftId" label="班次" rules={[{ required: true }]}>
            <Select onChange={handleShiftChange}>
              {SHIFTS.map(s => (
                <Option key={s.id} value={s.id}>
                  <span style={{ color: s.color, fontWeight: 600 }}>⏰ {s.name}</span>
                  <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 6 }}>
                    {s.startTime}~{s.endTime}
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="teamId" label="执行班组" rules={[{ required: true }]}>
            <Select
              placeholder="选择本班次的班组"
              onChange={handleTeamChange}
              disabled={!selectedShiftId}
            >
              {filteredTeams.map(t => (
                <Option key={t.id} value={t.id}>
                  <b>{t.name}</b>
                  <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 6 }}>
                    组长:{t.leader} · {t.workCenter}
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="operatorId" label="主操作工" rules={[{ required: true }]}>
            <Select
              placeholder={selectedTeamId ? '选择班组成员' : '请先选择班组'}
              showSearch
              optionFilterProp="children"
              disabled={!selectedTeamId}
            >
              {(teamMembers.length > 0 ? teamMembers : OPERATORS).map(op => (
                <Option key={op.id} value={op.id}>
                  <b style={{ color: op.role === '班组长' ? '#d46b08' : op.role === 'QC' ? '#389e0d' : '#1d2939' }}>
                    {op.role === '班组长' ? '★ ' : ''}{op.name}
                  </b>
                  <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 6 }}>
                    {op.id} · {op.role}
                  </span>
                </Option>
              ))}
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
            <Input placeholder="2026-04-25 08:00" />
          </Form.Item>
          <Form.Item name="planEnd" label="计划结束">
            <Input placeholder="2026-04-25 20:00" />
          </Form.Item>
        </div>

        {/* ④ 工位/设备绑定 */}
        <div style={{ fontSize: 12, color: '#344054', fontWeight: 600, marginBottom: 10 }}>
          ④ PAD工位 & 设备绑定（选填）
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="padStation" label="PAD工位">
            <Select placeholder="选择工位PAD（可选）" allowClear>
              {recommendedPads.map(p => (
                <Option key={p.id} value={p.id}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 6 }}>
                    {p.location}
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="equipIds" label="绑定设备（可多选）">
            <Select mode="multiple" placeholder="选择设备" allowClear maxTagCount={2}>
              {EQUIPMENTS.filter(e => e.status !== 'FAULT').map(e => (
                <Option key={e.id} value={e.id}>
                  <span>{e.name}</span>
                  <span style={{
                    fontSize: 10, marginLeft: 4,
                    color: e.status === 'NORMAL' ? '#52c41a' : '#faad14',
                  }}>
                    [{e.status === 'NORMAL' ? '正常' : '维护中'}]
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item name="remark" label="派工说明（选填）">
          <TextArea rows={2} placeholder="如：优先完成精磨工序，注意D1公差控制在±0.005mm以内" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 主页面
// ─────────────────────────────────────────────────────────────────────────────
interface TaskOrderPageProps {
  onNavigateToPad?: () => void;
  onNavigateToTaskPool?: () => void;
}

const TaskOrderPage: React.FC<TaskOrderPageProps> = ({ onNavigateToPad, onNavigateToTaskPool }) => {
  const [tasks,  setTasks]  = useLocalStorage<TaskOrder[]>(STORE_KEYS.TASK_ORDERS, mockTaskOrders);
  // 工单列表从共享存储实时加载（包括 ProductionOrderPage / WorkOrderListPage 新增的）
  const [wos, setWos]       = useLocalStorage<WorkOrder[]>(STORE_KEYS.WORK_ORDERS, mockWorkOrders);

  const [apiLoading, setApiLoading] = useState(false);
  const loadFromApi = useCallback(async () => {
    if (isUserCleared()) return;   // 用户已主动清空，不从 API 重新拉取数据
    setApiLoading(true);
    try {
      const [toResp, woResp] = await Promise.all([
        getTaskOrderList() as any,
        getWorkOrderList() as any,
      ]);
      const apiTasks: any[] = toResp.data ?? [];
      const apiWos: any[]   = woResp.data ?? [];
      const taskStatusMap: Record<string, TaskStatus> = {
        PENDING: 'PENDING', IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'DONE', DONE: 'DONE',
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
      if (apiWos.length > 0) {
        const woStatusMap: Record<string, string> = {
          DRAFT: 'CREATED', RELEASED: 'RELEASED', IN_PROGRESS: 'IN_PROGRESS',
          COMPLETED: 'COMPLETED', CLOSED: 'CLOSED',
        };
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
          status: (woStatusMap[item.status] ?? 'CREATED') as any,
          priority: 'NORMAL' as const,
          planStart: item.startDate ?? '',
          planEnd: item.endDate ?? '',
          createdAt: item.createTime ? item.createTime.slice(0, 10) : '',
          createdBy: item.createBy ?? 'admin',
          remark: item.remark ?? '',
        }));
        setWos(mappedWos);
      }
    } catch { /* graceful fallback to mock/localStorage data */ }
    finally { setApiLoading(false); }
  }, [setTasks, setWos]);
  useEffect(() => { loadFromApi(); }, [loadFromApi]);
  const [searchText, setSearchText]   = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterShift,  setFilterShift]  = useState<string>('ALL');

  const [detailOpen,   setDetailOpen]   = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskOrder | null>(null);
  const [createOpen,   setCreateOpen]   = useState(false);

  // 报工/完工弹窗
  const [reportOpen,   setReportOpen]   = useState(false);
  const [reportMode,   setReportMode]   = useState<'report' | 'done'>('done');
  const [reportTarget, setReportTarget] = useState<TaskOrder | null>(null);

  const getWO = (task: TaskOrder) =>
    wos.find(w => w.id === task.woId);

  // ── 状态流转处理 ──────────────────────────────────────────────────

  // 工单状态同步辅助
  const syncWoStatus = (woId: string) => {
    syncWoProgressFromTasks(woId);
    const latest = loadWorkOrders();
    setWos(latest);
    const wo = latest.find(w => w.id === woId);
    if (wo?.poId) syncPoProgressFromWos(wo.poId);
  };

  /** 待派工/已派工/暂停 → 执行中 */
  const handleStart = async (task: TaskOrder) => {
    const label = task.status === 'PAUSED' ? '已恢复执行' : '已开始执行';
    const numId = Number(task.id);
    const woNumId = Number(task.woId);
    setApiLoading(true);
    try {
      if (!isNaN(numId) && numId > 0) {
        await apiUpdateTaskOrder(numId, { status: 'IN_PROGRESS' });
      }
      if (!isNaN(woNumId) && woNumId > 0) {
        await apiUpdateWorkOrder(woNumId, { status: 'IN_PROGRESS' });
      }
      await loadFromApi();
      message.success(`任务单 ${task.taskNo} ${label}`);
    } catch {
      setTasks(prev => prev.map(t =>
        t.id === task.id
          ? { ...t, status: 'IN_PROGRESS', actualStart: t.actualStart || nowStr() }
          : t
      ));
      setWos(prev => prev.map(w =>
        w.id === task.woId && (w.status === 'RELEASED' || w.status === 'CREATED')
          ? { ...w, status: 'IN_PROGRESS' as WorkOrder['status'], actualStart: w.actualStart || nowStr() }
          : w
      ));
      message.success(`任务单 ${task.taskNo} ${label}`);
    } finally {
      setApiLoading(false);
    }
  };

  /** 执行中 → 暂停 */
  const handlePause = async (task: TaskOrder) => {
    const numId = Number(task.id);
    setApiLoading(true);
    try {
      if (!isNaN(numId) && numId > 0) {
        await apiUpdateTaskOrder(numId, { status: 'IN_PROGRESS' /* 后端暂时保持 IN_PROGRESS，前端显示 PAUSED */ });
      }
      await loadFromApi();
      // loadFromApi 不保存 PAUSED 匹配，手动覆盖一次
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'PAUSED' } : t));
      message.warning(`任务单 ${task.taskNo} 已暂停`);
    } catch {
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'PAUSED' } : t
      ));
      message.warning(`任务单 ${task.taskNo} 已暂停`);
    } finally {
      setApiLoading(false);
    }
  };

  /** 打开完工弹窗 */
  const handleDone = (task: TaskOrder) => {
    setReportTarget(task);
    setReportMode('done');
    setReportOpen(true);
  };

  /** 打开中途报工弹窗 */
  const handleReport = (task: TaskOrder) => {
    setReportTarget(task);
    setReportMode('report');
    setReportOpen(true);
  };

  /** 报工弹窗确认 */
  const handleReportConfirm = async (
    reportQty: number,
    scrapQty: number,
    deviation: boolean,
    remark: string,
  ) => {
    if (!reportTarget) return;
    const woId = reportTarget.woId;
    const numId = Number(reportTarget.id);
    setApiLoading(true);
    try {
      if (reportMode === 'done') {
        if (!isNaN(numId) && numId > 0) {
          await apiUpdateTaskOrder(numId, {
            status: 'COMPLETED',
            completedQuantity: reportQty,
            qualifiedQuantity: reportQty - scrapQty,
            unqualifiedQuantity: scrapQty,
          });
        }
        await loadFromApi();
        // 覆盖此任务单本地状态（loadFromApi 可能不保存 DONE）
        setTasks(prev => prev.map(t =>
          t.id === reportTarget.id
            ? { ...t, status: 'DONE' as TaskOrder['status'], reportQty, scrapQty,
                deviationFlag: deviation, actualEnd: nowStr(), remark: remark || t.remark }
            : t
        ));
        setTimeout(() => syncWoStatus(woId), 30);
        message.success(
          `任务单 ${reportTarget.taskNo} 已完工 — 报工 ${reportQty.toLocaleString()} 支` +
          (scrapQty > 0 ? `，废品 ${scrapQty} 支` : '') +
          (deviation ? '，⚠️存在偏差' : '')
        );
      } else {
        if (!isNaN(numId) && numId > 0) {
          await apiUpdateTaskOrder(numId, {
            completedQuantity: reportQty,
            qualifiedQuantity: reportQty - scrapQty,
            unqualifiedQuantity: scrapQty,
          });
        }
        await loadFromApi();
        setTasks(prev => prev.map(t =>
          t.id === reportTarget.id
            ? { ...t, reportQty, scrapQty, deviationFlag: deviation }
            : t
        ));
        setTimeout(() => syncWoStatus(woId), 30);
        message.success(`任务单 ${reportTarget.taskNo} 报工成功：${reportQty.toLocaleString()} 支`);
      }
    } catch {
      // fallback optimistic update
      if (reportMode === 'done') {
        setTasks(prev => {
          const next = prev.map(t =>
            t.id === reportTarget.id
              ? { ...t, status: 'DONE' as TaskOrder['status'], reportQty, scrapQty,
                  deviationFlag: deviation, actualEnd: nowStr(), remark: remark || t.remark }
              : t
          );
          setTimeout(() => syncWoStatus(woId), 30);
          return next;
        });
        message.success(`任务单 ${reportTarget.taskNo} 已完工`);
      } else {
        setTasks(prev => {
          const next = prev.map(t =>
            t.id === reportTarget.id
              ? { ...t, reportQty, scrapQty, deviationFlag: deviation }
              : t
          );
          setTimeout(() => syncWoStatus(woId), 30);
          return next;
        });
        message.success(`任务单 ${reportTarget.taskNo} 报工成功：${reportQty.toLocaleString()} 支`);
      }
    } finally {
      setApiLoading(false);
    }
    setReportTarget(null);
  };

  /** 新建任务单 */
  const handleCreated = async (task: TaskOrder) => {
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
      await loadFromApi();
    } catch {
      setTasks(prev => [task, ...prev]);
    } finally {
      setApiLoading(false);
    }
  };

  // ── 过滤逻辑 ────────────────────────────────────────────────────
  const filtered = tasks.filter(t => {
    const ms = filterStatus === 'ALL' || t.status === filterStatus;
    const msh = filterShift  === 'ALL' || t.shiftId === filterShift;
    const mt = !searchText
      || t.taskNo.includes(searchText)
      || t.woNo.includes(searchText)
      || t.batchNo.includes(searchText)
      || t.team.includes(searchText)
      || t.operator.includes(searchText)
      || t.workCenter.includes(searchText);
    return ms && msh && mt;
  });

  // ── KPI 统计 ────────────────────────────────────────────────────
  const summary = {
    pending:    tasks.filter(t => t.status === 'PENDING').length,
    assigned:   tasks.filter(t => t.status === 'ASSIGNED').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    paused:     tasks.filter(t => t.status === 'PAUSED').length,
    done:       tasks.filter(t => t.status === 'DONE').length,
    total:      tasks.length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>

      {/* ===== 派工模式切换横幅 ===== */}
      <div style={{
        background: 'linear-gradient(135deg,#f0f7ff 0%,#fff7e6 100%)',
        borderBottom: '2px solid #e8ecf0',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {/* 当前：推式派工（主动分配）高亮 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 18px', borderRadius: 8,
          background: '#1677ff', color: '#fff',
          boxShadow: '0 2px 8px rgba(22,119,255,0.30)',
          fontWeight: 600, fontSize: 13,
        }}>
          <SendOutlined style={{ fontSize: 16 }} />
          <div>
            <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 400 }}>当前模式</div>
            <div>推式派工（管理员分配）</div>
          </div>
        </div>

        <div style={{ color: '#98a2b3', fontSize: 18, userSelect: 'none' }}>⇄</div>

        {/* 拉式任务池入口 */}
        <Tooltip
          title={
            <div style={{ maxWidth: 240 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>拉式派工 — PAD任务池</div>
              <div style={{ fontSize: 12 }}>操作工在PAD端主动领取符合自身技能的任务；系统按技能矩阵自动过滤可领取条目，并通过锁定机制防止重复领取。</div>
            </div>
          }
          placement="bottom"
        >
          <div
            onClick={onNavigateToTaskPool}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 18px', borderRadius: 8,
              background: onNavigateToTaskPool ? '#fff' : '#f5f5f5',
              border: '2px dashed #1677ff',
              color: '#1677ff', fontWeight: 600, fontSize: 13,
              cursor: onNavigateToTaskPool ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 16 }} />
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 400 }}>切换到</div>
              <div>拉式派工（PAD任务池）</div>
            </div>
          </div>
        </Tooltip>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 20, fontSize: 12, color: '#667085' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 12px', background: '#fff', borderRadius: 6, border: '1px solid #e8ecf0' }}>
            <span style={{ color: '#98a2b3', fontSize: 11 }}>推式派工</span>
            <span>管理员统一排班 → 班次/班组/操作工/设备逐一分配</span>
            <span style={{ color: '#52c41a', fontSize: 11 }}>✓ 适合：标准批量生产、计划性强的场景</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 12px', background: '#fff', borderRadius: 6, border: '1px solid #e8ecf0' }}>
            <span style={{ color: '#98a2b3', fontSize: 11 }}>拉式派工</span>
            <span>操作工扫码登录 → 按技能自选任务 → 锁定领取</span>
            <span style={{ color: '#fa8c16', fontSize: 11 }}>✓ 适合：灵活用工、技能差异化大的场景</span>
          </div>
        </div>
      </div>

      {/* 页头 */}
      <div style={{
        background: '#fff', padding: '12px 16px',
        borderBottom: '1px solid #e8ecf0', flexShrink: 0,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1d2939' }}>
          <UnorderedListOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          生产任务单管理（L3 派工单）
        </span>
        <span style={{ fontSize: 12, color: '#98a2b3', marginLeft: 12 }}>
          管理各班次/班组的派工任务，记录报工与完工信息
        </span>
      </div>

      {/* 班次快速筛选条 */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 16px',
        background: '#fff', borderBottom: '1px solid #e8ecf0',
        flexShrink: 0, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: '#667085', marginRight: 4 }}>班次：</span>
        <div
          onClick={() => setFilterShift('ALL')}
          style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
            background: filterShift === 'ALL' ? '#1677ff' : '#f5f7fa',
            color: filterShift === 'ALL' ? '#fff' : '#667085',
            border: filterShift === 'ALL' ? '1px solid #1677ff' : '1px solid #e4e7ec',
            fontWeight: filterShift === 'ALL' ? 600 : 400,
          }}
        >
          全部班次
        </div>
        {SHIFTS.map(s => (
          <div
            key={s.id}
            onClick={() => setFilterShift(filterShift === s.id ? 'ALL' : s.id)}
            style={{
              padding: '4px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
              background: filterShift === s.id ? s.color : `${s.color}10`,
              color: filterShift === s.id ? '#fff' : s.color,
              border: `1px solid ${s.color}${filterShift === s.id ? '' : '50'}`,
              fontWeight: 600,
            }}
          >
            ⏰ {s.name}
            <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.8 }}>
              {tasks.filter(t => t.shiftId === s.id).length}
            </span>
          </div>
        ))}
      </div>

      {/* KPI 统计行 */}
      <div className="wo-kpi-row">
        {[
          { label: '待派工', val: summary.pending,    color: '#8c8c8c', status: 'PENDING'     },
          { label: '已派工', val: summary.assigned,   color: '#1890ff', status: 'ASSIGNED'    },
          { label: '执行中', val: summary.inProgress, color: '#52c41a', status: 'IN_PROGRESS' },
          { label: '已暂停', val: summary.paused,     color: '#faad14', status: 'PAUSED'      },
          { label: '已完成', val: summary.done,       color: '#13c2c2', status: 'DONE'        },
          { label: '合计',   val: summary.total,      color: '#1d2939', status: 'ALL'         },
        ].map(k => (
          <div
            key={k.label}
            className="wo-kpi"
            style={{
              cursor: 'pointer',
              background: filterStatus === k.status ? '#e6f4ff' : undefined,
              borderColor: filterStatus === k.status ? '#1677ff' : undefined,
            }}
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
            placeholder="搜索任务单号 / 工单号 / 批号 / 班组 / 操作工..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 320 }}
            allowClear
          />
          <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 130 }}>
            <Option value="ALL">全部状态</Option>
            {Object.entries(TASK_STATUS).map(([k, v]) => (
              <Option key={k} value={k}>
                <span style={{ color: v.color }}>●</span> {v.label}
              </Option>
            ))}
          </Select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<ReloadOutlined />} loading={apiLoading} onClick={() => loadFromApi()}>刷新</Button>
          <Button
            onClick={() => {
              setSearchText('');
              setFilterStatus('ALL');
              setFilterShift('ALL');
            }}
          >
            重置
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新建派工单
          </Button>
        </div>
      </div>

      {/* 任务单列表 */}
      <Spin spinning={apiLoading}>
      <div className="wo-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#98a2b3', padding: '48px 0', fontSize: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            暂无任务单，可在「生产工单」页生成任务单，或点击「新建派工单」
          </div>
        ) : (
          filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              wo={getWO(task)}
              onClick={() => { setSelectedTask(task); setDetailOpen(true); }}
              onStart={() => handleStart(task)}
              onDone={() => handleDone(task)}
              onPause={() => handlePause(task)}
              onReport={() => handleReport(task)}
              onGoToPad={onNavigateToPad}
            />
          ))
        )}
      </div>
      </Spin>

      {/* 详情抽屉 */}
      <TaskDetailDrawer
        task={selectedTask}
        wo={selectedTask ? getWO(selectedTask) : undefined}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* 新建派工单弹窗 */}
      <CreateTaskModal
        open={createOpen}
        wos={wos}
        existingTasks={tasks}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      {/* 报工/完工弹窗 */}
      <ReportModal
        open={reportOpen}
        task={reportTarget}
        mode={reportMode}
        onClose={() => { setReportOpen(false); setReportTarget(null); }}
        onConfirm={handleReportConfirm}
      />
    </div>
  );
};

export default TaskOrderPage;
