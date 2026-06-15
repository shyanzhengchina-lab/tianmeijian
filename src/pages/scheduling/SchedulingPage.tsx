/**
 * 浮动排程引擎（FSE）主页面 — PRD §5.1~§5.5 完整 POC 实现
 * Tab 1：甘特图总览（GanttChart + 排程引擎执行 + 实时 KPI）
 * Tab 2：工单列表（物料放行告警 + 工序路由展开）
 * Tab 3：清场执行看板（SOP 步骤勾选 + QA 签字）
 * Tab 4：事件重排中心（告警审批/驳回 + 重排影响预览）
 * Tab 5：版本管理（KPI 对比 + 回滚 + 审计日志）
 * Tab 6：约束配置面板（硬软约束规则开关）
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  Tabs, Button, Space, Select, Tag, Badge, Tooltip, Modal, Alert,
  Table, Progress, Statistic, Row, Col, Card, Timeline, Descriptions,
  Checkbox, Divider, message, Popconfirm, Switch, InputNumber,
  List, Avatar, Steps, Typography, Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlayCircleOutlined, ReloadOutlined, WarningOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined, ScheduleOutlined,
  ThunderboltOutlined, BugOutlined, FileTextOutlined, RollbackOutlined,
  LockOutlined, UnlockOutlined, CameraOutlined, QrcodeOutlined,
  ToolOutlined, TeamOutlined, BranchesOutlined, ApartmentOutlined,
  FilterOutlined, EyeOutlined, HistoryOutlined, SettingOutlined,
  RiseOutlined, FallOutlined, MinusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import GanttChart from './GanttChart';
import {
  MOCK_SCHEDULE_ITEMS, MOCK_RESOURCES, MOCK_SCHEDULE_WOS, MOCK_CLEANING_TASKS,
  MOCK_RESCHEDULE_EVENTS, MOCK_SCHEDULE_VERSIONS, MOCK_MATERIAL_BATCHES,
  CONSTRAINT_RULES, CLEANING_RULES, ROUTING_OPS,
  ScheduleItem, ScheduleWorkOrder, CleaningTask, RescheduleEvent, ScheduleVersion,
  Resource, CleanCheckItem, ConstraintRule,
  ViewMode, Factory, TimeZone, WoStatus, CleanStatus, CleanType,
  SCHEDULE_STATUS_COLOR, SCHEDULE_STATUS_LABEL, WO_STATUS_COLOR, WO_STATUS_LABEL,
  TIME_ZONE_LABEL, CLEAN_STATUS_LABEL, CLEAN_STATUS_COLOR, CLEAN_TYPE_LABEL,
  EVENT_TYPE_LABEL, EVENT_TYPE_COLOR,
  getCleanType, calcTimeZone,
} from '../../store/schedulingStore';
import {
  runSchedulingEngine, handleRescheduleEvent, validateDragDrop,
  DEFAULT_STRATEGY, EngineOutput, EngineLogEntry,
} from './schedulingEngine';

dayjs.locale('zh-cn');
const { Text, Title, Paragraph } = Typography;

// ─────────────────────────────────────────────────────────────
// 常量 & 辅助
// ─────────────────────────────────────────────────────────────
const TODAY_STR = '2026-06-14';
const TODAY     = dayjs(TODAY_STR);

function kpiDelta(cur: number, base: number, higherBetter = true) {
  const d = parseFloat((cur - base).toFixed(1));
  const better = higherBetter ? d >= 0 : d <= 0;
  if (d === 0) return <span style={{ color: '#8c8c8c' }}><MinusOutlined /> 持平</span>;
  return better
    ? <span style={{ color: '#52c41a' }}><RiseOutlined /> +{Math.abs(d)}</span>
    : <span style={{ color: '#f5222d' }}><FallOutlined /> -{Math.abs(d)}</span>;
}

// ─────────────────────────────────────────────────────────────
// 主页面
// ─────────────────────────────────────────────────────────────
const SchedulingPage: React.FC = () => {
  // ── 全局状态 ─────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState('gantt');
  const [viewMode, setViewMode]     = useState<ViewMode>('biweek');
  const [factoryFilter, setFact]    = useState<Factory | 'ALL'>('ALL');
  const [startDate, setStartDate]   = useState(TODAY.subtract(2, 'day'));

  // 排程条目（引擎执行后替换）
  const [scheduleItems, setItems]   = useState<ScheduleItem[]>(MOCK_SCHEDULE_ITEMS);
  const [cleanTasks, setClean]      = useState<CleaningTask[]>(MOCK_CLEANING_TASKS);
  const [events, setEvents]         = useState<RescheduleEvent[]>(MOCK_RESCHEDULE_EVENTS);
  const [versions, setVersions]     = useState<ScheduleVersion[]>(MOCK_SCHEDULE_VERSIONS);
  const [constraints, setConstraints] = useState<ConstraintRule[]>(CONSTRAINT_RULES);

  // 引擎输出
  const [engineOut, setEngineOut]   = useState<EngineOutput | null>(null);
  const [running, setRunning]       = useState(false);
  const [logVisible, setLogVisible] = useState(false);

  // 选中工单（工序详情抽屉）
  const [selWo, setSelWo]           = useState<ScheduleWorkOrder | null>(null);
  const [selItem, setSelItem]       = useState<ScheduleItem | null>(null);

  // 清场看板
  const [selClean, setSelClean]     = useState<CleaningTask | null>(null);
  const [cleanTaskList, setCleanTaskList] = useState<CleaningTask[]>(MOCK_CLEANING_TASKS);

  // 事件重排
  const [previewEvent, setPreviewEvt] = useState<RescheduleEvent | null>(null);
  const [previewItems, setPreviewItems] = useState<ScheduleItem[]>([]);

  // 版本管理
  const [compareVer, setCompareVer] = useState<string[]>([]);
  const [rollbackTarget, setRollback] = useState<ScheduleVersion | null>(null);

  // ── KPI 计算（当前版本） ──────────────────────────────────
  const kpi = useMemo(() => {
    const cur = engineOut?.kpi ?? versions[0]?.kpi;
    const base = versions.find(v => v.isBaseline)?.kpi ?? versions[1]?.kpi;
    return { cur, base };
  }, [engineOut, versions]);

  // ── 运行排程引擎 ──────────────────────────────────────────
  const runEngine = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      try {
        const out = runSchedulingEngine({
          workOrders: MOCK_SCHEDULE_WOS,
          resources: MOCK_RESOURCES,
          planningHorizonDays: 14,
          frozenZoneDays: 3,
          rollingIntervalHours: 24,
          startDate: new Date(TODAY_STR),
          allowCrossShift: false,
          strategy: DEFAULT_STRATEGY,
        });
        setEngineOut(out);
        // 合并引擎结果到展示条目（保留 HISTORY 区原有数据 + 引擎新排条目）
        const historyItems = scheduleItems.filter(i => i.timeZone === 'HISTORY');
        setItems([...historyItems, ...out.items]);
        setClean(prev => [...prev, ...out.cleaningTasks]);
        message.success(`排程完成！版本 ${out.versionId}，已排 ${out.kpi.scheduledCount} 工单，冲突 ${out.kpi.conflictCount} 项，OTD ${out.kpi.otdRate}%`);
      } catch (e) {
        message.error('排程引擎执行异常：' + String(e));
      }
      setRunning(false);
    }, 1200);  // 模拟计算延时
  }, [scheduleItems]);

  // ── 甘特图条目点击 ────────────────────────────────────────
  const handleItemClick = useCallback((item: ScheduleItem) => {
    setSelItem(item);
    const wo = MOCK_SCHEDULE_WOS.find(w => w.woNo === item.woNo);
    if (wo) setSelWo(wo);
  }, []);

  // ── 清场步骤勾选 ──────────────────────────────────────────
  const toggleCheckItem = (taskId: string, checkId: string, checked: boolean) => {
    setCleanTaskList(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        checkItems: t.checkItems.map(c => c.id === checkId ? {
          ...c, checked,
          checkedBy: checked ? '操作员（POC）' : undefined,
          checkedAt: checked ? new Date().toISOString() : undefined,
          result: checked ? 'PASS' : undefined,
        } : c),
      };
    }));
  };

  // ── 清场完成确认 ─────────────────────────────────────────
  const completeClean = (taskId: string) => {
    setCleanTaskList(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'COMPLETED' as CleanStatus, verifiedAt: new Date().toISOString(), verifier: 'QA工程师（POC）' } : t
    ));
    message.success('清场任务完成，已更新 EBR 记录');
  };

  // ── 事件审批 ─────────────────────────────────────────────
  const approveEvent = (evtId: string) => {
    setEvents(prev => prev.map(e => e.id === evtId ? { ...e, status: 'APPROVED', appliedAt: new Date().toISOString(), operator: '排产主管（POC）' } : e));
    // 执行重排
    const evt = events.find(e => e.id === evtId);
    if (evt) {
      const result = handleRescheduleEvent(evt.type, evt.affectedWoNos, evt.impactMinutes, scheduleItems, 3);
      setItems(prev => {
        const keep = prev.filter(i => !result.affectedItemIds.includes(i.id));
        return [...keep, ...result.newItems];
      });
      message.success(`已审批并执行重排，影响 ${result.newItems.length} 个工序条目`);
    }
  };

  const rejectEvent = (evtId: string) => {
    setEvents(prev => prev.map(e => e.id === evtId ? { ...e, status: 'REJECTED' } : e));
    message.info('已驳回重排申请，保持当前排程不变');
  };

  // ── 事件影响预览 ──────────────────────────────────────────
  const previewReschedule = (evt: RescheduleEvent) => {
    const result = handleRescheduleEvent(evt.type, evt.affectedWoNos, evt.impactMinutes, scheduleItems, 3);
    setPreviewEvt(evt);
    setPreviewItems(result.newItems);
  };

  // ── 版本回滚 ─────────────────────────────────────────────
  const rollbackVersion = (ver: ScheduleVersion) => {
    // POC 模拟：回滚到 Mock 初始数据
    setItems(MOCK_SCHEDULE_ITEMS);
    setClean(MOCK_CLEANING_TASKS);
    setEngineOut(null);
    message.success(`已回滚到版本 ${ver.versionId}（${ver.label}）`);
    setRollback(null);
  };

  // ── 约束规则开关 ──────────────────────────────────────────
  const toggleConstraint = (ruleId: string, enabled: boolean) => {
    setConstraints(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r));
    message.info(enabled ? `约束规则 ${ruleId} 已启用` : `约束规则 ${ruleId} 已停用（谨慎操作）`);
  };

  // ── 工单列表列 ────────────────────────────────────────────
  const woColumns: ColumnsType<ScheduleWorkOrder> = [
    {
      title: '工单号', dataIndex: 'woNo', width: 170, fixed: 'left',
      render: (v, r) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 12 }}>{v}</Text>
          {r.isInsertOrder && <Tag color="red" style={{ fontSize: 10 }}>紧急插单</Tag>}
          {r.isUrgent && !r.isInsertOrder && <Tag color="orange" style={{ fontSize: 10 }}>急单</Tag>}
        </Space>
      ),
    },
    {
      title: '产品', dataIndex: 'productName', width: 150,
      render: (v, r) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>{v}</Text>
          <Text type="secondary" style={{ fontSize: 10 }}>{r.productCode}</Text>
        </Space>
      ),
    },
    {
      title: '工厂', dataIndex: 'factory', width: 80,
      render: v => <Tag color={v === 'NJ' ? 'blue' : 'green'}>{v === 'NJ' ? '南京' : '溧水'}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: v => <Badge status={WO_STATUS_COLOR[v as WoStatus] as any} text={<span style={{ fontSize: 11 }}>{WO_STATUS_LABEL[v as WoStatus]}</span>} />,
    },
    {
      title: '优先级', dataIndex: 'priority', width: 70, align: 'center',
      render: v => <Tag color={v >= 5 ? 'red' : v >= 4 ? 'orange' : 'default'}>P{v}</Tag>,
    },
    {
      title: '计划数量', dataIndex: 'plannedQty', width: 90, align: 'right',
      render: (v, r) => <Text style={{ fontSize: 12 }}>{v.toLocaleString()} {r.unit}</Text>,
    },
    {
      title: '交货期', dataIndex: 'dueDate', width: 110,
      render: v => {
        const diff = dayjs(v).diff(TODAY, 'day');
        const color = diff <= 3 ? '#f5222d' : diff <= 7 ? '#faad14' : '#52c41a';
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 11 }}>{dayjs(v).format('MM-DD HH:mm')}</Text>
            <Text style={{ fontSize: 10, color }}>剩余 {diff} 天</Text>
          </Space>
        );
      },
    },
    {
      title: '进度', dataIndex: 'progress', width: 110,
      render: (v, r) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Progress percent={v ?? 0} size="small" strokeColor={r.isUrgent ? '#f5222d' : '#1890ff'} style={{ margin: 0 }} />
          {r.qcHoldMinutes && <Text style={{ fontSize: 10, color: '#722ed1' }}>QC等待 {r.qcHoldMinutes / 60}h</Text>}
        </Space>
      ),
    },
    {
      title: '物料批次', dataIndex: 'materialBatches', width: 160,
      render: (batches: string[]) => (
        <Space direction="vertical" size={2}>
          {batches.map(b => {
            const batch = MOCK_MATERIAL_BATCHES.find(m => m.batchNo === b);
            const ok = batch?.status === 'RELEASED';
            return (
              <Tooltip key={b} title={batch ? `${batch.materialName} — ${batch.status}` : b}>
                <Tag color={ok ? 'success' : 'error'} style={{ fontSize: 9, cursor: 'pointer' }}>
                  {ok ? <CheckCircleOutlined /> : <WarningOutlined />} {b.slice(-8)}
                </Tag>
              </Tooltip>
            );
          })}
        </Space>
      ),
    },
    {
      title: '工艺路径', dataIndex: 'routingCode', width: 130,
      render: (v, r) => {
        const ops = ROUTING_OPS[v];
        return (
          <Tooltip title={ops ? ops.map(o => o.opName).join(' → ') : '未配置'}>
            <Space direction="vertical" size={0}>
              <Text style={{ fontSize: 11 }}>{v}</Text>
              <Text type="secondary" style={{ fontSize: 10 }}>{ops?.length ?? 0} 工序</Text>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: '冷链', dataIndex: 'isColdChain', width: 60, align: 'center',
      render: v => v ? <Tag color="cyan" style={{ fontSize: 10 }}>❄ 冷链</Tag> : <Text type="secondary" style={{ fontSize: 10 }}>—</Text>,
    },
    {
      title: '约束告警', width: 100,
      render: (_, r) => {
        const items = scheduleItems.filter(i => i.woNo === r.woNo);
        const violations = items.flatMap(i => i.constraintViolations).filter(v => v.severity === 'HARD');
        if (violations.length === 0) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        return (
          <Tooltip title={violations.map(v => v.message).join('\n')}>
            <Badge count={violations.length} size="small">
              <WarningOutlined style={{ color: '#f5222d', fontSize: 16 }} />
            </Badge>
          </Tooltip>
        );
      },
    },
  ];

  // ═══════════════════════════════════════════════════════════
  // Tab 1 — 甘特图总览
  // ═══════════════════════════════════════════════════════════
  const renderGanttTab = () => (
    <div>
      {/* 顶部 KPI 栏 */}
      <Row gutter={12} style={{ marginBottom: 12 }}>
        {[
          { title: '设备利用率', value: kpi.cur?.utilization ?? 78.3, suffix: '%', base: kpi.base?.utilization ?? 82.1, higher: true },
          { title: 'OTD交付率', value: kpi.cur?.otdRate ?? 91.2, suffix: '%', base: kpi.base?.otdRate ?? 95.0, higher: true },
          { title: '清场损耗', value: kpi.cur?.cleaningWasteH ?? 12.5, suffix: 'h', base: kpi.base?.cleaningWasteH ?? 10.2, higher: false },
          { title: '约束冲突', value: kpi.cur?.conflictCount ?? 1, suffix: '项', base: kpi.base?.conflictCount ?? 0, higher: false },
          { title: '已排工单', value: kpi.cur?.scheduledCount ?? 5, suffix: '单', base: kpi.base?.scheduledCount ?? 4, higher: true },
          { title: '紧急插单', value: kpi.cur?.urgentCount ?? 1, suffix: '单', base: 0, higher: false },
        ].map((m, i) => (
          <Col key={i} span={4}>
            <Card size="small" bodyStyle={{ padding: '10px 14px' }} bordered style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <Statistic
                title={<span style={{ fontSize: 11, color: '#8c8c8c' }}>{m.title}</span>}
                value={m.value}
                suffix={m.suffix}
                valueStyle={{ fontSize: 22, fontWeight: 700, color: m.title === '约束冲突' && m.value > 0 ? '#f5222d' : '#262626' }}
              />
              <div style={{ marginTop: 2, fontSize: 10 }}>vs 基线：{kpiDelta(m.value, m.base, m.higher)}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 工具栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <Space wrap>
          <Select value={viewMode} onChange={setViewMode} size="small" style={{ width: 100 }}>
            <Select.Option value="day">日视图</Select.Option>
            <Select.Option value="week">周视图</Select.Option>
            <Select.Option value="biweek">双周视图</Select.Option>
          </Select>
          <Select value={factoryFilter} onChange={setFact} size="small" style={{ width: 100 }}>
            <Select.Option value="ALL">全部工厂</Select.Option>
            <Select.Option value="NJ">南京工厂</Select.Option>
            <Select.Option value="LS">溧水工厂</Select.Option>
          </Select>
          <Button size="small" icon={<ReloadOutlined />}
            onClick={() => setStartDate(TODAY.subtract(2, 'day'))}>
            跳到今日
          </Button>
          <Button size="small" onClick={() => setStartDate(prev => prev.subtract(viewMode === 'day' ? 1 : 7, viewMode === 'day' ? 'day' : 'day'))}>
            ← 前移
          </Button>
          <Button size="small" onClick={() => setStartDate(prev => prev.add(viewMode === 'day' ? 1 : 7, viewMode === 'day' ? 'day' : 'day'))}>
            后移 →
          </Button>
        </Space>
        <Space>
          {engineOut && (
            <Button size="small" icon={<EyeOutlined />} onClick={() => setLogVisible(true)}>
              查看执行日志（{engineOut.log.length} 条）
            </Button>
          )}
          <Button
            type="primary"
            size="small"
            icon={<PlayCircleOutlined />}
            loading={running}
            onClick={runEngine}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            {running ? '排程计算中...' : '▶ 执行排程引擎（EDD+前向排程）'}
          </Button>
        </Space>
      </div>

      {/* 引擎执行提示 */}
      {engineOut && (
        <Alert
          type="success"
          showIcon
          message={`排程版本 ${engineOut.versionId} — ${dayjs(engineOut.generatedAt).format('MM-DD HH:mm:ss')}`}
          description={`已排 ${engineOut.kpi.scheduledCount} 工单 | OTD ${engineOut.kpi.otdRate}% | 利用率 ${engineOut.kpi.utilization}% | 清场损耗 ${engineOut.kpi.cleaningWasteH}h | 冲突 ${engineOut.kpi.conflictCount} 项`}
          style={{ marginBottom: 10, borderRadius: 6 }}
          closable
        />
      )}

      {/* 冲突告警 Banner */}
      {scheduleItems.some(i => i.constraintViolations.some(v => v.severity === 'HARD')) && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message={`当前排程存在 ${scheduleItems.flatMap(i => i.constraintViolations).filter(v => v.severity === 'HARD').length} 个硬约束冲突`}
          description="红色甘特条表示冲突项，右键点击可查看详情并处理"
          style={{ marginBottom: 10, borderRadius: 6 }}
          closable
        />
      )}

      {/* 甘特图 */}
      <GanttChart
        items={scheduleItems}
        resources={MOCK_RESOURCES}
        viewMode={viewMode}
        startDate={startDate}
        factoryFilter={factoryFilter}
        onItemClick={handleItemClick}
        onItemRightClick={(item, action) => {
          if (action === 'deviation') message.warning(`偏差已发起：${item.woNo} - ${item.opName}`);
        }}
        highlightConflicts
      />

      {/* 排程条目点击详情 Modal */}
      <Modal
        title={<Space><ScheduleOutlined />{selItem?.woNo} — {selItem?.opName}</Space>}
        open={!!selItem}
        onCancel={() => setSelItem(null)}
        width={560}
        footer={[
          <Button key="bpr" icon={<FileTextOutlined />} onClick={() => message.info(`查看 BPR: ${selItem?.woNo}`)}>查看BPR</Button>,
          <Button key="dev" icon={<BugOutlined />} danger onClick={() => message.warning('偏差已发起')}>发起偏差</Button>,
          <Button key="close" onClick={() => setSelItem(null)}>关闭</Button>,
        ]}
      >
        {selItem && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="工单号" span={2}>{selItem.woNo}</Descriptions.Item>
            <Descriptions.Item label="工序">{selItem.opNo} {selItem.opName}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge color={SCHEDULE_STATUS_COLOR[selItem.status]} text={SCHEDULE_STATUS_LABEL[selItem.status]} />
            </Descriptions.Item>
            <Descriptions.Item label="资源">{selItem.resourceName}</Descriptions.Item>
            <Descriptions.Item label="洁净级">{selItem.cleanRoomLevel}</Descriptions.Item>
            <Descriptions.Item label="开始时间">{dayjs(selItem.startTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="结束时间">{dayjs(selItem.endTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="时长">{selItem.durationMinutes} 分钟</Descriptions.Item>
            <Descriptions.Item label="时区">
              <Tag color="orange">{TIME_ZONE_LABEL[selItem.timeZone]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="冷链">{selItem.isColdChain ? <Tag color="cyan">❄ 是</Tag> : '否'}</Descriptions.Item>
            <Descriptions.Item label="锁定">{selItem.isLocked ? <Tag color="gold"><LockOutlined /> 冻结锁定</Tag> : '否'}</Descriptions.Item>
            <Descriptions.Item label="软约束分" span={2}>
              <Progress percent={selItem.softScore} size="small" />
            </Descriptions.Item>
            {selItem.constraintViolations.length > 0 && (
              <Descriptions.Item label="约束冲突" span={2}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selItem.constraintViolations.map((v, i) => (
                    <Alert key={i} type={v.severity === 'HARD' ? 'error' : 'warning'} showIcon
                      message={v.message} description={v.suggestion} style={{ padding: '4px 8px' }} />
                  ))}
                </Space>
              </Descriptions.Item>
            )}
            {selItem.notes && <Descriptions.Item label="备注" span={2}>{selItem.notes}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>

      {/* 引擎执行日志 Modal */}
      <Modal
        title={<Space><ToolOutlined />排程引擎执行日志</Space>}
        open={logVisible}
        onCancel={() => setLogVisible(false)}
        width={760}
        footer={<Button onClick={() => setLogVisible(false)}>关闭</Button>}
      >
        {engineOut && (
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            <Timeline
              items={engineOut.log.map(entry => ({
                color: entry.level === 'ERROR' ? 'red' : entry.level === 'WARN' ? 'orange' : 'blue',
                children: (
                  <div style={{ fontSize: 12 }}>
                    <Tag color={entry.level === 'ERROR' ? 'error' : entry.level === 'WARN' ? 'warning' : 'processing'} style={{ fontSize: 10 }}>
                      {entry.level}
                    </Tag>
                    {entry.woNo && <Tag style={{ fontSize: 10 }}>{entry.woNo}</Tag>}
                    {entry.opNo && <Tag style={{ fontSize: 10 }}>{entry.opNo}</Tag>}
                    <span style={{ color: '#595959' }}>{entry.message}</span>
                    <span style={{ float: 'right', fontSize: 10, color: '#bfbfbf' }}>{dayjs(entry.timestamp).format('HH:mm:ss.SSS')}</span>
                  </div>
                ),
              }))}
            />
          </div>
        )}
      </Modal>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // Tab 2 — 工单列表
  // ═══════════════════════════════════════════════════════════
  const renderWoTab = () => (
    <div>
      {/* 汇总告警 */}
      {MOCK_SCHEDULE_WOS.filter(w => w.isInsertOrder || w.isUrgent).length > 0 && (
        <Alert type="warning" showIcon icon={<ThunderboltOutlined />}
          message={`存在 ${MOCK_SCHEDULE_WOS.filter(w => w.isInsertOrder).length} 张紧急插单，${MOCK_SCHEDULE_WOS.filter(w => w.isUrgent && !w.isInsertOrder).length} 张急单，请优先处理`}
          style={{ marginBottom: 12, borderRadius: 6 }} />
      )}
      {MOCK_SCHEDULE_WOS.some(w => w.materialBatches.some(b => {
        const batch = MOCK_MATERIAL_BATCHES.find(m => m.batchNo === b);
        return batch && batch.status !== 'RELEASED';
      })) && (
        <Alert type="error" showIcon icon={<WarningOutlined />}
          message="存在物料批次未放行的工单，无法开始生产！请在LIMS中完成IQC检验"
          style={{ marginBottom: 12, borderRadius: 6 }} />
      )}

      <Table
        dataSource={MOCK_SCHEDULE_WOS}
        columns={woColumns}
        rowKey="woNo"
        size="small"
        scroll={{ x: 1400 }}
        pagination={false}
        rowClassName={r => r.isInsertOrder ? 'urgent-row' : ''}
        expandable={{
          expandedRowRender: (r) => {
            const ops = ROUTING_OPS[r.routingCode] ?? [];
            const woItems = scheduleItems.filter(i => i.woNo === r.woNo && !i.isCleaningBar);
            return (
              <div style={{ padding: '8px 16px', background: '#fafafa', borderRadius: 6 }}>
                <Text strong style={{ fontSize: 12 }}>工序路由（{ops.length} 步）</Text>
                <Steps
                  size="small"
                  style={{ marginTop: 8 }}
                  items={ops.map((op, idx) => {
                    const si = woItems.find(i => i.opNo === op.opNo);
                    return {
                      title: <span style={{ fontSize: 11 }}>{op.opNo}</span>,
                      description: (
                        <div style={{ fontSize: 10 }}>
                          <div>{op.opName}</div>
                          {si ? (
                            <div>
                              <Tag color={SCHEDULE_STATUS_COLOR[si.status]} style={{ fontSize: 9 }}>{SCHEDULE_STATUS_LABEL[si.status]}</Tag>
                              <span style={{ color: '#8c8c8c' }}>{dayjs(si.startTime).format('MM-DD')}~{dayjs(si.endTime).format('MM-DD')}</span>
                            </div>
                          ) : <span style={{ color: '#bbb' }}>待排程</span>}
                        </div>
                      ),
                      status: si
                        ? (si.status === 'COMPLETED' ? 'finish' : si.status === 'PRODUCING' ? 'process' : si.status === 'ABNORMAL' ? 'error' : 'wait')
                        : 'wait',
                    };
                  })}
                />
                {r.notes && <Alert type="info" message={r.notes} style={{ marginTop: 8, padding: '4px 8px' }} />}
              </div>
            );
          },
          rowExpandable: r => ROUTING_OPS[r.routingCode]?.length > 0,
        }}
      />
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // Tab 3 — 清场执行看板
  // ═══════════════════════════════════════════════════════════
  const renderCleanTab = () => (
    <Row gutter={16}>
      {/* 左：清场任务列表 */}
      <Col span={9}>
        <Card title={<Space><ToolOutlined />清场任务列表</Space>} size="small">
          <List
            dataSource={cleanTaskList}
            renderItem={task => {
              const rule = CLEANING_RULES[task.cleanType];
              const done = task.checkItems.filter(c => c.checked).length;
              const total = task.checkItems.length;
              const isSelected = selClean?.id === task.id;
              return (
                <List.Item
                  style={{
                    cursor: 'pointer', padding: '10px 12px', borderRadius: 6,
                    background: isSelected ? '#e6f7ff' : 'transparent',
                    border: isSelected ? '1px solid #91d5ff' : '1px solid transparent',
                    marginBottom: 4,
                  }}
                  onClick={() => setSelClean(task)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar size={36} style={{ background: rule.color, fontSize: 16, flexShrink: 0 }}>
                        🧹
                      </Avatar>
                    }
                    title={
                      <Space size={4}>
                        <Tag color={rule.color} style={{ fontSize: 10 }}>{CLEAN_TYPE_LABEL[task.cleanType]}</Tag>
                        <Badge status={CLEAN_STATUS_COLOR[task.status] as any} text={<span style={{ fontSize: 11 }}>{CLEAN_STATUS_LABEL[task.status]}</span>} />
                      </Space>
                    }
                    description={
                      <div style={{ fontSize: 11 }}>
                        <div style={{ color: '#262626', fontWeight: 500 }}>{task.resourceName}</div>
                        <div style={{ color: '#8c8c8c' }}>
                          {task.prevProductCode || '（首批）'} → {task.nextProductCode}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <Progress
                            percent={total > 0 ? Math.round((done / total) * 100) : 0}
                            size="small"
                            format={() => `${done}/${total}`}
                            strokeColor={task.qaRequired ? '#f5222d' : rule.color}
                          />
                        </div>
                        <div style={{ color: '#595959' }}>
                          {dayjs(task.startTime).format('MM-DD HH:mm')} ~ {dayjs(task.endTime).format('HH:mm')} ({task.durationMinutes}min)
                        </div>
                        {task.qaRequired && <Tag color="red" style={{ fontSize: 10, marginTop: 2 }}>需QA现场签字</Tag>}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      </Col>

      {/* 右：清场详情 / SOP 执行 */}
      <Col span={15}>
        {selClean ? (
          <Card
            title={
              <Space>
                <ToolOutlined />
                清场 SOP — {selClean.resourceName}
                <Tag color={CLEANING_RULES[selClean.cleanType].color}>{CLEAN_TYPE_LABEL[selClean.cleanType]}</Tag>
                {selClean.qaRequired && <Tag color="red">需QA签字</Tag>}
              </Space>
            }
            extra={
              <Space>
                {selClean.qrCode && (
                  <Tooltip title={`扫描二维码进行移动端操作: ${selClean.qrCode}`}>
                    <Button size="small" icon={<QrcodeOutlined />}>二维码</Button>
                  </Tooltip>
                )}
                {selClean.status !== 'COMPLETED' && (
                  <Popconfirm
                    title="确认清场完成？"
                    description="所有步骤完成后方可提交，将更新 EBR 记录"
                    onConfirm={() => {
                      const sel = cleanTaskList.find(t => t.id === selClean.id);
                      if (sel) { completeClean(selClean.id); setSelClean({ ...sel, status: 'COMPLETED' }); }
                    }}
                    okText="确认完成"
                    cancelText="取消"
                  >
                    <Button size="small" type="primary" icon={<CheckCircleOutlined />}
                      disabled={cleanTaskList.find(t => t.id === selClean.id)?.checkItems.some(c => c.required && !c.checked)}
                    >
                      确认清场完成
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            }
            size="small"
          >
            {/* 基本信息 */}
            <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="切换前产品">{selClean.prevProductCode || '—'}</Descriptions.Item>
              <Descriptions.Item label="切换后产品">{selClean.nextProductCode}</Descriptions.Item>
              <Descriptions.Item label="清场时长">{selClean.durationMinutes} min</Descriptions.Item>
              <Descriptions.Item label="操作员">{selClean.operator ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="验证人">{selClean.verifier ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge status={CLEAN_STATUS_COLOR[selClean.status] as any} text={CLEAN_STATUS_LABEL[selClean.status]} />
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '10px 0' }}>SOP 清场步骤</Divider>

            {/* SOP 步骤列表 */}
            <List
              dataSource={cleanTaskList.find(t => t.id === selClean.id)?.checkItems ?? selClean.checkItems}
              renderItem={(item, idx) => {
                const taskInState = cleanTaskList.find(t => t.id === selClean.id);
                const stateItem = taskInState?.checkItems.find(c => c.id === item.id) ?? item;
                return (
                  <List.Item style={{
                    padding: '8px 12px', borderRadius: 6, marginBottom: 4,
                    background: stateItem.checked ? '#f6ffed' : stateItem.required ? '#fff' : '#fafafa',
                    border: stateItem.checked ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
                  }}>
                    <Space align="start" style={{ width: '100%' }}>
                      <Checkbox
                        checked={stateItem.checked}
                        disabled={selClean.status === 'COMPLETED'}
                        onChange={e => toggleCheckItem(selClean.id, item.id, e.target.checked)}
                        style={{ marginTop: 2 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Badge count={idx + 1} style={{ background: '#595959', fontSize: 10 }} />
                          <Text style={{ fontSize: 12, textDecoration: stateItem.checked ? 'line-through' : 'none', color: stateItem.checked ? '#8c8c8c' : '#262626' }}>
                            {item.item}
                          </Text>
                          {item.required && !stateItem.checked && <Tag color="error" style={{ fontSize: 9 }}>必须</Tag>}
                          {stateItem.checked && <Tag color="success" style={{ fontSize: 9 }}>✓ 完成</Tag>}
                          {item.photoRequired && (
                            <Tooltip title={stateItem.photoUrl ? '查看照片' : '请拍照上传'}>
                              <Button size="small" icon={<CameraOutlined />}
                                type={stateItem.photoUrl ? 'default' : 'dashed'}
                                style={{ fontSize: 10, padding: '0 6px', height: 20 }}
                                onClick={() => stateItem.photoUrl ? Modal.info({ title: '清场照片', content: <img src={stateItem.photoUrl} alt="清场照片" style={{ width: '100%' }} /> }) : message.info('请使用移动端扫码上传照片')}>
                                {stateItem.photoUrl ? '已上传' : '拍照'}
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                        {stateItem.checked && stateItem.checkedBy && (
                          <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 2 }}>
                            {stateItem.checkedBy} · {stateItem.checkedAt ? dayjs(stateItem.checkedAt).format('HH:mm') : ''}
                            {stateItem.result && <Tag color="success" style={{ fontSize: 9, marginLeft: 4 }}>{stateItem.result}</Tag>}
                          </div>
                        )}
                      </div>
                    </Space>
                  </List.Item>
                );
              }}
            />

            {/* QA 签字区 */}
            {selClean.qaRequired && (
              <Card size="small" style={{ marginTop: 12, background: '#fff2e8', border: '1px solid #ffbb96' }}>
                <Space>
                  <Text strong style={{ color: '#d4380d' }}>⚠ QA 现场审查（深度清场必须）</Text>
                  {selClean.qaSignedBy
                    ? <Tag color="success">✓ 已签字：{selClean.qaSignedBy}</Tag>
                    : (
                      <Button size="small" type="primary" danger
                        onClick={() => {
                          setClean(prev => prev.map(t => t.id === selClean.id ? { ...t, qaSignedBy: 'QA主管李工（POC模拟）' } : t));
                          setSelClean(prev => prev ? { ...prev, qaSignedBy: 'QA主管李工（POC模拟）' } : null);
                          message.success('QA签字完成');
                        }}>
                        模拟 QA 签字
                      </Button>
                    )
                  }
                </Space>
              </Card>
            )}
          </Card>
        ) : (
          <Card size="small" style={{ height: '100%' }}>
            <Empty description="← 点击左侧清场任务查看 SOP 详情" />
          </Card>
        )}
      </Col>
    </Row>
  );

  // ═══════════════════════════════════════════════════════════
  // Tab 4 — 事件重排中心
  // ═══════════════════════════════════════════════════════════
  const renderEventTab = () => {
    const eventStatusColor: Record<string, string> = {
      PENDING: 'orange', APPROVED: 'green', REJECTED: 'red',
      APPLIED: 'blue', AUTO_APPLIED: 'cyan',
    };
    const eventStatusLabel: Record<string, string> = {
      PENDING: '待处理', APPROVED: '已审批', REJECTED: '已驳回',
      APPLIED: '已应用', AUTO_APPLIED: '系统自动',
    };
    return (
      <div>
        <Alert type="info" showIcon
          message="事件驱动重排：当 QC不合格 / 设备故障 / 原料延迟 / 紧急插单 发生时，系统自动触发重排建议，冻结区（T+0~T+2）修改需审批"
          style={{ marginBottom: 12, borderRadius: 6 }} />

        <List
          dataSource={events}
          renderItem={evt => {
            const isPending = evt.status === 'PENDING';
            const inFrozen = evt.timeZone === 'FROZEN';
            return (
              <Card
                size="small"
                style={{
                  marginBottom: 10,
                  borderRadius: 8,
                  border: isPending ? '1px solid #faad14' : '1px solid #f0f0f0',
                  background: isPending ? '#fffbe6' : '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Space wrap style={{ marginBottom: 6 }}>
                      <Tag color={EVENT_TYPE_COLOR[evt.type]}>{EVENT_TYPE_LABEL[evt.type]}</Tag>
                      <Tag color={eventStatusColor[evt.status]}>{eventStatusLabel[evt.status]}</Tag>
                      <Tag>{evt.source}</Tag>
                      {inFrozen && <Tag color="gold"><LockOutlined /> 冻结区</Tag>}
                      {evt.requireApproval && <Tag color="orange">需审批</Tag>}
                      <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(evt.triggeredAt).format('MM-DD HH:mm')}</Text>
                    </Space>
                    <div style={{ fontSize: 13, color: '#262626', marginBottom: 6 }}>{evt.description}</div>
                    <div style={{ fontSize: 11, color: '#595959' }}>
                      影响工单：{evt.affectedWoNos.map(w => <Tag key={w} style={{ fontSize: 10 }}>{w}</Tag>)}
                      | 影响时长：<Text strong>{evt.impactMinutes}分钟（{(evt.impactMinutes / 60).toFixed(1)}h）</Text>
                    </div>
                    {evt.proposedActions && (
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>📋 重排建议：</Text>
                        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                          {evt.proposedActions.map((a, i) => <li key={i} style={{ fontSize: 11, color: '#595959' }}>{a}</li>)}
                        </ul>
                      </div>
                    )}
                    {evt.appliedAt && (
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        {evt.status === 'AUTO_APPLIED' ? '系统自动' : evt.operator} 于 {dayjs(evt.appliedAt).format('MM-DD HH:mm')} 处理
                      </Text>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  {isPending && (
                    <Space direction="vertical" style={{ flexShrink: 0 }}>
                      <Button
                        size="small"
                        onClick={() => previewReschedule(evt)}
                        icon={<EyeOutlined />}
                      >
                        预览影响
                      </Button>
                      <Popconfirm
                        title={inFrozen ? '冻结区修改需审批，确认批准此重排方案？' : '确认执行此重排方案？'}
                        onConfirm={() => approveEvent(evt.id)}
                        okText="确认审批"
                        okType="primary"
                        cancelText="取消"
                      >
                        <Button size="small" type="primary" icon={<CheckCircleOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                          {inFrozen ? '审批通过' : '执行重排'}
                        </Button>
                      </Popconfirm>
                      <Popconfirm title="确认驳回此重排申请？" onConfirm={() => rejectEvent(evt.id)} okText="确认驳回" okType="danger" cancelText="取消">
                        <Button size="small" danger icon={<ExclamationCircleOutlined />}>驳回</Button>
                      </Popconfirm>
                    </Space>
                  )}
                </div>
              </Card>
            );
          }}
        />

        {/* 重排预览 Modal */}
        <Modal
          title={<Space><BranchesOutlined />重排影响预览 — {previewEvent?.type && EVENT_TYPE_LABEL[previewEvent.type]}</Space>}
          open={!!previewEvent}
          onCancel={() => { setPreviewEvt(null); setPreviewItems([]); }}
          width={680}
          footer={[
            <Button key="close" onClick={() => { setPreviewEvt(null); setPreviewItems([]); }}>关闭</Button>,
          ]}
        >
          {previewEvent && (
            <>
              <Alert type="warning" showIcon
                message={`此重排将影响 ${previewItems.length} 个工序条目，总推迟 ${previewEvent.impactMinutes} 分钟`}
                style={{ marginBottom: 12 }} />
              <Table
                dataSource={previewItems}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ y: 300 }}
                columns={[
                  { title: '工单', dataIndex: 'woNo', width: 150 },
                  { title: '工序', dataIndex: 'opName', width: 120 },
                  { title: '资源', dataIndex: 'resourceName', width: 140 },
                  { title: '新开始时间', dataIndex: 'startTime', width: 130, render: v => dayjs(v).format('MM-DD HH:mm') },
                  { title: '新结束时间', dataIndex: 'endTime', width: 130, render: v => dayjs(v).format('MM-DD HH:mm') },
                  {
                    title: '时区', dataIndex: 'timeZone', width: 80,
                    render: v => <Tag color={v === 'FROZEN' ? 'orange' : 'blue'}>{TIME_ZONE_LABEL[v as TimeZone]}</Tag>,
                  },
                ]}
              />
              {previewItems.some(i => i.timeZone === 'FROZEN') && (
                <Alert type="error" showIcon message="包含冻结区条目，需要主管审批方可执行" style={{ marginTop: 8 }} />
              )}
            </>
          )}
        </Modal>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Tab 5 — 版本管理
  // ═══════════════════════════════════════════════════════════
  const renderVersionTab = () => {
    const kpiFields = [
      { key: 'utilization', label: '利用率', suffix: '%', higher: true },
      { key: 'otdRate', label: 'OTD率', suffix: '%', higher: true },
      { key: 'cleaningWasteH', label: '清场损耗', suffix: 'h', higher: false },
      { key: 'conflictCount', label: '冲突数', suffix: '项', higher: false },
      { key: 'urgentCount', label: '插单数', suffix: '单', higher: false },
      { key: 'avgLeadTimeH', label: '平均提前期', suffix: 'h', higher: false },
    ] as const;

    return (
      <div>
        <Row gutter={16}>
          {/* 版本列表 */}
          <Col span={10}>
            <Card title={<Space><HistoryOutlined />版本历史</Space>} size="small">
              <List
                dataSource={versions}
                renderItem={ver => (
                  <List.Item
                    style={{ padding: '10px 12px', borderRadius: 6, marginBottom: 4, border: '1px solid #f0f0f0' }}
                    actions={[
                      <Button key="rb" size="small" icon={<RollbackOutlined />}
                        disabled={ver.status === 'PUBLISHED'}
                        onClick={() => setRollback(ver)}>
                        回滚
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar size={32} style={{ background: ver.status === 'PUBLISHED' ? '#52c41a' : ver.isBaseline ? '#1890ff' : '#d9d9d9', fontSize: 11 }}>
                          {ver.status === 'PUBLISHED' ? '现' : ver.isBaseline ? '基' : '旧'}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong style={{ fontSize: 12 }}>{ver.label}</Text>
                          <Tag color={ver.status === 'PUBLISHED' ? 'green' : 'default'} style={{ fontSize: 10 }}>
                            {ver.status === 'PUBLISHED' ? '当前版本' : ver.isBaseline ? '基线' : '已归档'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div style={{ fontSize: 11 }}>
                          <div style={{ color: '#8c8c8c' }}>{ver.versionId}</div>
                          <div>{ver.createdBy} · {dayjs(ver.createdAt).format('MM-DD HH:mm')}</div>
                          {ver.changeDesc && <div style={{ color: '#595959', marginTop: 2 }}>变更：{ver.changeDesc}</div>}
                          <Row gutter={8} style={{ marginTop: 4 }}>
                            {kpiFields.slice(0, 3).map(f => (
                              <Col key={f.key}>
                                <Text style={{ fontSize: 10, color: '#8c8c8c' }}>{f.label}: </Text>
                                <Text strong style={{ fontSize: 10 }}>{ver.kpi[f.key as keyof typeof ver.kpi]}{f.suffix}</Text>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* KPI 对比 */}
          <Col span={14}>
            <Card title={<Space><ApartmentOutlined />KPI 版本对比</Space>} size="small">
              {versions.length >= 2 && (() => {
                const cur  = versions[0];
                const prev = versions[1];
                return (
                  <>
                    <div style={{ marginBottom: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        对比：<Text strong>{cur.label}</Text> vs <Text strong>{prev.label}（基线）</Text>
                      </Text>
                    </div>
                    <Row gutter={[12, 12]}>
                      {kpiFields.map(f => {
                        const curVal  = cur.kpi[f.key as keyof typeof cur.kpi] as number;
                        const prevVal = prev.kpi[f.key as keyof typeof prev.kpi] as number;
                        return (
                          <Col key={f.key} span={8}>
                            <Card size="small" bodyStyle={{ padding: '10px 12px' }} style={{ textAlign: 'center', borderRadius: 6 }}>
                              <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>{f.label}</div>
                              <div style={{ fontSize: 22, fontWeight: 700 }}>{curVal}<span style={{ fontSize: 12 }}>{f.suffix}</span></div>
                              <div style={{ fontSize: 11, marginTop: 2 }}>
                                vs 基线 {prevVal}{f.suffix}：{kpiDelta(curVal, prevVal, f.higher)}
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>

                    {/* 图表模拟（利用率对比条形） */}
                    <Divider style={{ margin: '12px 0' }}>利用率趋势（模拟）</Divider>
                    <div style={{ padding: '0 8px' }}>
                      {versions.map(ver => (
                        <div key={ver.versionId} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={{ fontSize: 11 }}>{ver.label.slice(0, 12)}...</Text>
                            <Text style={{ fontSize: 11 }}>{ver.kpi.utilization}%</Text>
                          </div>
                          <Progress
                            percent={ver.kpi.utilization}
                            size="small"
                            strokeColor={ver.status === 'PUBLISHED' ? '#52c41a' : '#1890ff'}
                            showInfo={false}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </Card>

            {/* 审计日志 */}
            <Card title={<Space><FileTextOutlined />操作审计日志</Space>} size="small" style={{ marginTop: 12 }}>
              <Timeline
                items={[
                  { color: 'green', children: <span style={{ fontSize: 11 }}>排程员小赵 10:30 — 执行排程引擎，生成版本 VER-20260614-003（插单重排）</span> },
                  { color: 'orange', children: <span style={{ fontSize: 11 }}>排程员小赵 10:15 — 审批事件 EVT-001（紧急插单），已通过</span> },
                  { color: 'blue', children: <span style={{ fontSize: 11 }}>系统自动 08:00 — 滚动区自动重排，QC等待事件 EVT-002 已应用</span> },
                  { color: 'gray', children: <span style={{ fontSize: 11 }}>系统自动 2026-06-13 17:00 — 日终自动排程，生成版本 VER-20260613-001</span> },
                  { color: 'gray', children: <span style={{ fontSize: 11 }}>排程主管王经理 2026-06-12 08:00 — 发布基线版本 VER-20260612-001</span> },
                ]}
              />
            </Card>
          </Col>
        </Row>

        {/* 回滚确认 Modal */}
        <Modal
          title={<Space><RollbackOutlined />确认回滚版本</Space>}
          open={!!rollbackTarget}
          onOk={() => rollbackTarget && rollbackVersion(rollbackTarget)}
          onCancel={() => setRollback(null)}
          okText="确认回滚"
          okType="danger"
          cancelText="取消"
        >
          {rollbackTarget && (
            <>
              <Alert type="error" showIcon
                message="回滚为不可逆操作（POC模式），将丢弃当前版本所有排程变更"
                style={{ marginBottom: 12 }} />
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="目标版本">{rollbackTarget.versionId}</Descriptions.Item>
                <Descriptions.Item label="版本说明">{rollbackTarget.label}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{dayjs(rollbackTarget.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                <Descriptions.Item label="条目数">{rollbackTarget.itemCount} 个排程条目</Descriptions.Item>
              </Descriptions>
            </>
          )}
        </Modal>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Tab 6 — 约束配置面板
  // ═══════════════════════════════════════════════════════════
  const renderConstraintTab = () => {
    const hardRules  = constraints.filter(r => r.level === 'HARD');
    const softRules  = constraints.filter(r => r.level === 'SOFT');

    return (
      <div>
        <Alert type="warning" showIcon
          message="约束配置说明：硬约束（HARD）停用将允许违规排程，务必谨慎！软约束（SOFT）调整会影响排程优化方向但不阻断排程"
          style={{ marginBottom: 12, borderRadius: 6 }} />

        <Row gutter={16}>
          {/* 硬约束 */}
          <Col span={12}>
            <Card
              title={<Space><LockOutlined style={{ color: '#f5222d' }} /><span style={{ color: '#f5222d' }}>硬约束规则（HARD）</span></Space>}
              size="small"
            >
              <List
                dataSource={hardRules}
                renderItem={rule => (
                  <List.Item style={{ padding: '10px 12px', borderRadius: 6, marginBottom: 4, border: '1px solid #f0f0f0', background: rule.enabled ? '#fff' : '#fafafa' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Space>
                          <Tag color="red" style={{ fontSize: 10 }}>{rule.id}</Tag>
                          <Text strong style={{ fontSize: 12 }}>{rule.name}</Text>
                        </Space>
                        <Popconfirm
                          title={rule.enabled ? '警告：停用硬约束将允许违规排程，确认停用？' : '确认重新启用此约束规则？'}
                          onConfirm={() => toggleConstraint(rule.id, !rule.enabled)}
                          okType={rule.enabled ? 'danger' : 'primary'}
                          okText={rule.enabled ? '确认停用' : '确认启用'}
                        >
                          <Switch
                            checked={rule.enabled}
                            size="small"
                            checkedChildren="启用"
                            unCheckedChildren="停用"
                          />
                        </Popconfirm>
                      </div>
                      <div style={{ fontSize: 11, color: '#595959', marginBottom: 4 }}>{rule.description}</div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', background: '#f6f6f6', padding: '2px 6px', borderRadius: 3, color: '#8c8c8c' }}>
                        {rule.ruleLogic}
                      </div>
                      {rule.suggestion && (
                        <div style={{ fontSize: 10, color: '#1890ff', marginTop: 4 }}>💡 {rule.suggestion}</div>
                      )}
                      <div style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: 10, color: '#8c8c8c' }}>权重：{rule.weight}</Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* 软约束 + 相似产品规则 */}
          <Col span={12}>
            <Card
              title={<Space><UnlockOutlined style={{ color: '#1890ff' }} /><span style={{ color: '#1890ff' }}>软约束规则（SOFT）</span></Space>}
              size="small"
              style={{ marginBottom: 12 }}
            >
              <List
                dataSource={softRules}
                renderItem={rule => (
                  <List.Item style={{ padding: '10px 12px', borderRadius: 6, marginBottom: 4, border: '1px solid #f0f0f0' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Space>
                          <Tag color="blue" style={{ fontSize: 10 }}>{rule.id}</Tag>
                          <Text strong style={{ fontSize: 12 }}>{rule.name}</Text>
                        </Space>
                        <Switch
                          checked={rule.enabled}
                          size="small"
                          checkedChildren="启用"
                          unCheckedChildren="停用"
                          onChange={v => toggleConstraint(rule.id, v)}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: '#595959', marginBottom: 4 }}>{rule.description}</div>
                      <Space>
                        <Text style={{ fontSize: 10, color: '#8c8c8c' }}>权重：</Text>
                        <InputNumber
                          size="small"
                          value={rule.weight}
                          min={1}
                          max={500}
                          style={{ width: 70 }}
                          onChange={val => {
                            if (val !== null) {
                              setConstraints(prev => prev.map(r => r.id === rule.id ? { ...r, weight: val } : r));
                            }
                          }}
                        />
                      </Space>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            {/* 清场规则卡片 */}
            <Card title={<Space><ToolOutlined />清场规则（只读）</Space>} size="small">
              {(Object.entries(CLEANING_RULES) as [CleanType, typeof CLEANING_RULES[CleanType]][])
                .filter(([k]) => k !== 'NONE')
                .map(([type, rule]) => (
                  <div key={type} style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 6, border: `1px solid ${rule.color}33`, background: `${rule.color}08` }}>
                    <Space style={{ marginBottom: 4 }}>
                      <Tag color={rule.color} style={{ fontWeight: 600 }}>{rule.label}</Tag>
                      <Tag>{rule.durationMinutes}分钟</Tag>
                      {rule.requireQA && <Tag color="red">QA必须</Tag>}
                      {rule.requirePhoto && <Tag color="blue">需拍照</Tag>}
                    </Space>
                    <div style={{ fontSize: 10, color: '#8c8c8c' }}>步骤数：{rule.steps.length} 步 · {rule.steps.slice(0, 2).join(' → ')}...</div>
                  </div>
                ))
              }
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // 主渲染
  // ═══════════════════════════════════════════════════════════
  const pendingEvents = events.filter(e => e.status === 'PENDING').length;
  const conflictCount = scheduleItems.flatMap(i => i.constraintViolations).filter(v => v.severity === 'HARD').length;
  const cleanPending  = cleanTaskList.filter(t => t.status !== 'COMPLETED').length;

  return (
    <div style={{ padding: '16px 20px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 页面头 */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a4e 0%, #2d2d7a 50%, #1a3a5c 100%)',
        borderRadius: 12, padding: '16px 24px', marginBottom: 16, color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
            <ScheduleOutlined style={{ marginRight: 10 }} />
            浮动排程引擎（MES-FSE-001）
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            前向排程 · EDD优先级 · GMP硬约束 · 清场规则 · 事件驱动重排 · 版本管理
          </div>
        </div>
        <Space wrap>
          <Tag color="blue" style={{ fontSize: 11 }}>
            南京（NJ）D级 + 溧水（LS）C级
          </Tag>
          <Tag color={conflictCount > 0 ? 'red' : 'green'} style={{ fontSize: 11 }}>
            {conflictCount > 0 ? `⚠ ${conflictCount}个冲突` : '✓ 无冲突'}
          </Tag>
          <Tag color="gold" style={{ fontSize: 11 }}>
            {dayjs(TODAY_STR).format('YYYY-MM-DD')} 当前
          </Tag>
        </Space>
      </div>

      {/* 主 Tabs */}
      <Card style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} bodyStyle={{ padding: '0 16px 16px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          items={[
            {
              key: 'gantt',
              label: (
                <Space>
                  <ScheduleOutlined />
                  甘特图总览
                  {conflictCount > 0 && <Badge count={conflictCount} size="small" />}
                </Space>
              ),
              children: renderGanttTab(),
            },
            {
              key: 'workorders',
              label: (
                <Space>
                  <FileTextOutlined />
                  工单列表
                  <Badge count={MOCK_SCHEDULE_WOS.filter(w => w.isUrgent || w.isInsertOrder).length} size="small" />
                </Space>
              ),
              children: renderWoTab(),
            },
            {
              key: 'cleaning',
              label: (
                <Space>
                  <ToolOutlined />
                  清场看板
                  {cleanPending > 0 && <Badge count={cleanPending} size="small" />}
                </Space>
              ),
              children: renderCleanTab(),
            },
            {
              key: 'events',
              label: (
                <Space>
                  <ExclamationCircleOutlined />
                  事件重排
                  {pendingEvents > 0 && <Badge count={pendingEvents} size="small" />}
                </Space>
              ),
              children: renderEventTab(),
            },
            {
              key: 'versions',
              label: <Space><HistoryOutlined />版本管理</Space>,
              children: renderVersionTab(),
            },
            {
              key: 'constraints',
              label: <Space><SettingOutlined />约束配置</Space>,
              children: renderConstraintTab(),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default SchedulingPage;
