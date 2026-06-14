/**
 * 浮动排程主页面 — MES-FSE-001
 * PRD §4 页面清单：PG-001甘特图 + PG-006清场看板 + 事件面板 + 版本管理 + KPI
 * 双工厂：南京（固体制剂D级）+ 溧水（益生菌冷链C级）
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Row, Col, Card, Button, Select, Space, Tag, Badge,
  Table, Tabs, Modal, Form, Input, Tooltip, Statistic,
  Timeline, Drawer, Steps, Checkbox, Divider, Alert,
  Typography, message, Descriptions, Progress, Radio,
} from 'antd';
import {
  CalendarOutlined,
  ThunderboltOutlined,
  ScheduleOutlined,
  SyncOutlined,
  CloudOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
  RocketOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  LeftOutlined,
  RightOutlined,
  BarChartOutlined,
  ToolOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import GanttChart from './GanttChart';
import {
  ScheduleItem,
  Resource,
  CleaningTask,
  RescheduleEvent,
  ScheduleVersion,
  ViewMode,
  Factory,
  MOCK_SCHEDULE_ITEMS,
  MOCK_RESOURCES,
  MOCK_CLEANING_TASKS,
  MOCK_RESCHEDULE_EVENTS,
  MOCK_SCHEDULE_VERSIONS,
  MOCK_SCHEDULE_WOS,
  SCHEDULE_STATUS_COLOR,
  SCHEDULE_STATUS_LABEL,
  WO_STATUS_COLOR,
  WO_STATUS_LABEL,
  CLEAN_STATUS_COLOR,
  CLEAN_STATUS_LABEL,
  RESCHEDULE_EVENT_LABEL,
  RESCHEDULE_EVENT_COLOR,
  TIME_ZONE_LABEL,
} from '../../store/schedulingStore';

dayjs.locale('zh-cn');
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// ─────────────────────────────────────────────
// KPI 卡片数据
// ─────────────────────────────────────────────
interface KpiData {
  utilization: number;
  otdRate: number;
  cleaningWaste: number;
  urgentCount: number;
  pendingEvents: number;
  scheduledWos: number;
}

function calcKpi(
  items: ScheduleItem[],
  events: RescheduleEvent[],
): KpiData {
  const cur = MOCK_SCHEDULE_VERSIONS[0].kpi;
  return {
    utilization:  cur.utilization,
    otdRate:      cur.otdRate,
    cleaningWaste: cur.cleaningWaste,
    urgentCount:  items.filter(i => i.notes?.includes('插单')).length,
    pendingEvents: events.filter(e => e.status === 'PENDING').length,
    scheduledWos:  MOCK_SCHEDULE_WOS.filter(w => w.status !== 'PENDING').length,
  };
}

// ─────────────────────────────────────────────
// 排程引擎（前端模拟：EDD优先级 + GMP硬约束）
// ─────────────────────────────────────────────
function runSchedulingEngine(
  pendingWoNos: string[],
  existingItems: ScheduleItem[],
): { newItems: ScheduleItem[]; violations: string[] } {
  const violations: string[] = [];
  const newItems: ScheduleItem[] = [];

  pendingWoNos.forEach(woNo => {
    const wo = MOCK_SCHEDULE_WOS.find(w => w.woNo === woNo);
    if (!wo) return;

    // 模拟：插单约束校验
    if (wo.isInsertOrder) {
      violations.push(`插单 ${woNo} 需通过GMP审批（冻结区T+0~T+2）`);
    }
    // 模拟：冷链资源分配
    if (wo.factory === 'LS') {
      const coldResource = MOCK_RESOURCES.find(r => r.id === 'R-LS-PROBIO');
      if (coldResource?.status === 'BREAKDOWN') {
        violations.push(`溧水冷链车间故障，${woNo} 无法排程`);
      }
    }
  });

  message.success(`排程引擎已运行，处理 ${pendingWoNos.length} 个工单，发现 ${violations.length} 个约束冲突`);
  return { newItems, violations };
}

// ─────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────
const SchedulingPage: React.FC = () => {
  // ── 状态 ─────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [startDate, setStartDate] = useState(dayjs('2026-06-13'));
  const [factoryFilter, setFactoryFilter] = useState<Factory | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState('gantt');
  const [selectedVersion, setSelectedVersion] = useState(MOCK_SCHEDULE_VERSIONS[0].versionId);
  const [engineRunning, setEngineRunning] = useState(false);

  // Drawer/Modal
  const [drawerItem, setDrawerItem] = useState<ScheduleItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cleanDrawer, setCleanDrawer] = useState<CleaningTask | null>(null);
  const [cleanDrawerOpen, setCleanDrawerOpen] = useState(false);
  const [eventModal, setEventModal] = useState<RescheduleEvent | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [engineModal, setEngineModal] = useState(false);
  const [engineResult, setEngineResult] = useState<{ violations: string[] } | null>(null);

  // ── 数据 ─────────────────────────────────────
  const [items]       = useState<ScheduleItem[]>(MOCK_SCHEDULE_ITEMS);
  const resources      = MOCK_RESOURCES;
  const cleanTasks     = MOCK_CLEANING_TASKS;
  const events         = MOCK_RESCHEDULE_EVENTS;
  const versions       = MOCK_SCHEDULE_VERSIONS;

  const kpi = useMemo(() => calcKpi(items, events), [items, events]);

  // ── 视图导航 ─────────────────────────────────
  const handlePrev = useCallback(() => {
    const step = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 14;
    setStartDate(d => d.subtract(step, 'day'));
  }, [viewMode]);

  const handleNext = useCallback(() => {
    const step = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 14;
    setStartDate(d => d.add(step, 'day'));
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setStartDate(dayjs('2026-06-13'));
  }, []);

  // ── 排程引擎 ─────────────────────────────────
  const handleRunEngine = useCallback(() => {
    setEngineRunning(true);
    const pendingWoNos = MOCK_SCHEDULE_WOS
      .filter(w => w.status === 'PENDING')
      .map(w => w.woNo);
    setTimeout(() => {
      const result = runSchedulingEngine(pendingWoNos, items);
      setEngineResult(result);
      setEngineRunning(false);
      setEngineModal(true);
    }, 1800);
  }, [items]);

  // ── 甘特图item点击 ────────────────────────────
  const handleItemClick = useCallback((item: ScheduleItem) => {
    setDrawerItem(item);
    setDrawerOpen(true);
  }, []);

  // ── 事件处理 ─────────────────────────────────
  const handleApproveEvent = useCallback((evt: RescheduleEvent) => {
    message.success(`事件 ${evt.id} 已审批通过，重排已应用`);
    setEventModalOpen(false);
  }, []);

  const handleRejectEvent = useCallback((evt: RescheduleEvent) => {
    message.warning(`事件 ${evt.id} 已驳回`);
    setEventModalOpen(false);
  }, []);

  // ── 视图标题 ─────────────────────────────────
  const viewTitle = useMemo(() => {
    if (viewMode === 'day')   return startDate.format('YYYY年MM月DD日');
    if (viewMode === 'week')  return `${startDate.format('MM/DD')} ~ ${startDate.add(6, 'day').format('MM/DD')}（周视图）`;
    return `${startDate.format('MM/DD')} ~ ${startDate.add(13, 'day').format('MM/DD')}（双周视图）`;
  }, [viewMode, startDate]);

  // ─────────────────────────────────────────────
  // 工单列表列
  // ─────────────────────────────────────────────
  const woColumns = [
    {
      title: '工单号', dataIndex: 'woNo', width: 175,
      render: (v: string, r: typeof MOCK_SCHEDULE_WOS[0]) => (
        <Space size={4}>
          <Text code style={{ fontSize: 11 }}>{v}</Text>
          {r.isInsertOrder && <Tag color="volcano" style={{ fontSize: 10, padding: '0 3px' }}>插单</Tag>}
          {r.isUrgent      && <Tag color="red"     style={{ fontSize: 10, padding: '0 3px' }}>紧急</Tag>}
        </Space>
      ),
    },
    {
      title: '产品', dataIndex: 'productName', width: 160,
      render: (v: string, r: typeof MOCK_SCHEDULE_WOS[0]) => (
        <Space size={3}>
          {r.factory === 'LS' && <CloudOutlined style={{ color: '#40a9ff', fontSize: 11 }} />}
          <span style={{ fontSize: 12 }}>{v}</span>
        </Space>
      ),
    },
    { title: '批次', dataIndex: 'batchNo', width: 130, render: (v: string) => <Text style={{ fontSize: 11 }} type="secondary">{v}</Text> },
    {
      title: '工厂', dataIndex: 'factory', width: 80,
      render: (v: Factory) => <Tag color={v === 'NJ' ? 'blue' : 'green'}>{v === 'NJ' ? '南京' : '溧水'}</Tag>,
    },
    {
      title: '优先级', dataIndex: 'priority', width: 80,
      render: (v: number) => {
        const colors = ['', 'default', 'processing', 'warning', 'orange', 'red'];
        return <Badge color={v >= 5 ? '#f5222d' : v === 4 ? '#faad14' : '#52c41a'} text={`P${v}`} />;
      },
    },
    {
      title: '计划数量', dataIndex: 'plannedQty', width: 110,
      render: (v: number, r: typeof MOCK_SCHEDULE_WOS[0]) =>
        <span>{v.toLocaleString()}{r.unit}</span>,
    },
    {
      title: '交货期', dataIndex: 'dueDate', width: 115,
      render: (v: string) => {
        const d = dayjs(v);
        const diff = d.diff(dayjs('2026-06-14'), 'day');
        return (
          <span style={{ color: diff < 2 ? '#f5222d' : diff < 5 ? '#faad14' : '#262626', fontWeight: diff < 2 ? 600 : 400 }}>
            {d.format('MM-DD')} {diff < 2 && <WarningOutlined />}
          </span>
        );
      },
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v: string) => (
        <Tag color={WO_STATUS_COLOR[v as keyof typeof WO_STATUS_COLOR]}>
          {WO_STATUS_LABEL[v as keyof typeof WO_STATUS_LABEL]}
        </Tag>
      ),
    },
    { title: '工艺路径', dataIndex: 'routingCode', width: 165, render: (v: string) => <Text style={{ fontSize: 11 }} type="secondary">{v}</Text> },
  ];

  // ─────────────────────────────────────────────
  // 清场列表列
  // ─────────────────────────────────────────────
  const cleanColumns = [
    {
      title: '任务ID', dataIndex: 'id', width: 110,
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
    },
    { title: '资源', dataIndex: 'resourceName', width: 150 },
    {
      title: '工厂', dataIndex: 'factory', width: 70,
      render: (v: Factory) => <Tag color={v === 'NJ' ? 'blue' : 'green'}>{v === 'NJ' ? '南京' : '溧水'}</Tag>,
    },
    {
      title: '换产', width: 220,
      render: (_: any, r: CleaningTask) => (
        <span style={{ fontSize: 12 }}>
          <Text type="secondary">{r.prevProductName}</Text>
          <span style={{ margin: '0 6px', color: '#bbb' }}>→</span>
          <Text strong>{r.nextProductName}</Text>
          {r.isSameProduct && <Tag color="cyan" style={{ marginLeft: 6, fontSize: 10 }}>同品种</Tag>}
        </span>
      ),
    },
    {
      title: '计划时长', dataIndex: 'durationMinutes', width: 90,
      render: (v: number) => `${v}分钟`,
    },
    {
      title: '开始时间', dataIndex: 'startTime', width: 120,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v: string) => (
        <Badge
          status={CLEAN_STATUS_COLOR[v as keyof typeof CLEAN_STATUS_COLOR] as any}
          text={CLEAN_STATUS_LABEL[v as keyof typeof CLEAN_STATUS_LABEL]}
        />
      ),
    },
    {
      title: '进度', width: 130,
      render: (_: any, r: CleaningTask) => {
        const total = r.checkItems.length;
        const done  = r.checkItems.filter(c => c.checked).length;
        const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Progress percent={pct} size="small" status={r.status === 'FAILED' ? 'exception' : r.status === 'COMPLETED' ? 'success' : 'active'} />
            <Text type="secondary" style={{ fontSize: 10 }}>{done}/{total} 项</Text>
          </Space>
        );
      },
    },
    {
      title: '操作', width: 80,
      render: (_: any, r: CleaningTask) => (
        <Button
          size="small"
          type={r.status === 'IN_PROGRESS' ? 'primary' : 'default'}
          onClick={() => { setCleanDrawer(r); setCleanDrawerOpen(true); }}
        >
          {r.status === 'IN_PROGRESS' ? '执行' : '详情'}
        </Button>
      ),
    },
  ];

  // ─────────────────────────────────────────────
  // 事件列表列
  // ─────────────────────────────────────────────
  const eventColumns = [
    {
      title: '事件ID', dataIndex: 'id', width: 110,
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '类型', dataIndex: 'type', width: 110,
      render: (v: string) => (
        <Tag color={RESCHEDULE_EVENT_COLOR[v as keyof typeof RESCHEDULE_EVENT_COLOR]}>
          {RESCHEDULE_EVENT_LABEL[v as keyof typeof RESCHEDULE_EVENT_LABEL]}
        </Tag>
      ),
    },
    {
      title: '触发时间', dataIndex: 'triggeredAt', width: 120,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '描述', dataIndex: 'description', ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '需审批', dataIndex: 'requireApproval', width: 80,
      render: (v: boolean) => v
        ? <Tag color="orange">需审批</Tag>
        : <Tag color="green">自动处理</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v: string) => {
        const map: Record<string, string> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error', APPLIED: 'processing' };
        const label: Record<string, string> = { PENDING: '待处理', APPROVED: '已批准', REJECTED: '已驳回', APPLIED: '已应用' };
        return <Badge status={map[v] as any} text={label[v]} />;
      },
    },
    {
      title: '操作', width: 80,
      render: (_: any, r: RescheduleEvent) => (
        <Button
          size="small"
          type={r.status === 'PENDING' ? 'primary' : 'default'}
          danger={r.status === 'PENDING' && r.requireApproval}
          onClick={() => { setEventModal(r); setEventModalOpen(true); }}
        >
          {r.status === 'PENDING' ? '处理' : '详情'}
        </Button>
      ),
    },
  ];

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div style={{ padding: '16px 20px', background: '#f5f7fa', minHeight: '100%' }}>

      {/* ── 页头 ────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScheduleOutlined style={{ color: '#1890FF' }} />
            浮动排程引擎（MES-FSE-001）
            <Tag color="processing" style={{ fontWeight: 400, fontSize: 12 }}>当前版本: {versions[0].label}</Tag>
          </Title>
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            GMP合规 · 双工厂架构 · EDD优先级 · 事件驱动重排 · 清场-BPR联动
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<RocketOutlined />}
            loading={engineRunning}
            onClick={handleRunEngine}
          >
            {engineRunning ? '排程引擎运行中...' : '执行自动排程'}
          </Button>
          <Button icon={<SyncOutlined />} onClick={() => message.info('重排引擎已触发，滚动区自动更新')}>
            触发重排
          </Button>
        </Space>
      </div>

      {/* ── KPI卡片 ──────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: 8 }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>设备利用率</span>}
              value={kpi.utilization}
              suffix="%"
              precision={1}
              valueStyle={{ fontSize: 20, color: kpi.utilization >= 75 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: 8 }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>准时交货率(OTD)</span>}
              value={kpi.otdRate}
              suffix="%"
              precision={1}
              valueStyle={{ fontSize: 20, color: kpi.otdRate >= 90 ? '#52c41a' : '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: 8 }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>清场浪费（小时）</span>}
              value={kpi.cleaningWaste}
              precision={1}
              valueStyle={{ fontSize: 20, color: '#faad14' }}
              suffix="h"
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: 8 }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>本期插单数</span>}
              value={kpi.urgentCount}
              valueStyle={{ fontSize: 20, color: kpi.urgentCount > 0 ? '#f5222d' : '#52c41a' }}
              suffix="单"
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: 8 }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>待处理事件</span>}
              value={kpi.pendingEvents}
              valueStyle={{ fontSize: 20, color: kpi.pendingEvents > 0 ? '#f5222d' : '#52c41a' }}
              suffix="件"
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ textAlign: 'center', borderRadius: 8 }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>已排程工单</span>}
              value={kpi.scheduledWos}
              valueStyle={{ fontSize: 20, color: '#1890FF' }}
              suffix={`/${MOCK_SCHEDULE_WOS.length}`}
            />
          </Card>
        </Col>
      </Row>

      {/* ── 待处理事件告警 ───────────────────── */}
      {events.filter(e => e.status === 'PENDING').map(e => (
        <Alert
          key={e.id}
          type={e.requireApproval ? 'error' : 'warning'}
          showIcon
          closable
          style={{ marginBottom: 10, borderRadius: 6 }}
          message={
            <Space>
              <Tag color={RESCHEDULE_EVENT_COLOR[e.type]}>{RESCHEDULE_EVENT_LABEL[e.type]}</Tag>
              <span style={{ fontSize: 12 }}>{e.description.slice(0, 60)}...</span>
            </Space>
          }
          action={
            <Button
              size="small"
              type={e.requireApproval ? 'primary' : 'default'}
              danger={e.requireApproval}
              onClick={() => { setEventModal(e); setEventModalOpen(true); }}
            >
              {e.requireApproval ? '立即审批' : '查看'}
            </Button>
          }
        />
      ))}

      {/* ── 主内容Tabs ──────────────────────── */}
      <Card
        style={{ borderRadius: 8 }}
        bodyStyle={{ padding: 0 }}
        tabList={[
          { key: 'gantt',    tab: <span><CalendarOutlined /> 排程甘特图</span> },
          { key: 'wo-list',  tab: <span><ScheduleOutlined /> 工单列表</span> },
          { key: 'cleaning', tab: (
            <span>
              <ToolOutlined /> 清场看板
              {cleanTasks.filter(t => t.status === 'IN_PROGRESS').length > 0 && (
                <Badge count={cleanTasks.filter(t => t.status === 'IN_PROGRESS').length} style={{ marginLeft: 6 }} />
              )}
            </span>
          )},
          { key: 'events',   tab: (
            <span>
              <BranchesOutlined /> 重排事件
              {events.filter(e => e.status === 'PENDING').length > 0 && (
                <Badge count={events.filter(e => e.status === 'PENDING').length} style={{ marginLeft: 6 }} />
              )}
            </span>
          )},
          { key: 'versions', tab: <span><HistoryOutlined /> 版本管理</span> },
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
      >
        {/* ── 甘特图 Tab ─────────────────────── */}
        {activeTab === 'gantt' && (
          <div style={{ padding: '12px 16px 16px' }}>
            {/* 甘特图工具栏 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Space>
                <Button icon={<LeftOutlined />}  size="small" onClick={handlePrev} />
                <Button size="small" onClick={handleToday}>今天</Button>
                <Button icon={<RightOutlined />} size="small" onClick={handleNext} />
                <Text style={{ fontSize: 13, fontWeight: 500, minWidth: 180 }}>{viewTitle}</Text>
              </Space>
              <Space>
                <Radio.Group
                  value={viewMode}
                  onChange={e => setViewMode(e.target.value)}
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="day">日视图</Radio.Button>
                  <Radio.Button value="week">周视图</Radio.Button>
                  <Radio.Button value="biweek">双周视图</Radio.Button>
                </Radio.Group>
                <Select
                  value={factoryFilter}
                  onChange={v => setFactoryFilter(v)}
                  size="small"
                  style={{ width: 110 }}
                >
                  <Option value="ALL">全部工厂</Option>
                  <Option value="NJ">南京工厂</Option>
                  <Option value="LS">溧水工厂</Option>
                </Select>
              </Space>
            </div>

            <GanttChart
              items={items}
              resources={resources}
              viewMode={viewMode}
              startDate={startDate}
              factoryFilter={factoryFilter}
              onItemClick={handleItemClick}
            />
          </div>
        )}

        {/* ── 工单列表 Tab ───────────────────── */}
        {activeTab === 'wo-list' && (
          <div style={{ padding: '12px 16px 16px' }}>
            <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
              <Select defaultValue="ALL" size="small" style={{ width: 110 }}>
                <Option value="ALL">全部工厂</Option>
                <Option value="NJ">南京工厂</Option>
                <Option value="LS">溧水工厂</Option>
              </Select>
              <Select defaultValue="ALL" size="small" style={{ width: 110 }}>
                <Option value="ALL">全部状态</Option>
                <Option value="PENDING">待排程</Option>
                <Option value="RUNNING">生产中</Option>
                <Option value="SCHEDULED">已排程</Option>
              </Select>
              <Tag color="volcano" style={{ lineHeight: '28px' }}>
                <ThunderboltOutlined /> 插单: {MOCK_SCHEDULE_WOS.filter(w => w.isInsertOrder).length}
              </Tag>
              <Tag color="red" style={{ lineHeight: '28px' }}>
                <WarningOutlined /> 紧急: {MOCK_SCHEDULE_WOS.filter(w => w.isUrgent).length}
              </Tag>
            </div>
            <Table
              dataSource={MOCK_SCHEDULE_WOS}
              columns={woColumns}
              rowKey="woNo"
              size="small"
              pagination={false}
              scroll={{ x: 1100 }}
              rowClassName={r =>
                r.isInsertOrder ? 'row-urgent' : r.isUrgent ? 'row-warning' : ''
              }
            />
          </div>
        )}

        {/* ── 清场看板 Tab ───────────────────── */}
        {activeTab === 'cleaning' && (
          <div style={{ padding: '12px 16px 16px' }}>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12, borderRadius: 6 }}
              message="清场-BPR联动：清场完成并QA签字后，自动生成BPR清场记录章节，并解除下一工单的资源占用锁定。"
            />
            <Table
              dataSource={cleanTasks}
              columns={cleanColumns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 1000 }}
              rowClassName={r =>
                r.status === 'IN_PROGRESS' ? 'row-warning' :
                r.status === 'FAILED'      ? 'row-urgent' : ''
              }
            />
          </div>
        )}

        {/* ── 重排事件 Tab ───────────────────── */}
        {activeTab === 'events' && (
          <div style={{ padding: '12px 16px 16px' }}>
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12, borderRadius: 6 }}
              message="事件驱动重排策略：T+0~T+2冻结区变更需人工审批；T+3~T+14滚动区自动重排并推送建议。"
            />
            <Table
              dataSource={events}
              columns={eventColumns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 900 }}
              rowClassName={r =>
                r.status === 'PENDING' && r.requireApproval ? 'row-urgent' :
                r.status === 'PENDING' ? 'row-warning' : ''
              }
            />
          </div>
        )}

        {/* ── 版本管理 Tab ───────────────────── */}
        {activeTab === 'versions' && (
          <div style={{ padding: '12px 16px 16px' }}>
            <Row gutter={[12, 12]}>
              {versions.map(ver => (
                <Col span={8} key={ver.versionId}>
                  <Card
                    size="small"
                    style={{
                      borderRadius: 8,
                      border: ver.versionId === selectedVersion
                        ? '2px solid #1890FF'
                        : '1px solid #f0f0f0',
                    }}
                    extra={
                      ver.isBaseline
                        ? <Tag color="gold">基线</Tag>
                        : ver.status === 'PUBLISHED'
                          ? <Tag color="green">当前发布</Tag>
                          : <Tag color="default">已归档</Tag>
                    }
                    title={
                      <Space>
                        <HistoryOutlined />
                        <Text style={{ fontSize: 13 }}>{ver.label}</Text>
                      </Space>
                    }
                    actions={[
                      <Button
                        key="select"
                        type={ver.versionId === selectedVersion ? 'primary' : 'default'}
                        size="small"
                        onClick={() => { setSelectedVersion(ver.versionId); message.success(`已切换至版本: ${ver.label}`); }}
                      >
                        {ver.versionId === selectedVersion ? '当前版本' : '切换'}
                      </Button>,
                      <Button
                        key="compare"
                        size="small"
                        onClick={() => message.info('版本对比功能：可对比KPI差异和任务变动')}
                      >
                        对比
                      </Button>,
                    ]}
                  >
                    <Descriptions size="small" column={1} style={{ fontSize: 12 }}>
                      <Descriptions.Item label="创建时间">
                        {dayjs(ver.createdAt).format('MM-DD HH:mm')}
                      </Descriptions.Item>
                      <Descriptions.Item label="创建人">{ver.createdBy}</Descriptions.Item>
                      <Descriptions.Item label="排程条目">{ver.itemCount}个</Descriptions.Item>
                    </Descriptions>
                    <Divider style={{ margin: '8px 0' }} />
                    <Row gutter={8}>
                      <Col span={12}>
                        <Statistic
                          title={<span style={{ fontSize: 11 }}>利用率</span>}
                          value={ver.kpi.utilization}
                          suffix="%"
                          precision={1}
                          valueStyle={{ fontSize: 16, color: ver.kpi.utilization >= 75 ? '#52c41a' : '#faad14' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title={<span style={{ fontSize: 11 }}>OTD率</span>}
                          value={ver.kpi.otdRate}
                          suffix="%"
                          precision={1}
                          valueStyle={{ fontSize: 16, color: ver.kpi.otdRate >= 90 ? '#52c41a' : '#f5222d' }}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Card>

      {/* ─────────────────────────────────────────
       * Drawer: 排程条目详情
       * ─────────────────────────────────────────*/}
      <Drawer
        title={
          <Space>
            <CalendarOutlined />
            排程条目详情
            {drawerItem && (
              <Tag color={drawerItem.color || SCHEDULE_STATUS_COLOR[drawerItem.status]}>
                {SCHEDULE_STATUS_LABEL[drawerItem.status]}
              </Tag>
            )}
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
      >
        {drawerItem && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="工单号">{drawerItem.woNo}</Descriptions.Item>
              <Descriptions.Item label="产品名称">{drawerItem.productName}</Descriptions.Item>
              <Descriptions.Item label="工序">{drawerItem.opNo} — {drawerItem.opName}</Descriptions.Item>
              <Descriptions.Item label="资源">{drawerItem.resourceName}</Descriptions.Item>
              <Descriptions.Item label="洁净级别">{drawerItem.cleanRoomLevel}</Descriptions.Item>
              <Descriptions.Item label="工厂">
                <Tag color={drawerItem.factory === 'NJ' ? 'blue' : 'green'}>
                  {drawerItem.factory === 'NJ' ? '南京工厂' : '溧水工厂'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">{dayjs(drawerItem.startTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{dayjs(drawerItem.endTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="工序时长">{drawerItem.durationMinutes}分钟</Descriptions.Item>
              <Descriptions.Item label="时间分区">{TIME_ZONE_LABEL[drawerItem.timeZone]}</Descriptions.Item>
              <Descriptions.Item label="冻结锁定">{drawerItem.isLocked ? '是（需审批修改）' : '否（可滚动调整）'}</Descriptions.Item>
              <Descriptions.Item label="冷链">
                {drawerItem.isColdChain
                  ? <Tag color="blue"><CloudOutlined /> 全程≤8℃冷链</Tag>
                  : '否'}
              </Descriptions.Item>
              <Descriptions.Item label="软约束得分">
                <Progress percent={drawerItem.softScore} size="small" status={drawerItem.softScore >= 85 ? 'success' : 'normal'} />
              </Descriptions.Item>
            </Descriptions>

            {drawerItem.constraintViolations.length > 0 && (
              <>
                <Divider>约束校验结果</Divider>
                {drawerItem.constraintViolations.map((v, i) => (
                  <Alert
                    key={i}
                    type={v.severity === 'HARD' ? 'error' : 'warning'}
                    showIcon
                    message={v.message}
                    description={v.suggestion && `建议：${v.suggestion}`}
                    style={{ marginBottom: 8 }}
                  />
                ))}
              </>
            )}

            {drawerItem.notes && (
              <>
                <Divider>备注</Divider>
                <Alert type="info" message={drawerItem.notes} />
              </>
            )}

            <Divider />
            <Space>
              {!drawerItem.isLocked && (
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => { message.info('手工调整功能：拖拽重排（滚动区）'); setDrawerOpen(false); }}
                >
                  手工调整
                </Button>
              )}
              {drawerItem.isLocked && (
                <Button
                  danger
                  icon={<ExclamationCircleOutlined />}
                  onClick={() => { message.warning('冻结区调整需提交审批流程'); }}
                >
                  申请解锁
                </Button>
              )}
              <Button onClick={() => setDrawerOpen(false)}>关闭</Button>
            </Space>
          </>
        )}
      </Drawer>

      {/* ─────────────────────────────────────────
       * Drawer: 清场任务执行
       * ─────────────────────────────────────────*/}
      <Drawer
        title={
          <Space>
            <ToolOutlined />
            清场任务执行
            {cleanDrawer && (
              <Badge
                status={CLEAN_STATUS_COLOR[cleanDrawer.status] as any}
                text={CLEAN_STATUS_LABEL[cleanDrawer.status]}
              />
            )}
          </Space>
        }
        open={cleanDrawerOpen}
        onClose={() => setCleanDrawerOpen(false)}
        width={520}
      >
        {cleanDrawer && (
          <>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="资源">{cleanDrawer.resourceName}</Descriptions.Item>
              <Descriptions.Item label="换产方向">
                <Space>
                  <Text type="secondary">{cleanDrawer.prevProductName}</Text>
                  <span>→</span>
                  <Text strong>{cleanDrawer.nextProductName}</Text>
                  {cleanDrawer.isSameProduct && <Tag color="cyan">同品种</Tag>}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="计划时长">{cleanDrawer.durationMinutes}分钟</Descriptions.Item>
              <Descriptions.Item label="开始时间">{dayjs(cleanDrawer.startTime).format('MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="操作员">{cleanDrawer.operator || '—'}</Descriptions.Item>
              {cleanDrawer.verifier && (
                <Descriptions.Item label="QA验证人">{cleanDrawer.verifier}</Descriptions.Item>
              )}
            </Descriptions>

            <Divider>清场检查项（{cleanDrawer.checkItems.filter(c => c.checked).length}/{cleanDrawer.checkItems.length}）</Divider>
            {cleanDrawer.checkItems.map(ci => (
              <div key={ci.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #f5f5f5',
              }}>
                <Space size={8}>
                  <Checkbox checked={ci.checked} disabled={cleanDrawer.status === 'COMPLETED'} />
                  <span style={{ fontSize: 13 }}>{ci.item}</span>
                  {ci.required && <Tag color="red" style={{ fontSize: 10, padding: '0 3px' }}>必填</Tag>}
                </Space>
                {ci.result && (
                  <Tag color={ci.result === 'PASS' ? 'success' : 'error'}>{ci.result}</Tag>
                )}
                {!ci.checked && (
                  <Tag color="default">待确认</Tag>
                )}
              </div>
            ))}

            {cleanDrawer.ebrLinked && (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                style={{ marginTop: 16 }}
                message="EBR联动已启用：清场完成后自动写入批生产记录清场章节"
              />
            )}

            <Divider />
            <Space>
              {cleanDrawer.status === 'IN_PROGRESS' && (
                <>
                  <Button type="primary" icon={<CheckCircleOutlined />}
                    onClick={() => { message.success('清场已提交QA审核'); setCleanDrawerOpen(false); }}>
                    提交QA验证
                  </Button>
                  <Button icon={<PauseCircleOutlined />}
                    onClick={() => message.info('清场任务已暂停')}>
                    暂停
                  </Button>
                </>
              )}
              {cleanDrawer.status === 'COMPLETED' && (
                <Alert type="success" message="清场已完成，BPR已自动更新" showIcon style={{ flex: 1 }} />
              )}
              <Button onClick={() => setCleanDrawerOpen(false)}>关闭</Button>
            </Space>
          </>
        )}
      </Drawer>

      {/* ─────────────────────────────────────────
       * Modal: 重排事件处理
       * ─────────────────────────────────────────*/}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            重排事件处理
            {eventModal && (
              <Tag color={RESCHEDULE_EVENT_COLOR[eventModal.type]}>
                {RESCHEDULE_EVENT_LABEL[eventModal.type]}
              </Tag>
            )}
          </Space>
        }
        open={eventModalOpen}
        onCancel={() => setEventModalOpen(false)}
        footer={eventModal?.status === 'PENDING' ? [
          <Button key="reject" danger onClick={() => handleRejectEvent(eventModal!)}>驳回</Button>,
          <Button key="approve" type="primary" onClick={() => handleApproveEvent(eventModal!)}>
            {eventModal?.requireApproval ? '审批通过 & 重排' : '确认应用'}
          </Button>,
        ] : [
          <Button key="close" onClick={() => setEventModalOpen(false)}>关闭</Button>,
        ]}
        width={560}
      >
        {eventModal && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="事件类型">
              <Tag color={RESCHEDULE_EVENT_COLOR[eventModal.type]}>
                {RESCHEDULE_EVENT_LABEL[eventModal.type]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="触发时间">
              {dayjs(eventModal.triggeredAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="影响工单">
              {eventModal.affectedWoNos.map(w => (
                <Tag key={w} color="blue" style={{ marginRight: 4 }}>{w}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="事件描述">
              <Text style={{ fontSize: 12 }}>{eventModal.description}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="处理策略">
              {eventModal.requireApproval
                ? <Alert type="error" message="冻结区（T+0~T+2）变更，需生产主管审批后方可修改排程" showIcon style={{ border: 'none', background: 'transparent' }} />
                : <Alert type="success" message="滚动区（T+3~T+14）变更，系统已自动推算重排方案，点击确认应用" showIcon style={{ border: 'none', background: 'transparent' }} />}
            </Descriptions.Item>
            <Descriptions.Item label="操作员">{eventModal.operator}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* ─────────────────────────────────────────
       * Modal: 排程引擎结果
       * ─────────────────────────────────────────*/}
      <Modal
        title={<Space><RocketOutlined style={{ color: '#52c41a' }} />排程引擎执行结果</Space>}
        open={engineModal}
        onCancel={() => setEngineModal(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setEngineModal(false)}>确认</Button>,
        ]}
        width={520}
      >
        {engineResult && (
          <>
            <Alert
              type={engineResult.violations.length === 0 ? 'success' : 'warning'}
              showIcon
              message={engineResult.violations.length === 0
                ? '排程完成：所有工单均已满足GMP硬约束，无冲突'
                : `排程完成：发现 ${engineResult.violations.length} 个约束提示，请确认处理`}
              style={{ marginBottom: 16 }}
            />
            {engineResult.violations.length > 0 && (
              <>
                <Text strong style={{ fontSize: 13 }}>约束提示：</Text>
                {engineResult.violations.map((v, i) => (
                  <Alert key={i} type="warning" message={v} showIcon style={{ marginTop: 8 }} />
                ))}
              </>
            )}
            <Divider />
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="排程策略">EDD优先级 + 冻结锁定</Descriptions.Item>
              <Descriptions.Item label="算法模式">前向排程</Descriptions.Item>
              <Descriptions.Item label="GMP约束">物料放行/设备/清场/人员资质</Descriptions.Item>
              <Descriptions.Item label="冷链约束">溧水C级≤8℃全程监控</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      {/* 行样式 */}
      <style>{`
        .row-urgent td { background: #fff1f0 !important; }
        .row-urgent:hover td { background: #ffccc7 !important; }
        .row-warning td { background: #fffbe6 !important; }
        .row-warning:hover td { background: #fff1b8 !important; }
      `}</style>
    </div>
  );
};

export default SchedulingPage;
