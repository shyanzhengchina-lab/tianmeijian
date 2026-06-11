/**
 * 生产任务单列表页 — 天美健MES v2 (真实DB数据版)
 * 数据源: /api/execution/task-orders (mes_task_order表)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Select, Space,
  Progress, Modal, message, Descriptions, Badge, Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PauseCircleOutlined, SearchOutlined, ReloadOutlined,
  EyeOutlined, UserOutlined, ToolOutlined, TeamOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const TASK_STATUS: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  1: { label: '待执行', color: '#8c8c8c', icon: <ClockCircleOutlined /> },
  2: { label: '执行中', color: '#1677ff', icon: <PlayCircleOutlined /> },
  3: { label: '待报工', color: '#fa8c16', icon: <FileTextOutlined /> },
  4: { label: '暂停中', color: '#ff4d4f', icon: <PauseCircleOutlined /> },
  5: { label: '已完成', color: '#52c41a', icon: <CheckCircleOutlined /> },
  6: { label: '已关闭', color: '#d9d9d9', icon: <CheckCircleOutlined /> },
};

interface TaskOrder {
  id: number;
  task_code: string;
  wo_id: number;
  wo_code: string;
  step_no: number;
  op_code: string;
  op_name: string;
  wc_id: number;
  plan_qty: string;
  actual_qty: string;
  scrap_qty: string;
  task_status: number;
  plan_start: string;
  plan_end: string;
  actual_start: string | null;
  actual_end: string | null;
  operator_id: number | null;
  operator_name: string | null;
  remark: string;
  // joined
  product_name?: string;
  batch_no?: string;
  wc_name?: string;
}

interface TaskOrderPageNewProps {
  onNavigate?: (page: string, params?: Record<string, unknown>) => void;
}

const TaskOrderPageNew: React.FC<TaskOrderPageNewProps> = ({ onNavigate }) => {
  const [records, setRecords] = useState<TaskOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [detailRecord, setDetailRecord] = useState<TaskOrder | null>(null);

  const token = localStorage.getItem('token') || localStorage.getItem('mes_token') || '';
  const headers = { Authorization: `Bearer ${token}` };

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, size: pageSize };
      if (statusFilter !== 'ALL') params.task_status = statusFilter;
      if (searchText) params.keyword = searchText;
      const res = await axios.get('/api/execution/task-orders', { headers, params });
      const data = res.data?.data ?? {};
      setRecords(data.list ?? []);
      setTotal(data.total ?? 0);
    } catch {
      message.error('加载任务单失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchText]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // ── KPI ──────────────────────────────────────────────────────────
  const kpiList = [
    { label: '任务单总数', value: total, color: '#1677ff' },
    { label: '执行中', value: records.filter(r => r.task_status === 2).length, color: '#fa8c16' },
    { label: '待执行', value: records.filter(r => r.task_status === 1).length, color: '#8c8c8c' },
    { label: '已完成', value: records.filter(r => r.task_status === 5).length, color: '#52c41a' },
  ];

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) +
        ' ' + new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '—';

  // ── 列定义 ────────────────────────────────────────────────────────
  const columns: ColumnsType<TaskOrder> = [
    {
      title: '任务单号',
      dataIndex: 'task_code',
      width: 150,
      render: (v, r) => (
        <Button type="link" size="small" onClick={() => setDetailRecord(r)} style={{ padding: 0, fontSize: 12 }}>
          {v}
        </Button>
      ),
    },
    {
      title: '关联工单',
      dataIndex: 'wo_code',
      width: 140,
      render: (v, r) => (
        <Tooltip title={r.product_name ?? ''}>
          <Tag color="blue" style={{ fontSize: 10, cursor: 'pointer' }}
            onClick={() => onNavigate?.('work-order')}>{v}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '工序',
      width: 130,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12 }}>
            S{r.step_no} {r.op_name}
          </div>
          <div style={{ fontSize: 10, color: '#8c8c8c' }}>{r.op_code}</div>
        </div>
      ),
    },
    {
      title: '计划/实产',
      width: 130,
      render: (_, r) => {
        const plan = parseFloat(r.plan_qty);
        const actual = parseFloat(r.actual_qty);
        const scrap = parseFloat(r.scrap_qty ?? '0');
        const pct = plan > 0 ? Math.min(100, Math.round((actual / plan) * 100)) : 0;
        return (
          <div>
            <div style={{ fontSize: 11 }}>
              <span style={{ fontWeight: 600 }}>{actual.toLocaleString()}</span>
              <span style={{ color: '#8c8c8c' }}> / {plan.toLocaleString()}</span>
              {scrap > 0 && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>废{scrap}</span>}
            </div>
            <Progress percent={pct} size="small" showInfo={false}
              strokeColor={pct === 100 ? '#52c41a' : '#1677ff'} style={{ marginBottom: 0 }} />
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'task_status',
      width: 90,
      render: v => {
        const cfg = TASK_STATUS[v] ?? { label: String(v), color: '#8c8c8c', icon: null };
        return <Tag color={cfg.color} style={{ fontWeight: 600 }}>{cfg.icon} {cfg.label}</Tag>;
      },
    },
    {
      title: '操作员',
      dataIndex: 'operator_name',
      width: 90,
      render: v => v ? (
        <span style={{ fontSize: 11 }}><UserOutlined style={{ marginRight: 4 }} />{v}</span>
      ) : <span style={{ color: '#d9d9d9' }}>未分配</span>,
    },
    {
      title: '计划时段',
      width: 150,
      render: (_, r) => {
        const isOverdue = r.plan_end && r.task_status !== 5 && new Date(r.plan_end) < new Date();
        return (
          <div style={{ fontSize: 10 }}>
            <div style={{ color: '#667085' }}>{fmtDate(r.plan_start)}</div>
            <div style={{ color: isOverdue ? '#ff4d4f' : '#667085' }}>
              {fmtDate(r.plan_end)}{isOverdue ? ' ⚠逾期' : ''}
            </div>
          </div>
        );
      },
    },
    {
      title: '操作',
      width: 80,
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailRecord(r)}>详情</Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* KPI 行 */}
      <Row gutter={10} style={{ marginBottom: 14 }}>
        {kpiList.map((kpi, i) => (
          <Col key={i} xs={12} sm={6}>
            <Card size="small" bodyStyle={{ padding: '8px 12px' }}
              style={{ borderTop: `3px solid ${kpi.color}`, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input placeholder="任务单号 / 工单号 / 工序名" prefix={<SearchOutlined />}
            value={searchText} onChange={e => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} style={{ width: 120 }}>
            <Option value="ALL">全部状态</Option>
            {Object.entries(TASK_STATUS).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={loadRecords} loading={loading}>刷新</Button>
        </Space>
      </Card>

      {/* 主表格 */}
      <Card size="small" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1000 }}
          pagination={{
            total,
            current: page,
            pageSize,
            onChange: p => setPage(p),
            showTotal: t => `共 ${t} 张任务单`,
            showSizeChanger: false,
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        title={
          <Space>
            <PlayCircleOutlined style={{ color: '#fa8c16' }} />
            <span>任务单详情 — {detailRecord?.task_code}</span>
            {detailRecord && (
              <Tag color={TASK_STATUS[detailRecord.task_status]?.color ?? 'default'}>
                {TASK_STATUS[detailRecord.task_status]?.icon}{' '}
                {TASK_STATUS[detailRecord.task_status]?.label}
              </Tag>
            )}
          </Space>
        }
        width={680}
        footer={<Button onClick={() => setDetailRecord(null)}>关闭</Button>}
      >
        {detailRecord && (
          <Descriptions size="small" bordered column={2}>
            <Descriptions.Item label="任务单号" span={2}>
              <span style={{ fontWeight: 700, color: '#1677ff' }}>{detailRecord.task_code}</span>
            </Descriptions.Item>
            <Descriptions.Item label="关联工单">{detailRecord.wo_code}</Descriptions.Item>
            <Descriptions.Item label="工序">{`S${detailRecord.step_no} ${detailRecord.op_name} (${detailRecord.op_code})`}</Descriptions.Item>
            <Descriptions.Item label="计划产量">{parseFloat(detailRecord.plan_qty).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="实际产量">
              <span style={{ fontWeight: 600, color: '#52c41a' }}>{parseFloat(detailRecord.actual_qty).toLocaleString()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="废品数量">
              {parseFloat(detailRecord.scrap_qty ?? '0') > 0
                ? <span style={{ color: '#ff4d4f' }}>{parseFloat(detailRecord.scrap_qty ?? '0').toLocaleString()}</span>
                : '0'}
            </Descriptions.Item>
            <Descriptions.Item label="操作员">{detailRecord.operator_name ?? '未分配'}</Descriptions.Item>
            <Descriptions.Item label="计划开始">{fmtDate(detailRecord.plan_start)}</Descriptions.Item>
            <Descriptions.Item label="计划结束">{fmtDate(detailRecord.plan_end)}</Descriptions.Item>
            <Descriptions.Item label="实际开始">{fmtDate(detailRecord.actual_start)}</Descriptions.Item>
            <Descriptions.Item label="实际完成">{fmtDate(detailRecord.actual_end)}</Descriptions.Item>
            <Descriptions.Item label="完成进度" span={2}>
              <Progress
                percent={parseFloat(detailRecord.plan_qty) > 0
                  ? Math.min(100, Math.round((parseFloat(detailRecord.actual_qty) / parseFloat(detailRecord.plan_qty)) * 100))
                  : 0}
                strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }}
              />
            </Descriptions.Item>
            {detailRecord.remark && (
              <Descriptions.Item label="备注" span={2}>{detailRecord.remark}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default TaskOrderPageNew;
