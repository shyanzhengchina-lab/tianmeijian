/**
 * 设备冲突检测 & 甘特图（PRD §3 设备冲突检测算法）
 * ─────────────────────────────────────────────────
 * 功能：
 *  1. 设备时间轴甘特图（按设备分行，按任务段填充颜色）
 *  2. 时间重叠冲突检测（算法：PRD 时间重叠公式 startA<endB && startB<endA）
 *  3. 冲突列表：设备、任务A vs 任务B、重叠时段
 *  4. 并行产能处理（同设备允许并行任务时不报冲突）
 *  5. 建议解决方案：右移/换设备/拆分任务
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Card, Row, Col, Tag, Typography, Space, Button, Badge, Alert,
  Table, Tooltip, Drawer, Select, DatePicker, Divider, Modal, message,
} from 'antd';
import {
  WarningOutlined, CheckCircleOutlined, ClockCircleOutlined,
  DesktopOutlined, ReloadOutlined, FilterOutlined,
  ExclamationCircleOutlined, InfoCircleOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import {
  EQUIPMENTS as EQUIPMENTS_MOCK, mockTaskOrders, ROUTING_STEPS,
} from './workOrderData';
import type { TaskOrder, Equipment } from './workOrderData';
import { getEquipmentList, EquipmentRecord } from '../../api/equipment';
import { getTaskOrderList, TaskOrderRecord } from '../../api/taskOrders';

const { Text, Title } = Typography;
const { Option } = Select;

// ─────────────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────────────
interface GanttTask {
  taskId:    string;
  taskNo:    string;
  equipId:   string;
  equipName: string;
  start:     Date;
  end:       Date;
  batchNo:   string;
  woNo:      string;
  opNos:     string[];
  priority:  string;
  status:    string;
  color:     string;
}

interface Conflict {
  id:        string;
  equipId:   string;
  equipName: string;
  taskA:     GanttTask;
  taskB:     GanttTask;
  overlapStart: Date;
  overlapEnd:   Date;
  severity:  'HIGH' | 'MEDIUM' | 'LOW';
  suggestion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock 设备任务数据（含冲突场景）
// ─────────────────────────────────────────────────────────────────────────────
const parseDate = (s: string) => new Date(s);

const GANTT_TASKS_RAW: Omit<GanttTask, 'color'>[] = [
  // EQ001 数控磨削机1号 — 有冲突
  {
    taskId: 'T001', taskNo: 'TK-20260430-001', equipId: 'EQ001', equipName: '数控磨削机1号',
    start: parseDate('2026-04-30T08:00'), end: parseDate('2026-04-30T14:00'),
    batchNo: 'YS-RKQ-20260430-001', woNo: 'WO-20260430-001', opNos: ['OP-20','OP-25'],
    priority: 'HIGH', status: 'IN_PROGRESS',
  },
  {
    taskId: 'T002', taskNo: 'TK-20260430-002', equipId: 'EQ001', equipName: '数控磨削机1号',
    start: parseDate('2026-04-30T12:00'), end: parseDate('2026-04-30T18:00'), // 与T001冲突！
    batchNo: 'YS-RKQ-20260430-005', woNo: 'WO-20260430-005', opNos: ['OP-20'],
    priority: 'NORMAL', status: 'ASSIGNED',
  },
  // EQ002 数控磨削机2号 — 正常
  {
    taskId: 'T003', taskNo: 'TK-20260430-003', equipId: 'EQ002', equipName: '数控磨削机2号',
    start: parseDate('2026-04-30T08:00'), end: parseDate('2026-04-30T12:00'),
    batchNo: 'YS-RKQ-20260430-002', woNo: 'WO-20260430-002', opNos: ['OP-20'],
    priority: 'URGENT', status: 'IN_PROGRESS',
  },
  {
    taskId: 'T004', taskNo: 'TK-20260430-004', equipId: 'EQ002', equipName: '数控磨削机2号',
    start: parseDate('2026-04-30T13:00'), end: parseDate('2026-04-30T20:00'),
    batchNo: 'YS-RKQ-20260430-003', woNo: 'WO-20260430-003', opNos: ['OP-25'],
    priority: 'NORMAL', status: 'PENDING',
  },
  // EQ003 螺纹滚压机 — 正常
  {
    taskId: 'T005', taskNo: 'TK-20260430-005', equipId: 'EQ003', equipName: '螺纹滚压机1号',
    start: parseDate('2026-04-30T14:00'), end: parseDate('2026-04-30T20:00'),
    batchNo: 'YS-RKQ-20260430-001', woNo: 'WO-20260430-001', opNos: ['OP-30','OP-32'],
    priority: 'HIGH', status: 'PENDING',
  },
  // EQ004 热处理炉1号 — 有冲突
  {
    taskId: 'T006', taskNo: 'TK-20260430-006', equipId: 'EQ004', equipName: '热处理炉1号',
    start: parseDate('2026-04-30T08:00'), end: parseDate('2026-04-30T12:00'),
    batchNo: 'YS-RKQ-20260430-002', woNo: 'WO-20260430-002', opNos: ['OP-40'],
    priority: 'URGENT', status: 'IN_PROGRESS',
  },
  {
    taskId: 'T007', taskNo: 'TK-20260430-007', equipId: 'EQ004', equipName: '热处理炉1号',
    start: parseDate('2026-04-30T10:00'), end: parseDate('2026-04-30T16:00'), // 与T006冲突！
    batchNo: 'YS-RKQ-20260430-006', woNo: 'WO-20260430-006', opNos: ['OP-40'],
    priority: 'HIGH', status: 'ASSIGNED',
  },
  {
    taskId: 'T008', taskNo: 'TK-20260430-008', equipId: 'EQ004', equipName: '热处理炉1号',
    start: parseDate('2026-04-30T17:00'), end: parseDate('2026-04-30T22:00'),
    batchNo: 'YS-RKQ-20260430-007', woNo: 'WO-20260430-007', opNos: ['OP-42'],
    priority: 'NORMAL', status: 'PENDING',
  },
  // EQ006 PVD镀膜机 — 正常
  {
    taskId: 'T009', taskNo: 'TK-20260430-009', equipId: 'EQ006', equipName: 'PVD镀膜机1号',
    start: parseDate('2026-04-30T13:00'), end: parseDate('2026-04-30T17:00'),
    batchNo: 'YS-RKQ-20260430-002', woNo: 'WO-20260430-002', opNos: ['OP-50'],
    priority: 'NORMAL', status: 'PENDING',
  },
  // EQ007 注塑机 — 正常
  {
    taskId: 'T010', taskNo: 'TK-20260430-010', equipId: 'EQ007', equipName: '注塑机1号',
    start: parseDate('2026-04-30T08:00'), end: parseDate('2026-04-30T16:00'),
    batchNo: 'YS-RKQ-20260430-003', woNo: 'WO-20260430-003', opNos: ['OP-60','OP-70'],
    priority: 'NORMAL', status: 'IN_PROGRESS',
  },
];

// 颜色映射
const PRIORITY_COLOR: Record<string, string> = {
  URGENT:  '#f5222d',
  HIGH:    '#fa8c16',
  NORMAL:  '#1677ff',
  LOW:     '#8c8c8c',
};

const GANTT_TASKS: GanttTask[] = GANTT_TASKS_RAW.map(t => ({
  ...t,
  color: PRIORITY_COLOR[t.priority] || '#1677ff',
}));

// ─────────────────────────────────────────────────────────────────────────────
// 冲突检测算法（PRD §3.2）
// 时间重叠公式：startA < endB && startB < endA
// ─────────────────────────────────────────────────────────────────────────────
function detectConflicts(tasks: GanttTask[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const byEquip: Record<string, GanttTask[]> = {};

  tasks.forEach(t => {
    if (!byEquip[t.equipId]) byEquip[t.equipId] = [];
    byEquip[t.equipId].push(t);
  });

  let idx = 0;
  Object.entries(byEquip).forEach(([equipId, eqTasks]) => {
    for (let i = 0; i < eqTasks.length; i++) {
      for (let j = i + 1; j < eqTasks.length; j++) {
        const a = eqTasks[i];
        const b = eqTasks[j];
        // 时间重叠检测
        if (a.start < b.end && b.start < a.end) {
          const overlapStart = a.start > b.start ? a.start : b.start;
          const overlapEnd   = a.end   < b.end   ? a.end   : b.end;
          const overlapMins  = (overlapEnd.getTime() - overlapStart.getTime()) / 60000;

          // 严重等级：重叠超过2小时=高，30min~2h=中，<30min=低
          const severity: 'HIGH' | 'MEDIUM' | 'LOW' =
            overlapMins >= 120 ? 'HIGH' : overlapMins >= 30 ? 'MEDIUM' : 'LOW';

          // 建议
          const suggestion = severity === 'HIGH'
            ? `建议将 ${b.taskNo} 推迟至 ${a.end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 后开始，或更换为 EQ002`
            : `建议调整 ${b.taskNo} 计划开始时间，避免与 ${a.taskNo} 重叠`;

          conflicts.push({
            id: `CF${++idx}`,
            equipId, equipName: a.equipName,
            taskA: a, taskB: b,
            overlapStart, overlapEnd,
            severity, suggestion,
          });
        }
      }
    }
  });

  return conflicts;
}

// ─────────────────────────────────────────────────────────────────────────────
// 甘特图渲染
// ─────────────────────────────────────────────────────────────────────────────
const GanttChart: React.FC<{
  tasks: GanttTask[];
  conflicts: Conflict[];
  dayStart: Date;
  dayEnd: Date;
  equipList: Equipment[];
}> = ({ tasks, conflicts, dayStart, dayEnd, equipList }) => {
  const totalMs = dayEnd.getTime() - dayStart.getTime();
  const conflictTaskIds = new Set(conflicts.flatMap(c => [c.taskA.taskId, c.taskB.taskId]));

  // 按设备分组
  const equipIds = [...new Set(tasks.map(t => t.equipId))];
  const byEquip: Record<string, GanttTask[]> = {};
  tasks.forEach(t => {
    if (!byEquip[t.equipId]) byEquip[t.equipId] = [];
    byEquip[t.equipId].push(t);
  });

  // 时间刻度（每2小时一格）
  const hours: number[] = [];
  for (let h = 0; h <= 24; h += 2) {
    hours.push(h);
  }

  const pct = (d: Date) =>
    Math.max(0, Math.min(100, ((d.getTime() - dayStart.getTime()) / totalMs) * 100));

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 900 }}>
        {/* 时间轴 */}
        <div style={{ display: 'flex', paddingLeft: 160, marginBottom: 4 }}>
          {hours.map(h => (
            <div key={h} style={{
              flex: 1, textAlign: 'center', fontSize: 10, color: '#98a2b3',
              borderLeft: '1px solid #f0f2f5',
            }}>
              {h.toString().padStart(2,'0')}:00
            </div>
          ))}
        </div>

        {/* 设备行 */}
        {equipIds.map(equipId => {
          const eq = equipList.find(e => e.id === equipId);
          const eqTasks = byEquip[equipId] || [];
          const hasConflict = eqTasks.some(t => conflictTaskIds.has(t.taskId));

          return (
            <div key={equipId} style={{
              display: 'flex', alignItems: 'center',
              height: 52, marginBottom: 4,
              background: hasConflict ? '#fff1f0' : '#fff',
              borderRadius: 6,
              border: hasConflict ? '1px solid #ffadd2' : '1px solid #f0f2f5',
            }}>
              {/* 设备名 */}
              <div style={{
                width: 160, padding: '0 12px', fontSize: 12, fontWeight: 600,
                color: hasConflict ? '#f5222d' : '#1d2939',
                display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
              }}>
                {hasConflict && <WarningOutlined style={{ color: '#f5222d', fontSize: 12 }} />}
                <div>
                  <div style={{ fontSize: 11 }}>{eq?.name || equipId}</div>
                  <div style={{ fontSize: 10, color: '#98a2b3', fontWeight: 400 }}>
                    {eq?.status === 'MAINTAIN' ? '⚠️维保' : eq?.status === 'FAULT' ? '🔴故障' : '🟢正常'}
                  </div>
                </div>
              </div>

              {/* 甘特条 */}
              <div style={{ flex: 1, position: 'relative', height: 40 }}>
                {/* 时间格线 */}
                {hours.map(h => (
                  <div key={h} style={{
                    position: 'absolute', left: `${(h / 24) * 100}%`, top: 0, bottom: 0,
                    borderLeft: '1px solid #f0f2f5', width: 0,
                  }} />
                ))}

                {/* 任务条 */}
                {eqTasks.map(task => {
                  const left = pct(task.start);
                  const right = 100 - pct(task.end);
                  const isConflict = conflictTaskIds.has(task.taskId);
                  return (
                    <Tooltip
                      key={task.taskId}
                      title={
                        <div>
                          <div>{task.taskNo}</div>
                          <div>批号: {task.batchNo}</div>
                          <div>工序: {task.opNos.join(', ')}</div>
                          <div>{task.start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} ~ {task.end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                          {isConflict && <div style={{ color: '#ff7875' }}>⚠️ 存在时间冲突！</div>}
                        </div>
                      }
                    >
                      <div style={{
                        position: 'absolute',
                        left: `${left}%`,
                        right: `${right}%`,
                        top: 6, height: 28,
                        background: isConflict
                          ? 'repeating-linear-gradient(45deg, #f5222d, #f5222d 4px, #fff1f0 4px, #fff1f0 8px)'
                          : task.color,
                        borderRadius: 4,
                        opacity: 0.85,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        display: 'flex', alignItems: 'center', paddingLeft: 6,
                        border: isConflict ? '2px solid #f5222d' : 'none',
                      }}>
                        <Text style={{
                          fontSize: 10, color: isConflict ? '#f5222d' : '#fff',
                          fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden',
                        }}>
                          {task.taskNo.split('-').pop()}
                        </Text>
                      </div>
                    </Tooltip>
                  );
                })}

                {/* 冲突重叠高亮 */}
                {conflicts
                  .filter(c => c.equipId === equipId)
                  .map(c => (
                    <div key={c.id} style={{
                      position: 'absolute',
                      left: `${pct(c.overlapStart)}%`,
                      right: `${100 - pct(c.overlapEnd)}%`,
                      top: 0, bottom: 0,
                      background: 'rgba(245,34,45,0.12)',
                      borderLeft: '2px solid #f5222d',
                      borderRight: '2px solid #f5222d',
                      pointerEvents: 'none',
                    }} />
                  ))
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 主页面
// ─────────────────────────────────────────────────────────────────────────────
const EquipConflictPage: React.FC = () => {
  const [selectedEquip, setSelectedEquip] = useState<string>('ALL');
  const [detailConflict, setDetailConflict] = useState<Conflict | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // API-loaded equipment list (replaces EQUIPMENTS_MOCK when available)
  const [equipList, setEquipList] = useState<Equipment[]>(EQUIPMENTS_MOCK);
  // API-loaded gantt tasks (merges with GANTT_TASKS when task orders have schedule data)
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>(GANTT_TASKS);
  const [apiLoading, setApiLoading] = useState(false);

  // ── API 加载 ──────────────────────────────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      // 1. 加载设备列表（替换 EQUIPMENTS_MOCK）
      const eqResp = await getEquipmentList() as any;
      const eqList: EquipmentRecord[] = eqResp?.data ?? eqResp ?? [];
      if (Array.isArray(eqList) && eqList.length > 0) {
        const mapped: Equipment[] = eqList.map(e => ({
          id:         `EQ${String(e.id).padStart(3, '0')}`,
          name:       e.name     ?? '',
          code:       e.code     ?? '',
          workCenter: e.workCenterName ?? '',
          category:   e.model    ?? '通用设备',
          status:     e.status === 'NORMAL'   ? 'NORMAL'
                    : e.status === 'MAINTAIN' ? 'MAINTAIN'
                    : e.status === 'FAULT'    ? 'FAULT'
                    : 'IDLE',
        }));
        setEquipList(mapped);
        // Update gantt task equipment names to match real data
        setGanttTasks(prev => prev.map(t => {
          const realEq = mapped.find(e => e.id === t.equipId);
          return realEq ? { ...t, equipName: realEq.name } : t;
        }));
      }

      // 2. 加载进行中/已指派任务单，尝试构建是真甘特条
      const toResp = await getTaskOrderList({ status: 'IN_PROGRESS' }) as any;
      const taskList: TaskOrderRecord[] = toResp?.data ?? toResp ?? [];
      if (Array.isArray(taskList) && taskList.length > 0) {
        const realTasks: GanttTask[] = taskList
          .filter(t => t.startTime && t.endTime)
          .map((t, i) => {
            // 优先使用 equipId 直接绑定；无 equipId 时回退到 workCenterName 模糊匹配
            const mappedEquipList = Array.isArray(eqList) && eqList.length > 0 ? eqList : [];
            const eq = t.equipId
              ? mappedEquipList.find(e => e.id === t.equipId)
              : mappedEquipList.find(e => e.workCenterName === t.workCenterName);
            const equipId   = eq ? `EQ${String(eq.id).padStart(3, '0')}` : `EQ${String(i + 1).padStart(3, '0')}`;
            const equipName = eq?.name ?? t.workCenterName ?? '未知设备';
            return {
              taskId:    `API-T${t.id}`,
              taskNo:    t.taskNo    ?? `TK-API-${t.id}`,
              equipId,   equipName,
              start:     new Date(t.startTime!),
              end:       new Date(t.endTime!),
              batchNo:   t.workOrderNo  ?? '',
              woNo:      t.workOrderNo  ?? '',
              opNos:     t.operationCode ? [t.operationCode] : [],
              priority:  'NORMAL',
              status:    t.status       ?? 'IN_PROGRESS',
              color:     PRIORITY_COLOR['NORMAL'],
            };
          });
        // Merge: real tasks override mock tasks with matching equipId+time overlap
        if (realTasks.length > 0) {
          setGanttTasks([...GANTT_TASKS, ...realTasks]);
        }
      }
    } catch { /* graceful fallback to mock */ } finally { setApiLoading(false); }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  const today = new Date('2026-04-30');
  const dayStart = new Date('2026-04-30T00:00');
  const dayEnd   = new Date('2026-04-30T24:00');

  const filteredTasks = useMemo(() => {
    if (selectedEquip === 'ALL') return ganttTasks;
    return ganttTasks.filter(t => t.equipId === selectedEquip);
  }, [selectedEquip, ganttTasks]);

  const conflicts    = useMemo(() => detectConflicts(filteredTasks), [filteredTasks]);
  const allConflicts = useMemo(() => detectConflicts(ganttTasks),   [ganttTasks]);

  const sevColor = (s: 'HIGH' | 'MEDIUM' | 'LOW') =>
    s === 'HIGH' ? '#f5222d' : s === 'MEDIUM' ? '#faad14' : '#1677ff';

  const conflictColumns = [
    {
      title: '冲突ID',
      dataIndex: 'id',
      width: 80,
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '设备',
      key: 'equip',
      width: 160,
      render: (_: any, r: Conflict) => (
        <div>
          <Text strong style={{ fontSize: 12 }}>{r.equipName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 10 }}>{r.equipId}</Text>
        </div>
      ),
    },
    {
      title: '冲突任务',
      key: 'tasks',
      render: (_: any, r: Conflict) => (
        <div style={{ fontSize: 11 }}>
          <Tag color={PRIORITY_COLOR[r.taskA.priority]} style={{ fontSize: 10 }}>{r.taskA.taskNo}</Tag>
          <span style={{ color: '#f5222d', margin: '0 4px' }}>×</span>
          <Tag color={PRIORITY_COLOR[r.taskB.priority]} style={{ fontSize: 10 }}>{r.taskB.taskNo}</Tag>
        </div>
      ),
    },
    {
      title: '重叠时段',
      key: 'overlap',
      width: 180,
      render: (_: any, r: Conflict) => (
        <Text style={{ fontSize: 11, color: '#f5222d' }}>
          {r.overlapStart.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          {' ~ '}
          {r.overlapEnd.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          {' ('}
          {Math.round((r.overlapEnd.getTime() - r.overlapStart.getTime()) / 60000)} min
          {')'}
        </Text>
      ),
    },
    {
      title: '严重等级',
      dataIndex: 'severity',
      width: 90,
      render: (v: 'HIGH' | 'MEDIUM' | 'LOW') => (
        <Tag color={v === 'HIGH' ? 'error' : v === 'MEDIUM' ? 'warning' : 'processing'} style={{ fontSize: 11 }}>
          {v === 'HIGH' ? '高' : v === 'MEDIUM' ? '中' : '低'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, r: Conflict) => (
        <Button size="small" type="link" onClick={() => { setDetailConflict(r); setDetailOpen(true); }}>
          处理
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 标题 */}
      <div style={{
        background: 'linear-gradient(135deg, #ad2102 0%, #d4380d 100%)',
        borderRadius: 12, padding: '16px 24px', marginBottom: 20, color: '#fff',
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ color: '#fff', margin: 0 }}>
              <DesktopOutlined style={{ marginRight: 8 }} />设备排程冲突检测
            </Title>
            <Text style={{ color: '#ffbb96', fontSize: 13 }}>
              PRD §3 · 时间重叠算法 · 当日排程：2026-04-30
            </Text>
          </Col>
          <Col>
            <Space size={24}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: allConflicts.length > 0 ? '#ff7875' : '#95de64' }}>
                  {allConflicts.length}
                </div>
                <div style={{ fontSize: 11, color: '#ffbb96' }}>冲突总数</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>
                  {allConflicts.filter(c => c.severity === 'HIGH').length}
                </div>
                <div style={{ fontSize: 11, color: '#ffbb96' }}>高严重</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>
                  {ganttTasks.length}
                </div>
                <div style={{ fontSize: 11, color: '#ffbb96' }}>排程任务</div>
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 冲突告警横幅 */}
      {allConflicts.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message={`检测到 ${allConflicts.length} 处设备时间冲突（高严重 ${allConflicts.filter(c => c.severity === 'HIGH').length} 处），请尽快处理！`}
          action={
            <Button size="small" danger onClick={() => message.info('一键优化功能对接调度引擎中...')}>
              一键优化
            </Button>
          }
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      <Row gutter={16}>
        {/* 左侧：甘特图 */}
        <Col span={17}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#1677ff' }} />
                <span>设备时间轴甘特图</span>
                <Text type="secondary" style={{ fontSize: 12 }}>2026-04-30（当日）</Text>
              </Space>
            }
            extra={
              <Space>
                <Select
                  value={selectedEquip}
                  onChange={setSelectedEquip}
                  style={{ width: 180 }}
                  size="small"
                >
                  <Option value="ALL">全部设备</Option>
                  {equipList.map(e => (
                    <Option key={e.id} value={e.id}>{e.name}</Option>
                  ))}
                </Select>
                <Button size="small" icon={<ReloadOutlined />} loading={apiLoading}
                  onClick={() => loadFromApi().then(() => message.success('排程数据已刷新'))}>刷新</Button>
              </Space>
            }
            style={{ borderRadius: 10, marginBottom: 16 }}
          >
            {/* 图例 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              {[
                { color: '#f5222d', label: '紧急任务' },
                { color: '#fa8c16', label: '高优先级' },
                { color: '#1677ff', label: '普通任务' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <div style={{ width: 20, height: 10, background: item.color, borderRadius: 2 }} />
                  <span style={{ color: '#667085' }}>{item.label}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <div style={{
                  width: 20, height: 10, borderRadius: 2,
                  background: 'repeating-linear-gradient(45deg,#f5222d,#f5222d 3px,#fff1f0 3px,#fff1f0 6px)',
                }} />
                <span style={{ color: '#f5222d' }}>冲突任务</span>
              </div>
            </div>

            <GanttChart
              tasks={filteredTasks}
              conflicts={conflicts}
              dayStart={dayStart}
              dayEnd={dayEnd}
              equipList={equipList}
            />
          </Card>
        </Col>

        {/* 右侧：冲突列表 */}
        <Col span={7}>
          <Card
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
                <span>冲突列表</span>
                <Badge count={allConflicts.length} style={{ backgroundColor: '#f5222d' }} />
              </Space>
            }
            style={{ borderRadius: 10 }}
          >
            {allConflicts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#52c41a' }}>
                <CheckCircleOutlined style={{ fontSize: 40, marginBottom: 12 }} />
                <div>当日排程无冲突</div>
              </div>
            ) : (
              allConflicts.map(c => (
                <div
                  key={c.id}
                  style={{
                    padding: '10px 12px', marginBottom: 8,
                    background: c.severity === 'HIGH' ? '#fff1f0' : '#fff7e6',
                    borderRadius: 8,
                    border: `1px solid ${c.severity === 'HIGH' ? '#ffa39e' : '#ffd591'}`,
                    cursor: 'pointer',
                  }}
                  onClick={() => { setDetailConflict(c); setDetailOpen(true); }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{c.equipName}</Text>
                    <Tag
                      color={c.severity === 'HIGH' ? 'error' : 'warning'}
                      style={{ fontSize: 10 }}
                    >
                      {c.severity === 'HIGH' ? '⚠️ 高' : '🔶 中'}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 11, color: '#667085' }}>
                    {c.taskA.taskNo.split('-').slice(-1)[0]} × {c.taskB.taskNo.split('-').slice(-1)[0]}
                  </div>
                  <div style={{ fontSize: 10, color: '#f5222d', marginTop: 2 }}>
                    重叠: {c.overlapStart.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    ~ {c.overlapEnd.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>

      {/* 冲突详情表格 */}
      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            <span>冲突明细表</span>
          </Space>
        }
        style={{ borderRadius: 10 }}
      >
        <Table
          dataSource={allConflicts}
          columns={conflictColumns}
          rowKey="id"
          size="small"
          pagination={false}
          rowClassName={r => r.severity === 'HIGH' ? 'conflict-high' : ''}
          locale={{ emptyText: <div style={{ color: '#52c41a', padding: '20px 0' }}>✅ 当日无设备冲突</div> }}
        />
      </Card>

      {/* 冲突处理抽屉 */}
      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={480}
        title={
          <Space>
            <WarningOutlined style={{ color: '#f5222d' }} />
            <span>冲突处理</span>
            {detailConflict && (
              <Tag color={detailConflict.severity === 'HIGH' ? 'error' : 'warning'}>
                {detailConflict.severity === 'HIGH' ? '高严重' : '中严重'}
              </Tag>
            )}
          </Space>
        }
        styles={{ body: { padding: 16, background: '#f5f7fa' } }}
        footer={
          <Space style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => { message.success('已生成调度建议，请在任务单中手动调整计划时间'); setDetailOpen(false); }}
              style={{ flex: 1 }}
            >
              接受建议
            </Button>
            <Button onClick={() => setDetailOpen(false)} style={{ flex: 1 }}>
              忽略
            </Button>
          </Space>
        }
      >
        {detailConflict && (
          <>
            <Card size="small" style={{ marginBottom: 12, borderRadius: 8 }}
              title={<><DesktopOutlined style={{ marginRight: 6, color: '#1677ff' }} />冲突设备</>}
            >
              <Text strong>{detailConflict.equipName}</Text>
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{detailConflict.equipId}</Text>
            </Card>

            <Card size="small" style={{ marginBottom: 12, borderRadius: 8, background: '#fff1f0', borderColor: '#ffadd2' }}
              title={<><WarningOutlined style={{ marginRight: 6, color: '#f5222d' }} />冲突任务</>}
            >
              {[detailConflict.taskA, detailConflict.taskB].map((task, i) => (
                <div key={task.taskId} style={{ padding: '6px 0', borderBottom: i === 0 ? '1px solid #ffd6e7' : 'none' }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{task.taskNo}</div>
                  <div style={{ fontSize: 11, color: '#667085' }}>
                    批号: {task.batchNo} | 工序: {task.opNos.join(', ')}
                  </div>
                  <div style={{ fontSize: 11, color: '#667085' }}>
                    时间: {task.start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    {' ~ '}
                    {task.end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <Tag color={PRIORITY_COLOR[task.priority]} style={{ fontSize: 10, marginTop: 4 }}>{task.priority}</Tag>
                </div>
              ))}

              <div style={{ marginTop: 10, padding: '8px 10px', background: '#fff', borderRadius: 6, border: '1px solid #ffadd2' }}>
                <Text style={{ fontSize: 12, color: '#f5222d' }}>
                  ⚠️ 重叠时段：{detailConflict.overlapStart.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  {' ~ '}
                  {detailConflict.overlapEnd.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  {' ('}
                  {Math.round((detailConflict.overlapEnd.getTime() - detailConflict.overlapStart.getTime()) / 60000)} 分钟
                  {')'}
                </Text>
              </div>
            </Card>

            <Card size="small" style={{ marginBottom: 12, borderRadius: 8, background: '#f6ffed', borderColor: '#b7eb8f' }}
              title={<><CheckCircleOutlined style={{ marginRight: 6, color: '#52c41a' }} />建议解决方案</>}
            >
              <Alert
                type="success"
                showIcon
                message={detailConflict.suggestion}
                style={{ borderRadius: 6, marginBottom: 8 }}
              />
              <div style={{ fontSize: 12, color: '#667085' }}>
                <div style={{ marginBottom: 6 }}>其他可用设备：</div>
                {equipList
                  .filter(e => {
                    const origEq = equipList.find(eq => eq.id === detailConflict.equipId);
                    return e.id !== detailConflict.equipId &&
                      e.category === origEq?.category &&
                      e.status === 'NORMAL';
                  })
                  .map(e => (
                    <Tag key={e.id} color="success" style={{ fontSize: 11, marginBottom: 4 }}>
                      ✅ {e.name}（{e.code}）
                    </Tag>
                  ))
                }
                {equipList.filter(e => {
                  const origEq = equipList.find(eq => eq.id === detailConflict.equipId);
                  return e.id !== detailConflict.equipId && e.category === origEq?.category && e.status === 'NORMAL';
                }).length === 0 && (
                  <Text type="secondary" style={{ fontSize: 11 }}>同类设备无其他可用，建议调整时间</Text>
                )}
              </div>
            </Card>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default EquipConflictPage;
