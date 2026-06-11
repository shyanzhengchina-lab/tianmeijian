/**
 * 车间看板 - 实时工单执行状态（接入真实DB）
 * 调用 /api/dashboard/workshop?factoryCode=NJ 获取看板数据
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Select,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

// ─── Types ──────────────────────────────────────────────────────────────────

interface ActiveOrder {
  wo_code: string;
  product_name: string;
  batch_no: string;
  plan_qty: number;
  actual_qty: number;
  wo_status: number;
  plan_start: string;
  plan_end: string;
  priority: number;
  progress_pct: number;
}

interface TaskStat {
  task_status: number;
  cnt: number;
}

interface WorkshopData {
  activeOrders: ActiveOrder[];
  taskStats: TaskStat[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const WO_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '待投产', color: 'default' },
  2: { label: '生产中', color: 'processing' },
  3: { label: '待检验', color: 'warning' },
  4: { label: '检验中', color: 'gold' },
  5: { label: '已完成', color: 'success' },
  6: { label: '已关闭', color: 'default' },
  7: { label: '已暂停', color: 'error' },
};

const TASK_STATUS_MAP: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  1: { label: '待执行', color: '#8c8c8c', icon: <ClockCircleOutlined /> },
  2: { label: '执行中', color: '#1677ff', icon: <PlayCircleOutlined /> },
  3: { label: '待报工', color: '#faad14', icon: <ExclamationCircleOutlined /> },
  4: { label: '暂停中', color: '#ff7875', icon: <PauseCircleOutlined /> },
  5: { label: '已完成', color: '#52c41a', icon: <CheckCircleOutlined /> },
  6: { label: '已关闭', color: '#d9d9d9', icon: <CheckCircleOutlined /> },
};

const PRIORITY_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '紧急', color: 'red' },
  2: { label: '高', color: 'orange' },
  3: { label: '普通', color: 'blue' },
  4: { label: '低', color: 'default' },
};

const WORKSHOP_OPTIONS = [
  { value: '', label: '全部车间' },
  { value: 'NJ-GD', label: '南京·固体制剂车间' },
  { value: 'LS-GD', label: '丽水·固体制剂车间' },
  { value: 'NJ-RN', label: '南京·软凝胶车间' },
];

const FACTORY_OPTIONS = [
  { value: 'NJ', label: '南京工厂' },
  { value: 'LS', label: '丽水工厂' },
];

// ─── Helper ─────────────────────────────────────────────────────────────────

function getAuthHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('mes_token') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function fmtDate(s: string) {
  if (!s) return '-';
  return s.slice(0, 10);
}

function isOverdue(plan_end: string, wo_status: number) {
  if (!plan_end || wo_status === 5 || wo_status === 6) return false;
  return new Date(plan_end) < new Date();
}

function progressColor(pct: number) {
  if (pct >= 90) return '#52c41a';
  if (pct >= 60) return '#1677ff';
  if (pct >= 30) return '#faad14';
  return '#ff4d4f';
}

// ─── KPI Cards ──────────────────────────────────────────────────────────────

const KpiRow: React.FC<{ data: WorkshopData }> = ({ data }) => {
  const { activeOrders, taskStats } = data;

  const totalActive = activeOrders.length;
  const producing = activeOrders.filter(o => o.wo_status === 2).length;
  const suspended = activeOrders.filter(o => o.wo_status === 7).length;
  const overdueCnt = activeOrders.filter(o => isOverdue(o.plan_end, o.wo_status)).length;

  const taskTotal = taskStats.reduce((s, t) => s + Number(t.cnt), 0);
  const taskRunning = taskStats.filter(t => t.task_status === 2).reduce((s, t) => s + Number(t.cnt), 0);
  const taskDone = taskStats.filter(t => t.task_status === 5).reduce((s, t) => s + Number(t.cnt), 0);
  const taskPending = taskStats.filter(t => t.task_status === 1).reduce((s, t) => s + Number(t.cnt), 0);

  const cards = [
    {
      title: '在制工单',
      value: totalActive,
      suffix: '张',
      icon: <ApartmentOutlined style={{ color: '#1677ff', fontSize: 28 }} />,
      color: '#e6f4ff',
      borderColor: '#91caff',
    },
    {
      title: '生产中',
      value: producing,
      suffix: '张',
      icon: <PlayCircleOutlined style={{ color: '#52c41a', fontSize: 28 }} />,
      color: '#f6ffed',
      borderColor: '#b7eb8f',
    },
    {
      title: '暂停工单',
      value: suspended,
      suffix: '张',
      icon: <PauseCircleOutlined style={{ color: '#faad14', fontSize: 28 }} />,
      color: '#fffbe6',
      borderColor: '#ffe58f',
    },
    {
      title: '超期工单',
      value: overdueCnt,
      suffix: '张',
      icon: <ExclamationCircleOutlined style={{ color: overdueCnt > 0 ? '#ff4d4f' : '#8c8c8c', fontSize: 28 }} />,
      color: overdueCnt > 0 ? '#fff2f0' : '#fafafa',
      borderColor: overdueCnt > 0 ? '#ffccc7' : '#d9d9d9',
    },
    {
      title: '任务单(执行中)',
      value: taskRunning,
      suffix: `/${taskTotal}`,
      icon: <ToolOutlined style={{ color: '#722ed1', fontSize: 28 }} />,
      color: '#f9f0ff',
      borderColor: '#d3adf7',
    },
    {
      title: '任务完成率',
      value: taskTotal > 0 ? Math.round(taskDone / taskTotal * 100) : 0,
      suffix: '%',
      icon: <CheckCircleOutlined style={{ color: '#13c2c2', fontSize: 28 }} />,
      color: '#e6fffb',
      borderColor: '#87e8de',
      extra: `待执行 ${taskPending} 条`,
    },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      {cards.map((c, i) => (
        <Col key={i} xs={12} sm={8} md={4}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              background: c.color,
              border: `1px solid ${c.borderColor}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
            bodyStyle={{ padding: '14px 16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>
                  {c.value}
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#888', marginLeft: 2 }}>
                    {c.suffix}
                  </span>
                </div>
                {c.extra && (
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{c.extra}</div>
                )}
              </div>
              {c.icon}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// ─── Task Status Bar ─────────────────────────────────────────────────────────

const TaskStatusBar: React.FC<{ taskStats: TaskStat[] }> = ({ taskStats }) => {
  const total = taskStats.reduce((s, t) => s + Number(t.cnt), 0);
  if (total === 0) return null;

  return (
    <Card
      size="small"
      title={<span><ToolOutlined style={{ marginRight: 6 }} />任务单状态分布</span>}
      style={{ marginBottom: 20, borderRadius: 10 }}
    >
      <Row gutter={16} align="middle">
        {Object.entries(TASK_STATUS_MAP).map(([statusStr, cfg]) => {
          const status = Number(statusStr);
          const stat = taskStats.find(t => t.task_status === status);
          const cnt = stat ? Number(stat.cnt) : 0;
          const pct = total > 0 ? Math.round(cnt / total * 100) : 0;
          return (
            <Col key={status} xs={8} sm={4}>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 20, color: cfg.color, marginBottom: 2 }}>{cfg.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{cnt}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{cfg.label}</div>
                <div style={{ fontSize: 11, color: cfg.color }}>{pct}%</div>
              </div>
            </Col>
          );
        })}
        <Col xs={24} sm={0}>
          <Progress
            percent={100}
            showInfo={false}
            strokeColor={{
              '0%': '#1677ff',
              '50%': '#52c41a',
              '100%': '#faad14',
            }}
            size="small"
          />
        </Col>
      </Row>
    </Card>
  );
};

// ─── Kanban Card Grid ────────────────────────────────────────────────────────

const KanbanGrid: React.FC<{ orders: ActiveOrder[] }> = ({ orders }) => {
  if (orders.length === 0) {
    return (
      <Card style={{ marginBottom: 20, borderRadius: 10 }}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <ApartmentOutlined style={{ fontSize: 48, marginBottom: 12 }} />
          <div>暂无在制工单</div>
        </div>
      </Card>
    );
  }

  // Show top 12 as visual cards
  const displayOrders = orders.slice(0, 12);

  return (
    <div style={{ marginBottom: 20 }}>
      <Title level={5} style={{ marginBottom: 12 }}>
        <ApartmentOutlined style={{ marginRight: 6 }} />
        在制工单看板（前{displayOrders.length}张）
      </Title>
      <Row gutter={[12, 12]}>
        {displayOrders.map(order => {
          const statusCfg = WO_STATUS_MAP[order.wo_status] || { label: '未知', color: 'default' };
          const priorityCfg = PRIORITY_MAP[order.priority] || { label: '普通', color: 'blue' };
          const overdue = isOverdue(order.plan_end, order.wo_status);
          const pct = Math.min(100, Math.max(0, Number(order.progress_pct) || 0));
          const color = progressColor(pct);

          return (
            <Col key={order.wo_code} xs={24} sm={12} md={8} lg={6}>
              <Card
                size="small"
                style={{
                  borderRadius: 10,
                  border: overdue ? '1.5px solid #ff4d4f' : '1px solid #e8e8e8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  background: overdue ? '#fff2f0' : '#fff',
                  transition: 'all 0.2s',
                  cursor: 'default',
                }}
                bodyStyle={{ padding: '12px 14px' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 12, color: '#1677ff' }}>{order.wo_code}</Text>
                  <div>
                    <Tag color={priorityCfg.color} style={{ fontSize: 10, margin: 0 }}>{priorityCfg.label}</Tag>
                    {overdue && <Tag color="red" style={{ fontSize: 10, margin: '0 0 0 4px' }}>逾期</Tag>}
                  </div>
                </div>

                {/* Product Name */}
                <Tooltip title={order.product_name}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: '#1a1a1a',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 4,
                  }}>
                    {order.product_name || '-'}
                  </div>
                </Tooltip>

                {/* Batch */}
                <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
                  批号：{order.batch_no || '-'}
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginBottom: 2 }}>
                    <span>生产进度</span>
                    <span style={{ color }}>{pct}%</span>
                  </div>
                  <Progress
                    percent={pct}
                    showInfo={false}
                    size="small"
                    strokeColor={color}
                    trailColor="#f0f0f0"
                  />
                </div>

                {/* Qty */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 8 }}>
                  <span>实产 {Number(order.actual_qty).toLocaleString()} / 计划 {Number(order.plan_qty).toLocaleString()}</span>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge status={statusCfg.color as any} text={
                    <span style={{ fontSize: 11, color: '#555' }}>{statusCfg.label}</span>
                  } />
                  <Text style={{ fontSize: 10, color: '#aaa' }}>
                    截止 {fmtDate(order.plan_end)}
                  </Text>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

// ─── Full Table ──────────────────────────────────────────────────────────────

const OrderTable: React.FC<{ orders: ActiveOrder[] }> = ({ orders }) => {
  const columns: ColumnsType<ActiveOrder> = [
    {
      title: '工单号',
      dataIndex: 'wo_code',
      width: 160,
      render: (v: string) => <Text style={{ color: '#1677ff', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '产品名称',
      dataIndex: 'product_name',
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v}>
          <span style={{ fontSize: 12 }}>{v}</span>
        </Tooltip>
      ),
    },
    {
      title: '批号',
      dataIndex: 'batch_no',
      width: 130,
      render: (v: string) => <Text style={{ fontSize: 12, color: '#555' }}>{v || '-'}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'wo_status',
      width: 90,
      render: (v: number) => {
        const cfg = WO_STATUS_MAP[v] || { label: '未知', color: 'default' };
        return <Badge status={cfg.color as any} text={cfg.label} />;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (v: number) => {
        const cfg = PRIORITY_MAP[v] || { label: '普通', color: 'blue' };
        return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: '计划数量',
      dataIndex: 'plan_qty',
      width: 100,
      align: 'right',
      render: (v: number) => <span style={{ fontSize: 12 }}>{Number(v).toLocaleString()}</span>,
    },
    {
      title: '实际数量',
      dataIndex: 'actual_qty',
      width: 100,
      align: 'right',
      render: (v: number) => <span style={{ fontSize: 12 }}>{Number(v).toLocaleString()}</span>,
    },
    {
      title: '完成进度',
      dataIndex: 'progress_pct',
      width: 160,
      render: (v: number) => {
        const pct = Math.min(100, Math.max(0, Number(v) || 0));
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Progress percent={pct} size="small" showInfo={false}
              strokeColor={progressColor(pct)} style={{ flex: 1, margin: 0 }} />
            <span style={{ fontSize: 11, color: '#666', minWidth: 36 }}>{pct}%</span>
          </div>
        );
      },
    },
    {
      title: '计划开始',
      dataIndex: 'plan_start',
      width: 100,
      render: (v: string) => <span style={{ fontSize: 11, color: '#888' }}>{fmtDate(v)}</span>,
    },
    {
      title: '计划结束',
      dataIndex: 'plan_end',
      width: 100,
      render: (v: string, row: ActiveOrder) => {
        const overdue = isOverdue(v, row.wo_status);
        return (
          <span style={{ fontSize: 11, color: overdue ? '#ff4d4f' : '#888', fontWeight: overdue ? 600 : 400 }}>
            {fmtDate(v)}{overdue ? ' ⚠' : ''}
          </span>
        );
      },
    },
  ];

  return (
    <Card
      size="small"
      title={
        <span>
          <ApartmentOutlined style={{ marginRight: 6 }} />
          全部在制工单明细（共 {orders.length} 张）
        </span>
      }
      style={{ borderRadius: 10 }}
    >
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="wo_code"
        size="small"
        pagination={orders.length > 10 ? { pageSize: 10, showSizeChanger: true, showTotal: t => `共${t}条` } : false}
        scroll={{ x: 900 }}
        rowClassName={(row) => isOverdue(row.plan_end, row.wo_status) ? 'row-overdue' : ''}
      />
    </Card>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const WorkshopPageNew: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WorkshopData>({ activeOrders: [], taskStats: [] });
  const [workshopCode, setWorkshopCode] = useState('');
  const [factoryCode, setFactoryCode] = useState('NJ');
  const [lastRefresh, setLastRefresh] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const params: Record<string, string> = { factoryCode };
      if (workshopCode) params.workshopCode = workshopCode;

      const res = await axios.get('/api/dashboard/workshop', { headers, params });
      if (res.data?.code === 200) {
        setData(res.data.data as WorkshopData);
      } else {
        // If auth fails, still show empty state gracefully
        setData({ activeOrders: [], taskStats: [] });
      }
    } catch {
      setData({ activeOrders: [], taskStats: [] });
    } finally {
      setLoading(false);
      setLastRefresh(new Date().toLocaleTimeString());
    }
  }, [factoryCode, workshopCode]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, 60000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  const { activeOrders, taskStats } = data;

  return (
    <div style={{ padding: '16px 20px', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1a1a1a' }}>
            <ApartmentOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            车间执行看板
          </Title>
          <Text style={{ fontSize: 12, color: '#888' }}>
            天美健大自然生物工程 · 实时生产状态 · 自动刷新60s
            {lastRefresh && <span style={{ marginLeft: 8 }}>（最后更新：{lastRefresh}）</span>}
          </Text>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Factory Selector */}
          <Select
            value={factoryCode}
            onChange={v => setFactoryCode(v)}
            style={{ width: 130 }}
            size="small"
            options={FACTORY_OPTIONS}
          />
          {/* Workshop Selector */}
          <Select
            value={workshopCode}
            onChange={v => setWorkshopCode(v)}
            style={{ width: 180 }}
            size="small"
            options={WORKSHOP_OPTIONS}
          />
          {/* Refresh */}
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchData}
            size="small"
            type="primary"
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </div>

      <Spin spinning={loading} tip="加载看板数据...">
        {/* KPI Row */}
        <KpiRow data={data} />

        {/* Task Status Bar */}
        <TaskStatusBar taskStats={taskStats} />

        {/* Kanban Cards */}
        <KanbanGrid orders={activeOrders} />

        {/* Full Table */}
        <OrderTable orders={activeOrders} />
      </Spin>

      {/* Overdue row style */}
      <style>{`
        .row-overdue td {
          background: #fff2f0 !important;
        }
        .row-overdue:hover td {
          background: #ffe7e4 !important;
        }
      `}</style>
    </div>
  );
};

export default WorkshopPageNew;
